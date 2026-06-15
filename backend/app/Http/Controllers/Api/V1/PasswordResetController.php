<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Password Recovery', description: 'Endpoints for requesting OTPs and resetting user passwords')]
class PasswordResetController extends Controller
{
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => [
                'required',
                'string',
                'max:255',
                'regex:/^[^\r\n]+$/',
            ],
        ]);

        $user = User::query()
            ->where('email', $validated['identifier'])
            ->orWhere('phone', $validated['identifier'])
            ->first();

        if (! $user) {
            return $this->forgotPasswordSuccessResponse();
        }

        $otp = random_int(100000, 999999);
        $identifierKey = $this->passwordResetIdentifier($user);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $identifierKey],
            [
                'token' => Hash::make((string) $otp),
                'created_at' => now(),
            ]
        );

        // TODO: Dispatch queued job to send OTP via Email or BulkSMS BD.
        // Example:
        // SendPasswordResetOtpJob::dispatch($user, $otp);

        return $this->forgotPasswordSuccessResponse();
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'identifier' => [
                'required',
                'string',
                'max:255',
                'regex:/^[^\r\n]+$/',
            ],
            'otp' => ['required', 'numeric', 'digits:6'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()->symbols()],
        ]);

        $user = User::query()
            ->where('email', $validated['identifier'])
            ->orWhere('phone', $validated['identifier'])
            ->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid or expired OTP.',
                'errors' => null,
            ], 400);
        }

        $identifierKey = $this->passwordResetIdentifier($user);

        $record = DB::table('password_reset_tokens')
            ->where('email', $identifierKey)
            ->first();

        if (
            ! $record ||
            ! Hash::check((string) $validated['otp'], $record->token) ||
            Carbon::parse($record->created_at)->addMinutes(15)->isPast()
        ) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid or expired OTP.',
                'errors' => null,
            ], 400);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        $user->tokens()->delete();

        DB::table('password_reset_tokens')
            ->where('email', $identifierKey)
            ->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Password reset successfully. Please log in with your new password.',
            'errors' => null,
        ]);
    }

    private function forgotPasswordSuccessResponse(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'If an account matches that email or phone, an OTP has been sent.',
            'errors' => null,
        ]);
    }

    private function passwordResetIdentifier(User $user): string
    {
        return $user->email ?: $user->phone;
    }
}