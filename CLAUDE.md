# Muslim Ad Network — Client Reporting Portal

## Project Overview
A client-facing reporting portal for Muslim Ad Network. Clients log in (via UmmahPass OAuth or password) to view campaign performance data pulled from Campaign Manager 360 (CM360). Admins manage clients, campaigns, offers, and can impersonate client accounts.

---

## Stack & Ports

| Layer    | Tech                        | Port |
|----------|-----------------------------|------|
| Backend  | Laravel 13 (PHP 8.3)        | 8001 |
| Frontend | Next.js 14 (App Router, TS) | 3001 |
| Database | MySQL                        | 3306 |
| Cache/Queue/Session | Redis          | 6379 |

> Note: Laravel 13 was installed (latest available at scaffold time). Task spec referenced Laravel 11.

---

## Folder Structure

```
/var/www/muslimadnetwork-reporting/
├── CLAUDE.md
├── backend/                        # Laravel 13 API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── ...
│   ├── config/
│   │   └── sanctum.php
│   ├── database/
│   │   └── migrations/
│   ├── routes/
│   │   ├── api.php
│   │   └── web.php
│   └── .env
└── frontend/                       # Next.js 14
    ├── app/
    │   ├── page.tsx               → redirects to /login
    │   ├── login/page.tsx
    │   ├── dashboard/page.tsx
    │   └── admin/page.tsx
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
| `CM360_PROFILE_ID` | (to be filled) |
| `CM360_REFRESH_TOKEN` | (to be filled) |
| `UMMAHPASS_CLIENT_ID` | (to be filled) |
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
| `clients` | Advertiser clients with CM360 config and feature flags |
| `campaigns` | CM360 campaigns linked to clients |
| `report_cache` | Cached CM360 report payloads with expiry |
| `offers` | Promotional offers shown in portal (global or per-client) |
| `offer_dismissals` | Tracks which users dismissed which offers |
| `admin_audit_log` | Audit trail for admin actions, including impersonation |
| `personal_access_tokens` | Sanctum API tokens |
| `sessions` | Redis-backed sessions (table exists as fallback schema) |
| `cache` | Laravel cache table |
| `jobs` | Queue jobs table |

---

## Key Commands

### Backend
```bash
# Run migrations
cd /var/www/muslimadnetwork-reporting/backend && php artisan migrate --force

# Clear all caches
php artisan optimize:clear

# Clear config/route/view cache individually
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Re-cache for production
php artisan optimize
```

### Frontend
```bash
# Build
cd /var/www/muslimadnetwork-reporting/frontend && npm run build

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
4. Backend runs via PHP built-in server or PHP-FPM behind Nginx on port 8001.
5. Frontend runs via `next start` on port 3001.
