<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Payment extends Model
{
    use HasUuids; // Tells Laravel the primary key is a UUID, not auto-increment

    protected $fillable = [
        'user_id', 'course_id', 'coupon_id', 'amount', 
        'method', 'status', 'transaction_id', 'gateway_response'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array', // Safely stores full webhook payloads
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }
}