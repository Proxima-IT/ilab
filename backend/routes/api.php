<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;

// Version 1 API Routing
Route::prefix('v1')->group(function () {
    
    // Public Authentication Routes (Rate limited to prevent brute force)
    Route::middleware('throttle:60,1')->prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        // Google OAuth endpoints will go here later
    });

    // Protected Routes (Require valid Sanctum Bearer Token)
    Route::middleware('auth:sanctum')->group(function () {
        
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        
        // Return authenticated user profile
        Route::get('/user/profile', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => $request->user(),
            ]);
        });

        // Other protected modules (Courses, Payments, etc.) will be registered here
    });
});