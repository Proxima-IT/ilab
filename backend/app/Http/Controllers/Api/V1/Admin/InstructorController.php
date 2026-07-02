<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class InstructorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $instructors = User::query()
            ->where('role', 'instructor')
            ->when($user->role === 'instructor', function ($query) use ($user) {
                $query->where('id', $user->id);
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
            ->select([
                'id',
                'name',
                'email',
                'phone',
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
            ->withCount('coursesAsInstructor')
            ->latest()
            ->paginate(20);

        $instructors->getCollection()->transform(function (User $instructor) {
            return array_merge(
                $this->instructorResource($instructor),
                [
                    'courses_count' => (int) ($instructor->courses_as_instructor_count ?? 0),
                    'students_count' => $this->uniqueStudentCount($instructor->id),
                ]
            );
        });

        return response()->json([
            'success' => true,
            'data' => $instructors,
            'message' => 'Instructor list retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeManageInstructors($request);

        $validated = $request->validate($this->rules());

        $instructor = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'instructor',
            'avatar' => $validated['avatar'] ?? null,
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
                'instructor' => $this->instructorResource($instructor->fresh()),
            ],
            'message' => 'Instructor account created successfully.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->authorizeManageInstructors($request);

        $instructor = User::query()
            ->where('role', 'instructor')
            ->findOrFail($id);

        $validated = $request->validate($this->rules($instructor));

        $emailChanged = ($validated['email'] ?? null) !== $instructor->email;
        $phoneChanged = ($validated['phone'] ?? null) !== $instructor->phone;

        $instructor->fill([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'avatar' => $validated['avatar'] ?? null,
            'district' => $validated['district'] ?? null,
            'education_level' => $validated['education_level'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'status' => $validated['status'],
            'email_verified_at' => ! empty($validated['email'])
                ? ($emailChanged ? now() : $instructor->email_verified_at)
                : null,
            'phone_verified_at' => ! empty($validated['phone'])
                ? ($phoneChanged ? now() : $instructor->phone_verified_at)
                : null,
        ]);

        if (! empty($validated['password'])) {
            $instructor->password = Hash::make($validated['password']);
            $instructor->tokens()->delete();
        }

        $instructor->save();

        return response()->json([
            'success' => true,
            'data' => [
                'instructor' => $this->instructorResource($instructor->fresh()),
            ],
            'message' => 'Instructor account updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->authorizeManageInstructors($request);

        $instructor = User::query()
            ->where('role', 'instructor')
            ->withCount('coursesAsInstructor')
            ->findOrFail($id);

        if ($instructor->courses_as_instructor_count > 0) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Cannot delete an instructor who has courses. Reassign the courses first.',
                'errors' => null,
            ], 400);
        }

        $this->deleteAvatar($instructor->avatar);
        $instructor->tokens()->delete();
        $instructor->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Instructor account removed successfully.',
            'errors' => null,
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $this->authorizeManageInstructors($request);

        $validated = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $path = $validated['avatar']->store('avatars/instructors', 'public');

        return response()->json([
            'success' => true,
            'data' => [
                'avatar' => 'storage/' . $path,
            ],
            'message' => 'Instructor avatar uploaded successfully.',
            'errors' => null,
        ], 201);
    }

    private function rules(?User $instructor = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($instructor?->id),
            ],
            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'phone')->ignore($instructor?->id),
            ],
            'password' => [$instructor ? 'nullable' : 'required', 'string', 'min:8'],
            'avatar' => ['nullable', 'string', 'max:500'],
            'district' => ['nullable', 'string', 'max:120'],
            'education_level' => ['nullable', 'string', 'max:120'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'boolean'],
        ];
    }

    private function instructorResource(User $instructor): array
    {
        return [
            'id' => $instructor->id,
            'name' => $instructor->name,
            'email' => $instructor->email,
            'phone' => $instructor->phone,
            'avatar' => $instructor->avatar,
            'district' => $instructor->district,
            'education_level' => $instructor->education_level,
            'bio' => $instructor->bio,
            'status' => (bool) $instructor->status,
            'email_verified_at' => $instructor->email_verified_at,
            'phone_verified_at' => $instructor->phone_verified_at,
            'created_at' => $instructor->created_at,
            'updated_at' => $instructor->updated_at,
        ];
    }

    private function uniqueStudentCount(int $instructorId): int
    {
        return DB::table('enrollments')
            ->join('courses', 'courses.id', '=', 'enrollments.course_id')
            ->where('courses.instructor_id', $instructorId)
            ->distinct('enrollments.user_id')
            ->count('enrollments.user_id');
    }

    private function deleteAvatar(?string $avatar): void
    {
        if ($avatar && str_starts_with($avatar, 'storage/avatars/instructors/')) {
            Storage::disk('public')->delete(str_replace('storage/', '', $avatar));
        }
    }

    private function authorizeManageInstructors(Request $request): void
    {
        abort_if(
            ! in_array($request->user()->role, ['super_admin', 'admin', 'manager'], true),
            403,
            'Instructor management access required.'
        );
    }
}
