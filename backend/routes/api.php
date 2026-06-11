<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\StudentProfileController;
use App\Http\Controllers\Api\V1\Admin\AdminProfileController;

// Version 1 API Routing
Route::prefix('v1')->group(function () {
    
    // Public Authentication Routes
    Route::middleware('throttle:60,1')->prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);

        
        Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
        Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
    });

    // Protected Routes (Require valid Sanctum Bearer Token)
    Route::middleware('auth:sanctum')->group(function () {
        
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        
        // ==========================================
        // STUDENT APIs (Documented in Swagger)
        // ==========================================
        Route::prefix('student')->group(function () {
            Route::get('/profile', [StudentProfileController::class, 'show']);
            Route::put('/profile', [StudentProfileController::class, 'update']);
        });

        // ==========================================
        // ADMIN & INSTRUCTOR APIs (Hidden from Swagger)
        // ==========================================
        Route::prefix('admin')->group(function () {
            Route::get('/profile', [AdminProfileController::class, 'show']);
            Route::put('/profile', [AdminProfileController::class, 'update']);
            
            // Future admin routes will go here:
            // Route::apiResource('/courses', AdminCourseController::class);
        });

    });
});