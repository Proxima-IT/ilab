<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_if($request->user()->role !== 'super_admin', 403, 'Super Admin access required.');

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'role' => ['nullable', 'string', 'max:60'],
            'action' => ['nullable', 'string', 'max:80'],
            'date' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        if (
            empty($validated['search'])
            && empty($validated['role'])
            && empty($validated['action'])
            && empty($validated['date'])
        ) {
            return response()->json([
                'success' => true,
                'data' => new LengthAwarePaginator([], 0, $validated['per_page'] ?? 50),
                'message' => 'Select a date, role, action, or search term to view activity logs.',
                'errors' => null,
            ]);
        }

        $logs = ActivityLog::query()
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $search = '%' . $validated['search'] . '%';
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->where('user_name', 'like', $search)
                        ->orWhere('user_email', 'like', $search)
                        ->orWhere('path', 'like', $search)
                        ->orWhere('description', 'like', $search);
                });
            })
            ->when(! empty($validated['role']), fn ($query) => $query->where('role', $validated['role']))
            ->when(! empty($validated['action']), fn ($query) => $query->where('action', $validated['action']))
            ->when(! empty($validated['date']), fn ($query) => $query->whereDate('created_at', $validated['date']))
            ->latest()
            ->paginate($validated['per_page'] ?? 50);

        $logs->setCollection($this->makeReadable($logs->getCollection()));

        return response()->json([
            'success' => true,
            'data' => $logs,
            'message' => 'Activity logs retrieved successfully.',
            'errors' => null,
        ]);
    }

    private function makeReadable(Collection $logs): Collection
    {
        return $logs
            ->map(function (ActivityLog $log) {
                $resource = $this->resourceLabel($log->path);
                $target = $this->targetLabel($log->path);

                $log->resource_label = $resource;
                $log->activity_title = ucfirst((string) $log->action) . ' ' . $resource;
                $log->activity_summary = $this->summary($log, $resource, $target);

                return $log;
            })
            ->unique(function (ActivityLog $log) {
                $minute = optional($log->created_at)->format('Y-m-d H:i');

                return implode('|', [
                    $log->user_id,
                    $log->role,
                    $log->action,
                    $this->resourceKey($log->path),
                    $minute,
                ]);
            })
            ->values();
    }

    private function summary(ActivityLog $log, string $resource, ?string $target): string
    {
        $actor = $log->user_name ?: 'Unknown staff';
        $action = match ($log->action) {
            'created' => 'created',
            'updated' => 'updated',
            'deleted' => 'deleted',
            default => 'opened',
        };

        return $actor . ' ' . $action . ' ' . $resource . ($target ? ' (' . $target . ')' : '') . '.';
    }

    private function resourceKey(?string $path): string
    {
        $segments = $this->segments($path);

        return $segments[0] ?? 'dashboard';
    }

    private function resourceLabel(?string $path): string
    {
        $key = $this->resourceKey($path);

        return [
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
            'newsletter' => 'newsletter subscriber',
            'notifications' => 'student notification',
            'profile' => 'admin profile',
            'qna' => 'Q&A answer',
            'reviews' => 'review',
            'sections' => 'course section',
            'site' => 'website settings',
            'students' => 'student',
            'student-progress' => 'student progress',
            'users' => 'staff account',
            'website-settings' => 'website settings',
        ][$key] ?? str_replace('-', ' ', $key);
    }

    private function targetLabel(?string $path): ?string
    {
        $segments = $this->segments($path);
        $target = collect($segments)->skip(1)->filter()->implode(' / ');

        return $target ?: null;
    }

    private function segments(?string $path): array
    {
        $path = trim((string) $path, '/');
        $path = preg_replace('#^api/v1/admin/#', '', $path);

        return array_values(array_filter(explode('/', $path)));
    }
}
