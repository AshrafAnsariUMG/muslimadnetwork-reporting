<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UmmahPassController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/ummahpass/redirect', [UmmahPassController::class, 'redirect']);
Route::get('/auth/ummahpass/callback', [UmmahPassController::class, 'callback']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
});

// Admin only
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/test', fn () => response()->json(['message' => 'admin access confirmed']));
});

// Client only
Route::middleware(['auth:sanctum', 'role:client'])->group(function () {
    Route::get('/client/test', fn () => response()->json(['message' => 'client access confirmed']));
});
