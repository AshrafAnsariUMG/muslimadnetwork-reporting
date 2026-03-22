<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Services\ReportCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportCacheService $cache) {}

    public function summary(Request $request): JsonResponse
    {
        [$campaign, $dateFrom, $dateTo] = $this->resolveParams($request);
        return response()->json($this->cache->get($campaign, $dateFrom, $dateTo, 'summary'));
    }

    public function device(Request $request): JsonResponse
    {
        [$campaign, $dateFrom, $dateTo] = $this->resolveParams($request);
        return response()->json($this->cache->get($campaign, $dateFrom, $dateTo, 'device'));
    }

    public function site(Request $request): JsonResponse
    {
        [$campaign, $dateFrom, $dateTo] = $this->resolveParams($request);
        return response()->json($this->cache->get($campaign, $dateFrom, $dateTo, 'site'));
    }

    public function creative(Request $request): JsonResponse
    {
        [$campaign, $dateFrom, $dateTo] = $this->resolveParams($request);
        return response()->json($this->cache->get($campaign, $dateFrom, $dateTo, 'creative'));
    }

    public function conversion(Request $request): JsonResponse
    {
        [$campaign, $dateFrom, $dateTo] = $this->resolveParams($request);

        if (!$campaign->has_conversion_tracking) {
            return response()->json(['error' => 'Conversion tracking not enabled for this campaign.'], 422);
        }

        return response()->json($this->cache->get($campaign, $dateFrom, $dateTo, 'conversion'));
    }

    public function campaigns(Request $request): JsonResponse
    {
        $client = $request->user()->client;

        if (!$client) {
            return response()->json(['error' => 'No client associated with this user.'], 422);
        }

        $campaigns = Campaign::where('client_id', $client->id)
            ->orderByDesc('is_primary')
            ->orderBy('name')
            ->get(['id', 'name', 'cm360_campaign_id', 'status', 'start_date', 'end_date',
                   'contracted_impressions', 'contracted_clicks', 'is_primary', 'has_conversion_tracking']);

        return response()->json($campaigns);
    }

    /**
     * Resolve campaign and date params from request.
     *
     * - multi_campaign client: requires ?campaign_id=
     * - standard/conversion client: uses primary campaign
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    private function resolveParams(Request $request): array
    {
        $request->validate([
            'date_from'   => 'required|date_format:Y-m-d',
            'date_to'     => 'required|date_format:Y-m-d|after_or_equal:date_from',
            'campaign_id' => 'sometimes|integer',
        ]);

        $client = $request->user()->client;

        if (!$client) {
            abort(422, 'No client associated with this user.');
        }

        if ($client->client_type->value === 'multi_campaign') {
            if (!$request->has('campaign_id')) {
                abort(422, 'campaign_id is required for multi-campaign clients.');
            }

            $campaign = Campaign::where('id', $request->integer('campaign_id'))
                ->where('client_id', $client->id)
                ->firstOrFail();
        } else {
            $campaign = Campaign::where('client_id', $client->id)
                ->where('is_primary', true)
                ->firstOrFail();
        }

        return [$campaign, $request->input('date_from'), $request->input('date_to')];
    }
}
