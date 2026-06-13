<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Helper to restrict structural changes to platform owners/admins
     */
    private function canModify($user)
    {
        return in_array($user->role, ['super_admin', 'admin']);
    }

    public function index()
    {
        // All admin panel staff can view categories
        $categories = Category::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
            'message' => 'Categories retrieved successfully.'
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->canModify($request->user())) {
            return response()->json(['success' => false, 'message' => 'Access denied. Admins only.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'type' => 'nullable|string' // e.g., 'course', 'ebook'
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'type' => $request->type ?? 'course',
        ]);

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Category created successfully.'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if (!$this->canModify($request->user())) {
            return response()->json(['success' => false, 'message' => 'Access denied. Admins only.'], 403);
        }

        $category = Category::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'type' => 'nullable|string'
        ]);

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'type' => $request->type ?? $category->type,
        ]);

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Category updated successfully.'
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->canModify($request->user())) {
            return response()->json(['success' => false, 'message' => 'Access denied. Admins only.'], 403);
        }

        $category = Category::findOrFail($id);
        
        // Prevent deleting a category that already has courses attached to it
        if ($category->courses()->count() > 0) {
            return response()->json(['success' => false, 'message' => 'Cannot delete a category that contains courses.'], 400);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.'
        ]);
    }
}