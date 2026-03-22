<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientVisibilitySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisibilityController extends Controller
{
    /**
     * GET /api/admin/visibility/overview
     * Summary across all clients.
     */
    public function overview(): JsonResponse
    {
        $clients = Client::with(['campaigns'])->get(['id', 'name']);

        $result = $clients->map(function (Client $client) {
            $settings = ClientVisibilitySetting::where('client_id', $client->id)
                ->where('is_hidden', true)
                ->get();

            $hiddenSections = $settings->where('level', 'section')->pluck('section')->unique()->values();
            $hiddenRows     = $settings->where('level', 'row');

            return [
                'client_id'                => $client->id,
                'client_name'              => $client->name,
                'total_hidden_sections'    => $hiddenSections->count(),
                'total_hidden_rows'        => $hiddenRows->count(),
                'sections_with_hidden_rows'=> $hiddenRows->pluck('section')->unique()->values(),
            ];
        });

        return response()->json($result);
    }

    /**
     * GET /api/admin/visibility/{client_id}
     * Return grouped visibility settings for a client.
     */
    public function show(int $clientId): JsonResponse
    {
        $client = Client::findOrFail($clientId);
        return response()->json($this->grouped($client->id));
    }

    /**
     * POST /api/admin/visibility/{client_id}
     * Upsert a single visibility setting.
     */
    public function upsert(Request $request, int $clientId): JsonResponse
    {
        Client::findOrFail($clientId);

        $validated = $request->validate([
            'section'    => 'required|string',
            'level'      => 'required|in:section,row',
            'row_key'    => 'nullable|string',
            'is_hidden'  => 'required|boolean',
        ]);

        $rowKey = $validated['row_key'] ?? null;

        $existing = ClientVisibilitySetting::where('client_id', $clientId)
            ->where('section', $validated['section'])
            ->where('level', $validated['level'])
            ->when($rowKey === null, fn ($q) => $q->whereNull('row_key'), fn ($q) => $q->where('row_key', $rowKey))
            ->first();

        if ($existing) {
            $existing->update([
                'is_hidden'  => $validated['is_hidden'],
                'updated_by' => $request->user()->id,
            ]);
        } else {
            ClientVisibilitySetting::create([
                'client_id'  => $clientId,
                'section'    => $validated['section'],
                'level'      => $validated['level'],
                'row_key'    => $rowKey,
                'is_hidden'  => $validated['is_hidden'],
                'updated_by' => $request->user()->id,
            ]);
        }

        return response()->json($this->grouped($clientId));
    }

    /**
     * DELETE /api/admin/visibility/{client_id}/reset
     * Remove all visibility settings for a client.
     */
    public function reset(int $clientId): JsonResponse
    {
        Client::findOrFail($clientId);
        ClientVisibilitySetting::where('client_id', $clientId)->delete();

        return response()->json(['message' => 'Visibility settings reset to defaults.']);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function grouped(int $clientId): array
    {
        $rows = ClientVisibilitySetting::where('client_id', $clientId)->get();

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

        return $result;
    }
}
