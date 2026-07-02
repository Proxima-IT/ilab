<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LessonQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentQnaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'student') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthorized Q&A access.',
                'errors' => null,
            ], 403);
        }

        $questions = LessonQuestion::query()
            ->with([
                'answers.user:id,name,avatar,email,role',
                'lesson:id,section_id,title,type',
                'lesson.section:id,course_id,title',
                'lesson.section.course:id,title,slug',
            ])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'questions' => $questions,
            ],
            'message' => 'Student Q&A retrieved successfully.',
            'errors' => null,
        ]);
    }
}
