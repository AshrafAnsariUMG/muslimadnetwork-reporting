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
                $status = 'underperforming';
            }

            // ── vs campaign average ───────────────────────────────────────────
            $vsCampaignAvg = $campaignCtr > 0
                ? round((($ctr - $campaignCtr) / $campaignCtr) * 100, 1)
                : 0.0;

            // ── vs network average ────────────────────────────────────────────
            $vsNetworkAvg = $networkAvgCtr > 0
                ? round((($ctr - $networkAvgCtr) / $networkAvgCtr) * 100, 1)
                : 0.0;

            // ── Fatigue risk (v1: high volume + below network avg) ────────────
            $fatigueRisk = $impressions > 100000 && $ctr < $networkAvgCtr;

            // ── Recommendation ────────────────────────────────────────────────
            $recommendation = null;
            if ($fatigueRisk) {
                $recommendation = 'This creative has high impression volume with below-average CTR. It may be experiencing audience fatigue.';
            } elseif ($status === 'top_performer') {
                $recommendation = 'This creative is driving strong results. Consider increasing its weight.';
            } elseif ($status === 'underperforming') {
                $recommendation = 'This creative has low CTR with sufficient impressions. Consider pausing or refreshing it.';
            } elseif ($status === 'insufficient_data') {
                $recommendation = 'More impressions needed for a reliable assessment.';
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
