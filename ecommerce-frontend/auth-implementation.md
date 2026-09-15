# Auth Feature — Professional Implementation Guide

This document explains how to take the current authentication feature (Laravel 12 API + React/Redux frontend) from its present mocked/incomplete state to a production-quality implementation. It's a reference to implement from, not a description of changes already made.

Decisions already confirmed for this guide:
- **Login is blocked (403) until the user's email is verified** via OTP.
- **The bearer token is stored in localStorage** on the frontend, matching the app's existing storage convention.
- **No new form library** — client-side validation stays hand-rolled `useState`, matching the rest of the codebase.

---

## Part 1 — Backend (`ecommerce-backend`)

### 1.1 Problems in the current implementation

| Area | File | Problem |
|---|---|---|
| OTP delivery | `AuthController::register()` | The OTP is returned **in plaintext in the JSON response body** (`'OTP' => $otp`). No email/notification is ever sent — there are no `app/Notifications` or `app/Mail` classes in the project at all. |
| Login gating | `AuthController::login()` | Doesn't check `status` or `email_verified_at`. An unverified/inactive user can log in and receive a full-access token. |
| OTP brute-force | `EmailController::verifyEmail()` | Checks `$verification->attempts >= 5` to return 429, but the `otp_verifications` table has **no `attempts` column** and the model doesn't fill it — the check always evaluates against `null` and never fires. There's no real lockout. |
| Password reset | `PasswordController` | `forgotPassword()`, `resetPassword()`, `changePassword()` are empty stubs, and **not registered in any route file**. |
| Social login | `SocialAuthController` | `googleLogin()` is an empty stub, no `laravel/socialite` package installed, no route registered. |
| Token lifetime | `config/sanctum.php` | `expiration => null` — tokens never expire, and no abilities are scoped (`createToken('auth_token')` grants `['*']`). |
| Validation | `AuthController::login()` | Uses an inline `Validator::make()` instead of a Form Request. `RegisterRequest` accepts `password: min:6` with no complexity or confirmation. |
| Rate limiting | `routes/auth.php` | `POST /auth/register` has **no throttle** at all — an OTP-generation/spam vector. |
| Tests | `tests/` | Zero coverage of any auth endpoint. |
| Docs | `AuthController::register()` OpenAPI block | Claims the response includes a `token` field; the actual implementation never returns one. |

### 1.2 Fix: OTP verification + attempts tracking

New migration, e.g. `database/migrations/xxxx_xx_xx_add_attempts_to_otp_verifications_table.php`:

```php
Schema::table('otp_verifications', function (Blueprint $table) {
    $table->unsignedTinyInteger('attempts')->default(0)->after('otp_code');
});
```

Update `app/Models/OtpVerification.php` to add casts (currently has none):

```php
protected $casts = [
    'expires_at' => 'datetime',
    'verified_at' => 'datetime',
    'is_verified' => 'boolean',
    'attempts' => 'integer',
];
```

**Semantics**: attempts are scoped to a single OTP *row*, not the user globally. Every time a new OTP is issued (register, resend), invalidate/expire any prior unverified row for that `user_id` + `type` (set `expires_at = now()` or delete it) and insert a fresh row with `attempts = 0`. This means a user who requests a new code always gets a clean 5-try budget on the *current* code, and old codes can't be reused.

### 1.3 Centralize OTP logic: `app/Services/OtpService.php`

`register()`, `resendVerificationEmail()`, and `verifyEmail()` all touch OTP creation/checking — duplicating this three times invites drift (it already has: the dead `attempts` check). A small service class, not an interface/abstraction layer (proportional to app size):

```php
class OtpService
{
    public function generate(User $user, string $type = 'registration'): OtpVerification
    {
        OtpVerification::where('user_id', $user->id)
            ->where('type', $type)
            ->where('is_verified', false)
            ->update(['expires_at' => now()]);

        $otp = OtpVerification::create([
            'user_id' => $user->id,
            'otp_code' => (string) random_int(100000, 999999),
            'expires_at' => now()->addMinutes(10),
            'type' => $type,
        ]);

        $user->notify(new OtpVerificationNotification($otp->otp_code));

        return $otp;
    }

    public function verify(User $user, string $code, string $type = 'registration'): string
    {
        // returns 'ok' | 'not_found' | 'locked' | 'mismatch'
        $verification = OtpVerification::where('user_id', $user->id)
            ->where('type', $type)
            ->where('is_verified', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (! $verification) {
            return 'not_found';
        }

        if ($verification->attempts >= 5) {
            return 'locked';
        }

        if ($verification->otp_code !== $code) {
            $verification->increment('attempts');
            return 'mismatch';
        }

        $verification->update(['is_verified' => true, 'verified_at' => now()]);

        return 'ok';
    }
}
```

Controllers map the returned string to the right HTTP status (404/429/422/200). Keep it this simple — no custom exceptions needed at this scale.

### 1.4 Real OTP delivery

New `app/Notifications/OtpVerificationNotification.php`:

```php
class OtpVerificationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $code) {}

    public function via($notifiable): array { return ['mail']; }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your verification code')
            ->line("Your verification code is: {$this->code}")
            ->line('This code expires in 10 minutes.');
    }
}
```

`User` already has the `Notifiable` trait — no model change needed. Set `MAIL_MAILER=log` in `.env` for local dev (writes to `storage/logs/laravel.log`, no SMTP required); swap to `smtp`/`ses`/`resend` later without touching code. Add `MAIL_MAILER=log` to `.env.example` if one exists, or create it.

**Remove `'OTP' => $otp` from `AuthController::register()`'s response entirely.** This is the single highest-priority fix — it currently defeats the purpose of having an OTP at all.

### 1.5 Password reset: reuse Laravel's built-in broker

Don't build a second OTP mechanism for password reset. `config/auth.php` already has `passwords.users` fully configured (`password_reset_tokens` table, 60 min expiry, 60s throttle) and unused — use `Illuminate\Support\Facades\Password`:

```php
// PasswordController::forgotPassword(ForgotPasswordRequest $request)
Password::sendResetLink($request->only('email'));
return response()->json(['message' => 'If that email exists, a reset link has been sent.']);
```

Always return the same generic message regardless of whether the broker found a user (`Password::RESET_LINK_SENT` vs `INVALID_USER`) — this avoids leaking which emails are registered (OWASP user-enumeration guidance).

```php
// PasswordController::resetPassword(ResetPasswordRequest $request)
$status = Password::reset(
    $request->only('email', 'password', 'password_confirmation', 'token'),
    function (User $user, string $password) {
        $user->update(['password' => Hash::make($password)]);
        $user->tokens()->delete(); // force re-login everywhere
    }
);

return $status === Password::PASSWORD_RESET
    ? response()->json(['message' => 'Password reset successfully.'])
    : response()->json(['message' => __($status)], 422);
```

Since the frontend is a separate SPA (not Laravel Blade), override `User::sendPasswordResetNotification()` to point the reset link at the frontend instead of a Laravel route:

```php
// User.php
public function sendPasswordResetNotification($token): void
{
    $url = config('app.frontend_url') . '/reset-password?token=' . $token . '&email=' . urlencode($this->email);
    $this->notify(new \App\Notifications\ResetPasswordNotification($url));
}
```

Add `FRONTEND_URL` to `.env` / `config/app.php`.

```php
// PasswordController::changePassword(ChangePasswordRequest $request) — behind auth:sanctum
$request->user()->update(['password' => Hash::make($request->password)]);
$request->user()->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();
return response()->json(['message' => 'Password changed successfully.']);
```

Revoking *other* tokens (not the current one) on change-password keeps the user logged in on the device they're using while kicking out any other sessions — the professional default.

### 1.6 Form Requests

`app/Http/Requests/V1/`:

- **`LoginRequest.php`** (new) — `email: required|string|email`, `password: required|string`. Replaces the inline `Validator` in `login()`.
- **`RegisterRequest.php`** (update) — `'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()]` using `Illuminate\Validation\Rules\Password`. Requires the frontend to send `password_confirmation` too.
- **`ForgotPasswordRequest.php`** (new) — `email: required|email` (deliberately **no** `exists:users` rule — enumeration protection).
- **`ResetPasswordRequest.php`** (new) — `token: required|string`, `email: required|email`, `password: required|confirmed` + same `Password` rule as register.
- **`ChangePasswordRequest.php`** (new) — `current_password: required|current_password` (Laravel's built-in rule, checks against the authenticated user), `password: required|confirmed|different:current_password` + `Password` rule.
- **`ResendOtpRequest.php`** (new, small) — `email: required|email`.
- `VerifyOtpRequest.php` — already correct, no change needed.

### 1.7 Controller-by-controller changes

**`AuthController::register()`**
- `Hash::make($request->password)` instead of `bcrypt()` (respects `config/hashing.php`, more idiomatic).
- Keep `status = 'inactive'`.
- Replace inline OTP creation with `app(OtpService::class)->generate($user)`.
- Response: user data only (see `UserResource` below), generic message, **no OTP, no token** (user isn't verified/logged-in yet).

**`AuthController::login()`**
- Use `LoginRequest`.
- After `Hash::check`, add: `if ($user->status !== 'active') { return response()->json(['message' => 'Please verify your email to activate your account.'], 403); }`
- Issue the token with an expiration: set `config/sanctum.php` → `'expiration' => (int) env('SANCTUM_TOKEN_EXPIRATION', 60 * 24 * 7)` (7 days in minutes), add `SANCTUM_TOKEN_EXPIRATION` to `.env.example`. Simpler than passing a per-call expiry, applies uniformly.
- Response: `{ user: UserResource, token: string }`.

**`EmailController`**
- Collapse `sendVerificationEmail()` and `resendVerificationEmail()` into **one** method/route. Reasoning: `register()` already auto-issues the first OTP via `OtpService::generate()`, so the only remaining client need is "send me another one" — the two stubs had identical inputs (an email) and identical effects (issue a new OTP). Two near-duplicate endpoints for the same action just creates "which one do I call?" ambiguity on the frontend. Keep `resendVerificationEmail(ResendOtpRequest $request)`, delete `sendVerificationEmail()` and its route (`POST /auth/email/send`).
- `resendVerificationEmail()` — find user by email (404 if not found), guard `if ($user->status === 'active') return 422 'Already verified'`, call `OtpService::generate($user)`.
- `verifyEmail(VerifyOtpRequest $request)` — replace the body with:
  ```php
  $user = User::where('email', $request->email)->first();
  if (!$user) return response()->json(['message' => 'User not found.'], 404);

  $result = app(OtpService::class)->verify($user, $request->otp);

  return match ($result) {
      'ok' => tap(fn () => $user->update(['email_verified_at' => now(), 'status' => 'active']))
          ? response()->json(['message' => 'Email verified successfully.'])
          : null,
      'locked' => response()->json(['message' => 'Maximum verification attempts exceeded.'], 429),
      'mismatch' => response()->json(['message' => 'Invalid OTP.'], 400),
      default => response()->json(['message' => 'Invalid or expired OTP.'], 400),
  };
  ```
  (Adjust to taste — the point is it now goes through `OtpService` so the attempts/lockout logic is real.)

**`PasswordController`** — implement all three methods per §1.5, register routes.

**`SocialAuthController`** — leave untouched (see Out of Scope).

### 1.8 Rate limiting

Keep the existing inline `throttle:X,1` pattern on each route (don't introduce `RateLimiter::for()` — only ~9 endpoints total, not worth the indirection at this size). Make sure every route has one:

```php
// routes/auth.php
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1'); // currently missing
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/auth/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

Route::post('/auth/email/verify', [EmailController::class, 'verifyEmail'])->middleware('throttle:10,1');
Route::post('/auth/email/resend', [EmailController::class, 'resendVerificationEmail'])->middleware('throttle:5,1');
// remove /auth/email/send

Route::post('/auth/password/forgot', [PasswordController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/auth/password/reset', [PasswordController::class, 'resetPassword'])->middleware('throttle:10,1');
Route::post('/auth/password/change', [PasswordController::class, 'changePassword'])->middleware(['auth:sanctum', 'throttle:10,1']);
```

### 1.9 Response shape: `UserResource`

New `app/Http/Resources/V1/UserResource.php`:

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at,
            'roles' => $this->getRoleNames(), // Spatie
            'created_at' => $this->created_at,
        ];
    }
}
```

Use it in `register`, `login`, `user()`, `verifyEmail`. Explicitly excludes `password`/`remember_token` — makes the API contract stable regardless of future model `$hidden` changes. Don't build resources for every model — just this one, scoped to the auth feature.

### 1.10 Swagger/OpenAPI

- Fix `register()`'s docblock — remove the claimed `token` field, reflect the real no-OTP/no-token response.
- Add response schemas for `login()`'s new `403` (unverified) case.
- Add full `#[OA\...]` docblocks to the (now-implemented) `PasswordController` methods and `resendVerificationEmail()`.
- Add `security: [['bearerAuth' => []]]` to `changePassword()`, matching the existing pattern on `logout`/`user`.
- Run `php artisan l5-swagger:generate` after changes (build step, not a source change).

### 1.11 Tests — `tests/Feature/Auth/`

Use Pest, `Notification::fake()` (not `Mail::fake()`, since delivery goes through `Notification`) to assert codes were sent without needing a real transport:

- **`RegistrationTest.php`** — happy path (user created inactive, OTP notification sent, **no OTP in the response body** — explicit regression test for the fixed leak); validation failures (duplicate email, weak password, mismatched confirmation); throttle test.
- **`LoginTest.php`** — active+verified user gets a token; wrong password → 401/422; unverified/inactive user → 403; throttle test; token carries an expiration.
- **`EmailVerificationTest.php`** — correct OTP verifies + activates; expired OTP rejected; wrong OTP increments `attempts`; 5th wrong attempt → 429; already-verified user re-verify guard.
- **`ResendOtpTest.php`** — issues a fresh OTP, invalidates the prior row; throttle test.
- **`PasswordResetTest.php`** — forgot-password returns the same generic message for existing and non-existing emails (enumeration check); reset with a valid token succeeds and revokes all tokens; expired/invalid token fails; weak new password rejected.
- **`ChangePasswordTest.php`** — authenticated happy path; wrong current password rejected; new password same as current rejected; unauthenticated request blocked.

### 1.12 Explicitly out of scope

- **Google/social login** — no `laravel/socialite` installed, `SocialAuthController` has no routes. Separate future task.
- **2FA/MFA** beyond email OTP — no package installed, not requested.
- **Granular Sanctum token abilities** (scoped per role) — `['*']` is fine at this app's size.
- **`VendorSignupPage`'s vendor-approval-status-vs-dashboard-access gap** — a vendor-workflow/authorization issue (should a `pending` vendor's account reach the dashboard?), not an auth-mechanism issue. Separate follow-up.

---

## Part 2 — Frontend (`ecommerce-frontend`)

### 2.1 Problems in the current implementation

| Area | File | Problem |
|---|---|---|
| API calls | entire `src/` | **Zero real HTTP calls anywhere** — no axios, no fetch to a backend, confirmed by grep. Everything is Context + `localStorage`. |
| Login | `AuthContext.tsx` | `login(email, password)`'s implementation only destructures `(email)` — the password is declared in the type but never read or checked. Any password succeeds. |
| Signup | `AuthContext.tsx` | `signup(name, email, _password, ...)` — `_password` is intentionally unused, nothing is hashed or stored. `AuthUser` has no password field at all. |
| OTP | `lib/recovery.ts` + `VerifyOtpPage.tsx` | The "sent" code is generated **client-side** in the browser and stored in `sessionStorage` — there's no server round-trip. `VerifyOtpPage.tsx` even has a visible "Demo mode" box that reveals the code as a clickable auto-fill button. |
| Password reset | `ResetPasswordPage.tsx` | Submit handler has a comment: *"Demo app — there is no password store; the sign-in page accepts anything."* Nothing is ever persisted. |
| Backdoor | `storage.ts` | `applyDemoRole()` reads `?as=admin/vendor/customer` from the URL and writes a fake `AuthUser` straight into `localStorage`, bypassing `AuthContext` entirely. |
| Guards | `RequireRole.tsx` | The only guard in the app. Wrong-role case renders an inline "Restricted" block instead of redirecting. No generic "must be logged in" guard exists — `/account`, `/wishlist`, `/checkout` render unguarded regardless of auth state. |
| Config | whole repo | No `.env` files anywhere, no `VITE_API_*` usage — there's no API base URL configured at all. |

### 2.2 HTTP client

Install axios (the only new dependency needed — no form library per the confirmed decision):

```bash
npm install axios
```

New `src/shared/lib/apiClient.ts`:

```ts
import axios from 'axios'
import { getStoredToken, clearStoredAuth } from '@/features/auth/lib/tokenStorage'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      clearStoredAuth()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)
```

New `ecommerce-frontend/.env.example`:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

New `src/features/auth/api/authApi.ts` — thin wrapper functions, single source of truth for endpoint paths/payloads:

```ts
export const authApi = {
  register: (data: RegisterPayload) => apiClient.post('/auth/register', data),
  login: (data: LoginPayload) => apiClient.post<{ user: ApiUser; token: string }>('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getUser: () => apiClient.get<ApiUser>('/auth/user'),
  verifyOtp: (data: { email: string; otp: string }) => apiClient.post('/auth/email/verify', data),
  resendOtp: (data: { email: string }) => apiClient.post('/auth/email/resend', data),
  forgotPassword: (data: { email: string }) => apiClient.post('/auth/password/forgot', data),
  resetPassword: (data: ResetPasswordPayload) => apiClient.post('/auth/password/reset', data),
  changePassword: (data: ChangePasswordPayload) => apiClient.post('/auth/password/change', data),
}
```

Laravel validation errors come back as `{ message, errors: { field: string[] } }` — normalize this shape once in the apiClient's error handling so every form consumes it consistently.

### 2.3 Move auth state onto Redux

The Redux store (`src/app/store.ts`) was scaffolded earlier this session with an empty `reducer: {}` — no slices yet. Auth is the natural first slice to add: it's small, well-bounded, and every async action (register/login/logout/verify/resend/forgot/reset/change) benefits from RTK's built-in pending/fulfilled/rejected states rather than hand-rolling loading/error flags in Context. Only 4 files currently call `useAuth()` (`AccountMenu.tsx`, `RequireRole.tsx`, `LoginPage.tsx`, `VendorSignupPage.tsx`), so the migration surface is small.

New `src/features/auth/store/authSlice.ts`:

```ts
interface AuthState {
  user: AuthUser | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

export const loginThunk = createAsyncThunk('auth/login', async (payload: LoginPayload) => {
  const { data } = await authApi.login(payload)
  setStoredToken(data.token)
  return data.user
})
// registerThunk, logoutThunk, fetchCurrentUserThunk, verifyOtpThunk, resendOtpThunk,
// forgotPasswordThunk, resetPasswordThunk, changePasswordThunk follow the same shape.

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'idle', error: null } as AuthState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (s) => { s.status = 'loading'; s.error = null })
      .addCase(loginThunk.fulfilled, (s, a) => { s.status = 'succeeded'; s.user = a.payload })
      .addCase(loginThunk.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message ?? 'Login failed' })
      // ...same pattern for the other thunks
  },
})
```

Add it to the store: `src/app/store.ts` → `reducer: { auth: authReducer }`.

New `src/features/auth/hooks/useAuth.ts` — an adapter hook with the **same call signature** as the old Context hook (`user`, `isAdmin`, `isVendor`, `role`, `login`, `signup`, `logout`, `updateProfile`, plus `status`/`error` and the new async actions), internally using `useAppSelector`/`useAppDispatch` from the already-existing `src/app/hooks.ts`. This keeps `AccountMenu.tsx`, `RequireRole.tsx`, `LoginPage.tsx`, `VendorSignupPage.tsx` almost unchanged — only the import path moves from `@/features/auth/context/AuthContext` to `@/features/auth/hooks/useAuth`, plus call sites need `await`/pending-state handling since `login`/`signup` are now async (they were synchronous before).

Once verified working: delete `src/features/auth/context/AuthContext.tsx`, remove `AuthProvider` from `src/app/providers.tsx`'s provider array. The `users[]` mock "database" array goes away entirely — it only ever existed to fake a user list client-side; real auth has no client-side user list.

### 2.4 Token storage

Store **only the token string** in `localStorage`, under a new key (e.g. `storageKeys.authToken`), separate from the old `storageKeys.auth` (which stored a whole fake `AuthUser` object — don't do that anymore, since a stale cached user object could drift from the real backend state).

```ts
// src/features/auth/lib/tokenStorage.ts
const KEY = storageKeys.authToken

export function getStoredToken(): string | null {
  try { return window.localStorage.getItem(KEY) } catch { return null }
}
export function setStoredToken(token: string): void {
  try { window.localStorage.setItem(KEY, token) } catch { /* storage unavailable */ }
}
export function clearStoredAuth(): void {
  try { window.localStorage.removeItem(KEY) } catch { /* storage unavailable */ }
}
```

On app boot, if a token exists, dispatch `fetchCurrentUserThunk()` to rehydrate `user` from `GET /auth/user` rather than trusting any cached user data — this also naturally handles an expired/revoked token via the 401 interceptor in §2.2.

**Tradeoff to be aware of**: localStorage matches the app's existing convention (everything already uses `usePersistedState`/localStorage) and keeps the user logged in across refreshes — but it's readable by any injected JS if the app ever has an XSS bug, unlike an `httpOnly` cookie. The more secure alternative is migrating the backend to Sanctum's cookie-based SPA session mode (stateful domains + CSRF), which is a real backend architecture change (not just a frontend storage swap) — worth considering later if the app's XSS exposure grows (e.g., if you ever render user-generated HTML), but out of scope for this pass.

### 2.5 Replace the mock OTP/reset flow

- **Delete `src/features/auth/lib/recovery.ts` entirely** — no replacement file needed; OTP state now lives server-side. The frontend just calls `authApi.forgotPassword`, `authApi.resendOtp`, `authApi.verifyOtp`, `authApi.resetPassword`.
- **`VerifyOtpPage.tsx`** — remove the "Demo mode" reveal box entirely. Wire `OtpInput`'s submit to `verifyOtpThunk`, show real loading/error state (invalid code, expired code, the 429 lockout message from the now-real `attempts` logic). Wire the 30s resend countdown to `resendOtpThunk`. `OtpInput.tsx` itself needs no changes — it's already a pure controlled component.
- **`ForgotPasswordPage.tsx`** — replace `issueChallenge(email)` with `forgotPasswordThunk(email)`. Since the backend now returns the same generic "check your email" message whether or not the account exists (anti-enumeration, §1.5), show that same generic message — don't branch on found/not-found.
- **`ResetPasswordPage.tsx`** — keep the existing password-strength meter and confirm-match UI (already good). Only the submit handler changes: replace the no-op with `resetPasswordThunk({ token, email, password })`, reading `token`/`email` from the URL query string (`?token=...&email=...`) that the backend's reset-link email points at, per §1.5.

### 2.6 Remove the `?as=` demo backdoor

`applyDemoRole()` in `storage.ts` writes a fake `AuthUser` directly into `localStorage`, bypassing the real auth flow entirely. Once real tokens exist, this becomes actively broken — it would leave `user` populated with no corresponding token, so any subsequent API call would 401 and immediately log the user back out via the interceptor in §2.2. **Remove `applyDemoRole()` and the `?as=` handling from `ensureSchema()` entirely** — it's structurally incompatible with real token-based auth, not just a "nice to remove" cleanup.

### 2.7 Route guards

New `src/features/auth/components/RequireAuth.tsx` — a generic "must be logged in, any role" guard, matching `RequireRole`'s existing API shape:

```tsx
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}
```

Apply it narrowly to the three currently-unguarded routes that should require login: `/account`, `/wishlist`, `/checkout` (in `src/app/App.tsx`'s route config). Don't audit/guard every route in the app as part of this — stay scoped to what the audit flagged.

Fix `RequireRole.tsx`'s wrong-role branch to redirect consistently instead of rendering an inline "Restricted" block:

```tsx
if (user.role !== role && user.role !== 'admin') {
  return <Navigate to="/login" state={{ from: location }} replace />
}
```

Keep the admin-bypass rule (`user.role !== role && user.role !== 'admin'`) as-is — that's a legitimate authorization rule, not part of this fix.

### 2.8 Type updates

`src/shared/types/index.ts`:

```ts
export interface AuthUser {
  id: number
  name: string
  email: string
  role: Role
  vendorId?: string
  status: 'pending' | 'active' | 'inactive' | 'banned'
  emailVerifiedAt: string | null
  createdAt: string
}
```

The backend's `UserResource` returns Spatie `roles: string[]` (e.g. `['super-admin']` for the seeded admin) rather than a single `role`. Rather than widening every `Role`-typed prop across the app to handle an array, map at the adapter layer (inside `useAuth.ts` or a selector): pick the highest-priority role and map `super-admin` → `admin` so the rest of the app's `role`/`isAdmin`/`isVendor` logic is untouched.

### 2.9 Explicitly out of scope

- **`VendorSignupPage.tsx`'s vendor-status-vs-dashboard-access gap** — not fixed here. It's a vendor-approval workflow concern (should a `pending` vendor reach `/vendor/dashboard`?), not an auth-mechanism concern. Its `signup(...)` call site does need a mechanical update to match the new async API (`await` the thunk), but the actual status-gating fix is a separate follow-up — it requires reading vendor-approval state from `VendorContext` inside the guard layer, which is a cross-feature coupling decision worth its own review.
- **Google/social login UI** — no backend support exists (§1.12), so no frontend work either.
- **2FA/MFA UI**.
- **Migrating other Context providers** (`Vendor`, `Catalog`, `Settings`, etc.) to Redux — only `Auth` moves in this plan.
- **react-hook-form / zod** — per the confirmed decision, validation stays hand-rolled `useState`, matching every other form in the app today.

---

## Summary checklist

**Backend**
- [ ] Migration: add `attempts` to `otp_verifications`, add casts to `OtpVerification`
- [ ] `app/Services/OtpService.php`
- [ ] `app/Notifications/OtpVerificationNotification.php` + `ResetPasswordNotification` override on `User`
- [ ] `MAIL_MAILER=log`, `FRONTEND_URL`, `SANCTUM_TOKEN_EXPIRATION` in `.env`/`.env.example`
- [ ] `LoginRequest`, updated `RegisterRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `ChangePasswordRequest`, `ResendOtpRequest`
- [ ] `AuthController::register/login` fixes (no OTP leak, `Hash::make`, 403 gate, token expiration)
- [ ] `EmailController` — collapse send/resend, wire `verifyEmail` through `OtpService`
- [ ] `PasswordController` — implement all 3 methods + register routes
- [ ] `config/sanctum.php` expiration
- [ ] `app/Http/Resources/V1/UserResource.php`
- [ ] Swagger docblock fixes + `php artisan l5-swagger:generate`
- [ ] `tests/Feature/Auth/*` (6 files per §1.11)

**Frontend**
- [ ] `npm install axios`
- [ ] `.env.example` with `VITE_API_BASE_URL`
- [ ] `src/shared/lib/apiClient.ts`, `src/features/auth/api/authApi.ts`
- [ ] `src/features/auth/lib/tokenStorage.ts`
- [ ] `src/features/auth/store/authSlice.ts`, wired into `src/app/store.ts`
- [ ] `src/features/auth/hooks/useAuth.ts` (adapter), delete `AuthContext.tsx`, update `providers.tsx`
- [ ] Delete `src/features/auth/lib/recovery.ts`; rewire `VerifyOtpPage`, `ForgotPasswordPage`, `ResetPasswordPage`
- [ ] Remove `applyDemoRole()`/`?as=` from `storage.ts`
- [ ] `src/features/auth/components/RequireAuth.tsx`; fix `RequireRole.tsx` redirect; guard `/account`, `/wishlist`, `/checkout`
- [ ] Update `AuthUser`/`Role` types
