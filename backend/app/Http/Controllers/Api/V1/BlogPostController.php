<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Blog', description: 'Public blog post listing and details')]
class BlogPostController extends Controller
{
    #[OA\Get(
        path: '/api/v1/blog-posts',
        summary: 'List published blog posts',
        tags: ['Blog'],
        parameters: [
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 24, example: 12)
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Blog posts retrieved successfully')
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:24'],
        ]);

        $posts = BlogPost::query()
            ->with(['category:id,name,slug', 'author:id,name,avatar'])
            ->where('is_published', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->latest('published_at')
            ->paginate($validated['per_page'] ?? 12);

        return response()->json([
            'success' => true,
            'data' => $posts->items(),
            'message' => 'Blog posts retrieved successfully.',
            'errors' => null,
            'meta' => [
                'pagination' => [
                    'current_page' => $posts->currentPage(),
                    'per_page' => $posts->perPage(),
                    'total' => $posts->total(),
                    'last_page' => $posts->lastPage(),
                ],
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/v1/blog-posts/{slug}',
        summary: 'Get blog post details',
        tags: ['Blog'],
        parameters: [
            new OA\Parameter(
                name: 'slug',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', example: 'mobile-repairing-career-guide')
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Blog post retrieved successfully'),
            new OA\Response(response: 404, description: 'Blog post not found')
        ]
    )]
    public function show(string $slug): JsonResponse
    {
        $post = BlogPost::query()
            ->with(['category:id,name,slug', 'author:id,name,avatar'])
            ->where('slug', $slug)
            ->where('is_published', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $post,
            'message' => 'Blog post retrieved successfully.',
            'errors' => null,
        ]);
    }
}
