<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $this->canAccessAdminPanel($user->role)) {
            return $this->forbiddenResponse();
        }

        $user->load([
            'coursesAsInstructor' => function ($query) {
                $query->select(
                    'id',
                    'instructor_id',
                    'category_id',
                    'title',
                    'slug',
                    'thumbnail',
                    'price',
                    'discount_price',
                    'status',
                    'type',
                    'level',
                    'language',
                    'created_at'
                )
                    ->withCount('enrollments')
                    ->latest();
            },
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'profile' => $this->safeAdminProfile($user),
                'stats' => [
                    'total_courses' => $user->coursesAsInstructor->count(),
                    'total_students' => $user->coursesAsInstructor->sum('enrollments_count'),
                ],
                'courses' => $user->coursesAsInstructor,
            ],
            'message' => 'Workspace data retrieved.',
            'errors' => null,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $this->canAccessAdminPanel($user->role)) {
            return $this->forbiddenResponse();
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'profile' => $this->safeAdminProfile($user->fresh()),
            ],
            'message' => 'Admin profile updated.',
            'errors' => null,
        ]);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $this->canAccessAdminPanel($user->role)) {
            return $this->forbiddenResponse();
        }

        $validated = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $oldAvatar = $user->avatar;
        $path = $validated['avatar']->store('avatars', 'public');

        $user->forceFill([
            'avatar' => 'storage/' . $path,
        ])->save();

        if ($oldAvatar && str_starts_with($oldAvatar, 'storage/avatars/')) {
            Storage::disk('public')->delete(str_replace('storage/', '', $oldAvatar));
        }

        return response()->json([
            'success' => true,
            'data' => [
                'profile' => $this->safeAdminProfile($user->fresh()),
            ],
            'message' => 'Admin avatar updated.',
            'errors' => null,
        ]);
    }

    private function canAccessAdminPanel(string $role): bool
    {
        return in_array($role, [
            'super_admin',
            'admin',
            'manager',
            'instructor',
            'content_manager',
        ], true);
    }

    private function safeAdminProfile($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'bio' => $user->bio,
            'role' => $user->role,
            'status' => (bool) $user->status,
            'email_verified_at' => $user->email_verified_at,
            'phone_verified_at' => $user->phone_verified_at,
        ];
    }

    private function forbiddenResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => 'Unauthorized admin panel access.',
            'errors' => null,
        ], 403);
    }
}
