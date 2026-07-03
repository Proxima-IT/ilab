<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'settings' => SystemSetting::allSettings(),
                'payment_environment' => [
                    'uddoktapay_api_url_configured' => filled(env('UDDOKTAPAY_API_URL')),
                    'uddoktapay_api_key_configured' => filled(env('UDDOKTAPAY_API_KEY')),
                ],
            ],
            'message' => 'System settings retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],

            'settings.general' => ['required', 'array'],
            'settings.general.website_name' => ['required', 'string', 'max:120'],
            'settings.general.support_email' => ['required', 'email', 'max:190'],
            'settings.general.support_phone' => ['required', 'string', 'max:50'],
            'settings.general.currency_code' => ['required', 'string', 'max:10'],
            'settings.general.currency_symbol' => ['required', 'string', 'max:10'],

            'settings.social_media' => ['nullable', 'array', 'max:20'],
            'settings.social_media.*.name' => ['required_with:settings.social_media', 'string', 'max:80'],
            'settings.social_media.*.icon' => ['required_with:settings.social_media', 'string', 'max:80'],
            'settings.social_media.*.url' => ['required_with:settings.social_media', 'url', 'max:500'],

            'settings.maintenance' => ['required', 'array'],
            'settings.maintenance.enabled' => ['required', 'boolean'],
            'settings.maintenance.title' => ['required', 'string', 'max:160'],
            'settings.maintenance.message' => ['required', 'string', 'max:1000'],
            'settings.maintenance.allowed_ips' => ['nullable', 'array', 'max:50'],
            'settings.maintenance.allowed_ips.*' => ['string', 'max:45'],
        ]);

        $settings = $validated['settings'];
        $settings['general']['currency_code'] = strtoupper($settings['general']['currency_code']);
        $settings['social_media'] = array_values($settings['social_media'] ?? []);
        $settings['maintenance']['allowed_ips'] = array_values(array_filter(
            $settings['maintenance']['allowed_ips'] ?? [],
            fn ($ip) => filled($ip)
        ));

        foreach (SystemSetting::defaults() as $key => $default) {
            if (! array_key_exists($key, $settings)) {
                SystemSetting::firstOrCreate(
                    ['key' => $key],
                    ['value' => $default]
                );

                continue;
            }

            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_array($settings[$key]) && array_is_list($settings[$key])
                    ? $settings[$key]
                    : array_replace_recursive($default, $settings[$key])]
            );
        }

        return response()->json([
            'success' => true,
            'data' => [
                'settings' => SystemSetting::allSettings(),
                'payment_environment' => [
                    'uddoktapay_api_url_configured' => filled(env('UDDOKTAPAY_API_URL')),
                    'uddoktapay_api_key_configured' => filled(env('UDDOKTAPAY_API_KEY')),
                ],
            ],
            'message' => 'System settings updated successfully.',
            'errors' => null,
        ]);
    }
}
