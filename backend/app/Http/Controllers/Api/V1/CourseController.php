<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Course Catalog", description: "Public endpoints for browsing the course catalog")]
class CourseController extends Controller
{
    #[OA\Get(
        path: "/api/v1/courses",
        summary: "List all published courses",
        description: "Returns a paginated list of published courses for the storefront.",
        tags: ["Course Catalog"],
        responses: [
            new OA\Response(response: 200, description: "List of courses retrieved")
        ]
    )]
    public function index(Request $request)
    {
        $courses = Course::with(['category', 'instructor:id,name,avatar'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return response()->json([
            'success' => true,
            'data' => $courses,
            'message' => 'Courses retrieved successfully.'
        ]);
    }

    #[OA\Get(
        path: "/api/v1/courses/{slug}",
        summary: "Get full course details by slug",
        description: "Returns course details including the section and lesson hierarchy. Paid video URLs are hidden from guests.",
        tags: ["Course Catalog"],
        parameters: [
            new OA\Parameter(name: "slug", in: "path", required: true, description: "The course slug (e.g., complete-laravel-react-bootcamp)")
        ],
        responses: [
            new OA\Response(response: 200, description: "Course details retrieved"),
            new OA\Response(response: 404, description: "Course not found")
        ]
    )]
    public function show($slug)
    {
        $course = Course::with([
            'category', 
            'instructor:id,name,avatar,bio',
            'sections.lessons' => function($query) {
                // For the public catalog, we only show lesson metadata, not the actual video URLs unless it's a free preview.
                $query->select('id', 'section_id', 'title', 'type', 'duration', 'is_free', 'order');
            }
        ])
        ->where('slug', $slug)
        ->where('status', 'published')
        ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $course,
            'message' => 'Course details retrieved.'
        ]);
    }
}