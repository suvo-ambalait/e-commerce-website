<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\EmailController;
use Illuminate\Support\Facades\Route;

/*
| Auth: /v1/auth/...
| Guest endpoints plus a few that need a logged-in user of any role.
*/

Route::prefix('auth')->group(function () {
    // Guest
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/admin/login', [AuthController::class, 'adminLogin'])->middleware('throttle:5,1');

    Route::post('/email/send', [EmailController::class, 'sendVerificationEmail'])->middleware('throttle:5,1');
    Route::post('/email/verify', [EmailController::class, 'verifyEmail'])->middleware('throttle:10,1');
    Route::post('/email/resend', [EmailController::class, 'resendVerificationEmail'])->middleware('throttle:5,1');

    // Any logged-in user
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });
});
