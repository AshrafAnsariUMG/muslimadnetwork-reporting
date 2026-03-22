<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\OfferDismissal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OfferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user     = $request->user();
        $clientId = $user->client_id;
        $now      = now();

        $dismissedIds = OfferDismissal::where('user_id', $user->id)
            ->pluck('offer_id');

        $offers = Offer::where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->where(function ($q) use ($clientId) {
                $q->where('target', 'global')
                  ->orWhere(function ($q2) use ($clientId) {
                      $q2->where('target', 'specific_client')
                         ->where('client_id', $clientId);
                  });
            })
            ->whereNotIn('id', $dismissedIds)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($offers);
    }

    public function dismiss(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        OfferDismissal::firstOrCreate(
            ['user_id' => $user->id, 'offer_id' => $id],
            ['dismissed_at' => now()]
        );

        return response()->json(['success' => true]);
    }
}
