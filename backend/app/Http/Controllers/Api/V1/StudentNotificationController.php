<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StudentNotification;
use App\Models\StudentNotificationSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Student Notifications', description: 'Student dashboard notifications and preferences')]
class StudentNotificationController extends Controller
{
    #[OA\Get(
        path: '/api/v1/student/notifications',
        summary: 'Get latest student notifications',
        security: [['sanctum' => []]],
        tags: ['Student Notifications'],
        responses: [
            new OA\Response(response: 200, description: 'Notifications retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated')
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $notifications = StudentNotification::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(15)
            ->get();

        $unreadCount = StudentNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ],
            'message' => 'Notifications retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = StudentNotification::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        if (! $notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json([
            'success' => true,
            'data' => $notification->fresh(),
            'message' => 'Notification marked as read.',
            'errors' => null,
        ]);
    }

    public function settings(Request $request): JsonResponse
    {
        $settings = StudentNotificationSetting::firstOrCreate([
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => $settings,
            'message' => 'Notification settings retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'new_lecture' => ['sometimes', 'boolean'],
            'special_offer' => ['sometimes', 'boolean'],
            'event' => ['sometimes', 'boolean'],
            'profile_update' => ['sometimes', 'boolean'],
            'course_completion' => ['sometimes', 'boolean'],
            'certificate_ready' => ['sometimes', 'boolean'],
            'admin_message' => ['sometimes', 'boolean'],
            'qna_answer' => ['sometimes', 'boolean'],
            'email' => ['sometimes', 'boolean'],
            'sms' => ['sometimes', 'boolean'],
            'push' => ['sometimes', 'boolean'],
        ]);

        $settings = StudentNotificationSetting::firstOrCreate([
            'user_id' => $request->user()->id,
        ]);
        $settings->update($validated);

        return response()->json([
            'success' => true,
            'data' => $settings->fresh(),
            'message' => 'Notification settings updated successfully.',
            'errors' => null,
        ]);
    }
}
