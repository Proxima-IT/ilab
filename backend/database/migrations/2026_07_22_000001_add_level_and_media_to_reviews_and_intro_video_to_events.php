<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->string('learner_level', 50)->nullable()->after('student_role');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->string('intro_video_url', 500)->nullable()->after('cover_url');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn('learner_level');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('intro_video_url');
        });
    }
};
