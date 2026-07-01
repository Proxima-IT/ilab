<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $reviews = Review::query()
            ->when($validated['search'] ?? null, function ($query, string $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('student_name', 'like', '%' . $search . '%')
                        ->orWhere('student_role', 'like', '%' . $search . '%')
                        ->orWhere('review_text', 'like', '%' . $search . '%');
                });
            })
            ->orderBy('sort_order')
            ->latest()
            ->paginate($validated['per_page'] ?? 50);

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'message' => 'Reviews retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $review = Review::create($this->validatedData($request));

        return response()->json([
            'success' => true,
            'data' => $review,
            'message' => 'Review created successfully.',
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Review::findOrFail($id),
            'message' => 'Review retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->update($this->validatedData($request));

        return response()->json([
            'success' => true,
            'data' => $review->fresh(),
            'message' => 'Review updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        Review::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Review deleted successfully.',
            'errors' => null,
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'old_avatar' => ['nullable', 'string', 'max:500'],
        ]);

        $path = $validated['avatar']->store('reviews/avatars', 'public');

        if (
            ! empty($validated['old_avatar'])
            && str_starts_with($validated['old_avatar'], 'storage/reviews/avatars/')
        ) {
            Storage::disk('public')->delete(str_replace('storage/', '', $validated['old_avatar']));
        }

        return response()->json([
            'success' => true,
            'data' => [
                'path' => 'storage/' . $path,
            ],
            'message' => 'Review avatar uploaded successfully.',
            'errors' => null,
        ], 201);
    }

    private function validatedData(Request $request): array
    {
        return $request->validate([
            'student_name' => ['required', 'string', 'max:255'],
            'student_role' => ['nullable', 'string', 'max:255'],
            'avatar' => ['nullable', 'string', 'max:500'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review_text' => ['nullable', 'string', 'max:5000'],
            'media_type' => ['required', Rule::in(['text', 'image', 'video'])],
            'media_url' => ['nullable', 'string', 'max:500'],
            'thumbnail' => ['nullable', 'string', 'max:500'],
            'is_published' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
