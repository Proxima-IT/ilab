<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\StudentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->canView($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot view lessons.');
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'section_id' => ['nullable', 'integer', 'exists:sections,id'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'type' => ['nullable', 'string', 'in:video,pdf,text,live_session'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Lesson::query()
            ->with('section.course:id,title,slug,instructor_id');

        if ($request->user()->role === 'instructor') {
            $query->whereHas('section.course', function ($q) use ($request) {
                $q->where('instructor_id', $request->user()->id);
            });
        }

        $query
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where('title', 'like', '%' . $validated['search'] . '%');
            })
            ->when(! empty($validated['section_id']), function ($query) use ($validated) {
                $query->where('section_id', $validated['section_id']);
            })
            ->when(! empty($validated['course_id']), function ($query) use ($validated) {
                $query->whereHas('section', function ($q) use ($validated) {
                    $q->where('course_id', $validated['course_id']);
                });
            })
            ->when(! empty($validated['type']), function ($query) use ($validated) {
                $query->where('type', $validated['type']);
            });

        $lessons = $query
            ->orderBy('section_id')
            ->orderBy('order')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $lessons,
            'message' => 'Lessons retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot create lessons.');
        }

        $validated = $request->validate([
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'title' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/'],
            'type' => ['required', 'string', 'in:video,pdf,text,live_session'],
            'video_url' => ['nullable', 'string', 'max:1000'],
            'content' => ['nullable', 'string'],
            'live_link' => ['nullable', 'string', 'max:1000'],
            'live_start_time' => ['nullable', 'date'],
            'duration' => ['nullable', 'integer', 'min:0'],
            'is_free' => ['nullable', 'boolean'],
            'order' => ['nullable', 'integer', 'min:1'],
        ]);

        if (! $this->canManageLesson($request->user(), (int) $validated['section_id'])) {
            return $this->forbiddenResponse('Access denied. You do not own the parent course.');
        }

        $order = $validated['order'] ?? ((int) Lesson::where('section_id', $validated['section_id'])->max('order') + 1);

        $lesson = Lesson::create([
            'section_id' => $validated['section_id'],
            'title' => $validated['title'],
            'type' => $validated['type'],
            'video_url' => $validated['video_url'] ?? null,
            'content' => $validated['content'] ?? null,
            'live_link' => $validated['live_link'] ?? null,
            'live_start_time' => $validated['live_start_time'] ?? null,
            'duration' => $validated['duration'] ?? 0,
            'is_free' => $validated['is_free'] ?? false,
            'order' => $order,
        ]);

        $lesson->load('section.course:id,title,slug');
        $this->notifyEnrolledStudentsAboutNewLesson($lesson);

        return response()->json([
            'success' => true,
            'data' => $lesson,
            'message' => 'Lesson created successfully.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot update lessons.');
        }

        $lesson = Lesson::findOrFail($id);

        if (! $this->canManageLesson($request->user(), (int) $lesson->section_id)) {
            return $this->forbiddenResponse('Access denied. You can only update your own lessons.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/'],
            'type' => ['required', 'string', 'in:video,pdf,text,live_session'],
            'video_url' => ['nullable', 'string', 'max:1000'],
            'content' => ['nullable', 'string'],
            'live_link' => ['nullable', 'string', 'max:1000'],
            'live_start_time' => ['nullable', 'date'],
            'duration' => ['nullable', 'integer', 'min:0'],
            'is_free' => ['nullable', 'boolean'],
            'order' => ['nullable', 'integer', 'min:1'],
        ]);

        $lesson->update([
            'title' => $validated['title'],
            'type' => $validated['type'],
            'video_url' => $validated['video_url'] ?? $lesson->video_url,
            'content' => $validated['content'] ?? $lesson->content,
            'live_link' => $validated['live_link'] ?? $lesson->live_link,
            'live_start_time' => $validated['live_start_time'] ?? $lesson->live_start_time,
            'duration' => $validated['duration'] ?? $lesson->duration,
            'is_free' => array_key_exists('is_free', $validated) ? $validated['is_free'] : $lesson->is_free,
            'order' => $validated['order'] ?? $lesson->order,
        ]);

        return response()->json([
            'success' => true,
            'data' => $lesson->fresh()->load('section.course:id,title,slug'),
            'message' => 'Lesson updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (! $this->canDelete($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can delete lessons.');
        }

        $lesson = Lesson::findOrFail($id);
        $lesson->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Lesson deleted successfully.',
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

    private function canManageLesson($user, int $sectionId): bool
    {
        if (in_array($user->role, ['super_admin', 'admin', 'manager', 'content_manager'], true)) {
            return true;
        }

        if ($user->role === 'instructor') {
            return Section::where('id', $sectionId)
                ->whereHas('course', function ($query) use ($user) {
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

    private function notifyEnrolledStudentsAboutNewLesson(Lesson $lesson): void
    {
        $course = $lesson->section?->course;

        if (! $course) {
            return;
        }

        Enrollment::query()
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->select('user_id')
            ->distinct()
            ->chunkById(200, function ($enrollments) use ($course, $lesson) {
                foreach ($enrollments as $enrollment) {
                    StudentNotification::createForStudent(
                        (int) $enrollment->user_id,
                        'new_lecture',
                        'New class added',
                        sprintf('A new class "%s" has been added to %s.', $lesson->title, $course->title),
                        sprintf('/dashboard/player/%s/%d', $course->slug, $lesson->id),
                        [
                            'course_id' => $course->id,
                            'course_title' => $course->title,
                            'course_slug' => $course->slug,
                            'lesson_id' => $lesson->id,
                            'lesson_title' => $lesson->title,
                            'section_id' => $lesson->section_id,
                        ]
                    );
                }
            }, 'user_id', 'user_id');
    }
}
