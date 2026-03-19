<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('logo_url')->nullable();
            $table->string('primary_color')->nullable();
            $table->string('cm360_advertiser_id');
            $table->string('cm360_profile_id');
            $table->enum('client_type', ['standard', 'conversion', 'multi_campaign'])->default('standard');
            $table->boolean('is_active')->default(true);
            $table->json('features')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Add FK constraint on users.client_id now that clients table exists
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('client_id')->references('id')->on('clients')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
        });
        Schema::dropIfExists('clients');
    }
};
