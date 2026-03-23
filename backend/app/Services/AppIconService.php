<?php

namespace App\Services;

use App\Models\AppIconCache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AppIconService
{
    public function getIcon(string $bundleId): array
    {
        // Check cache
        $cached = AppIconCache::where('bundle_id', $bundleId)
            ->where('expires_at', '>', now())
            ->first();

        if ($cached) {
            return [
                'icon_url' => $cached->icon_url,
                'app_name' => $cached->app_name,
            ];
        }

        try {
            $url = "https://play.google.com/store/apps/details?id={$bundleId}&hl=en&gl=US";

            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ])->timeout(10)->get($url);

            $iconUrl = null;
            $appName = $bundleId;

            if ($response->successful()) {
                $html = $response->body();

                preg_match('/<meta property="og:image" content="([^"]+)"/', $html, $iconMatch);
                if (!empty($iconMatch[1])) {
                    $iconUrl = $iconMatch[1];
                }

                preg_match('/<meta property="og:title" content="([^"]+)"/', $html, $nameMatch);
                if (!empty($nameMatch[1])) {
                    $appName = html_entity_decode($nameMatch[1], ENT_QUOTES);
                }
            }

            AppIconCache::updateOrCreate(
                ['bundle_id' => $bundleId],
                [
                    'icon_url'   => $iconUrl,
                    'app_name'   => $appName,
                    'fetched_at' => now(),
                    'expires_at' => now()->addDays(7),
                ]
            );

            return ['icon_url' => $iconUrl, 'app_name' => $appName];
        } catch (\Throwable $e) {
            Log::warning('AppIconService: failed to fetch icon', [
                'bundle_id' => $bundleId,
                'error'     => $e->getMessage(),
            ]);

            return ['icon_url' => null, 'app_name' => $bundleId];
        }
    }
}
