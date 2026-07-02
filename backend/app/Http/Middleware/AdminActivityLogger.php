<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class AdminActivityLogger
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();

        if (! $user || ! $request->is('api/v1/admin/*') || $request->is('api/v1/admin/activity*')) {
            return $response;
        }

        try {
            if (! Schema::hasTable('activity_logs')) {
                return $response;
            }

            if ($this->shouldSkip($request, $response)) {
                return $response;
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'role' => $user->role,
                'action' => $this->action($request),
                'method' => $request->method(),
                'path' => '/' . ltrim($request->path(), '/'),
                'description' => $this->description($request),
                'status_code' => $response->getStatusCode(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'metadata' => $this->metadata($request),
            ]);
        } catch (\Throwable) {
            return $response;
        }

        return $response;
    }

    private function shouldSkip(Request $request, Response $response): bool
    {
        if ($response->getStatusCode() >= 400) {
            return false;
        }

        if ($request->isMethod('GET') || $request->isMethod('HEAD') || $request->isMethod('OPTIONS')) {
            return true;
        }

        return false;
    }

    private function action(Request $request): string
    {
        return match ($request->method()) {
            'POST' => 'created',
            'PUT', 'PATCH' => 'updated',
            'DELETE' => 'deleted',
            default => 'viewed',
        };
    }

    private function description(Request $request): string
    {
        [$resource, $target] = $this->resourceParts($request);

        return ucfirst($this->action($request)) . ' ' . $resource . ($target ? ': ' . $target : '');
    }

    private function resourceParts(Request $request): array
    {
        $segments = collect(explode('/', trim(str_replace('api/v1/admin/', '', $request->path()), '/')))
            ->filter()
            ->values();

        $resource = (string) ($segments->first() ?: 'dashboard');
        $target = $segments->skip(1)->implode(' / ');

        $labels = [
            'blog-posts' => 'blog post',
            'categories' => 'category',
            'certificates' => 'certificate',
            'coupons' => 'promo code',
            'courses' => 'course',
            'dashboard' => 'dashboard',
            'enrollments' => 'enrollment',
            'events' => 'event',
            'instructors' => 'instructor',
            'lessons' => 'lesson',
            'newsletter' => 'newsletter',
            'notifications' => 'student notification',
            'profile' => 'admin profile',
            'qna' => 'Q&A',
            'reviews' => 'review',
            'sections' => 'course section',
            'site' => 'website settings',
            'students' => 'student',
            'student-progress' => 'student progress',
            'system-settings' => 'system settings',
            'users' => 'staff account',
            'website-settings' => 'website settings',
        ];

        return [$labels[$resource] ?? str_replace('-', ' ', $resource), $target];
    }

    private function metadata(Request $request): array
    {
        $input = $request->except([
            'password',
            'password_confirmation',
            'current_password',
            'token',
            'avatar',
            'cover',
            'image',
        ]);

        return [
            'query' => $request->query(),
            'input' => $input,
        ];
    }
}
