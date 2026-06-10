<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $fillable = ['user_id', 'device_id', 'platform', 'fcm_token', 'drm_key', 'is_active', 'last_active_at'];

    protected $hidden = [
        'drm_key', // Extreme security to prevent mobile app decryption key leaks
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_active_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}