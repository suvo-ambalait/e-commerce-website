<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 routes, grouped by who can call them
|--------------------------------------------------------------------------
|
| public/    No login needed. Guests and every role.
| customer/  Any logged-in user (customers, and vendors/admins shopping).
| vendor/    Logged-in users with the "vendor" role. URLs start with /vendor.
| admin/     Logged-in "super-admin" or "admin". URLs start with /admin.
|
| Role and auth middleware is applied here once per group, so the files
| inside each folder only define their own routes.
|
*/

Route::prefix('v1')->group(function () {

    // Login, register, logout, email verification.
    require __DIR__ . '/v1/auth.php';

    // Public: guests and everyone.
    require __DIR__ . '/v1/public/catalog.php';
    require __DIR__ . '/v1/public/shops.php';
    require __DIR__ . '/v1/public/cart.php';
    require __DIR__ . '/v1/public/checkout.php';
    require __DIR__ . '/v1/public/settings.php';

    // Customer: any authenticated user.
    Route::middleware('auth:sanctum')->group(function () {
        require __DIR__ . '/v1/customer/orders.php';
        require __DIR__ . '/v1/customer/wishlist.php';
        require __DIR__ . '/v1/customer/addresses.php';
        require __DIR__ . '/v1/customer/reviews.php';
        require __DIR__ . '/v1/customer/vendor-application.php';
    });

    // Vendor: /v1/vendor/...
    Route::prefix('vendor')
        ->middleware(['auth:sanctum', 'role:vendor'])
        ->group(function () {
            require __DIR__ . '/v1/vendor/dashboard.php';
            require __DIR__ . '/v1/vendor/shop.php';
            require __DIR__ . '/v1/vendor/products.php';
            require __DIR__ . '/v1/vendor/inventory.php';
            require __DIR__ . '/v1/vendor/orders.php';
            require __DIR__ . '/v1/vendor/payouts.php';
            require __DIR__ . '/v1/vendor/reviews.php';
        });

    // Admin: /v1/admin/...
    Route::prefix('admin')
        ->middleware(['auth:sanctum', 'role:super-admin|admin'])
        ->group(function () {
            require __DIR__ . '/v1/admin/dashboard.php';
            require __DIR__ . '/v1/admin/roles.php';
            require __DIR__ . '/v1/admin/customers.php';
            require __DIR__ . '/v1/admin/vendors.php';
            require __DIR__ . '/v1/admin/catalog.php';
            require __DIR__ . '/v1/admin/inventory.php';
            require __DIR__ . '/v1/admin/orders.php';
            require __DIR__ . '/v1/admin/discounts.php';
            require __DIR__ . '/v1/admin/reviews.php';
            require __DIR__ . '/v1/admin/settings.php';
        });
});
