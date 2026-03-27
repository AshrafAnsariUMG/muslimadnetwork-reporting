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
        return $data;
    }

    public function index(int $clientId): JsonResponse
    {
        $records = MasjidConnect::where('client_id', $clientId)
            ->orderBy('sort_order')
            ->get();

        return response()->json(
            $records->map(fn ($r) => $this->withPhotoUrl($r))
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
        ]);

        $path = $request->file('screen_photo')->store('masjid-screens', 'public');

        $record = MasjidConnect::create([
            'client_id'         => $clientId,
            'masjid_name'       => $request->masjid_name,
            'city'              => $request->city,
            'country'           => $request->input('country', 'United States'),
            'screen_photo_path' => $path,
            'sort_order'        => $request->input('sort_order', 0),
        ]);

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
        ]);
        $record->save();

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
