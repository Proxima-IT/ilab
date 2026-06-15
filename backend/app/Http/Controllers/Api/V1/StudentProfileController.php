<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
                $query->select('id', 'title', 'slug', 'thumbnail');
            },
            'progress'
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
        if ($request->user()->role !== 'student') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthorized.',
                'errors' => null,
            ], 403);
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
            'notification_prefs' => ['nullable', 'array'],
            'notification_prefs.email' => ['nullable', 'boolean'],
            'notification_prefs.sms' => ['nullable', 'boolean'],
            'notification_prefs.push' => ['nullable', 'boolean'],
        ]);

        if (array_key_exists('phone', $validated) && $validated['phone'] !== $user->phone) {
            $validated['phone_verified_at'] = null;

            // TODO: Send phone verification OTP here.
        }

        if (array_key_exists('email', $validated) && $validated['email'] !== $user->email) {
            $validated['email_verified_at'] = null;

            // TODO: Send email verification link here.
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user->fresh(),
                'profile_completed' => $this->isProfileCompleted($user->fresh()),
                'phone_verification_required' => is_null($user->fresh()->phone_verified_at),
            ],
            'message' => 'Profile updated successfully.',
            'errors' => null,
        ]);
    }

    private function isProfileCompleted($user): bool
    {
        return !empty($user->phone) && !is_null($user->phone_verified_at);
    }
}