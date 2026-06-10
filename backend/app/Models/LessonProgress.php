<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LessonProgress extends Model
{
    protected $table = 'lesson_progress'; // Explicitly mapping table name

    protected $fillable = ['user_id', 'lesson_id', 'is_completed', 'watch_seconds', 'last_watched_at'];

    protected $casts = [
        'is_completed' => 'boolean',
        'watch_seconds' => 'integer',
        'last_watched_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
}