<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('timestamp_seconds')->default(0);
            $table->text('note');
            $table->timestamps();

            $table->index(['user_id', 'lesson_id']);
        });

        Schema::create('lesson_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->text('question');
            $table->enum('status', ['open', 'answered', 'closed'])->default('open');
            $table->timestamps();

            $table->index(['lesson_id', 'status']);
        });

        Schema::create('lesson_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('answer');
            $table->boolean('is_instructor_answer')->default(false);
            $table->timestamps();
        });

        Schema::create('lesson_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('url', 2048);
            $table->enum('type', ['google_drive', 'pdf', 'doc', 'sheet', 'slide', 'zip', 'link'])->default('google_drive');
            $table->string('file_size')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['lesson_id', 'is_active', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_resources');
        Schema::dropIfExists('lesson_answers');
        Schema::dropIfExists('lesson_questions');
        Schema::dropIfExists('lesson_notes');
    }
};
