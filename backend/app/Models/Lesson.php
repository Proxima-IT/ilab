<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = [
        'section_id', 'title', 'type', 'video_url', 
        'duration', 'is_free', 'order', 'content', 
        'live_link', 'live_start_time'
    ];

    protected $casts = [
        'is_free' => 'boolean',
        'duration' => 'integer',
        'order' => 'integer',
        'live_start_time' => 'datetime',
    ];

    protected $hidden = [
        // Hide direct YouTube URLs from the basic payload if needed later
    ];

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function progress()
    {
        return $this->hasMany(LessonProgress::class);
    }
}