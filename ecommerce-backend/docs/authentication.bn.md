# প্রোডাকশন-গ্রেড API Authentication (Laravel 12 + Sanctum + spatie/laravel-permission)

এই e-commerce API-এর জন্য token-based authentication বানানোর ধাপে ধাপে গাইড।
কোড আপনি নিজে টাইপ করবেন; প্রতিটি ধাপে বলা আছে **কী** বানাচ্ছেন এবং **কেন**, সাথে
কীভাবে যাচাই করবেন।

**যে stack আগে থেকেই ইনস্টল করা আছে:** Laravel 12.69, `laravel/sanctum ^4.3`,
`spatie/laravel-permission ^6.25`, Pest 3। `personal_access_tokens` আর spatie
permission table-গুলোর migration আগেই run হয়ে গেছে।

**আমরা যা বানাবো:**

| এলাকা | Endpoints |
| --- | --- |
| Session | `POST /api/register`, `POST /api/login`, `POST /api/logout`, `POST /api/logout-all`, `GET /api/me` |
| Email verification | `GET /api/verify-email/{id}/{hash}`, `POST /api/email/verification-notification` |
| Password | `POST /api/forgot-password`, `POST /api/reset-password`, `PUT /api/password` |
| Roles | spatie দিয়ে `customer` / `vendor` / `admin`, `role:` middleware দিয়ে gate করা |

> এটি [`authentication.md`](authentication.md) (ইংরেজি) এর বাংলা সংস্করণ। কোড
> ব্লকগুলো ইংরেজিতেই রাখা হয়েছে; ব্যাখ্যা বাংলায়।

---

## সূচিপত্র

1. [পুরো জিনিসটা কীভাবে একসাথে কাজ করে](#১-পুরো-জিনিসটা-কীভাবে-একসাথে-কাজ-করে)
2. [Configuration ও bootstrap](#২-configuration-ও-bootstrap)
3. [Roles ও permissions](#৩-roles-ও-permissions)
4. [User model](#৪-user-model)
5. [Form Requests](#৫-form-requests)
6. [Controllers](#৬-controllers)
7. [UserResource](#৭-userresource)
8. [Routes](#৮-routes)
9. [Rate limiting ও hardening](#৯-rate-limiting-ও-hardening)
10. [Email verification ও password reset-এর plumbing](#১০-email-verification-ও-password-reset-এর-plumbing)
11. [Tests](#১১-tests)
12. [End-to-end যাচাই](#১২-end-to-end-যাচাই)
13. [Production checklist](#১৩-production-checklist)
14. [পরের ধাপ (এই গাইডের বাইরে)](#১৪-পরের-ধাপ-এই-গাইডের-বাইরে)

---

## ১. পুরো জিনিসটা কীভাবে একসাথে কাজ করে

### ১.১ Sanctum token আসলে কী

`POST /api/login` এর ভেতরে `$user->createToken('mobile')` কল হয়। Sanctum তখন:

1. একটা random ৪০-অক্ষরের string তৈরি করে।
2. সেটার **SHA-256 hash** `personal_access_tokens` table-এ রাখে, সাথে থাকে
   `tokenable_type` / `tokenable_id` morph (user-কে point করে), একটা `name`,
   একটা `abilities` JSON array, আর optional `expires_at`।
3. `NewAccessToken` return করে, যার `plainTextToken` দেখতে হয় `12|AbCdEf...`।
   **এই plaintext আপনি জীবনে একবারই দেখবেন** — client সেটা store করে রাখে।

পরের request-গুলোতে client পাঠায় `Authorization: Bearer 12|AbCdEf...`।
`auth:sanctum` guard তখন ID অংশটা (`12`) আলাদা করে, সেই row খুঁজে বের করে,
বাকি string-এর hash করে, আর stored hash-এর সাথে `hash_equals()` দিয়ে মেলায়।
মিলে গেলে → `$request->user()` হলো ওই tokenable model, আর `last_used_at`
আপডেট হয়।

যেহেতু secret শুধু hash আকারে রাখা, database leak হলেও ব্যবহারযোগ্য token বেরিয়ে
যায় না। যেহেতু প্রতিটা token একটা করে row, আপনি একটা device-এর token বাতিল করতে
পারেন বাকিগুলোতে হাত না দিয়ে (`$token->delete()`), অথবা সব একসাথে মুছে ফেলতে
পারেন (`$user->tokens()->delete()`)।

### ১.২ এই API-এর জন্য কেন token auth (SPA cookie auth নয়)

Sanctum-এর দুটো mode আছে:

- **SPA / cookie mode** — আপনার নিজের domain-এ চলা first-party JavaScript app।
  Browser একটা `httpOnly` session cookie + একটা `XSRF-TOKEN` cookie রাখে; প্রতিটা
  mutating request-এ CSRF token echo করতে হয়। JS-এ কোনো token থাকে না।
  `SANCTUM_STATEFUL_DOMAINS` আর `->withMiddleware(fn ($m) => $m->statefulApi())`
  দিয়ে configure হয়।
- **Token mode** — client স্পষ্টভাবে `Authorization: Bearer` পাঠায়। যেকোনো origin,
  যেকোনো platform (mobile, server-to-server, অন্য domain-এ থাকা web SPA) থেকে
  কাজ করে, কোনো CSRF handshake লাগে না।

একটা e-commerce backend সাধারণত storefront **এবং** vendor dashboard **এবং**
পরে একটা mobile app — সবাইকেই serve করে। Token mode একটা flow দিয়ে সবগুলো
কভার করে, তাই এই গাইডে সেটাই ব্যবহার করা হয়েছে। পরে যদি নিজের domain-এ একটা
first-party Next.js storefront যোগ করেন আর `httpOnly` cookie চান, তখন token
mode-এর *পাশাপাশি* SPA mode চালু করতে পারবেন — দুটো একসাথে চলে।

### ১.৩ একটা User model, তিনটা role

`Vendor` হলো একটা **profile** যেটা একটা `User`-এর সাথে যুক্ত (`vendors.user_id`)
এবং এর একটা approval workflow আছে — এটা এমন কিছু নয় যেটা দিয়ে আপনি login করেন।
তাই আমরা আলাদা `Admin` / `Customer` / `Vendor` authenticatable model আর guard
বানাবো **না**। বরং:

- সবাই একটা `User` এবং একই endpoint দিয়ে login করে।
- `spatie/laravel-permission` প্রতিটা user-কে `customer` / `vendor` / `admin`
  এর একটা (বা একাধিক) role দেয়।
- Route group-গুলো `role:admin`, `role:vendor` ইত্যাদি দিয়ে access gate করে।
- Per-record check ("এই vendor কি *এই* product edit করতে পারবে?") থাকে
  **Policy**-তে।
- Token **abilities** দিয়ে একটা নির্দিষ্ট token কী কী করতে পারবে সেটা scope করা
  হয় (যেমন একটা read-only token)।

### ১.৪ Guards

`config/auth.php`-তে default `web` guard (session driver, `users` provider)
থাকবে। `auth:sanctum`-এর জন্য আলাদা guard entry **লাগে না** — Sanctum-এর
`guard()` implementation token-এর পেছনের user load করতে `web` provider-ই
পুনরায় ব্যবহার করে। তবুও আমরা একটা explicit `api` guard entry যোগ করবো, কারণ
এতে `auth:api` আর IDE tooling সঠিকভাবে আচরণ করে এবং intent স্পষ্ট থাকে।

---

## ২. Configuration ও bootstrap

### ২.১ Environment variables

**`.env`** আর **`.env.example`** এ যোগ করুন (`.env.example` value-মুক্ত / নিরাপদ
রাখুন):

```dotenv
# --- Auth ---
AUTH_GUARD=web
FRONTEND_URL=http://localhost:3000

# Sanctum
SANCTUM_TOKEN_PREFIX=ecom_
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:8000

# Seeded admin (DatabaseSeeder এ ব্যবহৃত হয়)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password
```

- **`SANCTUM_TOKEN_PREFIX`** — প্রতিটা issued token এই string দিয়ে শুরু হবে।
  তখন GitHub/GitLab-এর secret scanner commit-এ leak হওয়া token ধরতে পারে।
  আপনার app-এর জন্য কিছুটা unique একটা মান দিন।
- **`FRONTEND_URL`** — verification / password-reset link কোথায় point করবে
  (API HTML render করে না; SPA করে)।

### ২.২ Token expiration

`config/sanctum.php`:

```php
'expiration' => 60 * 24 * 7, // মিনিট → ৭ দিন
```

`null` (বর্তমান মান) মানে token কখনো expire হয় না। একটা নির্দিষ্ট lifetime
token leak হলে ক্ষতির সময়সীমা কমিয়ে দেয়। Expired row নিজে থেকে মোছে না —
prune schedule করুন ([§৯.৫](#৯৫-token-pruning-schedule-করুন))।

### ২.৩ `api` guard

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

আর এই ফাঁকে password broker-ও একটু কড়া করুন (`passwords.users`):

```php
'passwords' => [
    'users' => [
        'provider' => 'users',
        'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
        'expire' => 15,   // reset link ১৫ মিনিট valid
        'throttle' => 60, // per user প্রতি মিনিটে একটা reset request
    ],
],
```

### ২.৪ Middleware alias + JSON error — `bootstrap/app.php`

Laravel 12-তে `Kernel.php` নেই; middleware আর exception rendering
`bootstrap/app.php`-এ configure হয়। দুটো ফাঁকা closure বদলে দিন:

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
        // API route-এ সবসময় JSON দাও, কখনো HTML error page বা redirect নয়।
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
        // ValidationException এমনিতেই API route-এ 422 JSON হিসেবে render হয় — handler লাগে না।
    })->create();
```

কেন: একটা API-এর consumer কখনোই `/login`-এ 302 redirect বা HTML stack trace
পাওয়ার কথা না। `shouldRenderJsonWhen` একটা predictable envelope নিশ্চিত করে।

> **spatie middleware নোট:** Laravel 11+ এ `laravel/permission` v6-এর সাথে
> `role` / `permission` alias **auto-register হয় না** — উপরের block-টা
> বাধ্যতামূলক, নাহলে `->middleware('role:admin')` "Target class [role] does not
> exist" throw করবে।

### ২.৫ CORS

Config publish করুন আর origin lock করুন:

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
    'supports_credentials' => false, // true শুধু তখন যদি SPA cookie mode-ও ব্যবহার করেন
];
```

Pure token auth cookie ব্যবহার করে না, তাই `supports_credentials` `false` থাকবে।
Authenticated API-এর জন্য কখনো `allowed_origins => ['*']` ship করবেন না।

---

## ৩. Roles ও permissions

### ৩.১ Seeder

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

        // Permissions (app বড় হলে বাড়াবেন)।
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

        // 'customer' এর কোনো explicit permission লাগে না — customer-facing route
        // gate হয় authentication + ownership policy দিয়ে, permission দিয়ে নয়।
    }
}
```

- **`guard_name` অবশ্যই `web` হতে হবে** — যে guard শেষমেশ user load করে সেটার
  সাথে মিলতে হবে। Sanctum user resolve করে `web` provider দিয়ে, আর
  `$user->hasRole('admin')` model-এর `getDefaultGuardName()` এর সাথে তুলনা করে,
  যেটা এখানে `web`। `guard_name => 'sanctum'` দিয়ে বানানো role চুপচাপ কখনো
  match করবে না।
- **`forgetCachedPermissions()`** — spatie পুরো permission table ২৪ ঘণ্টা cache
  করে রাখে। Seed করার সময় সবসময় এটা flush করুন, নাহলে নতুন বানানো role cache
  expire না হওয়া পর্যন্ত দেখা যাবে না।

### ৩.২ `DatabaseSeeder` এ যুক্ত করুন

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

### ৩.৩ কেউ কখন `vendor` হয়

Registration-এ সবাই `customer` পায় ([§৬.১](#৬১-register) দেখুন)। একজন user
`vendor` হয় যখন একজন admin তার `Vendor` record **approve** করে। আপনার
বিদ্যমান vendor-approval কোডে এটা যোগ করুন (এই গাইডে বানানো হয়নি):

```php
$vendor->user->syncRoles(['vendor']); // অথবা assignRole যদি 'customer'-ও রাখতে চান
```

---

## ৪. User model

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
     * user-এর role অনুযায়ী token-কে যে abilities দেওয়া হবে।
     * '*' = সব ability। read-only বা partner token-এর জন্য ছোট করুন।
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

- **`implements MustVerifyEmail`** `verified` middleware চালু করে এবং
  `event(new Registered($user))` কে verification email পাঠাতে বাধ্য করে।
- **`password => 'hashed'` cast** মানে `User::create(['password' => 'plain'])`
  নিজে থেকেই hash করে — register flow-এ কখনো নিজে `bcrypt()` কল করবেন না।
- `HasApiTokens` আগে থেকেই ছিল; `HasRoles` নতুন trait।

---

## ৫. Form Requests

```bash
php artisan make:request Auth/RegisterRequest
php artisan make:request Auth/LoginRequest
php artisan make:request Auth/ForgotPasswordRequest
php artisan make:request Auth/ResetPasswordRequest
php artisan make:request Auth/ChangePasswordRequest
```

Form Request validation-কে controller-এর বাইরে রাখে, প্রতিটা rule set-কে
reusable আর আলাদাভাবে testable করে, এবং controller-এর **আগে** run হয় — একটা
invalid payload কখনো আপনার logic-এ পৌঁছায় না। Public গুলোতে `authorize()`
`true` return করে কারণ যে কেউ register বা login চেষ্টা করতে পারে।

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

**`LoginRequest.php`** — throttling-ও এটার দায়িত্ব, যাতে lock-out হওয়া attacker
কখনো database-এ না পৌঁছায়:

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

**`ChangePasswordRequest.php`** (authenticated — route যেহেতু `auth:sanctum`-এর
পেছনে, `authorize()` `true` থাকতে পারে):

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

`current_password` একটা built-in rule যেটা value-টা logged-in user-এর hash-এর
সাথে মেলায়।

**Global password policy সেট করুন** `app/Providers/AppServiceProvider.php`
এর `boot()` এ:

```php
use Illuminate\Validation\Rules\Password;

Password::defaults(fn () => Password::min(8)
    ->letters()
    ->mixedCase()
    ->numbers()
    ->uncompromised() // পরিচিত breach-এ পাওয়া password reject করে (k-anonymity API)
);
```

---

## ৬. Controllers

```bash
php artisan make:controller Api/Auth/RegisteredUserController
php artisan make:controller Api/Auth/AuthenticatedSessionController
php artisan make:controller Api/Auth/EmailVerificationController
php artisan make:controller Api/Auth/PasswordResetLinkController
php artisan make:controller Api/Auth/NewPasswordController
php artisan make:controller Api/Auth/PasswordController
php artisan make:controller Api/Auth/ProfileController
```

### ৬.১ Register

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

        event(new Registered($user)); // verification email queue করে

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

কেন `$request->safe()->only(...)`: Form Request input validate করলেও, আপনি
model-কে একটা explicit allow-list দেন — validation মানে authorization নয়,
mass-assignment protection-ও নয়।

### ৬.২ Login / logout

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

            // Generic message — email আছে কিনা সেটা জানাবেন না।
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
        // শুধু এই request-এ ব্যবহৃত token বাতিল → এই device logout।
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function destroyAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete(); // প্রতিটা device

        return response()->json(['message' => 'Logged out from all devices.']);
    }
}
```

### ৬.৩ Email verification

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
     * user ইমেইলের signed link-এ ক্লিক করার পর SPA এটা হিট করে।
     * Route 'signed' middleware দিয়ে protected, তাই tampering হলে আমাদের কোড
     * চলার আগেই fail করে।
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
     * Authenticated user নতুন verification email চায়।
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

### ৬.৪ Password reset

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
        // Password::sendResetLink per user throttle করে (config/auth.php)।
        Password::sendResetLink($request->only('email'));

        // email আছে কি নেই — সবসময় একই response।
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
            function ($user) use ($request) {
                $user->forceFill([
                    'password' => $request->string('password'),
                    'remember_token' => Str::random(60),
                ])->save();

                // Security: password change প্রতিটা বিদ্যমান token invalidate করে।
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

### ৬.৫ Change password (authenticated)

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

        // বর্তমান device logged in থাকুক; বাকি সব device বের করে দাও।
        $user->tokens()
            ->where('id', '!=', $user->currentAccessToken()->id)
            ->delete();

        return response()->json(['message' => 'Password updated.']);
    }
}
```

### ৬.৬ Me

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

## ৭. UserResource

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

Resource হলো একমাত্র জায়গা যেটা ঠিক করে আপনার API থেকে কী বের হবে। এটা কখনো
`password` বা `remember_token` leak করে না (`$hidden`-ও আছে, তবে defense in
depth), এবং table বদলালেও response-এর shape স্থির রাখে।

---

## ৮. Routes

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
    | যে route-গুলোতে verified email দরকার।
    */
    Route::middleware('verified')->group(function () {
        // উদাহরণ: শুধু verified user checkout করতে পারবে।
        // Route::post('/checkout', CheckoutController::class);
    });

    /*
    | Role-gated এলাকা।
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

নোট:

- Verification link route `signed` ব্যবহার করে — Laravel-এর built-in middleware
  যেটা এমন যেকোনো URL reject করে যার signature মেলে না (tampered `id`, `hash`,
  বা `expires`)। কোনো auth লাগে না: signature-ই প্রমাণ।
- `role:vendor` / `role:admin` আসে
  [§২.৪](#২৪-middleware-alias--json-error--bootstrapappphp)-এ register করা alias
  থেকে।
- Skeleton-এর সাথে আসা default `/user` আর `/test` route মুছে দিন।

---

## ৯. Rate limiting ও hardening

### ৯.১ Named limiters

`app/Providers/AppServiceProvider.php` এর `boot()`:

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

Key বাছাই গুরুত্বপূর্ণ: login শুধু IP দিয়ে key করলে corporate NAT-এর পেছনের
সবাই শাস্তি পায়; শুধু email দিয়ে করলে attacker একজন ভুক্তভোগীকে lock করে
দিতে পারে। Composite `email|ip` স্বাভাবিক আপস। `password-email` একটা **stacked**
limit ব্যবহার করে — per-account আর per-IP দুটো limit-ই pass করতে হবে।

### ৯.২ Token abilities বাস্তবে

Scoped token issue করুন (`tokenAbilities()` দিয়ে আগেই wired), তারপর route
বা কোডে enforce করুন:

```php
// Route level:
Route::post('/vendor/products', [VendorProductController::class, 'store'])
    ->middleware(['auth:sanctum', 'ability:products:manage']);

// অথবা controller / policy তে:
if (! $request->user()->tokenCan('products:manage')) {
    abort(403);
}
```

`ability` / `abilities` middleware Sanctum-এর সাথেই আসে — alias লাগে না।

### ৯.৩ User enumeration নয়

Login, forgot-password, আর resend-verification — সবই **একই** response দেয়,
address আছে কি নেই তা নির্বিশেষে। Registration-ই একমাত্র জায়গা যেখানে attacker
এখনো probe করতে পারে (`unique:users` → 422); সেটা মেনে নিন, আর `register`
throttle-এর উপর নির্ভর করুন।

### ৯.৪ যেখানে দরকার সেখানে verified email বাধ্যতামূলক করুন

*login*-এ unverified email block করবেন না (link resend করতে user-কে login
করতে হয়)। যেসব action-এ trust দরকার — checkout, vendor হওয়া, review দেওয়া —
সেগুলো `verified` middleware দিয়ে block করুন।

### ৯.৫ Token pruning schedule করুন

`routes/console.php`:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

২৪ ঘণ্টার বেশি আগে expire হওয়া `personal_access_tokens` row মুছে দেয়। একটা
চলমান scheduler লাগে (dev-এ `php artisan schedule:work`, prod-এ একটা cron
entry)।

---

## ১০. Email verification ও password reset-এর plumbing

### ১০.১ Notification link SPA-তে point করান

API-এর কোনো `/verify-email` web page নেই — SPA-এর আছে। URL override করুন
`AppServiceProvider::boot()` এ:

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

    // SPA-কে call করার জন্য signed API URL দাও।
    return config('app.frontend_url').'/verify-email?url='.urlencode($signed);
});

ResetPassword::createUrlUsing(fn ($notifiable, string $token) =>
    config('app.frontend_url')."/reset-password?token={$token}&email=".urlencode($notifiable->getEmailForPasswordReset())
);
```

`config/app.php` এ যোগ করুন:

```php
'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
```

Flow: user SPA link-এ ক্লিক করে → SPA query string থেকে `url` / `token` পড়ে
→ SPA API call করে (signed URL `GET` করে, বা `POST /api/reset-password`) →
API JSON response দেয় → SPA success দেখায়।

### ১০.২ Email queue করুন

`config/queue.php` এর default আগেই `database`। Notification-গুলো async
করুন যাতে registration/login response সাথে সাথে আসে। শুধু দরকার হলেই custom
notification class বানান (`php artisan make:notification`), অথবা সহজভাবে একটা
worker চালান — `composer dev` এমনিতেই একটা `queue:listen` চালু করে। আলাদা
চালাতে: `php artisan queue:work`।

### ১০.৩ Local dev-এ mail

`.env` এ `MAIL_MAILER=log` আছে — verification/reset email
`storage/logs/laravel.log` এ পড়বে। Manually test করতে সেখান থেকে signed URL
copy করুন, অথবা Mailpit/Mailtrap-এ switch করুন।

---

## ১১. Tests

### ১১.১ Database refresh চালু করুন

`tests/Pest.php`:

```php
pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature');
```

প্রতিটা feature test-এর জন্য role seed করুন। `tests/Pest.php` এ যোগ করুন:

```php
function seedRoles(): void
{
    Illuminate\Support\Facades\Artisan::call('db:seed', [
        '--class' => Database\Seeders\RolesAndPermissionsSeeder::class,
    ]);
}
```

…এবং `tests/Feature/Auth/` এর file-গুলোতে `beforeEach()` এ `seedRoles()` কল
করুন, অথবা `pest()->beforeEach(fn () => seedRoles())->in('Feature/Auth')`
register করুন।

### ১১.২ Registration — `tests/Feature/Auth/RegistrationTest.php`

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

### ১১.৩ Login — `tests/Feature/Auth/LoginTest.php`

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

### ১১.৪ Session lifecycle — `tests/Feature/Auth/SessionTest.php`

```php
<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(fn () => seedRoles());

it('requires a token for /me', function () {
    $this->getJson('/api/me')->assertUnauthorized(); // 401, redirect নয়
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

    expect($user->fresh()->tokens()->count())->toBe(1); // 'b' টিকে থাকে
});

it('logout-all revokes every token', function () {
    $user = User::factory()->create();
    $a = $user->createToken('a')->plainTextToken;
    $user->createToken('b');

    $this->withToken($a)->postJson('/api/logout-all')->assertOk();

    expect($user->fresh()->tokens()->count())->toBe(0);
});
```

### ১১.৫ Email verification — `tests/Feature/Auth/EmailVerificationTest.php`

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

    // Signature নিজে valid, কিন্তু controller-এর hash check fail করে।
    $this->getJson($url)->assertStatus(403);
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});
```

### ১১.৬ Password reset — `tests/Feature/Auth/PasswordResetTest.php`

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

### ১১.৭ Authorization matrix — `tests/Feature/Auth/RoleAccessTest.php`

```php
<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    seedRoles();

    // শুধু এই test file-এর জন্য একটা minimal route:
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

> আসল ownership check ("vendor *নিজের* product edit করে") এর জন্য একটা
> **Policy** লিখুন আর policy-টা সরাসরি test করুন পুরো matrix-এর জন্য, সাথে
> **একটা** HTTP test যেটা প্রমাণ করে endpoint `authorize()` কল করে। অন্য
> vendor-এর record-এর জন্য `403` এর বদলে `404` return করুন যাতে record-টা
> আছে কিনা সেটা confirm না হয়।

Run:

```bash
php artisan test --filter=Auth
```

---

## ১২. End-to-end যাচাই

```bash
php artisan migrate:fresh --seed
php artisan serve        # terminal 1
php artisan queue:work   # terminal 2 (email পাঠায়)
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

# 3. Verification email → storage/logs/laravel.log দেখুন, signed URL copy করুন, তারপর:
curl -sS "<paste-signed-url>" -H 'Accept: application/json'

# 4. Login (নতুন token)
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

তারপর:

```bash
php artisan test
./vendor/bin/pint --dirty   # শুধু আপনার বদলানো file format করে
```

---

## ১৩. Production checklist

- [ ] `APP_DEBUG=false`, `APP_ENV=production`
- [ ] HTTPS বাধ্যতামূলক (proxy-এর পেছনে `URL::forceScheme('https')`, বা web-server level)
- [ ] `BCRYPT_ROUNDS=12` (`.env.example` এর default-ই)
- [ ] `SANCTUM_TOKEN_PREFIX` একটা স্বতন্ত্র মানে সেট করা
- [ ] `config/sanctum.php` এর `expiration` নির্দিষ্ট + `sanctum:prune-expired` scheduled
- [ ] `config/cors.php` এর `allowed_origins` = আপনার আসল frontend domain, কখনো `*` নয়
- [ ] প্রতিটা auth route-এ named rate limiter (`throttle:login` ইত্যাদি)
- [ ] `Password::defaults()` এ `->uncompromised()` আছে
- [ ] Trust-sensitive action-এ email verification বাধ্যতামূলক (`verified` middleware)
- [ ] Mail-এর জন্য একটা queue worker (Horizon বা Supervisor দিয়ে `queue:work`) চলছে
- [ ] Failed login log হচ্ছে (`Illuminate\Auth\Events\Failed` / `Lockout` listen করুন)
- [ ] CI-তে `composer audit`
- [ ] Deploy pipeline-এ `php artisan config:cache route:cache`
- [ ] Secret শুধু `.env` / secret manager-এ — কখনো commit নয়

---

## ১৪. পরের ধাপ (এই গাইডের বাইরে)

| যা চান | যা ব্যবহার করবেন |
| --- | --- |
| TOTP / SMS two-factor | `laravel/fortify` (এটা 2FA endpoint দেয় যেগুলো API থেকে call করা যায়) |
| "Login with Google/Facebook" | `laravel/socialite` → provider token exchange করে তারপর `createToken()` |
| পূর্ণ OAuth2 authorization server (আপনি *third-party* app-কে token দেন) | Sanctum-এর বদলে `laravel/passport` |
| Refresh-token rotation / short access + long refresh | custom: ভিন্ন ability আর expiry দিয়ে দুটো token issue করুন, একটা `/refresh` route যোগ করুন |
| Per-user device/session management UI | `personal_access_tokens` (name, `last_used_at`) একটা `/tokens` resource দিয়ে expose + delete |
| Impersonation ("admin customer হিসেবে login করে") | একটা signed, audited, time-boxed impersonation token ভিন্ন ability সহ |
