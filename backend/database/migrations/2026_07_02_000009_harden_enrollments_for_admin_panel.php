<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('enrollments', 'enrolled_price')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->decimal('enrolled_price', 10, 2)->default(0)->after('course_id');
            });
        }

        DB::statement("ALTER TABLE enrollments MODIFY status ENUM('active','expired','suspended','completed') NOT NULL DEFAULT 'active'");
    }

    public function down(): void
    {
        DB::table('enrollments')
            ->where('status', 'completed')
            ->update(['status' => 'active']);

        DB::statement("ALTER TABLE enrollments MODIFY status ENUM('active','expired','suspended') NOT NULL DEFAULT 'active'");

        if (Schema::hasColumn('enrollments', 'enrolled_price')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->dropColumn('enrolled_price');
            });
        }
    }
};
