<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\IntelligentOfferDismissal;
use App\Models\Offer;
use App\Models\OfferDismissal;
use App\Services\IntelligentOfferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    public function __construct(private IntelligentOfferService $intelligentOffers) {}

    public function index(Request $request): JsonResponse
    {
        $user     = $request->user();
        $client   = $user->client;
        $clientId = $user->client_id;
        $now      = now();

        $dismissedIds = OfferDismissal::where('user_id', $user->id)->pluck('offer_id');

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
            ->get()
            ->toArray();

        // Prepend intelligent offers if enabled
        if ($client && $client->intelligent_offers_enabled) {
            $dismissedTriggers = IntelligentOfferDismissal::where('user_id', $user->id)
                ->pluck('trigger_name')
                ->toArray();

            $campaign = Campaign::where('client_id', $clientId)
                ->where('is_primary', true)
                ->first();

            if ($campaign) {
                $intelligent = $this->intelligentOffers->getOffersForCampaign($campaign, $client);
                foreach ($intelligent as $offer) {
                    $trigger = $offer['trigger'] ?? '';
                    if (!in_array($trigger, $dismissedTriggers)) {
                        array_unshift($offers, $offer);
                        break; // Only one intelligent offer at a time
                    }
                }
            }
        }

        return response()->json($offers);
    }

    public function dismiss(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        // Handle intelligent offer dismissals separately
        if (str_starts_with($id, 'intelligent_')) {
            $trigger = str_replace('intelligent_', '', $id);
            IntelligentOfferDismissal::firstOrCreate(
                ['user_id' => $user->id, 'trigger_name' => $trigger],
                ['dismissed_at' => now()]
            );
            return response()->json(['success' => true]);
        }

        OfferDismissal::firstOrCreate(
            ['user_id' => $user->id, 'offer_id' => (int) $id],
            ['dismissed_at' => now()]
        );

        return response()->json(['success' => true]);
    }
}
