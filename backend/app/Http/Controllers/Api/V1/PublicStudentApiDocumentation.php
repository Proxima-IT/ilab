<?php

namespace App\Http\Controllers\Api\V1;

use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Public Catalog', description: 'Public website data used by the web app and mobile apps')]
#[OA\Tag(name: 'Newsletter', description: 'Public newsletter subscription endpoint')]
#[OA\Tag(name: 'Student Profile', description: 'Authenticated student profile endpoints')]
#[OA\Tag(name: 'Student Notifications', description: 'Authenticated student notification endpoints')]
#[OA\Tag(name: 'Student Q&A', description: 'Authenticated student course question and answer endpoints')]
final class PublicStudentApiDocumentation
{
    #[OA\Get(
        path: '/api/v1/categories',
        summary: 'List public categories',
        description: 'Returns published categories for course or blog content.',
        tags: ['Public Catalog'],
        parameters: [
            new OA\Parameter(
                name: 'type',
                in: 'query',
                required: false,
                description: 'Category type. Defaults to course.',
                schema: new OA\Schema(type: 'string', enum: ['course', 'blog'], example: 'course')
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Categories retrieved successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function categories(): void
    {
    }

    #[OA\Get(
        path: '/api/v1/reviews',
        summary: 'List public reviews',
        description: 'Returns published student/customer reviews with pagination.',
        tags: ['Public Catalog'],
        parameters: [
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                required: false,
                description: 'Items per page, from 1 to 12.',
                schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 12, example: 6)
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Reviews retrieved successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function reviews(): void
    {
    }

    #[OA\Get(
        path: '/api/v1/website-settings',
        summary: 'Get public website settings',
        description: 'Returns public home page settings, system contact data, and social media links.',
        tags: ['Public Catalog'],
        responses: [
            new OA\Response(response: 200, description: 'Website settings retrieved successfully'),
        ]
    )]
    public function websiteSettings(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/newsletter/subscribe',
        summary: 'Subscribe to newsletter',
        tags: ['Newsletter'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'student@example.com'),
                    new OA\Property(property: 'source', type: 'string', nullable: true, example: 'footer'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Subscription successful'),
            new OA\Response(response: 409, description: 'This email is already subscribed'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function newsletterSubscribe(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/auth/verify-email',
        summary: 'Verify student email',
        description: 'Verifies a manual registration email OTP and returns a student Bearer token.',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'otp', 'device_id', 'platform'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'student@example.com'),
                    new OA\Property(property: 'otp', type: 'string', example: '123456'),
                    new OA\Property(property: 'device_id', type: 'string', example: 'web-browser-uuid-123'),
                    new OA\Property(property: 'platform', type: 'string', enum: ['web', 'android', 'ios'], example: 'web'),
                    new OA\Property(property: 'fcm_token', type: 'string', nullable: true, example: 'firebase-token'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Email verified successfully'),
            new OA\Response(response: 400, description: 'Invalid or expired verification code'),
            new OA\Response(response: 404, description: 'Student account not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function verifyEmail(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/auth/resend-email-verification',
        summary: 'Resend email verification code',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'student@example.com'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Verification code sent when required'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function resendEmailVerification(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/auth/forgot-password',
        summary: 'Request password reset OTP',
        tags: ['Password Recovery'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['identifier'],
                properties: [
                    new OA\Property(property: 'identifier', type: 'string', format: 'email', example: 'student@example.com'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Password reset code sent when account exists'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function forgotPassword(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/auth/reset-password',
        summary: 'Reset password with OTP',
        tags: ['Password Recovery'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['identifier', 'otp', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'identifier', type: 'string', format: 'email', example: 'student@example.com'),
                    new OA\Property(property: 'otp', type: 'string', example: '123456'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'SecurePass123!'),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'SecurePass123!'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Password reset successfully'),
            new OA\Response(response: 400, description: 'Invalid or expired OTP'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function resetPassword(): void
    {
    }

    #[OA\Get(
        path: '/api/v1/student/profile',
        summary: 'Get authenticated student profile',
        security: [['sanctum' => []]],
        tags: ['Student Profile'],
        responses: [
            new OA\Response(response: 200, description: 'Profile retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Only student accounts can access this endpoint'),
        ]
    )]
    public function studentProfileShow(): void
    {
    }

    #[OA\Put(
        path: '/api/v1/student/profile',
        summary: 'Update authenticated student profile',
        security: [['sanctum' => []]],
        tags: ['Student Profile'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'John Doe'),
                    new OA\Property(property: 'phone', type: 'string', nullable: true, example: '01700000000'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'john@example.com'),
                    new OA\Property(property: 'bio', type: 'string', nullable: true, example: 'Frontend learner'),
                    new OA\Property(property: 'district', type: 'string', nullable: true, example: 'Dhaka'),
                    new OA\Property(property: 'education_level', type: 'string', nullable: true, example: 'Bachelor'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Profile updated successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function studentProfileUpdate(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/student/profile/avatar',
        summary: 'Upload student avatar',
        security: [['sanctum' => []]],
        tags: ['Student Profile'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['avatar'],
                    properties: [
                        new OA\Property(property: 'avatar', type: 'string', format: 'binary'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Avatar updated successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function studentAvatarUpload(): void
    {
    }

    #[OA\Put(
        path: '/api/v1/student/profile/password',
        summary: 'Change student password',
        security: [['sanctum' => []]],
        tags: ['Student Profile'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['current_password', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'current_password', type: 'string', format: 'password', example: 'OldPass123!'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'NewPass123!'),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'NewPass123!'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Password updated successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function studentPasswordUpdate(): void
    {
    }

    #[OA\Put(
        path: '/api/v1/student/profile/notifications',
        summary: 'Update legacy profile notification preferences',
        security: [['sanctum' => []]],
        tags: ['Student Profile'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['notification_prefs'],
                properties: [
                    new OA\Property(
                        property: 'notification_prefs',
                        properties: [
                            new OA\Property(property: 'email', type: 'boolean', example: true),
                            new OA\Property(property: 'sms', type: 'boolean', example: false),
                            new OA\Property(property: 'push', type: 'boolean', example: true),
                            new OA\Property(property: 'lecture', type: 'boolean', example: true),
                            new OA\Property(property: 'streak', type: 'boolean', example: false),
                            new OA\Property(property: 'congrats', type: 'boolean', example: true),
                        ],
                        type: 'object'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Notification preferences updated successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function studentProfileNotificationUpdate(): void
    {
    }

    #[OA\Put(
        path: '/api/v1/student/notifications/{id}/read',
        summary: 'Mark one notification as read',
        security: [['sanctum' => []]],
        tags: ['Student Notifications'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 12)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Notification marked as read'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Notification not found'),
        ]
    )]
    public function studentNotificationRead(): void
    {
    }

    #[OA\Get(
        path: '/api/v1/student/notification-settings',
        summary: 'Get student notification settings',
        security: [['sanctum' => []]],
        tags: ['Student Notifications'],
        responses: [
            new OA\Response(response: 200, description: 'Notification settings retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function studentNotificationSettings(): void
    {
    }

    #[OA\Put(
        path: '/api/v1/student/notification-settings',
        summary: 'Update student notification settings',
        security: [['sanctum' => []]],
        tags: ['Student Notifications'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'new_lecture', type: 'boolean', example: true),
                    new OA\Property(property: 'special_offer', type: 'boolean', example: true),
                    new OA\Property(property: 'event', type: 'boolean', example: true),
                    new OA\Property(property: 'profile_update', type: 'boolean', example: true),
                    new OA\Property(property: 'course_completion', type: 'boolean', example: true),
                    new OA\Property(property: 'certificate_ready', type: 'boolean', example: true),
                    new OA\Property(property: 'admin_message', type: 'boolean', example: true),
                    new OA\Property(property: 'qna_answer', type: 'boolean', example: true),
                    new OA\Property(property: 'email', type: 'boolean', example: true),
                    new OA\Property(property: 'sms', type: 'boolean', example: false),
                    new OA\Property(property: 'push', type: 'boolean', example: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Notification settings updated successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function studentNotificationSettingsUpdate(): void
    {
    }

    #[OA\Get(
        path: '/api/v1/student/qna',
        summary: 'List authenticated student Q&A',
        description: 'Returns the latest questions asked by the authenticated student with answers and lesson/course details.',
        security: [['sanctum' => []]],
        tags: ['Student Q&A'],
        responses: [
            new OA\Response(response: 200, description: 'Q&A retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function studentQnaIndex(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/checkout/coupon/preview',
        summary: 'Preview coupon discount',
        description: 'Checks whether a coupon is usable for a course and returns the calculated final amount.',
        security: [['sanctum' => []]],
        tags: ['Checkout & Enrollment'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['course_id', 'coupon_code'],
                properties: [
                    new OA\Property(property: 'course_id', type: 'integer', example: 1),
                    new OA\Property(property: 'coupon_code', type: 'string', example: 'WELCOME50'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Coupon is available'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Invalid, expired, fully used coupon, or validation error'),
        ]
    )]
    public function couponPreview(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/webhook/uddoktapay',
        summary: 'UddoktaPay webhook callback',
        description: 'Payment gateway callback endpoint. This is called by UddoktaPay, not by the client app.',
        tags: ['Checkout & Enrollment'],
        parameters: [
            new OA\Parameter(
                name: 'RT-UDDOKTAPAY-API-KEY',
                in: 'header',
                required: true,
                description: 'Configured UddoktaPay API key',
                schema: new OA\Schema(type: 'string')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['invoice_id'],
                properties: [
                    new OA\Property(property: 'invoice_id', type: 'string', example: 'INV-123456'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Webhook processed'),
            new OA\Response(response: 401, description: 'Unauthorized webhook'),
            new OA\Response(response: 422, description: 'Invoice ID missing'),
        ]
    )]
    public function uddoktapayWebhook(): void
    {
    }

    #[OA\Get(
        path: '/api/v1/checkout/uddoktapay/success',
        summary: 'UddoktaPay success redirect',
        description: 'Payment gateway success redirect. Verifies payment and redirects the user to the frontend.',
        tags: ['Checkout & Enrollment'],
        parameters: [
            new OA\Parameter(name: 'invoice_id', in: 'query', required: true, schema: new OA\Schema(type: 'string', example: 'INV-123456')),
        ],
        responses: [
            new OA\Response(response: 302, description: 'Redirects to frontend success or pending page'),
        ]
    )]
    public function uddoktapaySuccess(): void
    {
    }

    #[OA\Get(
        path: '/api/v1/checkout/uddoktapay/cancel',
        summary: 'UddoktaPay cancel redirect',
        description: 'Payment gateway cancel redirect. Marks pending payment failed when possible and redirects to frontend.',
        tags: ['Checkout & Enrollment'],
        parameters: [
            new OA\Parameter(name: 'invoice_id', in: 'query', required: false, schema: new OA\Schema(type: 'string', example: 'INV-123456')),
        ],
        responses: [
            new OA\Response(response: 302, description: 'Redirects to frontend cancelled page'),
        ]
    )]
    public function uddoktapayCancel(): void
    {
    }

    #[OA\Get(
        path: '/api/v1/learn/resources',
        summary: 'List enrolled course resources',
        description: 'Returns enrolled courses, modules, lessons, and active Google Drive/resource URLs only when resources exist.',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        responses: [
            new OA\Response(response: 200, description: 'Resources retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function learningResources(): void
    {
    }

    #[OA\Get(
        path: '/api/v1/learn/courses/{slug}/player/{lesson}',
        summary: 'Get lesson player data',
        description: 'Returns secure lesson player data for enrolled students, including YouTube embed URL, watermark identity, notes, resources, progress, and Q&A.',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        parameters: [
            new OA\Parameter(name: 'slug', in: 'path', required: true, schema: new OA\Schema(type: 'string', example: 'web-development-masterclass')),
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 10)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lesson player retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Student is not enrolled'),
            new OA\Response(response: 404, description: 'Course or lesson not found'),
        ]
    )]
    public function lessonPlayer(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/learn/lessons/{lesson}/notes',
        summary: 'Save lesson note',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        parameters: [
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 10)),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['note'],
                properties: [
                    new OA\Property(property: 'note', type: 'string', example: 'Important concept about components.'),
                    new OA\Property(property: 'timestamp_seconds', type: 'integer', nullable: true, example: 145),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Note saved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Student is not enrolled'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function lessonNoteStore(): void
    {
    }

    #[OA\Delete(
        path: '/api/v1/learn/lessons/{lesson}/notes/{note}',
        summary: 'Delete lesson note',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        parameters: [
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'note', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 5)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Note deleted successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Student is not enrolled'),
            new OA\Response(response: 404, description: 'Lesson not found'),
        ]
    )]
    public function lessonNoteDelete(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/learn/lessons/{lesson}/questions',
        summary: 'Ask a lesson question',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        parameters: [
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 10)),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['question'],
                properties: [
                    new OA\Property(property: 'question', type: 'string', example: 'Can you explain this topic again?'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Question submitted successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Student is not enrolled'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function lessonQuestionStore(): void
    {
    }

    #[OA\Post(
        path: '/api/v1/learn/lessons/{lesson}/questions/{question}/answers',
        summary: 'Answer a lesson question',
        description: 'Staff/instructor answer endpoint. Student apps normally read answers from the player or Q&A endpoints.',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        parameters: [
            new OA\Parameter(name: 'lesson', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 10)),
            new OA\Parameter(name: 'question', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 22)),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['answer'],
                properties: [
                    new OA\Property(property: 'answer', type: 'string', example: 'Here is the explanation...'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Answer submitted successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Only instructors or admins can answer'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function lessonQuestionAnswerStore(): void
    {
    }

    #[OA\Get(
        path: '/api/v1/student/progress/{course_id}',
        summary: 'Get student course progress',
        security: [['sanctum' => []]],
        tags: ['Learning Experience'],
        parameters: [
            new OA\Parameter(name: 'course_id', in: 'path', required: true, schema: new OA\Schema(type: 'integer', example: 1)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Course progress retrieved successfully'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Student is not enrolled'),
        ]
    )]
    public function studentCourseProgress(): void
    {
    }
}
