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
        $report = $this->buildStandardReport('MAN-Summary', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setMetricNames(['impressions', 'clicks', 'clickRate']);
        $this->addCampaignFilter($criteria, $campaign->cm360_campaign_id);
        $report->setCriteria($criteria);

        $rows = $this->runReport($report);
        $row = $rows[0] ?? [];

        return [
            'impressions' => $this->parseInt($row, ['Impressions', 'impressions']),
            'clicks'      => $this->parseInt($row, ['Clicks', 'clicks']),
            'ctr'         => $this->parseFloat($row, ['Click Rate', 'clickRate', 'CTR']),
            'date_from'   => $dateFrom,
            'date_to'     => $dateTo,
        ];
    }

    public function fetchDeviceBreakdown(Campaign $campaign, string $dateFrom, string $dateTo): array
    {
        $report = $this->buildStandardReport('MAN-Device', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setDimensions([$this->makeDimension('platformType')]);
        $criteria->setMetricNames(['impressions', 'clicks', 'clickRate']);
        $this->addCampaignFilter($criteria, $campaign->cm360_campaign_id);
        $report->setCriteria($criteria);

        $rows = $this->runReport($report);

        return array_map(fn ($row) => [
            'device'      => $this->extractValue($row, ['Platform Type', 'platformType']),
            'impressions' => $this->parseInt($row, ['Impressions', 'impressions']),
            'clicks'      => $this->parseInt($row, ['Clicks', 'clicks']),
            'ctr'         => $this->parseFloat($row, ['Click Rate', 'clickRate', 'CTR']),
        ], $rows);
    }

    public function fetchSiteBreakdown(Campaign $campaign, string $dateFrom, string $dateTo): array
    {
        $report = $this->buildStandardReport('MAN-Site', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setDimensions([$this->makeDimension('site')]);
        $criteria->setMetricNames(['impressions', 'clicks', 'clickRate']);
        $this->addCampaignFilter($criteria, $campaign->cm360_campaign_id);
        $report->setCriteria($criteria);

        $rows = $this->runReport($report);

        return array_map(fn ($row) => [
            'site'        => $this->extractValue($row, ['Site (CM360)', 'Site', 'site']),
            'impressions' => $this->parseInt($row, ['Impressions', 'impressions']),
            'clicks'      => $this->parseInt($row, ['Clicks', 'clicks']),
            'ctr'         => $this->parseFloat($row, ['Click Rate', 'clickRate', 'CTR']),
        ], $rows);
    }

    public function fetchCreativeBreakdown(Campaign $campaign, string $dateFrom, string $dateTo): array
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

        $rows = $this->runReport($report);

        return array_map(fn ($row) => [
            'creative_name' => $this->extractValue($row, ['Creative', 'creative']),
            'size'          => $this->extractValue($row, ['Creative Size', 'creativeSize']),
            'impressions'   => $this->parseInt($row, ['Impressions', 'impressions']),
            'clicks'        => $this->parseInt($row, ['Clicks', 'clicks']),
            'ctr'           => $this->parseFloat($row, ['Click Rate', 'clickRate', 'CTR']),
        ], $rows);
    }

    public function fetchConversionReport(Campaign $campaign, string $dateFrom, string $dateTo): array
    {
        // Use a STANDARD report with conversion metrics + activity filter
        $report = $this->buildStandardReport('MAN-Conversions', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setMetricNames(['totalConversions', 'totalConversionValue']);

        // Filter by campaign and activity
        $campaignFilter = new DimensionValue();
        $campaignFilter->setDimensionName('campaign');
        $campaignFilter->setId($campaign->cm360_campaign_id);
        $campaignFilter->setMatchType('EXACT');

        $activityFilter = new DimensionValue();
        $activityFilter->setDimensionName('activity');
        $activityFilter->setId($campaign->cm360_activity_id);
        $activityFilter->setMatchType('EXACT');

        $criteria->setDimensionFilters([$campaignFilter, $activityFilter]);
        $report->setCriteria($criteria);

        $rows = $this->runReport($report);
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
        // Insert (creates a stored report)
        $inserted = $this->service->reports->insert($this->profileId, $report);
        $reportId = $inserted->getId();

        try {
            // Start the run
            $file = $this->service->reports->run($this->profileId, $reportId);
            $fileId = $file->getId();

            // Poll until REPORT_AVAILABLE or FAILED
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
                $file = $this->service->files->get($this->profileId, $reportId, $fileId);
            }

            if ($file->getStatus() !== 'REPORT_AVAILABLE') {
                throw new \RuntimeException('CM360 report timed out after 120 seconds.');
            }

            // Download the CSV
            $csvContent = $this->downloadReportFile($reportId, $fileId);

            return $this->parseCsv($csvContent);
        } finally {
            // Cleanup: delete the report to avoid cluttering CM360
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
    private function parseCsv(string $content): array
    {
        if (empty(trim($content))) {
            return [];
        }

        $lines = explode("\n", str_replace("\r\n", "\n", $content));
        $lines = array_map('trim', $lines);

        // Find the header row: the first line that looks like actual column headers
        // (not metadata). We detect it by checking if it does NOT contain a colon
        // pattern like "Report Name: ..." and has multiple comma-separated values.
        $headerIdx = null;
        $headers = [];

        foreach ($lines as $idx => $line) {
            if (empty($line)) continue;

            // Skip metadata lines (typically "Label: Value" format or short single items)
            // The data header row will have multiple fields separated by commas
            $cells = str_getcsv($line);

            // Skip if this is clearly a metadata line (contains colon in first cell and only 1-2 cells)
            if (count($cells) <= 2 && str_contains($cells[0] ?? '', ':')) {
                continue;
            }

            // Skip the "Report Fields:" marker line
            if (trim($cells[0] ?? '') === 'Report Fields:' || str_starts_with(trim($line), 'Report Fields:')) {
                continue;
            }

            // This looks like a header/data row — use it as our header
            if (count($cells) >= 1 && !empty($cells[0])) {
                $headerIdx = $idx;
                $headers = array_map('trim', $cells);
                break;
            }
        }

        if ($headerIdx === null || empty($headers)) {
            Log::warning('CM360 CSV: could not locate header row', ['preview' => substr($content, 0, 500)]);
            return [];
        }

        $rows = [];
        for ($i = $headerIdx + 1; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if (empty($line)) continue;

            // Stop at the Grand Total footer
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
