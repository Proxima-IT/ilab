<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Course Catalog', description: 'Public endpoints for browsing the course catalog')]
class CourseController extends Controller
{
    #[OA\Get(
        path: '/api/v1/courses',
        summary: 'List all published courses',
        description: 'Returns a paginated list of published courses for the storefront.',
        tags: ['Course Catalog'],
        responses: [
            new OA\Response(response: 200, description: 'List of courses retrieved')
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'level' => ['nullable', 'string', 'in:beginner,intermediate,advanced'],
            'type' => ['nullable', 'string', 'in:self_paced,batch,free'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:24'],
        ]);

        $courses = Course::query()
            ->with([
                'category:id,name,slug',
                'instructor:id,name,avatar',
            ])
            ->where('status', 'published')
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where(function ($subQuery) use ($validated) {
                    $subQuery->where('title', 'like', '%' . $validated['search'] . '%')
                        ->orWhere('description', 'like', '%' . $validated['search'] . '%');
                });
            })
            ->when(! empty($validated['category_id']), function ($query) use ($validated) {
                $query->where('category_id', $validated['category_id']);
            })
            ->when(! empty($validated['level']), function ($query) use ($validated) {
                $query->where('level', $validated['level']);
            })
            ->when(! empty($validated['type']), function ($query) use ($validated) {
                $query->where('type', $validated['type']);
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 12);

        return response()->json([
            'success' => true,
            'data' => $courses->items(),
            'message' => 'Courses retrieved successfully.',
            'errors' => null,
            'meta' => [
                'pagination' => [
                    'current_page' => $courses->currentPage(),
                    'per_page' => $courses->perPage(),
                    'total' => $courses->total(),
                    'last_page' => $courses->lastPage(),
                ],
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/v1/courses/{slug}',
        summary: 'Get full course details by slug',
        description: 'Returns course details including section and lesson hierarchy. Paid video URLs are hidden from guests.',
        tags: ['Course Catalog'],
        parameters: [
            new OA\Parameter(
                name: 'slug',
                in: 'path',
                required: true,
                description: 'The course slug',
                schema: new OA\Schema(type: 'string')
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Course details retrieved'),
            new OA\Response(response: 404, description: 'Course not found')
        ]
    )]
    public function show(string $slug): JsonResponse
    {
        $course = Course::query()
            ->with([
                'category:id,name,slug',
                'instructor:id,name,avatar,bio',
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
                        'order'
                    )->orderBy('order');
                },
            ])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $course,
            'message' => 'Course details retrieved.',
            'errors' => null,
        ]);
    }
}