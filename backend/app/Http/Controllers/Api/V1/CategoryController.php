<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'string', 'in:course,blog'],
        ]);

        $type = $validated['type'] ?? 'course';

        $categories = Cache::remember(
            "public_categories_{$type}",
            now()->addMinutes(10),
            fn () => Category::query()
                ->select('id', 'name', 'slug', 'type')
                ->where('type', $type)
                ->whereHas('courses', function ($query) {
                    $query->where('status', 'published');
                })
                ->withCount(['courses' => function ($query) {
                    $query->where('status', 'published');
                }])
                ->orderBy('name')
                ->get()
        );

        return response()->json([
            'success' => true,
            'data' => $categories,
            'message' => 'Categories retrieved successfully.',
            'errors' => null,
        ]);
    }
}
