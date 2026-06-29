<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('enrollments', 'progress_percentage')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->unsignedTinyInteger('progress_percentage')->default(0)->after('expires_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('enrollments', 'progress_percentage')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->dropColumn('progress_percentage');
            });
        }
    }
};
