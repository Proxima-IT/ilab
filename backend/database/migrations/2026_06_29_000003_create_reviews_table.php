<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->string('student_name');
            $table->string('student_role')->nullable();
            $table->string('avatar')->nullable();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('review_text')->nullable();
            $table->string('media_type')->default('text');
            $table->string('media_url')->nullable();
            $table->string('thumbnail')->nullable();
            $table->boolean('is_published')->default(true)->index();
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
