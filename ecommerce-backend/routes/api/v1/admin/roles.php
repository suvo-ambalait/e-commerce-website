<?php

use App\Http\Controllers\Api\V1\Auth\RoleController;
use Illuminate\Support\Facades\Route;

/*
| Admin: roles  (/v1/admin/roles)
| auth:sanctum + role:super-admin|admin is applied in routes/api/v1.php.
*/

Route::get('/roles', [RoleController::class, 'index']);
Route::post('/roles', [RoleController::class, 'store']);
