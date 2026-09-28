<?php
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\EmailController;


Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/admin/login', [AuthController::class, 'adminLogin'])->middleware('throttle:5,1');

    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');
    Route::get('/user/roles', [AuthController::class, 'getUserRoles'])->middleware(['auth:sanctum', 'role:super-admin|admin', 'throttle:10,1',]);
    Route::post('/email/send', [EmailController::class, 'sendVerificationEmail'])->middleware('throttle:5,1');
    Route::post('/email/verify', [EmailController::class, 'verifyEmail'])->middleware('throttle:10,1');
    Route::post('/email/resend', [EmailController::class, 'resendVerificationEmail'])->middleware('throttle:5,1');
});