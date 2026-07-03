<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Course;
use App\Models\Payment;
use App\Models\SystemSetting;
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
        tags: ["Checkout & Enrollment"]
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
            'amount' => $payableAmount,
            'metadata' => [
                'payment_id' => $payment->id,
                'user_id' => $user->id,
                'course_id' => $course->id,
                'coupon_id' => $payment->coupon_id,
                'payable_amount' => $payableAmount,
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
        $this->failPendingPayment($payment, $gatewayResponse);

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

    public function webhook(Request $request)
    {
        if ($request->header('RT-UDDOKTAPAY-API-KEY') !== $this->apiKey()) {
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

        return redirect($this->frontendUrl('/dashboard/my-courses?payment=pending'));
    }

    public function cancel(Request $request)
    {
        $invoiceId = $request->query('invoice_id');

        if ($invoiceId) {
            $payment = Payment::where('transaction_id', $invoiceId)->first();

            if ($payment && $payment->status === 'pending') {
                $this->failPendingPayment($payment, ['cancel_response' => $request->query()]);
            }
        }

        return redirect($this->frontendUrl('/courses?payment=cancelled'));
    }

    private function completeVerifiedPayment(array $verified, array $sourcePayload = []): ?Payment
    {
        $metadata = $verified['metadata'] ?? [];
        $gatewayInvoiceId = $verified['invoice_id'] ?? $verified['transaction_id'] ?? null;
        $paymentId = $metadata['payment_id'] ?? null;

        return DB::transaction(function () use ($verified, $sourcePayload, $metadata, $gatewayInvoiceId, $paymentId) {
            $payment = $paymentId
                ? Payment::whereKey($paymentId)->lockForUpdate()->first()
                : null;

            if (! $payment && $gatewayInvoiceId) {
                $payment = Payment::where('transaction_id', $gatewayInvoiceId)->lockForUpdate()->first();
            }

            if (! $payment) {
                Log::warning('Verified UddoktaPay payment could not be matched.', [
                    'invoice_id' => $gatewayInvoiceId,
                    'metadata' => $metadata,
                ]);

                return null;
            }

            $verifiedAmount = $this->moneyValue($verified['amount'] ?? $verified['payable_amount'] ?? $payment->amount);

            if (round($verifiedAmount, 2) < round($this->moneyValue($payment->amount), 2)) {
                Log::warning('UddoktaPay amount mismatch.', [
                    'payment_id' => $payment->id,
                    'expected' => (float) $payment->amount,
                    'verified' => $verifiedAmount,
                ]);

                return $payment;
            }

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
                    ]),
                ]);
            }

            return $payment;
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

    private function failPendingPayment(Payment $payment, array $gatewayResponse): void
    {
        DB::transaction(function () use ($payment, $gatewayResponse) {
            $lockedPayment = Payment::whereKey($payment->id)->lockForUpdate()->first();

            if (! $lockedPayment || $lockedPayment->status !== 'pending') {
                return;
            }

            $lockedPayment->update([
                'status' => 'failed',
                'gateway_response' => array_merge($lockedPayment->gateway_response ?? [], [
                    'failure_response' => $gatewayResponse,
                ]),
            ]);

            if ($lockedPayment->coupon_id) {
                Coupon::whereKey($lockedPayment->coupon_id)
                    ->where('used_count', '>', 0)
                    ->decrement('used_count');
            }
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
    }
}
