<?php

Route::prefix('v1')->group(function () {
    require __DIR__ . '/auth.php';
});