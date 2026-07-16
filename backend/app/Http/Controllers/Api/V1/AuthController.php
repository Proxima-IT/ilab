<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\User;
use App\Services\AuthEmailService;
use Carbon\Carbon;
use Google\Client as GoogleClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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
        description: 'Email is required and phone is optional. Manual registration creates an unverified account and sends an email verification code.',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'name',
                    'email',
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
                        nullable: true,
                        example: '01700000000'
                    ),
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
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
            new OA\Response(response: 409, description: 'Account exists but email verification is pending'),
            new OA\Response(response: 422, description: 'Validation error')
        ]
    )]


    public function register(Request $request): JsonResponse
    {


        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/', 'email:rfc,dns'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()->symbols()],
            'device_id' => ['required', 'string', 'max:255'],
            'platform' => ['required', 'string', 'in:web,android,ios'],
            'fcm_token' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['email'] = mb_strtolower($validated['email']);

        $existingUser = User::query()
            ->where('email', $validated['email'])
            ->when(!empty($validated['phone']), function ($query) use ($validated) {
                $query->orWhere('phone', $validated['phone']);
            })
            ->first();

        if ($existingUser) {
            if ($existingUser->email !== $validated['email']) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'This phone number is already connected with another account.',
                    'errors' => [
                        'phone' => ['This phone number is already connected with another account.'],
                    ],
                ], 422);
            }

            if ($existingUser->provider === 'google') {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'This email is already connected with Google login. Please continue with Google.',
                    'errors' => [
                        'email' => ['This email is already connected with Google login.'],
                    ],
                ], 422);
            }

            if ($existingUser->role === 'student' && is_null($existingUser->email_verified_at)) {
                $existingUser->update([
                    'name' => $validated['name'],
                    'phone' => $validated['phone'] ?? $existingUser->phone,
                    'password' => Hash::make($validated['password']),
                    'status' => true,
                ]);

                $this->registerDevice($existingUser, $validated);
                if (! $this->sendEmailVerificationSafely($existingUser->fresh())) {
                    return $this->verificationEmailFailedResponse($existingUser->email);
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'verification_required' => true,
                        'email' => $existingUser->email,
                    ],
                    'message' => 'A new verification code has been sent to your email.',
                    'errors' => null,
                ], 200);
            }

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'An account already exists with this email or phone number.',
                'errors' => [
                    'email_or_phone' => ['An account already exists with this email or phone number.'],
                ],
            ], 422);
        }

        $user = User::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'student',
            'status' => true,
            'phone_verified_at' => null,
            'email_verified_at' => null,
            'provider' => null,
            'provider_id' => null,
        ]);

        $this->registerDevice($user, $validated);
        if (! $this->sendEmailVerificationSafely($user)) {
            return $this->verificationEmailFailedResponse($user->email);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->safeUser($user),
                'verification_required' => true,
                'profile_completed' => false,
                'email_verification_required' => true,
            ],
            'message' => 'Registration successful. A verification code has been sent to your email.',
            'errors' => null,
        ], 201);
    }

    #[OA\Post(
        path: '/api/v1/auth/login',
        summary: 'Login with phone/email and password',
        description: 'User can login with phone or email. Manual student accounts must verify email before token is issued.',
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
            new OA\Response(response: 403, description: 'Email verification required or unauthorized portal access'),
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

        if ($this->requiresEmailVerificationBeforePasswordLogin($user)) {
            if (! $this->sendEmailVerificationSafely($user)) {
                return $this->verificationEmailFailedResponse($user->email);
            }

            return response()->json([
                'success' => false,
                'data' => [
                    'verification_required' => true,
                    'email_verification_required' => true,
                    'email' => $user->email,
                ],
                'message' => 'Your email is not verified. A new verification code has been sent.',
                'errors' => null,
            ], 403);
        }

        $portalError = $this->validatePortalAccess($user, $validated['portal']);

        if ($portalError) {
            return $portalError;
        }

        return $this->issueLoginToken($user, $validated, 'Login successful.');
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/', 'email:rfc,dns'],
            'otp' => ['required', 'numeric', 'digits:6'],
            'device_id' => ['required', 'string', 'max:255'],
            'platform' => ['required', 'string', 'in:web,android,ios'],
            'fcm_token' => ['nullable', 'string', 'max:500'],
        ]);

        $email = mb_strtolower($validated['email']);

        $record = DB::table('email_verification_tokens')
            ->where('email', $email)
            ->first();

        if (
            ! $record ||
            ! Hash::check((string) $validated['otp'], $record->token) ||
            Carbon::parse($record->created_at)->addMinutes(15)->isPast()
        ) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid or expired verification code.',
                'errors' => null,
            ], 400);
        }

        $user = User::query()
            ->where('email', $email)
            ->where('role', 'student')
            ->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'No student account was found for this email.',
                'errors' => null,
            ], 404);
        }

        $user->update([
            'email_verified_at' => $user->email_verified_at ?: now(),
        ]);

        DB::table('email_verification_tokens')
            ->where('email', $email)
            ->delete();

        return $this->issueLoginToken($user->fresh(), $validated, 'Email verified successfully.');
    }

    public function resendEmailVerification(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'max:255', 'regex:/^[^\r\n]+$/', 'email:rfc,dns'],
        ]);

        $email = mb_strtolower($validated['email']);

        $user = User::query()
            ->where('email', $email)
            ->where('role', 'student')
            ->first();

        if ($user && is_null($user->email_verified_at) && $user->provider !== 'google') {
            if (! $this->sendEmailVerificationSafely($user)) {
                return $this->verificationEmailFailedResponse($user->email);
            }
        }

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'If this email needs verification, a new code has been sent.',
            'errors' => null,
        ]);
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
            $googleAvatar = $googleUser['picture'] ?? null;

            $user->update([
                'provider' => $user->provider ?: 'google',
                'provider_id' => $user->provider_id ?: $googleId,
                'email_verified_at' => $user->email_verified_at ?: (!empty($googleUser['email_verified']) ? now() : null),
                'avatar' => $this->googleAvatarValue($user->avatar, $googleAvatar),
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

    private function requiresEmailVerificationBeforePasswordLogin(User $user): bool
    {
        return $user->role === 'student'
            && $user->provider !== 'google'
            && is_null($user->email_verified_at);
    }

    private function sendEmailVerificationSafely(User $user): bool
    {
        try {
            app(AuthEmailService::class)->sendEmailVerification($user);

            return true;
        } catch (\Throwable $e) {
            Log::error('Email verification send failed.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function verificationEmailFailedResponse(?string $email): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => [
                'verification_required' => true,
                'email_verification_required' => true,
                'email' => $email,
            ],
            'message' => 'Your account was saved, but the verification email could not be sent. Please try again in a moment or contact support.',
            'errors' => null,
        ], 503);
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

        if ($portal === 'admin' && ! $this->isStaffRole($user->role)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthorized. Staff access required for this portal.',
                'errors' => null,
            ], 403);
        }

        if ($portal === 'student' && $user->role !== 'student') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Please use the administrative portal to log in.',
                'errors' => null,
            ], 403);
        }

        return null;
    }

    private function isStaffRole(string $role): bool
    {
        return in_array($role, [
            'super_admin',
            'admin',
            'manager',
            'instructor',
            'content_manager',
        ], true);
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
                'email_verification_required' => $user->role === 'student'
                    && $user->provider !== 'google'
                    && is_null($user->email_verified_at),
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

    private function googleAvatarValue(?string $currentAvatar, ?string $googleAvatar): ?string
    {
        if (! $googleAvatar) {
            return $currentAvatar;
        }

        if (! $currentAvatar) {
            return $googleAvatar;
        }

        if (str_starts_with($currentAvatar, 'storage/avatars/')) {
            return $currentAvatar;
        }

        if (str_contains($currentAvatar, 'googleusercontent.com')) {
            return $googleAvatar;
        }

        return $currentAvatar;
    }

    private function isProfileCompleted(User $user): bool
    {
        return !empty($user->phone) && !is_null($user->phone_verified_at);
    }
}
