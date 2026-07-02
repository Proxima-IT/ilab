<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\LessonAnswer;
use App\Models\LessonQuestion;
use App\Models\StudentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QnaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'in:open,answered,closed'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $questions = LessonQuestion::query()
            ->with([
                'user:id,name,email,phone,avatar',
                'lesson:id,section_id,title',
                'lesson.section:id,course_id,title',
                'lesson.section.course:id,title,slug,instructor_id',
                'answers.user:id,name,email,avatar,role',
            ])
            ->withCount('answers')
            ->when($request->user()->role === 'instructor', function ($query) use ($request) {
                $query->whereHas('lesson.section.course', function ($courseQuery) use ($request) {
                    $courseQuery->where('instructor_id', $request->user()->id);
                });
            })
            ->when(! empty($validated['status']), function ($query) use ($validated) {
                $query->where('status', $validated['status']);
            })
            ->when(! empty($validated['lesson_id']), function ($query) use ($validated) {
                $query->where('lesson_id', $validated['lesson_id']);
            })
            ->when(! empty($validated['user_id']), function ($query) use ($validated) {
                $query->where('user_id', $validated['user_id']);
            })
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $search = '%' . $validated['search'] . '%';
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->where('question', 'like', $search)
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery
                                ->where('name', 'like', $search)
                                ->orWhere('email', 'like', $search)
                                ->orWhere('phone', 'like', $search);
                        })
                        ->orWhereHas('lesson', function ($lessonQuery) use ($search) {
                            $lessonQuery->where('title', 'like', $search);
                        })
                        ->orWhereHas('lesson.section.course', function ($courseQuery) use ($search) {
                            $courseQuery->where('title', 'like', $search);
                        });
                });
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $questions,
            'message' => 'Q&A questions retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function answer(Request $request, int $questionId): JsonResponse
    {
        $question = LessonQuestion::query()
            ->with('lesson.section.course:id,instructor_id')
            ->findOrFail($questionId);

        if (
            $request->user()->role === 'instructor'
            && (int) $question->lesson->section->course->instructor_id !== (int) $request->user()->id
        ) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You can only answer questions for your own courses.',
                'errors' => null,
            ], 403);
        }

        $validated = $request->validate([
            'answer' => ['required', 'string', 'max:5000'],
        ]);

        $answer = LessonAnswer::create([
            'lesson_question_id' => $question->id,
            'user_id' => $request->user()->id,
            'answer' => $validated['answer'],
            'is_instructor_answer' => true,
        ])->load('user:id,name,email,avatar,role');

        $question->update(['status' => 'answered']);

        $freshQuestion = $question->fresh()->load([
            'lesson:id,section_id,title',
            'lesson.section:id,course_id,title',
            'lesson.section.course:id,title,slug,instructor_id',
        ]);

        StudentNotification::createForStudent(
            (int) $question->user_id,
            'qna_answer',
            'Your question was answered',
            'A staff member answered your question in ' . ($freshQuestion->lesson?->title ?? 'your lesson') . '.',
            $freshQuestion->lesson?->section?->course?->slug
                ? '/dashboard/player/' . $freshQuestion->lesson->section->course->slug . '/' . $freshQuestion->lesson->id
                : '/dashboard',
            [
                'question_id' => $question->id,
                'answer_id' => $answer->id,
                'lesson_id' => $freshQuestion->lesson?->id,
                'course_id' => $freshQuestion->lesson?->section?->course?->id,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'answer' => $answer,
                'question' => $question->fresh()->load([
                    'user:id,name,email,phone,avatar',
                    'lesson:id,section_id,title',
                    'lesson.section:id,course_id,title',
                    'lesson.section.course:id,title,slug,instructor_id',
                    'answers.user:id,name,email,avatar,role',
                ]),
            ],
            'message' => 'Answer submitted successfully.',
            'errors' => null,
        ], 201);
    }

    public function close(Request $request, int $questionId): JsonResponse
    {
        $question = LessonQuestion::query()
            ->with('lesson.section.course:id,instructor_id')
            ->findOrFail($questionId);

        if (
            $request->user()->role === 'instructor'
            && (int) $question->lesson->section->course->instructor_id !== (int) $request->user()->id
        ) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You can only close questions for your own courses.',
                'errors' => null,
            ], 403);
        }

        $question->update(['status' => 'closed']);

        return response()->json([
            'success' => true,
            'data' => $question->fresh(),
            'message' => 'Question closed successfully.',
            'errors' => null,
        ]);
    }
}
