<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed the users table with a known admin, a known customer and a
     * handful of random shoppers. Safe to run repeatedly.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@morerdokan.test'],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'customer@morerdokan.test'],
            [
                'name' => 'Jordan Rivera',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        if (User::count() < 20) {
            User::factory()->count(15)->create();
        }
    }
}
