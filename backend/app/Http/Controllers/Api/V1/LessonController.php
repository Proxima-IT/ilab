<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonAnswer;
use App\Models\LessonNote;
use App\Models\LessonProgress;
use App\Models\LessonQuestion;
use App\Models\StudentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Learning Experience', description: 'Endpoints for enrolled students to access course content')]
class LessonController extends Controller
{
    #[OA\Get(
        path: '/api/v1/learn/courses/{slug}/syllabus',
        summary: 'Get full course syllabus',
        description: 'Returns sections and lessons for enrolled students. Direct video URLs are not exposed.',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        parameters: [
            new OA\Parameter(name: 'slug', in: 'path', required: true, description: 'Course slug')
        ],
        responses: [
            new OA\Response(response: 200, description: 'Syllabus retrieved successfully'),
            new OA\Response(response: 403, description: 'Not enrolled in this course'),
            new OA\Response(response: 404, description: 'Course not found')
        ]
    )]
    public function getSyllabus(Request $request, string $slug): JsonResponse
    {
        $user = $request->user();

        $course = Course::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $isEnrolled = DB::table('enrollments')
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->exists();

        if (! $isEnrolled) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You must be enrolled to access this learning material.',
                'errors' => null,
            ], 403);
        }

        $course->load([
            'sections' => function ($query) {
                $query->select('id', 'course_id', 'title', 'order', 'unlock_at')
                    ->orderBy('order');
            },
            'sections.lessons' => function ($query) {
                $query->select(
                    'id',
                    'section_id',
                    'title',
                    'type',
                    'duration',
                    'is_free',
                    'order',
                    'live_start_time'
                )->orderBy('order');
            },
        ]);

        $lessonIds = $course->sections
            ->flatMap(fn ($section) => $section->lessons->pluck('id'))
            ->values();

        $completedLessonIds = DB::table('lesson_progress')
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->where('is_completed', true)
            ->pluck('lesson_id');

        return response()->json([
            'success' => true,
            'data' => [
                'course' => $course,
                'completed_lessons' => $completedLessonIds,
            ],
            'message' => 'Syllabus retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function player(Request $request, string $slug, int $lessonId): JsonResponse
    {
        $user = $request->user();
        $course = Course::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        if (! $this->activeEnrollment($user->id, $course->id)) {
            return $this->forbiddenResponse('You must be enrolled to access this lesson.');
        }

        $course->load([
            'instructor:id,name,avatar',
            'sections' => fn ($query) => $query->select('id', 'course_id', 'title', 'order', 'unlock_at')->orderBy('order'),
            'sections.lessons' => fn ($query) => $query
                ->select('id', 'section_id', 'title', 'type', 'video_url', 'duration', 'is_free', 'order', 'live_start_time')
                ->orderBy('order'),
        ]);

        $lesson = Lesson::query()
            ->with([
                'section:id,course_id,title',
                'resources' => fn ($query) => $query->where('is_active', true)->orderBy('order'),
            ])
            ->where('id', $lessonId)
            ->whereHas('section', fn ($query) => $query->where('course_id', $course->id))
            ->firstOrFail();

        $lessonIds = $course->sections
            ->flatMap(fn ($section) => $section->lessons->pluck('id'))
            ->values();

        $progressRows = LessonProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->get()
            ->keyBy('lesson_id');

        $currentProgress = LessonProgress::firstOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'course_id' => $course->id,
                'watch_seconds' => 0,
                'is_completed' => false,
                'last_watched_at' => now(),
            ]
        );

        if ((int) $currentProgress->course_id !== (int) $course->id) {
            $currentProgress->forceFill(['course_id' => $course->id])->save();
        }

        $notes = LessonNote::query()
            ->where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->orderBy('timestamp_seconds')
            ->latest('id')
            ->get();

        $questions = LessonQuestion::query()
            ->with([
                'user:id,name,avatar,email',
                'answers.user:id,name,avatar,email,role',
            ])
            ->where('lesson_id', $lesson->id)
            ->latest()
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'course' => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'description' => $course->description,
                    'instructor' => $course->instructor,
                    'sections' => $course->sections->map(function ($section) use ($progressRows) {
                        return [
                            'id' => $section->id,
                            'title' => $section->title,
                            'order' => $section->order,
                            'lessons' => $section->lessons->map(function ($lesson) use ($progressRows) {
                                $progress = $progressRows->get($lesson->id);

                                return [
                                    'id' => $lesson->id,
                                    'title' => $lesson->title,
                                    'type' => $lesson->type,
                                    'duration' => $lesson->duration,
                                    'order' => $lesson->order,
                                    'is_available' => $lesson->type !== 'video' || (bool) $this->youtubeVideoId($lesson->video_url),
                                    'is_completed' => (bool) ($progress?->is_completed),
                                    'watch_seconds' => (int) ($progress?->watch_seconds ?? 0),
                                ];
                            })->values(),
                        ];
                    })->values(),
                ],
                'lesson' => [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'type' => $lesson->type,
                    'duration' => $lesson->duration,
                    'content' => $lesson->content,
                    'video_embed_url' => $this->youtubeEmbedUrl($lesson->video_url),
                    'watch_seconds' => (int) $currentProgress->watch_seconds,
                    'is_completed' => (bool) $currentProgress->is_completed,
                    'resources' => $lesson->resources,
                    'notes' => $notes,
                    'questions' => $questions,
                ],
                'watermark' => [
                    'email' => $user->email,
                    'name' => $user->name,
                ],
            ],
            'message' => 'Lesson player retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function resources(Request $request): JsonResponse
    {
        $user = $request->user();
        $courseIds = DB::table('enrollments')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->pluck('course_id');

        $courses = Course::query()
            ->select('id', 'title', 'slug')
            ->whereIn('id', $courseIds)
            ->where('status', 'published')
            ->with([
                'sections' => function ($query) {
                    $query->select('id', 'course_id', 'title', 'order')
                        ->whereHas('lessons.resources', function ($resourceQuery) {
                            $resourceQuery->where('is_active', true);
                        })
                        ->orderBy('order');
                },
                'sections.lessons' => function ($query) {
                    $query->select('id', 'section_id', 'title', 'order')
                        ->whereHas('resources', function ($resourceQuery) {
                            $resourceQuery->where('is_active', true);
                        })
                        ->with([
                            'resources' => function ($resourceQuery) {
                                $resourceQuery->select('id', 'lesson_id', 'title', 'url', 'type', 'file_size', 'order')
                                    ->where('is_active', true)
                                    ->orderBy('order');
                            },
                        ])
                        ->orderBy('order');
                },
            ])
            ->orderBy('title')
            ->get()
            ->filter(fn ($course) => $course->sections->isNotEmpty())
            ->values();

        return response()->json([
            'success' => true,
            'data' => $courses,
            'message' => 'Resources retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function storeNote(Request $request, int $lessonId): JsonResponse
    {
        [$lesson, $courseId] = $this->authorizedLesson($request, $lessonId);

        $validated = $request->validate([
            'note' => ['required', 'string', 'max:5000'],
            'timestamp_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $note = LessonNote::create([
            'user_id' => $request->user()->id,
            'lesson_id' => $lesson->id,
            'note' => $validated['note'],
            'timestamp_seconds' => min((int) ($validated['timestamp_seconds'] ?? 0), (int) ($lesson->duration ?? 0)),
        ]);

        return $this->successResponse($note, 'Note saved successfully.');
    }

    public function deleteNote(Request $request, int $lessonId, int $noteId): JsonResponse
    {
        [$lesson] = $this->authorizedLesson($request, $lessonId);

        LessonNote::query()
            ->where('id', $noteId)
            ->where('lesson_id', $lesson->id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return $this->successResponse(null, 'Note deleted successfully.');
    }

    public function storeQuestion(Request $request, int $lessonId): JsonResponse
    {
        [$lesson] = $this->authorizedLesson($request, $lessonId);

        $validated = $request->validate([
            'question' => ['required', 'string', 'max:5000'],
        ]);

        $question = LessonQuestion::create([
            'user_id' => $request->user()->id,
            'lesson_id' => $lesson->id,
            'question' => $validated['question'],
            'status' => 'open',
        ])->load('user:id,name,avatar,email', 'answers.user:id,name,avatar,email,role');

        return $this->successResponse($question, 'Question submitted successfully.');
    }

    public function storeAnswer(Request $request, int $lessonId, int $questionId): JsonResponse
    {
        [$lesson] = $this->authorizedLesson($request, $lessonId);
        $user = $request->user();

        if (! in_array($user->role, ['instructor', 'admin', 'super_admin', 'content_manager'], true)) {
            return $this->forbiddenResponse('Only instructors or admins can answer lesson questions.');
        }

        $question = LessonQuestion::query()
            ->where('id', $questionId)
            ->where('lesson_id', $lesson->id)
            ->firstOrFail();

        $validated = $request->validate([
            'answer' => ['required', 'string', 'max:5000'],
        ]);

        $answer = LessonAnswer::create([
            'lesson_question_id' => $question->id,
            'user_id' => $user->id,
            'answer' => $validated['answer'],
            'is_instructor_answer' => in_array($user->role, ['instructor', 'admin', 'super_admin', 'content_manager'], true),
        ])->load('user:id,name,avatar,email,role');

        if ($answer->is_instructor_answer) {
            $question->update(['status' => 'answered']);

            $course = Course::find($lesson->section->course_id);

            StudentNotification::createForStudent(
                (int) $question->user_id,
                'qna_answer',
                'Your question was answered',
                'A staff member answered your question in ' . $lesson->title . '.',
                $course ? '/dashboard/player/' . $course->slug . '/' . $lesson->id : '/dashboard',
                [
                    'question_id' => $question->id,
                    'answer_id' => $answer->id,
                    'lesson_id' => $lesson->id,
                    'course_id' => $course?->id,
                ]
            );
        }

        return $this->successResponse($answer, 'Answer submitted successfully.');
    }

    private function authorizedLesson(Request $request, int $lessonId): array
    {
        $lesson = Lesson::with('section:id,course_id')->findOrFail($lessonId);
        $courseId = (int) $lesson->section->course_id;

        if (! $this->activeEnrollment($request->user()->id, $courseId)) {
            abort(response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You must be enrolled to access this lesson.',
                'errors' => null,
            ], 403));
        }

        return [$lesson, $courseId];
    }

    private function activeEnrollment(int $userId, int $courseId): bool
    {
        return DB::table('enrollments')
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }

    private function youtubeEmbedUrl(?string $videoUrl): ?string
    {
        $videoId = $this->youtubeVideoId($videoUrl);

        if (! $videoId) {
            return null;
        }

        return sprintf(
            'https://www.youtube-nocookie.com/embed/%s?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&controls=0&disablekb=1&fs=0',
            $videoId
        );
    }

    private function youtubeVideoId(?string $videoUrl): ?string
    {
        if (! $videoUrl) {
            return null;
        }

        $value = trim($videoUrl);

        if (preg_match('/^[A-Za-z0-9_-]{11}$/', $value)) {
            return $value;
        }

        if (preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/', $value, $matches)) {
            return $matches[1];
        }

        return null;
    }

    private function forbiddenResponse(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $message,
            'errors' => null,
        ], 403);
    }

    private function successResponse($data, string $message): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'errors' => null,
        ]);
    }
}
