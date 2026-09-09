# API Authentication — একদম শুরু থেকে (Laravel 12 + Sanctum)

এই গাইডটা ধরে নিয়েছে তুমি **beginner**। তাই আমরা HTTP কী, token কী — এসব
একদম গোড়া থেকে শুরু করব, তারপর ধাপে ধাপে এই e-commerce API-তে একটা
production-মানের login system বানাব।

কোড তুমি নিজে টাইপ করবে। প্রতিটা কোড ব্লকের **আগে** বলা আছে "এটা কী করবে",
আর **পরে** লাইন ধরে ধরে বোঝানো আছে।

> এটি [`authentication.md`](authentication.md) (ইংরেজি, সংক্ষিপ্ত) এর
> beginner-বান্ধব বাংলা সংস্করণ।

---

## অংশ ০ — যেসব জিনিস আগে বুঝতে হবে

### ০.১ ওয়েব কীভাবে কথা বলে: request আর response

তুমি ব্রাউজারে কিছু করলে ব্রাউজার সার্ভারকে একটা **request** (অনুরোধ) পাঠায়,
সার্ভার একটা **response** (উত্তর) ফেরত দেয়। ব্যাস, এইটুকুই।

একটা request-এ থাকে:

- **Method** — কী ধরনের কাজ। প্রধান ৪টা:
  - `GET` — শুধু তথ্য চাওয়া ("আমার প্রোফাইল দেখাও")
  - `POST` — নতুন কিছু বানানো ("নতুন account খোলো")
  - `PUT` / `PATCH` — কিছু পরিবর্তন করা ("password বদলাও")
  - `DELETE` — মুছে ফেলা ("এই address মুছে দাও")
- **URL** — কোথায় পাঠাচ্ছ। যেমন `https://api.myshop.com/login`
- **Header** — request সম্পর্কে বাড়তি তথ্য। Header হলো "খামের উপরে লেখা"
  ছোট ছোট তথ্য। যেমন `Accept: application/json` মানে "আমাকে JSON ফরম্যাটে
  উত্তর দিও"।
- **Body** — আসল data। যেমন login-এ email আর password।

একটা response-এ থাকে:

- **Status code** — একটা সংখ্যা যেটা এক নজরে বলে কী হলো (নিচে বিস্তারিত)
- **Header**
- **Body** — ফেরত পাঠানো data

### ০.২ Status code — সংখ্যা দেখেই বোঝা যায় কী হয়েছে

| Code | মানে | কখন |
| --- | --- | --- |
| `200 OK` | ঠিকঠাক হয়েছে | সফল login, প্রোফাইল fetch |
| `201 Created` | নতুন কিছু তৈরি হয়েছে | নতুন account রেজিস্টার |
| `401 Unauthorized` | **তুমি কে সেটাই জানি না** | token নেই বা ভুল token |
| `403 Forbidden` | তুমি কে জানি, কিন্তু **এই কাজের অনুমতি নেই** | customer admin-এর route-এ ঢুকতে চাইছে |
| `422 Unprocessable` | তোমার পাঠানো data-তে ভুল আছে | password ৮ অক্ষরের কম |
| `429 Too Many Requests` | **অনেক বেশি চেষ্টা করেছ, একটু থামো** | ১ মিনিটে ১০ বার ভুল password |
| `500` | সার্ভারে bug | তোমার কোডে সমস্যা |

`401` আর `403`-এর পার্থক্যটা মনে রাখো — এটা বারবার লাগবে:
> **401 = পরিচয় নেই। 403 = পরিচয় আছে, কিন্তু অনুমতি নেই।**

### ০.৩ JSON — data লেখার একটা সহজ ফরম্যাট

API-রা HTML পাঠায় না (HTML মানুষের চোখের জন্য)। তারা **JSON** পাঠায় — যেটা
মেশিন সহজে পড়তে পারে। দেখতে এমন:

```json
{
  "user": {
    "id": 1,
    "name": "Jane",
    "email": "jane@example.com"
  },
  "token": "12|AbCdEf123456"
}
```

`{ }` মানে object (key-value জোড়া), `[ ]` মানে list। Laravel নিজে থেকেই
তোমার PHP array-কে JSON-এ বদলে দেয়।

### ০.৪ API endpoint মানে কী

একটা **endpoint** = একটা URL + একটা method যেটা একটা নির্দিষ্ট কাজ করে।
যেমন:

- `POST /api/register` → নতুন account
- `POST /api/login` → login
- `GET /api/me` → নিজের তথ্য দেখা

আমরা এই গাইডে এরকম কয়েকটা endpoint বানাব।

### ০.৫ Authentication vs Authorization — দুটো আলাদা জিনিস

- **Authentication** ("auth") = "**তুমি কে?**" — তুমি সত্যিই Jane কিনা যাচাই
  করা। Login এটাই করে।
- **Authorization** = "**তোমার কি এটা করার অনুমতি আছে?**" — Jane customer,
  সে কি অন্য দোকানের product মুছতে পারবে? না।

দুটোই লাগবে। প্রথমে জানতে হবে তুমি কে, তারপর দেখতে হবে তুমি কী করতে পারো।

### ০.৬ Session বনাম Token — আমরা token কেন ব্যবহার করছি

**পুরনো নিয়ম (session):** তুমি login করলে সার্ভার তোমার জন্য একটা "session"
বানায় এবং ব্রাউজারকে একটা cookie দেয়। প্রতি request-এ ব্রাউজার cookie-টা
আপনাআপনি পাঠায়। এটা ওয়েবসাইটের জন্য ভালো, কিন্তু mobile app বা অন্য domain-এর
জন্য ঝামেলা।

**নতুন নিয়ম (token):** তুমি login করলে সার্ভার তোমাকে একটা লম্বা গোপন string
দেয় — সেটাই **token** (বা "API token", "access token", "bearer token" — সব
একই জিনিস)। এরপর তুমি প্রতি request-এর header-এ এই token পাঠাও:

```
Authorization: Bearer 12|AbCdEf123456
```

সার্ভার token দেখে বুঝে যায় "আরে, এটা তো Jane"।

**Analogy:** কোনো ইভেন্টে ঢোকার সময় হাতে সিল মেরে দেয়। ভেতরে যেকোনো স্টলে
গেলে শুধু হাতটা দেখালেই হয় — আবার টিকিট দেখাতে হয় না। Token হলো সেই হাতের সিল।

Mobile app, React/Next.js frontend, অন্য কোনো সার্ভার — সবাই একইভাবে token
পাঠাতে পারে। তাই আমরা token ব্যবহার করছি।

### ০.৭ Hashing — গোপন জিনিস "একমুখী তালা" দিয়ে রাখা

Password বা token কখনো সরাসরি database-এ রাখা হয় না। রাখা হয় তার **hash**।

Hash = এমন একটা গাণিতিক ফাংশন যা:

- একই input দিলে সবসময় একই output দেয়
- কিন্তু output থেকে input **ফিরে পাওয়া যায় না** (একমুখী)

তাই database চুরি হলেও চোর আসল password/token পায় না। Login-এর সময় সার্ভার
তোমার দেওয়া password আবার hash করে, আর সংরক্ষিত hash-এর সাথে মেলায়।
Laravel এটা নিজে থেকেই করে — তোমাকে শুধু ঠিকভাবে ব্যবহার করতে হবে।

---

## অংশ ১ — আমরা আসলে কী বানাচ্ছি (বড় ছবি)

### ১.১ এই দোকানে ৩ ধরনের মানুষ

| কে | কী করে |
| --- | --- |
| **customer** | কেনাকাটা করে |
| **vendor** | নিজের দোকান আর product সামলায় |
| **admin** | সব কিছু নিয়ন্ত্রণ করে, vendor approve করে |

তিনজনই একই `users` টেবিলে থাকে। শুধু তাদের **role** আলাদা। এটা সামলাবে
`spatie/laravel-permission` প্যাকেজ।

> কেন আলাদা `Admin`, `Vendor` টেবিল বানাচ্ছি না? কারণ তিনজনই একইভাবে login
> করে (email + password)। শুধু "পদবি" আলাদা। একটা টেবিল + role — অনেক সহজ।
> `Vendor` মডেলটা আসলে শুধু দোকানদারের বাড়তি তথ্য (NID, ব্যাংক অ্যাকাউন্ট) —
> সেটা দিয়ে login হয় না।

### ১.২ পুরো গল্পটা এক নজরে

```
১. Jane  →  POST /api/register  →  সার্ভার account বানায়, "customer" role দেয়,
                                    verification email পাঠায়, একটা TOKEN ফেরত দেয়

২. Jane  →  GET /api/me   (header: Authorization: Bearer <token>)
         ←  সার্ভার token দেখে বলে "তুমি Jane" আর প্রোফাইল ফেরত দেয়

৩. Jane  →  POST /api/logout  (header এ token)
         →  সার্ভার সেই token database থেকে মুছে দেয় → token আর কাজ করবে না
```

### ১.৩ কোন টুকরোগুলো বানাব আর কে কী করে

| টুকরো | Laravel-এ কী | কাজ |
| --- | --- | --- |
| **Route** | `routes/api.php` | কোন URL এলে কোন কোড চলবে ঠিক করে |
| **Controller** | `app/Http/Controllers/...` | আসল কাজটা করে (account বানানো, token দেওয়া) |
| **Form Request** | `app/Http/Requests/...` | আসা data ঠিক আছে কিনা যাচাই করে (controller-এ ঢোকার আগে) |
| **Middleware** | (Laravel দেয়) | request-কে controller-এ পৌঁছানোর আগে "চেকপোস্ট"। যেমন `auth:sanctum` চেক করে token আছে কিনা |
| **Resource** | `app/Http/Resources/...` | সার্ভার থেকে বাইরে কী তথ্য যাবে সেটা ঠিক করে (password যেন কখনো না যায়) |
| **Model** | `app/Models/User.php` | database টেবিলের সাথে কথা বলে |
| **Seeder** | `database/seeders/...` | শুরুতে দরকারি data ঢোকায় (role গুলো, admin account) |

> **Middleware** = দরজার দারোয়ান। Request ভেতরে যাওয়ার আগে দারোয়ান চেক করে।
> `auth:sanctum` দারোয়ান বলে: "token দেখাও, নাহলে 401"। `role:admin` দারোয়ান
> বলে: "তুমি admin? না হলে 403"।

### ১.৪ যেসব প্যাকেজ আগে থেকেই বসানো আছে

এই প্রজেক্টে এগুলো ইনস্টল করা আছে, তোমাকে করতে হবে না:

- **`laravel/sanctum`** — token বানানো, যাচাই করা, মুছে ফেলা সব এটা করে।
  একটা `personal_access_tokens` টেবিল বানায় যেখানে token-এর hash থাকে।
- **`spatie/laravel-permission`** — role আর permission সামলায়। কয়েকটা টেবিল
  বানায় (`roles`, `permissions`, ইত্যাদি)।
- **`pestphp/pest`** — test লেখার টুল।

---

## অংশ ২ — Sanctum আসলে ভেতরে কী করে

এই অংশটা না বুঝলেও চলবে, কিন্তু বুঝলে বাকিটা সহজ লাগবে।

তুমি যখন লিখবে `$user->createToken('mobile')`, Sanctum তিনটা কাজ করে:

1. একটা লম্বা random string বানায়, যেমন `AbCdEf123456...` (৪০ অক্ষর)।
2. এই string-এর **hash** `personal_access_tokens` টেবিলে একটা নতুন row হিসেবে
   রাখে। ওই row-তে আরও থাকে: কোন user-এর token (`tokenable_id`), token-এর
   একটা নাম, আর কী কী করার অনুমতি (`abilities`)।
3. তোমাকে ফেরত দেয় `12|AbCdEf123456...` — যেখানে `12` হলো row-এর id আর বাকিটা
   আসল string। **এই পুরো জিনিসটা তুমি জীবনে একবারই দেখবে।** এটাই client
   (mobile app / frontend) সেভ করে রাখে।

পরের request-এ client পাঠায় `Authorization: Bearer 12|AbCdEf123456...`।
Sanctum তখন:

- `12` দিয়ে database-এ row খুঁজে বের করে
- বাকি string আবার hash করে সংরক্ষিত hash-এর সাথে মেলায়
- মিলে গেলে → ওই row যে user-এর, `$request->user()` এখন সেই user

প্রতিটা token আলাদা row বলে:

- এক device logout করলে শুধু সেই row মুছে যায়, বাকি device চলতে থাকে
- "সব জায়গা থেকে logout" মানে ওই user-এর সব row মুছে ফেলা

---

## অংশ ৩ — Configuration (সেটিং ঠিক করা)

কোড লেখার আগে কয়েকটা সেটিং ঠিক করে নিতে হবে।

### ৩.১ `.env` ফাইলে কিছু value যোগ করা

`.env` হলো তোমার প্রজেক্টের গোপন সেটিং ফাইল (এটা git-এ যায় না)।
`.env` আর `.env.example` — দুটোতেই এগুলো যোগ করো:

```dotenv
# লিঙ্ক কোথায় যাবে (তোমার frontend-এর ঠিকানা)
FRONTEND_URL=http://localhost:3000

# Sanctum
SANCTUM_TOKEN_PREFIX=ecom_

# শুরুতে একটা admin account বানানোর জন্য
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password
```

**ব্যাখ্যা:**

- `FRONTEND_URL` — verification আর password-reset email-এ যে link যাবে সেটা
  তোমার React/Next app-এর দিকে নির্দেশ করবে, API-র দিকে নয়।
- `SANCTUM_TOKEN_PREFIX=ecom_` — প্রতিটা token `ecom_` দিয়ে শুরু হবে। কেউ ভুল
  করে GitHub-এ token push করে ফেললে GitHub-এর স্ক্যানার এটা ধরে ফেলতে পারে।
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeder এগুলো দিয়ে প্রথম admin বানাবে।
  (`.env.example`-এ আসল password লিখো না, শুধু `password` রাখো।)

### ৩.২ Token কতদিন টিকবে

খোলো `config/sanctum.php`, খুঁজে বের করো `'expiration' => null,` এবং বদলাও:

```php
'expiration' => 60 * 24 * 7, // মিনিটের হিসাব → ৭ দিন
```

**কেন:** `null` মানে token কোনোদিন মেয়াদ শেষ হয় না — token চুরি হলে চিরকাল
বিপদ। ৭ দিন পর token নিজে থেকেই অকেজো হয়ে যাবে, user-কে আবার login করতে হবে।
(সংখ্যাটা তোমার ইচ্ছেমতো — mobile app হলে ৩০ দিনও রাখতে পারো।)

### ৩.৩ `config/auth.php` — একটা `api` guard যোগ করা

**Guard** = "user-কে কীভাবে চিনব" তার নিয়ম। Default `web` guard cookie/session
দেখে। আমরা token দেখার জন্য একটা `api` guard যোগ করব।

`config/auth.php`-এ `guards` অংশটা এমন করো:

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

আর ঠিক নিচে `passwords` অংশে reset link-এর মেয়াদ কমাও:

```php
'passwords' => [
    'users' => [
        'provider' => 'users',
        'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
        'expire' => 15,   // reset link ১৫ মিনিট কাজ করবে
        'throttle' => 60, // পরপর দুটো reset request-এর মাঝে ৬০ সেকেন্ড বিরতি
    ],
],
```

### ৩.৪ `bootstrap/app.php` — দারোয়ানদের নাম দেওয়া আর error-কে JSON বানানো

Laravel 12-তে middleware আর error-handling-এর সেটিং থাকে এই এক ফাইলে।
বর্তমানে সেখানে দুটো খালি closure আছে (`//` লেখা)। পুরো ফাইলটা এটা দিয়ে বদলাও:

```php
<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
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
        // spatie-র দারোয়ানদের ছোট নাম দিলাম, যাতে route-এ 'role:admin' লিখতে পারি
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // /api/... এ কোনো ভুল হলে সবসময় JSON দাও — কখনো HTML পেজ বা redirect নয়
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
    })->create();
```

**ব্যাখ্যা:**

- `$middleware->alias([...])` — spatie-র middleware ক্লাসগুলোর নাম অনেক লম্বা।
  এখানে ছোট নাম (`role`, `permission`) দিয়ে দিলাম। এটা **অবশ্যই** করতে হবে,
  নাহলে route-এ `role:admin` লিখলে "Target class [role] does not exist" error
  আসবে।
- `shouldRenderJsonWhen(...)` — সাধারণত Laravel login না থাকলে HTML দিয়ে
  `/login` পেজে redirect করে। কিন্তু API-র client (mobile app) HTML বোঝে না।
  এই লাইন বলে দেয়: `/api/` দিয়ে শুরু হওয়া সব কিছুতে JSON দাও।
- প্রতিটা `$exceptions->render(...)` একটা নির্দিষ্ট ভুলকে ধরে একটা পরিষ্কার
  JSON উত্তর বানায় — যেমন token না থাকলে `{"message": "Unauthenticated."}` +
  status `401`।

### ৩.৫ CORS — অন্য ঠিকানার frontend-কে ঢুকতে দেওয়া

তোমার API যদি `api.myshop.com`-এ থাকে আর frontend `myshop.com`-এ, তাহলে
browser নিরাপত্তার কারণে ডিফল্টভাবে request আটকে দেয়। CORS সেটিং দিয়ে বলে
দিতে হয় কোন ঠিকানা থেকে request নেবে।

```bash
php artisan config:publish cors
```

এবার `config/cors.php`:

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter([env('FRONTEND_URL')]),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

**ব্যাখ্যা:** `allowed_origins` = কোন ঠিকানা থেকে request নেব। এখানে শুধু
তোমার `FRONTEND_URL`। **কখনো `['*']` (সবাই) লিখো না** authenticated API-তে —
এটা নিরাপত্তার গর্ত।

---

## অংশ ৪ — Role আর Permission তৈরি করা

### ৪.১ Role গুলো database-এ ঢোকানোর জন্য একটা Seeder

**Seeder** = একটা ছোট script যেটা database-এ শুরুর data ঢোকায়।

```bash
php artisan make:seeder RolesAndPermissionsSeeder
```

এবার `database/seeders/RolesAndPermissionsSeeder.php`:

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
        // spatie role/permission 24 ঘণ্টা cache করে রাখে।
        // নতুন role বানানোর আগে সেই cache পরিষ্কার করে নিই।
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // permission = ছোট ছোট নির্দিষ্ট কাজের অনুমতি
        $permissions = [
            'manage own shop',
            'manage own products',
            'view own orders',
            'approve vendors',
            'manage users',
            'manage catalog',
        ];

        foreach ($permissions as $name) {
            // firstOrCreate = থাকলে কিছু করো না, না থাকলে বানাও
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $customer = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $vendor   = Role::firstOrCreate(['name' => 'vendor', 'guard_name' => 'web']);
        $admin    = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        // vendor কে কিছু নির্দিষ্ট permission দিলাম
        $vendor->syncPermissions([
            'manage own shop',
            'manage own products',
            'view own orders',
        ]);

        // admin কে সব permission দিলাম
        $admin->syncPermissions(Permission::all());

        // customer-এর আলাদা permission লাগছে না — তার route গুলো শুধু
        // "login করেছ কিনা" + "এটা কি তোমার জিনিস" দিয়ে পাহারা দেওয়া হবে।
    }
}
```

**খুব গুরুত্বপূর্ণ — `guard_name` সবসময় `'web'` রাখো।** কারণ:
`$user->hasRole('admin')` চেক করার সময় spatie দেখে user-এর "default guard"
কী — এই প্রজেক্টে সেটা `web`। যদি role বানাও `'sanctum'` guard দিয়ে, তাহলে
`hasRole('admin')` **চুপচাপ কখনোই `true` দেবে না** এবং তুমি ঘণ্টার পর ঘণ্টা
মাথা চুলকাবে।

### ৪.২ এই seeder-কে চালু করা + প্রথম admin বানানো

`database/seeders/DatabaseSeeder.php`-এর `run()` মেথড:

```php
public function run(): void
{
    // আগে role গুলো বানাও
    $this->call(RolesAndPermissionsSeeder::class);

    // তারপর একটা admin user বানাও
    $admin = User::factory()->create([
        'name' => 'Admin',
        'email' => env('ADMIN_EMAIL', 'admin@example.com'),
        'password' => bcrypt(env('ADMIN_PASSWORD', 'password')),
        'email_verified_at' => now(),
    ]);
    $admin->assignRole('admin'); // তাকে admin role দাও
}
```

### ৪.৩ কেউ কখন vendor হয়?

Register করলে সবাই `customer` পায়। কেউ **vendor** হয় যখন admin তার আবেদন
(`Vendor` record) approve করে। তোমার বিদ্যমান approval কোডে শুধু এই লাইনটা
যোগ করো:

```php
$vendor->user->syncRoles(['vendor']);
```

---

## অংশ ৫ — User model ঠিক করা

**Model** = একটা PHP ক্লাস যা একটা database টেবিলকে represent করে।
`User` model = `users` টেবিল।

`app/Models/User.php` পুরোটা এটা দিয়ে বদলাও:

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

    // যে কলামগুলোতে বাইরের data দিয়ে ভরা যাবে
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    // যে কলামগুলো কখনো JSON-এ বেরোবে না
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed', // password সেট করলেই আপনাআপনি hash হবে
        ];
    }

    public function vendors()
    {
        return $this->hasMany(Vendor::class);
    }

    // user-এর role অনুযায়ী তার token কী কী করতে পারবে
    public function tokenAbilities(): array
    {
        return match (true) {
            $this->hasRole('admin') => ['*'], // সব কিছু
            $this->hasRole('vendor') => ['shop:manage', 'products:manage', 'orders:view'],
            default => ['orders:view', 'cart:manage', 'profile:manage'], // customer
        };
    }
}
```

**ব্যাখ্যা:**

- **`use HasApiTokens`** — এই এক লাইন `User`-কে `$user->createToken(...)`
  করার ক্ষমতা দেয়। (আগে থেকেই ছিল।)
- **`use HasRoles`** — এটা `$user->assignRole(...)`, `$user->hasRole(...)`
  দেয়। এটা নতুন যোগ করলাম।
- **`implements MustVerifyEmail`** — এটা লিখলে Laravel বুঝে যায় "এই user-দের
  email verify করাতে হবে" এবং register-এর সময় verification email পাঠায়।
- **`'password' => 'hashed'`** — এটার জন্য `User::create(['password' => 'abc'])`
  লিখলে `abc` আপনাআপনি hash হয়ে database-এ যায়। তুমি কখনো নিজে hash করবে না।
- **`$hidden`** — নিরাপত্তার দ্বিতীয় স্তর। ভুল করেও যদি কোথাও পুরো user object
  JSON-এ পাঠাও, `password` তবু বেরোবে না।

---

## অংশ ৬ — Form Request (data যাচাই করার আলাদা ক্লাস)

**Form Request** = একটা ক্লাস যার একমাত্র কাজ: "আসা data ঠিক আছে কিনা যাচাই
করা"। এটা controller-এ ঢোকার **আগেই** চলে। ভুল data হলে controller-এর কোড
কখনো চলবেই না — Laravel নিজে থেকে `422` JSON ফেরত দেবে।

**কেন controller-এ না লিখে আলাদা ক্লাসে?** — controller তখন শুধু আসল কাজে
মন দিতে পারে, আর একই যাচাই বহু জায়গায় ব্যবহার করা যায়।

এগুলো বানাও:

```bash
php artisan make:request Auth/RegisterRequest
php artisan make:request Auth/LoginRequest
php artisan make:request Auth/ForgotPasswordRequest
php artisan make:request Auth/ResetPasswordRequest
php artisan make:request Auth/ChangePasswordRequest
```

### `RegisterRequest.php`

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    // এই কাজটা করার জন্য login লাগে কি? না — যে কেউ register করতে পারে।
    public function authorize(): bool
    {
        return true;
    }

    // যাচাইয়ের নিয়ম
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

**নিয়মগুলো পড়ার নিয়ম:** প্রতিটা field-এর জন্য একটা list।

- `required` — দিতেই হবে
- `email:rfc,dns` — সত্যিকারের email ফরম্যাট, এবং domain-টা আসল কিনা
- `unique:users,email` — `users` টেবিলে এই email আগে থেকে থাকলে চলবে না
- `confirmed` — একটা `password_confirmation` field-ও পাঠাতে হবে এবং দুটো মিলতে হবে
- `Password::defaults()` — আমাদের ঠিক করা password নিয়ম (নিচে অংশ ৬-এর শেষে)
- `sometimes` — field-টা থাকলে যাচাই করো, না থাকলে বাদ

### `LoginRequest.php` — এটাতে "বেশি চেষ্টা করলে থামাও" লজিকও আছে

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

    // "কার চেষ্টা গুনছি" তার চাবি: email + IP মিলিয়ে
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }

    // এই চাবিতে ১ মিনিটে ৫ বারের বেশি চেষ্টা হয়ে গেলে থামিয়ে দাও
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return; // এখনো সীমা পার হয়নি, চালিয়ে যাও
        }

        event(new Lockout($this)); // চাইলে log/alert করার জন্য একটা event

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => "Too many login attempts. Try again in {$seconds} seconds.",
        ])->status(429);
    }
}
```

**কেন email+IP একসাথে?**
- শুধু IP দিয়ে গুনলে — একই অফিসের সব লোক একই IP-তে থাকে, একজন ভুল করলে
  সবাই আটকে যায়।
- শুধু email দিয়ে গুনলে — একজন শত্রু ইচ্ছে করে বারবার ভুল password দিয়ে
  তোমার account লক করে দিতে পারে।
- দুটো মিলিয়ে — মাঝামাঝি নিরাপদ সমাধান।

### `ForgotPasswordRequest.php`

`rules()` মেথডের ভেতরে:

```php
public function rules(): array
{
    return [
        'email' => ['required', 'string', 'email'],
    ];
}
```

### `ResetPasswordRequest.php`

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

### `ChangePasswordRequest.php`

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

`current_password` — Laravel-এর তৈরি নিয়ম, যা চেক করে দেওয়া মানটা এখন
login করা user-এর আসল password কিনা। `different:current_password` — নতুন
password পুরনোটার মতো হলে চলবে না।

### Password-এর নিয়ম একজায়গায় ঠিক করা

`app/Providers/AppServiceProvider.php`-এর `boot()` মেথডে:

```php
use Illuminate\Validation\Rules\Password;

Password::defaults(fn () => Password::min(8)
    ->letters()      // অন্তত একটা অক্ষর
    ->mixedCase()    // বড় আর ছোট হাতের দুটোই
    ->numbers()      // অন্তত একটা সংখ্যা
    ->uncompromised() // আগে কোনো ডেটা-লিকে ফাঁস হওয়া password হলে বাতিল
);
```

`uncompromised()` — Laravel একটা পাবলিক সার্ভিসে (নিরাপদভাবে, পুরো password
না পাঠিয়ে) চেক করে password-টা আগে কখনো hack হওয়া list-এ আছে কিনা।

---

## অংশ ৭ — Controller (আসল কাজ)

**Controller** = যে ক্লাস আসল কাজটা করে। একটা request এলে route ঠিক করে
কোন controller-এর কোন মেথড চলবে।

```bash
php artisan make:controller Api/Auth/RegisteredUserController
php artisan make:controller Api/Auth/AuthenticatedSessionController
php artisan make:controller Api/Auth/EmailVerificationController
php artisan make:controller Api/Auth/PasswordResetLinkController
php artisan make:controller Api/Auth/NewPasswordController
php artisan make:controller Api/Auth/PasswordController
php artisan make:controller Api/Auth/ProfileController
```

### ৭.১ Register — নতুন account

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
    // RegisterRequest টাইপ লেখার কারণেই যাচাই আপনাআপনি হয়ে যায়
    public function store(RegisterRequest $request): JsonResponse
    {
        // যাচাই-করা data থেকে শুধু এই ৩টা field নিয়ে user বানাও
        $user = User::create($request->safe()->only('name', 'email', 'password'));

        $user->assignRole('customer'); // নতুন সবাই customer

        event(new Registered($user)); // → verification email পাঠায়

        // token বানাও, তার নাম আর ক্ষমতা সেট করো
        $token = $user->createToken(
            $request->string('device_name', 'api')->value(),
            $user->tokenAbilities(),
        )->plainTextToken;

        // 201 = নতুন কিছু তৈরি হয়েছে
        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }
}
```

**`$request->safe()->only(...)` কেন?** — যাচাই পাস করলেও তুমি নিজে ঠিক করে
দাও ঠিক কোন কোন field দিয়ে user বানাবে। কেউ যদি request-এ লুকিয়ে
`"role": "admin"` পাঠায়, এতে সেটা উপেক্ষা হয়। (যাচাই মানেই নিরাপত্তা নয়।)

### ৭.২ Login আর Logout

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
        $request->ensureIsNotRateLimited(); // বেশি চেষ্টা হলে এখানেই থেমে যাবে

        $user = User::where('email', $request->string('email'))->first();

        // user নেই, অথবা password মেলেনি
        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            RateLimiter::hit($request->throttleKey()); // ব্যর্থ চেষ্টা গোনো

            // ইচ্ছাকৃতভাবে অস্পষ্ট বার্তা — "email নেই" বলা যাবে না
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        RateLimiter::clear($request->throttleKey()); // সফল → গোনা রিসেট

        $token = $user->createToken(
            $request->string('device_name', 'api')->value(),
            $user->tokenAbilities(),
        )->plainTextToken;

        return response()->json([
            'user' => new UserResource($user->load('roles')),
            'token' => $token,
        ]);
    }

    // এই device থেকে logout — শুধু এখনকার token মুছে দাও
    public function destroy(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    // সব device থেকে logout — user-এর সব token মুছে দাও
    public function destroyAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out from all devices.']);
    }
}
```

**"email নেই" কেন বলা যাবে না?** — শত্রু তখন একটা একটা করে email দিয়ে বুঝে
ফেলবে কোন কোন email-এ account আছে। তাই password ভুল হোক বা email-ই না থাকুক —
বার্তা একই: "These credentials do not match our records."

**`Hash::check($input, $stored)`** — তোমার দেওয়া password hash করে সংরক্ষিত
hash-এর সাথে মেলায়। মিললে `true`।

### ৭.৩ Email verification

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
    // user ইমেইলের link-এ ক্লিক করলে frontend এই endpoint-এ আসে
    public function verify(Request $request, string $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        // link-এর hash আর user-এর email-এর hash মেলে কিনা
        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->markEmailAsVerified(); // database-এ email_verified_at বসাও
        event(new Verified($user));

        return response()->json(['message' => 'Email verified.']);
    }

    // "verification email আবার পাঠাও" — login করা user-এর জন্য
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

এই route-টা `signed` middleware দিয়ে পাহারা দেওয়া হবে (অংশ ৯ দেখো), তাই কেউ
link-এর কোনো অংশ পাল্টালে আমাদের কোড চলার আগেই request বাতিল হয়।

### ৭.৪ Password ভুলে গেছে / reset

`PasswordResetLinkController.php` (link পাঠায়):

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
        // Laravel নিজে reset link বানিয়ে email করে দেয়
        Password::sendResetLink($request->only('email'));

        // email থাকুক বা না থাকুক — উত্তর একই (enumeration ঠেকাতে)
        return response()->json([
            'message' => 'If that email is registered, a reset link has been sent.',
        ]);
    }
}
```

`NewPasswordController.php` (নতুন password সেট করে):

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

                // নিরাপত্তা: password বদলালে পুরনো সব token বাতিল
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        // status ঠিক না হলে (token ভুল/মেয়াদ শেষ) error দাও
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return response()->json(['message' => 'Password reset successful.']);
    }
}
```

### ৭.৫ Login করা অবস্থায় password বদলানো

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

        // এখনকার device চালু থাকুক, বাকি সব device বের করে দাও
        $user->tokens()
            ->where('id', '!=', $user->currentAccessToken()->id)
            ->delete();

        return response()->json(['message' => 'Password updated.']);
    }
}
```

### ৭.৬ নিজের তথ্য দেখা — `/me`

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
        // $request->user() = token দেখে চিনে নেওয়া user
        return new UserResource($request->user()->load('roles'));
    }
}
```

---

## অংশ ৮ — UserResource (বাইরে কী তথ্য যাবে)

**Resource** = রিসেপশনিস্টের মতো। User object-এ অনেক তথ্য (password hash সহ)।
Resource ঠিক করে দেয় বাইরের JSON-এ ঠিক কোনগুলো যাবে।

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
                $request->user()?->is($this->resource), // শুধু নিজের তথ্য দেখলে
                fn () => $this->getAllPermissions()->pluck('name'),
            ),
            'created_at' => $this->created_at,
        ];
    }
}
```

এখানে `password` বা `remember_token` লিখিনি — তাই কখনো বেরোবে না।
`whenLoaded('roles', ...)` — role গুলো আগে থেকে load করা থাকলেই তবে দেখাও
(বাড়তি database query এড়াতে)।

---

## অংশ ৯ — Routes (কোন URL → কোন কোড)

**Route** = URL আর কোডের মধ্যে সংযোগ। `routes/api.php`-এ লেখা প্রতিটা route
আপনাআপনি `/api/` দিয়ে শুরু হয়।

`routes/api.php` পুরোটা এটা দিয়ে বদলাও:

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

// ---------- যে route-এ login লাগে না ----------

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

// ---------- যে route-এ login (token) লাগে ----------

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me', [ProfileController::class, 'show'])->name('me');

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::post('/logout-all', [AuthenticatedSessionController::class, 'destroyAll'])->name('logout.all');

    Route::put('/password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:verification')
        ->name('verification.send');

    // login + email verified — দুটোই লাগবে এমন route
    Route::middleware('verified')->group(function () {
        // Route::post('/checkout', CheckoutController::class);
    });

    // শুধু vendor
    Route::middleware('role:vendor')->prefix('vendor')->group(function () {
        // Route::apiResource('products', VendorProductController::class);
    });

    // শুধু admin
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // Route::post('vendors/{vendor}/approve', [VendorApprovalController::class, 'store']);
    });
});
```

**middleware চেইনটা এভাবে পড়ো** (দারোয়ানরা একের পর এক):

- `throttle:login` → "১ মিনিটে বেশিবার এসো না"
- `auth:sanctum` → "token দেখাও, নাহলে 401"
- `verified` → "email verify করেছ? না হলে আটকাও"
- `role:admin` → "তুমি admin? না হলে 403"

`signed` → link-এ ডিজিটাল স্বাক্ষর আছে, কেউ পাল্টালে ধরা পড়ে। তাই
verification link-এ আলাদা করে login লাগে না — স্বাক্ষরই প্রমাণ।

Skeleton-এ থাকা পুরনো `/user` আর `/test` route মুছে দাও।

---

## অংশ ১০ — Rate limiting (বেশি চেষ্টা থামানো)

**Rate limiting** = "একটা নির্দিষ্ট সময়ে এতবারের বেশি করা যাবে না"।
Brute-force (হাজার হাজার password চেষ্টা) ঠেকায়।

`app/Providers/AppServiceProvider.php`-এর `boot()`-এ:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

// login: প্রতি (email+IP) জোড়ায় মিনিটে ৫ বার
RateLimiter::for('login', fn (Request $r) => Limit::perMinute(5)->by(
    Str::transliterate(Str::lower($r->input('email')).'|'.$r->ip())
));

// register: প্রতি IP-তে মিনিটে ৩ বার
RateLimiter::for('register', fn (Request $r) => Limit::perMinute(3)->by($r->ip()));

// password reset email: দুই স্তরে সীমা — দুটোই মানতে হবে
RateLimiter::for('password-email', fn (Request $r) => [
    Limit::perMinute(2)->by(Str::lower($r->input('email')).'|'.$r->ip()),
    Limit::perMinute(5)->by($r->ip()),
]);

// verification email আবার পাঠানো
RateLimiter::for('verification', fn (Request $r) => Limit::perMinute(6)->by(
    optional($r->user())->id ?: $r->ip()
));
```

route-এ `->middleware('throttle:login')` লিখলে Laravel এই `'login'` নিয়মটা
প্রয়োগ করে। সীমা ছাড়ালে user পায় `429` + একটা "কতক্ষণ পর আবার চেষ্টা করবে"
তথ্য।

### Token pruning schedule করা

মেয়াদোত্তীর্ণ token নিজে থেকে মোছে না। `routes/console.php`-এ:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

এটা রোজ একবার চলে পুরনো token পরিষ্কার করে। এর জন্য সার্ভারে scheduler চালু
থাকতে হয় (dev-এ `php artisan schedule:work`, প্রোডাকশনে একটা cron)।

---

## অংশ ১১ — Email verification আর reset link-কে frontend-এ পাঠানো

API-র নিজের কোনো "verify" পেজ নেই — ওটা তোমার React/Next app-এর। তাই email-এর
link যেন frontend-এ যায়, সেটা `AppServiceProvider::boot()`-এ ঠিক করে দাও:

```php
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;

VerifyEmail::createUrlUsing(function ($notifiable) {
    // API-র signed URL বানাও (৬০ মিনিট বৈধ)
    $signed = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
        'id' => $notifiable->getKey(),
        'hash' => sha1($notifiable->getEmailForVerification()),
    ]);

    // frontend-এর পেজে পাঠাও, signed URL-টা query হিসেবে জুড়ে দাও
    return config('app.frontend_url').'/verify-email?url='.urlencode($signed);
});

ResetPassword::createUrlUsing(fn ($notifiable, string $token) =>
    config('app.frontend_url')."/reset-password?token={$token}&email=".urlencode($notifiable->getEmailForPasswordReset())
);
```

`config/app.php`-এ যোগ করো:

```php
'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
```

**পুরো flow:** user email-এর link-এ ক্লিক করে → frontend-এর পেজ খোলে →
frontend query থেকে `url`/`token` নেয় → frontend API-কে call করে → API JSON
দেয় → frontend "সফল" দেখায়।

### Local-এ email কোথায় যায়

`.env`-এ `MAIL_MAILER=log` — তাই email আসলে পাঠায় না, `storage/logs/laravel.log`
ফাইলে লিখে রাখে। টেস্ট করার সময় সেখান থেকে link কপি করো। (অথবা Mailpit
ব্যবহার করো — একটা লোকাল inbox।)

Email দ্রুত পাঠাতে queue ব্যবহার হয় — `php artisan queue:work` চালু রাখো,
নাহলে register response দেরি করবে। (`composer dev` কমান্ড এটা এমনিতেই চালায়।)

---

## অংশ ১২ — Test লেখা

Test = ছোট ছোট কোড যা নিজে থেকে তোমার API চালিয়ে দেখে সব ঠিক আছে কিনা।
একবার লিখে রাখলে পরে কিছু ভাঙলে সাথে সাথে ধরা পড়ে।

### ১২.১ Test-এ database রিফ্রেশ চালু করা

`tests/Pest.php`-এ `pest()->extend(...)` লাইনটা এমন করো:

```php
pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature');
```

`RefreshDatabase` — প্রতিটা test-এর আগে database খালি করে দেয়, যাতে test-রা
একে অন্যকে প্রভাবিত না করে।

আর একটা helper যোগ করো `tests/Pest.php`-এ:

```php
function seedRoles(): void
{
    Illuminate\Support\Facades\Artisan::call('db:seed', [
        '--class' => Database\Seeders\RolesAndPermissionsSeeder::class,
    ]);
}
```

### ১২.২ Registration test — `tests/Feature/Auth/RegistrationTest.php`

```php
<?php

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;

beforeEach(fn () => seedRoles());

it('registers a user, assigns customer role, returns a token', function () {
    Event::fake(); // সত্যিকারের email পাঠাতে দিও না

    $response = $this->postJson('/api/register', [
        'name' => 'Jane',
        'email' => 'jane@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ]);

    $response->assertCreated() // 201?
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
```

### ১২.৩ Login test — `tests/Feature/Auth/LoginTest.php`

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
    $this->postJson('/api/login', ['email' => 'ghost@example.com', 'password' => 'x'])
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

### ১২.৪ Session test — `tests/Feature/Auth/SessionTest.php`

```php
<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(fn () => seedRoles());

it('requires a token for /me', function () {
    $this->getJson('/api/me')->assertUnauthorized(); // 401
});

it('returns the current user for a valid token', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user); // "ধরে নাও এই user login করা"

    $this->getJson('/api/me')->assertOk()->assertJsonPath('data.id', $user->id);
});

it('logout revokes only the current token', function () {
    $user = User::factory()->create();
    $a = $user->createToken('a')->plainTextToken;
    $user->createToken('b');

    $this->withToken($a)->postJson('/api/logout')->assertOk();

    expect($user->fresh()->tokens()->count())->toBe(1); // 'b' টিকে থাকল
});

it('logout-all revokes every token', function () {
    $user = User::factory()->create();
    $a = $user->createToken('a')->plainTextToken;
    $user->createToken('b');

    $this->withToken($a)->postJson('/api/logout-all')->assertOk();

    expect($user->fresh()->tokens()->count())->toBe(0);
});
```

### ১২.৫ Email verification test — `tests/Feature/Auth/EmailVerificationTest.php`

```php
<?php

use App\Models\User;
use Illuminate\Support\Facades\URL;

beforeEach(fn () => seedRoles());

it('verifies from a valid signed link', function () {
    $user = User::factory()->unverified()->create();

    $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
        'id' => $user->id,
        'hash' => sha1($user->email),
    ]);

    $this->getJson($url)->assertOk();
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('rejects a tampered link', function () {
    $user = User::factory()->unverified()->create();

    $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
        'id' => $user->id,
        'hash' => sha1('wrong@example.com'),
    ]);

    $this->getJson($url)->assertStatus(403);
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});
```

### ১২.৬ Password reset test — `tests/Feature/Auth/PasswordResetTest.php`

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
});
```

### ১২.৭ Role access test — `tests/Feature/Auth/RoleAccessTest.php`

```php
<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    seedRoles();

    // শুধু এই test-এর জন্য একটা ছোট admin-only route
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

চালাও:

```bash
php artisan test --filter=Auth
```

---

## অংশ ১৩ — নিজের হাতে চালিয়ে দেখা (end-to-end)

```bash
php artisan migrate:fresh --seed   # database নতুন করে বানাও + seed করো
php artisan serve                  # টার্মিনাল ১: সার্ভার চালাও
php artisan queue:work             # টার্মিনাল ২: email পাঠায়
```

আরেকটা টার্মিনালে (curl = কমান্ড লাইন থেকে request পাঠানোর টুল):

```bash
BASE=http://127.0.0.1:8000/api

# ১. Register
curl -sS -X POST $BASE/register -H 'Accept: application/json' \
  -d 'name=Jane' -d 'email=jane@example.com' \
  -d 'password=Password1!' -d 'password_confirmation=Password1!'
# → উত্তরে "token" দেখতে পাবে, সেটা কপি করো

TOKEN=<এখানে token বসাও>

# ২. নিজের তথ্য দেখা
curl -sS $BASE/me -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json'

# ৩. Login (নতুন token)
curl -sS -X POST $BASE/login -H 'Accept: application/json' \
  -d 'email=jane@example.com' -d 'password=Password1!'

# ৪. Logout
curl -sS -X POST $BASE/logout -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json'

# ৫. Logout করার পর আবার /me → এবার 401 আসবে
curl -sS $BASE/me -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json'
```

তারপর:

```bash
php artisan test          # সব test পাস করছে?
./vendor/bin/pint --dirty # কোড ফরম্যাট ঠিক করে
```

---

## অংশ ১৪ — Production-এ যাওয়ার আগে চেকলিস্ট

- [ ] `.env`-এ `APP_DEBUG=false`
- [ ] সাইট HTTPS-এ চলছে (http নয়)
- [ ] `config/sanctum.php`-এ `expiration` সেট করা + `sanctum:prune-expired` schedule করা
- [ ] `config/cors.php`-এ `allowed_origins` তোমার আসল frontend ঠিকানা, কখনো `*` নয়
- [ ] প্রতিটা auth route-এ `throttle:...` middleware আছে
- [ ] `Password::defaults()`-এ `->uncompromised()` আছে
- [ ] Checkout, review — এসব জায়গায় `verified` middleware বসানো
- [ ] Email পাঠানোর জন্য একটা queue worker সবসময় চলছে
- [ ] `.env` কখনো git-এ push হয়নি

---

## অংশ ১৫ — শব্দকোষ (এক নজরে সব term)

| শব্দ | সহজ মানে |
| --- | --- |
| **Request** | client → সার্ভার-এ পাঠানো অনুরোধ |
| **Response** | সার্ভার → client উত্তর |
| **Header** | request/response-এর সাথের ছোট বাড়তি তথ্য |
| **Status code** | উত্তরের সাথের সংখ্যা (200, 401, 403...) |
| **JSON** | মেশিনের পড়ার উপযোগী data ফরম্যাট |
| **Endpoint** | একটা URL + method যা একটা কাজ করে |
| **Token** | login-এর পর পাওয়া গোপন string, প্রতি request-এ পাঠাতে হয় |
| **Bearer** | header-এ token পাঠানোর স্ট্যান্ডার্ড ধরন (`Authorization: Bearer ...`) |
| **Hash** | একমুখী রূপান্তর — output থেকে input ফেরত পাওয়া যায় না |
| **Authentication** | "তুমি কে?" যাচাই |
| **Authorization** | "তোমার অনুমতি আছে?" যাচাই |
| **Guard** | user-কে কীভাবে চিনব তার নিয়ম (`web` = cookie, `sanctum` = token) |
| **Middleware** | request-কে controller-এ পৌঁছানোর আগে পাহারাদার |
| **Controller** | আসল কাজ করা ক্লাস |
| **Form Request** | data যাচাইয়ের আলাদা ক্লাস |
| **Resource** | বাইরে কোন তথ্য যাবে তা ঠিক করা ক্লাস |
| **Model** | database টেবিলের প্রতিনিধি PHP ক্লাস |
| **Migration** | database টেবিলের গঠন কোড দিয়ে বানানো |
| **Seeder** | শুরুর data ঢোকানোর script |
| **Role** | পদবি (customer / vendor / admin) |
| **Permission** | নির্দিষ্ট ছোট কাজের অনুমতি |
| **Rate limiting** | নির্দিষ্ট সময়ে সর্বোচ্চ কতবার করা যাবে তার সীমা |
| **CORS** | কোন ঠিকানার frontend API-তে request করতে পারবে |
| **Sanctum** | Laravel-এর token package |
| **spatie/laravel-permission** | role ও permission-এর package |

---

## অংশ ১৬ — এই গাইডের বাইরে (পরে দরকার হলে)

| যা চাও | যা ব্যবহার করবে |
| --- | --- |
| SMS/App দিয়ে two-factor (2FA) | `laravel/fortify` |
| "Google দিয়ে login" | `laravel/socialite` |
| সম্পূর্ণ OAuth2 সার্ভার (তুমি অন্য কোম্পানিকে token দাও) | `laravel/passport` |
| user-এর সব device দেখা/সরানোর পেজ | `personal_access_tokens` টেবিল থেকে list বানাও |
