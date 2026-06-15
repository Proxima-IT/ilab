<?php

namespace App\Services;

use Google\Client as GoogleClient;
use Illuminate\Support\Facades\Log;

class GoogleAuthService
{
    public function verifyIdToken(string $idToken): ?array
    {
        try {
            $clientId = config('services.google.client_id');

            if (empty($clientId)) {
                Log::error('Google client ID is not configured.');
                return null;
            }

            $client = new GoogleClient([
                'client_id' => $clientId,
            ]);

            $payload = $client->verifyIdToken($idToken);

            if (! $payload) {
                return null;
            }

            if (empty($payload['email']) || empty($payload['sub'])) {
                return null;
            }

            return [
                'id' => $payload['sub'],
                'email' => $payload['email'],
                'name' => $payload['name'] ?? 'Google User',
                'avatar' => $payload['picture'] ?? null,
                'email_verified' => (bool) ($payload['email_verified'] ?? false),
            ];
        } catch (\Throwable $e) {
            Log::warning('Google token verification failed.', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }
}