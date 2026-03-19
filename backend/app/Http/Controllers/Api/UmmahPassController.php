<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class UmmahPassController extends Controller
{
    public function redirect(): RedirectResponse
    {
        $clientId = config('services.ummahpass.client_id');
        $redirectUri = config('services.ummahpass.redirect_uri');
        $baseUrl = config('services.ummahpass.base_url');
        $state = Str::random(40);

        session(['ummahpass_state' => $state]);

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid profile email',
            'state' => $state,
        ]);

        return redirect("{$baseUrl}/oauth/authorize?{$query}");
    }

    public function callback(Request $request): JsonResponse
    {
        $state = $request->query('state');
        $code = $request->query('code');

        if (!$code) {
            return response()->json(['message' => 'Authorization code missing.'], 400);
        }

        $baseUrl = config('services.ummahpass.base_url');

        // Exchange code for token
        $tokenResponse = Http::post("{$baseUrl}/oauth/token", [
            'grant_type' => 'authorization_code',
            'client_id' => config('services.ummahpass.client_id'),
            'client_secret' => config('services.ummahpass.client_secret'),
            'redirect_uri' => config('services.ummahpass.redirect_uri'),
            'code' => $code,
        ]);

        if ($tokenResponse->failed()) {
            return response()->json(['message' => 'Failed to exchange authorization code.'], 400);
        }

        $accessToken = $tokenResponse->json('access_token');

        // Fetch user info from UmmahPass
        $userResponse = Http::withToken($accessToken)->get("{$baseUrl}/api/user");

        if ($userResponse->failed()) {
            return response()->json(['message' => 'Failed to fetch user info from UmmahPass.'], 400);
        }

        $ummahPassUser = $userResponse->json();

        // Find or create local user
        $user = User::updateOrCreate(
            ['ummahpass_id' => $ummahPassUser['id']],
            [
                'name' => $ummahPassUser['name'] ?? $ummahPassUser['email'],
                'email' => $ummahPassUser['email'],
                'role' => UserRole::Client,
            ]
        );

        $token = $user->createToken('ummahpass-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'client' => $user->client,
        ]);
    }
}
