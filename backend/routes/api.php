<?php

use App\Http\Controllers\Api\Admin\AuditLogController;
use App\Http\Controllers\Api\Admin\DisplayNameController;
use App\Http\Controllers\Api\Admin\OfferAdminController;
use App\Http\Controllers\Api\Client\OfferController;
use App\Http\Controllers\Api\Admin\CacheController;
use App\Http\Controllers\Api\Admin\CampaignController;
use App\Http\Controllers\Api\Admin\ClientController;
use App\Http\Controllers\Api\Admin\ImpersonationController;
use App\Http\Controllers\Api\Admin\OnboardingController;
use App\Http\Controllers\Api\Admin\StatsController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\VisibilityController as AdminVisibilityController;
use App\Http\Controllers\Api\AppIconController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Client\VisibilityController as ClientVisibilityController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\Reports\CampaignSummaryController;
use App\Http\Controllers\Api\UmmahPassController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/ummahpass/redirect', [UmmahPassController::class, 'redirect']);
Route::get('/auth/ummahpass/callback', [UmmahPassController::class, 'callback']);
Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgotPassword'])->middleware('throttle:3,1');
Route::post('/auth/reset-password', [PasswordResetController::class, 'resetPassword']);

// Protected routes (sanctum, no role restriction)
// NOTE: /admin/impersonate/stop must be registered before /admin/impersonate/{client_id}
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/password', [AuthController::class, 'changePassword']);

    // Impersonation stop — accessible by impersonated client user
    Route::post('/admin/impersonate/stop', [ImpersonationController::class, 'stop']);

    // App icon lookup (any authenticated user)
    Route::get('/app-icon', [AppIconController::class, 'show']);
});

// Admin only routes
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {

    // Stats
    Route::get('/admin/stats', [StatsController::class, 'index']);

    // Audit log
    Route::get('/admin/audit-log', [AuditLogController::class, 'index']);

    // Offers management
    Route::get('/admin/offers', [OfferAdminController::class, 'index']);
    Route::post('/admin/offers', [OfferAdminController::class, 'store']);
    Route::put('/admin/offers/{id}', [OfferAdminController::class, 'update']);
    Route::delete('/admin/offers/{id}', [OfferAdminController::class, 'destroy']);
    Route::post('/admin/offers/{id}/toggle', [OfferAdminController::class, 'toggle']);

    // Clients
    Route::get('/admin/clients', [ClientController::class, 'index']);
    Route::post('/admin/clients', [ClientController::class, 'store']);
    Route::get('/admin/clients/{id}', [ClientController::class, 'show']);
    Route::put('/admin/clients/{id}', [ClientController::class, 'update']);
    Route::delete('/admin/clients/{id}', [ClientController::class, 'destroy']);

    // Users
    Route::get('/admin/users', [UserController::class, 'index']);
    Route::post('/admin/users', [UserController::class, 'store']);
    Route::put('/admin/users/{id}', [UserController::class, 'update']);
    Route::delete('/admin/users/{id}', [UserController::class, 'destroy']);
    Route::post('/admin/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    Route::post('/admin/users/{id}/send-onboarding', [OnboardingController::class, 'send']);

    // Campaigns
    Route::get('/admin/campaigns', [CampaignController::class, 'index']);
    Route::post('/admin/campaigns', [CampaignController::class, 'store']);
    Route::put('/admin/campaigns/{id}', [CampaignController::class, 'update']);
    Route::delete('/admin/campaigns/{id}', [CampaignController::class, 'destroy']);

    // Impersonation start
    Route::post('/admin/impersonate/{client_id}', [ImpersonationController::class, 'start']);

    // Cache management
    Route::post('/admin/cache/invalidate/{campaign_id}', [CacheController::class, 'invalidate']);

    // Visibility settings — overview before {client_id} to avoid route conflict
    Route::get('/admin/visibility/overview', [AdminVisibilityController::class, 'overview']);
    Route::get('/admin/visibility/{client_id}', [AdminVisibilityController::class, 'show']);
    Route::post('/admin/visibility/{client_id}', [AdminVisibilityController::class, 'upsert']);
    Route::delete('/admin/visibility/{client_id}/reset', [AdminVisibilityController::class, 'reset']);

    // Display names (rename domains/apps)
    Route::get('/admin/display-names', [DisplayNameController::class, 'index']);
    Route::post('/admin/display-names', [DisplayNameController::class, 'store']);
    Route::delete('/admin/display-names/{id}', [DisplayNameController::class, 'destroy']);

    // CM360 test
    Route::get('/admin/cm360-test', function () {
        try {
            $service = app(\App\Services\CM360Service::class);
            return response()->json(['status' => 'ok', 'message' => 'CM360 service initialized successfully.']);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    });

    // Test
    Route::get('/admin/test', fn () => response()->json(['message' => 'admin access confirmed']));
});

// PDF report — accessible by any authenticated user (client scoped to own campaigns, admin by campaign_id)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/reports/campaign-summary/pdf', [CampaignSummaryController::class, 'pdf']);
});

// Client only routes
Route::middleware(['auth:sanctum', 'role:client'])->group(function () {
    Route::get('/client/test', fn () => response()->json(['message' => 'client access confirmed']));

    // Visibility settings (client reads their own)
    Route::get('/client/visibility', [ClientVisibilityController::class, 'index']);

    // Offers
    Route::get('/client/offers', [OfferController::class, 'index']);
    Route::post('/client/offers/{id}/dismiss', [OfferController::class, 'dismiss'])->where('id', '.*');

    // Reports
    Route::get('/reports/campaigns',           [ReportController::class, 'campaigns']);
    Route::get('/reports/pacing',              [ReportController::class, 'pacing']);
    Route::get('/reports/creatives/metadata',  [ReportController::class, 'creativesMetadata']);
    Route::get('/reports/summary',   [ReportController::class, 'summary']);
    Route::get('/reports/device',    [ReportController::class, 'device']);
    Route::get('/reports/site',      [ReportController::class, 'site']);
    Route::get('/reports/creative',  [ReportController::class, 'creative']);
    Route::get('/reports/conversion',[ReportController::class, 'conversion']);
});
