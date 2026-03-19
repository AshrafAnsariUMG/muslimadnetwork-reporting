<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offer_dismissals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->timestamp('dismissed_at');
            $table->unique(['user_id', 'offer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offer_dismissals');
    }
};
