<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnrollmentController extends Controller
{
    /**
     * Helper to restrict financial/access modifications to platform owners/admins
     */
    private function canModify($user)
    {
        return in_array($user->role, ['super_admin', 'admin']);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        // Build a joined query to get all relevant student and course data in one fast request
        $query = DB::table('enrollments')
            ->join('users', 'enrollments.user_id', '=', 'users.id')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->select(
                'enrollments.*', 
                'users.name as student_name', 
                'users.email as student_email', 
                'courses.title as course_title', 
                'courses.instructor_id'
            );

        // Security: Instructors are hard-locked to only see their own course enrollments
        if ($user->role === 'instructor') {
            $query->where('courses.instructor_id', $user->id);
        }

        // Optional: Let the frontend filter by specific courses or students
        if ($request->has('course_id')) {
            $query->where('enrollments.course_id', $request->course_id);
        }
        if ($request->has('user_id')) {
            $query->where('enrollments.user_id', $request->user_id);
        }

        $enrollments = $query->orderBy('enrollments.created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $enrollments,
            'message' => 'Enrollment ledger retrieved successfully.'
        ]);
    }

    public function store(Request $request)
    {
        // Security: Block Managers and Instructors from giving away free access
        if (!$this->canModify($request->user())) {
            return response()->json(['success' => false, 'message' => 'Access denied. Only Admins can manually enroll students.'], 403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'course_id' => 'required|exists:courses,id',
            'enrolled_price' => 'required|numeric|min:0', // Useful for logging offline cash payments
            'status' => 'required|in:active,completed,suspended'
        ]);

        // Security: Prevent double-enrollment corruption
        $exists = DB::table('enrollments')
            ->where('user_id', $request->user_id)
            ->where('course_id', $request->course_id)
            ->exists();

        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Student is already enrolled in this course.'], 400);
        }

        $enrollmentId = DB::table('enrollments')->insertGetId([
            'user_id' => $request->user_id,
            'course_id' => $request->course_id,
            'enrolled_price' => $request->enrolled_price,
            'status' => $request->status,
            'progress_percentage' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => DB::table('enrollments')->where('id', $enrollmentId)->first(),
            'message' => 'Student manually enrolled successfully.'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if (!$this->canModify($request->user())) {
            return response()->json(['success' => false, 'message' => 'Access denied. Admins only.'], 403);
        }

        $request->validate([
            'status' => 'required|in:active,completed,suspended',
            'progress_percentage' => 'nullable|integer|min:0|max:100'
        ]);

        DB::table('enrollments')->where('id', $id)->update([
            'status' => $request->status,
            'progress_percentage' => $request->progress_percentage ?? DB::raw('progress_percentage'),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Enrollment updated successfully.'
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->canModify($request->user())) {
            return response()->json(['success' => false, 'message' => 'Access denied. Admins only.'], 403);
        }

        $enrollment = DB::table('enrollments')->where('id', $id)->first();

        if (!$enrollment) {
            return response()->json(['success' => false, 'message' => 'Enrollment not found.'], 404);
        }

        // Action: Revoke access by permanently deleting the enrollment record.
        // (Note: The financial record of the sale remains safe in your 'orders' table from the UddoktaPay checkout).
        DB::table('enrollments')->where('id', $id)->delete();
        
        // Also wipe their video progress so if they buy it again, they start at 0%
        DB::table('lesson_progress')
            ->where('user_id', $enrollment->user_id)
            ->where('course_id', $enrollment->course_id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Student access revoked and progress cleared successfully.'
        ]);
    }
}