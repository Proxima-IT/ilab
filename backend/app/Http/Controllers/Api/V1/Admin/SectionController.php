<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Course;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    /**
     * Helper to verify if the user has permission to manage content inside a specific course.
     * Admins/Managers can manage all. Instructors can only manage their own.
     */
    private function canManageSection($user, $courseId)
    {
        if (in_array($user->role, ['super_admin', 'admin', 'manager'])) {
            return true;
        }

        if ($user->role === 'instructor') {
            $course = Course::findOrFail($courseId);
            return $course->instructor_id === $user->id;
        }

        return false;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Section::with('course:id,title');

        // Optional: Filter by course_id if the frontend passes it in the URL
        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        // Instructors only see sections for courses they own
        if ($user->role === 'instructor') {
            $query->whereHas('course', function ($q) use ($user) {
                $q->where('instructor_id', $user->id);
            });
        }

        // Sort by course, then by the visual order
        $sections = $query->orderBy('course_id')->orderBy('order', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $sections,
            'message' => 'Sections retrieved successfully.'
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'order' => 'nullable|integer'
        ]);

        // Security: Can this user add a section to this specific course?
        if (!$this->canManageSection($user, $request->course_id)) {
            return response()->json(['success' => false, 'message' => 'Access denied. You do not own this course.'], 403);
        }

        // Auto-calculate the next order number if the frontend doesn't provide one
        $order = $request->order ?? (Section::where('course_id', $request->course_id)->max('order') + 1);

        $section = Section::create([
            'course_id' => $request->course_id,
            'title' => $request->title,
            'order' => $order
        ]);

        return response()->json([
            'success' => true,
            'data' => $section,
            'message' => 'Section created successfully.'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $section = Section::findOrFail($id);

        // Security: Can this user update a section in this specific course?
        if (!$this->canManageSection($user, $section->course_id)) {
            return response()->json(['success' => false, 'message' => 'Access denied. You can only update sections in your own courses.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'order' => 'nullable|integer'
        ]);

        $section->update([
            'title' => $request->title,
            'order' => $request->order ?? $section->order
        ]);

        return response()->json([
            'success' => true,
            'data' => $section,
            'message' => 'Section updated successfully.'
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        // Security: ONLY Super Admin and Admin can delete. Block Managers and Instructors.
        if (!in_array($user->role, ['super_admin', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Access denied. Only Admins can delete records.'], 403);
        }

        $section = Section::findOrFail($id);
        
        // Safety lock: Prevent deleting a section if it already has video lessons inside it
        if ($section->lessons()->count() > 0) {
            return response()->json(['success' => false, 'message' => 'Cannot delete a section that contains lessons. Delete or move the lessons first.'], 400);
        }

        $section->delete();

        return response()->json([
            'success' => true,
            'message' => 'Section deleted successfully.'
        ]);
    }
}