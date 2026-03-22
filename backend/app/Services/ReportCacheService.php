<?php

namespace App\Services;

use App\Models\Campaign;
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
