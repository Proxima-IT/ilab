<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Support\AdminNotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    public function options(Request $request): JsonResponse
    {
        if (! $this->canView($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot view enrollment options.');
        }

        $courses = DB::table('courses')
            ->leftJoin('users as instructors', 'courses.instructor_id', '=', 'instructors.id')
            ->select(
                'courses.id',
                'courses.title',
                'courses.slug',
                'courses.thumbnail',
                'courses.price',
                'courses.discount_price',
                'courses.status',
                'courses.type',
                'instructors.name as instructor_name'
            )
            ->when($request->user()->role === 'instructor', function ($query) use ($request) {
                $query->where('courses.instructor_id', $request->user()->id);
            })
            ->orderBy('courses.title')
            ->get();

        $students = $this->canManuallyEnroll($request->user())
            ? DB::table('users')
                ->select('id', 'name', 'email', 'phone', 'avatar', 'status')
                ->where('role', 'student')
                ->whereNull('deleted_at')
                ->orderBy('name')
                ->limit(500)
                ->get()
            : collect();

        return response()->json([
            'success' => true,
            'data' => [
                'students' => $students,
                'courses' => $courses,
            ],
            'message' => 'Enrollment options retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        if (! $this->canView($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot view enrollments.');
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:active,completed,suspended,expired'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = DB::table('enrollments')
            ->join('users', 'enrollments.user_id', '=', 'users.id')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->select(
                'enrollments.id',
                'enrollments.user_id',
                'enrollments.course_id',
                'enrollments.status',
                'enrollments.enrolled_price',
                'enrollments.progress_percentage',
                'enrollments.enrolled_at',
                'enrollments.expires_at',
                'enrollments.created_at',
                'enrollments.updated_at',
                'users.name as student_name',
                'users.email as student_email',
                'users.phone as student_phone',
                'users.avatar as student_avatar',
                'courses.title as course_title',
                'courses.slug as course_slug',
                'courses.thumbnail as course_thumbnail',
                'courses.price as course_price',
                'courses.discount_price as course_discount_price',
                'courses.instructor_id'
            );

        if ($request->user()->role === 'instructor') {
            $query->where('courses.instructor_id', $request->user()->id);
        }

        $query
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where(function ($subQuery) use ($validated) {
                    $subQuery->where('users.name', 'like', '%' . $validated['search'] . '%')
                        ->orWhere('users.email', 'like', '%' . $validated['search'] . '%')
                        ->orWhere('users.phone', 'like', '%' . $validated['search'] . '%')
                        ->orWhere('courses.title', 'like', '%' . $validated['search'] . '%');
                });
            })
            ->when(! empty($validated['course_id']), function ($query) use ($validated) {
                $query->where('enrollments.course_id', $validated['course_id']);
            })
            ->when(! empty($validated['user_id']), function ($query) use ($validated) {
                $query->where('enrollments.user_id', $validated['user_id']);
            })
            ->when(! empty($validated['status']), function ($query) use ($validated) {
                $query->where('enrollments.status', $validated['status']);
            });

        $enrollments = $query
            ->orderByDesc('enrollments.created_at')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $enrollments,
            'message' => 'Enrollment ledger retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->canManuallyEnroll($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can manually enroll students.');
        }

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'enrolled_price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'in:active,completed,suspended'],
            'enrolled_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:today'],
        ]);

        $student = DB::table('users')
            ->where('id', $validated['user_id'])
            ->where('role', 'student')
            ->whereNull('deleted_at')
            ->first();

        if (! $student) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Only student accounts can be enrolled in courses.',
                'errors' => null,
            ], 422);
        }

        $exists = DB::table('enrollments')
            ->where('user_id', $validated['user_id'])
            ->where('course_id', $validated['course_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Student is already enrolled in this course.',
                'errors' => null,
            ], 400);
        }

        $enrollmentId = DB::table('enrollments')->insertGetId([
            'user_id' => $validated['user_id'],
            'course_id' => $validated['course_id'],
            'enrolled_price' => $validated['enrolled_price'],
            'status' => $validated['status'],
            'progress_percentage' => 0,
            'enrolled_at' => $validated['enrolled_at'] ?? now(),
            'expires_at' => $validated['expires_at'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $enrollment = DB::table('enrollments')->where('id', $enrollmentId)->first();

        AdminNotificationDispatcher::newEnrollment(
            (int) $validated['user_id'],
            (int) $validated['course_id'],
            $validated['enrolled_price']
        );

        return response()->json([
            'success' => true,
            'data' => $enrollment,
            'message' => 'Student manually enrolled successfully.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (! $this->canModifyEnrollment($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can update enrollments.');
        }

        $enrollment = DB::table('enrollments')->where('id', $id)->first();

        if (! $enrollment) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Enrollment not found.',
                'errors' => null,
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['active', 'completed', 'suspended', 'expired'])],
            'progress_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'enrolled_price' => ['nullable', 'numeric', 'min:0'],
            'enrolled_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
        ]);

        DB::table('enrollments')
            ->where('id', $id)
            ->update([
                'status' => $validated['status'],
                'progress_percentage' => $validated['progress_percentage'] ?? $enrollment->progress_percentage,
                'enrolled_price' => $validated['enrolled_price'] ?? $enrollment->enrolled_price,
                'enrolled_at' => array_key_exists('enrolled_at', $validated)
                    ? $validated['enrolled_at']
                    : $enrollment->enrolled_at,
                'expires_at' => array_key_exists('expires_at', $validated)
                    ? $validated['expires_at']
                    : $enrollment->expires_at,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'data' => DB::table('enrollments')->where('id', $id)->first(),
            'message' => 'Enrollment updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (! $this->canDeleteEnrollment($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can revoke enrollments.');
        }

        $enrollment = DB::table('enrollments')->where('id', $id)->first();

        if (! $enrollment) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Enrollment not found.',
                'errors' => null,
            ], 404);
        }

        DB::transaction(function () use ($enrollment, $id) {
            DB::table('lesson_progress')
                ->where('user_id', $enrollment->user_id)
                ->whereIn('lesson_id', function ($query) use ($enrollment) {
                    $query->select('lessons.id')
                        ->from('lessons')
                        ->join('sections', 'lessons.section_id', '=', 'sections.id')
                        ->where('sections.course_id', $enrollment->course_id);
                })
                ->delete();

            DB::table('enrollments')
                ->where('id', $id)
                ->delete();
        });

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Student access revoked and course progress cleared successfully.',
            'errors' => null,
        ]);
    }

    private function canView($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor'], true);
    }

    private function canManuallyEnroll($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin'], true);
    }

    private function canModifyEnrollment($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin'], true);
    }

    private function canDeleteEnrollment($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin'], true);
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
