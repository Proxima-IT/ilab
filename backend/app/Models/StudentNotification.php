<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentNotification extends Model
{
    public const TYPES = [
        'new_lecture',
        'special_offer',
        'event',
        'profile_update',
        'course_completion',
        'certificate_ready',
    ];

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'action_url',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function createForStudent(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        array $data = []
    ): ?self {
        if (! in_array($type, self::TYPES, true)) {
            return null;
        }

        $settings = StudentNotificationSetting::firstOrCreate(['user_id' => $userId]);

        if (! $settings->{$type}) {
            return null;
        }

        return self::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'data' => $data,
        ]);
    }
}
