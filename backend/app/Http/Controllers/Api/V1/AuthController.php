<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Device;
use App\Rules\RealEmailExists;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Authentication", description: "Endpoints for user registration, login, and device tracking")]
class AuthController extends Controller
{
    #[OA\Post(
        path: "/api/v1/auth/register",
        summary: "Register a new student",
        description: "Creates a new student account. Emails/SMS are dispatched via queues to maintain <300ms response.",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "email", "password", "device_id", "platform"],
                properties: [
                    new OA\Property(property: "name", type: "string", example: "John Doe"),
                    new OA\Property(property: "email", type: "string", format: "email", example: "student@domain.com"),
                    new OA\Property(property: "phone", type: "string", example: "+8801700000000"),
                    new OA\Property(property: "password", type: "string", format: "password", example: "SecurePass123!"),
                    new OA\Property(property: "device_id", type: "string", example: "device-uuid-1234"),
                    new OA\Property(property: "platform", type: "string", example: "web")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "User registered successfully"),
            new OA\Response(response: 422, description: "Validation Errors")
        ]
    )]
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:users,phone', 
            'email' => [
                'nullable', 
                'email', 
                'unique:users,email', 
                new RealEmailExists() 
            ],
            'password' => 'required|string|min:8',
            'device_id' => 'required|string',
            'platform' => 'required|string|in:web,android,ios',
            'fcm_token' => 'nullable|string'
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'student',
        ]);

        $this->registerDevice($user->id, $validated);

        //otp send of mobile here

        $token = $user->createToken($validated['device_id'])->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => ['user' => $user, 'token' => $token],
            'message' => 'Registration successful. Please verify your phone number.'
        ], 201);
    }

    #[OA\Post(
        path: "/api/v1/auth/login",
        summary: "Login for both Admin and Students",
        description: "Validates credentials and enforces domain/role strictness.",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "password", "portal", "device_id", "platform"],
                properties: [
                    new OA\Property(property: "email", type: "string", example: "admin@domainname.com"),
                    new OA\Property(property: "password", type: "string", example: "password"),
                    new OA\Property(property: "portal", type: "string", enum: ["admin", "student"], example: "admin"),
                    new OA\Property(property: "device_id", type: "string", example: "browser-uuid-1234"),
                    new OA\Property(property: "platform", type: "string", example: "web")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Login successful"),
            new OA\Response(response: 401, description: "Invalid credentials"),
            new OA\Response(response: 403, description: "Unauthorized access to this portal")
        ]
    )]
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'portal' => 'required|in:admin,student',
            'device_id' => 'required|string',
            'platform' => 'required|string|in:web,android,ios',
            'fcm_token' => 'nullable|string'
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // --- Domain Isolation Logic ---
        if ($validated['portal'] === 'admin' && $user->role === 'student') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required for this portal.'
            ], 403);
        }

        // Optional: Keep admins out of the student frontend to prevent token confusion
        if ($validated['portal'] === 'student' && in_array($user->role, ['super_admin', 'admin', 'content_manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Please use the administrative portal to log in.'
            ], 403);
        }

        if (!$user->status) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been suspended.'
            ], 403);
        }

        $this->registerDevice($user->id, $validated);

        // Delete old tokens for this specific device to prevent buildup
        $user->tokens()->where('name', $validated['device_id'])->delete();
        $token = $user->createToken($validated['device_id'])->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => ['user' => $user, 'token' => $token],
            'message' => 'Login successful.'
        ], 200);
    }

    #[OA\Post(
        path: "/api/v1/auth/logout",
        summary: "Logout user and revoke token",
        security: [["sanctum" => []]],
        tags: ["Authentication"],
        responses: [
            new OA\Response(response: 200, description: "Logged out successfully")
        ]
    )]
    public function logout(Request $request)
    {
        // Mark the current device as inactive
        Device::where('user_id', $request->user()->id)
              ->where('device_id', $request->user()->currentAccessToken()->name)
              ->update(['is_active' => false]);

        // Revoke the exact token used for this request
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Logged out successfully.'
        ]);
    }

    /**
     * Helper method to track devices securely
     */
    private function registerDevice($userId, $data)
    {
        Device::updateOrCreate(
            ['user_id' => $userId, 'device_id' => $data['device_id']],
            [
                'platform' => $data['platform'],
                'fcm_token' => $data['fcm_token'] ?? null,
                'is_active' => true,
                'last_active_at' => now(),
            ]
        );
    }
}