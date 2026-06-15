<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('email')->nullable()->unique();
            $table->string('phone')->nullable()->unique();
            $table->string('password')->nullable();

            $table->string('provider')->nullable(); // google, apple, etc.
            $table->string('provider_id')->nullable();

            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();

            $table->enum('role', ['super_admin', 'admin', 'content_manager', 'student'])->default('student');
            $table->string('avatar')->nullable();
            $table->string('district')->nullable();
            $table->string('education_level')->nullable();
            $table->text('bio')->nullable();
            $table->boolean('status')->default(true);

            $table->json('notification_prefs')->nullable();

            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['provider', 'provider_id']);
            $table->index('role');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};