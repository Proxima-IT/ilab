<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthEmailService
{
    public function sendEmailVerification(User $user): void
    {
        if (empty($user->email)) {
            return;
        }

        $otp = (string) random_int(100000, 999999);
        $email = mb_strtolower($user->email);

        DB::table('email_verification_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($otp),
                'created_at' => now(),
            ]
        );

        $this->sendOtpMail(
            $email,
            'Verify your iLab account',
            $user->name,
            $otp,
            'Use this code to verify your iLab account.'
        );
    }

    public function sendPasswordReset(User $user, string $otp): void
    {
        if (empty($user->email)) {
            return;
        }

        $this->sendOtpMail(
            mb_strtolower($user->email),
            'Reset your iLab password',
            $user->name,
            $otp,
            'Use this code to reset your iLab password.'
        );
    }

    private function sendOtpMail(string $email, string $subject, string $name, string $otp, string $line): void
    {
        $appName = config('app.name', 'iLab');

        Mail::html(
            view('emails.auth-otp', [
                'appName' => $appName,
                'name' => $name,
                'otp' => $otp,
                'line' => $line,
            ])->render(),
            function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            }
        );
    }
}
