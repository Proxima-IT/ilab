<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Events', description: 'Public event listing, event details, and event registration endpoints')]
class EventController extends Controller
{
    #[OA\Get(
        path: '/api/v1/events',
        summary: 'List published events',
        description: 'Returns published events with registration counts and finished status.',
        tags: ['Events'],
        parameters: [
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                required: false,
                schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 24, example: 12)
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Events retrieved successfully')
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:24'],
        ]);

        $events = Event::query()
            ->withCount('registrations')
            ->where('is_published', true)
            ->orderByRaw('CASE WHEN COALESCE(ends_at, starts_at) >= NOW() THEN 0 ELSE 1 END')
            ->orderBy('starts_at')
            ->paginate($validated['per_page'] ?? 12);

        return response()->json([
            'success' => true,
            'data' => collect($events->items())->map(fn (Event $event) => $this->eventPayload($event))->values(),
            'message' => 'Events retrieved successfully.',
            'errors' => null,
            'meta' => [
                'pagination' => [
                    'current_page' => $events->currentPage(),
                    'per_page' => $events->perPage(),
                    'total' => $events->total(),
                    'last_page' => $events->lastPage(),
                ],
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/v1/events/{slug}',
        summary: 'Get event details',
        description: 'Returns a single published event by slug.',
        tags: ['Events'],
        parameters: [
            new OA\Parameter(
                name: 'slug',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', example: 'free-mobile-repairing-workshop')
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Event retrieved successfully'),
            new OA\Response(response: 404, description: 'Event not found')
        ]
    )]
    public function show(string $slug): JsonResponse
    {
        $event = Event::query()
            ->withCount('registrations')
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $this->eventPayload($event),
            'message' => 'Event retrieved successfully.',
            'errors' => null,
        ]);
    }

    #[OA\Post(
        path: '/api/v1/events/{slug}/registrations',
        summary: 'Register for an event',
        description: 'Creates an event registration. Finished events cannot receive registrations.',
        tags: ['Events'],
        parameters: [
            new OA\Parameter(
                name: 'slug',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', example: 'free-mobile-repairing-workshop')
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['full_name', 'email', 'phone', 'why_want_to_learn'],
                properties: [
                    new OA\Property(property: 'full_name', type: 'string', example: 'Md Hasan'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'hasan@example.com'),
                    new OA\Property(property: 'phone', type: 'string', example: '01700000000'),
                    new OA\Property(property: 'education', type: 'string', nullable: true, example: 'Diploma in Engineering'),
                    new OA\Property(property: 'profession', type: 'string', nullable: true, example: 'Student'),
                    new OA\Property(property: 'why_want_to_learn', type: 'string', example: 'I want to build a mobile repairing business.')
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Registration completed successfully'),
            new OA\Response(response: 400, description: 'Event registration is closed'),
            new OA\Response(response: 409, description: 'Already registered with this email'),
            new OA\Response(response: 422, description: 'Validation error')
        ]
    )]
    public function register(Request $request, string $slug): JsonResponse
    {
        $event = Event::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        if ($event->isFinished()) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'This event is finished. Registration is closed.',
                'errors' => null,
            ], 400);
        }

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^[0-9+\-\s()]+$/'],
            'education' => ['nullable', 'string', 'max:255'],
            'profession' => ['nullable', 'string', 'max:255'],
            'why_want_to_learn' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        try {
            $registration = $event->registrations()->create($validated);
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'You have already registered for this event with this email.',
                    'errors' => [
                        'email' => ['You have already registered for this event.'],
                    ],
                ], 409);
            }

            throw $exception;
        }

        return response()->json([
            'success' => true,
            'data' => $registration,
            'message' => 'Registration completed successfully.',
            'errors' => null,
        ], 201);
    }

    private function eventPayload(Event $event): array
    {
        return array_merge($event->toArray(), [
            'is_finished' => $event->isFinished(),
            'registrations_count' => $event->registrations_count ?? $event->registrations()->count(),
        ]);
    }
}
