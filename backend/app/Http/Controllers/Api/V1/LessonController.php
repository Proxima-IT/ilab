<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Learning Experience", description: "Endpoints for enrolled students to access course content")]
class LessonController extends Controller
{
    #[OA\Get(
        path: "/api/v1/learn/courses/{slug}/syllabus",
        summary: "Get full course syllabus with playable videos",
        description: "Returns the sections and lessons. Only enrolled students will see the actual video_url for paid lessons.",
        security: [["sanctum" => []]],
        tags: ["Learning Experience"],
        parameters: [
            new OA\Parameter(name: "slug", in: "path", required: true, description: "Course slug")
        ],
        responses: [
            new OA\Response(response: 200, description: "Syllabus retrieved successfully"),
            new OA\Response(response: 403, description: "Not enrolled in this course")
        ]
    )]
    public function getSyllabus(Request $request, $slug)
    {
        $user = $request->user();

        // 1. Find the course
        $course = Course::where('slug', $slug)->where('status', 'published')->firstOrFail();

        // 2. Security Check: Is the user actively enrolled?
        $isEnrolled = DB::table('enrollments')
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->exists();

        if (!$isEnrolled) {
            return response()->json([
                'success' => false,
                'message' => 'You must be enrolled to access this learning material.'
            ], 403);
        }

        // 3. Fetch the syllabus with Sections and Lessons
        // We include the video_url because the user has passed the enrollment check
        $course->load(['sections' => function($query) {
            $query->orderBy('order', 'asc');
        }, 'sections.lessons' => function($query) {
            $query->select('id', 'section_id', 'title', 'type', 'video_url', 'duration', 'is_free', 'order')
                  ->orderBy('order', 'asc');
        }]);

        // 4. Fetch the user's completed lessons for this specific course to overlay on the UI
        $completedLessonIds = DB::table('lesson_progress')
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('is_completed', true)
            ->pluck('lesson_id');

        return response()->json([
            'success' => true,
            'data' => [
                'course' => $course,
                'completed_lessons' => $completedLessonIds
            ],
            'message' => 'Syllabus retrieved successfully.'
        ]);
    }
}