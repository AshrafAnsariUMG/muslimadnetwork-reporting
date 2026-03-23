<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('creative_cache', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('campaigns')->cascadeOnDelete();
            $table->string('cm360_creative_id');
            $table->string('name');
            $table->string('type')->default('');
            $table->integer('width')->default(0);
            $table->integer('height')->default(0);
            $table->text('preview_url')->nullable();
            $table->timestamp('fetched_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['campaign_id', 'cm360_creative_id']);
            $table->index(['campaign_id', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('creative_cache');
    }
};
