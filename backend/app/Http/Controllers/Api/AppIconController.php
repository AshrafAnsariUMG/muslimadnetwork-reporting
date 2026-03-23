<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AppIconService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppIconController extends Controller
{
    public function __construct(private AppIconService $iconService) {}

    public function show(Request $request): JsonResponse
    {
        $request->validate([
            'bundle_id' => ['required', 'string', 'regex:/\./'],
        ]);

        $bundleId = $request->input('bundle_id');
        $result   = $this->iconService->getIcon($bundleId);

        return response()->json([
            'bundle_id' => $bundleId,
            'icon_url'  => $result['icon_url'],
            'app_name'  => $result['app_name'],
        ])->header('Cache-Control', 'public, max-age=604800');
    }
}
