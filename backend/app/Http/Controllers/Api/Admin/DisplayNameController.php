<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientDisplayName;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisplayNameController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'section'   => 'sometimes|in:domain,app',
            'client_id' => 'sometimes|nullable|integer',
        ]);

        $query = ClientDisplayName::with(['client:id,name', 'updatedBy:id,name']);

        if ($request->filled('section')) {
            $query->where('section', $request->input('section'));
        }

        if ($request->has('client_id')) {
            $clientId = $request->input('client_id');
            if ($clientId === null || $clientId === 'null' || $clientId === '') {
                $query->whereNull('client_id');
            } else {
                $query->where('client_id', (int) $clientId);
            }
        }

        $rules = $query->orderBy('section')->orderBy('original_key')->get();

        return response()->json($rules);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id'    => 'nullable|integer|exists:clients,id',
            'section'      => 'required|in:domain,app',
            'original_key' => 'required|string|max:255',
            'display_name' => 'required|string|max:255',
        ]);

        $data['updated_by'] = $request->user()->id;

        $rule = ClientDisplayName::updateOrCreate(
            [
                'client_id'    => $data['client_id'] ?? null,
                'section'      => $data['section'],
                'original_key' => $data['original_key'],
            ],
            [
                'display_name' => $data['display_name'],
                'updated_by'   => $data['updated_by'],
            ]
        );

        $rule->load(['client:id,name', 'updatedBy:id,name']);

        return response()->json($rule, 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $rule = ClientDisplayName::findOrFail($id);
        $rule->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
