<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /***
     * Get all roles
     */
    #[OA\Get(
        path: '/v1/admin/roles',
        tags: ['Auth'],
        summary: 'Get all roles',
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
    public function index(Request $request)
    {
        $roles = Role::all(); // Fetch all roles from the database
        return response()->json(['roles' => $roles]);
    }

    /***
     * Create a new role
     */

    #[OA\Post(
        path: '/v1/auth/admin/roles',
        tags: ['Auth'],
        summary: 'Create a new role',
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', description: 'The name of the role', example: 'admin')
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Role created successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'role', ref: '#/components/schemas/Role')
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:50|unique:roles,name',
        ]);

        $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);

        return response()->json(['message' => 'Role created successfully!', 'role' => $role], 201);
    }


    /***
     * Delete a role
     */
    #[OA\Delete(
        path: '/v1/admin/roles/{id}',
        tags: ['Auth'],
        summary: 'Delete a role',
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                description: 'The ID of the role to delete',
                required: true,
                schema: new OA\Schema(type: 'string')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Role deleted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string')
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Role not found'),
        ]
    )]
    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();

        return response()->json(['message' => 'Role deleted successfully!']);
    }
     
}