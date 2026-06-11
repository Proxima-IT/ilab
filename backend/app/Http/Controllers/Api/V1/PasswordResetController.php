<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Password Recovery", description: "Endpoints for requesting OTPs and resetting user passwords")]
class PasswordResetController extends Controller
{
    #[OA\Post(
        path: "/api/v1/auth/forgot-password",
        summary: "Request Password Reset OTP",
        description: "Sends a 6-digit OTP to the provided email or phone number.",
        tags: ["Password Recovery"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["identifier"],
                properties: [
                    new OA\Property(property: "identifier", type: "string", example: "student@domain.com or +8801700000000")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "OTP Sent successfully (or silently ignored if user does not exist)")
        ]
    )]
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
        ]);

        $user = User::where('email', $request->identifier)
                    ->orWhere('phone', $request->identifier)
                    ->first();

        // Security: Always return success to prevent user enumeration
        if (!$user) {
            return response()->json([
                'success' => true,
                'message' => 'If an account matches that email or phone, an OTP has been sent.'
            ]);
        }

        // Generate a 6-digit OTP
        $otp = rand(100000, 999999);

        // Store OTP in the database for 15 minutes
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email ?? $user->phone],
            ['token' => Hash::make($otp), 'created_at' => now()]
        );

        // TODO: Dispatch Job to send OTP via Email or BulkSMS BD here (Queue)

        return response()->json([
            'success' => true,
            'message' => 'If an account matches that email or phone, an OTP has been sent.'
        ]);
    }

    #[OA\Post(
        path: "/api/v1/auth/reset-password",
        summary: "Reset Password using OTP",
        description: "Verifies the OTP and updates the user's password.",
        tags: ["Password Recovery"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["identifier", "otp", "password", "password_confirmation"],
                properties: [
                    new OA\Property(property: "identifier", type: "string", example: "student@domain.com"),
                    new OA\Property(property: "otp", type: "string", example: "123456"),
                    new OA\Property(property: "password", type: "string", format: "password", example: "NewSecurePass123!"),
                    new OA\Property(property: "password_confirmation", type: "string", format: "password", example: "NewSecurePass123!")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Password reset successfully"),
            new OA\Response(response: 400, description: "Invalid or expired OTP")
        ]
    )]
    public function resetPassword(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'otp' => 'required|numeric|digits:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->identifier)
                    ->orWhere('phone', $request->identifier)
                    ->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Invalid request.'], 400);
        }

        $record = DB::table('password_reset_tokens')
                     ->where('email', $user->email ?? $user->phone)
                     ->first();

        // Check if OTP exists, is correct, and is not older than 15 minutes
        if (!$record || !Hash::check($request->otp, $record->token) || Carbon::parse($record->created_at)->addMinutes(15)->isPast()) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired OTP.'], 400);
        }

        // Update password and clear existing active sessions
        $user->update(['password' => Hash::make($request->password)]);
        $user->tokens()->delete(); // Force logout from all devices

        // Delete the used OTP
        DB::table('password_reset_tokens')->where('email', $user->email ?? $user->phone)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. Please log in with your new password.'
        ]);
    }
}