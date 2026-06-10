<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'phone', 'password', 'google_id',
        'role', 'avatar', 'district', 'education_level', 
        'bio', 'status', 'notification_prefs',
        'email_verified_at', 'phone_verified_at'
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'google_id', // Never expose OAuth IDs to the frontend
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'password' => 'hashed',
        'status' => 'boolean',
        'notification_prefs' => 'array', // Automatically serialize JSON to array
    ];

    // Relationships
    public function coursesAsInstructor()
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function devices()
    {
        return $this->hasMany(Device::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function progress()
    {
        return $this->hasMany(LessonProgress::class);
    }
}