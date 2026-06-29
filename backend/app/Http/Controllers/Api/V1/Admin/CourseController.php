<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->canView($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot view courses.');
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'status' => ['nullable', 'string', 'in:draft,published,archived'],
            'type' => ['nullable', 'string', 'in:self_paced,batch,free'],
            'level' => ['nullable', 'string', 'in:beginner,intermediate,advanced'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'instructor_id' => ['nullable', 'integer', 'exists:users,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Course::query()
            ->with([
                'category:id,name,slug',
                'instructor:id,name,email,phone,avatar,role',
            ])
            ->withCount('enrollments');

        if ($request->user()->role === 'instructor') {
            $query->where('instructor_id', $request->user()->id);
        }

        $query
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where(function ($subQuery) use ($validated) {
                    $subQuery->where('title', 'like', '%' . $validated['search'] . '%')
                        ->orWhere('slug', 'like', '%' . $validated['search'] . '%');
                });
            })
            ->when(! empty($validated['status']), function ($query) use ($validated) {
                $query->where('status', $validated['status']);
            })
            ->when(! empty($validated['type']), function ($query) use ($validated) {
                $query->where('type', $validated['type']);
            })
            ->when(! empty($validated['level']), function ($query) use ($validated) {
                $query->where('level', $validated['level']);
            })
            ->when(! empty($validated['category_id']), function ($query) use ($validated) {
                $query->where('category_id', $validated['category_id']);
            })
            ->when(
                ! empty($validated['instructor_id']) && $request->user()->role !== 'instructor',
                function ($query) use ($validated) {
                    $query->where('instructor_id', $validated['instructor_id']);
                }
            );

        $courses = $query
            ->latest()
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $courses,
            'message' => 'Courses retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot create courses.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'description' => ['required', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:500'],
            'intro_video' => ['nullable', 'string', 'max:500'],
            'price' => ['required', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'sale_starts_at' => ['nullable', 'date'],
            'sale_ends_at' => ['nullable', 'date', 'after_or_equal:sale_starts_at'],
            'status' => ['required', 'string', 'in:draft,published,archived'],
            'is_featured' => ['nullable', 'boolean'],
            'type' => ['required', 'string', 'in:self_paced,batch,free'],
            'level' => ['required', 'string', 'in:beginner,intermediate,advanced'],
            'language' => ['nullable', 'string', 'max:100'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'prerequisites' => ['nullable', 'array'],
            'prerequisites.*' => ['string', 'max:255'],
            'learning_outcomes' => ['nullable', 'array'],
            'learning_outcomes.*' => ['string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'instructor_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->whereIn('role', ['admin', 'instructor']),
            ],
        ]);

        if (! $this->isDiscountValid($validated)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Discount price cannot be greater than regular price.',
                'errors' => [
                    'discount_price' => ['Discount price cannot be greater than regular price.'],
                ],
            ], 422);
        }

        $instructorId = $this->resolveInstructorId($request, $validated);

        $course = Course::create([
            'title' => $validated['title'],
            'slug' => $this->uniqueSlug($validated['title']),
            'category_id' => $validated['category_id'],
            'instructor_id' => $instructorId,
            'description' => $validated['description'],
            'thumbnail' => $validated['thumbnail'] ?? null,
            'intro_video' => $validated['intro_video'] ?? null,
            'price' => $validated['price'],
            'discount_price' => $validated['discount_price'] ?? null,
            'sale_starts_at' => $validated['sale_starts_at'] ?? null,
            'sale_ends_at' => $validated['sale_ends_at'] ?? null,
            'status' => $validated['status'],
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
            'type' => $validated['type'],
            'level' => $validated['level'],
            'language' => $validated['language'] ?? 'Bengali',
            'tags' => $validated['tags'] ?? null,
            'prerequisites' => $validated['prerequisites'] ?? null,
            'learning_outcomes' => $validated['learning_outcomes'] ?? null,
            'meta_title' => $validated['meta_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
        ]);

        Cache::forget('public_categories_course');

        return response()->json([
            'success' => true,
            'data' => $course->load(['category:id,name,slug', 'instructor:id,name,email,role']),
            'message' => 'Course created successfully.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot update courses.');
        }

        $course = Course::findOrFail($id);

        if (! $this->canAccessCourse($request->user(), $course)) {
            return $this->forbiddenResponse('Access denied. You can only update your own courses.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'description' => ['required', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:500'],
            'intro_video' => ['nullable', 'string', 'max:500'],
            'price' => ['required', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'sale_starts_at' => ['nullable', 'date'],
            'sale_ends_at' => ['nullable', 'date', 'after_or_equal:sale_starts_at'],
            'status' => ['required', 'string', 'in:draft,published,archived'],
            'is_featured' => ['nullable', 'boolean'],
            'type' => ['required', 'string', 'in:self_paced,batch,free'],
            'level' => ['required', 'string', 'in:beginner,intermediate,advanced'],
            'language' => ['nullable', 'string', 'max:100'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'prerequisites' => ['nullable', 'array'],
            'prerequisites.*' => ['string', 'max:255'],
            'learning_outcomes' => ['nullable', 'array'],
            'learning_outcomes.*' => ['string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'instructor_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->whereIn('role', ['admin', 'instructor']),
            ],
        ]);

        if (! $this->isDiscountValid($validated)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Discount price cannot be greater than regular price.',
                'errors' => [
                    'discount_price' => ['Discount price cannot be greater than regular price.'],
                ],
            ], 422);
        }

        $instructorId = $course->instructor_id;

        if ($request->user()->role !== 'instructor') {
            $instructorId = $validated['instructor_id'] ?? $course->instructor_id;
        }

        $course->update([
            'title' => $validated['title'],
            'slug' => $validated['title'] !== $course->title
                ? $this->uniqueSlug($validated['title'], $course->id)
                : $course->slug,
            'category_id' => $validated['category_id'],
            'instructor_id' => $instructorId,
            'description' => $validated['description'],
            'thumbnail' => $validated['thumbnail'] ?? null,
            'intro_video' => $validated['intro_video'] ?? null,
            'price' => $validated['price'],
            'discount_price' => $validated['discount_price'] ?? null,
            'sale_starts_at' => $validated['sale_starts_at'] ?? null,
            'sale_ends_at' => $validated['sale_ends_at'] ?? null,
            'status' => $validated['status'],
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
            'type' => $validated['type'],
            'level' => $validated['level'],
            'language' => $validated['language'] ?? 'Bengali',
            'tags' => $validated['tags'] ?? null,
            'prerequisites' => $validated['prerequisites'] ?? null,
            'learning_outcomes' => $validated['learning_outcomes'] ?? null,
            'meta_title' => $validated['meta_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
        ]);

        Cache::forget('public_categories_course');

        return response()->json([
            'success' => true,
            'data' => $course->fresh()->load(['category:id,name,slug', 'instructor:id,name,email,role']),
            'message' => 'Course updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (! $this->canDelete($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can delete courses.');
        }

        $course = Course::withCount('enrollments')->findOrFail($id);

        if ($course->enrollments_count > 0) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Cannot delete a course that has enrollments. Archive it instead.',
                'errors' => null,
            ], 400);
        }

        $course->delete();


        Cache::forget('public_categories_course');

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Course deleted successfully.',
            'errors' => null,
        ]);
    }

    private function canView($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor', 'content_manager'], true);
    }

    private function canCreateOrUpdate($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor', 'content_manager'], true);
    }

    private function canDelete($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin'], true);
    }

    private function canAccessCourse($user, Course $course): bool
    {
        if ($user->role === 'instructor') {
            return (int) $course->instructor_id === (int) $user->id;
        }

        return in_array($user->role, ['super_admin', 'admin', 'manager', 'content_manager'], true);
    }

    private function resolveInstructorId(Request $request, array $validated): int
    {
        if ($request->user()->role === 'instructor') {
            return $request->user()->id;
        }

        return $validated['instructor_id'] ?? $request->user()->id;
    }

    private function isDiscountValid(array $data): bool
    {
        if (! isset($data['discount_price']) || $data['discount_price'] === null) {
            return true;
        }

        return (float) $data['discount_price'] <= (float) $data['price'];
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (
            Course::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function forbiddenResponse(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $message,
            'errors' => null,
        ], 403);
    }
}


