<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\StudentNotification;
use App\Support\AdminNotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EnrollmentController extends Controller
{
    public function options(Request $request): JsonResponse
    {
        if (! $this->canView($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot view enrollment options.');
        }

        $courses = DB::table('courses')
            ->leftJoin('users as instructors', 'courses.instructor_id', '=', 'instructors.id')
            ->select(
                'courses.id',
                'courses.title',
                'courses.slug',
                'courses.thumbnail',
                'courses.price',
                'courses.discount_price',
                'courses.status',
                'courses.type',
                'instructors.name as instructor_name'
            )
            ->when($request->user()->role === 'instructor', function ($query) use ($request) {
                $query->where('courses.instructor_id', $request->user()->id);
            })
            ->orderBy('courses.title')
            ->get();

        $students = $this->canManuallyEnroll($request->user())
            ? DB::table('users')
                ->select('id', 'name', 'email', 'phone', 'avatar', 'status')
                ->where('role', 'student')
                ->whereNull('deleted_at')
                ->orderBy('name')
                ->limit(500)
                ->get()
            : collect();

        return response()->json([
            'success' => true,
            'data' => [
                'students' => $students,
                'courses' => $courses,
            ],
            'message' => 'Enrollment options retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        if (! $this->canView($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot view enrollments.');
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', 'string', 'in:active,completed,suspended,expired'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = DB::table('enrollments')
            ->join('users', 'enrollments.user_id', '=', 'users.id')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->select(
                'enrollments.id',
                'enrollments.user_id',
                'enrollments.course_id',
                'enrollments.status',
                'enrollments.enrolled_price',
                'enrollments.progress_percentage',
                'enrollments.enrolled_at',
                'enrollments.expires_at',
                'enrollments.created_at',
                'enrollments.updated_at',
                'users.name as student_name',
                'users.email as student_email',
                'users.phone as student_phone',
                'users.avatar as student_avatar',
                'courses.title as course_title',
                'courses.slug as course_slug',
                'courses.thumbnail as course_thumbnail',
                'courses.price as course_price',
                'courses.discount_price as course_discount_price',
                'courses.instructor_id'
            );

        if ($request->user()->role === 'instructor') {
            $query->where('courses.instructor_id', $request->user()->id);
        }

        $query
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where(function ($subQuery) use ($validated) {
                    $subQuery->where('users.name', 'like', '%' . $validated['search'] . '%')
                        ->orWhere('users.email', 'like', '%' . $validated['search'] . '%')
                        ->orWhere('users.phone', 'like', '%' . $validated['search'] . '%')
                        ->orWhere('courses.title', 'like', '%' . $validated['search'] . '%');
                });
            })
            ->when(! empty($validated['course_id']), function ($query) use ($validated) {
                $query->where('enrollments.course_id', $validated['course_id']);
            })
            ->when(! empty($validated['user_id']), function ($query) use ($validated) {
                $query->where('enrollments.user_id', $validated['user_id']);
            })
            ->when(! empty($validated['status']), function ($query) use ($validated) {
                $query->where('enrollments.status', $validated['status']);
            });

        $enrollments = $query
            ->orderByDesc('enrollments.created_at')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $enrollments,
            'message' => 'Enrollment ledger retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->canManuallyEnroll($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can manually enroll students.');
        }

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'enrolled_price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'in:active,completed,suspended'],
            'enrolled_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:today'],
        ]);

        $student = DB::table('users')
            ->where('id', $validated['user_id'])
            ->where('role', 'student')
            ->whereNull('deleted_at')
            ->first();

        if (! $student) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Only student accounts can be enrolled in courses.',
                'errors' => null,
            ], 422);
        }

        $exists = DB::table('enrollments')
            ->where('user_id', $validated['user_id'])
            ->where('course_id', $validated['course_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Student is already enrolled in this course.',
                'errors' => null,
            ], 400);
        }

        $enrollmentId = DB::table('enrollments')->insertGetId([
            'user_id' => $validated['user_id'],
            'course_id' => $validated['course_id'],
            'enrolled_price' => $validated['enrolled_price'],
            'status' => $validated['status'],
            'progress_percentage' => 0,
            'enrolled_at' => $validated['enrolled_at'] ?? now(),
            'expires_at' => $validated['expires_at'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $enrollment = DB::table('enrollments')->where('id', $enrollmentId)->first();

        AdminNotificationDispatcher::newEnrollment(
            (int) $validated['user_id'],
            (int) $validated['course_id'],
            $validated['enrolled_price']
        );

        return response()->json([
            'success' => true,
            'data' => $enrollment,
            'message' => 'Student manually enrolled successfully.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (! $this->canModifyEnrollment($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can update enrollments.');
        }

        $enrollment = DB::table('enrollments')->where('id', $id)->first();

        if (! $enrollment) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Enrollment not found.',
                'errors' => null,
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['active', 'completed', 'suspended', 'expired'])],
            'progress_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'enrolled_price' => ['nullable', 'numeric', 'min:0'],
            'enrolled_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
        ]);

        DB::table('enrollments')
            ->where('id', $id)
            ->update([
                'status' => $validated['status'],
                'progress_percentage' => $validated['progress_percentage'] ?? $enrollment->progress_percentage,
                'enrolled_price' => $validated['enrolled_price'] ?? $enrollment->enrolled_price,
                'enrolled_at' => array_key_exists('enrolled_at', $validated)
                    ? $validated['enrolled_at']
                    : $enrollment->enrolled_at,
                'expires_at' => array_key_exists('expires_at', $validated)
                    ? $validated['expires_at']
                    : $enrollment->expires_at,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'data' => DB::table('enrollments')->where('id', $id)->first(),
            'message' => 'Enrollment updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (! $this->canDeleteEnrollment($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can revoke enrollments.');
        }

        $enrollment = DB::table('enrollments')->where('id', $id)->first();

        if (! $enrollment) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Enrollment not found.',
                'errors' => null,
            ], 404);
        }

        DB::transaction(function () use ($enrollment, $id) {
            DB::table('lesson_progress')
                ->where('user_id', $enrollment->user_id)
                ->whereIn('lesson_id', function ($query) use ($enrollment) {
                    $query->select('lessons.id')
                        ->from('lessons')
                        ->join('sections', 'lessons.section_id', '=', 'sections.id')
                        ->where('sections.course_id', $enrollment->course_id);
                })
                ->delete();

            DB::table('enrollments')
                ->where('id', $id)
                ->delete();
        });

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Student access revoked and course progress cleared successfully.',
            'errors' => null,
        ]);
    }

    public function pendingPayments(Request $request): JsonResponse
    {
        if (! $this->canModifyEnrollment($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can review pending payments.');
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $payments = Payment::query()
            ->with(['user:id,name,email,phone,avatar', 'course:id,title,slug,thumbnail'])
            ->where('method', 'uddoktapay')
            ->where('status', 'pending')
            ->whereNotNull('gateway_response->verified_response')
            ->where(function ($query) {
                $query
                    ->where('gateway_response->pending_type', 'bank')
                    ->orWhereNotNull('gateway_response->bank_details->account_number')
                    ->orWhereRaw("LOWER(JSON_UNQUOTE(JSON_EXTRACT(gateway_response, '$.payment_method'))) LIKE '%bank%'")
                    ->orWhereRaw("LOWER(JSON_UNQUOTE(JSON_EXTRACT(gateway_response, '$.verified_response.payment_method'))) LIKE '%bank%'")
                    ->orWhereRaw("LOWER(JSON_UNQUOTE(JSON_EXTRACT(gateway_response, '$.verified_response.gateway'))) LIKE '%bank%'")
                    ->orWhereRaw("LOWER(JSON_UNQUOTE(JSON_EXTRACT(gateway_response, '$.verified_response.gateway_name'))) LIKE '%bank%'");
            })
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where(function ($subQuery) use ($validated) {
                    $subQuery
                        ->where('transaction_id', 'like', '%' . $validated['search'] . '%')
                        ->orWhereHas('user', function ($userQuery) use ($validated) {
                            $userQuery
                                ->where('name', 'like', '%' . $validated['search'] . '%')
                                ->orWhere('email', 'like', '%' . $validated['search'] . '%')
                                ->orWhere('phone', 'like', '%' . $validated['search'] . '%');
                        })
                        ->orWhereHas('course', function ($courseQuery) use ($validated) {
                            $courseQuery->where('title', 'like', '%' . $validated['search'] . '%');
                        });
                });
            })
            ->orderByDesc('created_at')
            ->paginate($validated['per_page'] ?? 20)
            ->through(fn (Payment $payment) => $this->pendingPaymentPayload($payment));

        return response()->json([
            'success' => true,
            'data' => $payments,
            'message' => 'Pending payments retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function approvePendingPayment(Request $request, Payment $payment): JsonResponse
    {
        if (! $this->canModifyEnrollment($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can approve pending payments.');
        }

        if ($payment->method !== 'uddoktapay' || $payment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Only pending UddoktaPay payments can be approved.',
                'errors' => null,
            ], 422);
        }

        $approved = DB::transaction(function () use ($payment, $request) {
            $lockedPayment = Payment::query()
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedPayment->status !== 'pending') {
                return $lockedPayment;
            }

            DB::table('enrollments')->updateOrInsert(
                [
                    'user_id' => $lockedPayment->user_id,
                    'course_id' => $lockedPayment->course_id,
                ],
                [
                    'enrolled_price' => $lockedPayment->amount,
                    'status' => 'active',
                    'progress_percentage' => 0,
                    'enrolled_at' => now(),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $lockedPayment->update([
                'status' => 'completed',
                'gateway_response' => array_merge($lockedPayment->gateway_response ?? [], [
                    'admin_approval' => [
                        'approved_by' => $request->user()->id,
                        'approved_at' => now()->toISOString(),
                    ],
                ]),
            ]);

            AdminNotificationDispatcher::newEnrollment(
                (int) $lockedPayment->user_id,
                (int) $lockedPayment->course_id,
                (float) $lockedPayment->amount
            );

            $this->notifyStudentEnrollment((int) $lockedPayment->user_id, (int) $lockedPayment->course_id);

            return $lockedPayment->fresh(['user:id,name,email,phone,avatar', 'course:id,title,slug,thumbnail']);
        });

        return response()->json([
            'success' => true,
            'data' => $this->pendingPaymentPayload($approved),
            'message' => 'Payment approved and student enrolled successfully.',
            'errors' => null,
        ]);
    }

    public function rejectPendingPayment(Request $request, Payment $payment): JsonResponse
    {
        if (! $this->canModifyEnrollment($request->user())) {
            return $this->forbiddenResponse('Access denied. Only Super Admin and Admin can reject pending payments.');
        }

        if ($payment->method !== 'uddoktapay' || $payment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Only pending UddoktaPay payments can be rejected.',
                'errors' => null,
            ], 422);
        }

        $rejected = DB::transaction(function () use ($payment, $request) {
            $lockedPayment = Payment::query()
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedPayment->status !== 'pending') {
                return $lockedPayment;
            }

            $lockedPayment->update([
                'status' => 'failed',
                'gateway_response' => array_merge($lockedPayment->gateway_response ?? [], [
                    'admin_rejection' => [
                        'rejected_by' => $request->user()->id,
                        'rejected_at' => now()->toISOString(),
                    ],
                ]),
            ]);

            return $lockedPayment->fresh(['user:id,name,email,phone,avatar', 'course:id,title,slug,thumbnail']);
        });

        return response()->json([
            'success' => true,
            'data' => $this->pendingPaymentPayload($rejected),
            'message' => 'Pending payment rejected successfully.',
            'errors' => null,
        ]);
    }

    private function canView($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin', 'manager', 'instructor'], true);
    }

    private function canManuallyEnroll($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin'], true);
    }

    private function canModifyEnrollment($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin'], true);
    }

    private function canDeleteEnrollment($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin'], true);
    }

    private function pendingPaymentPayload(Payment $payment): array
    {
        $gatewayResponse = $payment->gateway_response ?? [];
        $verifiedResponse = $gatewayResponse['verified_response'] ?? [];
        $initResponse = $gatewayResponse['init_response'] ?? [];
        $bankDetails = $gatewayResponse['bank_details'] ?? $this->bankDetailsFromPayload($verifiedResponse);

        return [
            'id' => $payment->id,
            'user_id' => $payment->user_id,
            'course_id' => $payment->course_id,
            'amount' => (float) $payment->amount,
            'status' => $payment->status,
            'transaction_id' => $payment->transaction_id,
            'gateway_invoice_id' => $verifiedResponse['invoice_id']
                ?? $initResponse['invoice_id']
                ?? $payment->transaction_id,
            'gateway_status' => $verifiedResponse['status'] ?? null,
            'payment_method' => $verifiedResponse['payment_method']
                ?? $verifiedResponse['gateway']
                ?? $verifiedResponse['gateway_name']
                ?? $gatewayResponse['payment_method']
                ?? null,
            'sender_number' => $verifiedResponse['sender_number'] ?? null,
            'bank_details' => $bankDetails,
            'created_at' => $payment->created_at,
            'updated_at' => $payment->updated_at,
            'student' => $payment->user ? [
                'id' => $payment->user->id,
                'name' => $payment->user->name,
                'email' => $payment->user->email,
                'phone' => $payment->user->phone,
                'avatar' => $payment->user->avatar,
            ] : null,
            'course' => $payment->course ? [
                'id' => $payment->course->id,
                'title' => $payment->course->title,
                'slug' => $payment->course->slug,
                'thumbnail' => $payment->course->thumbnail,
            ] : null,
        ];
    }

    private function bankDetailsFromPayload(array $payload): array
    {
        return array_filter([
            'bank_name' => $this->firstPayloadValue($payload, ['bank_name', 'bank']),
            'account_name' => $this->firstPayloadValue($payload, ['account_name', 'account_holder', 'holder_name']),
            'account_number' => $this->firstPayloadValue($payload, ['account_number', 'bank_account', 'account_no']),
            'branch_name' => $this->firstPayloadValue($payload, ['branch_name', 'branch']),
            'routing_number' => $this->firstPayloadValue($payload, ['routing_number', 'routing']),
            'swift_code' => $this->firstPayloadValue($payload, ['swift_code', 'swift']),
            'reference' => $this->firstPayloadValue($payload, ['transaction_id', 'trx_id', 'reference', 'invoice_id']),
        ], fn ($value) => filled($value));
    }

    private function firstPayloadValue(array $payload, array $keys): ?string
    {
        foreach ($payload as $key => $value) {
            if (in_array(strtolower((string) $key), $keys, true) && (is_string($value) || is_numeric($value))) {
                return (string) $value;
            }

            if (is_array($value)) {
                $nested = $this->firstPayloadValue($value, $keys);

                if ($nested !== null) {
                    return $nested;
                }
            }
        }

        return null;
    }

    private function notifyStudentEnrollment(int $userId, int $courseId): void
    {
        $course = DB::table('courses')
            ->select('id', 'title', 'slug')
            ->where('id', $courseId)
            ->first();

        if (! $course) {
            return;
        }

        $firstLessonId = DB::table('lessons')
            ->join('sections', 'sections.id', '=', 'lessons.section_id')
            ->where('sections.course_id', $course->id)
            ->orderBy('sections.order')
            ->orderBy('lessons.order')
            ->value('lessons.id');

        StudentNotification::createForStudent(
            $userId,
            'admin_message',
            'Enrollment confirmed',
            'Your bank payment was approved. You are now enrolled in ' . $course->title . '.',
            $firstLessonId ? '/dashboard/player/' . $course->slug . '/' . $firstLessonId : '/dashboard/my-courses',
            [
                'course_id' => $course->id,
                'course_slug' => $course->slug,
                'first_lesson_id' => $firstLessonId,
            ]
        );
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
}
