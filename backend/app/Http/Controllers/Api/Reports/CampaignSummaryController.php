<?php

namespace App\Http\Controllers\Api\Reports;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\ReportCache;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CampaignSummaryController extends Controller
{
    public function pdf(Request $request): Response
    {
        $user = $request->user();

        $request->validate(['campaign_id' => 'sometimes|integer']);

        // Resolve campaign based on role
        if ($user->role === UserRole::Admin) {
            $request->validate(['campaign_id' => 'required|integer']);
            $campaign = Campaign::with('client')->findOrFail($request->integer('campaign_id'));
            $client = $campaign->client;
        } else {
            $client = $user->client;
            if (!$client) {
                abort(422, 'No client associated with this user.');
            }

            if ($client->client_type->value === 'multi_campaign') {
                $request->validate(['campaign_id' => 'required|integer']);
                $campaign = Campaign::where('id', $request->integer('campaign_id'))
                    ->where('client_id', $client->id)
                    ->with('client')
                    ->firstOrFail();
            } else {
                $campaign = Campaign::where('client_id', $client->id)
                    ->where('is_primary', true)
                    ->with('client')
                    ->firstOrFail();
            }
        }

        $dateFrom = Carbon::parse($campaign->start_date)->format('Y-m-d');
        $dateTo   = Carbon::parse($campaign->end_date)->format('Y-m-d');

        // Fetch all report types from cache (no new CM360 calls)
        $summary  = $this->getCached($campaign->id, $dateFrom, $dateTo, 'summary');
        $device   = $this->getCached($campaign->id, $dateFrom, $dateTo, 'device');
        $site     = $this->getCached($campaign->id, $dateFrom, $dateTo, 'site');
        $creative = $this->getCached($campaign->id, $dateFrom, $dateTo, 'creative');

        // Pacing data
        $todayStr       = Carbon::today()->format('Y-m-d');
        $pacingSummary  = $this->getCached($campaign->id, $dateFrom, $todayStr, 'summary') ?? $summary;
        $contracted     = (int) $campaign->contracted_impressions;
        $delivered      = (int) ($pacingSummary['impressions'] ?? 0);

        $start      = Carbon::parse($campaign->start_date);
        $end        = Carbon::parse($campaign->end_date);
        $totalDays  = max(1, $start->diffInDays($end));
        $elapsed    = max(0, min($start->diffInDays(Carbon::today()), $totalDays));
        $expectedPct  = round(($elapsed / $totalDays) * 100, 1);
        $deliveredPct = $contracted > 0 ? round(($delivered / $contracted) * 100, 1) : 0;

        $networkAvgCtr = (float) config('reporting.network_avg_ctr', 0.05);
        $ctr = (float) ($summary['ctr'] ?? 0);
        $ctrVsBenchmark = $networkAvgCtr > 0 ? round((($ctr - $networkAvgCtr) / $networkAvgCtr) * 100, 1) : 0;

        // Health score
        $ctrScore = (int) min(25, max(0, $networkAvgCtr > 0 ? ($ctr / $networkAvgCtr) * 12.5 : 0));
        $healthScore = 50 + $ctrScore;
        $healthLabel = match (true) {
            $healthScore >= 80 => 'Excellent',
            $healthScore >= 60 => 'Good',
            $healthScore >= 40 => 'On Track',
            default             => 'Needs Attention',
        };

        // Top performer creative (by CTR, min 100 impressions)
        $creativeRows = $creative ?? [];
        $topPerformer = null;
        if (!empty($creativeRows)) {
            $eligible = array_filter($creativeRows, fn ($r) => ($r['impressions'] ?? 0) >= 100);
            if (!empty($eligible)) {
                usort($eligible, fn ($a, $b) => $b['ctr'] <=> $a['ctr']);
                $topPerformer = array_values($eligible)[0]['creative_name'] ?? null;
            }
        }

        $pdf = Pdf::loadView('pdf.campaign_summary', [
            'campaign'       => $campaign,
            'client'         => $client,
            'summary'        => $summary,
            'device'         => $device ?? [],
            'domains'        => $site['domains'] ?? [],
            'apps'           => $site['apps'] ?? [],
            'creative'       => $creativeRows,
            'dateFrom'       => $dateFrom,
            'dateTo'         => $dateTo,
            'generatedAt'    => Carbon::now()->format('F j, Y'),
            'contracted'     => $contracted,
            'delivered'      => $delivered,
            'deliveredPct'   => $deliveredPct,
            'expectedPct'    => $expectedPct,
            'networkAvgCtr'  => $networkAvgCtr,
            'ctrVsBenchmark' => $ctrVsBenchmark,
            'healthScore'    => $healthScore,
            'healthLabel'    => $healthLabel,
            'topPerformer'   => $topPerformer,
        ])->setPaper('a4', 'portrait');

        $filename = 'campaign-report-' . str_replace(' ', '-', strtolower($campaign->name)) . '.pdf';

        return $pdf->download($filename);
    }

    private function getCached(int $campaignId, string $dateFrom, string $dateTo, string $type): ?array
    {
        $record = ReportCache::where('campaign_id', $campaignId)
            ->where('date_from', $dateFrom)
            ->where('date_to', $dateTo)
            ->where('report_type', $type)
            ->latest('fetched_at')
            ->first();

        return $record?->payload;
    }
}
