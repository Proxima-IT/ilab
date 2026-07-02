<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsletterSubscriberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $subscribers = NewsletterSubscriber::query()
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where('email', 'like', '%' . $validated['search'] . '%');
            })
            ->when(! empty($validated['status']), function ($query) use ($validated) {
                $query->where('is_active', $validated['status'] === 'active');
            })
            ->latest('subscribed_at')
            ->latest('id')
            ->paginate($validated['per_page'] ?? 50);

        return response()->json([
            'success' => true,
            'data' => $subscribers,
            'message' => 'Newsletter subscribers retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $subscriber = NewsletterSubscriber::findOrFail($id);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $subscriber->update([
            'is_active' => $validated['is_active'],
            'unsubscribed_at' => $validated['is_active'] ? null : now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $subscriber->fresh(),
            'message' => 'Newsletter subscriber updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        NewsletterSubscriber::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Newsletter subscriber deleted successfully.',
            'errors' => null,
        ]);
    }
}
