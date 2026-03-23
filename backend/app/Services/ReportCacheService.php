<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\CreativeCache;
use App\Models\ReportCache;
use Illuminate\Support\Facades\Log;

class ReportCacheService
{
    public function __construct(private CM360Service $cm360) {}

    public function get(Campaign $campaign, string $dateFrom, string $dateTo, string $type): array
    {
        $existing = ReportCache::where('campaign_id', $campaign->id)
            ->where('date_from', $dateFrom)
            ->where('date_to', $dateTo)
            ->where('report_type', $type)
            ->first();

        if ($existing && $existing->expires_at->isFuture()) {
            return $existing->payload;
        }

        // Determine TTL based on campaign status
        $isActive = $campaign->status->value === 'active';
        $ttlHours = $isActive ? 2 : 24;
        $now = now();
        $expiresAt = $now->copy()->addHours($ttlHours);

        try {
            $payload = $this->fetchFromCM360($campaign, $dateFrom, $dateTo, $type);

            ReportCache::updateOrCreate(
                [
                    'campaign_id' => $campaign->id,
                    'date_from'   => $dateFrom,
                    'date_to'     => $dateTo,
                    'report_type' => $type,
                ],
                [
                    'payload'    => $payload,
                    'fetched_at' => $now,
                    'expires_at' => $expiresAt,
                ]
            );

            return $payload;
        } catch (\Throwable $e) {
            Log::error('CM360 fetch failed, falling back to stale cache', [
                'campaign_id' => $campaign->id,
                'type'        => $type,
                'error'       => $e->getMessage(),
            ]);

            // Return stale data if available rather than failing hard
            if ($existing) {
                return $existing->payload;
            }

            throw $e;
        }
    }

    public function invalidate(Campaign $campaign): void
    {
        ReportCache::where('campaign_id', $campaign->id)->delete();
    }

    /**
     * Return creative metadata keyed by name.
     * Cached for 24h in creative_cache table; falls back to empty array on error.
     */
    public function getCreativeMetadata(Campaign $campaign): array
    {
        $cached = CreativeCache::where('campaign_id', $campaign->id)
            ->where('expires_at', '>', now())
            ->get();

        if ($cached->isNotEmpty()) {
            $result = [];
            foreach ($cached as $item) {
                $result[$item->name] = [
                    'id'          => $item->cm360_creative_id,
                    'name'        => $item->name,
                    'type'        => $item->type,
                    'width'       => $item->width,
                    'height'      => $item->height,
                    'preview_url' => $item->preview_url,
                ];
            }
            return $result;
        }

        try {
            $metadata  = $this->cm360->fetchCreativeMetadata($campaign);
            $expiresAt = now()->addHours(24);

            foreach ($metadata as $data) {
                CreativeCache::updateOrCreate(
                    [
                        'campaign_id'       => $campaign->id,
                        'cm360_creative_id' => $data['id'],
                    ],
                    [
                        'name'        => $data['name'],
                        'type'        => $data['type'],
                        'width'       => $data['width'],
                        'height'      => $data['height'],
                        'preview_url' => $data['preview_url'],
                        'fetched_at'  => now(),
                        'expires_at'  => $expiresAt,
                    ]
                );
            }

            return $metadata;
        } catch (\Throwable $e) {
            Log::error('getCreativeMetadata failed', [
                'campaign_id' => $campaign->id,
                'error'       => $e->getMessage(),
            ]);
            return [];
        }
    }

    private function fetchFromCM360(Campaign $campaign, string $dateFrom, string $dateTo, string $type): array
    {
        return match ($type) {
            'summary'    => $this->cm360->fetchSummaryReport($campaign, $dateFrom, $dateTo),
            'device'     => $this->cm360->fetchDeviceBreakdown($campaign, $dateFrom, $dateTo),
            'site'       => $this->cm360->fetchSiteBreakdown($campaign, $dateFrom, $dateTo),
            'creative'   => $this->cm360->fetchCreativeBreakdown($campaign, $dateFrom, $dateTo),
            'conversion' => $this->cm360->fetchConversionReport($campaign, $dateFrom, $dateTo),
            default      => throw new \InvalidArgumentException("Unknown report type: {$type}"),
        };
    }
}
