<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\ClientVisibilitySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisibilityController extends Controller
{
    /**
     * GET /api/client/visibility
     * Return grouped visibility settings for the authenticated client.
     */
    public function index(Request $request): JsonResponse
    {
        $client = $request->user()->client;

        if (!$client) {
            return response()->json(['error' => 'No client associated with this user.'], 422);
        }

        $rows = ClientVisibilitySetting::where('client_id', $client->id)->get();

        $sections = ['summary', 'pacing', 'device', 'domain', 'app', 'creative', 'conversion'];
        $result   = [];

        foreach ($sections as $section) {
            $sectionSetting = $rows->first(fn ($r) => $r->section === $section && $r->level === 'section');
            $hiddenRows     = $rows
                ->filter(fn ($r) => $r->section === $section && $r->level === 'row' && $r->is_hidden)
                ->pluck('row_key')
                ->values()
                ->all();

            $result[$section] = [
                'section_hidden' => $sectionSetting?->is_hidden ?? false,
                'hidden_rows'    => $hiddenRows,
            ];
        }

        return response()->json($result);
    }
}
