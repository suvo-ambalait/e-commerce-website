<?php
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\EmailController;


Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/auth/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

Route::post('/auth/email/send', [EmailController::class, 'sendVerificationEmail'])->middleware('throttle:5,1');
Route::post('/auth/email/verify', [EmailController::class, 'verifyEmail'])->middleware('throttle:10,1');
Route::post('/auth/email/resend', [EmailController::class, 'resendVerificationEmail'])->middleware('throttle:5,1');