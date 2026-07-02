<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->canView($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot view sections.');
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Section::query()
            ->with('course:id,title,slug,instructor_id')
            ->withCount('lessons');

        if ($request->user()->role === 'instructor') {
            $query->whereHas('course', function ($q) use ($request) {
                $q->where('instructor_id', $request->user()->id);
            });
        }

        $query
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where('title', 'like', '%' . $validated['search'] . '%');
            })
            ->when(! empty($validated['course_id']), function ($query) use ($validated) {
                $query->where('course_id', $validated['course_id']);
            });

        $sections = $query
            ->orderBy('course_id')
            ->orderBy('order')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $sections,
            'message' => 'Sections retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot create sections.');
        }

        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/'],
            'order' => ['nullable', 'integer', 'min:1'],
            'unlock_at' => ['nullable', 'date'],
        ]);

        if (! $this->canManageCourse($request->user(), (int) $validated['course_id'])) {
            return $this->forbiddenResponse('Access denied. You can only manage sections in your allowed courses.');
        }

        $order = $validated['order'] ?? ((int) Section::where('course_id', $validated['course_id'])->max('order') + 1);

        $section = Section::create([
            'course_id' => $validated['course_id'],
            'title' => $validated['title'],
            'order' => $order,
            'unlock_at' => $validated['unlock_at'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $section->load('course:id,title,slug'),
            'message' => 'Section created successfully.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot update sections.');
        }

        $section = Section::findOrFail($id);

        if (! $this->canManageCourse($request->user(), (int) $section->course_id)) {
            return $this->forbiddenResponse('Access denied. You can only update sections in your allowed courses.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/'],
            'order' => ['nullable', 'integer', 'min:1'],
            'unlock_at' => ['nullable', 'date'],
        ]);

        $section->update([
            'title' => $validated['title'],
            'order' => $validated['order'] ?? $section->order,
            'unlock_at' => $validated['unlock_at'] ?? $section->unlock_at,
        ]);

        return response()->json([
            'success' => true,
            'data' => $section->fresh()->load('course:id,title,slug'),
            'message' => 'Section updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (! $this->canDelete($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can delete sections.');
        }

        $section = Section::withCount('lessons')->findOrFail($id);

        if ($section->lessons_count > 0) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Cannot delete a section that contains lessons. Delete or move the lessons first.',
                'errors' => null,
            ], 400);
        }

        $section->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Section deleted successfully.',
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

    private function canManageCourse($user, int $courseId): bool
    {
        if (in_array($user->role, ['super_admin', 'admin', 'manager', 'content_manager'], true)) {
            return true;
        }

        if ($user->role === 'instructor') {
            return Course::where('id', $courseId)
                ->where('instructor_id', $user->id)
                ->exists();
        }

        return false;
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
