<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'E-Commerce API',
    description: 'API documentation for the e-commerce platform.'
)]
#[OA\Server(
    url: L5_SWAGGER_CONST_HOST,
    description: 'API server'
)]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Sanctum token',
    description: 'Enter the Sanctum token obtained from login/register as a bearer token.'
)]
abstract class Controller
{
    //
}
