<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('instructor_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();

            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('description');
            $table->string('thumbnail')->nullable();
            $table->string('intro_video')->nullable();

            $table->decimal('price', 10, 2)->default(0.00);
            $table->decimal('discount_price', 10, 2)->nullable();
            $table->timestamp('sale_starts_at')->nullable();
            $table->timestamp('sale_ends_at')->nullable();

            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->enum('type', ['self_paced', 'batch', 'free'])->default('self_paced');
            $table->enum('level', ['beginner', 'intermediate', 'advanced'])->default('beginner');
            $table->string('language')->default('Bengali');

            $table->json('tags')->nullable();
            $table->json('prerequisites')->nullable();

            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
            $table->index(['category_id', 'status']);
            $table->index(['instructor_id', 'status']);
            $table->index('type');
            $table->index('level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};