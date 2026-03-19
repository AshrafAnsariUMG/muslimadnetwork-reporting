<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
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

        return response()->json([
            'total_clients' => Client::where('is_active', true)->count(),
            'total_users' => User::count(),
            'total_campaigns' => Campaign::count(),
            'campaigns_by_status' => $campaignsByStatus,
        ]);
    }
}
