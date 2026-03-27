<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_display_names', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained('clients')->onDelete('cascade');
            $table->enum('section', ['domain', 'app']);
            $table->string('original_key');
            $table->string('display_name');
            $table->foreignId('updated_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['client_id', 'section', 'original_key'], 'display_names_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_display_names');
    }
};
