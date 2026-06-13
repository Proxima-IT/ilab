<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\StudentProfileController;
use App\Http\Controllers\Api\V1\UddoktaPayCheckoutController;
use App\Http\Controllers\Api\V1\Admin\AdminProfileController;

use App\Http\Controllers\Api\V1\LessonController;
use App\Http\Controllers\Api\V1\ProgressController;
use App\Http\Controllers\Api\V1\Admin\StaffController;
use App\Http\Controllers\Api\V1\Admin\CategoryController;
use App\Http\Controllers\Api\V1\Admin\CourseController;
use App\Http\Controllers\Api\V1\Admin\SectionController;
use App\Http\Controllers\Api\V1\Admin\LessonController as AdminLessonController;




// Version 1 API Routing
Route::prefix('v1')->group(function () {

    // Public Authentication Routes
    Route::middleware('throttle:60,1')->prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);


        Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
        Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
    });




    // ==========================================
// PUBLIC COURSE CATALOG APIs
// ==========================================
    Route::prefix('courses')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\V1\CourseController::class, 'index']);
        Route::get('/{slug}', [\App\Http\Controllers\Api\V1\CourseController::class, 'show']);
    });



    // ==========================================
// PUBLIC WEBHOOKS (For UddoktaPay servers)
// ==========================================
    Route::post('/webhook/uddoktapay', [UddoktaPayCheckoutController::class, 'webhook']);

    // Optional: Simple redirects for the user after payment is done
    Route::get('/checkout/uddoktapay/success', function () {
        return redirect('https://domainname.com/dashboard/learning?payment=success'); // Redirect to React
    });
    Route::get('/checkout/uddoktapay/cancel', function () {
        return redirect('https://domainname.com/course-details?payment=failed'); // Redirect to React
    });

    // Protected Routes (Require valid Sanctum Bearer Token)
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::post('/checkout/init', [UddoktaPayCheckoutController::class, 'initiatePayment']);

        // ==========================================
        // STUDENT APIs (Documented in Swagger)
        // ==========================================
        Route::prefix('student')->group(function () {
            Route::get('/profile', [StudentProfileController::class, 'show']);
            Route::put('/profile', [StudentProfileController::class, 'update']);

            // 
        });

        // ==========================================
        // LEARNING EXPERIENCE (STUDENT APP)
        // ==========================================
        Route::prefix('learn')->group(function () {
            Route::get('/courses/{slug}/syllabus', [LessonController::class, 'getSyllabus']);
            Route::post('/lessons/{id}/complete', [ProgressController::class, 'markComplete']);

            // Add the new heartbeat route here
            Route::put('/lessons/{id}/time', [ProgressController::class, 'syncWatchTime']);
        });

        // ==========================================
        // ADMIN & INSTRUCTOR APIs (Hidden from Swagger)
        // ==========================================
        Route::prefix('admin')->group(function () {
            Route::get('/profile', [AdminProfileController::class, 'show']);
            Route::put('/profile', [AdminProfileController::class, 'update']);

            // Super Admin Only: Staff Management
            Route::get('/staff', [StaffController::class, 'index']);
            Route::post('/staff', [StaffController::class, 'store']);
            Route::delete('/staff/{id}', [StaffController::class, 'destroy']);


            // Course Catalog Management
            Route::apiResource('categories', CategoryController::class);
            Route::apiResource('courses', CourseController::class);
            Route::apiResource('sections', SectionController::class);
            Route::apiResource('lessons', AdminLessonController::class);

        });

    });
});