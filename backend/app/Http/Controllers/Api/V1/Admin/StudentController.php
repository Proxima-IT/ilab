<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $courseIds = null;

        if ($user->role === 'instructor') {
            $courseIds = Course::query()
                ->where('instructor_id', $user->id)
                ->pluck('id')
                ->all();
        }

        $students = User::query()
            ->where('role', 'student')
            ->select([
                'id',
                'name',
                'email',
                'phone',
                'role',
                'avatar',
                'district',
                'education_level',
                'bio',
                'status',
                'email_verified_at',
                'phone_verified_at',
                'created_at',
                'updated_at',
            ])
            ->when($courseIds !== null, function ($query) use ($courseIds) {
                $query->whereHas('enrollments', function ($enrollmentQuery) use ($courseIds) {
                    $enrollmentQuery->whereIn('course_id', $courseIds);
                });
            })
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $search = '%' . $validated['search'] . '%';
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->where('name', 'like', $search)
                        ->orWhere('email', 'like', $search)
                        ->orWhere('phone', 'like', $search);
                });
            })
            ->withCount([
                'enrollments as enrolled_courses_count' => function ($query) use ($courseIds) {
                    if ($courseIds !== null) {
                        $query->whereIn('course_id', $courseIds);
                    }
                },
            ])
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $students,
            'message' => 'Student list retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeManageStudents($request);

        $validated = $request->validate($this->rules());

        $student = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'student',
            'district' => $validated['district'] ?? null,
            'education_level' => $validated['education_level'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'status' => $validated['status'] ?? true,
            'email_verified_at' => ! empty($validated['email']) ? now() : null,
            'phone_verified_at' => ! empty($validated['phone']) ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'student' => $this->studentResource($student->fresh()),
            ],
            'message' => 'Student account created and verified successfully.',
            'errors' => null,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $courseIds = null;

        if ($user->role === 'instructor') {
            $courseIds = Course::query()
                ->where('instructor_id', $user->id)
                ->pluck('id')
                ->all();
        }

        $student = User::query()
            ->where('role', 'student')
            ->with([
                'enrollments' => function ($query) use ($courseIds) {
                    if ($courseIds !== null) {
                        $query->whereIn('course_id', $courseIds);
                    }

                    $query->latest();
                },
                'enrollments.course:id,title,slug,thumbnail,price,discount_price,status,instructor_id',
                'enrollments.course.instructor:id,name,email,avatar',
                'progress.lesson:id,section_id,title',
                'progress.lesson.section:id,course_id,title',
            ])
            ->withCount([
                'enrollments as enrolled_courses_count' => function ($query) use ($courseIds) {
                    if ($courseIds !== null) {
                        $query->whereIn('course_id', $courseIds);
                    }
                },
                'certificates',
            ])
            ->findOrFail($id);

        if ($courseIds !== null && $student->enrollments->isEmpty()) {
            return $this->forbiddenResponse('Access denied. This student is not enrolled in your courses.');
        }

        $completedByCourse = $student->progress
            ->filter(fn ($progress) => (bool) $progress->is_completed)
            ->groupBy(fn ($progress) => optional(optional($progress->lesson)->section)->course_id)
            ->map(fn ($items) => $items->count());

        $courses = $student->enrollments
            ->filter(fn ($enrollment) => $enrollment->course)
            ->unique('course_id')
            ->map(function ($enrollment) use ($completedByCourse) {
                $course = $enrollment->course;

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'thumbnail' => $course->thumbnail,
                    'status' => $enrollment->status,
                    'enrolled_at' => $enrollment->enrolled_at ?? $enrollment->created_at,
                    'expires_at' => $enrollment->expires_at,
                    'completed_lessons' => (int) ($completedByCourse[$course->id] ?? 0),
                    'instructor' => $course->instructor,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'student' => [
                    ...$this->studentResource($student),
                    'role' => $student->role,
                    'provider' => $student->provider,
                    'certificates_count' => $student->certificates_count ?? 0,
                    'courses' => $courses,
                ],
            ],
            'message' => 'Student profile retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->authorizeManageStudents($request);

        $student = User::query()
            ->where('role', 'student')
            ->findOrFail($id);

        $validated = $request->validate($this->rules($student));

        $emailChanged = ($validated['email'] ?? null) !== $student->email;
        $phoneChanged = ($validated['phone'] ?? null) !== $student->phone;

        $student->fill([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'district' => $validated['district'] ?? null,
            'education_level' => $validated['education_level'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'status' => $validated['status'],
            'email_verified_at' => ! empty($validated['email'])
                ? ($emailChanged ? now() : $student->email_verified_at)
                : null,
            'phone_verified_at' => ! empty($validated['phone'])
                ? ($phoneChanged ? now() : $student->phone_verified_at)
                : null,
        ]);

        if (! empty($validated['password'])) {
            $student->password = Hash::make($validated['password']);
            $student->tokens()->delete();
        }

        $student->save();

        return response()->json([
            'success' => true,
            'data' => [
                'student' => $this->studentResource($student->fresh()),
            ],
            'message' => 'Student account updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->authorizeManageStudents($request);

        $student = User::query()
            ->where('role', 'student')
            ->findOrFail($id);

        $student->tokens()->delete();
        $student->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Student account removed successfully.',
            'errors' => null,
        ]);
    }

    private function rules(?User $student = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($student?->id),
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'phone')->ignore($student?->id),
            ],
            'password' => [$student ? 'nullable' : 'required', 'string', 'min:8'],
            'district' => ['nullable', 'string', 'max:120'],
            'education_level' => ['nullable', 'string', 'max:120'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'boolean'],
        ];
    }

    private function studentResource(User $student): array
    {
        return [
            'id' => $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'phone' => $student->phone,
            'avatar' => $student->avatar,
            'district' => $student->district,
            'education_level' => $student->education_level,
            'bio' => $student->bio,
            'status' => (bool) $student->status,
            'email_verified_at' => $student->email_verified_at,
            'phone_verified_at' => $student->phone_verified_at,
            'enrolled_courses_count' => $student->enrolled_courses_count ?? 0,
            'created_at' => $student->created_at,
            'updated_at' => $student->updated_at,
        ];
    }

    private function authorizeManageStudents(Request $request): void
    {
        abort_if(
            ! in_array($request->user()->role, ['super_admin', 'admin', 'manager'], true),
            403,
            'Student management access required.'
        );
    }
}
