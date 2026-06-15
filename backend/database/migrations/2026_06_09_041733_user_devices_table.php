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

            $table->string('device_id');
            $table->string('device_hash');
            $table->enum('platform', ['web', 'android', 'ios']);
            $table->string('fcm_token')->nullable();
            $table->string('drm_key')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamp('last_active_at')->useCurrent();

            $table->timestamps();

            $table->unique(['user_id', 'device_hash']);
            $table->index('platform');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};