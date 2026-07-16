<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.hero' => ['nullable', 'array'],
            'settings.next_batch' => ['nullable', 'array'],
            'settings.next_batch_schedule' => ['nullable', 'array'],
            'settings.offers' => ['nullable', 'array'],
            'settings.download_app' => ['nullable', 'array'],
            'settings.reviews' => ['nullable', 'array'],
        ]);

        foreach ($validated['settings'] as $key => $value) {
            if (! array_key_exists($key, WebsiteSetting::defaults())) {
                continue;
            }

            WebsiteSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json([
            'success' => true,
            'data' => WebsiteSetting::allSettings(),
            'message' => 'Website settings updated successfully.',
            'errors' => null,
        ]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $path = $validated['image']->store('website', 'public');

        return response()->json([
            'success' => true,
            'data' => [
                'path' => 'storage/' . $path,
            ],
            'message' => 'Website image uploaded successfully.',
            'errors' => null,
        ], 201);
    }
}
