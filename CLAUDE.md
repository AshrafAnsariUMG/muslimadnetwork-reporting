# Muslim Ad Network — Client Reporting Portal

**Operator:** Muslim Ad Network | **Developer:** claude-dev
**Server:** 37.27.215.90 | **Path:** /var/www/muslimadnetwork-reporting
**Domain:** Pending DNS cutover (currently bare IP only)

> Full project context, session history, schema details, and architectural decisions → **CONTEXT.md**

---

## Server Quick Reference

| User | Role |
|------|------|
| root | Git, Nginx, system config |
| claude-dev | Code, builds, PM2 restarts (sudo pm2) |

| PM2 Process | Port | Tech |
|-------------|------|------|
| muslimadnetwork-backend | 8001 | Laravel 13 / PHP 8.3 |
| muslimadnetwork-frontend | 3001 | Next.js 14 |
| muslimadnetwork-queue | — | Laravel queue worker |

Nginx routes `:8001` → Laravel API, `:3001` → Next.js frontend.

> **Other projects on this server — do not touch.**

---

## Tech Stack

- **Backend:** Laravel 13 (PHP 8.3), Sanctum token auth, Redis cache/queue/sessions
- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS, Recharts
- **Database:** MySQL 8.0 (`muslimadnetwork_reporting`)
- **Cache/Queue:** Redis (port 6379)
- **Email:** Gmail API via OAuth2 refresh token (not Laravel Mail)
- **Ads data:** Google CM360 API v5 (OAuth2 refresh token, singleton service)
- **PDF:** barryvdh/laravel-dompdf (CampaignSummaryController — backend only, no frontend button)

---

## Folder Structure

```
backend/app/
  Enums/
    UserRole.php              admin | client
    ClientType.php            standard | conversion | multi_campaign
    CampaignStatus.php        active | paused | ended | upcoming
  Http/Controllers/Api/
    AuthController.php        login, logout, me (logs visit), changePassword
    UmmahPassController.php   OAuth2 flow
    PasswordResetController.php  forgot/reset password
    ReportController.php      all client report endpoints + creativesMetadata()
    AppIconController.php     GET /api/app-icon (Play Store scraper, 7-day cache)
    Reports/CampaignSummaryController.php  PDF download
    Admin/
      ClientController.php
      UserController.php
      CampaignController.php
      ImpersonationController.php
      StatsController.php     total_clients, total_users, total_campaigns, top_clients
      AuditLogController.php  paginated audit log, filters: admin_id/action/date
      OfferAdminController.php  CRUD + toggle; index includes dismissals_count + client name
      CacheController.php     manual cache invalidation
      OnboardingController.php  reset password + email credentials
      VisibilityController.php  admin visibility CRUD (overview/show/upsert/reset)
      DisplayNameController.php  GET/POST/DELETE display-names; upsert on client_id+section+key
      MasjidConnectController.php  CRUD for masjid entries + toggle-masjidconnect
    Client/
      VisibilityController.php  client reads own visibility settings
      OfferController.php       manual offers only (intelligent offers removed in 8.11)
      MasjidConnectController.php  {enabled, masjids[]} filtered by campaign
  Http/Middleware/RoleMiddleware.php
  Services/
    CM360Service.php            Google CM360 API singleton; build→insert→run→poll→CSV→parse
    ReportCacheService.php      TTL cache over CM360Service (2h active / 24h others)
    GmailMailerService.php      Gmail API mailer, bypasses Laravel Mail
    CreativeEvaluationService.php  performance_status, fatigue_risk, vs_campaign_avg
    DisplayNameService.php      rename domains/apps; client override > global; singleton
    AppIconService.php          Play Store og:image scraper; 7-day DB cache; singleton
  Models/
    User.php, Client.php, Campaign.php
    MasjidConnect.php           belongsTo Client + Campaign (campaign nullable)
    ReportCache.php, CreativeCache.php
    ClientVisibilitySetting.php, AdminAuditLog.php
    Offer.php, OfferDismissal.php
    IntelligentOfferDismissal.php  legacy, no longer written to
    ClientVisit.php, AppIconCache.php, ClientDisplayName.php
  config/cors.php, sanctum.php, services.php  (cm360 + ummahpass configs)
  database/seeders/AdminSeeder.php  admin@muslimadnetwork.com / Admin@1234
  routes/api.php
  resources/views/emails/  layout.blade.php, onboarding.blade.php, reset_password.blade.php

frontend/
  app/
    layout.tsx                  AuthProvider + Inter font
    page.tsx                    → /login
    login/page.tsx              email/password + UmmahPass + forgot password link
    forgot-password/page.tsx    POST /api/auth/forgot-password
    reset-password/page.tsx     token+email from URL params
    profile/page.tsx            change password (any authenticated user)
    dashboard/layout.tsx        max-width container, white bg, IslamicWatermark
    dashboard/page.tsx          full client dashboard (all report sections)
    admin/layout.tsx            sidebar nav + RouteGuard(role=admin)
    admin/page.tsx              stats: 4 stat cards
    admin/clients/page.tsx      CRUD + impersonate + MasjidConnect toggle/manage
    admin/users/page.tsx        CRUD + password generation
    admin/campaigns/page.tsx    CRUD + client filter
    admin/visibility/page.tsx   overview cards + per-client accordion
    admin/display-names/page.tsx  rename rules CRUD + live preview modal
    admin/masjid-connect/page.tsx  enabled clients overview
    admin/masjid-connect/[clientId]/page.tsx  per-client masjid management + photo upload
    admin/audit-log/page.tsx    filters, paginated, expandable metadata, CSV export
    admin/offers/page.tsx       CRUD + toggle + create/edit modal with live preview
  context/AuthContext.tsx       isImpersonating, stopImpersonation(), client info
  hooks/
    useReport.ts                generic report hook; clears data on dep change
    useVisibility.ts            isHidden(), toggle(); fetches /api/client/visibility
    useOffers.ts                dismissOffer() optimistic update
    useCreativeMetadata.ts      creative metadata; refetches on campaignId change
    useMasjidConnect.ts         accepts campaignId param; refetches on change
  types/reports.ts              SummaryReport, DeviceRow, DomainRow, AppRow, CreativeRow,
                                ConversionReport, Campaign, Client, MasjidEntry, MasjidConnectData
  lib/api.ts                    Axios instance with Bearer token
  lib/dateUtils.ts              getDefaultDateRange, formatDate, formatNumber, formatCTR
  components/layout/RouteGuard.tsx  role guard + LoadingScreen (animated progress bar)
  components/dashboard/
    StatCard.tsx                label + value + icon + CTR benchmark + visibility toggle
    StatCardSkeleton.tsx        gold-bordered shimmer skeleton
    DateRangePicker.tsx         preset buttons + custom date inputs
    CampaignSwitcher.tsx        pill tabs; only for multi_campaign clients with >1 campaign
    DeviceBreakdownChart.tsx    Recharts doughnut; colored by device; custom tooltip
    DomainBreakdownCards.tsx    top-10 card grid; impression share bar; "View All" modal
    AppBreakdownCards.tsx       same as Domain; uses AppIcon for icons
    CreativeBreakdownGrid.tsx   3-col card grid; iframe preview; InsightsSummary filter row
    CreativePreviewModal.tsx    full-size iframe preview; ESC/backdrop; evaluation panel
    ConversionCard.tsx          renders nothing if available=false
    VisibilityToggle.tsx        eye/eye-off; only when impersonation_token in localStorage
    OfferBanner.tsx             single offer; dark green bg + gold border; fade on dismiss
    OffersStack.tsx             first banner + "+N more" pill
    CampaignHealthScore.tsx     legacy stat card (kept but removed from dashboard grid in 8.8)
    MasjidConnectSection.tsx    showcase (grid + lightbox) or marketing fallback
    BenchmarkBadge.tsx          CTR vs network average pill
    SinceLastVisit.tsx          last visit relative time + campaign progress bar
  components/ui/
    AppIcon.tsx                 fetches /api/app-icon; gradient letter avatar fallback
    IslamicDivider.tsx          Islamic geometric divider SVG; variant="full"|"simple"
    IslamicIcons.tsx            exports MosqueIcon: filled mosque silhouette SVG
    IslamicWatermark.tsx        fixed full-page 8-pointed star tile; opacity 0.025
    Skeleton.tsx                shimmer div (.skeleton-shimmer CSS class)
    StatCardSkeleton.tsx        stat card shaped skeleton
    Toast.tsx                   Toast + useToast() hook; auto-dismisses 2s
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Portal users (admin or client role; password or UmmahPass auth) |
| `clients` | Advertiser clients; client_type controls feature visibility |
| `campaigns` | CM360 campaigns linked to clients; cm360_campaign_id maps to CM360 |
| `report_cache` | Cached CM360 report payloads; key=(campaign_id,date_from,date_to,type) |
| `creative_cache` | Cached CM360 creative metadata; 24h TTL per campaign |
| `client_visibility_settings` | Per-client section/row show-hide settings |
| `client_display_names` | Rename rules for domains/apps; client_id nullable (null=global) |
| `client_visits` | Per-user visit log; 1h debounce in me() |
| `offers` | Admin-created promotional offers; global or per-client; date-ranged |
| `offer_dismissals` | Which users dismissed which offers |
| `intelligent_offer_dismissals` | Legacy; IntelligentOfferService removed in 8.11; unused |
| `masjid_connects` | Masjid screen placements; campaign_id nullable (null=all campaigns) |
| `app_icon_cache` | Play Store og:image cache; 7-day TTL per bundle_id |
| `reporting_password_resets` | sha256 tokens; 60-min TTL; single-use |
| `admin_audit_log` | Admin action audit trail including impersonation |
| `personal_access_tokens` | Sanctum API tokens |
| `sessions` | Fallback session schema (Redis is primary) |
| `cache`, `jobs`, `failed_jobs` | Laravel internals |

---

## Environment Variable Keys

### Backend (`backend/.env`)
```
APP_NAME, APP_ENV, APP_DEBUG, APP_URL, FRONTEND_URL
DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
SESSION_DRIVER, QUEUE_CONNECTION, CACHE_STORE
REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_CLIENT
SANCTUM_STATEFUL_DOMAINS, CORS_ALLOWED_ORIGINS
CM360_PROFILE_ID, CM360_ADVERTISER_ID
CM360_OAUTH_CLIENT_ID, CM360_OAUTH_CLIENT_SECRET, CM360_REFRESH_TOKEN
GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_FROM_ADDRESS
UMMAHPASS_CLIENT_ID, UMMAHPASS_CLIENT_SECRET, UMMAHPASS_REDIRECT_URI
```

### Frontend (`frontend/.env`)
```
NEXT_PUBLIC_API_URL
```

---

## API Routes

All routes prefixed `/api/`. Base: `http://37.27.215.90:8001`

### Public
```
POST   /auth/login                          login
GET    /auth/ummahpass/redirect             OAuth redirect
GET    /auth/ummahpass/callback             OAuth callback
POST   /auth/forgot-password               send reset email (throttle 3/min)
POST   /auth/reset-password                consume token + set password
```

### Any Authenticated (auth:sanctum)
```
POST   /auth/logout                         revoke token
GET    /auth/me                             current user (logs visit)
PUT    /auth/password                       change password
POST   /admin/impersonate/stop              stop impersonation
GET    /app-icon                            Play Store icon (?bundle_id=)
GET    /reports/campaign-summary/pdf        PDF download
```

### Admin Only
```
GET    /admin/stats                         dashboard stats
GET    /admin/audit-log                     paginated audit log
GET    /admin/clients                       list clients
POST   /admin/clients                       create client
GET/PUT/DELETE /admin/clients/{id}          show/update/deactivate
POST   /admin/clients/{id}/toggle-masjidconnect  toggle MasjidConnect
GET    /admin/users                         list users
POST   /admin/users                         create user
PUT/DELETE /admin/users/{id}               update/delete
POST   /admin/users/{id}/reset-password     reset password
POST   /admin/users/{id}/send-onboarding    send credentials email
GET    /admin/campaigns                     list campaigns
POST   /admin/campaigns                     create campaign
PUT/DELETE /admin/campaigns/{id}           update/delete
POST   /admin/impersonate/{client_id}       start impersonation
POST   /admin/cache/invalidate/{campaign_id}  flush cache
GET    /admin/cm360-test                    test CM360 auth
GET    /admin/visibility/overview           all clients visibility summary
GET/POST /admin/visibility/{client_id}     get/upsert setting
DELETE /admin/visibility/{client_id}/reset  reset all settings
GET/POST /admin/display-names              list/upsert rename rules
DELETE /admin/display-names/{id}           delete rename rule
GET    /admin/masjid-connect/{client_id}   list masjids
POST   /admin/masjid-connect/{client_id}   create masjid (multipart)
PUT    /admin/masjid-connect/{client_id}/{id}  update masjid
DELETE /admin/masjid-connect/{client_id}/{id}  delete masjid + photo
GET    /admin/offers                        list offers
POST   /admin/offers                        create offer
PUT    /admin/offers/{id}                   update offer
DELETE /admin/offers/{id}                   delete offer
POST   /admin/offers/{id}/toggle            toggle active
```

### Client Only
```
GET    /client/visibility                   own visibility settings
GET    /client/offers                       active non-dismissed offers
POST   /client/offers/{id}/dismiss          dismiss offer
GET    /client/masjid-connect               {enabled, masjids[]} (?campaign_id=)
GET    /reports/campaigns                   campaign list
GET    /reports/summary                     impressions/clicks/CTR/network_avg_ctr
GET    /reports/device                      device breakdown
GET    /reports/site                        domain + app breakdown (display names applied)
GET    /reports/creative                    creative breakdown + evaluation scores
GET    /reports/creatives/metadata          CM360 creative metadata (24h cache)
GET    /reports/conversion                  conversion report (requires conversion type)
```
> Report params: `date_from` (Y-m-d), `date_to` (Y-m-d), `campaign_id` (required for multi_campaign)

---

## Key Commands

### Backend
```bash
cd /var/www/muslimadnetwork-reporting/backend

php artisan migrate --force
php artisan config:clear && php artisan config:cache
php artisan route:clear && php artisan route:cache
php artisan optimize:clear
php artisan optimize
php artisan db:seed --class=AdminSeeder --force
php artisan route:list --path=api
php artisan migrate:status
php artisan tinker
```

### Frontend
```bash
cd /var/www/muslimadnetwork-reporting/frontend

npm run build
npm run dev -- -p 3001
```

### PM2
```bash
sudo pm2 restart muslimadnetwork-reporting-backend
sudo pm2 restart muslimadnetwork-reporting-frontend
sudo pm2 restart muslimadnetwork-reporting-queue
sudo pm2 logs muslimadnetwork-reporting-backend --lines 100
sudo pm2 logs muslimadnetwork-reporting-frontend --lines 100
sudo pm2 status
```

### After Every Session (backend changed)
```bash
cd /var/www/muslimadnetwork-reporting/backend
php artisan config:clear && php artisan config:cache
php artisan route:clear && php artisan route:cache
sudo pm2 restart muslimadnetwork-reporting-backend
```

### After Every Session (frontend changed)
```bash
cd /var/www/muslimadnetwork-reporting/frontend
npm run build
sudo pm2 restart muslimadnetwork-reporting-frontend
```

### Fix .next Ownership (if npm build fails with EACCES)
```bash
# Run as root:
rm -rf /var/www/muslimadnetwork-reporting/frontend/.next
chown -R claude-dev:claude-dev /var/www/muslimadnetwork-reporting/frontend
# Then re-run npm run build as claude-dev
```

---

## Workflow Rules

- Read CLAUDE.md at the start of every session
- **Never run git commands** — say "Ready to push" when done and stop
- Never run `npm run build` as root (causes .next ownership problem)
- `sudo pm2 restart` is available for claude-dev
- Always clear caches after backend changes (config:clear + config:cache + route:clear + route:cache)
- Always build frontend after frontend changes, then restart PM2
- Do not set up PM2 or Nginx — user manages those
- Do not touch other projects on this server

---

## Critical Facts

- `end_date` was removed from campaigns in 8.7.1 — **never add it back**
- `date_from` / `date_to` are report filter query params, not campaign properties — never confuse them
- CM360 profile ID (`10563636`) and advertiser ID (`16361189`) are **global in `.env`**, not per-client
- `IntelligentOfferService` was deleted in 8.11 — manual offers only; `intelligent_offer_dismissals` table stays but is unused
- Always use the Google library's Guzzle client for CM360 calls — **never use Laravel Http facade** for CM360
- `muslimadnetwork.com` auto-merges into "Prayer Times" app in site breakdown (normalizeSiteBreakdown)
- CM360 API is v5 (`dfareporting.googleapis.com`) — v4 (`www.googleapis.com`) was deprecated and removed in 8.8
- Conversion data only shows when BOTH: `client.client_type` is `conversion` or `multi_campaign` AND `campaign.has_conversion_tracking = true`
- `campaign_id = NULL` on masjid_connects means "all campaigns" (global); specific ID = that campaign only
- Admin writes visibility via `admin_token` (not impersonation token); VisibilityToggle reads `admin_token` from localStorage
- Modals use `createPortal` to `document.body` (z-index 9999) — do not revert to in-tree rendering
- Health score (`health_score`, `health_label`) was removed from summary in 8.8 — do not re-add
- PDF download button was removed from frontend in 8.5.1 — backend endpoint still exists at `/api/reports/campaign-summary/pdf`
- Admin seed: `admin@muslimadnetwork.com` / `Admin@1234`
- Masjid photos: `public` disk → `storage/app/public/masjid-screens/`; `php artisan storage:link` required once

---

## Pending Sessions

- **8.7.2** — Muslim branding additions (exact scope TBD)
- **9** — DNS cutover and launch prep (update APP_URL, FRONTEND_URL, CORS, SANCTUM_STATEFUL_DOMAINS, UMMAHPASS_REDIRECT_URI; configure UmmahPass credentials)
- **AI Campaign Success Manager upgrade** — replace CampaignSuccessBox template logic with Claude API call

---

## Notes

- Onboarding email subject: "You're live on Muslim Ad Network 🚀" (updated in 8.12)
- Email layout rebranded in 8.12: primary blue #176293, green #A5B300, gold #C9A84C; logo embedded as base64 data URI (backend/public/logo.jpeg)
- `logo.jpeg` lives in both `frontend/public/logo.jpeg` and `backend/public/logo.jpeg` (copied in 8.12 for email use)
- OnboardingController sets password permanently — no expiry, no reset token; just `Hash::make()` on the user record
- CampaignSuccessBox removed in 8.13 — file deleted, import + JSX removed from dashboard/page.tsx
- Password visibility toggle added in 8.13 — login/page.tsx and reset-password/page.tsx
