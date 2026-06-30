<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\StudentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Student Certificates', description: 'Student certificate issuing and listing endpoints')]
class CertificateController extends Controller
{
    private const ELIGIBLE_PROGRESS = 90;

    #[OA\Get(
        path: '/api/v1/student/certificates',
        summary: 'List student certificates',
        description: 'Returns real certificates for the authenticated student. Eligible certificates are created automatically when course progress reaches 90%.',
        security: [['sanctum' => []]],
        tags: ['Student Certificates'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Certificates retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(
                                    property: 'certificates',
                                    type: 'array',
                                    items: new OA\Items(
                                        properties: [
                                            new OA\Property(property: 'id', type: 'string', example: '9b3f7c2d-1234-4bcd-a456-123456789abc'),
                                            new OA\Property(property: 'verification_code', type: 'string', example: 'ILAB-2026-AB12CD34'),
                                            new OA\Property(property: 'authorized_signatory_name', type: 'string', example: 'Authorized Signature'),
                                            new OA\Property(property: 'authorized_signatory_title', type: 'string', example: 'iLab BD'),
                                            new OA\Property(property: 'eligible_progress', type: 'integer', example: 90),
                                            new OA\Property(property: 'issued_at', type: 'string', format: 'date-time'),
                                        ],
                                        type: 'object'
                                    )
                                ),
                                new OA\Property(property: 'eligible_progress', type: 'integer', example: 90),
                            ],
                            type: 'object'
                        ),
                        new OA\Property(property: 'message', type: 'string', example: 'Certificates retrieved successfully.'),
                    ],
                    type: 'object'
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Unauthorized certificate access')
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'student') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthorized certificate access.',
                'errors' => null,
            ], 403);
        }

        $this->syncEligibleCertificates($user->id);

        $certificates = Certificate::query()
            ->with([
                'user:id,name,email',
                'course:id,title,slug,instructor_id',
                'course.instructor:id,name',
            ])
            ->where('user_id', $user->id)
            ->latest('issued_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'certificates' => $certificates,
                'eligible_progress' => self::ELIGIBLE_PROGRESS,
            ],
            'message' => 'Certificates retrieved successfully.',
            'errors' => null,
        ]);
    }

    private function syncEligibleCertificates(int $userId): void
    {
        $enrollments = DB::table('enrollments')
            ->join('courses', 'courses.id', '=', 'enrollments.course_id')
            ->where('enrollments.user_id', $userId)
            ->where('enrollments.status', 'active')
            ->where('courses.status', 'published')
            ->select('enrollments.course_id', 'enrollments.progress_percentage')
            ->get();

        foreach ($enrollments as $enrollment) {
            $progress = max(
                (int) ($enrollment->progress_percentage ?? 0),
                $this->calculateCourseProgress($userId, (int) $enrollment->course_id)
            );

            if ($progress < self::ELIGIBLE_PROGRESS) {
                continue;
            }

            $certificate = Certificate::firstOrCreate(
                [
                    'user_id' => $userId,
                    'course_id' => $enrollment->course_id,
                ],
                [
                    'verification_code' => $this->verificationCode(),
                    'authorized_signatory_name' => config('app.certificate_signatory_name', 'Authorized Signature'),
                    'authorized_signatory_title' => config('app.certificate_signatory_title', 'iLab BD'),
                    'eligible_progress' => self::ELIGIBLE_PROGRESS,
                    'issued_at' => now(),
                ]
            );

            if ($certificate->wasRecentlyCreated) {
                StudentNotification::createForStudent(
                    $userId,
                    'certificate_ready',
                    'Certificate ready',
                    'Your certificate is ready to download.',
                    '/dashboard/certificates',
                    ['course_id' => $enrollment->course_id, 'certificate_id' => $certificate->id]
                );
            }
        }
    }

    private function calculateCourseProgress(int $userId, int $courseId): int
    {
        $totalLessons = Lesson::whereHas('section', function ($query) use ($courseId) {
            $query->where('course_id', $courseId);
        })->count();

        if ($totalLessons === 0) {
            return 0;
        }

        $completedLessons = LessonProgress::where('user_id', $userId)
            ->where('is_completed', true)
            ->whereHas('lesson.section', function ($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->count();

        return (int) round(($completedLessons / $totalLessons) * 100);
    }

    private function verificationCode(): string
    {
        do {
            $code = 'ILAB-' . now()->format('Y') . '-' . strtoupper(Str::random(8));
        } while (Certificate::where('verification_code', $code)->exists());

        return $code;
    }
}
