<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonAnswer extends Model
{
    protected $fillable = [
        'lesson_question_id',
        'user_id',
        'answer',
        'is_instructor_answer',
    ];

    protected $casts = [
        'is_instructor_answer' => 'boolean',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(LessonQuestion::class, 'lesson_question_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
