<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'instructor_id',
        'category_id',
        'title',
        'slug',
        'description',
        'thumbnail',
        'intro_video',
        'price',
        'discount_price',
        'sale_starts_at',
        'sale_ends_at',
        'status',
        'is_featured',
        'type',
        'level',
        'language',
        'tags',
        'prerequisites',
        'learning_outcomes',
        'meta_title',
        'meta_description',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'sale_starts_at' => 'datetime',
        'sale_ends_at' => 'datetime',
        'is_featured' => 'boolean',
        'tags' => 'array',
        'prerequisites' => 'array',
        'learning_outcomes' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class)->orderBy('order');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function getEffectivePriceAttribute(): string
    {
        if (
            $this->discount_price !== null &&
            ($this->sale_starts_at === null || $this->sale_starts_at->isPast()) &&
            ($this->sale_ends_at === null || $this->sale_ends_at->isFuture())
        ) {
            return $this->discount_price;
        }

        return $this->price;
    }

    public function isFree(): bool
    {
        return $this->type === 'free' || (float) $this->effective_price <= 0;
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
}
