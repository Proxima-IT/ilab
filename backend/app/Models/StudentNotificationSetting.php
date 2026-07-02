<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentNotificationSetting extends Model
{
    protected $fillable = [
        'user_id',
        'new_lecture',
        'special_offer',
        'event',
        'profile_update',
        'course_completion',
        'certificate_ready',
        'admin_message',
        'qna_answer',
        'email',
        'sms',
        'push',
    ];

    protected $casts = [
        'new_lecture' => 'boolean',
        'special_offer' => 'boolean',
        'event' => 'boolean',
        'profile_update' => 'boolean',
        'course_completion' => 'boolean',
        'certificate_ready' => 'boolean',
        'admin_message' => 'boolean',
        'qna_answer' => 'boolean',
        'email' => 'boolean',
        'sms' => 'boolean',
        'push' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
