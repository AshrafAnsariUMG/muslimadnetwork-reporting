<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Campaign::with('client');

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'name' => ['required', 'string', 'max:255'],
            'cm360_campaign_id' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:active,paused,ended,upcoming'],
            'start_date' => ['required', 'date'],
            'contracted_impressions' => ['nullable', 'integer', 'min:0'],
            'contracted_clicks' => ['nullable', 'integer', 'min:0'],
            'is_primary' => ['boolean'],
            'has_conversion_tracking' => ['boolean'],
            'cm360_activity_id' => ['nullable', 'string', 'max:255'],
        ]);

        $campaign = Campaign::create($data);
        $campaign->load('client');

        return response()->json($campaign, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $campaign = Campaign::findOrFail($id);

        $data = $request->validate([
            'client_id' => ['sometimes', 'exists:clients,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'cm360_campaign_id' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'in:active,paused,ended,upcoming'],
            'start_date' => ['sometimes', 'date'],
            'contracted_impressions' => ['nullable', 'integer', 'min:0'],
            'contracted_clicks' => ['nullable', 'integer', 'min:0'],
            'is_primary' => ['boolean'],
            'has_conversion_tracking' => ['sometimes', 'boolean'],
            'cm360_activity_id' => ['nullable', 'string', 'max:255'],
        ]);

        $campaign->update($data);
        $campaign->load('client');

        return response()->json($campaign);
    }

    public function destroy(int $id): JsonResponse
    {
        $campaign = Campaign::findOrFail($id);
        $campaign->delete();

        return response()->json(['message' => 'Campaign deleted.']);
    }
}
