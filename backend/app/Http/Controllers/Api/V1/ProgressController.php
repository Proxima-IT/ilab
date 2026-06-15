<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Learning Experience')]
class ProgressController extends Controller
{
    #[OA\Post(
        path: '/api/v1/learn/lessons/{id}/complete',
        summary: 'Mark a lesson as completed',
        description: 'Marks a lesson complete only if the student is enrolled and has watched enough of the lesson.',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Lesson ID')
        ],
        responses: [
            new OA\Response(response: 200, description: 'Progress updated successfully'),
            new OA\Response(response: 403, description: 'Not enrolled or watch threshold not met'),
            new OA\Response(response: 404, description: 'Lesson not found')
        ]
    )]
    public function markComplete(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $lesson = Lesson::with('section:id,course_id')->findOrFail($id);
        $courseId = $lesson->section->course_id;

        $enrollment = $this->activeEnrollment($user->id, $courseId);

        if (! $enrollment) {
            return $this->forbiddenResponse('You are not enrolled in this course.');
        }

        $progress = LessonProgress::firstOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'watch_seconds' => 0,
                'is_completed' => false,
                'last_watched_at' => now(),
            ]
        );

        if (! $lesson->is_free && $lesson->type === 'video') {
            $requiredSeconds = (int) ceil(((int) $lesson->duration) * 0.8);

            if ($progress->watch_seconds < $requiredSeconds) {
                return $this->forbiddenResponse('Please watch at least 80% of the lesson before completing it.');
            }
        }

        $progress->update([
            'is_completed' => true,
            'last_watched_at' => now(),
        ]);

        $progressPercentage = $this->updateEnrollmentProgress($enrollment->id, $user->id, $courseId);

        return response()->json([
            'success' => true,
            'data' => [
                'course_id' => $courseId,
                'lesson_id' => $lesson->id,
                'progress_percentage' => $progressPercentage,
                'is_course_completed' => $progressPercentage >= 100,
            ],
            'message' => 'Lesson marked as complete.',
            'errors' => null,
        ]);
    }

    #[OA\Put(
        path: '/api/v1/learn/lessons/{id}/time',
        summary: 'Sync video player watch time',
        description: 'Frontend video player should call this every 10-15 seconds to save resume point.',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Lesson ID')
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['watch_seconds'],
                properties: [
                    new OA\Property(property: 'watch_seconds', type: 'integer', example: 145)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Watch time synced successfully'),
            new OA\Response(response: 403, description: 'Not enrolled'),
            new OA\Response(response: 422, description: 'Validation error')
        ]
    )]
    public function syncWatchTime(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'watch_seconds' => ['required', 'integer', 'min:0'],
        ]);

        $user = $request->user();

        $lesson = Lesson::with('section:id,course_id')->findOrFail($id);
        $courseId = $lesson->section->course_id;

        $enrollment = $this->activeEnrollment($user->id, $courseId);

        if (! $enrollment) {
            return $this->forbiddenResponse('You are not enrolled in this course.');
        }

        $safeWatchSeconds = $this->safeWatchSeconds(
            (int) $validated['watch_seconds'],
            (int) $lesson->duration
        );

        $progress = LessonProgress::firstOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'watch_seconds' => 0,
                'is_completed' => false,
                'last_watched_at' => now(),
            ]
        );

        $progress->update([
            'watch_seconds' => max((int) $progress->watch_seconds, $safeWatchSeconds),
            'last_watched_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'lesson_id' => $lesson->id,
                'watch_seconds' => $progress->fresh()->watch_seconds,
            ],
            'message' => 'Time synced.',
            'errors' => null,
        ]);
    }

    public function courseProgress(Request $request, int $courseId): JsonResponse
    {
        $user = $request->user();

        $enrollment = $this->activeEnrollment($user->id, $courseId);

        if (! $enrollment) {
            return $this->forbiddenResponse('You are not enrolled in this course.');
        }

        $progressPercentage = $this->calculateCourseProgress($user->id, $courseId);

        return response()->json([
            'success' => true,
            'data' => [
                'course_id' => $courseId,
                'progress_percentage' => $progressPercentage,
            ],
            'message' => 'Course progress retrieved successfully.',
            'errors' => null,
        ]);
    }

    private function activeEnrollment(int $userId, int $courseId): ?object
    {
        return DB::table('enrollments')
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->first();
    }

    private function updateEnrollmentProgress(int $enrollmentId, int $userId, int $courseId): int
    {
        $progressPercentage = $this->calculateCourseProgress($userId, $courseId);

        DB::table('enrollments')
            ->where('id', $enrollmentId)
            ->update([
                'progress_percentage' => $progressPercentage,
                'status' => $progressPercentage >= 100 ? 'completed' : 'active',
                'updated_at' => now(),
            ]);

        return $progressPercentage;
    }

    private function calculateCourseProgress(int $userId, int $courseId): int
    {
        $totalLessons = Lesson::whereHas('section', function ($query) use ($courseId) {
            $query->where('course_id', $courseId);
        })->count();

        if ($totalLessons === 0) {
            return 0;
        }

        $completedLessons = LessonProgress::where('user_id', $userId)
            ->where('is_completed', true)
            ->whereHas('lesson.section', function ($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->count();

        return (int) round(($completedLessons / $totalLessons) * 100);
    }

    private function safeWatchSeconds(int $watchSeconds, int $lessonDuration): int
    {
        if ($lessonDuration <= 0) {
            return $watchSeconds;
        }

        return min($watchSeconds, $lessonDuration);
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