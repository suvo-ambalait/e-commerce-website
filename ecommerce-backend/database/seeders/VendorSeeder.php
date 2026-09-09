<?php

namespace Database\Seeders;

use App\Models\Shop;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class VendorSeeder extends Seeder
{
    /**
     * Each entry becomes a user + an approved vendor + an approved shop.
     */
    private array $shops = [
        ['shop' => 'Lumen Atelier',   'owner' => 'Mira Haldorsen', 'city' => 'Oslo, NO'],
        ['shop' => 'Terra Ceramics',  'owner' => 'Anders Vik',     'city' => 'Bergen, NO'],
        ['shop' => 'Halden Woodworks', 'owner' => 'Sofia Berg',    'city' => 'Halden, NO'],
        ['shop' => 'Nord Textiles',   'owner' => 'Elias Moen',     'city' => 'Trondheim, NO'],
        ['shop' => 'Fjord Leather',   'owner' => 'Ingrid Sund',    'city' => 'Stavanger, NO'],
    ];

    public function run(): void
    {
        foreach ($this->shops as $data) {
            $slug = Str::slug($data['shop']);

            $user = User::updateOrCreate(
                ['email' => "{$slug}@vendor.morerdokan.test"],
                [
                    'name' => $data['owner'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ],
            );

            $vendor = Vendor::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'phone_number' => fake()->numerify('+47 ### ## ###'),
                    'nid_number' => fake()->unique()->numerify('##########'),
                    'nid_front_image' => 'vendors/kyc/nid-front-placeholder.jpg',
                    'nid_back_image' => 'vendors/kyc/nid-back-placeholder.jpg',
                    'trade_license_number' => fake()->unique()->bothify('TL-#######'),
                    'trade_license_image' => 'vendors/kyc/trade-license-placeholder.jpg',
                    'bank_account_number' => fake()->numerify('##############'),
                    'bank_name' => fake()->randomElement(['DNB', 'Nordea', 'SpareBank 1', 'Handelsbanken']),
                    'bank_branch' => $data['city'],
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => 'system-seeder',
                ],
            );

            Shop::updateOrCreate(
                ['slug' => $slug],
                [
                    'vendor_id' => $vendor->id,
                    'name' => $data['shop'],
                    'email' => "{$slug}@shop.morerdokan.test",
                    'logo' => null,
                    'description' => "{$data['shop']} — handmade goods from {$data['city']}.",
                    'address' => $data['city'],
                    'phone_number' => $vendor->phone_number,
                    'status' => 'approved',
                ],
            );
        }
    }
}
