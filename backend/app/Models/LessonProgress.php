<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonProgress extends Model
{
    protected $table = 'lesson_progress';

    protected $fillable = [
        'user_id',
        'course_id',
        'lesson_id',
        'is_completed',
        'completed_at',
        'watch_seconds',
        'last_watched_at',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'watch_seconds' => 'integer',
        'completed_at' => 'datetime',
        'last_watched_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function completionPercentage(int $lessonDuration): int
    {
        if ($lessonDuration <= 0) {
            return 0;
        }

        return min(
            100,
            (int) round(($this->watch_seconds / $lessonDuration) * 100)
        );
    }
}
