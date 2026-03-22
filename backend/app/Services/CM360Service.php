<?php

namespace App\Services;

use App\Models\Campaign;
use Google\Client;
use Google\Service\Dfareporting;
use Google\Service\Dfareporting\DateRange;
use Google\Service\Dfareporting\DimensionValue;
use Google\Service\Dfareporting\Report;
use Google\Service\Dfareporting\ReportCriteria;
use Google\Service\Dfareporting\ReportFloodlightCriteria;
use Google\Service\Dfareporting\SortedDimension;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CM360Service
{
    private Client $client;
    private Dfareporting $service;
    private string $profileId;
    private string $advertiserId;

    /**
     * @throws \RuntimeException
     */
    public function __construct()
    {
        try {
            $this->profileId = (string) config('services.cm360.profile_id');
            $this->advertiserId = (string) config('services.cm360.advertiser_id');

            $this->client = new Client();
            $this->client->setApplicationName('Muslim Ad Network Reporting');
            $this->client->setClientId(config('services.cm360.client_id'));
            $this->client->setClientSecret(config('services.cm360.client_secret'));
            $this->client->addScope(Dfareporting::DFAREPORTING);
            $this->client->setAccessType('offline');

            $tokenData = $this->client->fetchAccessTokenWithRefreshToken(
                config('services.cm360.refresh_token')
            );

            if (isset($tokenData['error'])) {
                throw new \RuntimeException('CM360 token refresh failed: ' . ($tokenData['error_description'] ?? $tokenData['error']));
            }

            $this->service = new Dfareporting($this->client);
        } catch (\Throwable $e) {
            Log::error('CM360Service init failed', ['error' => $e->getMessage()]);
            throw new \RuntimeException('CM360 service unavailable: ' . $e->getMessage(), 0, $e);
        }
    }

    // ─── Public report methods ────────────────────────────────────────────────

    public function fetchSummaryReport(Campaign $campaign, string $dateFrom, string $dateTo): array
    {
        $rows = $this->runReport($this->buildSummaryReport($campaign, $dateFrom, $dateTo));
        return $this->normalizeSummary($rows, $dateFrom, $dateTo);
    }

    public function fetchDeviceBreakdown(Campaign $campaign, string $dateFrom, string $dateTo): array
    {
        $rows = $this->runReport($this->buildDeviceReport($campaign, $dateFrom, $dateTo));
        return $this->normalizeDevice($rows);
    }

    public function fetchSiteBreakdown(Campaign $campaign, string $dateFrom, string $dateTo): array
    {
        $domainRows = $this->runReport($this->buildDomainReport($campaign, $dateFrom, $dateTo));
        $appRows    = $this->runReport($this->buildAppReport($campaign, $dateFrom, $dateTo));

        return [
            'domains' => $this->normalizeDomains($domainRows),
            'apps'    => $this->normalizeApps($appRows),
        ];
    }

    public function fetchCreativeBreakdown(Campaign $campaign, string $dateFrom, string $dateTo): array
    {
        $rows = $this->runReport($this->buildCreativeReport($campaign, $dateFrom, $dateTo));
        return $this->normalizeCreative($rows);
    }

    public function fetchConversionReport(Campaign $campaign, string $dateFrom, string $dateTo): array
    {
        $rows = $this->runReport($this->buildConversionReport($campaign, $dateFrom, $dateTo));
        return $this->normalizeConversion($rows);
    }

    private function buildSummaryReport(Campaign $campaign, string $dateFrom, string $dateTo): Report
    {
        $report = $this->buildStandardReport('MAN-Summary', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setDimensions([$this->makeDimension('campaign')]);
        $criteria->setMetricNames(['impressions', 'clicks', 'clickRate']);
        $this->addCampaignFilter($criteria, $campaign->cm360_campaign_id);
        $report->setCriteria($criteria);
        return $report;
    }

    private function buildDeviceReport(Campaign $campaign, string $dateFrom, string $dateTo): Report
    {
        $report = $this->buildStandardReport('MAN-Device', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setDimensions([$this->makeDimension('platformType')]);
        $criteria->setMetricNames(['impressions', 'clicks', 'clickRate']);
        $this->addCampaignFilter($criteria, $campaign->cm360_campaign_id);
        $report->setCriteria($criteria);
        return $report;
    }

    private function buildDomainReport(Campaign $campaign, string $dateFrom, string $dateTo): Report
    {
        $report = $this->buildStandardReport('MAN-Domain', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setDimensions([$this->makeDimension('domain')]);
        $criteria->setMetricNames(['impressions', 'clicks', 'clickRate']);
        $this->addCampaignFilter($criteria, $campaign->cm360_campaign_id);
        $report->setCriteria($criteria);
        return $report;
    }

    private function buildAppReport(Campaign $campaign, string $dateFrom, string $dateTo): Report
    {
        $report = $this->buildStandardReport('MAN-App', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setDimensions([$this->makeDimension('app')]);
        $criteria->setMetricNames(['impressions', 'clicks', 'clickRate']);
        $this->addCampaignFilter($criteria, $campaign->cm360_campaign_id);
        $report->setCriteria($criteria);
        return $report;
    }

    private function buildCreativeReport(Campaign $campaign, string $dateFrom, string $dateTo): Report
    {
        $report = $this->buildStandardReport('MAN-Creative', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setDimensions([
            $this->makeDimension('creative'),
            $this->makeDimension('creativeSize'),
        ]);
        $criteria->setMetricNames(['impressions', 'clicks', 'clickRate']);
        $this->addCampaignFilter($criteria, $campaign->cm360_campaign_id);
        $report->setCriteria($criteria);
        return $report;
    }

    private function buildConversionReport(Campaign $campaign, string $dateFrom, string $dateTo): Report
    {
        $report = $this->buildStandardReport('MAN-Conversions', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setDimensions([$this->makeDimension('campaign')]);
        $criteria->setMetricNames(['totalConversions', 'totalConversionValue']);
        $campaignFilter = new DimensionValue();
        $campaignFilter->setDimensionName('campaign');
        $campaignFilter->setId($campaign->cm360_campaign_id);
        $campaignFilter->setMatchType('EXACT');
        $criteria->setDimensionFilters([$campaignFilter]);
        $report->setCriteria($criteria);
        return $report;
    }

    private function normalizeSummary(array $rows, string $dateFrom, string $dateTo): array
    {
        $row = $rows[0] ?? [];
        return [
            'impressions' => $this->parseInt($row, ['Impressions', 'impressions']),
            'clicks'      => $this->parseInt($row, ['Clicks', 'clicks']),
            'ctr'         => $this->parseFloat($row, ['Click Rate', 'clickRate', 'CTR']),
            'date_from'   => $dateFrom,
            'date_to'     => $dateTo,
        ];
    }

    private function normalizeDevice(array $rows): array
    {
        return array_map(fn ($row) => [
            'device'      => $this->extractValue($row, ['Platform Type', 'platformType']),
            'impressions' => $this->parseInt($row, ['Impressions', 'impressions']),
            'clicks'      => $this->parseInt($row, ['Clicks', 'clicks']),
            'ctr'         => $this->parseFloat($row, ['Click Rate', 'clickRate', 'CTR']),
        ], $rows);
    }

    private function normalizeDomains(array $rows): array
    {
        $out = [];
        foreach ($rows as $row) {
            $domain = $this->extractValue($row, ['Domain', 'domain']);
            if ($domain === '' || $domain === '(not set)') continue;
            $out[] = [
                'domain'      => $domain,
                'impressions' => $this->parseInt($row, ['Impressions', 'impressions']),
                'clicks'      => $this->parseInt($row, ['Clicks', 'clicks']),
                'ctr'         => $this->parseFloat($row, ['Click Rate', 'clickRate', 'CTR']),
            ];
        }
        return $out;
    }

    private function normalizeApps(array $rows): array
    {
        $out = [];
        foreach ($rows as $row) {
            $app = $this->extractValue($row, ['App', 'app']);
            if ($app === '' || $app === '(not set)') continue;
            $out[] = [
                'app'         => $app,
                'impressions' => $this->parseInt($row, ['Impressions', 'impressions']),
                'clicks'      => $this->parseInt($row, ['Clicks', 'clicks']),
                'ctr'         => $this->parseFloat($row, ['Click Rate', 'clickRate', 'CTR']),
            ];
        }
        return $out;
    }

    private function normalizeCreative(array $rows): array
    {
        return array_map(fn ($row) => [
            'creative_name' => $this->extractValue($row, ['Creative', 'creative']),
            'size'          => $this->extractValue($row, ['Creative Pixel Size', 'Creative Size', 'creativeSize']),
            'impressions'   => $this->parseInt($row, ['Impressions', 'impressions']),
            'clicks'        => $this->parseInt($row, ['Clicks', 'clicks']),
            'ctr'           => $this->parseFloat($row, ['Click Rate', 'clickRate', 'CTR']),
        ], $rows);
    }

    private function normalizeConversion(array $rows): array
    {
        $row = $rows[0] ?? [];
        return [
            'total_conversions'      => $this->parseInt($row, ['Total Conversions', 'totalConversions', 'Conversions']),
            'total_conversion_value' => $this->parseFloat($row, ['Total Conversion Value', 'totalConversionValue']),
        ];
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function buildStandardReport(string $name, string $dateFrom, string $dateTo): Report
    {
        $dateRange = new DateRange();
        $dateRange->setStartDate($dateFrom);
        $dateRange->setEndDate($dateTo);

        $criteria = new ReportCriteria();
        $criteria->setDateRange($dateRange);

        $report = new Report();
        $report->setName($name . '-' . now()->format('YmdHis'));
        $report->setType('STANDARD');
        $report->setCriteria($criteria);

        return $report;
    }

    private function addCampaignFilter(ReportCriteria $criteria, string $campaignId): void
    {
        $filter = new DimensionValue();
        $filter->setDimensionName('campaign');
        $filter->setId($campaignId);
        $filter->setMatchType('EXACT');

        $existing = $criteria->getDimensionFilters() ?? [];
        $criteria->setDimensionFilters(array_merge($existing, [$filter]));
    }

    private function makeDimension(string $name): SortedDimension
    {
        $dim = new SortedDimension();
        $dim->setName($name);
        return $dim;
    }

    /**
     * Insert a report, run it, poll until complete, download and parse CSV.
     *
     * @throws \RuntimeException
     */
    private function runReport(Report $report): array
    {
        $inserted = $this->service->reports->insert($this->profileId, $report);
        $reportId = $inserted->getId();

        try {
            $file   = $this->service->reports->run($this->profileId, $reportId);
            $fileId = $file->getId();

            $maxAttempts = 60;
            for ($i = 0; $i < $maxAttempts; $i++) {
                $status = $file->getStatus();

                if ($status === 'REPORT_AVAILABLE') {
                    break;
                }

                if ($status === 'FAILED') {
                    throw new \RuntimeException('CM360 report generation failed (FAILED status).');
                }

                sleep(2);
                $file = $this->service->files->get($reportId, $fileId);
            }

            if ($file->getStatus() !== 'REPORT_AVAILABLE') {
                throw new \RuntimeException('CM360 report timed out after 120 seconds.');
            }

            return $this->parseCsv($this->downloadReportFile($reportId, $fileId));
        } finally {
            try {
                $this->service->reports->delete($this->profileId, $reportId);
            } catch (\Throwable $e) {
                Log::warning('CM360 report cleanup failed', ['report_id' => $reportId, 'error' => $e->getMessage()]);
            }
        }
    }

    /**
     * Download a completed report file using the access token.
     */
    private function downloadReportFile(string $reportId, string $fileId): string
    {
        $accessToken = $this->client->getAccessToken();
        $token = $accessToken['access_token'] ?? '';

        $url = sprintf(
            'https://www.googleapis.com/dfareporting/v4/userprofiles/%s/reports/%s/files/%s?alt=media',
            $this->profileId,
            $reportId,
            $fileId
        );

        $response = Http::withToken($token)->get($url);

        if ($response->failed()) {
            throw new \RuntimeException('Failed to download CM360 report file: HTTP ' . $response->status());
        }

        return $response->body();
    }

    /**
     * Parse CM360 report CSV format.
     *
     * CM360 CSVs have metadata lines at the top, then a header row,
     * then data rows, then a "Grand Total:" footer.
     */
    /**
     * Parse CM360 report CSV format.
     *
     * CM360 CSV structure:
     *   Line 1:  Report name (no prefix)
     *   Lines 2+: Metadata (Date/Time, Account ID, Date Range, etc.)
     *   Line:    "Report Fields"  ← marker (no colon)
     *   Line:    Actual column headers (Campaign,Impressions,Clicks,Click Rate…)
     *   Lines:   Data rows
     *   Line:    "Grand Total:,…"  ← stop here
     */
    private function parseCsv(string $content): array
    {
        if (empty(trim($content))) {
            return [];
        }

        $lines = explode("\n", str_replace("\r\n", "\n", $content));
        $lines = array_map('trim', $lines);

        // Seek the "Report Fields" marker, then take the next non-empty line as headers.
        $headerIdx   = null;
        $headers     = [];
        $foundMarker = false;

        foreach ($lines as $idx => $line) {
            if (empty($line)) continue;

            if (!$foundMarker) {
                // Match "Report Fields" with or without trailing colon, possibly quoted
                $bare = trim($line, '"');
                if ($bare === 'Report Fields' || $bare === 'Report Fields:') {
                    $foundMarker = true;
                }
                continue;
            }

            // First non-empty line after the marker is the column header row
            $headers   = array_map('trim', str_getcsv($line));
            $headerIdx = $idx;
            break;
        }

        if ($headerIdx === null || empty($headers)) {
            Log::warning('CM360 CSV: could not locate header row after "Report Fields" marker', [
                'preview' => substr($content, 0, 800),
            ]);
            return [];
        }

        $rows = [];
        for ($i = $headerIdx + 1; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if (empty($line)) continue;

            if (
                str_starts_with($line, 'Grand Total:') ||
                str_starts_with($line, 'Totals:') ||
                str_starts_with($line, 'Total,')
            ) {
                break;
            }

            $cells = str_getcsv($line);
            if (count($cells) !== count($headers)) continue;

            $rows[] = array_combine($headers, array_map('trim', $cells));
        }

        return $rows;
    }

    // ─── Value extraction helpers ─────────────────────────────────────────────

    private function extractValue(array $row, array $keys): string
    {
        foreach ($keys as $key) {
            if (isset($row[$key])) {
                return (string) $row[$key];
            }
        }
        // Case-insensitive fallback
        $lower = array_change_key_case($row, CASE_LOWER);
        foreach ($keys as $key) {
            if (isset($lower[strtolower($key)])) {
                return (string) $lower[strtolower($key)];
            }
        }
        return '';
    }

    private function parseInt(array $row, array $keys): int
    {
        $val = $this->extractValue($row, $keys);
        return (int) preg_replace('/[^0-9]/', '', $val);
    }

    private function parseFloat(array $row, array $keys): float
    {
        $val = $this->extractValue($row, $keys);
        // Remove % sign and other non-numeric characters except . and -
        $val = preg_replace('/[^0-9.\-]/', '', $val);
        return (float) $val;
    }
}
