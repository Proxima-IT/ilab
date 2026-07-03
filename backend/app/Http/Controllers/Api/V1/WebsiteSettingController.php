<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;

class WebsiteSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $systemSettings = SystemSetting::allSettings();

        return response()->json([
            'success' => true,
            'data' => [
                ...WebsiteSetting::allSettings(),
                'system' => [
                    'general' => $systemSettings['general'] ?? [],
                    'social_media' => $systemSettings['social_media'] ?? [],
                ],
            ],
            'message' => 'Website settings retrieved successfully.',
            'errors' => null,
        ]);
    }
}
