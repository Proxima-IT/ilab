<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentProgressController extends Controller
{
    public function courses(Request $request): JsonResponse
    {
        $courses = DB::table('courses')
            ->when($request->user()->role === 'instructor', function ($query) use ($request) {
                $query->where('instructor_id', $request->user()->id);
            })
            ->select('id', 'title', 'slug', 'status')
            ->orderBy('title')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $courses,
            'message' => 'Progress course options retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'status' => ['nullable', 'string', 'in:active,expired,suspended,completed'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $lessonTotals = DB::table('lessons')
            ->join('sections', 'lessons.section_id', '=', 'sections.id')
            ->select('sections.course_id', DB::raw('COUNT(lessons.id) as total_lessons'))
            ->groupBy('sections.course_id');

        $completedTotals = DB::table('lesson_progress')
            ->where('is_completed', true)
            ->select(
                'user_id',
                'course_id',
                DB::raw('COUNT(DISTINCT lesson_id) as completed_lessons'),
                DB::raw('MAX(completed_at) as last_completed_at'),
                DB::raw('MAX(last_watched_at) as last_watched_at')
            )
            ->groupBy('user_id', 'course_id');

        $query = DB::table('enrollments')
            ->join('users', 'enrollments.user_id', '=', 'users.id')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->leftJoinSub($lessonTotals, 'lesson_totals', function ($join) {
                $join->on('lesson_totals.course_id', '=', 'enrollments.course_id');
            })
            ->leftJoinSub($completedTotals, 'completed_totals', function ($join) {
                $join->on('completed_totals.user_id', '=', 'enrollments.user_id')
                    ->on('completed_totals.course_id', '=', 'enrollments.course_id');
            })
            ->select(
                'enrollments.id',
                'enrollments.user_id',
                'enrollments.course_id',
                'enrollments.status',
                'enrollments.progress_percentage',
                'enrollments.enrolled_at',
                'users.name as student_name',
                'users.email as student_email',
                'users.phone as student_phone',
                'courses.title as course_title',
                'courses.slug as course_slug',
                'courses.instructor_id',
                DB::raw('COALESCE(lesson_totals.total_lessons, 0) as total_lessons'),
                DB::raw('COALESCE(completed_totals.completed_lessons, 0) as completed_lessons'),
                DB::raw('completed_totals.last_completed_at as last_completed_at'),
                DB::raw('completed_totals.last_watched_at as last_watched_at'),
                DB::raw('CASE WHEN COALESCE(lesson_totals.total_lessons, 0) = 0 THEN COALESCE(enrollments.progress_percentage, 0) ELSE ROUND((COALESCE(completed_totals.completed_lessons, 0) / lesson_totals.total_lessons) * 100) END as calculated_progress')
            );

        if ($request->user()->role === 'instructor') {
            $query->where('courses.instructor_id', $request->user()->id);
        }

        $query
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $search = '%' . $validated['search'] . '%';
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->where('users.name', 'like', $search)
                        ->orWhere('users.email', 'like', $search)
                        ->orWhere('users.phone', 'like', $search)
                        ->orWhere('courses.title', 'like', $search);
                });
            })
            ->when(! empty($validated['course_id']), function ($query) use ($validated) {
                $query->where('enrollments.course_id', $validated['course_id']);
            })
            ->when(! empty($validated['status']), function ($query) use ($validated) {
                $query->where('enrollments.status', $validated['status']);
            });

        $progress = $query
            ->orderByDesc('enrollments.enrolled_at')
            ->paginate($validated['per_page'] ?? 50);

        return response()->json([
            'success' => true,
            'data' => $progress,
            'message' => 'Student progress retrieved successfully.',
            'errors' => null,
        ]);
    }
}
