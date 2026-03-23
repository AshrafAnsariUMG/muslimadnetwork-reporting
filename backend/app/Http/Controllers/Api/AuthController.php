<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ClientVisit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('api-token')->plainTextToken;

        $response = [
            'user' => $user,
            'token' => $token,
        ];

        if ($user->role === UserRole::Client) {
            $response['client'] = $user->client;
        }

        return response()->json($response);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('client');

        if ($user->role === UserRole::Client && $user->client_id) {
            $now = now();
            $debounceWindow = $now->copy()->subHour();

            $lastVisit = ClientVisit::where('user_id', $user->id)
                ->where('client_id', $user->client_id)
                ->orderByDesc('visited_at')
                ->first();

            // Record a new visit only if no visit within last hour
            $shouldRecord = !$lastVisit || $lastVisit->visited_at->lt($debounceWindow);

            if ($shouldRecord) {
                // Return the previous visit timestamp before recording this one
                $lastVisitedAt = $lastVisit?->visited_at?->toIso8601String();

                ClientVisit::create([
                    'user_id'    => $user->id,
                    'client_id'  => $user->client_id,
                    'visited_at' => $now,
                ]);
            } else {
                // Within debounce window — return the visit before the most recent one
                $secondLast = ClientVisit::where('user_id', $user->id)
                    ->where('client_id', $user->client_id)
                    ->orderByDesc('visited_at')
                    ->skip(1)
                    ->first();
                $lastVisitedAt = $secondLast?->visited_at?->toIso8601String();
            }

            return response()->json(array_merge($user->toArray(), ['last_visited_at' => $lastVisitedAt]));
        }

        return response()->json($user);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password'     => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['errors' => ['current_password' => ['Current password is incorrect.']]], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['message' => 'Password changed successfully.']);
    }
}
