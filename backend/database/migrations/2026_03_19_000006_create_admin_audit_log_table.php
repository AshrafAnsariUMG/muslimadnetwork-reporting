<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_audit_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('impersonating_client_id')->nullable();
            $table->foreign('impersonating_client_id')->references('id')->on('clients')->nullOnDelete();
            $table->string('action');
            $table->json('metadata')->nullable();
            $table->string('ip_address');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_audit_log');
    }
};
