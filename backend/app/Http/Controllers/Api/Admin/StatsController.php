<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\Campaign;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    public function index(): JsonResponse
    {
        $campaignsByStatus = Campaign::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $topClients = Client::withCount(['campaigns', 'users'])
            ->where('is_active', true)
            ->orderByDesc('campaigns_count')
            ->limit(5)
            ->get(['id', 'name', 'client_type', 'is_active']);

        $recentActivity = AdminAuditLog::with([
                'adminUser:id,name',
                'impersonatingClient:id,name',
            ])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'admin_user_id', 'impersonating_client_id', 'action', 'metadata', 'ip_address', 'created_at']);

        return response()->json([
            'total_clients'        => Client::where('is_active', true)->count(),
            'total_users'          => User::count(),
            'total_campaigns'      => Campaign::count(),
            'campaigns_by_status'  => $campaignsByStatus,
            'top_clients'          => $topClients,
            'recent_activity'      => $recentActivity,
        ]);
    }
}
