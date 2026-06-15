<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // =========================================================
        // INSTRUCTOR DASHBOARD (Restricted View)
        // =========================================================
        if ($user->role === 'instructor') {
            $myCourseIds = DB::table('courses')->where('instructor_id', $user->id)->pluck('id');

            $metrics = [
                'total_revenue' => DB::table('enrollments')
                    ->whereIn('course_id', $myCourseIds)
                    ->sum('enrolled_price'),
                'total_students' => DB::table('enrollments')
                    ->whereIn('course_id', $myCourseIds)
                    ->distinct('user_id')
                    ->count('user_id'),
                'total_courses' => $myCourseIds->count(),
            ];

            $recentEnrollments = DB::table('enrollments')
                ->join('users', 'enrollments.user_id', '=', 'users.id')
                ->join('courses', 'enrollments.course_id', '=', 'courses.id')
                ->whereIn('enrollments.course_id', $myCourseIds)
                ->select('users.name as student_name', 'courses.title as course_title', 'enrollments.enrolled_price', 'enrollments.created_at')
                ->orderBy('enrollments.created_at', 'desc')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'role_view' => 'instructor',
                    'metrics' => $metrics,
                    'recent_enrollments' => $recentEnrollments,
                ],
                'message' => 'Instructor dashboard loaded.'
            ]);
        }

        // =========================================================
        // ADMIN / SUPER ADMIN / MANAGER DASHBOARD (Global View)
        // =========================================================
        
        $metrics = [
            'total_revenue' => DB::table('enrollments')->sum('enrolled_price'),
            'total_students' => DB::table('enrollments')->distinct('user_id')->count('user_id'),
            'total_courses' => DB::table('courses')->count(),
        ];

        $recentEnrollments = DB::table('enrollments')
            ->join('users', 'enrollments.user_id', '=', 'users.id')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->select('users.name as student_name', 'courses.title as course_title', 'enrollments.enrolled_price', 'enrollments.created_at')
            ->orderBy('enrollments.created_at', 'desc')
            ->limit(5)
            ->get();

        $topCourses = DB::table('enrollments')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->select('courses.title', DB::raw('COUNT(enrollments.id) as enrollment_count'), DB::raw('SUM(enrollments.enrolled_price) as generated_revenue'))
            ->groupBy('courses.id', 'courses.title')
            ->orderBy('enrollment_count', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'role_view' => 'admin',
                'metrics' => $metrics,
                'recent_enrollments' => $recentEnrollments,
                'top_courses' => $topCourses
            ],
            'message' => 'Global admin dashboard loaded.'
        ]);
    }
}