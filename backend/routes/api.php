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
use App\Http\Controllers\Api\V1\WebsiteSettingController;
use App\Http\Controllers\Api\V1\UddoktaPayCheckoutController;
use App\Http\Controllers\Api\V1\Admin\AdminProfileController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\StaffController;
use App\Http\Controllers\Api\V1\Admin\StudentController as AdminStudentController;
use App\Http\Controllers\Api\V1\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Api\V1\Admin\SectionController;
use App\Http\Controllers\Api\V1\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Api\V1\Admin\CouponController;
use App\Http\Controllers\Api\V1\Admin\EnrollmentController as AdminEnrollmentController;
use App\Http\Controllers\Api\V1\Admin\EventController as AdminEventController;
use App\Http\Controllers\Api\V1\Admin\BlogPostController as AdminBlogPostController;
use App\Http\Controllers\Api\V1\Admin\WebsiteSettingController as AdminWebsiteSettingController;
use App\Http\Controllers\Api\V1\Admin\ReviewController as AdminReviewController;

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
        ->middleware('throttle:10,1')
        ->group(function () {
            Route::post('/register', [AuthController::class, 'register']);
            Route::post('/login', [AuthController::class, 'login']);
            Route::post('/google', [AuthController::class, 'googleLogin']);

            Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
            Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
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
    Route::get('/checkout/uddoktapay/success', function () {
        return redirect(config('app.frontend_url', 'https://domainname.com') . '/dashboard/learning?payment=success');
    })->middleware('throttle:30,1');

    Route::get('/checkout/uddoktapay/cancel', function () {
        return redirect(config('app.frontend_url', 'https://domainname.com') . '/course-details?payment=failed');
    })->middleware('throttle:30,1');

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
            ->middleware('can:access-admin-panel')
            ->group(function () {
                Route::get('/profile', [AdminProfileController::class, 'show']);
                Route::put('/profile', [AdminProfileController::class, 'update']);
                Route::post('/profile/avatar', [AdminProfileController::class, 'updateAvatar']);

                Route::get('/dashboard', [DashboardController::class, 'index']);
                Route::prefix('website-settings')
                    ->middleware('can:manage-website-settings')
                    ->group(function () {
                        Route::get('/', [AdminWebsiteSettingController::class, 'index']);
                        Route::put('/', [AdminWebsiteSettingController::class, 'update']);
                        Route::post('/images', [AdminWebsiteSettingController::class, 'uploadImage']);
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
                Route::post('/students', [AdminStudentController::class, 'store'])
                    ->middleware('can:manage-students');
                Route::put('/students/{id}', [AdminStudentController::class, 'update'])
                    ->middleware('can:manage-students')
                    ->whereNumber('id');
                Route::delete('/students/{id}', [AdminStudentController::class, 'destroy'])
                    ->middleware('can:manage-students')
                    ->whereNumber('id');

                /*
                |--------------------------------------------------------------------------
                | Admin Content Management
                |--------------------------------------------------------------------------
                */
                Route::apiResource('categories', AdminCategoryController::class);
                Route::apiResource('courses', AdminCourseController::class);
                Route::apiResource('sections', SectionController::class);
                Route::apiResource('lessons', AdminLessonController::class);
                Route::apiResource('events', AdminEventController::class);
                Route::get('/events/{id}/registrations', [AdminEventController::class, 'registrations'])
                    ->whereNumber('id');
                Route::apiResource('blog-posts', AdminBlogPostController::class);
                Route::middleware('can:manage-reviews')->group(function () {
                    Route::post('/reviews/avatar', [AdminReviewController::class, 'uploadAvatar']);
                    Route::apiResource('reviews', AdminReviewController::class);
                });

                /*
                |--------------------------------------------------------------------------
                | Admin Financial Management
                |--------------------------------------------------------------------------
                */
                Route::apiResource('coupons', CouponController::class);
                Route::apiResource('enrollments', AdminEnrollmentController::class);
            });
    });
});


