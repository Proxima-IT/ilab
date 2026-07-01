<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;

class WebsiteSettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => WebsiteSetting::allSettings(),
            'message' => 'Website settings retrieved successfully.',
            'errors' => null,
        ]);
    }
}
