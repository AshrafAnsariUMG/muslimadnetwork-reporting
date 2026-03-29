# Muslim Ad Network — Client Reporting Portal

## Project Overview
A client-facing reporting portal for Muslim Ad Network. Clients log in (via UmmahPass OAuth or password) to view campaign performance data pulled from Campaign Manager 360 (CM360). Admins manage clients, campaigns, offers, and can impersonate client accounts.

---

## Stack & Ports

| Layer               | Tech                        | Port |
|---------------------|-----------------------------|------|
| Backend             | Laravel 13 (PHP 8.3)        | 8001 |
| Frontend            | Next.js 14 (App Router, TS) | 3001 |
| Database            | MySQL                        | 3306 |
| Cache/Queue/Session | Redis                        | 6379 |

> Note: Laravel 13 was installed (latest available at scaffold time). Task spec referenced Laravel 11.

---

## Folder Structure

```
/var/www/muslimadnetwork-reporting/
├── CLAUDE.md
├── backend/
│   ├── app/
│   │   ├── Enums/
│   │   │   ├── UserRole.php             # admin | client
│   │   │   ├── ClientType.php           # standard | conversion | multi_campaign
│   │   │   └── CampaignStatus.php       # active | paused | ended | upcoming
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── UmmahPassController.php
│   │   │   │   ├── ReportController.php          # Client report endpoints + pacing() + creativesMetadata(); creative() injects CreativeEvaluationService
│   │   │   │   ├── Reports/
│   │   │   │   │   └── CampaignSummaryController.php  # GET /api/reports/campaign-summary/pdf (client+admin)
│   │   │   │   ├── PasswordResetController.php   # forgot-password + reset-password
│   │   │   │   └── Admin/
│   │   │   │       ├── ClientController.php
│   │   │   │       ├── UserController.php
│   │   │   │       ├── CampaignController.php
│   │   │   │       ├── ImpersonationController.php
│   │   │   │       ├── StatsController.php        # total_clients, total_users, total_campaigns, campaigns_by_status, top_clients, recent_activity
│   │   │   │       ├── AuditLogController.php    # GET /api/admin/audit-log; paginated 50/page; filters: admin_id, action, date_from, date_to
│   │   │   │       ├── OfferAdminController.php  # CRUD + toggle for offers; index includes dismissals_count + client name
│   │   │   │       ├── CacheController.php       # Manual cache invalidation
│   │   │   │       ├── OnboardingController.php  # Send onboarding email (resets password + emails credentials)
│   │   │       ├── VisibilityController.php  # Admin visibility CRUD (overview/show/upsert/reset)
│   │   │       ├── DisplayNameController.php # GET/POST/DELETE /api/admin/display-names; upsert on client_id+section+original_key
│   │   │       └── MasjidConnectController.php # CRUD for masjid entries per client; toggle-masjidconnect on client; stores photos in public disk masjid-screens/
│   │   │   ├── AppIconController.php         # GET /api/app-icon?bundle_id= (auth:sanctum, any role); scrapes Play Store og:image; DB-cached 7 days
│   │   │   └── Client/
│   │   │       ├── VisibilityController.php      # Client reads own visibility settings
│   │   │       ├── OfferController.php           # GET /api/client/offers (manual + intelligent, non-dismissed); POST /api/client/offers/{id}/dismiss (handles "intelligent_*" IDs)
│   │   │       └── MasjidConnectController.php   # GET /api/client/masjid-connect → {enabled, masjids[]} (active only, sorted by sort_order)
│   │   │   └── Middleware/
│   │   │       └── RoleMiddleware.php
│   │   ├── Services/
│   │   │   ├── CM360Service.php              # Google CM360 API integration + fetchCreativeMetadata() (Creatives API, not report)
│   │   │   ├── GmailMailerService.php        # Gmail API mailer (OAuth2 refresh token, bypasses Laravel mail)
│   │   │   ├── ReportCacheService.php        # TTL caching layer over CM360Service + getCreativeMetadata() (24h TTL)
│   │   │   ├── CreativeEvaluationService.php # evaluate(creatives, campaignCtr, networkAvgCtr): adds performance_status (top_performer/strong/average/refresh_opportunity/ready_for_refresh/insufficient_data; fatigue_risk overrides to ready_for_refresh), vs_campaign_avg, vs_network_avg, fatigue_risk bool, recommendation
│   │   │   ├── DisplayNameService.php        # applyToRows(rows, section, keyField, clientId): batch-resolves display names (client override > global); resolve(key, section, clientId): single lookup; singleton
│   │   │   └── AppIconService.php            # Scrapes Play Store og:image for bundle ID; caches in app_icon_cache table (7-day TTL); singleton
│   │   └── Models/
│   │       ├── User.php
│   │       ├── Client.php                   # + intelligent_offers_enabled (boolean, default false)
│   │       ├── Campaign.php
│   │       ├── ReportCache.php
│   │       ├── CreativeCache.php            # campaign_id, cm360_creative_id, name, type, width, height, preview_url, expires_at; 24h TTL
│   │       ├── ClientVisibilitySetting.php
│   │       ├── AdminAuditLog.php
│   │       ├── Offer.php                    # title, body, cta_label, cta_url, target, client_id, is_active, starts_at, ends_at
│   │       ├── OfferDismissal.php           # user_id, offer_id, dismissed_at; unique(user_id, offer_id)
│   │       ├── IntelligentOfferDismissal.php # user_id, trigger_name, dismissed_at; unique(user_id, trigger_name)
│   │       ├── ClientVisit.php              # user_id, client_id, visited_at; index(user_id, client_id, visited_at)
│   │       ├── AppIconCache.php             # bundle_id (unique), icon_url, app_name, fetched_at, expires_at; 7-day TTL
│   │       ├── ClientDisplayName.php        # client_id (nullable FK→clients), section (domain|app), original_key, display_name, updated_by (FK→users); unique(client_id,section,original_key)
│   │       └── MasjidConnect.php            # client_id FK, campaign_id (nullable FK, nullOnDelete), masjid_name, city, country, screen_photo_path, is_active, sort_order; belongsTo Client + Campaign
│   ├── config/
│   │   ├── cors.php
│   │   ├── sanctum.php
│   │   └── services.php                 # cm360 + ummahpass service configs
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   │       └── AdminSeeder.php          # admin@muslimadnetwork.com / Admin@1234
│   ├── routes/
│   │   └── api.php
│   ├── resources/views/emails/
│   │   ├── layout.blade.php            # Base email template (green header, footer)
│   │   ├── onboarding.blade.php        # Welcome + credentials email
│   │   └── reset_password.blade.php    # Password reset link email
│   └── .env
└── frontend/
    ├── app/
    │   ├── layout.tsx                   # AuthProvider + Inter font
    │   ├── page.tsx                     # → /login
    │   ├── login/page.tsx               # Includes "Forgot your password?" link
    │   ├── forgot-password/page.tsx     # Email input → POST /api/auth/forgot-password
    │   ├── reset-password/page.tsx      # Token+email from URL → POST /api/auth/reset-password
    │   ├── profile/page.tsx             # Change password form (any authenticated user); PUT /api/auth/password
    │   ├── dashboard/
    │   │   ├── layout.tsx               # Max-width container, white bg, no sidebar
    │   │   └── page.tsx                 # Full reporting dashboard — summary, pacing (separate fetch), device/site/creative breakdowns; user dropdown in header
    │   └── admin/
    │       ├── layout.tsx               # Sidebar nav + top bar, RouteGuard role=admin
    │       ├── page.tsx                 # Stats dashboard (4 stat cards)
    │       ├── clients/page.tsx         # Client CRUD + impersonate + MasjidConnect toggle per row + "Manage" link
    │       ├── users/page.tsx           # User CRUD + password generation
    │       ├── campaigns/page.tsx       # Campaign CRUD + client filter
    │       ├── visibility/page.tsx      # Visibility management — overview cards + per-client accordion panel
    │       ├── display-names/page.tsx   # Rename rules CRUD: section/scope filters; Add Rule modal with live preview, global or per-client scope
    │       ├── masjid-connect/page.tsx  # Overview: lists clients with MasjidConnect enabled; "Manage Masjids" per client
    │       ├── masjid-connect/[clientId]/page.tsx  # Per-client masjid management: add/edit/delete cards with photo upload (multipart FormData)
    │       ├── audit-log/page.tsx       # Full audit log: filters (date/action/admin), paginated table (50/page), expandable metadata, CSV export
    │       └── offers/page.tsx          # Offers CRUD table; toggle active; create/edit modal with live banner preview
    ├── context/
    │   └── AuthContext.tsx              # + isImpersonating, stopImpersonation()
    ├── hooks/
    │   ├── useReport.ts                 # Generic report data hook (type, dateFrom, dateTo, campaignId); clears data on dep change
    │   ├── useVisibility.ts             # Fetches /api/client/visibility; isHidden(section, rowKey?), toggle()
    │   ├── useOffers.ts                 # Fetches /api/client/offers; dismissOffer(id) optimistic update
    │   ├── useCreativeMetadata.ts       # Fetches /api/reports/creatives/metadata; returns Record<name, CreativeMetadata>; refetches on campaignId change
    │   └── useMasjidConnect.ts          # Fetches /api/client/masjid-connect; returns { data: MasjidConnectData, isLoading }
    ├── types/
    │   └── reports.ts                   # TS interfaces: SummaryReport, DeviceRow, DomainRow, AppRow, SiteBreakdown, CreativeRow, ConversionReport, Campaign, Client, MasjidEntry, MasjidConnectData
    ├── lib/
    │   ├── api.ts
    │   └── dateUtils.ts                 # getDefaultDateRange, formatDate, formatNumber, formatCTR, formatConversions
    ├── components/
    │   ├── layout/
    │   │   └── RouteGuard.tsx
    │   └── dashboard/
    │       ├── StatCard.tsx             # label + value card
    │       ├── DateRangePicker.tsx      # Preset buttons + custom date inputs
    │       ├── CampaignSwitcher.tsx     # Horizontal pill tabs for multi_campaign clients; only renders when client_type=multi_campaign && campaigns>1
    │       ├── DeviceBreakdownChart.tsx # Recharts doughnut chart; colored by device type; custom tooltip; legend with % share
    │       ├── DomainBreakdownCards.tsx # Top-10 card grid (2-col desktop); impression share bar; "View All" modal with search
    │       ├── AppBreakdownCards.tsx   # Same as DomainBreakdownCards; uses AppIcon (fetches /api/app-icon server-side + letter avatar fallback); "View All" modal with search
    │       ├── CreativeBreakdownGrid.tsx  # Creative card grid (3-col desktop, 2 tablet, 1 mobile); iframe preview; click → CreativePreviewModal; top 6 + "Show All" modal
│       ├── CreativePreviewModal.tsx   # Full-size iframe preview modal; ESC/backdrop closes; stats row (impressions/clicks/CTR/share); scales oversized creatives
    │       ├── ConversionCard.tsx       # Renders nothing if available=false
    │       ├── VisibilityToggle.tsx     # Eye/eye-off icon button; only renders when impersonation_token in localStorage
    │       ├── OfferBanner.tsx          # Single offer banner; gradient green bg; fade-out on dismiss
    │       ├── OffersStack.tsx          # Renders first banner + "+N more" expand pill; uses OfferBanner
    │       ├── CampaignHealthScore.tsx  # Stat card style (matches StatCard); gold icon bg; score/100 + label badge; info tooltip; visibility toggle props
    │       ├── SinceLastVisit.tsx       # Shows last visit relative time + campaign progress bar
    │       ├── BenchmarkBadge.tsx       # CTR vs network average pill (above/below)
    │       ├── CampaignSuccessBox.tsx  # White card, 4px green left border, "SM" avatar, Nadia message (CTR/impressions/upsell logic), mailto CTA; skeleton when isLoading; placed below DateRangePicker in dashboard
    │       └── MasjidConnectSection.tsx # Dual-state: showcase (grid of masjid cards + lightbox) when enabled+data, else marketing fallback card (gradient green, gold CTA buttons)
    ├── components/
    │   └── ui/
    │       ├── Toast.tsx               # Toast component + useToast() hook (showToast, ToastContainer); auto-dismisses 2s
    │       ├── IslamicDivider.tsx      # Islamic geometric section divider; variant="full" (star medallion center) or "simple" (repeating band); gold #C9A84C; opacity 0.35
    │       ├── IslamicWatermark.tsx    # Fixed full-page SVG background watermark; 8-pointed star tile pattern; opacity 0.025; color #1a4a2e; z-index 0; pointer-events none
    │       ├── IslamicIcons.tsx        # Exports MosqueIcon: filled mosque silhouette SVG (minarets + dome + building + hilal crescent); size+color props; fill currentColor
    │       ├── Skeleton.tsx            # Reusable shimmer skeleton div; applies .skeleton-shimmer CSS class; accepts className + style
    │       ├── StatCardSkeleton.tsx    # StatCard-shaped loading skeleton: gold border, icon/label/value placeholders; used in dashboard summary grid
    │       └── AppIcon.tsx             # App icon component; fetches /api/app-icon (server-side Play Store scrape, 7-day cache); falls back to gradient letter avatar; used in AppBreakdownCards
    └── .env
```

---

## Environment Variables

### Backend (`backend/.env`)

| Key | Description |
|-----|-------------|
| `APP_NAME` | "Muslim Ad Network Reporting" |
| `APP_ENV` | production |
| `APP_DEBUG` | false |
| `APP_URL` | http://37.27.215.90:8001 |
| `FRONTEND_URL` | http://37.27.215.90:3001 |
| `DB_CONNECTION` | mysql |
| `DB_HOST` | 127.0.0.1 |
| `DB_PORT` | 3306 |
| `DB_DATABASE` | muslimadnetwork_reporting |
| `DB_USERNAME` | reporting |
| `DB_PASSWORD` | (set) |
| `SESSION_DRIVER` | redis |
| `QUEUE_CONNECTION` | redis |
| `CACHE_STORE` | redis |
| `REDIS_HOST` | 127.0.0.1 |
| `REDIS_PORT` | 6379 |
| `SANCTUM_STATEFUL_DOMAINS` | 37.27.215.90 |
| `CORS_ALLOWED_ORIGINS` | http://37.27.215.90:3001 |
| `CM360_PROFILE_ID` | Global MAN CM360 profile ID |
| `CM360_ADVERTISER_ID` | Global MAN CM360 advertiser ID |
| `CM360_REFRESH_TOKEN` | Set and verified working |
| `CM360_OAUTH_CLIENT_ID` | CM360 OAuth client ID |
| `CM360_OAUTH_CLIENT_SECRET` | CM360 OAuth client secret |
| `UMMAHPASS_CLIENT_ID` | (to be filled) |
| `UMMAHPASS_CLIENT_SECRET` | (to be filled) |
| `UMMAHPASS_REDIRECT_URI` | http://37.27.215.90:8001/api/auth/ummahpass/callback |
| `GMAIL_OAUTH_CLIENT_ID` | Gmail OAuth client ID |
| `GMAIL_OAUTH_CLIENT_SECRET` | Gmail OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | Long-lived Gmail refresh token (obtained via one-time OAuth flow) |
| `GMAIL_FROM_ADDRESS` | support@muslimadnetwork.com |

### Frontend (`frontend/.env`)

| Key | Description |
|-----|-------------|
| `NEXT_PUBLIC_API_URL` | http://37.27.215.90:8001 |

---

## Database Tables

| Table | Description |
|-------|-------------|
| `users` | Portal users — admin or client role; may auth via UmmahPass or password |
| `clients` | Advertiser clients — no longer stores CM360 IDs (those are global in .env) |
| `campaigns` | CM360 campaigns linked to clients; optionally have `cm360_activity_id` for conversion tracking |
| `report_cache` | Cached CM360 report payloads with expiry |
| `creative_cache` | Cached CM360 creative metadata (id, name, type, size, preview_url) — 24h TTL per campaign |
| `client_visibility_settings` | Per-client show/hide settings for sections and table rows |
| `offers` | Promotional offers shown in portal (global or per-client) |
| `offer_dismissals` | Tracks which users dismissed which offers |
| `intelligent_offer_dismissals` | Tracks dismissed intelligent (trigger-based) offers; user_id + trigger_name |
| `client_visits` | Per-user visit log for "since last visit" tracking; 1h debounce in me() |
| `reporting_password_resets` | Password reset tokens — email, sha256-hashed token, created_at. TTL 60 min, single-use. |
| `client_display_names` | Rename rules for domains/apps; client_id nullable (null=global); unique(client_id, section, original_key) |
| `masjid_connects` | Masjid screen placements per client; client_id FK, campaign_id (nullable FK, null=global/all campaigns), masjid_name, city, country, screen_photo_path, is_active, sort_order |
| `admin_audit_log` | Audit trail for admin actions, including impersonation |
| `personal_access_tokens` | Sanctum API tokens |
| `sessions` | Redis-backed sessions (table exists as fallback schema) |
| `cache` | Laravel cache table |
| `jobs` | Queue jobs table |

---

## API Routes

### Public
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Email + password login |
| GET | `/api/auth/ummahpass/redirect` | Redirect to UmmahPass OAuth |
| GET | `/api/auth/ummahpass/callback` | OAuth callback handler |
| POST | `/api/auth/forgot-password` | Send password reset email (rate limited 3/min) |
| POST | `/api/auth/reset-password` | Consume token, set new password |

### Sanctum (any authenticated user)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/logout` | Revoke current token |
| GET | `/api/auth/me` | Return authenticated user |
| PUT | `/api/auth/password` | Change own password (`current_password`, `new_password`, `new_password_confirmation`) |
| POST | `/api/admin/impersonate/stop` | Stop impersonation (accessible by client token) |
| GET | `/api/app-icon` | Fetch Play Store icon for app bundle ID (`?bundle_id=`); returns `{bundle_id, icon_url, app_name}`; 7-day DB cache; `Cache-Control: public, max-age=604800` |

### Admin only (sanctum + role:admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET/POST | `/api/admin/clients` | List / create clients |
| GET/PUT/DELETE | `/api/admin/clients/{id}` | Show / update / deactivate client |
| GET/POST | `/api/admin/users` | List / create users |
| PUT/DELETE | `/api/admin/users/{id}` | Update / delete user |
| POST | `/api/admin/users/{id}/reset-password` | Reset user password |
| POST | `/api/admin/users/{id}/send-onboarding` | Reset password + email credentials to client user |
| GET/POST | `/api/admin/campaigns` | List / create campaigns |
| PUT/DELETE | `/api/admin/campaigns/{id}` | Update / delete campaign |
| POST | `/api/admin/impersonate/{client_id}` | Start client impersonation |
| POST | `/api/admin/cache/invalidate/{campaign_id}` | Invalidate all cached reports for campaign |
| GET | `/api/admin/cm360-test` | Test CM360 service auth |
| GET | `/api/admin/audit-log` | Paginated audit log; filters: admin_id, action, date_from, date_to |
| GET | `/api/admin/offers` | All offers with client name and dismissals_count |
| POST | `/api/admin/offers` | Create offer |
| PUT | `/api/admin/offers/{id}` | Update offer |
| DELETE | `/api/admin/offers/{id}` | Delete offer |
| POST | `/api/admin/offers/{id}/toggle` | Toggle is_active |
| GET | `/api/admin/visibility/overview` | Summary of all clients' hidden sections/rows |
| GET | `/api/admin/visibility/{client_id}` | Get grouped visibility settings for a client |
| POST | `/api/admin/visibility/{client_id}` | Upsert a visibility setting `{ section, level, row_key, is_hidden }` |
| DELETE | `/api/admin/visibility/{client_id}/reset` | Reset all visibility settings for client to defaults |
| GET | `/api/admin/display-names` | List rename rules; filters: section, client_id (pass "null" for global-only) |
| POST | `/api/admin/display-names` | Upsert rename rule (client_id, section, original_key, display_name) |
| DELETE | `/api/admin/display-names/{id}` | Delete rename rule |
| GET | `/api/admin/masjid-connect/{client_id}` | List masjid entries for client (sorted by sort_order) |
| POST | `/api/admin/masjid-connect/{client_id}` | Create masjid entry (multipart, photo required) |
| PUT | `/api/admin/masjid-connect/{client_id}/{id}` | Update masjid entry (photo optional) |
| DELETE | `/api/admin/masjid-connect/{client_id}/{id}` | Delete masjid entry + photo file |
| POST | `/api/admin/clients/{id}/toggle-masjidconnect` | Toggle masjidconnect_enabled on client |

### Client only (sanctum + role:client)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/client/test` | Client access test |
| GET | `/api/reports/campaigns` | List client's campaigns |
| GET | `/api/reports/summary` | Summary report (impressions, clicks, CTR) |
| GET | `/api/reports/device` | Device breakdown |
| GET | `/api/reports/site` | Site breakdown |
| GET | `/api/reports/creative` | Creative breakdown |
| GET | `/api/reports/creatives/metadata` | Creative metadata from CM360 Creatives API (id, name, type, width, height, preview_url); 24h cache in creative_cache table |
| GET | `/api/reports/conversion` | Conversion report (requires has_conversion_tracking) |
| GET | `/api/client/visibility` | Returns grouped visibility settings for the authenticated client |
| GET | `/api/client/offers` | Returns active non-dismissed offers (manual + intelligent) for user's client |
| POST | `/api/client/offers/{id}/dismiss` | Record offer dismissal; `{id}` can be integer (manual) or `"intelligent_{trigger}"` (intelligent) |
| GET | `/api/client/masjid-connect` | Returns `{ enabled: bool, masjids: [] }` — only active entries, sorted by sort_order |
| GET | `/api/reports/campaign-summary/pdf` | Download full campaign PDF report (client + admin; no role restriction beyond auth) — backend exists but frontend button removed in 8.5.1 |

> Report endpoints accept query params: `date_from` (Y-m-d), `date_to` (Y-m-d), and optionally `campaign_id` (required for multi_campaign clients).

---

## CM360 Data Model

- MAN has **one global CM360 Profile ID** and **one CM360 Advertiser ID** — stored in `.env` as `CM360_PROFILE_ID` and `CM360_ADVERTISER_ID`, accessed via `config('services.cm360.*')`
- All client campaigns live under this single advertiser
- Each `campaign` row maps to a client via `cm360_campaign_id`
- Conversion tracking is per-campaign: `has_conversion_tracking` (bool) + `cm360_activity_id` (nullable string)
- **Conversion visibility rule**: conversion data only shows when BOTH (1) `client.client_type` is `conversion` or `multi_campaign` (NOT `standard`) AND (2) `campaign.has_conversion_tracking = true`. Client type is the master switch — enforced in both `ReportController::conversion()` (backend) and `conversionEnabled` flag in `dashboard/page.tsx` (frontend).
- CM360 OAuth credentials: `CM360_OAUTH_CLIENT_ID` + `CM360_OAUTH_CLIENT_SECRET` (set in .env)

## Visibility Control System

Admins can hide/show entire sections or individual table rows per client while impersonating.

- **DB**: `client_visibility_settings` — keyed by `(client_id, section, level, row_key)`. `level` = `section` | `row`. `row_key` = NULL for section-level.
- **Sections**: `summary`, `pacing`, `device`, `domain`, `app`, `creative`, `conversion`
- **Admin writes**: `POST /api/admin/visibility/{client_id}` using the `admin_token` (not the impersonation token). VisibilityToggle reads `admin_token` from localStorage.
- **Client reads**: `GET /api/client/visibility` using the current `auth_token`. Response shape: `{ device: { section_hidden: bool, hidden_rows: string[] }, ... }`
- **`useVisibility(clientId)`**: fetches client visibility on mount; exposes `isHidden(section, rowKey?)` and `toggle(section, level, rowKey, hidden)`. Toggle does optimistic update + API call.
- **`VisibilityToggle`**: only renders when `impersonation_token` in localStorage. Eye/eye-off icon. Red tint when hidden.
- **Client view**: hidden items are not rendered at all (no indication).
- **Admin impersonation view**: hidden items show at 0.3–0.4 opacity with eye-off icon so admin can restore.

---

## CM360 Service Architecture

- **`CM360Service`** — Singleton. Initializes `Google\Client` on construction via `fetchAccessTokenWithRefreshToken()`. Each public method builds a `Google\Service\Dfareporting\Report`, calls `runReport()` which does insert→run→poll(60×2s)→download CSV→parse. Cleans up the CM360 report in `finally`. Methods: `fetchSummaryReport`, `fetchDeviceBreakdown`, `fetchSiteBreakdown`, `fetchCreativeBreakdown`, `fetchConversionReport`.
  - Report building and normalization are private helpers (`buildXxxReport`, `normalizeXxx`) shared by the public methods.
  - **CSV parsing**: CM360 CSVs start with the report name (no prefix), then metadata, then a `Report Fields` marker line (no colon), then actual column headers, then data rows, then `Grand Total:`. The parser seeks the `Report Fields` marker and uses the next line as headers.
  - **Confirmed CM360 column names**: `Campaign`, `Impressions`, `Clicks`, `Click Rate` (metrics); `Platform Type` (device); `Site (CM360)` (site); `Creative`, `Creative Pixel Size` (creative — note: NOT "Creative Size").
  - **`files->get($reportId, $fileId)`** — no profile ID (top-level files resource). Profile ID is only needed for `reports->insert/run/delete`.
  - **Conversion report specifics**: Uses STANDARD report type. Dimension: `activity`. Filter: `dimensionName='activity'`, id=`cm360_activity_id`, matchType=`EXACT`. No campaign filter — activity filter only. Metrics: `['totalConversions', 'totalConversionsRevenue']`. Revenue is parsed from the Grand Total row in the raw CSV (not from data rows). CM360 returns conversion counts as decimals (e.g. `"37.00"`) — must parse as float then round to int. Uses `runReportRaw()` (returns raw CSV string) + `normalizeConversionFromCsv()` instead of the standard `runReport()` + `normalizeXxx()` pattern.

- **`ReportCacheService`** — Singleton. Injects `CM360Service`. `get()` checks `report_cache` table first; if fresh (expires_at in future), returns cached payload. Otherwise fetches from CM360 and upserts cache. TTL: 2h for active campaigns, 24h for others. On CM360 error, falls back to stale cache if available; re-throws if no cache exists. `invalidate()` deletes all cache rows for a campaign.

- **Report caching key**: `(campaign_id, date_from, date_to, report_type)` — unique combination.

---

## Auth & Impersonation Architecture

- **Token-based**: Sanctum personal access tokens, `Authorization: Bearer <token>`
- **Frontend storage**: `auth_token` in localStorage (active token)
- **Impersonation flow**:
  - Start: stores `admin_token` (backup), sets `auth_token` = impersonation token, sets `impersonation_token` flag, opens `/dashboard` in new tab
  - Stop: restores `auth_token` from `admin_token`, clears `impersonation_token` + `admin_token`, redirects to `/admin/clients`
- **Role enforcement**: `RoleMiddleware` on backend; `RouteGuard` on frontend
- **Admin seed**: `admin@muslimadnetwork.com` / `Admin@1234`

---

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| Brand Green | `#1a4a2e` | Campaign switcher active pill gradient, offer banner gradient start |
| Gold | `#C9A84C` | Header border, stat card top border/icon gradient, pacing bar (on pace), section heading underlines/stars, campaign switcher active border, dividers, Bismillah text |
| Gold Light | `#F0D080` | Stat card icon gradient end |
| Gold Dark | `#A07830` | CSS variable only (--gold-dark) |
| UI Blue (primary) | `#2563eb` | Buttons, active states, links, icon color |
| Emerald (accent) | `#10b981` | Positive metrics, active badges, table bars |
| Purple | `#8b5cf6` | CTR icon |
| Amber | `#f59e0b` | Target/contracted icon |
| Danger | `#ef4444` / `#dc2626` | Errors, impersonation banner |
| Neutral | `#64748b` | Secondary text, labels |
| Page bg | `#f8f9fa` | Page background |
| Font | Inter (Google Fonts) | |

> Dashboard UI was redesigned (modern rounded style): rounded-2xl cards, soft shadows, fade-in-up animations (staggered 50ms), pill preset buttons, animated pacing bar, rounded-full progress bars, hover row transitions.
>
> Session 8.2 — Islamic design elements added to client dashboard: gold CSS variables (--gold, --gold-light, --gold-dark), IslamicDivider SVG component (8-pointed star pattern), gold top border + gradient icon on StatCards, gold pacing bar (on-pace state), gold-bordered campaign switcher active pill, green-to-gold offer banner gradient, gold section heading underlines with star icons, Bismillah calligraphy in header, gold header border.
>
> Session 8.3 — Campaign intelligence: client_visits table + AuthController me() records visits with 1h debounce + returns last_visited_at. Summary endpoint adds network_avg_ctr, ctr_vs_benchmark, health_score, health_label. CampaignHealthScore, SinceLastVisit, BenchmarkBadge components. Top Performer badge on highest-CTR creative. StatCard accepts ctrVsBenchmark prop.
>
> Session 8.4 — Intelligent offers: intelligent_offers_enabled flag on clients (admin toggle in UI). IntelligentOfferService with 4 performance triggers (behind pace, ending soon, strong CTR, just started). Separate intelligent_offer_dismissals table. PDF report: barryvdh/laravel-dompdf, CampaignSummaryController, 6-page Blade PDF (cover, executive summary, device, domains/apps, creatives, closing). "Download Report" gold button in dashboard header.
>
> Session 8.5 — Creative evaluation: CreativeEvaluationService injected into ReportController::creative(). Adds performance_status (top_performer/strong/average/refresh_opportunity/ready_for_refresh/insufficient_data), vs_campaign_avg %, vs_network_avg %, fatigue_risk bool, recommendation string. When fatigue_risk=true, performance_status is overridden to ready_for_refresh. CreativeBreakdownGrid: status badges (⭐💪💡🔄), recommendation tooltip (ℹ️), vs-campaign-avg line (positive only), InsightsSummary filter row ("⭐ X leading creatives", "💡 X refresh opportunities", clear filter). CreativePreviewModal: evaluation section with status badge, positive-only benchmark pills, blue/purple refresh info boxes, gold box for top_performer.
>
> Session 8.5.1 — Dashboard UI fixes: (1) Removed "Download Report" PDF button and related state/handler from dashboard/page.tsx. (2) Redesigned CampaignHealthScore as a stat card matching StatCard style — gold icon bg, heart-pulse icon, score/100 value, label badge, info tooltip, visibility toggle props. (3) Added MuslimReach stat card (value = impressions ÷ 5, mosque icon, info tooltip). (4) Per-card visibility toggles on all 6 stat cards: stat_impressions, stat_clicks, stat_ctr, stat_muslimreach, stat_health, stat_conversions — eye icon top-right of each card when impersonating; hidden+impersonating = 0.3 opacity; hidden+not impersonating = null. Summary grid changed to grid-cols-1 sm:grid-cols-2 lg:grid-cols-3. StatCard gains isImpersonating, isHidden, onVisibilityToggle, infoTooltip props. CampaignHealthScore moved into the summary grid (no longer a separate section below).
>
> Session 8.6 — App icons in breakdown cards: Added `appId` dimension to CM360 site report (buildSiteReport). normalizeSiteBreakdown now extracts app_id per row (null if "(not set)"), stored in app bucket and included in apps[] output. AppRow interface gains app_id: string|null. New AppIcon.tsx component: fetches /api/app-icon (server-side Play Store og:image scrape) with gradient letter avatar fallback. AppBreakdownCards uses AppIcon replacing the letter avatar. New backend: AppIconService (scrapes og:image+og:title from Play Store), AppIconCache model+migration (bundle_id unique, 7-day TTL), AppIconController (GET /api/app-icon, auth:sanctum, Cache-Control 7d), singleton in AppServiceProvider.
>
> Session 8.7 — Favicon + admin mobile responsive: (1) Favicon: copied logo.jpeg to app/icon.jpeg, app/apple-icon.jpeg, app/favicon.ico — Next.js file convention serves these automatically; removed manual metadata icons. (2) Admin layout already had mobile sidebar (collapsible with hamburger + backdrop). (3) All admin tables wrapped in overflow-x-auto for horizontal scrolling on mobile: admin/page.tsx (clients overview), clients/page.tsx, users/page.tsx, campaigns/page.tsx, offers/page.tsx. Table min-w-full ensures columns don't collapse.
>
> Session 8.8 — Display names, data merge, health score removal: (1) Display Name system: client_display_names table + ClientDisplayName model + DisplayNameService (singleton; applyToRows fetches all rules in one query, applies client override > global). Admin DisplayNameController (GET/POST/DELETE /api/admin/display-names). ReportController::site() applies display names to domain + app rows before returning. Admin display-names page with Add Rule modal (section radio, original/display inputs, live preview, global/per-client scope dropdown). TagIcon in sidebar between Visibility and Offers. (2) muslimadnetwork.com merge: CM360Service normalizeSiteBreakdown() finds muslimadnetwork.com in domains → merges impressions+clicks into Prayer Times app (case-insensitive partial match on "prayer") → removes from domains → re-sorts apps by impressions. (3) Removed health_score/health_label from ReportController::summary() and SummaryReport TS type. CampaignHealthScore stat card removed from dashboard grid. stat_health removed from visibility page STAT_CARDS. Summary grid changed to lg:grid-cols-4 with 4 skeleton cards. (4) CM360 API upgraded: download URL updated from deprecated v4 (www.googleapis.com) to v5 (dfareporting.googleapis.com) — PHP library already uses v5, only the manual download URL was behind.
>
> Session 8.8.1 — Modal portal fix: DomainBreakdownCards, AppBreakdownCards, CreativeBreakdownGrid, and CreativePreviewModal now use React createPortal to mount modals on document.body instead of inside the component tree. z-index set to 9999, position fixed. Prevents modals from being clipped by parent overflow or stacking context.
>
> Session 8.7.1 — Remove end_date and pacing bar: (1) Migration drops end_date from campaigns table. Removed from Campaign model/fillable/casts, CampaignController validation, IntelligentOfferService (triggers 1 & 2 removed), CampaignSummaryController (uses Carbon::today() instead), ReportController (pacing() method deleted, end_date removed from campaigns() select). Pacing route removed from api.php. (2) Frontend: end_date removed from Campaign interface, admin campaigns page (interface, emptyForm, openEdit, table, modal form collapsed to single Start Date). PacingBar.tsx deleted. pacingData state/useEffect/import removed from dashboard. getPacingPercentage() removed from dateUtils. pacing removed from visibility SECTIONS. (3) RouteGuard "Loading…" replaced with branded LoadingScreen: animated progress bar 0→88% during auth check, with percentage counter and brand text.
>
> Session 8.9 — MasjidConnect feature: (1) Backend: masjidconnect_enabled boolean on clients table (default false). New masjid_connects table (client_id FK, masjid_name, city, country, screen_photo_path, is_active, sort_order). MasjidConnect model. Client model updated (fillable, cast, hasMany). Admin MasjidConnectController: CRUD for masjid entries + toggle-masjidconnect. Client MasjidConnectController: GET /api/client/masjid-connect → {enabled, masjids[]} (active only). Photos stored on public disk in masjid-screens/ folder. (2) Admin frontend: clients page has gold toggle switch per row + "Manage" link when enabled. New /admin/masjid-connect overview page. New /admin/masjid-connect/[clientId] management page with photo upload, edit, delete, sort order. MasjidConnect nav link (mosque icon) in sidebar between Display Names and Offers. (3) Client dashboard: MasjidConnectSection shows showcase (grid + lightbox with ESC/arrow navigation) when enabled+data exists, else marketing fallback card (green gradient, gold CTA). Always rendered. useMasjidConnect hook. Visibility toggle key: masjidconnect. MasjidEntry + MasjidConnectData types added.
>
> Session 8.11 — Remove intelligent offers + CampaignSuccessBox: (1) MasjidConnect "Book a Free Consultation" href updated to Pipedrive scheduler URL. (2) IntelligentOfferService.php deleted. OfferController simplified: removed IntelligentOfferService dependency, intelligent_offer_dismissals handling, and intelligent_* dismiss prefix logic — only returns manual admin-created offers. Client offer routes (GET /api/client/offers, POST /api/client/offers/{id}/dismiss) kept. Admin offers management (/admin/offers) kept. (3) admin/clients/page.tsx: removed intelligent_offers_enabled from Client interface, emptyForm, openEdit, and the toggle UI block. (4) New CampaignSuccessBox.tsx component: white card, 4px green left border, "SM" avatar, Nadia message built from real campaign data (opener + performance line based on CTR vs network avg + reach line + upsell line based on impressions), mailto CTA button "Add More Impressions". Skeleton loading state. Placed in dashboard below DateRangePicker and above stat cards; refetches/rerenders on campaign/date change.
>
> Session 8.10 — Skeleton loading states + MosqueIcon redesign: (1) globals.css: shimmer keyframe + `.skeleton-shimmer` class (gradient sweep animation). (2) New `components/ui/Skeleton.tsx`: reusable shimmer div. (3) New `components/ui/StatCardSkeleton.tsx`: matches StatCard layout (gold border, icon/label/value placeholders). (4) New `components/ui/IslamicIcons.tsx`: exports `MosqueIcon` — proper filled mosque silhouette SVG (two minarets with pointed caps + balcony rings, central cubic-bezier dome, rectangular building base, hilal crescent via evenodd fill on two full-circle paths); viewBox 0 0 24 24, fill currentColor. (5) dashboard/page.tsx: stat cards use StatCardSkeleton (4 cards); device section uses donut-ring + 4 legend-row skeleton; domain/app sections use 4-card grid skeleton (icon+text+bar per card); creative section uses Skeleton-based card grid; MosqueStatIcon now fills from IslamicIcons. (6) MasjidConnectSection loading skeleton replaced with 3 masjid card skeletons (image area + text rows). (7) MosqueIcon updated everywhere (MasjidConnectSection, admin layout sidebar, admin/masjid-connect overview, admin/masjid-connect/[clientId]) — all now import from IslamicIcons, removing all local stroke-based MosqueIcon definitions.
>
> Session 8.9.1 — MasjidConnect per-campaign support: (1) Backend: Added campaign_id (nullable FK → campaigns, nullOnDelete) to masjid_connects table. MasjidConnect model gains campaign_id in fillable/casts + nullable belongsTo Campaign. Admin controller: index() accepts optional campaign_id filter; store/update validate campaign_id belongs to client; campaign name eager-loaded and included in response. Client controller: if campaign_id query param provided, returns entries matching that campaign OR campaign_id IS NULL (global entries); without param returns all. (2) Admin [clientId] page: fetches client_type and campaigns list; multi_campaign clients see campaign pill tabs (All Campaigns + one per campaign, each with count badge); active tab filters the grid; Add/Edit modal shows Campaign dropdown for multi_campaign clients defaulting to current tab; campaign badge shown on each card. (3) Client dashboard: useMasjidConnect now accepts campaignId param, passes as query param, refetches on campaign change. dashboard/page.tsx passes campaignId to the hook.
>
> Session 8.2.1 — Islamic design refinement: (1) Gold reduced to borders only — StatCard uses 4-sided gold border (1px solid #C9A84C), icon backgrounds revert to colored (blue/emerald/purple), hover is now translateY(-3px) + shadow instead of gold glow. (2) PacingBar "on pace" badge: white bg + gold border + gold text; bar fill changed from gold to green #10b981. (3) CampaignSwitcher active pill: removed gold border, uses inset box-shadow for subtle gold left accent; inactive pills hover adds gold border + scale(1.02). (4) OfferBanner: solid dark green #1a4a2e bg + 2px gold border; CTA button white bg with dark green text + gold border. (5) Header gold border opacity reduced to 0.4. (6) "Campaign Performance" heading: removed gradient text, plain dark. (7) IslamicDivider opacity 0.6→0.35, stroke-width 0.7→0.5. (8) IslamicWatermark SVG component created — fixed full-page 8-pointed star geometric tile pattern, opacity 0.025, z-index 0, color #1a4a2e; added to dashboard/layout.tsx. (9) Domain/App breakdown cards: added 1px #e5e7eb border, hover gets gold border + translateY(-2px). (10) Creative cards: added 1px #e5e7eb border, hover gets gold border + translateY(-3px). (11) SectionCard: hover increases box-shadow.

---

## Key Commands

### Backend
```bash
cd /var/www/muslimadnetwork-reporting/backend

# Run migrations
php artisan migrate --force

# Clear and cache config + routes
php artisan config:clear && php artisan config:cache
php artisan route:clear && php artisan route:cache

# Clear all caches
php artisan optimize:clear

# Re-cache for production
php artisan optimize

# Seed admin user
php artisan db:seed --class=AdminSeeder --force
```

### Frontend
```bash
cd /var/www/muslimadnetwork-reporting/frontend

# Dependencies (recharts installed for device doughnut chart)
# npm install recharts

# Build
npm run build

# Dev server
npm run dev -- -p 3001
```

### PM2 (managed manually)
```bash
pm2 restart muslimadnetwork-backend
pm2 restart muslimadnetwork-frontend
pm2 logs muslimadnetwork-backend
```

---

## Workflow Rules

1. **Never run git commands.** Always say "Ready to push" when a task is complete.
2. When done with any task, say **"Ready to push"** and stop.
3. Do not set up PM2 or Nginx — the user manages that manually.
4. Backend runs via PHP-FPM behind Nginx on port 8001.
5. Frontend runs via `next start` on port 3001.

---

## Updated Operational Notes

### PM2 Restart (claude-dev can now do this)
```bash
sudo pm2 restart muslimadnetwork-reporting-backend
sudo pm2 restart muslimadnetwork-reporting-frontend
sudo pm2 restart muslimadnetwork-reporting-queue
```

### Frontend Build Ownership Issue
If `npm run build` fails with EACCES permission denied on `.next` directory:
- Root must run:
  ```bash
  rm -rf /var/www/muslimadnetwork-reporting/frontend/.next
  chown -R claude-dev:claude-dev /var/www/muslimadnetwork-reporting/frontend
  ```
- Then claude-dev runs `npm run build` normally
- **NEVER run `npm run build` as root** — it causes this ownership problem

### After Every Session

**Backend changes:**
```bash
php artisan config:clear && php artisan config:cache
php artisan route:clear && php artisan route:cache
sudo pm2 restart muslimadnetwork-reporting-backend
```

**Frontend changes:**
```bash
cd /var/www/muslimadnetwork-reporting/frontend
npm run build
sudo pm2 restart muslimadnetwork-reporting-frontend
```

**Both changed:** Run all of the above.

### Git Is Always Root
claude-dev never runs git commands. Only root pushes to GitHub. claude-dev says "Ready to push" and waits.
