<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BlogPostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $posts = BlogPost::query()
            ->with(['category:id,name,slug', 'author:id,name,avatar'])
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where(function ($subQuery) use ($validated) {
                    $subQuery->where('title', 'like', '%' . $validated['search'] . '%')
                        ->orWhere('slug', 'like', '%' . $validated['search'] . '%');
                });
            })
            ->latest('published_at')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $posts,
            'message' => 'Blog posts retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedPayload($request);
        $author = $request->user();

        $post = BlogPost::create([
            ...$validated,
            'author_id' => $author->id,
            'author_name' => $author->name,
            'author_avatar' => $author->avatar,
            'slug' => $validated['slug'] ?? $this->uniqueSlug($validated['title']),
            'published_at' => $validated['published_at'] ?? now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $post,
            'message' => 'Blog post created successfully.',
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $post = BlogPost::with(['category:id,name,slug', 'author:id,name,avatar'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $post,
            'message' => 'Blog post retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $post = BlogPost::findOrFail($id);
        $validated = $this->validatedPayload($request, $post->id);

        $post->update([
            ...$validated,
            'author_id' => $post->author_id ?: $request->user()->id,
            'author_name' => $post->author_name ?: $request->user()->name,
            'author_avatar' => $post->author_avatar ?: $request->user()->avatar,
            'slug' => $validated['slug'] ?? (
                $validated['title'] !== $post->title
                    ? $this->uniqueSlug($validated['title'], $post->id)
                    : $post->slug
            ),
        ]);

        return response()->json([
            'success' => true,
            'data' => $post->fresh(['category:id,name,slug', 'author:id,name,avatar']),
            'message' => 'Blog post updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $post = BlogPost::findOrFail($id);

        $this->deleteCover($post->cover_url);
        $post->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Blog post deleted successfully.',
            'errors' => null,
        ]);
    }

    public function uploadCover(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cover' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $path = $validated['cover']->store('blog', 'public');

        return response()->json([
            'success' => true,
            'data' => [
                'cover_url' => 'storage/' . $path,
            ],
            'message' => 'Blog thumbnail uploaded successfully.',
            'errors' => null,
        ], 201);
    }

    private function validatedPayload(Request $request, ?int $postId = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('blog_posts', 'slug')->ignore($postId),
            ],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'content' => ['required', 'string'],
            'cover_url' => ['nullable', 'string', 'max:500'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'is_published' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (
            BlogPost::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function deleteCover(?string $coverUrl): void
    {
        if ($coverUrl && str_starts_with($coverUrl, 'storage/blog/')) {
            Storage::disk('public')->delete(str_replace('storage/', '', $coverUrl));
        }
    }
}
