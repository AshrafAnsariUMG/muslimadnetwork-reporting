<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\MasjidConnect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MasjidConnectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $client = $request->user()->client;

        if (!$client) {
            return response()->json(['enabled' => false, 'masjids' => []]);
        }

        if (!$client->masjidconnect_enabled) {
            return response()->json(['enabled' => false, 'masjids' => []]);
        }

        $masjids = MasjidConnect::where('client_id', $client->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($record) {
                $data = $record->toArray();
                $data['screen_photo_url'] = asset('storage/' . $record->screen_photo_path);
                return $data;
            });

        return response()->json([
            'enabled' => true,
            'masjids' => $masjids,
        ]);
    }
}
