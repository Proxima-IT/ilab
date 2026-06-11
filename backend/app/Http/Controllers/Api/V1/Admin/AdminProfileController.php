<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminProfileController extends Controller
{
    /**
     * Get Admin/Instructor Profile & Workspace Data
     * No Swagger tags = completely hidden from API Docs.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        // Strict security: Kick out regular students
        if ($user->role === 'student') {
            return response()->json(['success' => false, 'message' => 'Strictly unauthorized.'], 403);
        }

        // Load the user with instructor-specific context
        $user->load([
            'coursesAsInstructor' => function($query) {
                $query->withCount('enrollments')
                      ->orderBy('created_at', 'desc');
            }
        ]);

        // Calculate some basic quick-stats for the dashboard
        $totalCourses = $user->coursesAsInstructor->count();
        $totalStudents = $user->coursesAsInstructor->sum('enrollments_count');

        return response()->json([
            'success' => true,
            'data' => [
                'profile' => $user,
                'stats' => [
                    'total_courses' => $totalCourses,
                    'total_students' => $totalStudents,
                ]
            ],
            'message' => 'Workspace data retrieved.'
        ]);
    }

    /**
     * Update Admin/Instructor Profile
     */
    public function update(Request $request)
    {
        if ($request->user()->role === 'student') {
            return response()->json(['success' => false, 'message' => 'Strictly unauthorized.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'bio' => 'nullable|string',
            'avatar' => 'nullable|string'
        ]);

        $request->user()->update($validated);

        return response()->json([
            'success' => true,
            'data' => $request->user()->fresh(),
            'message' => 'Admin profile updated.'
        ]);
    }
}