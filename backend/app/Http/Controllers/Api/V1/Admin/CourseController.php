<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Instructors only see their own courses. Others see the full catalog.
        if ($user->role === 'instructor') {
            $courses = Course::with('category:id,name')
                ->where('instructor_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $courses = Course::with(['category:id,name', 'instructor:id,name'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $courses,
            'message' => 'Courses retrieved successfully.'
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,published',
            // Admins/Managers can assign a course to someone else. Instructors cannot.
            'instructor_id' => 'nullable|exists:users,id' 
        ]);

        // Security: Force instructors to own the courses they create
        $instructorId = $request->instructor_id ?? $user->id;
        if ($user->role === 'instructor') {
            $instructorId = $user->id;
        }

        $course = Course::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title) . '-' . uniqid(), // Prevent slug collisions
            'category_id' => $request->category_id,
            'instructor_id' => $instructorId,
            'description' => $request->description,
            'price' => $request->price,
            'discount_price' => $request->discount_price,
            'status' => $request->status,
        ]);

        return response()->json([
            'success' => true,
            'data' => $course,
            'message' => 'Course created successfully.'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $course = Course::findOrFail($id);

        // Security: Instructors can only update their own courses
        if ($user->role === 'instructor' && $course->instructor_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Access denied. You can only update your own courses.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,published',
            'instructor_id' => 'nullable|exists:users,id'
        ]);

        // Security: Instructors cannot transfer ownership to someone else
        $instructorId = $request->instructor_id ?? $course->instructor_id;
        if ($user->role === 'instructor') {
            $instructorId = $course->instructor_id; // Lock it to the original
        }

        $course->update([
            'title' => $request->title,
            // Only update slug if title changed to keep SEO/URLs stable
            'slug' => $request->title !== $course->title ? Str::slug($request->title) . '-' . uniqid() : $course->slug,
            'category_id' => $request->category_id,
            'instructor_id' => $instructorId,
            'description' => $request->description,
            'price' => $request->price,
            'discount_price' => $request->discount_price,
            'status' => $request->status,
        ]);

        return response()->json([
            'success' => true,
            'data' => $course,
            'message' => 'Course updated successfully.'
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        // Security: ONLY Super Admin and Admin can delete.
        if (!in_array($user->role, ['super_admin', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Access denied. Only Admins can delete records.'], 403);
        }

        $course = Course::findOrFail($id);
        
        // Optional safety: don't delete if students are actively enrolled
        if ($course->enrollments()->count() > 0) {
            return response()->json(['success' => false, 'message' => 'Cannot delete a course that has active students. Please unpublish it instead.'], 400);
        }

        $course->delete();

        return response()->json([
            'success' => true,
            'message' => 'Course deleted successfully.'
        ]);
    }
}