<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->canViewDashboard($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot view dashboard.');
        }

        $user = $request->user();

        $validated = $request->validate([
            'period' => ['nullable', 'string', 'in:today,7,30,90,365,all'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $period = $validated['period'] ?? 'today';
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
                'enrollment_status_overview' => $this->enrollmentStatusOverview($courseScope, $period),
                'payment_overview' => $this->paymentOverview($courseScope, $period),
                'content_overview' => $this->contentOverview($courseScope),
                'today_overview' => $this->todayOverview($courseScope),
                'growth_overview' => $this->growthOverview($courseScope, $period),

                'recent_enrollments' => $this->recentEnrollments($courseScope, $period, $perPage),
                'top_courses' => $this->topCourses($courseScope, $period, $perPage),
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

            'suspended_enrollments' => (int) DB::table('enrollments')
                ->when($courseIds !== null, fn ($q) => $q->whereIn('course_id', $courseIds))
                ->where('status', 'suspended')
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
        $bucket = $this->dateBucketExpression($period, 'created_at');

        $query = DB::table('enrollments')
            ->select(
                DB::raw($bucket . ' as date'),
                DB::raw('SUM(enrolled_price) as revenue'),
                DB::raw('COUNT(id) as enrollments')
            )
            ->groupBy(DB::raw($bucket))
            ->orderBy('date');

        $this->applyCourseScope($query, $courseIds);
        $this->applyPeriod($query, $period, 'created_at');

        return $query->get()->map(fn ($row) => [
            'date' => $row->date,
            'revenue' => (float) $row->revenue,
            'enrollments' => (int) $row->enrollments,
        ])->toArray();
    }

    private function enrollmentStatusOverview(?array $courseIds, string $period): array
    {
        $query = DB::table('enrollments')
            ->select('status', DB::raw('COUNT(id) as total'))
            ->groupBy('status')
            ->orderBy('status');

        $this->applyCourseScope($query, $courseIds);
        $this->applyPeriod($query, $period, 'created_at');

        return $query->get()->map(fn ($row) => [
            'status' => $row->status,
            'total' => (int) $row->total,
        ])->toArray();
    }

    private function paymentOverview(?array $courseIds, string $period): array
    {
        if (! Schema::hasTable('payments')) {
            return [
                'total_amount' => 0,
                'completed_amount' => 0,
                'pending_amount' => 0,
                'refunded_amount' => 0,
                'failed_count' => 0,
                'by_status' => [],
                'by_method' => [],
            ];
        }

        $base = DB::table('payments');
        $this->applyCourseScope($base, $courseIds);
        $this->applyPeriod($base, $period, 'created_at');

        $byStatus = DB::table('payments')
            ->select('status', DB::raw('COUNT(id) as total'), DB::raw('SUM(amount) as amount'))
            ->when($courseIds !== null, fn ($q) => $q->whereIn('course_id', $courseIds))
            ->groupBy('status')
            ->orderBy('status');
        $this->applyPeriod($byStatus, $period, 'created_at');
        $byStatus = $byStatus->get();

        $byMethod = DB::table('payments')
            ->select('method', DB::raw('COUNT(id) as total'), DB::raw('SUM(amount) as amount'))
            ->when($courseIds !== null, fn ($q) => $q->whereIn('course_id', $courseIds))
            ->groupBy('method')
            ->orderByDesc('amount');
        $this->applyPeriod($byMethod, $period, 'created_at');
        $byMethod = $byMethod->get();

        return [
            'total_amount' => (float) (clone $base)->sum('amount'),
            'completed_amount' => (float) (clone $base)->where('status', 'completed')->sum('amount'),
            'pending_amount' => (float) (clone $base)->where('status', 'pending')->sum('amount'),
            'refunded_amount' => (float) (clone $base)->where('status', 'refunded')->sum('amount'),
            'failed_count' => (int) (clone $base)->where('status', 'failed')->count(),
            'by_status' => $byStatus->map(fn ($row) => [
                'status' => $row->status,
                'total' => (int) $row->total,
                'amount' => (float) $row->amount,
            ])->toArray(),
            'by_method' => $byMethod->map(fn ($row) => [
                'method' => $row->method,
                'total' => (int) $row->total,
                'amount' => (float) $row->amount,
            ])->toArray(),
        ];
    }

    private function contentOverview(?array $courseIds): array
    {
        return [
            'certificates' => Schema::hasTable('certificates')
                ? (int) DB::table('certificates')
                    ->when($courseIds !== null, fn ($q) => $q->whereIn('course_id', $courseIds))
                    ->count()
                : 0,
            'open_questions' => Schema::hasTable('lesson_questions')
                ? (int) DB::table('lesson_questions')
                    ->join('lessons', 'lesson_questions.lesson_id', '=', 'lessons.id')
                    ->join('sections', 'lessons.section_id', '=', 'sections.id')
                    ->when($courseIds !== null, fn ($q) => $q->whereIn('sections.course_id', $courseIds))
                    ->where('lesson_questions.status', 'open')
                    ->count()
                : 0,
            'answered_questions' => Schema::hasTable('lesson_questions')
                ? (int) DB::table('lesson_questions')
                    ->join('lessons', 'lesson_questions.lesson_id', '=', 'lessons.id')
                    ->join('sections', 'lessons.section_id', '=', 'sections.id')
                    ->when($courseIds !== null, fn ($q) => $q->whereIn('sections.course_id', $courseIds))
                    ->where('lesson_questions.status', 'answered')
                    ->count()
                : 0,
            'published_events' => Schema::hasTable('events')
                ? (int) DB::table('events')->where('is_published', true)->count()
                : 0,
            'finished_events' => Schema::hasTable('events')
                ? (int) DB::table('events')
                    ->where('is_published', true)
                    ->whereRaw('COALESCE(ends_at, starts_at) < NOW()')
                    ->count()
                : 0,
            'running_events' => Schema::hasTable('events')
                ? (int) DB::table('events')
                    ->where('is_published', true)
                    ->whereRaw('COALESCE(ends_at, starts_at) >= NOW()')
                    ->count()
                : 0,
            'published_blog_posts' => Schema::hasTable('blog_posts')
                ? (int) DB::table('blog_posts')->where('is_published', true)->count()
                : 0,
            'published_reviews' => Schema::hasTable('reviews')
                ? (int) DB::table('reviews')->where('is_published', true)->count()
                : 0,
            'newsletter_subscribers' => Schema::hasTable('newsletter_subscribers')
                ? (int) DB::table('newsletter_subscribers')->where('is_active', true)->count()
                : 0,
            'event_registrations' => Schema::hasTable('event_registrations')
                ? (int) DB::table('event_registrations')->count()
                : 0,
        ];
    }

    private function todayOverview(?array $courseIds): array
    {
        $enrollments = DB::table('enrollments');
        $this->applyCourseScope($enrollments, $courseIds);
        $this->applyPeriod($enrollments, 'today', 'created_at');

        return [
            'revenue' => (float) (clone $enrollments)->sum('enrolled_price'),
            'enrollments' => (int) (clone $enrollments)->count(),
            'students_registered' => (int) DB::table('users')
                ->where('role', 'student')
                ->whereDate('created_at', today())
                ->count(),
            'certificates' => Schema::hasTable('certificates')
                ? (int) DB::table('certificates')
                    ->when($courseIds !== null, fn ($q) => $q->whereIn('course_id', $courseIds))
                    ->whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])
                    ->count()
                : 0,
            'open_questions' => Schema::hasTable('lesson_questions')
                ? (int) DB::table('lesson_questions')
                    ->join('lessons', 'lesson_questions.lesson_id', '=', 'lessons.id')
                    ->join('sections', 'lessons.section_id', '=', 'sections.id')
                    ->when($courseIds !== null, fn ($q) => $q->whereIn('sections.course_id', $courseIds))
                    ->where('lesson_questions.status', 'open')
                    ->whereBetween('lesson_questions.created_at', [today()->startOfDay(), today()->endOfDay()])
                    ->count()
                : 0,
        ];
    }

    private function growthOverview(?array $courseIds, string $period): array
    {
        $bucket = $this->dateBucketExpression($period, 'created_at');

        $students = DB::table('users')
            ->select(DB::raw($bucket . ' as date'), DB::raw('COUNT(id) as students'))
            ->where('role', 'student')
            ->groupBy(DB::raw($bucket))
            ->orderBy('date');

        $this->applyPeriod($students, $period, 'created_at');

        $enrollments = DB::table('enrollments')
            ->select(DB::raw($bucket . ' as date'), DB::raw('COUNT(id) as enrollments'))
            ->groupBy(DB::raw($bucket))
            ->orderBy('date');

        $this->applyCourseScope($enrollments, $courseIds);
        $this->applyPeriod($enrollments, $period, 'created_at');

        return [
            'students' => $students->get()->map(fn ($row) => [
                'date' => $row->date,
                'students' => (int) $row->students,
            ])->toArray(),
            'enrollments' => $enrollments->get()->map(fn ($row) => [
                'date' => $row->date,
                'enrollments' => (int) $row->enrollments,
            ])->toArray(),
        ];
    }

    private function recentEnrollments(?array $courseIds, string $period, int $limit)
    {
        $query = DB::table('enrollments')
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
            ->limit($limit);

        $this->applyPeriod($query, $period, 'enrollments.created_at');

        return $query->get();
    }

    private function topCourses(?array $courseIds, string $period, int $limit)
    {
        $query = DB::table('enrollments')
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
            ->limit($limit);

        $this->applyPeriod($query, $period, 'enrollments.created_at');

        return $query->get();
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
        if ($period === 'today') {
            $query->whereBetween($column, [today()->startOfDay(), today()->endOfDay()]);
            return;
        }

        if ($period !== 'all') {
            $query->where($column, '>=', now()->subDays((int) $period)->startOfDay());
        }
    }

    private function dateBucketExpression(string $period, string $column): string
    {
        if (in_array($period, ['365', 'all'], true)) {
            return "DATE_FORMAT($column, '%Y-%m-01')";
        }

        return "DATE($column)";
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
