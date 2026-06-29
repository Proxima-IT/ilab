<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('email');
            $table->string('phone');
            $table->string('education')->nullable();
            $table->string('profession')->nullable();
            $table->text('why_want_to_learn');
            $table->timestamps();

            $table->unique(['event_id', 'email']);
            $table->index(['event_id', 'phone']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_registrations');
    }
};
