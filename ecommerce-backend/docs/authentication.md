# Production-Grade API Authentication (Laravel 12 + Sanctum + spatie/laravel-permission)

A step-by-step walkthrough for building token-based authentication for this
e-commerce API. You type the code; each step explains **what** you are building
and **why**, plus how to verify it.

**Stack already installed:** Laravel 12.69, `laravel/sanctum ^4.3`,
`spatie/laravel-permission ^6.25`, Pest 3. Migrations for
`personal_access_tokens` and the spatie permission tables have already run.

**What we build:**

| Area | Endpoints |
| --- | --- |
| Session | `POST /api/register`, `POST /api/login`, `POST /api/logout`, `POST /api/logout-all`, `GET /api/me` |
| Email verification | `GET /api/verify-email/{id}/{hash}`, `POST /api/email/verification-notification` |
| Password | `POST /api/forgot-password`, `POST /api/reset-password`, `PUT /api/password` |
| Roles | `customer` / `vendor` / `admin` via spatie, gated with `role:` middleware |

---

## Table of contents

1. [How the pieces fit together](#1-how-the-pieces-fit-together)
2. [Configuration & bootstrap](#2-configuration--bootstrap)
3. [Roles & permissions](#3-roles--permissions)
4. [The User model](#4-the-user-model)
5. [Form Requests](#5-form-requests)
6. [Controllers](#6-controllers)
7. [The UserResource](#7-the-userresource)
8. [Routes](#8-routes)
9. [Rate limiting & hardening](#9-rate-limiting--hardening)
10. [Email verification & password reset plumbing](#10-email-verification--password-reset-plumbing)
11. [Tests](#11-tests)
12. [End-to-end verification](#12-end-to-end-verification)
13. [Production checklist](#13-production-checklist)
14. [Next steps (out of scope here)](#14-next-steps-out-of-scope-here)

---

## 1. How the pieces fit together

### 1.1 What a Sanctum token actually is

`POST /api/login` calls `$user->createToken('mobile')`. Sanctum:

1. Generates a random 40-char string.
2. Stores a **SHA-256 hash** of it in the `personal_access_tokens` table, along
   with the `tokenable_type` / `tokenable_id` morph (pointing at the user), a
   `name`, an `abilities` JSON array, and optional `expires_at`.
3. Returns `NewAccessToken`, whose `plainTextToken` looks like `12|AbCdEf...`.
   **This is the only time you ever see the plaintext** — the client stores it.

On later requests the client sends `Authorization: Bearer 12|AbCdEf...`. The
`auth:sanctum` guard splits off the ID (`12`), looks up that row, hashes the rest
of the string, and `hash_equals()`-compares it to the stored hash. Match →
`$request->user()` is the tokenable model, and `last_used_at` is bumped.

Because the secret is only stored hashed, a database leak does not expose usable
tokens. Because each token is a row, you can revoke one device without touching
the others (`$token->delete()`), or nuke all of them (`$user->tokens()->delete()`).

### 1.2 Why token auth (not SPA cookie auth) for this API

Sanctum has two modes:

- **SPA / cookie mode** — first-party JavaScript app on a domain you control.
  The browser holds an `httpOnly` session cookie + an `XSRF-TOKEN` cookie; every
  mutating request must echo the CSRF token. No token in JS. Configured via
  `SANCTUM_STATEFUL_DOMAINS` and `->withMiddleware(fn ($m) => $m->statefulApi())`.
- **Token mode** — the client explicitly sends `Authorization: Bearer`. Works
  from any origin, any platform (mobile, server-to-server, a web SPA on a
  different domain), no CSRF handshake.

An e-commerce backend usually serves a storefront **and** a vendor dashboard
**and** eventually a mobile app. Token mode covers all of them with one flow, so
that is what this guide uses. If you later add a first-party Next.js storefront on
a domain you own and want `httpOnly` cookies, you can enable SPA mode *alongside*
token mode — they coexist.

### 1.3 One User model, three roles

`Vendor` is a **profile** attached to a `User` (`vendors.user_id`) with an
approval workflow — it is not something you log in as. So we do **not** create
separate `Admin` / `Customer` / `Vendor` authenticatable models and guards.
Instead:

- Everyone is a `User` and logs in through the same endpoint.
- `spatie/laravel-permission` assigns each user one (or more) of
  `customer` / `vendor` / `admin`.
- Route groups gate access with `role:admin`, `role:vendor`, etc.
- Per-record checks ("can this vendor edit *this* product?") live in **Policies**.
- Token **abilities** scope what a given token can do (e.g. a read-only token).

### 1.4 Guards

`config/auth.php` keeps its default `web` guard (session driver, `users`
provider). `auth:sanctum` does **not** need a dedicated guard entry — Sanctum's
`guard()` implementation reuses the `web` provider to load the user behind a
token. We will add an explicit `api` guard entry anyway, because it makes
`auth:api` and IDE tooling behave predictably and documents intent.

---

## 2. Configuration & bootstrap

### 2.1 Environment variables

Add to **`.env`** and **`.env.example`** (keep `.env.example` value-free / safe):

```dotenv
# --- Auth ---
AUTH_GUARD=web
FRONTEND_URL=http://localhost:3000

# Sanctum
SANCTUM_TOKEN_PREFIX=ecom_
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:8000

# Seeded admin (used by DatabaseSeeder)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password
```

- **`SANCTUM_TOKEN_PREFIX`** — every issued token starts with this string.
  GitHub/GitLab secret scanners can then detect a leaked token in a commit. Pick
  something unique-ish to your app.
- **`FRONTEND_URL`** — where verification / password-reset links point (the API
  does not render HTML; the SPA does).

### 2.2 Token expiration

`config/sanctum.php`:

```php
'expiration' => 60 * 24 * 7, // minutes → 7 days
```

`null` (the current value) means tokens never expire. A finite lifetime limits
the damage window if a token leaks. Expired rows are not auto-deleted — schedule
pruning (see [§9.5](#95-schedule-token-pruning)).

### 2.3 The `api` guard

`config/auth.php` → `guards` array:

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],

    'api' => [
        'driver' => 'sanctum',
        'provider' => 'users',
    ],
],
```

And tighten the password broker while you are here (`passwords.users`):

```php
'passwords' => [
    'users' => [
        'provider' => 'users',
        'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
        'expire' => 15,   // reset link valid for 15 minutes
        'throttle' => 60, // one reset request per minute per user
    ],
],
```

### 2.4 Middleware aliases + JSON errors — `bootstrap/app.php`

Laravel 12 has no `Kernel.php`; middleware and exception rendering are configured
in `bootstrap/app.php`. Replace the two empty closures:

```php
<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ThrottleRequestsException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Always answer API routes with JSON, never an HTML error page or redirect.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request, Throwable $e) => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });

        $exceptions->render(function (UnauthorizedException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'This action is unauthorized.'], 403);
            }
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => $e->getMessage() ?: 'This action is unauthorized.'], 403);
            }
        });

        $exceptions->render(function (ModelNotFoundException|NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Resource not found.'], 404);
            }
        });

        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Too many requests. Please slow down.'], 429);
            }
        });
        // ValidationException already renders as 422 JSON on API routes — no handler needed.
    })->create();
```

Why: consumers of an API should never receive a 302 redirect to `/login` or an
HTML stack trace. `shouldRenderJsonWhen` guarantees a predictable envelope.

> **spatie middleware note:** with `laravel/permission` v6 on Laravel 11+, the
> `role` / `permission` aliases are **not** auto-registered — the block above is
> required, otherwise `->middleware('role:admin')` throws
> "Target class [role] does not exist".

### 2.5 CORS

Publish the config and lock the origins:

```bash
php artisan config:publish cors
```

`config/cors.php`:

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter([env('FRONTEND_URL')]),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false, // true only if you also use SPA cookie mode
];
```

Pure token auth does not use cookies, so `supports_credentials` stays `false`.
Never ship `allowed_origins => ['*']` for an authenticated API.

---

## 3. Roles & permissions

### 3.1 Seeder

```bash
php artisan make:seeder RolesAndPermissionsSeeder
```

`database/seeders/RolesAndPermissionsSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Permissions (extend as the app grows).
        $permissions = [
            'manage own shop',
            'manage own products',
            'view own orders',
            'approve vendors',
            'manage users',
            'manage catalog',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $customer = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $vendor   = Role::firstOrCreate(['name' => 'vendor', 'guard_name' => 'web']);
        $admin    = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $vendor->syncPermissions([
            'manage own shop',
            'manage own products',
            'view own orders',
        ]);

        $admin->syncPermissions(Permission::all());

        // 'customer' needs no explicit permissions — customer-facing routes are
        // gated by authentication + ownership policies, not permissions.
    }
}
```

- **`guard_name` must be `web`** — it has to match the guard that ultimately
  loads the user. Sanctum resolves users through the `web` provider, and
  `$user->hasRole('admin')` compares against the model's `getDefaultGuardName()`,
  which is `web` here. A role created with `guard_name => 'sanctum'` would
  silently never match.
- **`forgetCachedPermissions()`** — spatie caches the whole permission table for
  24h. Always flush it when seeding or the freshly created roles won't be visible
  until the cache expires.

### 3.2 Wire it into `DatabaseSeeder`

```php
public function run(): void
{
    $this->call(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create([
        'name' => 'Admin',
        'email' => env('ADMIN_EMAIL', 'admin@example.com'),
        'password' => bcrypt(env('ADMIN_PASSWORD', 'password')),
        'email_verified_at' => now(),
    ]);
    $admin->assignRole('admin');
}
```

### 3.3 When does someone become a `vendor`?

On registration everyone gets `customer` (see [§6.1](#61-register)). A user
becomes a `vendor` when an admin **approves** their `Vendor` record. Add this to
your existing vendor-approval code (not built in this guide):

```php
$vendor->user->syncRoles(['vendor']); // or assignRole if they keep 'customer' too
```

---

## 4. The User model

`app/Models/User.php`:

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function vendors()
    {
        return $this->hasMany(Vendor::class);
    }

    /**
     * Token abilities to grant based on the user's role.
     * '*' = every ability. Scope down for read-only or partner tokens.
     */
    public function tokenAbilities(): array
    {
        return match (true) {
            $this->hasRole('admin') => ['*'],
            $this->hasRole('vendor') => ['shop:manage', 'products:manage', 'orders:view'],
            default => ['orders:view', 'cart:manage', 'profile:manage'],
        };
    }
}
```

- **`implements MustVerifyEmail`** activates the `verified` middleware and makes
  `event(new Registered($user))` send a verification email.
- **`password => 'hashed'` cast** means `User::create(['password' => 'plain'])`
  hashes automatically — never call `bcrypt()` yourself in the register flow.
- `HasApiTokens` was already there; `HasRoles` is the new trait.

---

## 5. Form Requests

```bash
php artisan make:request Auth/RegisterRequest
php artisan make:request Auth/LoginRequest
php artisan make:request Auth/ForgotPasswordRequest
php artisan make:request Auth/ResetPasswordRequest
php artisan make:request Auth/ChangePasswordRequest
```

Form Requests keep validation out of controllers, make each rule set reusable and
independently testable, and run **before** the controller — an invalid payload
never reaches your logic. `authorize()` returns `true` for the public ones
because anyone may attempt to register or log in.

**`app/Http/Requests/Auth/RegisterRequest.php`:**

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ];
    }
}
```

**`LoginRequest.php`** — also owns the throttling, so a locked-out attacker never
touches the database:

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ];
    }

    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => "Too many login attempts. Try again in {$seconds} seconds.",
        ])->status(429);
    }
}
```

**`ForgotPasswordRequest.php`:**

```php
public function rules(): array
{
    return [
        'email' => ['required', 'string', 'email'],
    ];
}
```

**`ResetPasswordRequest.php`:**

```php
use Illuminate\Validation\Rules\Password;

public function rules(): array
{
    return [
        'token' => ['required', 'string'],
        'email' => ['required', 'string', 'email'],
        'password' => ['required', 'confirmed', Password::defaults()],
    ];
}
```

**`ChangePasswordRequest.php`** (authenticated — `authorize()` can stay `true`
since the route is behind `auth:sanctum`):

```php
use Illuminate\Validation\Rules\Password;

public function rules(): array
{
    return [
        'current_password' => ['required', 'string', 'current_password'],
        'password' => ['required', 'confirmed', 'different:current_password', Password::defaults()],
    ];
}
```

`current_password` is a built-in rule that checks the value against the
logged-in user's hash.

**Set the global password policy** in `app/Providers/AppServiceProvider.php`
`boot()`:

```php
use Illuminate\Validation\Rules\Password;

Password::defaults(fn () => Password::min(8)
    ->letters()
    ->mixedCase()
    ->numbers()
    ->uncompromised() // rejects passwords found in known breaches (k-anonymity API)
);
```

---

## 6. Controllers

```bash
php artisan make:controller Api/Auth/RegisteredUserController
php artisan make:controller Api/Auth/AuthenticatedSessionController
php artisan make:controller Api/Auth/EmailVerificationController
php artisan make:controller Api/Auth/PasswordResetLinkController
php artisan make:controller Api/Auth/NewPasswordController
php artisan make:controller Api/Auth/PasswordController
php artisan make:controller Api/Auth/ProfileController
```

### 6.1 Register

`app/Http/Controllers/Api/Auth/RegisteredUserController.php`:

```php
<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;

class RegisteredUserController extends Controller
{
    public function store(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->safe()->only('name', 'email', 'password'));
        $user->assignRole('customer');

        event(new Registered($user)); // queues the verification email

        $token = $user->createToken(
            $request->string('device_name', 'api')->value(),
            $user->tokenAbilities(),
        )->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }
}
```

Why `$request->safe()->only(...)`: even though the Form Request validated the
input, you still hand the model an explicit allow-list — validation is not
authorization and not mass-assignment protection.

### 6.2 Login / logout

`AuthenticatedSessionController.php`:

```php
<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    public function store(LoginRequest $request): JsonResponse
    {
        $request->ensureIsNotRateLimited();

        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            RateLimiter::hit($request->throttleKey());

            // Generic message — do not reveal whether the email exists.
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        RateLimiter::clear($request->throttleKey());

        $token = $user->createToken(
            $request->string('device_name', 'api')->value(),
            $user->tokenAbilities(),
        )->plainTextToken;

        return response()->json([
            'user' => new UserResource($user->load('roles')),
            'token' => $token,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        // Revoke only the token used for this request → logs out this device.
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function destroyAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete(); // every device

        return response()->json(['message' => 'Logged out from all devices.']);
    }
}
```

### 6.3 Email verification

`EmailVerificationController.php`:

```php
<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    /**
     * Hit by the SPA after the user clicks the signed link in their email.
     * Route is 'signed' middleware protected, so tampering fails before we run.
     */
    public function verify(Request $request, string $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return response()->json(['message' => 'Email verified.']);
    }

    /**
     * Authenticated user asks for a new verification email.
     */
    public function resend(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }
}
```

### 6.4 Password reset

`PasswordResetLinkController.php`:

```php
<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

class PasswordResetLinkController extends Controller
{
    public function store(ForgotPasswordRequest $request): JsonResponse
    {
        // Password::sendResetLink throttles per user (config/auth.php).
        Password::sendResetLink($request->only('email'));

        // Always the same response, regardless of whether the email exists.
        return response()->json([
            'message' => 'If that email is registered, a reset link has been sent.',
        ]);
    }
}
```

`NewPasswordController.php`:

```php
<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class NewPasswordController extends Controller
{
    public function store(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) {
                $user->forceFill([
                    'password' => $request->string('password'),
                    'remember_token' => Str::random(60),
                ])->save();

                // Security: a password change invalidates every existing token.
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['message' => 'Password reset successful.']);
    }
}
```

### 6.5 Change password (authenticated)

`PasswordController.php`:

```php
<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use Illuminate\Http\JsonResponse;

class PasswordController extends Controller
{
    public function update(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        $user->update(['password' => $request->string('password')]);

        // Keep the current device signed in; kick every other device.
        $user->tokens()
            ->where('id', '!=', $user->currentAccessToken()->id)
            ->delete();

        return response()->json(['message' => 'Password updated.']);
    }
}
```

### 6.6 Me

`ProfileController.php`:

```php
<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResource
    {
        return new UserResource($request->user()->load('roles'));
    }
}
```

---

## 7. The UserResource

```bash
php artisan make:resource UserResource
```

`app/Http/Resources/UserResource.php`:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified' => $this->email_verified_at !== null,
            'roles' => $this->whenLoaded('roles', fn () => $this->getRoleNames()),
            'permissions' => $this->when(
                $request->user()?->is($this->resource),
                fn () => $this->getAllPermissions()->pluck('name'),
            ),
            'created_at' => $this->created_at,
        ];
    }
}
```

A Resource is the single place that decides what leaves your API. It never leaks
`password` or `remember_token` (also `$hidden`, but defense in depth), and it
keeps the response shape stable if the table changes.

---

## 8. Routes

`routes/api.php`:

```php
<?php

use App\Http\Controllers\Api\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\Auth\EmailVerificationController;
use App\Http\Controllers\Api\Auth\NewPasswordController;
use App\Http\Controllers\Api\Auth\PasswordController;
use App\Http\Controllers\Api\Auth\PasswordResetLinkController;
use App\Http\Controllers\Api\Auth\ProfileController;
use App\Http\Controllers\Api\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public auth routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [RegisteredUserController::class, 'store'])
    ->middleware('throttle:register')
    ->name('register');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:login')
    ->name('login');

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->middleware('throttle:password-email')
    ->name('password.email');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->middleware('throttle:password-email')
    ->name('password.store');

Route::get('/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:verification'])
    ->name('verification.verify');

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [ProfileController::class, 'show'])->name('me');

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::post('/logout-all', [AuthenticatedSessionController::class, 'destroyAll'])->name('logout.all');

    Route::put('/password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:verification')
        ->name('verification.send');

    /*
    | Routes that require a verified email address.
    */
    Route::middleware('verified')->group(function () {
        // Example: only verified users can check out.
        // Route::post('/checkout', CheckoutController::class);
    });

    /*
    | Role-gated areas.
    */
    Route::middleware('role:vendor')->prefix('vendor')->group(function () {
        // Route::apiResource('products', VendorProductController::class);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // Route::apiResource('users', AdminUserController::class);
        // Route::post('vendors/{vendor}/approve', [VendorApprovalController::class, 'store']);
    });
});
```

Notes:

- The verification link route uses `signed` — Laravel's built-in middleware that
  rejects any URL whose signature does not match (tampered `id`, `hash`, or
  `expires`). No auth needed: the signature *is* the proof.
- `role:vendor` / `role:admin` come from the aliases registered in
  [§2.4](#24-middleware-aliases--json-errors--bootstrapappphp).
- Delete the default `/user` and `/test` routes that came with the skeleton.

---

## 9. Rate limiting & hardening

### 9.1 Named limiters

`app/Providers/AppServiceProvider.php` `boot()`:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

RateLimiter::for('login', fn (Request $r) => Limit::perMinute(5)->by(
    Str::transliterate(Str::lower($r->input('email')).'|'.$r->ip())
));

RateLimiter::for('register', fn (Request $r) => Limit::perMinute(3)->by($r->ip()));

RateLimiter::for('password-email', fn (Request $r) => [
    Limit::perMinute(2)->by(Str::lower($r->input('email')).'|'.$r->ip()),
    Limit::perMinute(5)->by($r->ip()),
]);

RateLimiter::for('verification', fn (Request $r) => Limit::perMinute(6)->by(
    optional($r->user())->id ?: $r->ip()
));
```

Key choice matters: keying login purely by IP punishes everyone behind a
corporate NAT; keying purely by email lets an attacker lock a victim out. The
composite `email|ip` is the usual compromise. `password-email` uses a **stacked**
limit — both the per-account and the per-IP limit must pass.

### 9.2 Token abilities in practice

Issue scoped tokens (already wired via `tokenAbilities()`), then enforce per
route or in code:

```php
// Route level:
Route::post('/vendor/products', [VendorProductController::class, 'store'])
    ->middleware(['auth:sanctum', 'ability:products:manage']);

// Or in a controller / policy:
if (! $request->user()->tokenCan('products:manage')) {
    abort(403);
}
```

`ability` / `abilities` middleware ship with Sanctum — no alias needed.

### 9.3 No user enumeration

Login, forgot-password, and resend-verification all return the **same** response
whether or not the address exists. Registration is the one place an attacker can
still probe (`unique:users` → 422); accept that, and rely on the `register`
throttle.

### 9.4 Enforce verified email where it matters

Do not block *login* on unverified email (users need to log in to resend the
link). Block the actions that need trust — checkout, becoming a vendor, leaving
reviews — with the `verified` middleware group.

### 9.5 Schedule token pruning

`routes/console.php`:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

Deletes `personal_access_tokens` rows that expired more than 24h ago. Requires a
running scheduler (`php artisan schedule:work` in dev, a cron entry in prod).

---

## 10. Email verification & password reset plumbing

### 10.1 Point notification links at the SPA

The API has no `/verify-email` web page — the SPA does. Override the URLs in
`AppServiceProvider::boot()`:

```php
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;

VerifyEmail::createUrlUsing(function ($notifiable) {
    $signed = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        [
            'id' => $notifiable->getKey(),
            'hash' => sha1($notifiable->getEmailForVerification()),
        ],
    );

    // Hand the SPA the signed API URL to call.
    return config('app.frontend_url').'/verify-email?url='.urlencode($signed);
});

ResetPassword::createUrlUsing(fn ($notifiable, string $token) =>
    config('app.frontend_url')."/reset-password?token={$token}&email=".urlencode($notifiable->getEmailForPasswordReset())
);
```

Add to `config/app.php`:

```php
'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
```

Flow: user clicks the SPA link → SPA reads `url` / `token` from the query string
→ SPA calls the API (`GET` the signed URL, or `POST /api/reset-password`) → API
responds JSON → SPA shows success.

### 10.2 Queue the emails

`config/queue.php` default is already `database`. Make the notifications async so
registration/login responses are instant. Create custom notification classes only
if you need to (`php artisan make:notification`), or simply run a worker — the
framework notifications are queued when the `User` implements `ShouldQueue`-aware
sending. Simplest: keep defaults and run `php artisan queue:work` (dev:
`composer dev` already starts a `queue:listen`).

### 10.3 Mail in local dev

`.env` has `MAIL_MAILER=log` — verification/reset emails land in
`storage/logs/laravel.log`. Copy the signed URL from there to test manually, or
switch to Mailpit/Mailtrap.

---

## 11. Tests

### 11.1 Enable the database refresh

`tests/Pest.php`:

```php
pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature');
```

Seed roles for every feature test. Add to `tests/Pest.php`:

```php
function seedRoles(): void
{
    Illuminate\Support\Facades\Artisan::call('db:seed', [
        '--class' => Database\Seeders\RolesAndPermissionsSeeder::class,
    ]);
}
```

…and call `seedRoles()` in a `beforeEach()` inside `tests/Feature/Auth/` files,
or register a `pest()->beforeEach(fn () => seedRoles())->in('Feature/Auth')`.

### 11.2 Registration — `tests/Feature/Auth/RegistrationTest.php`

```php
<?php

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;

beforeEach(fn () => seedRoles());

it('registers a user, assigns customer role, returns a token', function () {
    Event::fake();

    $response = $this->postJson('/api/register', [
        'name' => 'Jane',
        'email' => 'jane@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['user' => ['id', 'email', 'roles'], 'token']);

    $user = User::firstWhere('email', 'jane@example.com');
    expect($user)->not->toBeNull()
        ->and($user->hasRole('customer'))->toBeTrue()
        ->and($user->tokens()->count())->toBe(1);

    Event::assertDispatched(Registered::class);
});

it('rejects an empty payload', function () {
    $this->postJson('/api/register', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

it('rejects a duplicate email', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/register', [
        'name' => 'X',
        'email' => 'taken@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ])->assertJsonValidationErrors('email');
});
```

### 11.3 Login — `tests/Feature/Auth/LoginTest.php`

```php
<?php

use App\Models\User;

beforeEach(fn () => seedRoles());

it('issues a token for valid credentials', function () {
    User::factory()->create(['email' => 'a@example.com', 'password' => 'Password1!']);

    $this->postJson('/api/login', ['email' => 'a@example.com', 'password' => 'Password1!'])
        ->assertOk()
        ->assertJsonStructure(['user', 'token']);
});

it('returns a generic error for a wrong password', function () {
    User::factory()->create(['email' => 'a@example.com', 'password' => 'Password1!']);

    $this->postJson('/api/login', ['email' => 'a@example.com', 'password' => 'nope'])
        ->assertStatus(422)
        ->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
});

it('does not reveal whether an unknown email exists', function () {
    $this->postJson('/api/login', ['email' => 'ghost@example.com', 'password' => 'whatever'])
        ->assertStatus(422)
        ->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
});

it('locks out after 5 failed attempts', function () {
    User::factory()->create(['email' => 'a@example.com', 'password' => 'Password1!']);

    foreach (range(1, 5) as $i) {
        $this->postJson('/api/login', ['email' => 'a@example.com', 'password' => 'wrong']);
    }

    $this->postJson('/api/login', ['email' => 'a@example.com', 'password' => 'Password1!'])
        ->assertStatus(429);
});
```

### 11.4 Session lifecycle — `tests/Feature/Auth/SessionTest.php`

```php
<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(fn () => seedRoles());

it('requires a token for /me', function () {
    $this->getJson('/api/me')->assertUnauthorized(); // 401, not a redirect
});

it('returns the current user for a valid token', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this->getJson('/api/me')->assertOk()->assertJsonPath('data.id', $user->id);
});

it('logout revokes only the current token', function () {
    $user = User::factory()->create();
    $a = $user->createToken('a')->plainTextToken;
    $user->createToken('b');

    $this->withToken($a)->postJson('/api/logout')->assertOk();

    expect($user->fresh()->tokens()->count())->toBe(1); // 'b' survives
});

it('logout-all revokes every token', function () {
    $user = User::factory()->create();
    $a = $user->createToken('a')->plainTextToken;
    $user->createToken('b');

    $this->withToken($a)->postJson('/api/logout-all')->assertOk();

    expect($user->fresh()->tokens()->count())->toBe(0);
});
```

### 11.5 Email verification — `tests/Feature/Auth/EmailVerificationTest.php`

```php
<?php

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;

beforeEach(fn () => seedRoles());

it('verifies the email from a valid signed link', function () {
    Event::fake();
    $user = User::factory()->unverified()->create();

    $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
        'id' => $user->id,
        'hash' => sha1($user->email),
    ]);

    $this->getJson($url)->assertOk();

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    Event::assertDispatched(Verified::class);
});

it('rejects a tampered link', function () {
    $user = User::factory()->unverified()->create();

    $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
        'id' => $user->id,
        'hash' => sha1('wrong@example.com'),
    ]);

    // Signature itself is valid, but the hash check in the controller fails.
    $this->getJson($url)->assertStatus(403);
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('blocks verified-only routes for unverified users', function () {
    // add a temporary test route under ->middleware(['auth:sanctum','verified'])
    // then assert 409 / 403 here for an unverified user.
})->skip('enable once a verified-only route exists');
```

### 11.6 Password reset — `tests/Feature/Auth/PasswordResetTest.php`

```php
<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

beforeEach(fn () => seedRoles());

it('sends a reset link', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

    Notification::assertSentTo($user, ResetPassword::class);
});

it('gives the same response for an unknown email', function () {
    Notification::fake();

    $this->postJson('/api/forgot-password', ['email' => 'ghost@example.com'])
        ->assertOk()
        ->assertJsonPath('message', 'If that email is registered, a reset link has been sent.');

    Notification::assertNothingSent();
});

it('resets the password and revokes existing tokens', function () {
    $user = User::factory()->create();
    $user->createToken('old');
    $token = Password::createToken($user);

    $this->postJson('/api/reset-password', [
        'token' => $token,
        'email' => $user->email,
        'password' => 'NewPassword1!',
        'password_confirmation' => 'NewPassword1!',
    ])->assertOk();

    expect($user->fresh()->tokens()->count())->toBe(0);

    $this->postJson('/api/login', ['email' => $user->email, 'password' => 'NewPassword1!'])
        ->assertOk();
});
```

### 11.7 Authorization matrix — `tests/Feature/Auth/RoleAccessTest.php`

```php
<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    seedRoles();

    // Minimal route only for this test file:
    Route::middleware(['auth:sanctum', 'role:admin'])
        ->get('/api/_test/admin-only', fn () => response()->json(['ok' => true]));
});

it('lets an admin through', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Sanctum::actingAs($admin);

    $this->getJson('/api/_test/admin-only')->assertOk();
});

it('blocks a customer', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');
    Sanctum::actingAs($customer);

    $this->getJson('/api/_test/admin-only')->assertStatus(403);
});

it('blocks an unauthenticated request', function () {
    $this->getJson('/api/_test/admin-only')->assertUnauthorized();
});
```

> For real ownership checks ("vendor edits *their own* product") write a
> **Policy** and test the policy directly for the full matrix, plus **one** HTTP
> test proving the endpoint calls `authorize()`. Prefer returning `404` over
> `403` for another vendor's record so you don't confirm it exists.

Run:

```bash
php artisan test --filter=Auth
```

---

## 12. End-to-end verification

```bash
php artisan migrate:fresh --seed
php artisan serve   # terminal 1
php artisan queue:work   # terminal 2 (sends the emails)
```

```bash
BASE=http://127.0.0.1:8000/api

# 1. Register
curl -sS -X POST $BASE/register -H 'Accept: application/json' \
  -d 'name=Jane' -d 'email=jane@example.com' \
  -d 'password=Password1!' -d 'password_confirmation=Password1!' | tee /tmp/reg.json

TOKEN=$(php -r 'echo json_decode(file_get_contents("/tmp/reg.json"))->token;')

# 2. Me
curl -sS $BASE/me -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json'

# 3. Verification email → check storage/logs/laravel.log, copy the signed URL, then:
curl -sS "<paste-signed-url>" -H 'Accept: application/json'

# 4. Login (new token)
curl -sS -X POST $BASE/login -H 'Accept: application/json' \
  -d 'email=jane@example.com' -d 'password=Password1!'

# 5. Change password
curl -sS -X PUT $BASE/password -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json' \
  -d 'current_password=Password1!' -d 'password=Password2!' -d 'password_confirmation=Password2!'

# 6. Forgot password
curl -sS -X POST $BASE/forgot-password -H 'Accept: application/json' -d 'email=jane@example.com'

# 7. Logout
curl -sS -X POST $BASE/logout -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json'
```

Then:

```bash
php artisan test
./vendor/bin/pint --dirty   # format only what you changed
```

---

## 13. Production checklist

- [ ] `APP_DEBUG=false`, `APP_ENV=production`
- [ ] HTTPS enforced (`URL::forceScheme('https')` behind a proxy, or web-server level)
- [ ] `BCRYPT_ROUNDS=12` (already the `.env.example` default)
- [ ] `SANCTUM_TOKEN_PREFIX` set to a distinctive value
- [ ] `config/sanctum.php` `expiration` finite + `sanctum:prune-expired` scheduled
- [ ] `config/cors.php` `allowed_origins` = your real frontend domain(s), never `*`
- [ ] Named rate limiters applied to every auth route (`throttle:login` etc.)
- [ ] `Password::defaults()` includes `->uncompromised()`
- [ ] Email verification enforced on trust-sensitive actions (`verified` middleware)
- [ ] A queue worker (Horizon or `queue:work` via Supervisor) is running for mail
- [ ] Failed logins logged (listen for `Illuminate\Auth\Events\Failed` / `Lockout`)
- [ ] `composer audit` in CI
- [ ] `php artisan config:cache route:cache` in the deploy pipeline
- [ ] Secrets only in `.env` / a secret manager — never committed

---

## 14. Next steps (out of scope here)

| Want | Reach for |
| --- | --- |
| TOTP / SMS two-factor | `laravel/fortify` (it exposes 2FA endpoints you can call from the API) |
| "Login with Google/Facebook" | `laravel/socialite` → exchange the provider token, then `createToken()` |
| Full OAuth2 authorization server (you issue tokens to *third-party* apps) | `laravel/passport` instead of Sanctum |
| Refresh-token rotation / short access + long refresh | custom: issue two tokens with different abilities + expiries, add a `/refresh` route |
| Per-user device/session management UI | expose `personal_access_tokens` (name, `last_used_at`) via a `/tokens` resource + delete |
| Impersonation ("admin logs in as customer") | a signed, audited, time-boxed impersonation token with a distinct ability |
