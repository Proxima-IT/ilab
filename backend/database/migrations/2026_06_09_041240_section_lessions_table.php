<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->integer('order')->default(0);
            $table->timestamp('unlock_at')->nullable(); // For batch/drip content
            $table->timestamps();
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->enum('type', ['video', 'pdf', 'quiz', 'live_session']);
            
            $table->string('video_url')->nullable(); // YouTube Unlisted ID
            $table->integer('duration')->nullable(); // In seconds
            $table->boolean('is_free')->default(false); // True for preview videos
            $table->integer('order')->default(0);
            
            $table->longText('content')->nullable(); // Text/Notes
            
            // For Live Sessions
            $table->string('live_link')->nullable(); // Zoom/Meet link
            $table->timestamp('live_start_time')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('sections');
    }
};