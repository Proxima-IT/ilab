<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StudentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Student Profile', description: 'Endpoints for student dashboard and profile management')]
class StudentProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'student') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthorized profile access.',
                'errors' => null,
            ], 403);
        }

        $user = $request->user()->load([
            'enrollments.course' => function ($query) {
                $query->with([
                    'instructor:id,name,avatar',
                    'category:id,name,slug',
                    'sections.lessons' => function ($lessonQuery) {
                        $lessonQuery->select('id', 'section_id', 'title', 'duration', 'order')->orderBy('order');
                    },
                ]);
            },
            'progress.lesson.section:id,course_id',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'profile_completed' => $this->isProfileCompleted($user),
                'phone_verification_required' => is_null($user->phone_verified_at),
            ],
            'message' => 'Student profile retrieved successfully.',
            'errors' => null,
        ]);
    }


    public function update(Request $request): JsonResponse
    {
        $unauthorized = $this->authorizeStudent($request);

        if ($unauthorized) {
            return $unauthorized;
        }

        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'phone')->ignore($user->id),
            ],
            'email' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                'regex:/^[^\r\n]+$/',
                'email:rfc,dns',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'bio' => ['nullable', 'string', 'max:1000'],
            'district' => ['nullable', 'string', 'max:100'],
            'education_level' => ['nullable', 'string', 'max:100'],
        ]);

        if (array_key_exists('phone', $validated) && $validated['phone'] !== $user->phone) {
            $validated['phone_verified_at'] = null;

            // TODO: Send phone verification OTP here.
        }

        if (array_key_exists('email', $validated) && $validated['email'] !== $user->email) {
            $validated['email_verified_at'] = null;

            // TODO: Send email verification link here.
        }

        $user->fill($validated)->save();

        StudentNotification::createForStudent(
            $user->id,
            'profile_update',
            'Profile updated',
            'Your profile information was updated successfully.',
            '/dashboard/profile'
        );

        return $this->profileResponse($user->fresh(), 'Profile updated successfully.');
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $unauthorized = $this->authorizeStudent($request);

        if ($unauthorized) {
            return $unauthorized;
        }

        $validated = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();
        $oldAvatar = $user->avatar;
        $path = $validated['avatar']->store('avatars', 'public');

        $user->forceFill([
            'avatar' => 'storage/' . $path,
        ])->save();

        StudentNotification::createForStudent(
            $user->id,
            'profile_update',
            'Avatar updated',
            'Your profile avatar was updated successfully.',
            '/dashboard/profile'
        );

        if ($oldAvatar && str_starts_with($oldAvatar, 'storage/avatars/')) {
            Storage::disk('public')->delete(str_replace('storage/', '', $oldAvatar));
        }

        return $this->profileResponse($user->fresh(), 'Avatar updated successfully.');
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $unauthorized = $this->authorizeStudent($request);

        if ($unauthorized) {
            return $unauthorized;
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! $user->password || ! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Current password is incorrect.',
                'errors' => [
                    'current_password' => ['Current password is incorrect.'],
                ],
            ], 422);
        }

        $user->forceFill([
            'password' => $validated['password'],
        ])->save();

        StudentNotification::createForStudent(
            $user->id,
            'profile_update',
            'Password updated',
            'Your account password was changed successfully.',
            '/dashboard/profile'
        );

        return $this->profileResponse($user->fresh(), 'Password updated successfully.');
    }

    public function updateNotifications(Request $request): JsonResponse
    {
        $unauthorized = $this->authorizeStudent($request);

        if ($unauthorized) {
            return $unauthorized;
        }

        $validated = $request->validate([
            'notification_prefs' => ['required', 'array'],
            'notification_prefs.email' => ['nullable', 'boolean'],
            'notification_prefs.sms' => ['nullable', 'boolean'],
            'notification_prefs.push' => ['nullable', 'boolean'],
            'notification_prefs.lecture' => ['nullable', 'boolean'],
            'notification_prefs.streak' => ['nullable', 'boolean'],
            'notification_prefs.congrats' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $existingPrefs = is_array($user->notification_prefs)
            ? $user->notification_prefs
            : [];

        $user->forceFill([
            'notification_prefs' => array_merge(
                $existingPrefs,
                $validated['notification_prefs']
            ),
        ])->save();

        return $this->profileResponse($user->fresh(), 'Notification settings updated successfully.');
    }

    private function authorizeStudent(Request $request): ?JsonResponse
    {
        if ($request->user()?->role === 'student') {
            return null;
        }

        return response()->json([
            'success' => false,
            'data' => null,
            'message' => 'Unauthorized profile access.',
            'errors' => null,
        ], 403);
    }

    private function profileResponse($user, string $message): JsonResponse
    {
        $user->loadMissing([
            'enrollments.course' => function ($query) {
                $query->with([
                    'instructor:id,name,avatar',
                    'category:id,name,slug',
                    'sections.lessons' => function ($lessonQuery) {
                        $lessonQuery->select('id', 'section_id', 'title', 'duration', 'order')->orderBy('order');
                    },
                ]);
            },
            'progress.lesson.section:id,course_id',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'profile_completed' => $this->isProfileCompleted($user),
                'phone_verification_required' => is_null($user->phone_verified_at),
            ],
            'message' => $message,
            'errors' => null,
        ]);
    }

    private function isProfileCompleted($user): bool
    {
        return $user->hasCompletedStudentProfile();
    }
}
