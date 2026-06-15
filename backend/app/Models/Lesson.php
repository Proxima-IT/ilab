<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    protected $fillable = [
        'section_id',
        'title',
        'type',
        'video_url',
        'duration',
        'is_free',
        'order',
        'content',
        'live_link',
        'live_start_time',
    ];

    protected $casts = [
        'is_free' => 'boolean',
        'duration' => 'integer',
        'order' => 'integer',
        'live_start_time' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $hidden = [
        'video_url',
        'live_link',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function isFreePreview(): bool
    {
        return (bool) $this->is_free;
    }

    public function isLiveSession(): bool
    {
        return $this->type === 'live_session';
    }
}