<?php

namespace App\Providers;

use App\Services\AppIconService;
use App\Services\CM360Service;
use App\Services\DisplayNameService;
use App\Services\GmailMailerService;
use App\Services\ReportCacheService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CM360Service::class, fn () => new CM360Service());

        $this->app->singleton(GmailMailerService::class, fn () => new GmailMailerService());

        $this->app->singleton(
            ReportCacheService::class,
            fn ($app) => new ReportCacheService($app->make(CM360Service::class))
        );

        $this->app->singleton(AppIconService::class, fn () => new AppIconService());

        $this->app->singleton(DisplayNameService::class, fn () => new DisplayNameService());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
