<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_notification_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('student_notification_settings', 'admin_message')) {
                $table->boolean('admin_message')->default(true)->after('certificate_ready');
            }

            if (! Schema::hasColumn('student_notification_settings', 'qna_answer')) {
                $table->boolean('qna_answer')->default(true)->after('admin_message');
            }
        });
    }

    public function down(): void
    {
        Schema::table('student_notification_settings', function (Blueprint $table) {
            if (Schema::hasColumn('student_notification_settings', 'qna_answer')) {
                $table->dropColumn('qna_answer');
            }

            if (Schema::hasColumn('student_notification_settings', 'admin_message')) {
                $table->dropColumn('admin_message');
            }
        });
    }
};
