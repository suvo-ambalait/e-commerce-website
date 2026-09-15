<?php


use Illuminate\Support\Facades\Route;



Route::get('/test', function () {
    return response()->json(['message' => 'Test route is working!']);
});

Route::prefix('v1')->group(function () {
    require __DIR__ . '/auth.php';
});


