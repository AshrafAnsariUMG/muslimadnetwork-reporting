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
│   │   │   │   ├── ReportController.php          # Client report endpoints
│   │   │   │   └── Admin/
│   │   │   │       ├── ClientController.php
│   │   │   │       ├── UserController.php
│   │   │   │       ├── CampaignController.php
│   │   │   │       ├── ImpersonationController.php
│   │   │   │       ├── StatsController.php
│   │   │   │       └── CacheController.php       # Manual cache invalidation
│   │   │   └── Middleware/
│   │   │       └── RoleMiddleware.php
│   │   ├── Services/
│   │   │   ├── CM360Service.php              # Google CM360 API integration
│   │   │   └── ReportCacheService.php        # TTL caching layer over CM360Service
│   │   └── Models/
│   │       ├── User.php
│   │       ├── Client.php
│   │       ├── Campaign.php
│   │       ├── ReportCache.php
│   │       └── AdminAuditLog.php
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
│   └── .env
└── frontend/
    ├── app/
    │   ├── layout.tsx                   # AuthProvider + Inter font
    │   ├── page.tsx                     # → /login
    │   ├── login/page.tsx
    │   ├── dashboard/
    │   │   ├── layout.tsx               # Max-width container, white bg, no sidebar
    │   │   └── page.tsx                 # Full reporting dashboard — summary, pacing, device/site/creative breakdowns
    │   └── admin/
    │       ├── layout.tsx               # Sidebar nav + top bar, RouteGuard role=admin
    │       ├── page.tsx                 # Stats dashboard (4 stat cards)
    │       ├── clients/page.tsx         # Client CRUD + impersonate
    │       ├── users/page.tsx           # User CRUD + password generation
    │       ├── campaigns/page.tsx       # Campaign CRUD + client filter
    │       └── audit-log/page.tsx       # Placeholder
    ├── context/
    │   └── AuthContext.tsx              # + isImpersonating, stopImpersonation()
    ├── hooks/
    │   └── useReport.ts                 # Generic report data hook (type, dateFrom, dateTo, campaignId)
    ├── types/
    │   └── reports.ts                   # TS interfaces: SummaryReport, DeviceRow, SiteRow, CreativeRow, ConversionReport, Campaign, Client
    ├── lib/
    │   ├── api.ts
    │   └── dateUtils.ts                 # getDefaultDateRange, formatDate, formatNumber, formatCTR, getPacingPercentage
    ├── components/
    │   ├── layout/
    │   │   └── RouteGuard.tsx
    │   └── dashboard/
    │       ├── StatCard.tsx             # label + value card
    │       ├── DateRangePicker.tsx      # Preset buttons + custom date inputs
    │       ├── PacingBar.tsx            # Impression pacing progress bar with color coding
    │       ├── DeviceBreakdownTable.tsx # Device rows with inline bars
    │       ├── SiteBreakdownTable.tsx   # Site rows, top 10 + show all
    │       ├── CreativeBreakdownTable.tsx # Creative rows, top 10 + show all
    │       └── ConversionCard.tsx       # Renders nothing if available=false
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
| `offers` | Promotional offers shown in portal (global or per-client) |
| `offer_dismissals` | Tracks which users dismissed which offers |
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

### Sanctum (any authenticated user)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/logout` | Revoke current token |
| GET | `/api/auth/me` | Return authenticated user |
| POST | `/api/admin/impersonate/stop` | Stop impersonation (accessible by client token) |

### Admin only (sanctum + role:admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET/POST | `/api/admin/clients` | List / create clients |
| GET/PUT/DELETE | `/api/admin/clients/{id}` | Show / update / deactivate client |
| GET/POST | `/api/admin/users` | List / create users |
| PUT/DELETE | `/api/admin/users/{id}` | Update / delete user |
| POST | `/api/admin/users/{id}/reset-password` | Reset user password |
| GET/POST | `/api/admin/campaigns` | List / create campaigns |
| PUT/DELETE | `/api/admin/campaigns/{id}` | Update / delete campaign |
| POST | `/api/admin/impersonate/{client_id}` | Start client impersonation |
| POST | `/api/admin/cache/invalidate/{campaign_id}` | Invalidate all cached reports for campaign |
| GET | `/api/admin/cm360-test` | Test CM360 service auth |

### Client only (sanctum + role:client)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/client/test` | Client access test |
| GET | `/api/reports/campaigns` | List client's campaigns |
| GET | `/api/reports/summary` | Summary report (impressions, clicks, CTR) |
| GET | `/api/reports/device` | Device breakdown |
| GET | `/api/reports/site` | Site breakdown |
| GET | `/api/reports/creative` | Creative breakdown |
| GET | `/api/reports/conversion` | Conversion report (requires has_conversion_tracking) |

> Report endpoints accept query params: `date_from` (Y-m-d), `date_to` (Y-m-d), and optionally `campaign_id` (required for multi_campaign clients).

---

## CM360 Data Model

- MAN has **one global CM360 Profile ID** and **one CM360 Advertiser ID** — stored in `.env` as `CM360_PROFILE_ID` and `CM360_ADVERTISER_ID`, accessed via `config('services.cm360.*')`
- All client campaigns live under this single advertiser
- Each `campaign` row maps to a client via `cm360_campaign_id`
- Conversion tracking is per-campaign: `has_conversion_tracking` (bool) + `cm360_activity_id` (nullable string)
- CM360 OAuth credentials: `CM360_OAUTH_CLIENT_ID` + `CM360_OAUTH_CLIENT_SECRET` (set in .env)

## CM360 Service Architecture

- **`CM360Service`** — Singleton. Initializes `Google\Client` on construction via `fetchAccessTokenWithRefreshToken()`. Each public method builds a `Google\Service\Dfareporting\Report`, calls `runReport()` which does insert→run→poll(60×2s)→download CSV→parse. Cleans up the CM360 report in `finally`. Methods: `fetchSummaryReport`, `fetchDeviceBreakdown`, `fetchSiteBreakdown`, `fetchCreativeBreakdown`, `fetchConversionReport`.

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

| Name | Hex |
|------|-----|
| Primary Green | `#1a4a2e` |
| Primary Red | `#e8192c` |
| Font | Inter (Google Fonts) |

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
