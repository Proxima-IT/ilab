<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'event_type',
        'starts_at',
        'ends_at',
        'location',
        'seats',
        'cover_url',
        'intro_video_url',
        'description',
        'meta_title',
        'meta_description',
        'is_published',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'seats' => 'integer',
        'is_published' => 'boolean',
    ];

    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function isFinished(): bool
    {
        $finishTime = $this->ends_at ?? $this->starts_at;

        return $finishTime?->isPast() ?? false;
    }
}
