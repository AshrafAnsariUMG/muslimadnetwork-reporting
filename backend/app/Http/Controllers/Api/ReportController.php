<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Services\ReportCacheService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        $client = $request->user()->client;

        // Client type is the master switch — standard clients never see conversion data
        if ($client->client_type->value === 'standard') {
            return response()->json(['available' => false]);
        }

        if (!$campaign->has_conversion_tracking) {
            return response()->json(['available' => false]);
        }

        if (empty($campaign->cm360_activity_id)) {
            Log::warning('Conversion requested but cm360_activity_id is missing', ['campaign_id' => $campaign->id]);
            return response()->json(['available' => false]);
        }

        return response()->json($this->cache->get($campaign, $dateFrom, $dateTo, 'conversion'));
    }

    public function pacing(Request $request): JsonResponse
    {
        $request->validate(['campaign_id' => 'sometimes|integer']);

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

        if (!$campaign->contracted_impressions) {
            return response()->json(['available' => false]);
        }

        $dateFrom = Carbon::parse($campaign->start_date)->format('Y-m-d');
        $dateTo   = Carbon::today()->format('Y-m-d');

        $summaryData = $this->cache->get($campaign, $dateFrom, $dateTo, 'summary');

        return response()->json([
            'impressions' => (int) ($summaryData['impressions'] ?? 0),
            'contracted'  => (int) $campaign->contracted_impressions,
            'start_date'  => $dateFrom,
            'end_date'    => Carbon::parse($campaign->end_date)->format('Y-m-d'),
            'as_of'       => $dateTo,
        ]);
    }

    public function campaigns(Request $request): JsonResponse
    {
        $client = $request->user()->client;

        if (!$client) {
            return response()->json(['error' => 'No client associated with this user.'], 422);
        }

        $campaigns = Campaign::where('client_id', $client->id)
            ->orderByRaw("FIELD(status, 'active', 'upcoming', 'paused', 'ended')")
            ->orderByDesc('start_date')
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
