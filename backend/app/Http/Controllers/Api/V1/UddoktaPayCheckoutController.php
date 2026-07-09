<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Course;
use App\Models\Payment;
use App\Models\StudentNotification;
use App\Models\SystemSetting;
use App\Services\PaymentInvoiceEmailService;
use App\Support\AdminNotificationDispatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Checkout & Enrollment", description: "Secure course purchasing using UddoktaPay")]
class UddoktaPayCheckoutController extends Controller
{
    public function previewCoupon(Request $request)
    {
        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'coupon_code' => ['required', 'string', 'max:50', 'regex:/^[A-Za-z0-9_-]+$/'],
        ]);

        $this->releaseExpiredPendingPayments();

        $course = Course::where('id', $validated['course_id'])
            ->where('status', 'published')
            ->firstOrFail();

        $coupon = $this->findApplicableCoupon($validated['coupon_code'], $course);

        if (! $coupon || ! $this->couponCanBeUsed($coupon)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid, expired, or fully used coupon.',
                'errors' => null,
            ], 422);
        }

        $basePrice = (float) $course->effective_price;
        $discountAmount = $this->discountAmount($coupon, $basePrice);

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => (float) $coupon->value,
                'discount_amount' => $discountAmount,
                'final_amount' => max(0, $basePrice - $discountAmount),
                'label' => $coupon->type === 'percentage'
                    ? rtrim(rtrim((string) $coupon->value, '0'), '.') . '% discount'
                    : '৳' . number_format((float) $coupon->value) . ' discount',
            ],
            'message' => 'Coupon is available.',
            'errors' => null,
        ]);
    }

    #[OA\Post(
        path: "/api/v1/checkout/init",
        summary: "Initialize checkout",
        description: "Calculates the final price securely. Free courses enroll instantly; paid courses return a payment URL.",
        security: [["sanctum" => []]],
        tags: ["Checkout & Enrollment"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['course_id'],
                properties: [
                    new OA\Property(property: 'course_id', type: 'integer', example: 1),
                    new OA\Property(property: 'coupon_code', type: 'string', nullable: true, example: 'WELCOME50'),
                    new OA\Property(property: 'phone', type: 'string', nullable: true, example: '01700000000'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Checkout initialized or free enrollment completed'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Only student accounts can enroll'),
            new OA\Response(response: 409, description: 'Already enrolled or suspended from this course'),
            new OA\Response(response: 422, description: 'Validation error or invalid coupon'),
            new OA\Response(response: 500, description: 'Payment gateway unavailable'),
            new OA\Response(response: 503, description: 'Payment gateway is not configured or disabled'),
        ]
    )]
    public function initiatePayment(Request $request)
    {
        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'coupon_code' => ['nullable', 'string', 'max:50', 'regex:/^[A-Za-z0-9_-]+$/'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $user = $request->user();

        if ($user->role !== 'student') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Only student accounts can enroll in courses.',
                'errors' => null,
            ], 403);
        }

        $course = Course::where('id', $validated['course_id'])
            ->where('status', 'published')
            ->firstOrFail();

        $paymentSettings = SystemSetting::section('payments');
        $this->releaseExpiredPendingPayments();

        try {
            $checkout = DB::transaction(function () use ($validated, $user, $course, $paymentSettings) {
                $existingEnrollment = DB::table('enrollments')
                    ->where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->lockForUpdate()
                    ->first();

                if ($existingEnrollment) {
                    return [
                        'error' => response()->json([
                            'success' => false,
                            'data' => null,
                            'message' => $existingEnrollment->status === 'suspended'
                                ? 'Your access to this course is suspended. Please contact support.'
                                : 'You are already enrolled in this course.',
                            'errors' => null,
                        ], 409),
                    ];
                }

                $basePrice = (float) $course->effective_price;
                $discountAmount = 0;
                $coupon = null;

                if (! empty($validated['coupon_code'])) {
                    $coupon = $this->findApplicableCoupon($validated['coupon_code'], $course, true);

                    if (! $coupon || ! $this->couponCanBeUsed($coupon)) {
                        return [
                            'error' => response()->json([
                                'success' => false,
                                'data' => null,
                                'message' => 'Invalid, expired, or fully used coupon.',
                                'errors' => null,
                            ], 422),
                        ];
                    }

                    $discountAmount = $this->discountAmount($coupon, $basePrice);
                    $coupon->increment('used_count');
                }

                $payableAmount = max(0, $basePrice - $discountAmount);

                if ($payableAmount == 0 && ! ($paymentSettings['free_enrollment_enabled'] ?? true)) {
                    if ($coupon) {
                        $coupon->decrement('used_count');
                    }

                    return [
                        'error' => response()->json([
                            'success' => false,
                            'data' => null,
                            'message' => 'Free enrollment is temporarily disabled.',
                            'errors' => null,
                        ], 503),
                    ];
                }

                if ($payableAmount > 0 && ! ($paymentSettings['uddoktapay_enabled'] ?? true)) {
                    if ($coupon) {
                        $coupon->decrement('used_count');
                    }

                    return [
                        'error' => response()->json([
                            'success' => false,
                            'data' => null,
                            'message' => 'Online payment is temporarily disabled. Please contact support.',
                            'errors' => null,
                        ], 503),
                    ];
                }

                $payment = Payment::create([
                    'user_id' => $user->id,
                    'course_id' => $course->id,
                    'coupon_id' => $coupon?->id,
                    'amount' => $payableAmount,
                    'method' => $payableAmount == 0 ? 'free' : 'uddoktapay',
                    'status' => $payableAmount == 0 ? 'completed' : 'pending',
                    'gateway_response' => [
                        'base_price' => $basePrice,
                        'discount_amount' => $discountAmount,
                        'coupon_code' => $coupon?->code,
                        'phone' => $validated['phone'] ?? null,
                    ],
                ]);

                if ($payableAmount == 0) {
                    $this->createEnrollment($user->id, $course->id, 0);
                }

                return [
                    'payment' => $payment,
                    'payable_amount' => $payableAmount,
                    'is_free' => $payableAmount == 0,
                ];
            }, 5);

            if (isset($checkout['error'])) {
                return $checkout['error'];
            }
        } catch (\Throwable $e) {
            Log::error('Checkout transaction failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Checkout could not be initialized. Please try again.',
                'errors' => null,
            ], 500);
        }

        if ($checkout['is_free']) {
            $this->sendInvoiceEmail($checkout['payment']);

            return response()->json([
                'success' => true,
                'data' => [
                    'is_free' => true,
                    'invoice_id' => $checkout['payment']->id,
                    'redirect_url' => '/enroll/success?invoice_id=' . $checkout['payment']->id,
                ],
                'message' => 'Enrolled successfully.',
                'errors' => null,
            ]);
        }

        $payment = $checkout['payment'];
        $payableAmount = $checkout['payable_amount'];

        if (! $this->apiKey()) {
            $this->failPendingPayment($payment, ['message' => 'UddoktaPay API key is missing.']);

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Payment gateway is not configured.',
                'errors' => null,
            ], 503);
        }

        $response = $this->uddoktaRequest()->post($this->checkoutUrl(), [
            'full_name' => $user->name,
            'email' => $user->email ?? 'student@domainname.com',
            'amount' => number_format($payableAmount, 2, '.', ''),
            'currency' => config('services.uddoktapay.currency', 'BDT'),
            'metadata' => [
                'payment_id' => $payment->id,
                'user_id' => $user->id,
                'course_id' => $course->id,
                'coupon_id' => $payment->coupon_id,
                'payable_amount' => number_format($payableAmount, 2, '.', ''),
            ],
            'redirect_url' => url('/api/v1/checkout/uddoktapay/success'),
            'return_type' => 'GET',
            'cancel_url' => url('/api/v1/checkout/uddoktapay/cancel'),
            'webhook_url' => url('/api/v1/webhook/uddoktapay'),
        ]);

        if ($response->successful() && $response->json('payment_url')) {
            $payment->update([
                'transaction_id' => $response->json('invoice_id') ?? $response->json('transaction_id'),
                'gateway_response' => array_merge($payment->gateway_response ?? [], [
                    'init_response' => $response->json(),
                    'gateway_payment_url' => $response->json('payment_url'),
                ]),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'is_free' => false,
                    'invoice_id' => $payment->id,
                    'payment_url' => $response->json('payment_url'),
                ],
                'message' => 'Checkout initialized successfully.',
                'errors' => null,
            ]);
        }

        $gatewayResponse = $response->json() ?: ['body' => $response->body()];
        $this->failPendingPayment($payment, $gatewayResponse, 'failed');

        Log::error('UddoktaPay Init Error: ' . $response->body());
        $gatewayMessage = is_array($gatewayResponse)
            ? ($gatewayResponse['message'] ?? null)
            : null;

        return response()->json([
            'success' => false,
            'data' => null,
            'message' => config('app.debug') && $gatewayMessage
                ? 'Payment gateway error: ' . $gatewayMessage
                : 'Payment gateway unavailable.',
            'errors' => null,
        ], 500);
    }

    public function invoice(Request $request, Payment $payment)
    {
        if ((int) $payment->user_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invoice not found.',
                'errors' => null,
            ], 404);
        }

        $payment->load(['course:id,title,slug,thumbnail', 'coupon:id,code']);

        return response()->json([
            'success' => true,
            'data' => [
                'invoice_id' => $payment->id,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'method' => $payment->method,
                'transaction_id' => $payment->transaction_id,
                'payment_method' => $payment->gateway_response['payment_method'] ?? null,
                'sender_number' => $payment->gateway_response['sender_number'] ?? null,
                'gateway_transaction_id' => $payment->gateway_response['gateway_transaction_id'] ?? null,
                'course' => [
                    'id' => $payment->course_id,
                    'title' => $payment->course?->title,
                    'slug' => $payment->course?->slug,
                    'thumbnail' => $payment->course?->thumbnail,
                ],
                'coupon' => $payment->coupon?->code,
                'paid_at' => $payment->status === 'completed' ? $payment->updated_at : null,
                'created_at' => $payment->created_at,
            ],
            'message' => 'Invoice retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function webhook(Request $request)
    {
        $apiKey = $this->apiKey();
        $webhookKey = (string) $request->header('RT-UDDOKTAPAY-API-KEY', '');

        if (! $apiKey || ! hash_equals($apiKey, $webhookKey)) {
            Log::warning('Unauthorized Webhook attempt');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $invoiceId = $request->input('invoice_id');

        if (! $invoiceId) {
            return response()->json(['message' => 'Invoice ID missing'], 422);
        }

        $verified = $this->verifyGatewayPayment($invoiceId);

        if (($verified['status'] ?? null) === 'COMPLETED') {
            $this->completeVerifiedPayment($verified, $request->all());
        } elseif (($verified['status'] ?? null) === 'ERROR') {
            $this->failVerifiedPayment($verified, $request->all());
        } elseif (
            $this->isGatewayPendingStatus($verified['status'] ?? null)
            && $this->isBankPaymentPayload($verified)
        ) {
            $this->recordPendingVerifiedPayment($verified, $request->all());
        }

        return response()->json(['message' => 'Processed']);
    }

    public function success(Request $request)
    {
        $invoiceId = $request->query('invoice_id');

        if (! $invoiceId) {
            return redirect($this->frontendUrl('/courses?payment=invalid'));
        }

        $verified = $this->verifyGatewayPayment($invoiceId);

        if (($verified['status'] ?? null) === 'COMPLETED') {
            $payment = $this->completeVerifiedPayment($verified, $request->query());

            return redirect($this->frontendUrl('/enroll/success?invoice_id=' . urlencode($payment?->id ?? $invoiceId)));
        }

        if (($verified['status'] ?? null) === 'ERROR') {
            $this->failVerifiedPayment($verified, $request->query());

            return redirect($this->frontendUrl('/courses?payment=failed'));
        }

        if ($this->isGatewayPendingStatus($verified['status'] ?? null)) {
            if ($this->isBankPaymentPayload($verified)) {
                $payment = $this->recordPendingVerifiedPayment($verified, $request->query());

                return redirect($this->frontendUrl('/enroll/success?invoice_id=' . urlencode($payment?->id ?? $invoiceId) . '&payment=pending'));
            }

            return redirect($this->frontendUrl('/courses?payment=pending'));
        }

        return redirect($this->frontendUrl('/dashboard/my-courses?payment=pending'));
    }

    public function cancel(Request $request)
    {
        $invoiceId = $request->query('invoice_id');

        if ($invoiceId) {
            $verified = $this->verifyGatewayPayment($invoiceId);
            $payment = $this->findPaymentFromGatewayPayload($verified ?: ['invoice_id' => $invoiceId]);

            if ($payment && $payment->status === 'pending') {
                $this->failPendingPayment($payment, ['cancel_response' => $request->query(), 'verified_response' => $verified], 'failed');
            }
        }

        return redirect($this->frontendUrl('/courses?payment=cancelled'));
    }

    private function completeVerifiedPayment(array $verified, array $sourcePayload = []): ?Payment
    {
        $metadata = $verified['metadata'] ?? [];
        $gatewayInvoiceId = $verified['invoice_id'] ?? $verified['transaction_id'] ?? null;
        $paymentId = $metadata['payment_id'] ?? null;

        $payment = DB::transaction(function () use ($verified, $sourcePayload, $metadata, $gatewayInvoiceId, $paymentId) {
            $payment = $this->findPaymentFromGatewayPayload($verified, true);

            if (! $payment) {
                Log::warning('Verified UddoktaPay payment could not be matched.', [
                    'invoice_id' => $gatewayInvoiceId,
                    'metadata' => $metadata,
                ]);

                return null;
            }

            if (! $this->metadataMatchesPayment($metadata, $payment)) {
                Log::warning('UddoktaPay metadata mismatch.', [
                    'payment_id' => $payment->id,
                    'metadata' => $metadata,
                ]);

                $this->markLockedPaymentFailed($payment, [
                    'verified_response' => $verified,
                    'completion_source' => $sourcePayload,
                    'failure_reason' => 'metadata_mismatch',
                ], 'failed');

                return $payment;
            }

            $verifiedAmount = $this->moneyValue($verified['amount'] ?? $verified['payable_amount'] ?? $payment->amount);

            if (round($verifiedAmount, 2) !== round($this->moneyValue($payment->amount), 2)) {
                Log::warning('UddoktaPay amount mismatch.', [
                    'payment_id' => $payment->id,
                    'expected' => (float) $payment->amount,
                    'verified' => $verifiedAmount,
                ]);

                $this->markLockedPaymentFailed($payment, [
                    'verified_response' => $verified,
                    'completion_source' => $sourcePayload,
                    'failure_reason' => 'amount_mismatch',
                ], 'failed');

                return $payment;
            }

            $this->restoreCouponUsageIfReleased($payment);

            $exists = DB::table('enrollments')
                ->where('user_id', $payment->user_id)
                ->where('course_id', $payment->course_id)
                ->lockForUpdate()
                ->exists();

            if (! $exists) {
                $this->createEnrollment($payment->user_id, $payment->course_id, $payment->amount);
            }

            if ($payment->status !== 'completed') {
                $payment->update([
                    'status' => 'completed',
                    'transaction_id' => $gatewayInvoiceId ?: $payment->transaction_id,
                    'gateway_response' => array_merge($payment->gateway_response ?? [], [
                        'verified_response' => $verified,
                        'completion_source' => $sourcePayload,
                        'payment_method' => $verified['payment_method'] ?? null,
                        'sender_number' => $verified['sender_number'] ?? null,
                        'gateway_transaction_id' => $verified['transaction_id'] ?? null,
                    ]),
                ]);
            }

            return $payment;
        }, 5);

        if ($payment && $payment->status === 'completed') {
            $this->sendInvoiceEmail($payment);
        }

        return $payment;
    }

    private function restoreCouponUsageIfReleased(Payment $payment): void
    {
        $gatewayResponse = $payment->gateway_response ?? [];

        if (! $payment->coupon_id || empty($gatewayResponse['coupon_released_at'])) {
            return;
        }

        Coupon::whereKey($payment->coupon_id)->increment('used_count');

        $gatewayResponse['coupon_restored_at'] = now()->toISOString();
        unset($gatewayResponse['coupon_released_at']);

        $payment->forceFill([
            'gateway_response' => $gatewayResponse,
        ])->save();
    }

    private function failVerifiedPayment(array $verified, array $sourcePayload = []): ?Payment
    {
        $payment = $this->findPaymentFromGatewayPayload($verified);

        if (! $payment || $payment->status !== 'pending') {
            return $payment;
        }

        $this->failPendingPayment($payment, [
            'verified_response' => $verified,
            'failure_source' => $sourcePayload,
        ], 'failed');

        return $payment->fresh();
    }

    private function recordPendingVerifiedPayment(array $verified, array $sourcePayload = []): ?Payment
    {
        if (! $this->isBankPaymentPayload($verified)) {
            return $this->findPaymentFromGatewayPayload($verified);
        }

        return DB::transaction(function () use ($verified, $sourcePayload) {
            $payment = $this->findPaymentFromGatewayPayload($verified, true);

            if (! $payment || $payment->status !== 'pending') {
                return $payment;
            }

            if (! $this->metadataMatchesPayment($verified['metadata'] ?? [], $payment)) {
                Log::warning('UddoktaPay pending metadata mismatch.', [
                    'payment_id' => $payment->id,
                    'metadata' => $verified['metadata'] ?? [],
                ]);

                return $payment;
            }

            $payment->update([
                'transaction_id' => $verified['invoice_id'] ?? $verified['transaction_id'] ?? $payment->transaction_id,
                'gateway_response' => array_merge($payment->gateway_response ?? [], [
                    'verified_response' => $verified,
                    'pending_source' => $sourcePayload,
                    'pending_recorded_at' => now()->toISOString(),
                    'pending_type' => 'bank',
                    'bank_details' => $this->bankDetailsFromGatewayPayload($verified),
                    'payment_method' => $verified['payment_method'] ?? $verified['gateway'] ?? $verified['gateway_name'] ?? null,
                    'sender_number' => $verified['sender_number'] ?? null,
                    'gateway_transaction_id' => $verified['transaction_id'] ?? null,
                ]),
            ]);

            return $payment->fresh();
        }, 5);
    }

    private function verifyGatewayPayment(string $invoiceId): array
    {
        if (! $this->apiKey()) {
            Log::error('UddoktaPay verification failed: API key missing.');
            return [];
        }

        try {
            $response = $this->uddoktaRequest()->post($this->verifyUrl(), [
                'invoice_id' => $invoiceId,
            ]);

            if ($response->failed()) {
                Log::warning('UddoktaPay verification HTTP failure.', [
                    'invoice_id' => $invoiceId,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [];
            }

            return $response->json() ?: [];
        } catch (\Throwable $e) {
            Log::error('UddoktaPay verification exception: ' . $e->getMessage());
            return [];
        }
    }

    private function uddoktaRequest()
    {
        return Http::timeout(30)
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'RT-UDDOKTAPAY-API-KEY' => $this->apiKey(),
            ]);
    }

    private function checkoutUrl(): string
    {
        return $this->gatewayUrl(config('services.uddoktapay.checkout_endpoint', '/api/checkout-v2'));
    }

    private function verifyUrl(): string
    {
        return $this->gatewayUrl(config('services.uddoktapay.verify_endpoint', '/api/verify-payment'));
    }

    private function gatewayUrl(string $endpoint): string
    {
        $domain = rtrim((string) config('services.uddoktapay.payment_domain'), '/');

        if (! Str::startsWith($domain, ['http://', 'https://'])) {
            $domain = 'https://' . $domain;
        }

        return $domain . '/' . ltrim($endpoint, '/');
    }

    private function apiKey(): ?string
    {
        return config('services.uddoktapay.api_key');
    }

    private function frontendUrl(string $path): string
    {
        return rtrim((string) config('app.frontend_url'), '/') . '/' . ltrim($path, '/');
    }

    private function failPendingPayment(Payment $payment, array $gatewayResponse, string $status = 'failed'): void
    {
        DB::transaction(function () use ($payment, $gatewayResponse, $status) {
            $lockedPayment = Payment::whereKey($payment->id)->lockForUpdate()->first();

            if (! $lockedPayment || $lockedPayment->status !== 'pending') {
                return;
            }

            $this->markLockedPaymentFailed($lockedPayment, $gatewayResponse, $status);
        });
    }

    private function markLockedPaymentFailed(Payment $payment, array $gatewayResponse, string $status = 'failed'): void
    {
        $gatewayResponse = array_merge($payment->gateway_response ?? [], [
            'failure_response' => $gatewayResponse,
            'failed_at' => now()->toISOString(),
        ]);

        if ($payment->coupon_id && empty($gatewayResponse['coupon_released_at'])) {
            Coupon::whereKey($payment->coupon_id)
                ->where('used_count', '>', 0)
                ->decrement('used_count');

            $gatewayResponse['coupon_released_at'] = now()->toISOString();
        }

        $payment->update([
            'status' => $status,
            'gateway_response' => $gatewayResponse,
        ]);
    }

    private function findPaymentFromGatewayPayload(array $payload, bool $lock = false): ?Payment
    {
        $metadata = $payload['metadata'] ?? [];
        $paymentId = $metadata['payment_id'] ?? null;
        $gatewayInvoiceId = $payload['invoice_id'] ?? $payload['transaction_id'] ?? null;

        $query = Payment::query();

        if ($lock) {
            $query->lockForUpdate();
        }

        if ($paymentId) {
            $payment = (clone $query)->whereKey($paymentId)->first();

            if ($payment) {
                return $payment;
            }
        }

        if ($gatewayInvoiceId) {
            return $query->where('transaction_id', $gatewayInvoiceId)->first();
        }

        return null;
    }

    private function metadataMatchesPayment(array $metadata, Payment $payment): bool
    {
        if (! empty($metadata['payment_id']) && (string) $metadata['payment_id'] !== (string) $payment->id) {
            return false;
        }

        if (! empty($metadata['user_id']) && (int) $metadata['user_id'] !== (int) $payment->user_id) {
            return false;
        }

        if (! empty($metadata['course_id']) && (int) $metadata['course_id'] !== (int) $payment->course_id) {
            return false;
        }

        return true;
    }

    private function releaseExpiredPendingPayments(): void
    {
        $minutes = max(5, (int) config('services.uddoktapay.pending_payment_expires_minutes', 30));

        Payment::query()
            ->where('status', 'pending')
            ->where('method', 'uddoktapay')
            ->whereNull('gateway_response->verified_response')
            ->where('created_at', '<', now()->subMinutes($minutes))
            ->orderBy('created_at')
            ->limit(100)
            ->get()
            ->each(function (Payment $payment) {
                $this->failPendingPayment($payment, [
                    'message' => 'Pending payment expired before completion.',
                    'expired_by' => 'checkout_cleanup',
                ], 'failed');
            });
    }

    private function findApplicableCoupon(string $code, Course $course, bool $lock = false): ?Coupon
    {
        $query = Coupon::query()
            ->where('code', strtoupper(trim($code)))
            ->where('is_active', true)
            ->where(function ($query) use ($course) {
                $query->whereNull('course_id')->orWhere('course_id', $course->id);
            });

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function couponCanBeUsed(Coupon $coupon): bool
    {
        return $coupon->is_active
            && ($coupon->expires_at === null || $coupon->expires_at->isFuture())
            && ($coupon->max_uses === null || $coupon->used_count < $coupon->max_uses);
    }

    private function discountAmount(Coupon $coupon, float $basePrice): float
    {
        $discount = $coupon->type === 'percentage'
            ? ($basePrice * (float) $coupon->value) / 100
            : (float) $coupon->value;

        return min($basePrice, round($discount, 2));
    }

    private function moneyValue($value): float
    {
        return (float) str_replace(',', '', (string) ($value ?? 0));
    }

    private function isGatewayPendingStatus(?string $status): bool
    {
        return in_array(strtoupper((string) $status), ['PENDING', 'PROCESSING', 'WAITING', 'UNDER_REVIEW'], true);
    }

    private function isBankPaymentPayload(array $payload): bool
    {
        foreach ($this->flattenPayloadStrings($payload) as $value) {
            $normalized = strtolower($value);

            if (
                str_contains($normalized, 'bank')
                || str_contains($normalized, 'account_number')
                || str_contains($normalized, 'routing_number')
                || str_contains($normalized, 'swift')
            ) {
                return true;
            }
        }

        return false;
    }

    private function bankDetailsFromGatewayPayload(array $payload): array
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

    private function flattenPayloadStrings($value): array
    {
        if (is_string($value) || is_numeric($value)) {
            return [(string) $value];
        }

        if (! is_array($value)) {
            return [];
        }

        $strings = [];

        foreach ($value as $key => $item) {
            $strings[] = (string) $key;
            $strings = array_merge($strings, $this->flattenPayloadStrings($item));
        }

        return $strings;
    }

    private function createEnrollment($userId, $courseId, $price): void
    {
        DB::table('enrollments')->updateOrInsert(
            [
                'user_id' => $userId,
                'course_id' => $courseId,
            ],
            [
                'enrolled_price' => $price,
                'status' => 'active',
                'enrolled_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        AdminNotificationDispatcher::newEnrollment($userId, $courseId, $price);

        $this->notifyStudentEnrollment($userId, $courseId);
    }

    private function sendInvoiceEmail(Payment $payment): void
    {
        app(PaymentInvoiceEmailService::class)->sendIfNeeded($payment);
    }

    private function notifyStudentEnrollment($userId, $courseId): void
    {
        $course = Course::query()
            ->select('id', 'title', 'slug')
            ->find($courseId);

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
            (int) $userId,
            'admin_message',
            'Enrollment confirmed',
            'You are now enrolled in ' . $course->title . '.',
            $firstLessonId ? '/dashboard/player/' . $course->slug . '/' . $firstLessonId : '/dashboard/my-courses',
            [
                'course_id' => $course->id,
                'course_slug' => $course->slug,
                'first_lesson_id' => $firstLessonId,
            ]
        );
    }
}
