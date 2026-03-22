<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $offers = Offer::with('client:id,name')
            ->withCount('dismissals')
            ->orderByDesc('is_active')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($offers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'     => 'required|string|max:100',
            'body'      => 'required|string|max:500',
            'cta_label' => 'required|string|max:50',
            'cta_url'   => 'required|url',
            'target'    => 'required|in:global,specific_client',
            'client_id' => 'required_if:target,specific_client|nullable|exists:clients,id',
            'is_active' => 'boolean',
            'starts_at' => 'nullable|date',
            'ends_at'   => 'nullable|date|after:starts_at',
        ]);

        if (($data['target'] ?? '') === 'global') {
            $data['client_id'] = null;
        }

        $offer = Offer::create($data);
        $offer->load('client:id,name');
        $offer->loadCount('dismissals');

        return response()->json($offer, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $offer = Offer::findOrFail($id);

        $data = $request->validate([
            'title'     => 'required|string|max:100',
            'body'      => 'required|string|max:500',
            'cta_label' => 'required|string|max:50',
            'cta_url'   => 'required|url',
            'target'    => 'required|in:global,specific_client',
            'client_id' => 'required_if:target,specific_client|nullable|exists:clients,id',
            'is_active' => 'boolean',
            'starts_at' => 'nullable|date',
            'ends_at'   => 'nullable|date|after:starts_at',
        ]);

        if (($data['target'] ?? '') === 'global') {
            $data['client_id'] = null;
        }

        $offer->update($data);
        $offer->load('client:id,name');
        $offer->loadCount('dismissals');

        return response()->json($offer);
    }

    public function destroy(int $id): JsonResponse
    {
        Offer::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function toggle(int $id): JsonResponse
    {
        $offer = Offer::findOrFail($id);
        $offer->update(['is_active' => !$offer->is_active]);
        return response()->json(['is_active' => $offer->is_active]);
    }
}
