<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'student_name',
        'student_role',
        'learner_level',
        'avatar',
        'rating',
        'review_text',
        'media_type',
        'media_url',
        'thumbnail',
        'is_published',
        'sort_order',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_published' => 'boolean',
        'sort_order' => 'integer',
    ];
}
