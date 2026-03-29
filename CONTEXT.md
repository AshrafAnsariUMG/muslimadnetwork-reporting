# Muslim Ad Network — Reporting Portal: Full Project Context

> This document is a living technical handoff. It captures everything needed to understand, maintain, and extend the portal. Written from actual codebase inspection — not guesswork.

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Infrastructure](#2-infrastructure)
3. [Environment Variables](#3-environment-variables)
4. [Database Schema](#4-database-schema)
5. [API Routes](#5-api-routes)
6. [Backend Architecture](#6-backend-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Key Features & Systems](#8-key-features--systems)
9. [Authentication & Impersonation](#9-authentication--impersonation)
10. [CM360 Integration](#10-cm360-integration)
11. [Brand & Design System](#11-brand--design-system)
12. [Session History](#12-session-history)
13. [Operations](#13-operations)

---

## 1. Project Summary

A client-facing campaign reporting portal for Muslim Ad Network. Clients log in to see live performance data from Google Campaign Manager 360 (CM360). Admins manage clients, campaigns, users, and offers, and can impersonate any client to troubleshoot their view.

**Live URL:** http://37.27.215.90:3001 (frontend), http://37.27.215.90:8001 (backend API)

---

## 2. Infrastructure

| Layer | Tech | Port | Process |
|-------|------|------|---------|
| Backend API | Laravel 13 (PHP 8.3) | 8001 | PM2: `muslimadnetwork-backend` |
| Frontend | Next.js 14 (App Router, TypeScript) | 3001 | PM2: `muslimadnetwork-frontend` |
| Queue worker | Laravel queue (Redis) | — | PM2: `muslimadnetwork-queue` |
| Database | MySQL 8.0 | 3306 | systemd |
| Cache/Queue/Session | Redis | 6379 | systemd |
| Web server | Nginx (reverse proxy) | 80/443 | systemd |

### PM2 Commands (run as the user that owns the PM2 daemon)
```bash
pm2 restart muslimadnetwork-backend
pm2 restart muslimadnetwork-frontend
pm2 restart muslimadnetwork-queue
pm2 logs muslimadnetwork-backend --lines 50
pm2 logs muslimadnetwork-frontend --lines 50
```

> **Warning:** Never run `npm run build` as root. The Next.js `.next/` build directory must be owned by the same user as the PM2 frontend process. If you do accidentally build as root, fix with: `chown -R <pmuser>:<pmuser> /var/www/muslimadnetwork-reporting/frontend/.next`

---

## 3. Environment Variables

### Backend (`backend/.env`)

| Key | Value / Description |
|-----|---------------------|
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
| `DB_PASSWORD` | (set — see .env) |
| `SESSION_DRIVER` | redis |
| `QUEUE_CONNECTION` | redis |
| `CACHE_STORE` | redis |
| `REDIS_HOST` | 127.0.0.1 |
| `REDIS_PORT` | 6379 |
| `REDIS_PASSWORD` | null |
| `SANCTUM_STATEFUL_DOMAINS` | 37.27.215.90 |
| `CORS_ALLOWED_ORIGINS` | http://37.27.215.90:3001 |
| `CM360_PROFILE_ID` | 10563636 |
| `CM360_ADVERTISER_ID` | 16361189 |
| `CM360_OAUTH_CLIENT_ID` | (set — Google Cloud console) |
| `CM360_OAUTH_CLIENT_SECRET` | (set) |
| `CM360_REFRESH_TOKEN` | (set — long-lived refresh token) |
| `GMAIL_OAUTH_CLIENT_ID` | (set) |
| `GMAIL_OAUTH_CLIENT_SECRET` | (set) |
| `GMAIL_REFRESH_TOKEN` | (set — long-lived) |
| `GMAIL_FROM_ADDRESS` | support@muslimadnetwork.com |
| `UMMAHPASS_CLIENT_ID` | (empty — not yet configured) |
| `UMMAHPASS_CLIENT_SECRET` | (empty) |
| `UMMAHPASS_REDIRECT_URI` | http://37.27.215.90:8001/api/auth/ummahpass/callback |

### Frontend (`frontend/.env`)

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | http://37.27.215.90:8001 |

---

## 4. Database Schema

Database: `muslimadnetwork_reporting` (MySQL)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| name | varchar(255) | NOT NULL |
| email | varchar(255) | NOT NULL, UNIQUE |
| email_verified_at | timestamp | nullable |
| password | varchar(255) | nullable (null for UmmahPass-only users) |
| ummahpass_id | varchar(255) | nullable, UNIQUE |
| role | enum('admin','client') | NOT NULL, DEFAULT=client |
| client_id | bigint unsigned | nullable, FK→clients |
| remember_token | varchar(100) | nullable |
| created_at / updated_at | timestamp | |

### `clients`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| name | varchar(255) | NOT NULL |
| logo_url | varchar(255) | nullable |
| primary_color | varchar(255) | nullable |
| client_type | enum('standard','conversion','multi_campaign') | NOT NULL, DEFAULT=standard |
| is_active | tinyint(1) | NOT NULL, DEFAULT=1 |
| features | json | nullable |
| intelligent_offers_enabled | tinyint(1) | NOT NULL, DEFAULT=0 (legacy, unused) |
| masjidconnect_enabled | tinyint(1) | NOT NULL, DEFAULT=0 |
| notes | text | nullable |
| created_at / updated_at | timestamp | |

### `campaigns`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| client_id | bigint unsigned | NOT NULL, FK→clients |
| cm360_campaign_id | varchar(255) | NOT NULL |
| name | varchar(255) | NOT NULL |
| status | enum('active','paused','ended','upcoming') | NOT NULL, DEFAULT=active |
| start_date | date | NOT NULL |
| contracted_impressions | bigint unsigned | nullable |
| contracted_clicks | bigint unsigned | nullable |
| is_primary | tinyint(1) | NOT NULL, DEFAULT=1 |
| has_conversion_tracking | tinyint(1) | NOT NULL, DEFAULT=0 |
| cm360_activity_id | varchar(255) | nullable |
| created_at / updated_at | timestamp | |

> Note: `end_date` was removed in Session 8.7.1.

### `masjid_connects`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| client_id | bigint unsigned | NOT NULL, FK→clients |
| campaign_id | bigint unsigned | nullable, FK→campaigns (nullOnDelete) |
| masjid_name | varchar(255) | NOT NULL |
| city | varchar(255) | NOT NULL |
| country | varchar(255) | NOT NULL, DEFAULT='United States' |
| screen_photo_path | varchar(255) | NOT NULL |
| is_active | tinyint(1) | NOT NULL, DEFAULT=1 |
| sort_order | int | NOT NULL, DEFAULT=0 |
| created_at / updated_at | timestamp | |

> `campaign_id = NULL` means the entry applies to all campaigns (global). `campaign_id = X` means it applies only to that campaign.

### `report_cache`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| campaign_id | bigint unsigned | NOT NULL, FK |
| date_from | date | NOT NULL |
| date_to | date | NOT NULL |
| report_type | enum('summary','device','site','creative','conversion') | NOT NULL |
| payload | json | NOT NULL |
| fetched_at | timestamp | NOT NULL |
| expires_at | timestamp | NOT NULL |
| created_at / updated_at | timestamp | |

> Cache TTL: 2h for active campaigns, 24h for others. Key: `(campaign_id, date_from, date_to, report_type)`.

### `creative_cache`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| campaign_id | bigint unsigned | NOT NULL, FK |
| cm360_creative_id | varchar(255) | NOT NULL |
| name | varchar(255) | NOT NULL |
| type | varchar(255) | NOT NULL |
| width | int | NOT NULL |
| height | int | NOT NULL |
| preview_url | text | nullable |
| fetched_at / expires_at | timestamp | 24h TTL |
| created_at / updated_at | timestamp | |

### `offers`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| title | varchar(255) | NOT NULL |
| body | text | NOT NULL |
| cta_label | varchar(255) | NOT NULL |
| cta_url | varchar(255) | NOT NULL |
| target | enum('global','specific_client') | NOT NULL, DEFAULT=global |
| client_id | bigint unsigned | nullable, FK→clients |
| is_active | tinyint(1) | NOT NULL, DEFAULT=1 |
| starts_at | timestamp | nullable |
| ends_at | timestamp | nullable |
| created_at / updated_at | timestamp | |

### `offer_dismissals`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| user_id | bigint unsigned | NOT NULL, FK→users |
| offer_id | bigint unsigned | NOT NULL, FK→offers |
| dismissed_at | timestamp | NOT NULL |

### `client_visibility_settings`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| client_id | bigint unsigned | NOT NULL, FK |
| section | varchar(255) | NOT NULL |
| level | enum('section','row') | NOT NULL |
| row_key | varchar(255) | nullable |
| is_hidden | tinyint(1) | NOT NULL, DEFAULT=0 |
| updated_by | bigint unsigned | NOT NULL, FK→users |
| created_at / updated_at | timestamp | |

### `client_display_names`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| client_id | bigint unsigned | nullable, FK→clients (null=global) |
| section | enum('domain','app') | NOT NULL |
| original_key | varchar(255) | NOT NULL |
| display_name | varchar(255) | NOT NULL |
| updated_by | bigint unsigned | NOT NULL, FK→users |
| created_at / updated_at | timestamp | |

> Unique constraint: `(client_id, section, original_key)`. Client override takes precedence over global (null client_id).

### `client_visits`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| user_id | bigint unsigned | NOT NULL |
| client_id | bigint unsigned | NOT NULL |
| visited_at | timestamp | NOT NULL |
| created_at / updated_at | timestamp | |

> Logged with 1-hour debounce in `AuthController::me()`.

### `admin_audit_log`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| admin_user_id | bigint unsigned | NOT NULL, FK→users |
| impersonating_client_id | bigint unsigned | nullable, FK→clients |
| action | varchar(255) | NOT NULL |
| metadata | json | nullable |
| ip_address | varchar(255) | NOT NULL |
| created_at / updated_at | timestamp | |

### `app_icon_cache`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| bundle_id | varchar(255) | NOT NULL, UNIQUE |
| icon_url | text | nullable |
| app_name | varchar(255) | nullable |
| fetched_at / expires_at | timestamp | 7-day TTL |
| created_at / updated_at | timestamp | |

### `reporting_password_resets`
| Column | Type | Notes |
|--------|------|-------|
| email | varchar(255) | NOT NULL |
| token | varchar(255) | NOT NULL (sha256-hashed) |
| created_at | timestamp | nullable |

> TTL: 60 minutes. Single-use.

### `intelligent_offer_dismissals`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| user_id | bigint unsigned | NOT NULL |
| trigger_name | varchar(255) | NOT NULL |
| dismissed_at | timestamp | NOT NULL |

> Legacy table — `IntelligentOfferService` was removed in Session 8.11. Table remains in DB but is no longer written to.

---

## 5. API Routes

Base URL: `http://37.27.215.90:8001/api`

### Public (no auth)
| Method | Path | Controller |
|--------|------|------------|
| POST | `/auth/login` | AuthController@login |
| GET | `/auth/ummahpass/redirect` | UmmahPassController@redirect |
| GET | `/auth/ummahpass/callback` | UmmahPassController@callback |
| POST | `/auth/forgot-password` | PasswordResetController@forgotPassword (throttle: 3/min) |
| POST | `/auth/reset-password` | PasswordResetController@resetPassword |

### Any Authenticated User (auth:sanctum)
| Method | Path | Controller |
|--------|------|------------|
| POST | `/auth/logout` | AuthController@logout |
| GET | `/auth/me` | AuthController@me |
| PUT | `/auth/password` | AuthController@changePassword |
| POST | `/admin/impersonate/stop` | ImpersonationController@stop |
| GET | `/app-icon` | AppIconController@show |
| GET | `/reports/campaign-summary/pdf` | CampaignSummaryController@pdf |

### Admin Only (auth:sanctum + role:admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Dashboard stats: total_clients, total_users, total_campaigns, etc. |
| GET | `/admin/audit-log` | Paginated 50/page; filters: admin_id, action, date_from, date_to |
| GET/POST | `/admin/offers` | List (with dismissals_count + client name) / Create |
| PUT | `/admin/offers/{id}` | Update offer |
| DELETE | `/admin/offers/{id}` | Delete offer |
| POST | `/admin/offers/{id}/toggle` | Toggle is_active |
| GET/POST | `/admin/clients` | List / Create |
| GET/PUT/DELETE | `/admin/clients/{id}` | Show / Update / Deactivate |
| POST | `/admin/clients/{id}/toggle-masjidconnect` | Toggle masjidconnect_enabled |
| GET/POST | `/admin/users` | List / Create |
| PUT/DELETE | `/admin/users/{id}` | Update / Delete |
| POST | `/admin/users/{id}/reset-password` | Reset password |
| POST | `/admin/users/{id}/send-onboarding` | Send onboarding email (resets password + emails credentials) |
| GET/POST | `/admin/campaigns` | List / Create |
| PUT/DELETE | `/admin/campaigns/{id}` | Update / Delete |
| POST | `/admin/impersonate/{client_id}` | Start impersonation |
| POST | `/admin/cache/invalidate/{campaign_id}` | Invalidate report cache for campaign |
| GET | `/admin/cm360-test` | Test CM360 auth |
| GET | `/admin/visibility/overview` | All clients' visibility summary |
| GET/POST | `/admin/visibility/{client_id}` | Get / Upsert visibility setting |
| DELETE | `/admin/visibility/{client_id}/reset` | Reset all visibility settings for client |
| GET/POST | `/admin/display-names` | List / Upsert rename rules |
| DELETE | `/admin/display-names/{id}` | Delete rename rule |
| GET | `/admin/masjid-connect/{client_id}` | List masjid entries (optional `?campaign_id=`) |
| POST | `/admin/masjid-connect/{client_id}` | Create masjid entry (multipart/form-data, photo required) |
| PUT | `/admin/masjid-connect/{client_id}/{id}` | Update masjid entry (photo optional) |
| DELETE | `/admin/masjid-connect/{client_id}/{id}` | Delete masjid entry + photo file |

### Client Only (auth:sanctum + role:client)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/client/visibility` | Own visibility settings (grouped by section) |
| GET | `/client/offers` | Active non-dismissed manual offers |
| POST | `/client/offers/{id}/dismiss` | Dismiss offer by ID |
| GET | `/client/masjid-connect` | `{ enabled, masjids[] }` — active entries, sorted by sort_order; optional `?campaign_id=` |
| GET | `/reports/campaigns` | Client's campaigns list |
| GET | `/reports/summary` | Summary: impressions, clicks, CTR, network_avg_ctr, ctr_vs_benchmark |
| GET | `/reports/device` | Device breakdown |
| GET | `/reports/site` | Site breakdown (domains + apps; display names applied) |
| GET | `/reports/creative` | Creative breakdown (with creative evaluation scores) |
| GET | `/reports/creatives/metadata` | Creative metadata from CM360 Creatives API (24h cache) |
| GET | `/reports/conversion` | Conversion report (requires conversion client type + has_conversion_tracking) |

> All report endpoints accept: `date_from` (Y-m-d), `date_to` (Y-m-d), `campaign_id` (required for multi_campaign clients).

---

## 6. Backend Architecture

### Directory: `backend/app/`

```
Http/
  Controllers/
    Api/
      AuthController.php            — login, logout, me (logs visit), changePassword
      UmmahPassController.php       — OAuth2 flow with UmmahPass
      PasswordResetController.php   — forgot/reset password
      ReportController.php          — All client report endpoints + creativesMetadata()
      AppIconController.php         — GET /api/app-icon (Play Store scraper, 7-day cache)
      Reports/
        CampaignSummaryController.php — PDF download
      Admin/
        ClientController.php
        UserController.php
        CampaignController.php
        ImpersonationController.php
        StatsController.php
        AuditLogController.php
        OfferAdminController.php
        CacheController.php
        OnboardingController.php
        VisibilityController.php
        DisplayNameController.php
        MasjidConnectController.php  — Also handles toggle-masjidconnect
      Client/
        VisibilityController.php
        OfferController.php          — Manual offers only (intelligent offers removed)
        MasjidConnectController.php
  Middleware/
    RoleMiddleware.php               — Checks user->role against required role
Services/
  CM360Service.php                   — Google CM360 API (singleton)
  ReportCacheService.php             — Cache layer over CM360Service (singleton)
  GmailMailerService.php             — Gmail API mailer (OAuth2, bypasses Laravel mail)
  CreativeEvaluationService.php      — Scores creatives: performance_status, fatigue_risk, etc.
  DisplayNameService.php             — Rename rules for domains/apps (singleton)
  AppIconService.php                 — Play Store icon scraper (singleton)
Models/
  User.php, Client.php, Campaign.php
  MasjidConnect.php                  — belongsTo Client + Campaign (nullable)
  ReportCache.php, CreativeCache.php
  ClientVisibilitySetting.php
  AdminAuditLog.php
  Offer.php, OfferDismissal.php
  IntelligentOfferDismissal.php      — Legacy, no longer written to
  ClientVisit.php
  AppIconCache.php
  ClientDisplayName.php
Enums/
  UserRole.php         — admin | client
  ClientType.php       — standard | conversion | multi_campaign
  CampaignStatus.php   — active | paused | ended | upcoming
```

### Key Service Details

**CM360Service** — Singleton. On construction: authenticates via `fetchAccessTokenWithRefreshToken()`. Each method builds a CM360 Report, inserts it, runs it, polls (60× every 2s), downloads CSV, parses. Cleanup happens in `finally`. CSV parsing: seeks "Report Fields" marker line (no colon), uses next line as headers, stops at "Grand Total:".

**CM360 Column Names (confirmed):**
- Metrics: `Campaign`, `Impressions`, `Clicks`, `Click Rate`
- Device: `Platform Type`
- Site: `Site (CM360)`, app dimension includes app bundle ID
- Creative: `Creative`, `Creative Pixel Size` (NOT "Creative Size")
- Conversion: `activity`, `totalConversions`, `totalConversionsRevenue`

**ReportCacheService** — Singleton. Cache key: `(campaign_id, date_from, date_to, report_type)`. TTL: 2h active / 24h others. Falls back to stale cache on CM360 error.

**CreativeEvaluationService** — Called by `ReportController::creative()`. Returns `performance_status` (top_performer / strong / average / refresh_opportunity / ready_for_refresh / insufficient_data), `vs_campaign_avg`, `vs_network_avg`, `fatigue_risk` (bool), `recommendation`. If `fatigue_risk=true`, status is overridden to `ready_for_refresh`.

**DisplayNameService** — Singleton. `applyToRows(rows, section, keyField, clientId)`: batch-resolves; client override > global. Applied to domain and app rows in `ReportController::site()`.

**GmailMailerService** — Uses Gmail API directly (not Laravel Mail). Requires `GMAIL_REFRESH_TOKEN`. Used by OnboardingController and PasswordResetController.

### Email Templates (`backend/resources/views/emails/`)
- `layout.blade.php` — Green header, footer
- `onboarding.blade.php` — Welcome + credentials
- `reset_password.blade.php` — Password reset link

### Admin Seed
```bash
php artisan db:seed --class=AdminSeeder --force
# Creates: admin@muslimadnetwork.com / Admin@1234
```

---

## 7. Frontend Architecture

### Directory: `frontend/`

```
app/
  layout.tsx                  — AuthProvider + Inter font
  page.tsx                    — Redirects to /login
  login/page.tsx              — Email/password + UmmahPass OAuth button + forgot password link
  forgot-password/page.tsx    — POST /api/auth/forgot-password
  reset-password/page.tsx     — Token+email from URL params
  profile/page.tsx            — Change password (any authenticated user)
  dashboard/
    layout.tsx                — Max-width container, white bg, no sidebar, IslamicWatermark
    page.tsx                  — Main client dashboard (all sections)
  admin/
    layout.tsx                — Sidebar nav + top bar + RouteGuard(role=admin)
    page.tsx                  — Stats: 4 stat cards
    clients/page.tsx          — Client CRUD + impersonate + MasjidConnect toggle/manage
    users/page.tsx            — User CRUD + password generation
    campaigns/page.tsx        — Campaign CRUD + client filter
    visibility/page.tsx       — Visibility: overview cards + per-client accordion
    display-names/page.tsx    — Rename rules CRUD with live preview modal
    masjid-connect/page.tsx   — MasjidConnect overview (enabled clients list)
    masjid-connect/[clientId]/page.tsx — Per-client masjid management + photo upload
    audit-log/page.tsx        — Audit log: filters, paginated, expandable metadata, CSV export
    offers/page.tsx           — Offers CRUD + toggle + create/edit modal with live preview

context/
  AuthContext.tsx             — isImpersonating, stopImpersonation(), client info

hooks/
  useReport.ts                — Generic report data hook; clears data on dep change
  useVisibility.ts            — Fetches /api/client/visibility; isHidden(), toggle()
  useOffers.ts                — Fetches /api/client/offers; dismissOffer() optimistic update
  useCreativeMetadata.ts      — Fetches creative metadata; refetches on campaignId change
  useMasjidConnect.ts         — Accepts campaignId param; refetches on change

types/
  reports.ts                  — TS interfaces: SummaryReport, DeviceRow, DomainRow, AppRow,
                                SiteBreakdown, CreativeRow, ConversionReport, Campaign, Client,
                                MasjidEntry, MasjidConnectData

lib/
  api.ts                      — Axios instance with Authorization: Bearer token
  dateUtils.ts                — getDefaultDateRange, formatDate, formatNumber, formatCTR, formatConversions

components/
  layout/
    RouteGuard.tsx            — Protects routes by role; shows LoadingScreen during auth check
  dashboard/
    StatCard.tsx              — label + value + icon + optional CTR benchmark + visibility toggle
    StatCardSkeleton.tsx      — Gold-bordered shimmer skeleton matching StatCard
    DateRangePicker.tsx       — Preset buttons + custom date inputs
    CampaignSwitcher.tsx      — Horizontal pill tabs; only for multi_campaign clients with >1 campaign
    DeviceBreakdownChart.tsx  — Recharts doughnut; colored by device; custom tooltip; legend with %
    DomainBreakdownCards.tsx  — Top-10 card grid; impression share bar; "View All" modal + search
    AppBreakdownCards.tsx     — Same as Domain; uses AppIcon component for icons
    AppBreakdownTable.tsx     — Table fallback view
    DomainBreakdownTable.tsx  — Table fallback view
    DeviceBreakdownTable.tsx  — Table fallback view
    CreativeBreakdownTable.tsx— Table fallback view
    CreativeBreakdownGrid.tsx — 3-col card grid; iframe preview; InsightsSummary filter row
    CreativePreviewModal.tsx  — Full-size iframe preview; ESC/backdrop closes; evaluation panel
    ConversionCard.tsx        — Renders nothing if available=false
    VisibilityToggle.tsx      — Eye/eye-off; only when impersonation_token in localStorage
    OfferBanner.tsx           — Single offer; dark green bg + gold border; fade on dismiss
    OffersStack.tsx           — First banner + "+N more" pill; uses OfferBanner
    CampaignSuccessBox.tsx    — "Nadia" persona card; CTR/impressions/upsell message; mailto CTA
    MasjidConnectSection.tsx  — Showcase (grid + lightbox) or marketing fallback card
    BenchmarkBadge.tsx        — CTR vs network average pill
    SinceLastVisit.tsx        — Last visit relative time + campaign progress bar
    CampaignHealthScore.tsx   — Legacy stat card (kept but removed from dashboard grid)
  ui/
    AppIcon.tsx               — Fetches /api/app-icon; gradient letter avatar fallback
    IslamicDivider.tsx        — Islamic geometric divider SVG; variant="full" or "simple"
    IslamicIcons.tsx          — Exports MosqueIcon: filled mosque silhouette SVG
    IslamicWatermark.tsx      — Fixed full-page 8-pointed star tile pattern; opacity 0.025
    Skeleton.tsx              — Shimmer div (applies .skeleton-shimmer CSS class)
    StatCardSkeleton.tsx      — Stat card shaped skeleton
    Toast.tsx                 — Toast component + useToast() hook; auto-dismisses 2s
```

### Dashboard Data Flow (`dashboard/page.tsx`)

1. `useReport('campaigns')` → populates `campaigns[]` and resolves `selectedCampaign`
2. For multi_campaign clients, `CampaignSwitcher` lets user pick; otherwise auto-selects the primary campaign
3. Each section uses its own independent `useReport(type, dateFrom, dateTo, campaignId)` call
4. `useMasjidConnect(campaignId)` — passes campaign ID; fetches `{enabled, masjids[]}`
5. `useOffers()` — fetches active non-dismissed offers; rendered in `OffersStack`
6. `useVisibility(clientId)` — controls what is hidden/shown

### Dashboard Sections (in render order)
1. Header (impersonation banner if active, Bismillah, campaign name)
2. OffersStack
3. DateRangePicker + CampaignSwitcher
4. **CampaignSuccessBox** (Nadia persona — placed here since Session 8.11)
5. Summary stat cards (4 cards: Impressions, Clicks, CTR, Muslim Reach) — using StatCardSkeleton while loading
6. IslamicDivider
7. Device breakdown (DeviceBreakdownChart — Recharts doughnut)
8. Domain breakdown (DomainBreakdownCards)
9. App breakdown (AppBreakdownCards with AppIcon)
10. Creative breakdown (CreativeBreakdownGrid with evaluation badges)
11. Conversion (ConversionCard — only for conversion/multi_campaign + has_conversion_tracking)
12. IslamicDivider
13. MasjidConnectSection (always rendered — either showcase or marketing fallback)

---

## 8. Key Features & Systems

### Visibility Control System
- Admin hides/shows sections or rows per client (while impersonating)
- DB: `client_visibility_settings (client_id, section, level, row_key, is_hidden, updated_by)`
- Sections: `summary`, `device`, `domain`, `app`, `creative`, `conversion`, `masjidconnect`
- Row-level: hide individual rows (e.g. specific domains) within a section
- Admin writes via `admin_token` (not impersonation token)
- Client reads via `GET /api/client/visibility`
- When impersonating: hidden items show at 0.3–0.4 opacity with eye-off icon
- When not impersonating (real client view): hidden items not rendered at all

### Display Name System
- Rename domains/apps for specific clients or globally
- DB: `client_display_names (client_id nullable, section, original_key, display_name)`
- `client_id = NULL` = global rule; specific `client_id` = per-client override
- Applied in `ReportController::site()` via `DisplayNameService::applyToRows()`
- Admin manages at `/admin/display-names`

### MasjidConnect
- Feature flag per client: `clients.masjidconnect_enabled`
- Masjid entries stored in `masjid_connects` table with photos on `public` disk in `masjid-screens/`
- `campaign_id = NULL` = shows for all campaigns; `campaign_id = X` = specific campaign only
- Client dashboard: `useMasjidConnect(campaignId)` filters entries for active campaign + global entries
- Admin manages at `/admin/masjid-connect/{clientId}` — multi_campaign clients see campaign tabs
- Client view: `MasjidConnectSection` shows card grid + lightbox if data exists; else marketing fallback
- Lightbox: keyboard navigation (ESC=close, ←/→=navigate), counter badge, nav arrows

### Offers System
- Manual offers created by admin in `/admin/offers`
- Global (`target='global'`) or per-client (`target='specific_client'`)
- Active/date-ranged, dismissable per user
- Frontend: `OffersStack` renders first offer + "+N more" pill
- `OfferBanner`: dark green `#1a4a2e` bg + 2px gold border, fade-out on dismiss
- **Note:** IntelligentOfferService was removed in Session 8.11. The `intelligent_offers_enabled` column on clients and `intelligent_offer_dismissals` table remain in DB but are unused.

### Campaign Success Box ("Nadia")
- Component: `CampaignSuccessBox.tsx`
- Positioned between DateRangePicker and stat cards
- Only renders when a campaign is selected (`selectedCampaign` truthy)
- Message logic:
  - CTR ≥ 2× network avg → "Xх above network average"
  - CTR ≥ network avg → "right in line with network average"
  - CTR < network avg → impressions + muslimReach count
  - Always appended: reach line (muslimReach since start_date)
  - Upsell line: impressions > 500k → compound momentum; > 100k → scale up; else → getting started
- CTA: `mailto:sales@muslimadnetwork.com?subject=Add More Impressions — {campaignName}`

### Creative Evaluation
- Service: `CreativeEvaluationService` — injected into `ReportController::creative()`
- Statuses: `top_performer` ⭐, `strong` 💪, `average`, `refresh_opportunity` 💡, `ready_for_refresh` 🔄, `insufficient_data`
- `fatigue_risk=true` overrides status to `ready_for_refresh`
- Frontend: status badges, recommendation tooltip (ℹ️), InsightsSummary filter row
- `CreativePreviewModal`: evaluation panel with status, benchmark pills, info boxes, gold box for top_performer

### App Icons
- `AppIconService` scrapes Play Store `og:image` + `og:title` for bundle IDs
- Cached in `app_icon_cache` table (7-day TTL)
- Route: `GET /api/app-icon?bundle_id=...` (auth:sanctum, any role)
- Response includes `Cache-Control: public, max-age=604800`
- Frontend: `AppIcon.tsx` — fetches from API; falls back to gradient letter avatar

### PDF Report
- Route: `GET /api/reports/campaign-summary/pdf` (any authenticated user, client scoped to own)
- Controller: `CampaignSummaryController`
- Library: `barryvdh/laravel-dompdf`
- **Note:** The "Download Report" button was removed from the frontend dashboard in Session 8.5.1. Backend endpoint still exists.

### Conversion Tracking
- Visibility rule: BOTH `client.client_type` is `conversion` or `multi_campaign` AND `campaign.has_conversion_tracking = true`
- Enforced in both `ReportController::conversion()` (backend 403 if fails) and `conversionEnabled` flag in `dashboard/page.tsx`
- CM360: uses STANDARD report type, `activity` dimension, revenue from Grand Total row

### Muslim Reach Stat Card
- Value = `Math.round(impressions / 5)` (estimated: 1 in 5 impressions reaches a Muslim)
- Icon: `MosqueIcon` from `IslamicIcons.tsx`
- Visibility key: `stat_muslimreach`

### Impersonation
- Admin clicks "Impersonate" on `/admin/clients`
- Backend creates a client token via `POST /api/admin/impersonate/{client_id}`
- Frontend: stores `admin_token` (backup), sets `auth_token` = impersonation token, sets `impersonation_token` flag, opens `/dashboard` in new tab
- Stop impersonation: restores `auth_token` from `admin_token`, clears `impersonation_token` + `admin_token`, redirects to `/admin/clients`
- `POST /api/admin/impersonate/stop` is accessible by the impersonated token (no admin role required)

---

## 9. Authentication & Impersonation

- **Token-based**: Laravel Sanctum personal access tokens
- **Header**: `Authorization: Bearer <token>`
- **Frontend storage**: `auth_token` in localStorage
- **Role enforcement**: `RoleMiddleware` on backend routes; `RouteGuard` on frontend
- **UmmahPass**: OAuth2 integration (client ID/secret not yet configured in .env)
- **Password auth**: bcrypt hashed passwords; forgot/reset flow uses `reporting_password_resets` table (60-min TTL, sha256 token)
- **Loading screen**: `RouteGuard` shows animated progress bar (0→88%) during auth check

---

## 10. CM360 Integration

**Profile ID:** 10563636
**Advertiser ID:** 16361189
**Auth:** OAuth2 refresh token (`CM360_REFRESH_TOKEN` in .env)

### Architecture
- `CM360Service` (singleton): authenticated Google API client
- Each report method: build report config → insert → run → poll → download CSV → parse → cleanup
- `ReportCacheService` (singleton): cache layer over CM360Service

### CSV Parsing Logic
1. Skip lines until "Report Fields" marker (no colon, exact string)
2. Next line = column headers
3. Parse data rows until "Grand Total:" line
4. Grand Total line parsed separately for revenue in conversion reports

### muslimadnetwork.com Merge (Session 8.8)
- `normalizeSiteBreakdown()` finds `muslimadnetwork.com` in domains
- Merges its impressions+clicks into "Prayer Times" app (case-insensitive partial match on "prayer")
- Removes `muslimadnetwork.com` from domains list
- Re-sorts apps by impressions

### CM360 API Version
- PHP library: v5 (`dfareporting.googleapis.com`)
- Download URL: v5 (upgraded from deprecated v4 in Session 8.8)
- Files API: `files->get($reportId, $fileId)` — no profile ID needed at top level

---

## 11. Brand & Design System

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Brand Green | `#1a4a2e` | Primary brand, CTAs, sidebar, card borders |
| Gold | `#C9A84C` | Headers, stat card borders, section underlines, MasjidConnect accents |
| Gold Light | `#F0D080` | Stat card icon gradient end |
| Gold Dark | `#A07830` | CSS variable `--gold-dark` |
| UI Blue | `#2563eb` | Buttons, links, active states |
| Emerald | `#10b981` | Positive metrics, active badges, progress bars |
| Purple | `#8b5cf6` | CTR icon |
| Amber | `#f59e0b` | Target/contracted icon |
| Danger | `#ef4444` / `#dc2626` | Errors, impersonation banner |
| Neutral | `#64748b` | Secondary text, labels |
| Page bg | `#f8f9fa` | Dashboard background |

### Typography
- Font: Inter (Google Fonts), loaded in `app/layout.tsx`
- Monospace: not used

### Key Design Patterns
- Cards: `rounded-2xl`, soft shadow (`0 2px 12px rgba(0,0,0,0.07)`)
- Stat cards: 1px gold border, `rounded-2xl p-5`, icon with colored gradient background
- Hover effects: `translateY(-2px)` to `translateY(-3px)` + shadow increase
- Animations: `fade-in-up` CSS class with staggered `animationDelay` (50ms increments)
- Skeleton loading: `.skeleton-shimmer` class — gradient sweep animation
- Modals: React `createPortal` to `document.body`, `z-index: 9999`, `position: fixed`
- Islamic elements: `IslamicDivider` (geometric SVG, opacity 0.35), `IslamicWatermark` (8-pointed star tile, opacity 0.025), gold accents throughout

### MosqueIcon SVG
- Defined in `components/ui/IslamicIcons.tsx`
- Filled silhouette: two minarets + dome (cubic-bezier curve) + rectangular base + crescent moon
- Crescent: `fillRule="evenodd"` with two overlapping full circles
- `viewBox="0 0 24 24"`, `fill={color ?? 'currentColor'}`
- Used everywhere: dashboard stat card, MasjidConnectSection, admin sidebar, admin masjid-connect pages

---

## 12. Session History

| Session | Key Changes |
|---------|-------------|
| 8.2 | Islamic design elements added (gold CSS vars, IslamicDivider, gold borders/gradients) |
| 8.2.1 | Design refinements: gold reduced to borders only, IslamicWatermark, card hover effects |
| 8.3 | Campaign intelligence: client_visits, network_avg_ctr, health_score, CampaignHealthScore, SinceLastVisit, BenchmarkBadge |
| 8.4 | Intelligent offers system, PDF report (barryvdh/laravel-dompdf) |
| 8.5 | Creative evaluation: CreativeEvaluationService, status badges, InsightsSummary |
| 8.5.1 | Dashboard UI fixes: removed PDF button, CampaignHealthScore redesigned, MuslimReach card, per-card visibility toggles |
| 8.6 | App icons: AppIconService (Play Store scraper), AppIconCache, AppIcon component |
| 8.7 | Favicon (Next.js file convention), admin mobile responsive (overflow-x-auto on tables) |
| 8.7.1 | Removed end_date from campaigns + pacing bar; LoadingScreen (branded auth loader) |
| 8.8 | Display names system, muslimadnetwork.com domain merge, health_score removed, CM360 API v5 upgrade |
| 8.8.1 | Modal portal fix: all modals use createPortal to document.body |
| 8.9 | MasjidConnect feature (full implementation: backend + admin UI + client dashboard) |
| 8.9.1 | MasjidConnect per-campaign support (campaign_id FK, admin tabs, client filtering) |
| 8.10 | Skeleton loading states for all dashboard sections; MosqueIcon redesign (filled SVG, IslamicIcons.tsx) |
| 8.11 | Removed IntelligentOfferService; new CampaignSuccessBox ("Nadia" persona); Pipedrive URL fix |

---

## 13. Operations

### After Every Code Session
```bash
# 1. Clear and re-cache backend config/routes
cd /var/www/muslimadnetwork-reporting/backend
php artisan config:clear && php artisan config:cache
php artisan route:clear && php artisan route:cache

# 2. Run any new migrations
php artisan migrate --force

# 3. Build frontend (as non-root user that owns .next/)
cd /var/www/muslimadnetwork-reporting/frontend
npm run build

# 4. Restart processes
pm2 restart muslimadnetwork-backend
pm2 restart muslimadnetwork-frontend
pm2 restart muslimadnetwork-queue
```

### Cache Invalidation (manual)
```bash
# Via API (admin auth required)
curl -X POST http://37.27.215.90:8001/api/admin/cache/invalidate/{campaign_id} \
  -H "Authorization: Bearer <admin_token>"

# Via artisan
cd /var/www/muslimadnetwork-reporting/backend
php artisan optimize:clear
```

### Useful Artisan Commands
```bash
# Clear all caches
php artisan optimize:clear

# Re-cache for production
php artisan optimize

# Run tinker (interactive PHP REPL)
php artisan tinker

# Check routes
php artisan route:list --path=api

# Seed admin user
php artisan db:seed --class=AdminSeeder --force
```

### Git
- Repo root: `/var/www/muslimadnetwork-reporting/`
- Main branch: `main`
- **Never run git commands during a Claude Code session.** Say "Ready to push" when done. User manages git manually.

### Photo Storage
- Masjid screen photos stored on `public` disk: `storage/app/public/masjid-screens/`
- Publicly accessible at: `http://37.27.215.90:8001/storage/masjid-screens/{filename}`
- Laravel symlink required: `php artisan storage:link` (run once at setup)

### Admin Credentials
- Email: `admin@muslimadnetwork.com`
- Password: `Admin@1234`
- Re-seed if needed: `php artisan db:seed --class=AdminSeeder --force`
