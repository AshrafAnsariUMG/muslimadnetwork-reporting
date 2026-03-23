<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Campaign Report — {{ $campaign->name }}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 10px; color: #1a1a1a; background: #fff; }

  /* ── Page breaks ── */
  .page { page-break-after: always; padding: 40px; min-height: 100vh; position: relative; }
  .page:last-child { page-break-after: avoid; }

  /* ── Colors ── */
  .gold { color: #C9A84C; }
  .green { color: #1a4a2e; }
  .muted { color: #64748b; }
  .danger { color: #dc2626; }
  .success { color: #059669; }

  /* ── Cover page ── */
  .cover { background: linear-gradient(160deg, #1a4a2e 0%, #0f2d1c 100%); color: #fff; display: flex; flex-direction: column; justify-content: center; }
  .cover-logo { font-size: 22px; font-weight: bold; color: #C9A84C; letter-spacing: 1px; margin-bottom: 8px; }
  .cover-tagline { font-size: 10px; color: rgba(255,255,255,0.6); margin-bottom: 60px; letter-spacing: 2px; text-transform: uppercase; }
  .cover-title { font-size: 28px; font-weight: bold; color: #ffffff; margin-bottom: 8px; }
  .cover-subtitle { font-size: 13px; color: #C9A84C; margin-bottom: 48px; }
  .cover-meta { border-top: 1px solid rgba(201,168,76,0.3); padding-top: 24px; }
  .cover-meta-row { display: flex; margin-bottom: 10px; }
  .cover-meta-label { width: 140px; font-size: 9px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }
  .cover-meta-value { font-size: 10px; color: #ffffff; font-weight: 600; }
  .cover-border { border: 2px solid rgba(201,168,76,0.4); border-radius: 4px; padding: 24px; margin-top: 48px; }
  .cover-border-inner { border: 1px solid rgba(201,168,76,0.2); padding: 16px; text-align: center; }
  .cover-footer { position: absolute; bottom: 40px; left: 40px; right: 40px; display: flex; justify-content: space-between; font-size: 8px; color: rgba(255,255,255,0.4); }
  .cover-generated { font-size: 9px; color: rgba(255,255,255,0.5); text-align: center; margin-top: 12px; }

  /* ── Page header (non-cover) ── */
  .page-header { border-bottom: 2px solid #C9A84C; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  .page-header-title { font-size: 16px; font-weight: bold; color: #1a4a2e; }
  .page-header-sub { font-size: 8px; color: #64748b; }
  .page-header-logo { font-size: 11px; font-weight: bold; color: #C9A84C; }

  /* ── Health score circle (CSS) ── */
  .health-section { display: flex; align-items: center; gap: 24px; background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #C9A84C; }
  .health-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 6px solid #C9A84C; flex-shrink: 0; }
  .health-score-num { font-size: 22px; font-weight: bold; color: #1a1a1a; line-height: 1; }
  .health-score-denom { font-size: 9px; color: #64748b; }
  .health-label-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 9px; font-weight: bold; margin-top: 6px; }
  .health-info { flex: 1; }
  .health-info h3 { font-size: 13px; font-weight: bold; color: #1a1a1a; margin-bottom: 8px; }
  .health-info p { font-size: 9px; color: #64748b; line-height: 1.5; }

  /* ── Metric boxes ── */
  .metric-grid { display: flex; gap: 12px; margin-bottom: 20px; }
  .metric-box { flex: 1; background: #f8fafc; border-radius: 6px; padding: 14px 12px; border-top: 3px solid #C9A84C; }
  .metric-label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .metric-value { font-size: 18px; font-weight: bold; color: #1a1a1a; }
  .metric-sub { font-size: 8px; color: #64748b; margin-top: 2px; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: #1a4a2e; color: #fff; }
  thead th { padding: 7px 10px; text-align: left; font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 7px 10px; font-size: 9px; color: #374151; }
  tbody tr.top-performer { background: #fef9ec; }
  tbody tr.top-performer td { font-weight: 600; color: #92400e; }
  .gold-badge { background: #C9A84C; color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 7px; font-weight: bold; }

  /* ── CSS bar chart ── */
  .bar-chart-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .bar-label { width: 100px; font-size: 8px; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar-track { flex: 1; height: 10px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; background: #1a4a2e; border-radius: 4px; }
  .bar-fill.gold { background: #C9A84C; }
  .bar-value { width: 40px; font-size: 8px; color: #64748b; text-align: right; }

  /* ── Section headings ── */
  .section-heading { font-size: 12px; font-weight: bold; color: #1a4a2e; border-bottom: 2px solid #C9A84C; padding-bottom: 4px; margin-bottom: 14px; }

  /* ── Pacing bar ── */
  .pacing-bar-track { background: #f1f5f9; border-radius: 6px; height: 12px; overflow: hidden; margin: 8px 0; position: relative; }
  .pacing-bar-fill { height: 100%; border-radius: 6px; }
  .pacing-bar-marker { position: absolute; top: 0; bottom: 0; width: 2px; background: rgba(100,116,139,0.5); }
  .pacing-row { display: flex; justify-content: space-between; font-size: 8px; color: #64748b; margin-bottom: 4px; }

  /* ── Closing page ── */
  .closing { background: linear-gradient(160deg, #1a4a2e 0%, #0f2d1c 100%); color: #fff; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; }
  .closing-title { font-size: 22px; font-weight: bold; color: #C9A84C; margin-bottom: 12px; }
  .closing-body { font-size: 11px; color: rgba(255,255,255,0.8); max-width: 360px; line-height: 1.7; margin-bottom: 32px; }
  .closing-contact { background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.4); border-radius: 8px; padding: 16px 32px; margin-bottom: 32px; }
  .closing-contact p { font-size: 10px; color: #C9A84C; }
  .closing-footer { font-size: 8px; color: rgba(255,255,255,0.3); }

  /* ── Benchmark pill ── */
  .benchmark-above { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 10px; font-size: 8px; font-weight: bold; display: inline-block; }
  .benchmark-below { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 10px; font-size: 8px; font-weight: bold; display: inline-block; }

  /* ── Geometric decorative border (CSS only) ── */
  .geometric-border { border: 3px double #C9A84C; border-radius: 4px; padding: 3px; }
  .geometric-border-inner { border: 1px solid rgba(201,168,76,0.4); }
</style>
</head>
<body>

{{-- ════════════════════════════════════════════════════════════════
     PAGE 1 — Cover
     ════════════════════════════════════════════════════════════════ --}}
<div class="page cover">
  <div class="cover-logo">Muslim Ad Network</div>
  <div class="cover-tagline">Advertising · Analytics · Results</div>

  <div class="cover-title">Campaign Performance Report</div>
  <div class="cover-subtitle">Powered by Google Campaign Manager 360</div>

  <div class="cover-meta">
    <div class="cover-meta-row">
      <div class="cover-meta-label">Client</div>
      <div class="cover-meta-value">{{ $client->name }}</div>
    </div>
    <div class="cover-meta-row">
      <div class="cover-meta-label">Campaign</div>
      <div class="cover-meta-value">{{ $campaign->name }}</div>
    </div>
    <div class="cover-meta-row">
      <div class="cover-meta-label">Report Period</div>
      <div class="cover-meta-value">
        {{ \Carbon\Carbon::parse($dateFrom)->format('M j, Y') }} — {{ \Carbon\Carbon::parse($dateTo)->format('M j, Y') }}
      </div>
    </div>
    <div class="cover-meta-row">
      <div class="cover-meta-label">Status</div>
      <div class="cover-meta-value" style="text-transform: capitalize;">{{ $campaign->status->value }}</div>
    </div>
  </div>

  <div class="cover-border" style="margin-top: 32px;">
    <div class="cover-border-inner">
      <div style="font-size: 9px; color: rgba(255,255,255,0.4); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px;">بسم الله الرحمن الرحيم</div>
      <div style="font-size: 8px; color: rgba(201,168,76,0.6);">In the name of Allah, the Most Gracious, the Most Merciful</div>
    </div>
  </div>

  <div class="cover-generated">Generated on {{ $generatedAt }}</div>

  <div class="cover-footer">
    <span>Muslim Ad Network</span>
    <span>Confidential — For Client Use Only</span>
    <span>{{ $generatedAt }}</span>
  </div>
</div>

{{-- ════════════════════════════════════════════════════════════════
     PAGE 2 — Executive Summary
     ════════════════════════════════════════════════════════════════ --}}
<div class="page">
  <div class="page-header">
    <div>
      <div class="page-header-title">Executive Summary</div>
      <div class="page-header-sub">{{ $campaign->name }} · {{ \Carbon\Carbon::parse($dateFrom)->format('M j, Y') }} – {{ \Carbon\Carbon::parse($dateTo)->format('M j, Y') }}</div>
    </div>
    <div class="page-header-logo">Muslim Ad Network</div>
  </div>

  {{-- Health Score --}}
  <div class="health-section">
    @php
      $healthColor = match($healthLabel) {
        'Excellent' => '#10b981',
        'Good' => '#2563eb',
        'On Track' => '#C9A84C',
        default => '#ef4444',
      };
      $healthBadgeBg = match($healthLabel) {
        'Excellent' => '#d1fae5',
        'Good' => '#dbeafe',
        'On Track' => '#fef3c7',
        default => '#fee2e2',
      };
      $healthBadgeText = match($healthLabel) {
        'Excellent' => '#065f46',
        'Good' => '#1e40af',
        'On Track' => '#92400e',
        default => '#991b1b',
      };
    @endphp
    <div class="health-circle" style="border-color: {{ $healthColor }};">
      <div class="health-score-num">{{ $healthScore }}</div>
      <div class="health-score-denom">/ 100</div>
    </div>
    <div class="health-info">
      <h3>Campaign Health Score
        <span class="health-label-badge" style="background: {{ $healthBadgeBg }}; color: {{ $healthBadgeText }};">{{ $healthLabel }}</span>
      </h3>
      <p>Score based on CTR vs. network average and campaign delivery pacing. A score of 80+ indicates excellent performance across all key metrics.</p>
    </div>
  </div>

  {{-- Key Metrics --}}
  <div class="metric-grid">
    <div class="metric-box">
      <div class="metric-label">Impressions</div>
      <div class="metric-value">{{ number_format($summary['impressions'] ?? 0) }}</div>
      <div class="metric-sub">Total delivered</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Clicks</div>
      <div class="metric-value">{{ number_format($summary['clicks'] ?? 0) }}</div>
      <div class="metric-sub">Total clicks</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">CTR</div>
      <div class="metric-value">{{ number_format(($summary['ctr'] ?? 0) * 100, 2) }}%</div>
      <div class="metric-sub">
        @if($ctrVsBenchmark >= 0)
          <span class="benchmark-above">+{{ $ctrVsBenchmark }}% vs avg</span>
        @else
          <span class="benchmark-below">{{ $ctrVsBenchmark }}% vs avg</span>
        @endif
      </div>
    </div>
    @if($contracted > 0)
    <div class="metric-box">
      <div class="metric-label">Contracted</div>
      <div class="metric-value">{{ number_format($contracted) }}</div>
      <div class="metric-sub">Impressions contracted</div>
    </div>
    @endif
  </div>

  {{-- Pacing --}}
  @if($contracted > 0)
  <div class="section-heading">Impression Pacing</div>
  <div class="pacing-row">
    <span>Delivered: <strong>{{ $deliveredPct }}%</strong> ({{ number_format($delivered) }} impr)</span>
    <span>Expected by today: <strong>{{ $expectedPct }}%</strong></span>
  </div>
  <div class="pacing-bar-track">
    @php $barColor = $deliveredPct >= ($expectedPct - 10) ? '#10b981' : ($deliveredPct >= ($expectedPct - 25) ? '#f59e0b' : '#ef4444'); @endphp
    <div class="pacing-bar-fill" style="width: {{ min(100, $deliveredPct) }}%; background: {{ $barColor }};"></div>
  </div>
  <div class="pacing-row">
    <span>Campaign: {{ \Carbon\Carbon::parse($dateFrom)->format('M j, Y') }} – {{ \Carbon\Carbon::parse($dateTo)->format('M j, Y') }}</span>
    @php
      $pacingStatus = $deliveredPct >= ($expectedPct - 10) ? 'On Pace' : ($deliveredPct >= ($expectedPct - 25) ? 'Slightly Behind' : 'Behind Pace');
    @endphp
    <span style="color: {{ $barColor }}; font-weight: 600;">{{ $pacingStatus }}</span>
  </div>
  @endif

  {{-- Campaign dates box --}}
  <div style="background: #f8fafc; border-radius: 6px; padding: 12px 16px; margin-top: 12px; display: flex; gap: 24px;">
    <div>
      <div style="font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Start Date</div>
      <div style="font-size: 11px; font-weight: 600; color: #1a1a1a;">{{ \Carbon\Carbon::parse($campaign->start_date)->format('M j, Y') }}</div>
    </div>
    <div>
      <div style="font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">End Date</div>
      <div style="font-size: 11px; font-weight: 600; color: #1a1a1a;">{{ \Carbon\Carbon::parse($campaign->end_date)->format('M j, Y') }}</div>
    </div>
    <div>
      <div style="font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Network Avg CTR</div>
      <div style="font-size: 11px; font-weight: 600; color: #1a1a1a;">{{ number_format($networkAvgCtr * 100, 2) }}%</div>
    </div>
    <div>
      <div style="font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Campaign Status</div>
      <div style="font-size: 11px; font-weight: 600; color: #1a1a1a; text-transform: capitalize;">{{ $campaign->status->value }}</div>
    </div>
  </div>
</div>

{{-- ════════════════════════════════════════════════════════════════
     PAGE 3 — Device Breakdown
     ════════════════════════════════════════════════════════════════ --}}
<div class="page">
  <div class="page-header">
    <div>
      <div class="page-header-title">Device Breakdown</div>
      <div class="page-header-sub">{{ $campaign->name }} · Distribution by device type</div>
    </div>
    <div class="page-header-logo">Muslim Ad Network</div>
  </div>

  @php
    $totalImpr = max(1, array_sum(array_column($device, 'impressions')));
    usort($device, fn($a, $b) => $b['impressions'] <=> $a['impressions']);
    $maxDeviceImpr = max(1, $device[0]['impressions'] ?? 1);
  @endphp

  @if(!empty($device))
  <table>
    <thead>
      <tr>
        <th>Device</th>
        <th>Impressions</th>
        <th>% of Total</th>
        <th>Clicks</th>
        <th>CTR</th>
      </tr>
    </thead>
    <tbody>
      @foreach($device as $row)
      @php $sharePct = round(($row['impressions'] / $totalImpr) * 100, 1); @endphp
      <tr>
        <td>{{ $row['device'] }}</td>
        <td>{{ number_format($row['impressions']) }}</td>
        <td>{{ $sharePct }}%</td>
        <td>{{ number_format($row['clicks']) }}</td>
        <td>{{ number_format(($row['ctr'] ?? 0) * 100, 2) }}%</td>
      </tr>
      @endforeach
    </tbody>
  </table>

  <div class="section-heading" style="margin-top: 20px;">Impression Share by Device</div>
  @foreach($device as $row)
    @php $pct = round(($row['impressions'] / $totalImpr) * 100, 1); @endphp
    <div class="bar-chart-row">
      <div class="bar-label">{{ $row['device'] }}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width: {{ $pct }}%;"></div>
      </div>
      <div class="bar-value">{{ $pct }}%</div>
    </div>
  @endforeach
  @else
  <div style="text-align: center; color: #64748b; padding: 40px 0; font-size: 10px;">No device data available for this period.</div>
  @endif
</div>

{{-- ════════════════════════════════════════════════════════════════
     PAGE 4 — Top Domains & Apps
     ════════════════════════════════════════════════════════════════ --}}
<div class="page">
  <div class="page-header">
    <div>
      <div class="page-header-title">Top Domains &amp; Apps</div>
      <div class="page-header-sub">{{ $campaign->name }} · Site and app placement breakdown</div>
    </div>
    <div class="page-header-logo">Muslim Ad Network</div>
  </div>

  @php
    $topDomains = array_slice($domains, 0, 10);
    $topApps = array_slice($apps, 0, 10);
    $totalSiteImpr = max(1, array_sum(array_column($domains, 'impressions')) + array_sum(array_column($apps, 'impressions')));
  @endphp

  @if(!empty($topDomains))
  <div class="section-heading">Top 10 Domains</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Domain</th>
        <th>Impressions</th>
        <th>% Share</th>
        <th>Clicks</th>
        <th>CTR</th>
      </tr>
    </thead>
    <tbody>
      @foreach($topDomains as $i => $row)
      @php $sharePct = max(1, array_sum(array_column($domains, 'impressions'))); @endphp
      <tr>
        <td>{{ $i + 1 }}</td>
        <td>{{ $row['domain'] }}</td>
        <td>{{ number_format($row['impressions']) }}</td>
        <td>{{ round(($row['impressions'] / $sharePct) * 100, 1) }}%</td>
        <td>{{ number_format($row['clicks']) }}</td>
        <td>{{ number_format(($row['ctr'] ?? 0) * 100, 2) }}%</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  @if(!empty($topApps))
  <div class="section-heading" style="margin-top: 16px;">Top 10 Apps</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>App</th>
        <th>Impressions</th>
        <th>% Share</th>
        <th>Clicks</th>
        <th>CTR</th>
      </tr>
    </thead>
    <tbody>
      @foreach($topApps as $i => $row)
      @php $sharePct = max(1, array_sum(array_column($apps, 'impressions'))); @endphp
      <tr>
        <td>{{ $i + 1 }}</td>
        <td>{{ $row['app'] }}</td>
        <td>{{ number_format($row['impressions']) }}</td>
        <td>{{ round(($row['impressions'] / $sharePct) * 100, 1) }}%</td>
        <td>{{ number_format($row['clicks']) }}</td>
        <td>{{ number_format(($row['ctr'] ?? 0) * 100, 2) }}%</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  @if(empty($topDomains) && empty($topApps))
  <div style="text-align: center; color: #64748b; padding: 40px 0; font-size: 10px;">No site data available for this period.</div>
  @endif
</div>

{{-- ════════════════════════════════════════════════════════════════
     PAGE 5 — Creative Performance
     ════════════════════════════════════════════════════════════════ --}}
<div class="page">
  <div class="page-header">
    <div>
      <div class="page-header-title">Creative Performance</div>
      <div class="page-header-sub">{{ $campaign->name }} · All creatives ranked by impressions</div>
    </div>
    <div class="page-header-logo">Muslim Ad Network</div>
  </div>

  @php
    usort($creative, fn($a, $b) => $b['impressions'] <=> $a['impressions']);
  @endphp

  @if(!empty($creative))
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Creative Name</th>
        <th>Size</th>
        <th>Impressions</th>
        <th>Clicks</th>
        <th>CTR</th>
      </tr>
    </thead>
    <tbody>
      @foreach($creative as $i => $row)
      <tr @if($topPerformer && $row['creative_name'] === $topPerformer) class="top-performer" @endif>
        <td>{{ $i + 1 }}</td>
        <td>
          {{ $row['creative_name'] }}
          @if($topPerformer && $row['creative_name'] === $topPerformer)
            <span class="gold-badge">Top Performer</span>
          @endif
        </td>
        <td>{{ $row['size'] ?? '—' }}</td>
        <td>{{ number_format($row['impressions']) }}</td>
        <td>{{ number_format($row['clicks']) }}</td>
        <td>{{ number_format(($row['ctr'] ?? 0) * 100, 2) }}%</td>
      </tr>
      @endforeach
    </tbody>
  </table>

  @if($topPerformer)
  <div style="background: #fef9ec; border-left: 3px solid #C9A84C; padding: 8px 12px; border-radius: 4px; font-size: 8px; color: #92400e; margin-top: 8px;">
    ★ <strong>Top Performer:</strong> {{ $topPerformer }} — highest CTR among creatives with 100+ impressions.
  </div>
  @endif
  @else
  <div style="text-align: center; color: #64748b; padding: 40px 0; font-size: 10px;">No creative data available for this period.</div>
  @endif
</div>

{{-- ════════════════════════════════════════════════════════════════
     PAGE 6 — Closing
     ════════════════════════════════════════════════════════════════ --}}
<div class="page closing">
  <div class="closing-title">Thank You for Choosing<br>Muslim Ad Network</div>

  <div class="closing-body">
    We are committed to delivering transparent, data-driven advertising solutions that connect your brand with engaged Muslim audiences worldwide. We appreciate your trust and partnership.
  </div>

  <div class="closing-contact">
    <p style="font-size: 9px; color: rgba(201,168,76,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Get In Touch</p>
    <p style="font-size: 12px; font-weight: bold;">support@muslimadnetwork.com</p>
  </div>

  <div style="border: 1px solid rgba(201,168,76,0.3); padding: 3px; border-radius: 4px; margin-bottom: 32px;">
    <div style="border: 1px solid rgba(201,168,76,0.15); padding: 10px 32px; border-radius: 2px;">
      <div style="font-size: 14px; color: rgba(201,168,76,0.8); text-align: center; letter-spacing: 2px;">✦ ✦ ✦</div>
    </div>
  </div>

  <div class="closing-footer">
    <div>Data sourced from Google Campaign Manager 360</div>
    <div style="margin-top: 4px;">Report generated {{ $generatedAt }} · Confidential</div>
  </div>
</div>

</body>
</html>
