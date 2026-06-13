<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete(); // Added for massive speed boost
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();

            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable(); // Added to track exact finish time

            // Your awesome video-player resume trackers!
            $table->integer('watch_seconds')->default(0);
            $table->timestamp('last_watched_at')->nullable();

            $table->timestamps();

            // Ensure one progress record per lesson per user
            $table->unique(['user_id', 'lesson_id']);
        });

        // Certificates - Uses UUID for public sharing verification
        Schema::create('certificates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('verification_code')->unique();
            $table->timestamp('issued_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('lesson_progress');
    }
};