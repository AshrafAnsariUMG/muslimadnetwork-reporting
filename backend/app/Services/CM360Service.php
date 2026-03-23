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
            $this->client->addScope(Dfareporting::DFATRAFFICKING);
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
        $rows = $this->runReport($this->buildSiteReport($campaign, $dateFrom, $dateTo));
        return $this->normalizeSiteBreakdown($rows);
    }

    public function fetchCreativeBreakdown(Campaign $campaign, string $dateFrom, string $dateTo): array
    {
        $rows = $this->runReport($this->buildCreativeReport($campaign, $dateFrom, $dateTo));
        return $this->normalizeCreative($rows);
    }

    public function fetchConversionReport(Campaign $campaign, string $dateFrom, string $dateTo): array
    {
        $csv = $this->runReportRaw($this->buildConversionReport($campaign, $dateFrom, $dateTo));
        return $this->normalizeConversionFromCsv($csv);
    }

    /**
     * Fetch creative metadata (id, name, type, size, preview_url) from the
     * CM360 Creatives API — not a report, a direct resource list.
     * Returns array keyed by creative name for easy lookup.
     * Returns empty array on any error — never crashes the caller.
     */
    public function fetchCreativeMetadata(Campaign $campaign): array
    {
        try {
            $response = $this->service->creatives->listCreatives(
                $this->profileId,
                [
                    'campaignId' => $campaign->cm360_campaign_id,
                    'maxResults'  => 1000,
                ]
            );

            $result = [];
            foreach ($response->getCreatives() ?? [] as $creative) {
                $size   = $creative->getSize();
                $name   = (string) $creative->getName();
                $result[$name] = [
                    'id'          => (string) $creative->getId(),
                    'name'        => $name,
                    'type'        => (string) $creative->getType(),
                    'width'       => $size ? (int) $size->getWidth() : 0,
                    'height'      => $size ? (int) $size->getHeight() : 0,
                    'preview_url' => $this->resolvePreviewUrl($creative),
                ];
            }

            return $result;
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            // DFATRAFFICKING scope is required for the Creatives API.
            // If the refresh token was created with only DFAREPORTING scope,
            // re-run the CM360 OAuth flow with both scopes to fix this.
            if (str_contains($msg, 'insufficientPermissions') || str_contains($msg, 'ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
                Log::warning('CM360 fetchCreativeMetadata: insufficient scope. Re-authorize CM360 OAuth with dfatrafficking scope to enable creative previews.', [
                    'campaign_id' => $campaign->id,
                ]);
            } else {
                Log::error('CM360 fetchCreativeMetadata failed', [
                    'campaign_id' => $campaign->id,
                    'error'       => $msg,
                ]);
            }
            return [];
        }
    }

    /**
     * Construct a publicly accessible preview URL from the creative's primary asset.
     * For HTML_IMAGE assets (DISPLAY creatives), CM360 serves them from s0.2mdn.net.
     */
    private function resolvePreviewUrl(\Google\Service\Dfareporting\Creative $creative): ?string
    {
        foreach ($creative->getCreativeAssets() ?? [] as $asset) {
            if ($asset->getRole() !== 'PRIMARY') {
                continue;
            }
            $identifier = $asset->getAssetIdentifier();
            if (!$identifier) {
                continue;
            }
            $assetName = $identifier->getName();
            $assetType = $identifier->getType();

            if ($assetName && $assetType === 'HTML_IMAGE') {
                return 'https://s0.2mdn.net/' . $this->advertiserId . '/' . rawurlencode($assetName);
            }
        }
        return null;
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

    private function buildSiteReport(Campaign $campaign, string $dateFrom, string $dateTo): Report
    {
        $report = $this->buildStandardReport('MAN-Site', $dateFrom, $dateTo);
        $criteria = $report->getCriteria();
        $criteria->setDimensions([
            $this->makeDimension('domain'),
            $this->makeDimension('app'),
            $this->makeDimension('appId'),
        ]);
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
        $criteria->setDimensions([$this->makeDimension('activity')]);
        $criteria->setMetricNames(['totalConversions', 'totalConversionsRevenue']);
        $activityFilter = new DimensionValue();
        $activityFilter->setDimensionName('activity');
        $activityFilter->setId($campaign->cm360_activity_id);
        $activityFilter->setMatchType('EXACT');
        $criteria->setDimensionFilters([$activityFilter]);
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

    private function normalizeSiteBreakdown(array $rows): array
    {
        // Aggregate by display name, tracking whether each is a domain or app
        // buckets: displayName => ['impressions'=>int, 'clicks'=>int, 'is_app'=>bool, 'app_id'=>string|null]
        $buckets = [];

        foreach ($rows as $row) {
            $domain = $this->extractValue($row, ['Domain', 'domain']);
            $app    = $this->extractValue($row, ['App', 'app']);
            $appIdRaw = $this->extractValue($row, ['App ID', 'appId']);
            $appId  = ($appIdRaw !== '' && $appIdRaw !== '(not set)') ? $appIdRaw : null;

            $impressions = $this->parseInt($row, ['Impressions', 'impressions']);
            $clicks      = $this->parseInt($row, ['Clicks', 'clicks']);

            // Determine display name and whether it's an app placement
            if (
                $domain === 'adsenseformobileapps.com' ||
                $domain === 'mobileapp' ||
                str_starts_with($domain, 'mbapp')
            ) {
                // Mobile app placement — use the app name as display name
                $displayName = ($app !== '' && $app !== '(not set)') ? $app : $domain;
                $isApp = true;
            } elseif ($domain !== '' && $domain !== '(not set)') {
                // Regular web domain
                $displayName = $domain;
                $isApp = false;
            } else {
                // No usable domain — fall back to app name if present
                if ($app !== '' && $app !== '(not set)') {
                    $displayName = $app;
                    $isApp = true;
                } else {
                    continue; // Skip entirely unidentifiable rows
                }
            }

            if (!isset($buckets[$displayName])) {
                $buckets[$displayName] = [
                    'impressions' => 0,
                    'clicks'      => 0,
                    'is_app'      => $isApp,
                    'app_id'      => $appId,
                ];
            } elseif ($isApp && $buckets[$displayName]['app_id'] === null && $appId !== null) {
                // Capture app_id on first row that has it
                $buckets[$displayName]['app_id'] = $appId;
            }
            $buckets[$displayName]['impressions'] += $impressions;
            $buckets[$displayName]['clicks']      += $clicks;
        }

        $domains = [];
        $apps    = [];

        foreach ($buckets as $name => $data) {
            $totalImpressions = $data['impressions'];
            $totalClicks      = $data['clicks'];
            $ctr = $totalImpressions > 0
                ? round($totalClicks / $totalImpressions * 100, 4)
                : 0.0;

            $entry = [
                'impressions' => $totalImpressions,
                'clicks'      => $totalClicks,
                'ctr'         => $ctr,
            ];

            if ($data['is_app']) {
                $apps[] = array_merge(['app' => $name, 'app_id' => $data['app_id']], $entry);
            } else {
                $domains[] = array_merge(['domain' => $name], $entry);
            }
        }

        return ['domains' => $domains, 'apps' => $apps];
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

    private function normalizeConversionFromCsv(string $csv): array
    {
        if (empty(trim($csv))) {
            return ['total_conversions' => 0, 'total_conversion_value' => 0.0];
        }

        $lines = explode("\n", str_replace("\r\n", "\n", $csv));
        $lines = array_map('trim', $lines);

        // Find the "Grand Total:" row — it has the summed values
        $headers    = [];
        $foundMarker = false;

        foreach ($lines as $line) {
            if (empty($line)) continue;

            if (!$foundMarker) {
                $bare = trim($line, '"');
                if ($bare === 'Report Fields' || $bare === 'Report Fields:') {
                    $foundMarker = true;
                }
                continue;
            }

            // First non-empty line after marker = headers
            if (empty($headers)) {
                $headers = array_map('trim', str_getcsv($line));
                continue;
            }

            // Look for Grand Total row
            if (str_starts_with($line, 'Grand Total:')) {
                $cells = array_map('trim', str_getcsv($line));
                // Grand Total: row has label in first cell, then values aligned to headers
                // headers[0] = dimension (e.g. "Activity"), headers[1] = "Total Conversions", headers[2] = "Total Conversions Revenue"
                // cells[0] = "Grand Total:", cells[1] = conversions, cells[2] = revenue
                $row = [];
                foreach ($headers as $i => $header) {
                    $row[$header] = $cells[$i] ?? '';
                }

                $conversionsRaw = $this->extractValue($row, ['Total Conversions', 'Conversions', 'totalConversions']);
                $conversions    = (int) round((float) preg_replace('/[^0-9.]/', '', $conversionsRaw));
                $revenueRaw     = $this->extractValue($row, ['Total Conversions Revenue', 'Total Revenue', 'totalConversionsRevenue', 'Revenue']);
                $revenue        = ($revenueRaw === '' || $revenueRaw === '---')
                    ? 0.0
                    : (float) preg_replace('/[^0-9.]/', '', $revenueRaw);

                return [
                    'total_conversions'      => $conversions,
                    'total_conversion_value' => $revenue,
                ];
            }
        }

        // Fallback: sum data rows
        $rows = $this->parseCsv($csv);
        $total = 0;
        foreach ($rows as $row) {
            $raw    = $this->extractValue($row, ['Total Conversions', 'Conversions', 'totalConversions']);
            $total += (int) round((float) preg_replace('/[^0-9.]/', '', $raw));
        }

        return ['total_conversions' => $total, 'total_conversion_value' => 0.0];
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
     * Like runReport() but returns the raw CSV string instead of parsed rows.
     * Used for reports where we need to inspect the Grand Total row.
     *
     * @throws \RuntimeException
     */
    private function runReportRaw(Report $report): string
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

            return $this->downloadReportFile($reportId, $fileId);
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
