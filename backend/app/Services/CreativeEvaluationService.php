<?php

namespace App\Services;

class CreativeEvaluationService
{
    public function evaluate(array $creatives, float $campaignCtr, float $networkAvgCtr): array
    {
        return array_map(function (array $creative) use ($campaignCtr, $networkAvgCtr) {
            $ctr         = (float) ($creative['ctr'] ?? 0);
            $impressions = (int)   ($creative['impressions'] ?? 0);

            // ── Performance status ────────────────────────────────────────────
            if ($impressions <= 10000) {
                $status = 'insufficient_data';
            } elseif ($ctr >= $campaignCtr * 1.5) {
                $status = 'top_performer';
            } elseif ($ctr >= $campaignCtr * 1.0) {
                $status = 'strong';
            } elseif ($ctr >= $campaignCtr * 0.5) {
                $status = 'average';
            } else {
                $status = 'refresh_opportunity';
            }

            // ── vs campaign average ───────────────────────────────────────────
            $vsCampaignAvg = $campaignCtr > 0
                ? round((($ctr - $campaignCtr) / $campaignCtr) * 100, 1)
                : 0.0;

            // ── vs network average ────────────────────────────────────────────
            $vsNetworkAvg = $networkAvgCtr > 0
                ? round((($ctr - $networkAvgCtr) / $networkAvgCtr) * 100, 1)
                : 0.0;

            // ── Fatigue risk (high volume + below network avg) ────────────────
            $fatigueRisk = $impressions > 100000 && $ctr < $networkAvgCtr;

            // Fatigue risk overrides status to ready_for_refresh
            if ($fatigueRisk) {
                $status = 'ready_for_refresh';
            }

            // ── Recommendation ────────────────────────────────────────────────
            $recommendation = null;
            if ($status === 'top_performer') {
                $recommendation = 'This creative is leading your campaign. Consider using it as a template for new creatives.';
            } elseif ($status === 'refresh_opportunity') {
                $recommendation = 'A creative refresh could help boost this placement. Contact your account manager to explore new creative options.';
            } elseif ($status === 'ready_for_refresh') {
                $recommendation = 'This creative has delivered strong exposure. Introducing a fresh version could re-engage your audience and improve results.';
            }

            return array_merge($creative, [
                'performance_status' => $status,
                'vs_campaign_avg'    => $vsCampaignAvg,
                'vs_network_avg'     => $vsNetworkAvg,
                'fatigue_risk'       => $fatigueRisk,
                'recommendation'     => $recommendation,
            ]);
        }, $creatives);
    }
}
