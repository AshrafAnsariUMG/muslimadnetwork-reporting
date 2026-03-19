<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImpersonationController extends Controller
{
    public function start(Request $request, int $clientId): JsonResponse
    {
        $client = Client::findOrFail($clientId);

        $clientUser = User::where('client_id', $clientId)->firstOrFail();

        $token = $clientUser->createToken('impersonation-token')->plainTextToken;

        AdminAuditLog::create([
            'admin_user_id' => $request->user()->id,
            'impersonating_client_id' => $clientId,
            'action' => 'impersonation_started',
            'metadata' => ['client_name' => $client->name],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'token' => $token,
            'user' => $clientUser->load('client'),
        ]);
    }

    public function stop(Request $request): JsonResponse
    {
        $impersonatedUser = $request->user();

        $auditEntry = AdminAuditLog::where('impersonating_client_id', $impersonatedUser->client_id)
            ->where('action', 'impersonation_started')
            ->latest()
            ->first();

        AdminAuditLog::create([
            'admin_user_id' => $auditEntry?->admin_user_id,
            'impersonating_client_id' => $impersonatedUser->client_id,
            'action' => 'impersonation_stopped',
            'metadata' => null,
            'ip_address' => $request->ip(),
        ]);

        $request->user()->currentAccessToken()->delete();

        $adminUser = $auditEntry ? User::find($auditEntry->admin_user_id) : null;

        return response()->json(['user' => $adminUser]);
    }
}
