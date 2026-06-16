<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'type' => ['nullable', 'string', 'in:course,ebook,bundle'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $categories = Category::query()
            ->withCount('courses')
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where('name', 'like', '%' . $validated['search'] . '%')
                    ->orWhere('slug', 'like', '%' . $validated['search'] . '%');
            })
            ->when(! empty($validated['type']), function ($query) use ($validated) {
                $query->where('type', $validated['type']);
            })
            ->orderBy('name')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $categories,
            'message' => 'Categories retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot create categories.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/', 'unique:categories,name'],
            'type' => ['nullable', 'string', 'in:course,ebook,bundle'],
        ]);

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $this->uniqueSlug($validated['name']),
            'type' => $validated['type'] ?? 'course',
        ]);

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Category created successfully.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot update categories.');
        }

        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[^\r\n]+$/',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'type' => ['nullable', 'string', 'in:course,ebook,bundle'],
        ]);

        $category->update([
            'name' => $validated['name'],
            'slug' => $this->uniqueSlug($validated['name'], $category->id),
            'type' => $validated['type'] ?? $category->type,
        ]);

        return response()->json([
            'success' => true,
            'data' => $category->fresh(),
            'message' => 'Category updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (! $this->canDelete($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot delete categories.');
        }

        $category = Category::withCount('courses')->findOrFail($id);

        if ($category->courses_count > 0) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Cannot delete a category that contains courses.',
                'errors' => null,
            ], 400);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Category deleted successfully.',
            'errors' => null,
        ]);
    }

    private function canCreateOrUpdate($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin', 'manager'], true);
    }

    private function canDelete($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin'], true);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (
            Category::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
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