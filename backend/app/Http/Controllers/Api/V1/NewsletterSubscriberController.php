<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsletterSubscriberController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
            'source' => ['nullable', 'string', 'max:80'],
        ]);

        $email = strtolower(trim($validated['email']));

        $existing = NewsletterSubscriber::query()
            ->where('email', $email)
            ->first();

        if ($existing?->is_active) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'This email is already subscribed.',
                'errors' => [
                    'email' => ['This email is already subscribed.'],
                ],
            ], 409);
        }

        $subscriber = NewsletterSubscriber::updateOrCreate(
            ['email' => $email],
            [
                'is_active' => true,
                'source' => $validated['source'] ?? 'footer',
                'ip_address' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 1000),
                'subscribed_at' => now(),
                'unsubscribed_at' => null,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $subscriber,
            'message' => 'Newsletter subscription successful.',
            'errors' => null,
        ], 201);
    }
}
