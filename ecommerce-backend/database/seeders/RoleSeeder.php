<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'super-admin',
                'system_name' => 'Super Admin',
                'color' => '#FF0000',
                'description' => 'System administrator with full access',
            ],
            [
                'name' => 'admin',
                'system_name' => 'Admin',
                'color' => '#00FF00',
                'description' => 'Standard administrator with limited access',
            ],
            [
                'name' => 'vendor',
                'system_name' => 'Vendor',
                'color' => '#0000FF',
                'description' => 'Vendor with selling privileges',
            ],
            [
                'name' => 'customer',
                'system_name' => 'Customer',
                'color' => '#FFFF00',
                'description' => 'Customer with purchasing privileges',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                [
                    'name' => $role['name'],
                    'guard_name' => 'web',
                ],
                [
                    'system_name' => $role['system_name'],
                    'color' => $role['color'],
                    'description' => $role['description'],
                    'is_default' => true,
                ]
            );
        }
    }
}