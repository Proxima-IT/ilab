<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SwaggerConfig;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\StudentProfileController;
use App\Http\Controllers\Api\V1\CourseController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\EventController;
use App\Http\Controllers\Api\V1\BlogPostController;
use App\Http\Controllers\Api\V1\LessonController;
use App\Http\Controllers\Api\V1\ProgressController;
use App\Http\Controllers\Api\V1\CertificateController;
use App\Http\Controllers\Api\V1\StudentNotificationController;
use App\Http\Controllers\Api\V1\StudentQnaController;
use App\Http\Controllers\Api\V1\NewsletterSubscriberController;
use App\Http\Controllers\Api\V1\WebsiteSettingController;
use App\Http\Controllers\Api\V1\UddoktaPayCheckoutController;
use App\Http\Controllers\Api\V1\Admin\AdminProfileController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\StaffController;
use App\Http\Controllers\Api\V1\Admin\StudentController as AdminStudentController;
use App\Http\Controllers\Api\V1\Admin\InstructorController as AdminInstructorController;
use App\Http\Controllers\Api\V1\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Api\V1\Admin\SectionController;
use App\Http\Controllers\Api\V1\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Api\V1\Admin\LessonResourceController as AdminLessonResourceController;
use App\Http\Controllers\Api\V1\Admin\CouponController;
use App\Http\Controllers\Api\V1\Admin\EnrollmentController as AdminEnrollmentController;
use App\Http\Controllers\Api\V1\Admin\CertificateController as AdminCertificateController;
use App\Http\Controllers\Api\V1\Admin\StudentProgressController as AdminStudentProgressController;
use App\Http\Controllers\Api\V1\Admin\QnaController as AdminQnaController;
use App\Http\Controllers\Api\V1\Admin\ActivityController as AdminActivityController;
use App\Http\Controllers\Api\V1\Admin\NotificationController as AdminNotificationController;
use App\Http\Controllers\Api\V1\Admin\NewsletterSubscriberController as AdminNewsletterSubscriberController;
use App\Http\Controllers\Api\V1\Admin\EventController as AdminEventController;
use App\Http\Controllers\Api\V1\Admin\BlogPostController as AdminBlogPostController;
use App\Http\Controllers\Api\V1\Admin\WebsiteSettingController as AdminWebsiteSettingController;
use App\Http\Controllers\Api\V1\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Api\V1\Admin\SystemSettingController as AdminSystemSettingController;

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | System
    |--------------------------------------------------------------------------
    */
    Route::get('/health-check', [SwaggerConfig::class, 'healthCheck'])
        ->middleware('throttle:30,1');

    /*
    |--------------------------------------------------------------------------
    | Public Authentication Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('auth')
        ->group(function () {
            Route::post('/register', [AuthController::class, 'register'])
                ->middleware('throttle:20,1');
            Route::post('/login', [AuthController::class, 'login'])
                ->middleware('throttle:30,1');
            Route::post('/google', [AuthController::class, 'googleLogin'])
                ->middleware('throttle:30,1');
            Route::post('/verify-email', [AuthController::class, 'verifyEmail'])
                ->middleware('throttle:20,1');
            Route::post('/resend-email-verification', [AuthController::class, 'resendEmailVerification'])
                ->middleware('throttle:5,1');

            Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword'])
                ->middleware('throttle:10,1');
            Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])
                ->middleware('throttle:10,1');
        });

    /*
    |--------------------------------------------------------------------------
    | Public Course Catalog Routes
    |--------------------------------------------------------------------------
    */
    Route::get('/categories', [CategoryController::class, 'index'])
        ->middleware('throttle:60,1');

    Route::get('/reviews', [ReviewController::class, 'index'])
        ->middleware('throttle:60,1');

    Route::get('/website-settings', [WebsiteSettingController::class, 'index'])
        ->middleware('throttle:60,1');

    Route::post('/newsletter/subscribe', [NewsletterSubscriberController::class, 'store'])
        ->middleware('throttle:5,1');

    Route::prefix('events')
        ->middleware('throttle:60,1')
        ->group(function () {
            Route::get('/', [EventController::class, 'index']);
            Route::get('/{slug}', [EventController::class, 'show'])
                ->where('slug', '[A-Za-z0-9\-]+');
            Route::post('/{slug}/registrations', [EventController::class, 'register'])
                ->middleware('throttle:10,1')
                ->where('slug', '[A-Za-z0-9\-]+');
        });

    Route::prefix('blog-posts')
        ->middleware('throttle:60,1')
        ->group(function () {
            Route::get('/', [BlogPostController::class, 'index']);
            Route::get('/{slug}', [BlogPostController::class, 'show'])
                ->where('slug', '[A-Za-z0-9\-]+');
        });

    Route::prefix('courses')
        ->middleware('throttle:60,1')
        ->group(function () {
            Route::get('/', [CourseController::class, 'index']);
            Route::get('/{slug}', [CourseController::class, 'show'])
                ->where('slug', '[A-Za-z0-9\-]+');
        });

    /*
    |--------------------------------------------------------------------------
    | Public Payment Webhook Routes
    |--------------------------------------------------------------------------
    */
    Route::post('/webhook/uddoktapay', [UddoktaPayCheckoutController::class, 'webhook'])
        ->middleware('throttle:30,1');

    /*
    |--------------------------------------------------------------------------
    | Public Payment Redirect Routes
    |--------------------------------------------------------------------------
    */
    Route::get('/checkout/uddoktapay/success', [UddoktaPayCheckoutController::class, 'success'])
        ->middleware('throttle:30,1');

    Route::get('/checkout/uddoktapay/cancel', [UddoktaPayCheckoutController::class, 'cancel'])
        ->middleware('throttle:30,1');

    /*
    |--------------------------------------------------------------------------
    | Protected User Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);

        /*
        |--------------------------------------------------------------------------
        | Payment Routes
        |--------------------------------------------------------------------------
        */
        Route::post('/checkout/init', [UddoktaPayCheckoutController::class, 'initiatePayment'])
            ->middleware('throttle:20,1');
        Route::post('/checkout/coupon/preview', [UddoktaPayCheckoutController::class, 'previewCoupon'])
            ->middleware('throttle:30,1');
        Route::get('/checkout/payments/{payment}', [UddoktaPayCheckoutController::class, 'invoice'])
            ->middleware('throttle:30,1');

        /*
        |--------------------------------------------------------------------------
        | Student Routes
        |--------------------------------------------------------------------------
        */
        Route::prefix('student')->group(function () {
            Route::get('/profile', [StudentProfileController::class, 'show']);
            Route::put('/profile', [StudentProfileController::class, 'update']);
            Route::post('/profile/avatar', [StudentProfileController::class, 'updateAvatar']);
            Route::put('/profile/password', [StudentProfileController::class, 'updatePassword']);
            Route::put('/profile/notifications', [StudentProfileController::class, 'updateNotifications']);
            Route::get('/certificates', [CertificateController::class, 'index']);
            Route::get('/notifications', [StudentNotificationController::class, 'index']);
            Route::get('/qna', [StudentQnaController::class, 'index']);
            Route::put('/notifications/{id}/read', [StudentNotificationController::class, 'markRead'])
                ->whereNumber('id');
            Route::get('/notification-settings', [StudentNotificationController::class, 'settings']);
            Route::put('/notification-settings', [StudentNotificationController::class, 'updateSettings']);

            Route::get('/progress/{course_id}', [ProgressController::class, 'courseProgress'])
                ->whereNumber('course_id');
        });

        /*
        |--------------------------------------------------------------------------
        | Learning Routes
        |--------------------------------------------------------------------------
        */
        Route::prefix('learn')->group(function () {
            Route::get('/resources', [LessonController::class, 'resources']);

            Route::get('/courses/{slug}/syllabus', [LessonController::class, 'getSyllabus'])
                ->where('slug', '[A-Za-z0-9\-]+');

            Route::get('/courses/{slug}/player/{lesson}', [LessonController::class, 'player'])
                ->where('slug', '[A-Za-z0-9\-]+')
                ->whereNumber('lesson');

            Route::post('/lessons/{id}/complete', [ProgressController::class, 'markComplete'])
                ->whereNumber('id');

            Route::put('/lessons/{id}/time', [ProgressController::class, 'syncWatchTime'])
                ->whereNumber('id')
                ->middleware('throttle:60,1');

            Route::post('/lessons/{lesson}/notes', [LessonController::class, 'storeNote'])
                ->whereNumber('lesson');
            Route::delete('/lessons/{lesson}/notes/{note}', [LessonController::class, 'deleteNote'])
                ->whereNumber('lesson')
                ->whereNumber('note');
            Route::post('/lessons/{lesson}/questions', [LessonController::class, 'storeQuestion'])
                ->whereNumber('lesson')
                ->middleware('throttle:20,1');
            Route::post('/lessons/{lesson}/questions/{question}/answers', [LessonController::class, 'storeAnswer'])
                ->whereNumber('lesson')
                ->whereNumber('question')
                ->middleware('throttle:20,1');
        });

        /*
        |--------------------------------------------------------------------------
        | Admin Routes
        |--------------------------------------------------------------------------
        | Important:
        | Add role/permission middleware after creating it.
        | Example: ->middleware(['auth:sanctum', 'role:admin'])
        |--------------------------------------------------------------------------
        */
        Route::prefix('admin')
            ->middleware(['can:access-admin-panel', 'admin.activity'])
            ->group(function () {
                Route::get('/profile', [AdminProfileController::class, 'show']);
                Route::put('/profile', [AdminProfileController::class, 'update']);
                Route::post('/profile/avatar', [AdminProfileController::class, 'updateAvatar']);

                Route::get('/dashboard', [DashboardController::class, 'index']);
                Route::get('/activity', [AdminActivityController::class, 'index'])
                    ->middleware('can:view-activity');
                Route::prefix('notifications')
                    ->middleware('can:send-student-notifications')
                    ->group(function () {
                        Route::get('/', [AdminNotificationController::class, 'index']);
                        Route::get('/summary', [AdminNotificationController::class, 'summary']);
                        Route::put('/{id}/read', [AdminNotificationController::class, 'markRead'])
                            ->whereNumber('id');
                        Route::get('/students', [AdminNotificationController::class, 'searchStudents']);
                        Route::get('/courses', [AdminNotificationController::class, 'courses']);
                        Route::get('/courses/{course}/students', [AdminNotificationController::class, 'courseStudents'])
                            ->whereNumber('course');
                        Route::post('/send', [AdminNotificationController::class, 'send']);
                    });
                Route::prefix('website-settings')
                    ->middleware('can:manage-website-settings')
                    ->group(function () {
                        Route::get('/', [AdminWebsiteSettingController::class, 'index']);
                        Route::put('/', [AdminWebsiteSettingController::class, 'update']);
                        Route::post('/images', [AdminWebsiteSettingController::class, 'uploadImage']);
                    });
                Route::prefix('system-settings')
                    ->middleware('can:manage-system-settings')
                    ->group(function () {
                        Route::get('/', [AdminSystemSettingController::class, 'index']);
                        Route::put('/', [AdminSystemSettingController::class, 'update']);
                    });

                /*
                |--------------------------------------------------------------------------
                | Super Admin Staff Management
                |--------------------------------------------------------------------------
                */
                Route::prefix('staff')
                    ->middleware('can:manage-staff')
                    ->group(function () {
                        Route::get('/', [StaffController::class, 'index']);
                        Route::post('/', [StaffController::class, 'store']);
                        Route::put('/{id}', [StaffController::class, 'update'])
                            ->whereNumber('id');
                        Route::delete('/{id}', [StaffController::class, 'destroy'])
                            ->whereNumber('id');
                    });

                Route::get('/students', [AdminStudentController::class, 'index'])
                    ->middleware('can:view-students');
                Route::get('/students/{id}', [AdminStudentController::class, 'show'])
                    ->middleware('can:view-students')
                    ->whereNumber('id');
                Route::post('/students', [AdminStudentController::class, 'store'])
                    ->middleware('can:manage-students');
                Route::put('/students/{id}', [AdminStudentController::class, 'update'])
                    ->middleware('can:manage-students')
                    ->whereNumber('id');
                Route::delete('/students/{id}', [AdminStudentController::class, 'destroy'])
                    ->middleware('can:manage-students')
                    ->whereNumber('id');

                Route::get('/instructors', [AdminInstructorController::class, 'index'])
                    ->middleware('can:view-instructors');
                Route::post('/instructors', [AdminInstructorController::class, 'store'])
                    ->middleware('can:manage-instructors');
                Route::post('/instructors/avatar', [AdminInstructorController::class, 'uploadAvatar'])
                    ->middleware('can:manage-instructors');
                Route::put('/instructors/{id}', [AdminInstructorController::class, 'update'])
                    ->middleware('can:manage-instructors')
                    ->whereNumber('id');
                Route::delete('/instructors/{id}', [AdminInstructorController::class, 'destroy'])
                    ->middleware('can:manage-instructors')
                    ->whereNumber('id');

                /*
                |--------------------------------------------------------------------------
                | Admin Content Management
                |--------------------------------------------------------------------------
                */
                Route::post('/categories/image', [AdminCategoryController::class, 'uploadImage']);
                Route::apiResource('categories', AdminCategoryController::class)->except(['show']);
                Route::get('/courses/options', [AdminCourseController::class, 'options']);
                Route::post('/courses/thumbnail', [AdminCourseController::class, 'uploadThumbnail']);
                Route::apiResource('courses', AdminCourseController::class);
                Route::apiResource('sections', SectionController::class);
                Route::apiResource('lessons', AdminLessonController::class);
                Route::apiResource('lesson-resources', AdminLessonResourceController::class)->only(['store', 'update', 'destroy']);
                Route::middleware('can:manage-publishing')->group(function () {
                    Route::post('/events/cover', [AdminEventController::class, 'uploadCover']);
                    Route::apiResource('events', AdminEventController::class);
                    Route::get('/events/{id}/registrations', [AdminEventController::class, 'registrations'])
                        ->whereNumber('id');

                    Route::post('/blog-posts/cover', [AdminBlogPostController::class, 'uploadCover']);
                    Route::apiResource('blog-posts', AdminBlogPostController::class);
                });
                Route::prefix('newsletter')
                    ->middleware('can:manage-newsletter')
                    ->group(function () {
                        Route::get('/subscribers', [AdminNewsletterSubscriberController::class, 'index']);
                        Route::put('/subscribers/{id}', [AdminNewsletterSubscriberController::class, 'update'])
                            ->whereNumber('id');
                        Route::delete('/subscribers/{id}', [AdminNewsletterSubscriberController::class, 'destroy'])
                            ->whereNumber('id');
                    });
                Route::middleware('can:manage-reviews')->group(function () {
                    Route::post('/reviews/avatar', [AdminReviewController::class, 'uploadAvatar']);
                    Route::apiResource('reviews', AdminReviewController::class);
                });

                /*
                |--------------------------------------------------------------------------
                | Admin Financial Management
                |--------------------------------------------------------------------------
                */
                Route::get('/coupons/options', [CouponController::class, 'options']);
                Route::apiResource('coupons', CouponController::class)->except(['show']);
                Route::get('/pending-payments', [AdminEnrollmentController::class, 'pendingPayments']);
                Route::put('/pending-payments/{payment}/approve', [AdminEnrollmentController::class, 'approvePendingPayment']);
                Route::put('/pending-payments/{payment}/reject', [AdminEnrollmentController::class, 'rejectPendingPayment']);
                Route::get('/enrollments/options', [AdminEnrollmentController::class, 'options']);
                Route::apiResource('enrollments', AdminEnrollmentController::class)->except(['show']);
                Route::prefix('qna')
                    ->middleware('can:manage-qna')
                    ->group(function () {
                        Route::get('/', [AdminQnaController::class, 'index']);
                        Route::post('/{question}/answers', [AdminQnaController::class, 'answer'])
                            ->whereNumber('question');
                        Route::put('/{question}/close', [AdminQnaController::class, 'close'])
                            ->whereNumber('question');
                    });
                Route::get('/student-progress/courses', [AdminStudentProgressController::class, 'courses'])
                    ->middleware('can:view-student-progress');
                Route::get('/student-progress', [AdminStudentProgressController::class, 'index'])
                    ->middleware('can:view-student-progress');
                Route::get('/certificates/options', [AdminCertificateController::class, 'options'])
                    ->middleware('can:manage-certificates');
                Route::get('/certificates', [AdminCertificateController::class, 'index'])
                    ->middleware('can:view-certificates');
                Route::post('/certificates', [AdminCertificateController::class, 'store'])
                    ->middleware('can:manage-certificates');
                Route::put('/certificates/{id}', [AdminCertificateController::class, 'update'])
                    ->middleware('can:manage-certificates');
                Route::delete('/certificates/{id}', [AdminCertificateController::class, 'destroy'])
                    ->middleware('can:manage-certificates');
            });
    });
});
