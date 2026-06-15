<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Learning Experience', description: 'Endpoints for enrolled students to access course content')]
class LessonController extends Controller
{
    #[OA\Get(
        path: '/api/v1/learn/courses/{slug}/syllabus',
        summary: 'Get full course syllabus',
        description: 'Returns sections and lessons for enrolled students. Direct video URLs are not exposed.',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        parameters: [
            new OA\Parameter(name: 'slug', in: 'path', required: true, description: 'Course slug')
        ],
        responses: [
            new OA\Response(response: 200, description: 'Syllabus retrieved successfully'),
            new OA\Response(response: 403, description: 'Not enrolled in this course'),
            new OA\Response(response: 404, description: 'Course not found')
        ]
    )]
    public function getSyllabus(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();

        $course = Course::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $isEnrolled = DB::table('enrollments')
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->exists();

        if (! $isEnrolled) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You must be enrolled to access this learning material.',
                'errors' => null,
            ], 403);
        }

        $course->load([
            'sections' => function ($query) {
                $query->select('id', 'course_id', 'title', 'order', 'unlock_at')
                    ->orderBy('order');
            },
            'sections.lessons' => function ($query) {
                $query->select(
                    'id',
                    'section_id',
                    'title',
                    'type',
                    'duration',
                    'is_free',
                    'order',
                    'live_start_time'
                )->orderBy('order');
            },
        ]);

        $lessonIds = $course->sections
            ->flatMap(fn ($section) => $section->lessons->pluck('id'))
            ->values();

        $completedLessonIds = DB::table('lesson_progress')
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->where('is_completed', true)
            ->pluck('lesson_id');

        return response()->json([
            'success' => true,
            'data' => [
                'course' => $course,
                'completed_lessons' => $completedLessonIds,
            ],
            'message' => 'Syllabus retrieved successfully.',
            'errors' => null,
        ]);
    }
}