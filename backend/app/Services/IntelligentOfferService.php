<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Client;
use App\Models\ReportCache;
use Carbon\Carbon;

class IntelligentOfferService
{
    public function getOffersForCampaign(Campaign $campaign, Client $client): array
    {
        if (!$client->intelligent_offers_enabled) {
            return [];
        }

        // ── Pacing data ────────────────────────────────────────────────────────
        $contracted = (int) $campaign->contracted_impressions;
        $start      = Carbon::parse($campaign->start_date);
        $today      = Carbon::today();

        $elapsedDays   = max(0, $start->diffInDays($today));
        $daysRemaining = 0; // end_date removed
        $expectedPct   = 0; // cannot calculate without end_date

        // ── Get most recent cached summary for this campaign ───────────────────
        $summaryCache = ReportCache::where('campaign_id', $campaign->id)
            ->where('report_type', 'summary')
            ->latest('fetched_at')
            ->first();

        $impressions  = (int) ($summaryCache?->payload['impressions'] ?? 0);
        $ctr          = (float) ($summaryCache?->payload['ctr'] ?? 0);

        $deliveredPct = $contracted > 0 ? ($impressions / $contracted) * 100 : 0;
        $networkAvgCtr = (float) config('reporting.network_avg_ctr', 0.05);

        $ctrFormatted = number_format($ctr * 100, 2);
        $ctrMultiple  = $networkAvgCtr > 0 ? round($ctr / $networkAvgCtr, 1) : 0;
        $impressionsFmt = number_format($impressions);
        $campaignName = $campaign->name;

        // Triggers 1 & 2 (behind pace / ending soon) required end_date — removed.

        // ── Trigger 3: Strong CTR, suggest scaling ─────────────────────────────
        if ($ctr >= ($networkAvgCtr * 2) && $deliveredPct < 50) {
            return [[
                'id'           => 'intelligent_strong_ctr_scale_up',
                'title'        => 'Your campaign is outperforming! 📈',
                'body'         => "Your CTR is {$ctrFormatted}% — {$ctrMultiple}x above our network average. Scale up now to reach more of your audience while performance is strong.",
                'cta_label'    => 'Scale Up',
                'cta_url'      => "mailto:support@muslimadnetwork.com?subject=Scale+Up+Campaign+-+{$campaignName}",
                'trigger'      => 'strong_ctr_scale_up',
                'urgency'      => 'low',
                'is_intelligent' => true,
            ]];
        }

        // ── Trigger 4: Campaign just started ──────────────────────────────────
        if ($elapsedDays <= 7 && $deliveredPct < 5) {
            return [[
                'id'           => 'intelligent_campaign_just_started',
                'title'        => 'Welcome to your new campaign! 👋',
                'body'         => 'Your campaign just launched. Did you know clients who add a retargeting campaign see 2x better conversion rates?',
                'cta_label'    => 'Learn About Retargeting',
                'cta_url'      => "mailto:support@muslimadnetwork.com?subject=Retargeting+Inquiry+-+{$campaignName}",
                'trigger'      => 'campaign_just_started',
                'urgency'      => 'low',
                'is_intelligent' => true,
            ]];
        }

        return [];
    }
}
