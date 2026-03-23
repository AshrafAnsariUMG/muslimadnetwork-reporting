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
        $end        = Carbon::parse($campaign->end_date);
        $today      = Carbon::today();

        $totalDays     = max(1, $start->diffInDays($end));
        $elapsedDays   = max(0, min($start->diffInDays($today), $totalDays));
        $daysRemaining = max(0, $today->diffInDays($end, false));

        $expectedPct  = ($elapsedDays / $totalDays) * 100;

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

        // ── Trigger 1: Behind pace, campaign ending soon ───────────────────────
        if ($deliveredPct < ($expectedPct - 20) && $daysRemaining <= 14 && $daysRemaining > 0) {
            return [[
                'id'           => 'intelligent_behind_pace_ending_soon',
                'title'        => 'Your campaign needs a boost 🚀',
                'body'         => "You're behind pace with {$daysRemaining} days left. Add more impressions now to guarantee your contracted delivery.",
                'cta_label'    => 'Add Impressions',
                'cta_url'      => "mailto:support@muslimadnetwork.com?subject=Add+Impressions+-+{$campaignName}",
                'trigger'      => 'behind_pace_ending_soon',
                'urgency'      => 'high',
                'is_intelligent' => true,
            ]];
        }

        // ── Trigger 2: Campaign ending soon, good performance ──────────────────
        if ($daysRemaining <= 7 && $daysRemaining > 0 && $deliveredPct >= ($expectedPct - 10)) {
            return [[
                'id'           => 'intelligent_campaign_ending_good_performance',
                'title'        => "Your campaign ends in {$daysRemaining} days",
                'body'         => "Your campaign is performing well with {$impressionsFmt} impressions delivered. Renew now to keep the momentum going.",
                'cta_label'    => 'Renew Campaign',
                'cta_url'      => "mailto:support@muslimadnetwork.com?subject=Renew+Campaign+-+{$campaignName}",
                'trigger'      => 'campaign_ending_good_performance',
                'urgency'      => 'medium',
                'is_intelligent' => true,
            ]];
        }

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
