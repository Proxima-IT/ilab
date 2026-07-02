<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    public static function defaults(): array
    {
        return [
            'general' => [
                'website_name' => 'iLab BD',
                'support_email' => 'support@ilabbd.com',
                'support_phone' => '+880 1700-000000',
                'currency_code' => 'BDT',
                'currency_symbol' => '৳',
            ],
            'payments' => [
                'uddoktapay_enabled' => true,
                'free_enrollment_enabled' => true,
                'manual_payment_enabled' => false,
                'sandbox_mode' => false,
                'payment_support_text' => 'For payment support, contact our support team.',
                'manual_payment_instructions' => '',
            ],
            'maintenance' => [
                'enabled' => false,
                'title' => 'We are improving iLab BD',
                'message' => 'The platform is temporarily under maintenance. Please check back soon.',
                'allowed_ips' => [],
            ],
        ];
    }

    public static function allSettings(): array
    {
        $defaults = self::defaults();
        $saved = self::query()->pluck('value', 'key')->all();

        foreach ($defaults as $key => $value) {
            if (array_key_exists($key, $saved) && is_array($saved[$key])) {
                $defaults[$key] = array_replace_recursive($value, $saved[$key]);
            }
        }

        return $defaults;
    }

    public static function section(string $key): array
    {
        return self::allSettings()[$key] ?? [];
    }
}
