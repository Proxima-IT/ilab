<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Section;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    /**
     * Helper: To manage a lesson, the user must have permission 
     * on the Course that owns the Section.
     */
    private function canManageLesson($user, $sectionId)
    {
        if (in_array($user->role, ['super_admin', 'admin', 'manager'])) {
            return true;
        }

        if ($user->role === 'instructor') {
            $section = Section::with('course')->findOrFail($sectionId);
            return $section->course->instructor_id === $user->id;
        }

        return false;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Lesson::with('section.course:id,title');

        // Allow frontend to filter by section
        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        // Instructors only see lessons for courses they own
        if ($user->role === 'instructor') {
            $query->whereHas('section.course', function ($q) use ($user) {
                $q->where('instructor_id', $user->id);
            });
        }

        $lessons = $query->orderBy('section_id')->orderBy('order', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $lessons,
            'message' => 'Lessons retrieved successfully.'
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'title' => 'required|string|max:255',
            'type' => 'nullable|string', // e.g., 'video', 'pdf', 'text'
            'video_url' => 'nullable|url',
            'duration' => 'nullable|integer', // in minutes
            'is_free' => 'boolean',
            'order' => 'nullable|integer'
        ]);

        if (!$this->canManageLesson($user, $request->section_id)) {
            return response()->json(['success' => false, 'message' => 'Access denied. You do not own the parent course.'], 403);
        }

        $order = $request->order ?? (Lesson::where('section_id', $request->section_id)->max('order') + 1);

        $lesson = Lesson::create([
            'section_id' => $request->section_id,
            'title' => $request->title,
            'type' => $request->type ?? 'video',
            'video_url' => $request->video_url,
            'duration' => $request->duration ?? 0,
            'is_free' => $request->is_free ?? false,
            'order' => $order
        ]);

        return response()->json([
            'success' => true,
            'data' => $lesson,
            'message' => 'Lesson created successfully.'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $lesson = Lesson::findOrFail($id);

        if (!$this->canManageLesson($user, $lesson->section_id)) {
            return response()->json(['success' => false, 'message' => 'Access denied. You can only update your own lessons.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'nullable|string',
            'video_url' => 'nullable|url',
            'duration' => 'nullable|integer',
            'is_free' => 'boolean',
            'order' => 'nullable|integer'
        ]);

        $lesson->update([
            'title' => $request->title,
            'type' => $request->type ?? $lesson->type,
            'video_url' => $request->video_url ?? $lesson->video_url,
            'duration' => $request->duration ?? $lesson->duration,
            'is_free' => $request->has('is_free') ? $request->is_free : $lesson->is_free,
            'order' => $request->order ?? $lesson->order
        ]);

        return response()->json([
            'success' => true,
            'data' => $lesson,
            'message' => 'Lesson updated successfully.'
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        // ONLY Super Admin and Admin can delete. Block Managers and Instructors.
        if (!in_array($user->role, ['super_admin', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Access denied. Only Admins can delete records.'], 403);
        }

        $lesson = Lesson::findOrFail($id);
        $lesson->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lesson deleted successfully.'
        ]);
    }
}