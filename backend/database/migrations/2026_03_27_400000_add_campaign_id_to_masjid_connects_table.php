<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('masjid_connects', function (Blueprint $table) {
            $table->foreignId('campaign_id')
                ->nullable()
                ->after('client_id')
                ->constrained('campaigns')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('masjid_connects', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Campaign::class);
            $table->dropColumn('campaign_id');
        });
    }
};
