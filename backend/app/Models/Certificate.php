<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Certificate extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'course_id',
        'verification_code',
        'authorized_signatory_name',
        'authorized_signatory_title',
        'eligible_progress',
        'issued_at',
    ];

    protected $casts = [
        'eligible_progress' => 'integer',
        'issued_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
