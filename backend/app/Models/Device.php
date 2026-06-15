<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $fillable = [
        'user_id',
        'device_id',
        'device_hash',
        'platform',
        'fcm_token',
        'drm_key',
        'is_active',
        'last_active_at',
    ];
}