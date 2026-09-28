<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function store(Request $request) {
        $request->validate([
            'name' => 'required|string|max:50|unique:roles,name',
        ]);

        $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);

        return response()->json(['message' => 'Role created successfully!', 'role' => $role], 201);
    }
     // Get User Roles method
    #[OA\Get(
        path: '/v1/auth/admin/user/roles',
        tags: ['Auth'],
        summary: 'Get the roles of the authenticated user',
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User roles',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'roles', type: 'array', items: new OA\Items(type: 'string'))
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function getUserRoles(Request $request) {
        $roles = Role::all(); // Fetch all roles from the database
        return response()->json(['roles' => $roles]);
    }
}