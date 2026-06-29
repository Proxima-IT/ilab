<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:12'],
        ]);

        $reviews = Review::query()
            ->where('is_published', true)
            ->orderBy('sort_order')
            ->latest()
            ->paginate($validated['per_page'] ?? 6);

        return response()->json([
            'success' => true,
            'data' => $reviews->items(),
            'message' => 'Reviews retrieved successfully.',
            'errors' => null,
            'meta' => [
                'pagination' => [
                    'current_page' => $reviews->currentPage(),
                    'per_page' => $reviews->perPage(),
                    'total' => $reviews->total(),
                    'last_page' => $reviews->lastPage(),
                ],
            ],
        ]);
    }
}
