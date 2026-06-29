<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('event_type')->nullable();
            $table->dateTime('starts_at')->index();
            $table->dateTime('ends_at')->nullable()->index();
            $table->string('location')->nullable();
            $table->unsignedInteger('seats')->nullable();
            $table->string('cover_url')->nullable();
            $table->text('description');
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->boolean('is_published')->default(false)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
