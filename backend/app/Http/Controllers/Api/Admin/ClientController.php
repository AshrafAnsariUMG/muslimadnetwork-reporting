<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(): JsonResponse
    {
        $clients = Client::withCount(['users', 'campaigns'])->get();

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'cm360_advertiser_id' => ['required', 'string', 'max:255'],
            'cm360_profile_id' => ['required', 'string', 'max:255'],
            'client_type' => ['required', 'in:standard,conversion,multi_campaign'],
            'logo_url' => ['nullable', 'string', 'max:255'],
            'primary_color' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $client = Client::create($data);

        return response()->json($client, 201);
    }

    public function show(int $id): JsonResponse
    {
        $client = Client::with(['users', 'campaigns'])->findOrFail($id);

        return response()->json($client);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $client = Client::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'cm360_advertiser_id' => ['sometimes', 'string', 'max:255'],
            'cm360_profile_id' => ['sometimes', 'string', 'max:255'],
            'client_type' => ['sometimes', 'in:standard,conversion,multi_campaign'],
            'logo_url' => ['nullable', 'string', 'max:255'],
            'primary_color' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $client->update($data);

        return response()->json($client);
    }

    public function destroy(int $id): JsonResponse
    {
        $client = Client::findOrFail($id);
        $client->update(['is_active' => false]);

        return response()->json(['message' => 'Client deactivated.']);
    }
}
