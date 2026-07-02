<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            if (! Schema::hasColumn('coupons', 'course_id')) {
                $table->foreignId('course_id')
                    ->nullable()
                    ->after('value')
                    ->constrained('courses')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            if (Schema::hasColumn('coupons', 'course_id')) {
                $table->dropConstrainedForeignId('course_id');
            }
        });
    }
};
