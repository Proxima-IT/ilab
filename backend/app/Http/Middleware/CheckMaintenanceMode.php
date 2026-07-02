<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldBypass($request)) {
            return $next($request);
        }

        try {
            if (! Schema::hasTable('system_settings')) {
                return $next($request);
            }

            $maintenance = SystemSetting::section('maintenance');

            if (! ($maintenance['enabled'] ?? false)) {
                return $next($request);
            }

            $allowedIps = $maintenance['allowed_ips'] ?? [];

            if (in_array($request->ip(), $allowedIps, true)) {
                return $next($request);
            }

            return response()->json([
                'success' => false,
                'data' => [
                    'maintenance' => true,
                    'title' => $maintenance['title'] ?? 'Maintenance Mode',
                    'message' => $maintenance['message'] ?? 'The platform is temporarily under maintenance.',
                ],
                'message' => $maintenance['message'] ?? 'The platform is temporarily under maintenance.',
                'errors' => null,
            ], 503);
        } catch (\Throwable) {
            return $next($request);
        }
    }

    private function shouldBypass(Request $request): bool
    {
        return $request->is('api/v1/admin*')
            || $request->is('api/v1/auth/login')
            || $request->is('api/v1/auth/logout')
            || $request->is('api/v1/health-check')
            || $request->is('up');
    }
}
