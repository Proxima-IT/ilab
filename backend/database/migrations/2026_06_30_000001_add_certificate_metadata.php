<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            if (! Schema::hasColumn('certificates', 'authorized_signatory_name')) {
                $table->string('authorized_signatory_name')->nullable()->after('verification_code');
            }

            if (! Schema::hasColumn('certificates', 'authorized_signatory_title')) {
                $table->string('authorized_signatory_title')->nullable()->after('authorized_signatory_name');
            }

            if (! Schema::hasColumn('certificates', 'eligible_progress')) {
                $table->unsignedTinyInteger('eligible_progress')->default(90)->after('authorized_signatory_title');
            }
        });

        Schema::table('certificates', function (Blueprint $table) {
            $table->unique(['user_id', 'course_id'], 'certificates_user_course_unique');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropUnique('certificates_user_course_unique');
        });

        Schema::table('certificates', function (Blueprint $table) {
            if (Schema::hasColumn('certificates', 'eligible_progress')) {
                $table->dropColumn('eligible_progress');
            }

            if (Schema::hasColumn('certificates', 'authorized_signatory_title')) {
                $table->dropColumn('authorized_signatory_title');
            }

            if (Schema::hasColumn('certificates', 'authorized_signatory_name')) {
                $table->dropColumn('authorized_signatory_name');
            }
        });
    }
};
