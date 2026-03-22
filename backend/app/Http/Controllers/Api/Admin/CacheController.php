<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Services\ReportCacheService;
use Illuminate\Http\JsonResponse;

class CacheController extends Controller
{
    public function __construct(private ReportCacheService $cache) {}

    public function invalidate(int $campaignId): JsonResponse
    {
        $campaign = Campaign::findOrFail($campaignId);
        $this->cache->invalidate($campaign);

        return response()->json(['message' => "Cache cleared for campaign {$campaign->name}."]);
    }
}
