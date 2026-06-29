<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $events = Event::query()
            ->withCount('registrations')
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where(function ($subQuery) use ($validated) {
                    $subQuery->where('title', 'like', '%' . $validated['search'] . '%')
                        ->orWhere('slug', 'like', '%' . $validated['search'] . '%');
                });
            })
            ->latest('starts_at')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $events,
            'message' => 'Events retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedPayload($request);

        $event = Event::create([
            ...$validated,
            'slug' => $validated['slug'] ?? $this->uniqueSlug($validated['title']),
        ]);

        return response()->json([
            'success' => true,
            'data' => $event,
            'message' => 'Event created successfully.',
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $event = Event::withCount('registrations')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $event,
            'message' => 'Event retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        $validated = $this->validatedPayload($request, $event->id);

        $event->update([
            ...$validated,
            'slug' => $validated['slug'] ?? (
                $validated['title'] !== $event->title
                    ? $this->uniqueSlug($validated['title'], $event->id)
                    : $event->slug
            ),
        ]);

        return response()->json([
            'success' => true,
            'data' => $event->fresh()->loadCount('registrations'),
            'message' => 'Event updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        Event::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Event deleted successfully.',
            'errors' => null,
        ]);
    }

    public function registrations(int $id): JsonResponse
    {
        $event = Event::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $event->registrations()->latest()->paginate(50),
            'message' => 'Event registrations retrieved successfully.',
            'errors' => null,
        ]);
    }

    private function validatedPayload(Request $request, ?int $eventId = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('events', 'slug')->ignore($eventId),
            ],
            'event_type' => ['nullable', 'string', 'max:100'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'location' => ['nullable', 'string', 'max:255'],
            'seats' => ['nullable', 'integer', 'min:1'],
            'cover_url' => ['nullable', 'string', 'max:500'],
            'description' => ['required', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'is_published' => ['nullable', 'boolean'],
        ]);
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (
            Event::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
