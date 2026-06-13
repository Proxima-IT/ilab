<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Learning Experience")]
class ProgressController extends Controller
{
    #[OA\Post(
        path: "/api/v1/learn/lessons/{id}/complete",
        summary: "Mark a lesson as completed",
        description: "Records the lesson as finished and returns the updated total course progress percentage.",
        security: [["sanctum" => []]],
        tags: ["Learning Experience"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, description: "Lesson ID")
        ],
        responses: [
            new OA\Response(response: 200, description: "Progress updated successfully"),
            new OA\Response(response: 403, description: "Not enrolled")
        ]
    )]
    public function markComplete(Request $request, $id)
    {
        $user = $request->user();

        // 1. Find the lesson and its parent course
        $lesson = Lesson::with('section')->findOrFail($id);
        $courseId = $lesson->section->course_id;

        // 2. Security Check: Is the user enrolled?
        $enrollment = DB::table('enrollments')
            ->where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->first();

        if (!$enrollment) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        // 3. Mark the lesson as completed
        DB::table('lesson_progress')->updateOrInsert(
            [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
                'course_id' => $courseId,
            ],
            [
                'is_completed' => true,
                'completed_at' => now(),
                'updated_at' => now()
            ]
        );

        // 4. Calculate total course progress
        $totalLessons = Lesson::whereHas('section', function($q) use ($courseId) {
            $q->where('course_id', $courseId);
        })->count();

        $completedLessons = DB::table('lesson_progress')
            ->where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->where('is_completed', true)
            ->count();

        $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

        // 5. Update the main enrollment record (useful for quick dashboard loading)
        DB::table('enrollments')
            ->where('id', $enrollment->id)
            ->update([
                'progress_percentage' => $progressPercentage,
                'status' => $progressPercentage >= 100 ? 'completed' : 'active',
                'updated_at' => now()
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'course_id' => $courseId,
                'lesson_id' => $lesson->id,
                'progress_percentage' => $progressPercentage,
                'is_course_completed' => $progressPercentage >= 100
            ],
            'message' => 'Lesson marked as complete.'
        ]);
    }

    #[OA\Put(
        path: "/api/v1/learn/lessons/{id}/time",
        summary: "Sync video player watch time",
        description: "The frontend video player should call this silently every 10-15 seconds to save the user's resume point.",
        security: [["sanctum" => []]],
        tags: ["Learning Experience"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, description: "Lesson ID")
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["watch_seconds"],
                properties: [
                    new OA\Property(property: "watch_seconds", type: "integer", example: 145, description: "Current video timestamp in seconds")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Watch time synced successfully"),
            new OA\Response(response: 403, description: "Not enrolled")
        ]
    )]
    public function syncWatchTime(Request $request, $id)
    {
        $request->validate([
            'watch_seconds' => 'required|integer|min:0'
        ]);

        $user = $request->user();

        // 1. Find the lesson to get the parent course ID
        $lesson = Lesson::with('section')->findOrFail($id);
        $courseId = $lesson->section->course_id;

        // 2. Security Check: Is the user enrolled?
        // We use a fast exists() check here because this endpoint fires frequently
        $isEnrolled = DB::table('enrollments')
            ->where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->exists();

        if (!$isEnrolled) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        // 3. Update the resume trackers
        DB::table('lesson_progress')->updateOrInsert(
            [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
                'course_id' => $courseId,
            ],
            [
                'watch_seconds' => $request->watch_seconds,
                'last_watched_at' => now(),
                'updated_at' => now()
            ]
        );

        // Keep the response extremely lightweight since it runs in the background
        return response()->json([
            'success' => true,
            'message' => 'Time synced'
        ]);
    }
}