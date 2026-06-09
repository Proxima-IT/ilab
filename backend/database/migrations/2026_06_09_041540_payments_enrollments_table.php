<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Payments - Uses UUID to hide transaction sequence from users
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            
            $table->decimal('amount', 10, 2); // Final amount paid
            $table->enum('method', ['uddoktapay', 'manual', 'free']);
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            
            $table->string('transaction_id')->unique()->nullable(); // Gateway transaction ID
            $table->json('gateway_response')->nullable(); // Store webhook payload for debugging
            $table->timestamps();
        });

        // Enrollments
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['active', 'expired', 'suspended'])->default('active');
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            
            // Prevent double enrollment logically at database level
            $table->unique(['user_id', 'course_id']); 
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('payments');
    }
};