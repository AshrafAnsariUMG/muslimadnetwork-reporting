<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@muslimadnetwork.com'],
            [
                'name' => 'Admin',
                'email' => 'admin@muslimadnetwork.com',
                'password' => Hash::make('Admin@1234'),
                'role' => UserRole::Admin,
                'client_id' => null,
            ]
        );
    }
}
