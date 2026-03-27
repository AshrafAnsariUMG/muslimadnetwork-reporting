<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\MasjidConnect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MasjidConnectController extends Controller
{
    private function withPhotoUrl(MasjidConnect $record): array
    {
        $data = $record->toArray();
        $data['screen_photo_url'] = asset('storage/' . $record->screen_photo_path);
        // Include campaign name if relation loaded
        if ($record->relationLoaded('campaign') && $record->campaign) {
            $data['campaign_name'] = $record->campaign->name;
        }
        return $data;
    }

    public function index(Request $request, int $clientId): JsonResponse
    {
        $query = MasjidConnect::with('campaign')
            ->where('client_id', $clientId)
            ->orderBy('sort_order');

        if ($request->filled('campaign_id')) {
            $query->where('campaign_id', $request->campaign_id);
        }

        return response()->json(
            $query->get()->map(fn ($r) => $this->withPhotoUrl($r))
        );
    }

    public function store(Request $request, int $clientId): JsonResponse
    {
        $request->validate([
            'masjid_name'  => ['required', 'string', 'max:255'],
            'city'         => ['required', 'string', 'max:255'],
            'country'      => ['nullable', 'string', 'max:255'],
            'screen_photo' => ['required', 'image', 'max:5120'],
            'sort_order'   => ['nullable', 'integer'],
            'campaign_id'  => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) use ($clientId) {
                    if ($value && !\App\Models\Campaign::where('id', $value)->where('client_id', $clientId)->exists()) {
                        $fail('The selected campaign does not belong to this client.');
                    }
                },
            ],
        ]);

        $path = $request->file('screen_photo')->store('masjid-screens', 'public');

        $record = MasjidConnect::create([
            'client_id'         => $clientId,
            'campaign_id'       => $request->input('campaign_id') ?: null,
            'masjid_name'       => $request->masjid_name,
            'city'              => $request->city,
            'country'           => $request->input('country', 'United States'),
            'screen_photo_path' => $path,
            'sort_order'        => $request->input('sort_order', 0),
        ]);

        $record->load('campaign');

        return response()->json($this->withPhotoUrl($record), 201);
    }

    public function update(Request $request, int $clientId, int $id): JsonResponse
    {
        $record = MasjidConnect::where('client_id', $clientId)->findOrFail($id);

        $request->validate([
            'masjid_name'  => ['sometimes', 'required', 'string', 'max:255'],
            'city'         => ['sometimes', 'required', 'string', 'max:255'],
            'country'      => ['nullable', 'string', 'max:255'],
            'screen_photo' => ['nullable', 'image', 'max:5120'],
            'sort_order'   => ['nullable', 'integer'],
            'campaign_id'  => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) use ($clientId) {
                    if ($value && !\App\Models\Campaign::where('id', $value)->where('client_id', $clientId)->exists()) {
                        $fail('The selected campaign does not belong to this client.');
                    }
                },
            ],
        ]);

        if ($request->hasFile('screen_photo')) {
            Storage::disk('public')->delete($record->screen_photo_path);
            $record->screen_photo_path = $request->file('screen_photo')->store('masjid-screens', 'public');
        }

        $record->fill([
            'masjid_name' => $request->input('masjid_name', $record->masjid_name),
            'city'        => $request->input('city', $record->city),
            'country'     => $request->input('country', $record->country),
            'sort_order'  => $request->input('sort_order', $record->sort_order),
            'campaign_id' => $request->has('campaign_id') ? ($request->input('campaign_id') ?: null) : $record->campaign_id,
        ]);
        $record->save();
        $record->load('campaign');

        return response()->json($this->withPhotoUrl($record));
    }

    public function destroy(int $clientId, int $id): JsonResponse
    {
        $record = MasjidConnect::where('client_id', $clientId)->findOrFail($id);
        Storage::disk('public')->delete($record->screen_photo_path);
        $record->delete();

        return response()->json(['success' => true]);
    }

    public function toggle(int $clientId): JsonResponse
    {
        $client = Client::findOrFail($clientId);
        $client->masjidconnect_enabled = !$client->masjidconnect_enabled;
        $client->save();

        return response()->json($client);
    }
}
