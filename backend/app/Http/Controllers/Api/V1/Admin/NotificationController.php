<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\StudentNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function searchStudents(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['required', 'string', 'min:2', 'max:120'],
        ]);

        $students = User::query()
            ->where('role', 'student')
            ->where(function ($query) use ($validated) {
                $search = '%' . $validated['search'] . '%';
                $query
                    ->where('name', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('phone', 'like', $search);
            })
            ->select('id', 'name', 'email', 'phone', 'avatar')
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $students,
            'message' => 'Students retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function courses(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
        ]);

        $courses = Course::query()
            ->when($request->user()->role === 'instructor', function ($query) use ($request) {
                $query->where('instructor_id', $request->user()->id);
            })
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where('title', 'like', '%' . $validated['search'] . '%');
            })
            ->select('id', 'title', 'slug', 'instructor_id')
            ->orderBy('title')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $courses,
            'message' => 'Courses retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function courseStudents(Request $request, int $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);

        if ($request->user()->role === 'instructor' && (int) $course->instructor_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You can only view students from your own courses.',
                'errors' => null,
            ], 403);
        }

        $students = User::query()
            ->join('enrollments', 'users.id', '=', 'enrollments.user_id')
            ->where('users.role', 'student')
            ->where('enrollments.course_id', $course->id)
            ->select('users.id', 'users.name', 'users.email', 'users.phone', 'users.avatar')
            ->distinct()
            ->orderBy('users.name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $students,
            'message' => 'Course students retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1', 'max:500'],
            'user_ids.*' => ['integer', Rule::exists('users', 'id')->where('role', 'student')],
            'type' => ['required', 'string', Rule::in(StudentNotification::TYPES)],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'action_url' => ['nullable', 'string', 'max:500'],
        ]);

        $userIds = collect($validated['user_ids'])->unique()->values();

        DB::transaction(function () use ($validated, $userIds, $request) {
            foreach ($userIds as $userId) {
                StudentNotification::createForStudent(
                    (int) $userId,
                    $validated['type'],
                    $validated['title'],
                    $validated['message'],
                    $validated['action_url'] ?? null,
                    [
                        'sent_by' => $request->user()->id,
                        'sent_by_name' => $request->user()->name,
                    ]
                );
            }
        });

        return response()->json([
            'success' => true,
            'data' => [
                'sent_count' => $userIds->count(),
            ],
            'message' => 'Notification sent successfully.',
            'errors' => null,
        ]);
    }
}
