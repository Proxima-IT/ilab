<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! $this->canView($request->user())) {
            return $this->forbiddenResponse('Access denied. You do not have permission to view coupons.');
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100', 'regex:/^[^\r\n]+$/'],
            'type' => ['nullable', 'string', 'in:percentage,fixed'],
            'status' => ['nullable', 'string', 'in:active,inactive,expired'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $coupons = Coupon::query()
            ->with('course:id,title,slug')
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $query->where('code', 'like', '%' . strtoupper($validated['search']) . '%');
            })
            ->when(! empty($validated['type']), function ($query) use ($validated) {
                $query->where('type', $validated['type']);
            })
            ->when(! empty($validated['status']), function ($query) use ($validated) {
                if ($validated['status'] === 'active') {
                    $query->where('is_active', true)
                        ->where(function ($q) {
                            $q->whereNull('expires_at')
                                ->orWhere('expires_at', '>', now());
                        });
                }

                if ($validated['status'] === 'inactive') {
                    $query->where('is_active', false);
                }

                if ($validated['status'] === 'expired') {
                    $query->whereNotNull('expires_at')
                        ->where('expires_at', '<=', now());
                }
            })
            ->latest()
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $coupons,
            'message' => 'Coupons retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        if (! $this->canView($request->user())) {
            return $this->forbiddenResponse('Access denied. You do not have permission to view coupon options.');
        }

        $courses = Course::query()
            ->select('id', 'title', 'slug', 'status')
            ->orderBy('title')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'courses' => $courses,
            ],
            'message' => 'Coupon options retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot create coupons.');
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Za-z0-9_-]+$/',
                'unique:coupons,code',
            ],
            'type' => ['required', 'string', 'in:percentage,fixed'],
            'value' => ['required', 'numeric', 'min:0'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'expires_at' => ['required', 'date', 'after:today'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($validated['type'] === 'percentage' && $validated['value'] > 100) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Percentage coupon value cannot be greater than 100.',
                'errors' => [
                    'value' => ['Percentage coupon value cannot be greater than 100.'],
                ],
            ], 422);
        }

        $coupon = Coupon::create([
            'code' => strtoupper($validated['code']),
            'type' => $validated['type'],
            'value' => $validated['value'],
            'course_id' => $validated['course_id'] ?? null,
            'max_uses' => $validated['max_uses'] ?? null,
            'used_count' => 0,
            'expires_at' => $validated['expires_at'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $coupon,
            'message' => 'Coupon created successfully.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (! $this->canCreateOrUpdate($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot update coupons.');
        }

        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('coupons', 'code')->ignore($coupon->id),
            ],
            'type' => ['required', 'string', 'in:percentage,fixed'],
            'value' => ['required', 'numeric', 'min:0'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'expires_at' => ['required', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($validated['type'] === 'percentage' && $validated['value'] > 100) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Percentage coupon value cannot be greater than 100.',
                'errors' => [
                    'value' => ['Percentage coupon value cannot be greater than 100.'],
                ],
            ], 422);
        }

        $coupon->update([
            'code' => strtoupper($validated['code']),
            'type' => $validated['type'],
            'value' => $validated['value'],
            'course_id' => $validated['course_id'] ?? null,
            'max_uses' => $validated['max_uses'] ?? null,
            'expires_at' => $validated['expires_at'],
            'is_active' => $validated['is_active'] ?? $coupon->is_active,
        ]);

        return response()->json([
            'success' => true,
            'data' => $coupon->fresh(),
            'message' => 'Coupon updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (! $this->canDelete($request->user())) {
            return $this->forbiddenResponse('Access denied. You cannot delete coupons.');
        }

        $coupon = Coupon::findOrFail($id);

        if ($coupon->used_count > 0) {
            $coupon->update([
                'is_active' => false,
            ]);

            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'This coupon has already been used. It has been deactivated instead of deleted.',
                'errors' => null,
            ]);
        }

        $coupon->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Coupon deleted successfully.',
            'errors' => null,
        ]);
    }

    private function canView($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin', 'manager'], true);
    }

    private function canCreateOrUpdate($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin', 'manager'], true);
    }

    private function canDelete($user): bool
    {
        return in_array($user->role, ['super_admin', 'admin'], true);
    }

    private function forbiddenResponse(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $message,
            'errors' => null,
        ], 403);
    }
}
