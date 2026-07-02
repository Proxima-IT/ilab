<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\SystemSetting;
use App\Support\AdminNotificationDispatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Checkout & Enrollment", description: "Secure course purchasing using UddoktaPay")]
class UddoktaPayCheckoutController extends Controller
{
    #[OA\Post(
        path: "/api/v1/checkout/init",
        summary: "Initialize UddoktaPay Checkout",
        description: "Calculates the final price securely and returns the UddoktaPay payment URL. If the course is 100% free (via coupon or base price), it enrolls the user instantly.",
        security: [["sanctum" => []]],
        tags: ["Checkout & Enrollment"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["course_id"],
                properties: [
                    new OA\Property(property: "course_id", type: "integer", example: 1),
                    new OA\Property(property: "coupon_code", type: "string", example: "REACT50")
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200, 
                description: "Checkout initialized successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(
                            property: "data", 
                            type: "object",
                            properties: [
                                new OA\Property(property: "is_free", type: "boolean", example: false),
                                new OA\Property(property: "payment_url", type: "string", example: "https://pay.uddoktapay.com/checkout/12345")
                            ]
                        )
                    ]
                )
            ),
            new OA\Response(response: 400, description: "Invalid coupon or already enrolled")
        ]
    )]
    public function initiatePayment(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'coupon_code' => 'nullable|string'
        ]);

        $user = $request->user();
        $course = Course::where('id', $request->course_id)->where('status', 'published')->firstOrFail();
        $paymentSettings = SystemSetting::section('payments');

        // 1. Prevent double enrollment
        $alreadyEnrolled = DB::table('enrollments')
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->exists();

        if ($alreadyEnrolled) {
            return response()->json(['success' => false, 'message' => 'You are already enrolled.'], 400);
        }

        // 2. Calculate Final Price Server-Side
        $basePrice = $course->discount_price ?? $course->price;
        $discountAmount = 0;
        $couponId = null;

        if ($request->filled('coupon_code')) {
            $coupon = DB::table('coupons')
                ->where('code', strtoupper($request->coupon_code))
                ->where('is_active', true)
                ->where(function ($query) use ($course) {
                    $query->whereNull('course_id')->orWhere('course_id', $course->id);
                })
                ->where('expires_at', '>', now())
                ->first();

            if (!$coupon) {
                return response()->json(['success' => false, 'message' => 'Invalid or expired coupon.'], 400);
            }

            if ($coupon->max_uses !== null && $coupon->used_count >= $coupon->max_uses) {
                return response()->json(['success' => false, 'message' => 'Coupon usage limit reached.'], 400);
            }

            $discountAmount = $coupon->type === 'percentage' ? ($basePrice * $coupon->value) / 100 : $coupon->value;
            $couponId = $coupon->id;
        }

        $payableAmount = max(0, $basePrice - $discountAmount);

        // 3. Handle 100% Free Courses instantly (No UddoktaPay needed)
        if ($payableAmount == 0) {
            if (! ($paymentSettings['free_enrollment_enabled'] ?? true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Free enrollment is temporarily disabled.',
                ], 503);
            }

            $this->createEnrollment($user->id, $course->id, 0, $couponId);
            return response()->json([
                'success' => true,
                'data' => ['is_free' => true, 'redirect_url' => '/dashboard'],
                'message' => 'Enrolled successfully for free!'
            ]);
        }

        if (! ($paymentSettings['uddoktapay_enabled'] ?? true)) {
            return response()->json([
                'success' => false,
                'message' => 'Online payment is temporarily disabled. Please contact support.',
            ], 503);
        }

        // 4. Send Request to UddoktaPay API
        $response = Http::withHeaders([
            'RT-UDDOKTAPAY-API-KEY' => env('UDDOKTAPAY_API_KEY'),
        ])->post(env('UDDOKTAPAY_API_URL'), [
            'full_name' => $user->name,
            'email' => $user->email ?? 'student@domainname.com', // UP requires email
            'amount' => $payableAmount,
            'metadata' => [
                'user_id' => $user->id,
                'course_id' => $course->id,
                'coupon_id' => $couponId,
                'payable_amount' => $payableAmount
            ],
            'redirect_url' => url('/api/v1/checkout/uddoktapay/success'), // User sees this after paying
            'cancel_url' => url('/api/v1/checkout/uddoktapay/cancel'),
            'webhook_url' => url('/api/v1/webhook/uddoktapay'), // Server-to-server secret link
        ]);

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'is_free' => false,
                    'payment_url' => $response->json('payment_url') // React redirects to this URL
                ]
            ]);
        }

        Log::error('UddoktaPay Init Error: ' . $response->body());
        return response()->json(['success' => false, 'message' => 'Payment gateway unavailable.'], 500);
    }

    /**
     * The Webhook called securely by UddoktaPay server.
     * This is PUBLIC (no Sanctum) and specifically NOT documented in Swagger.
     */
    public function webhook(Request $request)
    {
        if ($request->header('RT-UDDOKTAPAY-API-KEY') !== env('UDDOKTAPAY_API_KEY')) {
            Log::warning('Unauthorized Webhook attempt');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $status = $request->input('status');
        
        if ($status === 'COMPLETED') {
            $metadata = $request->input('metadata');
            
            $userId = $metadata['user_id'];
            $courseId = $metadata['course_id'];
            $payableAmount = $metadata['payable_amount'];
            $couponId = $metadata['coupon_id'] ?? null;

            $exists = DB::table('enrollments')
                ->where('user_id', $userId)
                ->where('course_id', $courseId)
                ->exists();

            if (!$exists) {
                $this->createEnrollment($userId, $courseId, $payableAmount, $couponId);
            }
        }

        return response()->json(['message' => 'Processed']);
    }

    /**
     * Helper logic to keep code DRY
     */
    private function createEnrollment($userId, $courseId, $price, $couponId = null)
    {
        DB::beginTransaction();
        try {
            DB::table('enrollments')->insert([
                'user_id' => $userId,
                'course_id' => $courseId,
                'enrolled_price' => $price,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($couponId) {
                DB::table('coupons')->where('id', $couponId)->increment('used_count');
            }
            DB::commit();

            AdminNotificationDispatcher::newEnrollment($userId, $courseId, $price);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to insert enrollment: " . $e->getMessage());
        }
    }
}
