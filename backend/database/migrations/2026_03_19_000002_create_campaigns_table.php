<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('cm360_campaign_id');
            $table->string('name');
            $table->enum('status', ['active', 'paused', 'ended', 'upcoming'])->default('active');
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedBigInteger('contracted_impressions')->nullable();
            $table->unsignedBigInteger('contracted_clicks')->nullable();
            $table->boolean('is_primary')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
