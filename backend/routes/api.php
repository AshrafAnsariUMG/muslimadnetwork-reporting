<?php

use App\Http\Controllers\Api\Admin\CampaignController;
use App\Http\Controllers\Api\Admin\ClientController;
use App\Http\Controllers\Api\Admin\ImpersonationController;
use App\Http\Controllers\Api\Admin\StatsController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UmmahPassController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/ummahpass/redirect', [UmmahPassController::class, 'redirect']);
Route::get('/auth/ummahpass/callback', [UmmahPassController::class, 'callback']);

// Protected routes (sanctum, no role restriction)
// NOTE: /admin/impersonate/stop must be registered before /admin/impersonate/{client_id}
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Impersonation stop — accessible by impersonated client user
    Route::post('/admin/impersonate/stop', [ImpersonationController::class, 'stop']);
});

// Admin only routes
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {

    // Stats
    Route::get('/admin/stats', [StatsController::class, 'index']);

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

    // Campaigns
    Route::get('/admin/campaigns', [CampaignController::class, 'index']);
    Route::post('/admin/campaigns', [CampaignController::class, 'store']);
    Route::put('/admin/campaigns/{id}', [CampaignController::class, 'update']);
    Route::delete('/admin/campaigns/{id}', [CampaignController::class, 'destroy']);

    // Impersonation start
    Route::post('/admin/impersonate/{client_id}', [ImpersonationController::class, 'start']);

    // Test
    Route::get('/admin/test', fn () => response()->json(['message' => 'admin access confirmed']));
});

// Client only routes
Route::middleware(['auth:sanctum', 'role:client'])->group(function () {
    Route::get('/client/test', fn () => response()->json(['message' => 'client access confirmed']));
});
