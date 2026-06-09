<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('device_id')->unique(); // Unique hardware ID from Flutter
            $table->string('platform'); // e.g., 'android', 'ios', 'web'
            $table->string('fcm_token')->nullable(); // For push notifications
            $table->string('drm_key')->nullable(); // AES key for offline downloads
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_active_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};