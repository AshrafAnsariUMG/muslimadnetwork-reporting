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
        Schema::create('client_visibility_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('section');
            $table->enum('level', ['section', 'row']);
            $table->string('row_key')->nullable();
            $table->boolean('is_hidden')->default(false);
            $table->foreignId('updated_by')->constrained('users');
            $table->timestamps();

            $table->index(['client_id', 'section']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_visibility_settings');
    }
};
