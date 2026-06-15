<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\User;
use Google\Client as GoogleClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Authentication', description: 'Endpoints for registration, login, Google login, logout, and device tracking')]
class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/v1/auth/register',
        summary: 'Register a new student',
        description: 'Phone number is required. Email is optional. Registration creates an unverified account and sends phone OTP.',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'name',
                    'phone',
                    'password',
                    'password_confirmation',
                    'device_id',
                    'platform'
                ],
                properties: [
                    new OA\Property(
                        property: 'name',
                        type: 'string',
                        example: 'John Doe'
                    ),
                    new OA\Property(
                        property: 'phone',
                        type: 'string',
                        example: '01700000000'
                    ),
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
                        nullable: true,
                        example: 'john@gmail.com'
                    ),
                    new OA\Property(
                        property: 'password',
                        type: 'string',
                        format: 'password',
                        example: 'SecurePass123!'
                    ),
                    new OA\Property(
                        property: 'password_confirmation',
                        type: 'string',
                        format: 'password',
                        example: 'SecurePass123!'
                    ),
                    new OA\Property(
                        property: 'device_id',
                        type: 'string',
                        example: 'web-browser-uuid-123'
                    ),
                    new OA\Property(
                        property: 'platform',
                        type: 'string',
                        enum: ['web', 'android', 'ios'],
                        example: 'web'
                    ),
                    new OA\Property(
                        property: 'fcm_token',
                        type: 'string',
                        nullable: true,
                        example: 'firebase-token'
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Registration successful'),
            new OA\Response(response: 409, description: 'Account exists but phone verification is pending'),
            new OA\Response(response: 422, description: 'Validation error')
        ]
    )]


    public function register(Request $request): JsonResponse
    {


        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'string', 'max:255', 'regex:/^[^\r\n]+$/', 'email:rfc,dns',],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()->symbols()],
            'device_id' => ['required', 'string', 'max:255'],
            'platform' => ['required', 'string', 'in:web,android,ios'],
            'fcm_token' => ['nullable', 'string', 'max:500'],
        ]);

        $existingUser = User::query()
            ->where('phone', $validated['phone'])
            ->when(!empty($validated['email']), function ($query) use ($validated) {
                $query->orWhere('email', $validated['email']);
            })
            ->first();

        if ($existingUser) {
            if (is_null($existingUser->phone_verified_at)) {
                $this->sendPhoneVerificationCode($existingUser);

                return response()->json([
                    'success' => false,
                    'data' => [
                        'verification_required' => true,
                        'phone' => $existingUser->phone,
                    ],
                    'message' => 'Account already exists but phone verification is pending. A new verification code has been sent.',
                    'errors' => null,
                ], 409);
            }

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'An account already exists with this phone number or email.',
                'errors' => [
                    'phone_or_email' => ['An account already exists with this phone number or email.'],
                ],
            ], 422);
        }

        $user = User::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'student',
            'status' => true,
            'phone_verified_at' => null,
            'email_verified_at' => null,
            'provider' => null,
            'provider_id' => null,
        ]);

        $this->registerDevice($user, $validated);
        $this->sendPhoneVerificationCode($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->safeUser($user),
                'verification_required' => true,
                'profile_completed' => false,
                'phone_verification_required' => true,
            ],
            'message' => 'Registration successful. A verification code has been sent to your phone number.',
            'errors' => null,
        ], 201);
    }

    #[OA\Post(
        path: '/api/v1/auth/login',
        summary: 'Login with phone/email and password',
        description: 'User can login with phone or email. Phone-first accounts must verify phone before token is issued.',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['login', 'password', 'portal', 'device_id', 'platform'],
                properties: [
                    new OA\Property(property: 'login', type: 'string', example: '01700000000'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'SecurePass123!'),
                    new OA\Property(property: 'portal', type: 'string', enum: ['admin', 'student'], example: 'student'),
                    new OA\Property(property: 'device_id', type: 'string', example: 'web-browser-uuid-123'),
                    new OA\Property(property: 'platform', type: 'string', enum: ['web', 'android', 'ios'], example: 'web'),
                    new OA\Property(property: 'fcm_token', type: 'string', nullable: true, example: null)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Login successful'),
            new OA\Response(response: 403, description: 'Phone verification required or unauthorized portal access'),
            new OA\Response(response: 422, description: 'Validation error')
        ]
    )]


    public function login(Request $request): JsonResponse
    {

        $validated = $request->validate([
            'login' => [
                'required',
                'string',
                'max:255',
                'regex:/^[^\r\n]+$/',
            ],
            'password' => ['required', 'string'],
            'portal' => ['required', 'string', 'in:admin,student'],
            'device_id' => ['required', 'string', 'max:255'],
            'platform' => ['required', 'string', 'in:web,android,ios'],
            'fcm_token' => ['nullable', 'string', 'max:500'],
        ]);

        $user = User::query()
            ->where('email', $validated['login'])
            ->orWhere('phone', $validated['login'])
            ->first();

        if (!$user || empty($user->password) || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($this->requiresPhoneVerificationBeforePasswordLogin($user)) {
            $this->sendPhoneVerificationCode($user);

            return response()->json([
                'success' => false,
                'data' => [
                    'verification_required' => true,
                    'phone' => $user->phone,
                ],
                'message' => 'Your phone number is not verified. A new verification code has been sent.',
                'errors' => null,
            ], 403);
        }

        $portalError = $this->validatePortalAccess($user, $validated['portal']);

        if ($portalError) {
            return $portalError;
        }

        return $this->issueLoginToken($user, $validated, 'Login successful.');
    }

    #[OA\Post(
        path: '/api/v1/auth/google',
        summary: 'Google registration/login',
        description: 'Google users can login without phone verification, but profile remains incomplete until phone is added and verified.',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'id_token',
                    'portal',
                    'device_id',
                    'platform'
                ],
                properties: [
                    new OA\Property(
                        property: 'id_token',
                        type: 'string',
                        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...'
                    ),
                    new OA\Property(
                        property: 'portal',
                        type: 'string',
                        enum: ['student'],
                        example: 'student'
                    ),
                    new OA\Property(
                        property: 'device_id',
                        type: 'string',
                        example: 'web-browser-uuid-123'
                    ),
                    new OA\Property(
                        property: 'platform',
                        type: 'string',
                        enum: ['web', 'android', 'ios'],
                        example: 'web'
                    ),
                    new OA\Property(
                        property: 'fcm_token',
                        type: 'string',
                        nullable: true,
                        example: 'firebase-token'
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Successful response'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error')
        ]
    )]
    public function googleLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_token' => ['required', 'string'],
            'portal' => ['required', 'string', 'in:student'],
            'device_id' => ['required', 'string', 'max:255'],
            'platform' => ['required', 'string', 'in:web,android,ios'],
            'fcm_token' => ['nullable', 'string', 'max:500'],
        ]);

        $googleUser = $this->verifyGoogleIdToken($validated['id_token']);

        if (!$googleUser) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid Google token.',
                'errors' => null,
            ], 401);
        }

        $email = $googleUser['email'] ?? null;
        $googleId = $googleUser['sub'] ?? null;

        if (!$email || !$googleId) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Google account email or account ID is missing.',
                'errors' => null,
            ], 422);
        }

        $user = User::query()
            ->where('email', $email)
            ->orWhere(function ($query) use ($googleId) {
                $query->where('provider', 'google')
                    ->where('provider_id', $googleId);
            })
            ->first();

        if ($user && $user->provider !== null && $user->provider !== 'google') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'This email is already linked with another login provider.',
                'errors' => null,
            ], 409);
        }

        if (!$user) {
            $user = User::create([
                'name' => $googleUser['name'] ?? 'Google User',
                'email' => $email,
                'email_verified_at' => !empty($googleUser['email_verified']) ? now() : null,
                'phone' => null,
                'password' => null,
                'role' => 'student',
                'status' => true,
                'phone_verified_at' => null,
                'avatar' => $googleUser['picture'] ?? null,
                'provider' => 'google',
                'provider_id' => $googleId,
            ]);
        } else {
            $user->update([
                'provider' => $user->provider ?: 'google',
                'provider_id' => $user->provider_id ?: $googleId,
                'email_verified_at' => $user->email_verified_at ?: (!empty($googleUser['email_verified']) ? now() : null),
                'avatar' => $user->avatar ?: ($googleUser['picture'] ?? null),
            ]);
        }

        $portalError = $this->validatePortalAccess($user, $validated['portal']);

        if ($portalError) {
            return $portalError;
        }

        return $this->issueLoginToken($user->fresh(), $validated, 'Google login successful.');
    }

    #[OA\Post(
        path: '/api/v1/auth/logout',
        summary: 'Logout user and revoke current token',
        security: [['sanctum' => []]],
        tags: ['Authentication'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Logged out successfully'
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthenticated'
            )
        ]
    )]


    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token) {
            Device::where('user_id', $request->user()->id)
                ->where('device_hash', hash('sha256', $token->name))
                ->update([
                    'is_active' => false,
                    'last_active_at' => now(),
                ]);

            $token->delete();
        }

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Logged out successfully.',
            'errors' => null,
        ]);
    }

    private function requiresPhoneVerificationBeforePasswordLogin(User $user): bool
    {
        return $user->provider !== 'google' && is_null($user->phone_verified_at);
    }

    private function validatePortalAccess(User $user, string $portal): ?JsonResponse
    {
        if (!$user->status) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Your account has been suspended.',
                'errors' => null,
            ], 403);
        }

        if ($portal === 'admin' && $user->role === 'student') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthorized. Admin access required for this portal.',
                'errors' => null,
            ], 403);
        }

        if ($portal === 'student' && in_array($user->role, ['super_admin', 'admin', 'content_manager'], true)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Please use the administrative portal to log in.',
                'errors' => null,
            ], 403);
        }

        return null;
    }

    private function issueLoginToken(User $user, array $validated, string $message): JsonResponse
    {
        $this->registerDevice($user, $validated);

        $tokenName = $this->tokenName($validated['device_id']);

        $user->tokens()
            ->where('name', $tokenName)
            ->delete();

        $abilities = $user->role === 'student' ? ['student'] : ['admin'];

        $token = $user->createToken($tokenName, $abilities)->plainTextToken;

        $profileCompleted = $this->isProfileCompleted($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->safeUser($user),
                'token' => $token,
                'token_type' => 'Bearer',
                'profile_completed' => $profileCompleted,
                'phone_verification_required' => !$profileCompleted,
            ],
            'message' => $message,
            'errors' => null,
        ]);
    }

    private function registerDevice(User $user, array $data): void
    {
        Device::updateOrCreate(
            [
                'user_id' => $user->id,
                'device_hash' => hash('sha256', $this->tokenName($data['device_id'])),
            ],
            [
                'device_id' => Str::limit($data['device_id'], 255, ''),
                'platform' => $data['platform'],
                'fcm_token' => $data['fcm_token'] ?? null,
                'is_active' => true,
                'last_active_at' => now(),
            ]
        );
    }

    private function sendPhoneVerificationCode(User $user): void
    {
        /*
        TODO:
        Generate OTP, hash it, save it with expiry, throttle resend attempts,
        then send SMS using queued job.
        */
    }

    private function verifyGoogleIdToken(string $idToken): ?array
    {
        $client = new GoogleClient([
            'client_id' => config('services.google.client_id'),
        ]);

        $payload = $client->verifyIdToken($idToken);

        if (!$payload) {
            return null;
        }

        return $payload;
    }

    private function tokenName(string $deviceId): string
    {
        return 'device_' . hash('sha256', $deviceId);
    }

    private function safeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
            'role' => $user->role,
            'status' => (bool) $user->status,
            'avatar' => $user->avatar ?? null,
            'provider' => $user->provider,
            'provider_id' => $user->provider_id,
            'phone_verified_at' => $user->phone_verified_at ?? null,
            'email_verified_at' => $user->email_verified_at,
        ];
    }

    private function isProfileCompleted(User $user): bool
    {
        return !empty($user->phone) && !is_null($user->phone_verified_at);
    }
}