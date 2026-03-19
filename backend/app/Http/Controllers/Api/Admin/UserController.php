<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::with('client')->get();

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role' => ['required', Rule::in(['admin', 'client'])],
            'client_id' => [
                Rule::requiredIf(fn () => $request->input('role') === 'client'),
                'nullable',
                'exists:clients,id',
            ],
        ]);

        $plainPassword = Str::password(16);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'client_id' => $data['client_id'] ?? null,
            'password' => Hash::make($plainPassword),
        ]);

        $user->load('client');

        return response()->json([
            'user' => $user,
            'generated_password' => $plainPassword,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($id)],
            'role' => ['sometimes', Rule::in(['admin', 'client'])],
            'client_id' => ['nullable', 'exists:clients,id'],
        ]);

        $user->update($data);
        $user->load('client');

        return response()->json($user);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    public function resetPassword(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $plainPassword = Str::password(16);
        $user->update(['password' => Hash::make($plainPassword)]);

        return response()->json(['generated_password' => $plainPassword]);
    }
}
