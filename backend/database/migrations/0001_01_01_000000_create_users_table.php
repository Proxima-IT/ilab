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
            $table->string('email')->unique()->nullable(); // Nullable for phone-only registration
            $table->string('phone')->unique()->nullable(); // Nullable for email-only/Google registration
            $table->string('password')->nullable(); // Nullable for Google OAuth logins
            $table->string('google_id')->unique()->nullable();
            
            // Verification Tracking
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            
            // Profile & Roles
            $table->enum('role', ['super_admin', 'admin', 'content_manager', 'student'])->default('student');
            $table->string('avatar')->nullable();
            $table->string('district')->nullable();
            $table->string('education_level')->nullable();
            $table->text('bio')->nullable();
            $table->boolean('status')->default(true); // false = banned/suspended
            
            // Notification Preferences (Stored as JSON)
            $table->json('notification_prefs')->nullable(); // e.g., {"email": true, "sms": false, "push": true}
            
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes(); // Never permanently delete a user, preserve financial records
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};