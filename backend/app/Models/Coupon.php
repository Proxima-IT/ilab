<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'type',
        'value',
        'course_id',
        'max_uses',
        'used_count',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'course_id' => 'integer',
        'max_uses' => 'integer',
        'used_count' => 'integer',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at !== null
            && $this->expires_at->isPast();
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function isUsageLimitReached(): bool
    {
        return $this->max_uses !== null
            && $this->used_count >= $this->max_uses;
    }

    public function isValid(): bool
    {
        return $this->is_active
            && ! $this->isExpired()
            && ! $this->isUsageLimitReached();
    }
}
