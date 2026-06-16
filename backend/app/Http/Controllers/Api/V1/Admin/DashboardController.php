<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->canViewDashboard($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot view dashboard.');
        }

        $user = $request->user();

        $validated = $request->validate([
            'period' => ['nullable', 'string', 'in:7,30,90,365,all'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $period = $validated['period'] ?? '30';
        $perPage = $validated['per_page'] ?? 5;

        $courseScope = $this->courseScope($user);

        return response()->json([
            'success' => true,
            'data' => [
                'role_view' => $user->role === 'instructor' ? 'instructor' : 'admin',
                'period' => $period,

                'metrics' => $this->metrics($courseScope, $period),

                'course_overview' => $this->courseOverview($courseScope),
                'student_overview' => $this->studentOverview($courseScope, $period),
                'revenue_overview' => $this->revenueOverview($courseScope, $period),

                'recent_enrollments' => $this->recentEnrollments($courseScope, $perPage),
                'top_courses' => $this->topCourses($courseScope, $perPage),
                'low_progress_students' => $this->lowProgressStudents($courseScope, $perPage),
            ],
            'message' => 'Dashboard loaded successfully.',
            'errors' => null,
        ]);
    }

    private function metrics(?array $courseIds, string $period): array
    {
        $enrollments = DB::table('enrollments');
        $courses = DB::table('courses');
        $students = DB::table('users')->where('role', 'student');

        $this->applyCourseScope($enrollments, $courseIds);
        $this->applyCourseScope($courses, $courseIds, 'id');

        $this->applyPeriod($enrollments, $period, 'created_at');

        return [
            'total_revenue' => (float) $enrollments->sum('enrolled_price'),

            'total_students' => (int) DB::table('enrollments')
                ->when($courseIds !== null, fn ($q) => $q->whereIn('course_id', $courseIds))
                ->distinct('user_id')
                ->count('user_id'),

            'total_courses' => (int) $courses->count(),

            'total_registered_students' => (int) $students->count(),

            'active_enrollments' => (int) DB::table('enrollments')
                ->when($courseIds !== null, fn ($q) => $q->whereIn('course_id', $courseIds))
                ->where('status', 'active')
                ->count(),

            'completed_enrollments' => (int) DB::table('enrollments')
                ->when($courseIds !== null, fn ($q) => $q->whereIn('course_id', $courseIds))
                ->where('status', 'completed')
                ->count(),
        ];
    }

    private function courseOverview(?array $courseIds): array
    {
        return [
            'published' => (int) DB::table('courses')
                ->when($courseIds !== null, fn ($q) => $q->whereIn('id', $courseIds))
                ->where('status', 'published')
                ->count(),

            'draft' => (int) DB::table('courses')
                ->when($courseIds !== null, fn ($q) => $q->whereIn('id', $courseIds))
                ->where('status', 'draft')
                ->count(),

            'archived' => (int) DB::table('courses')
                ->when($courseIds !== null, fn ($q) => $q->whereIn('id', $courseIds))
                ->where('status', 'archived')
                ->count(),

            'free' => (int) DB::table('courses')
                ->when($courseIds !== null, fn ($q) => $q->whereIn('id', $courseIds))
                ->where('type', 'free')
                ->count(),

            'paid' => (int) DB::table('courses')
                ->when($courseIds !== null, fn ($q) => $q->whereIn('id', $courseIds))
                ->where('type', '!=', 'free')
                ->count(),
        ];
    }

    private function studentOverview(?array $courseIds, string $period): array
    {
        $newEnrollments = DB::table('enrollments');
        $this->applyCourseScope($newEnrollments, $courseIds);
        $this->applyPeriod($newEnrollments, $period, 'created_at');

        return [
            'new_enrollments' => (int) $newEnrollments->count(),

            'average_progress' => round((float) DB::table('enrollments')
                ->when($courseIds !== null, fn ($q) => $q->whereIn('course_id', $courseIds))
                ->avg('progress_percentage'), 2),
        ];
    }

    private function revenueOverview(?array $courseIds, string $period): array
    {
        $query = DB::table('enrollments')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(enrolled_price) as revenue'),
                DB::raw('COUNT(id) as enrollments')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date');

        $this->applyCourseScope($query, $courseIds);
        $this->applyPeriod($query, $period, 'created_at');

        return $query->get()->map(fn ($row) => [
            'date' => $row->date,
            'revenue' => (float) $row->revenue,
            'enrollments' => (int) $row->enrollments,
        ])->toArray();
    }

    private function recentEnrollments(?array $courseIds, int $limit)
    {
        return DB::table('enrollments')
            ->join('users', 'enrollments.user_id', '=', 'users.id')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->when($courseIds !== null, fn ($q) => $q->whereIn('enrollments.course_id', $courseIds))
            ->select(
                'enrollments.id',
                'users.name as student_name',
                'users.email as student_email',
                'users.phone as student_phone',
                'courses.title as course_title',
                'enrollments.enrolled_price',
                'enrollments.status',
                'enrollments.progress_percentage',
                'enrollments.created_at'
            )
            ->orderByDesc('enrollments.created_at')
            ->limit($limit)
            ->get();
    }

    private function topCourses(?array $courseIds, int $limit)
    {
        return DB::table('enrollments')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->when($courseIds !== null, fn ($q) => $q->whereIn('enrollments.course_id', $courseIds))
            ->select(
                'courses.id',
                'courses.title',
                'courses.slug',
                DB::raw('COUNT(enrollments.id) as enrollment_count'),
                DB::raw('SUM(enrollments.enrolled_price) as generated_revenue'),
                DB::raw('AVG(enrollments.progress_percentage) as average_progress')
            )
            ->groupBy('courses.id', 'courses.title', 'courses.slug')
            ->orderByDesc('enrollment_count')
            ->limit($limit)
            ->get();
    }

    private function lowProgressStudents(?array $courseIds, int $limit)
    {
        return DB::table('enrollments')
            ->join('users', 'enrollments.user_id', '=', 'users.id')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->when($courseIds !== null, fn ($q) => $q->whereIn('enrollments.course_id', $courseIds))
            ->where('enrollments.status', 'active')
            ->where('enrollments.progress_percentage', '<=', 20)
            ->select(
                'users.name as student_name',
                'users.email as student_email',
                'courses.title as course_title',
                'enrollments.progress_percentage',
                'enrollments.created_at'
            )
            ->orderBy('enrollments.progress_percentage')
            ->limit($limit)
            ->get();
    }

    private function courseScope($user): ?array
    {
        if ($user->role !== 'instructor') {
            return null;
        }

        return DB::table('courses')
            ->where('instructor_id', $user->id)
            ->pluck('id')
            ->toArray();
    }

    private function applyCourseScope($query, ?array $courseIds, string $column = 'course_id'): void
    {
        if ($courseIds !== null) {
            $query->whereIn($column, $courseIds);
        }
    }

    private function applyPeriod($query, string $period, string $column): void
    {
        if ($period !== 'all') {
            $query->where($column, '>=', now()->subDays((int) $period));
        }
    }

    private function canViewDashboard($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor'], true);
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