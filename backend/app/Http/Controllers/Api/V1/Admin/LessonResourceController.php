<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonResourceController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot create resources.');
        }

        $validated = $request->validate([
            'lesson_id' => ['required', 'integer', 'exists:lessons,id'],
            'title' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:2048'],
            'type' => ['required', 'string', 'in:google_drive,pdf,doc,sheet,slide,zip,link'],
            'file_size' => ['nullable', 'string', 'max:50'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (! $this->canManageLesson($request->user(), (int) $validated['lesson_id'])) {
            return $this->forbiddenResponse('Access denied. You can only manage resources in your own courses.');
        }

        $resource = LessonResource::create([
            'lesson_id' => $validated['lesson_id'],
            'title' => $validated['title'],
            'url' => $validated['url'],
            'type' => $validated['type'],
            'file_size' => $validated['file_size'] ?? null,
            'order' => $validated['order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $resource,
            'message' => 'Resource created successfully.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot update resources.');
        }

        $resource = LessonResource::findOrFail($id);

        if (! $this->canManageLesson($request->user(), (int) $resource->lesson_id)) {
            return $this->forbiddenResponse('Access denied. You can only manage resources in your own courses.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:2048'],
            'type' => ['required', 'string', 'in:google_drive,pdf,doc,sheet,slide,zip,link'],
            'file_size' => ['nullable', 'string', 'max:50'],
            'order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $resource->update([
            'title' => $validated['title'],
            'url' => $validated['url'],
            'type' => $validated['type'],
            'file_size' => $validated['file_size'] ?? null,
            'order' => $validated['order'] ?? $resource->order,
            'is_active' => array_key_exists('is_active', $validated) ? $validated['is_active'] : $resource->is_active,
        ]);

        return response()->json([
            'success' => true,
            'data' => $resource->fresh(),
            'message' => 'Resource updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (! $this->canDelete($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can delete resources.');
        }

        $resource = LessonResource::findOrFail($id);

        if (! $this->canManageLesson($request->user(), (int) $resource->lesson_id)) {
            return $this->forbiddenResponse('Access denied. You can only delete resources in your own courses.');
        }

        $resource->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Resource deleted successfully.',
            'errors' => null,
        ]);
    }

    private function canCreateOrUpdate($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor', 'content_manager'], true);
    }

    private function canDelete($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin'], true);
    }

    private function canManageLesson($user, int $lessonId): bool
    {
        if (in_array($user->role, ['super_admin', 'admin', 'manager', 'content_manager'], true)) {
            return true;
        }

        if ($user->role === 'instructor') {
            return Lesson::where('id', $lessonId)
                ->whereHas('section.course', function ($query) use ($user) {
                    $query->where('instructor_id', $user->id);
                })
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
