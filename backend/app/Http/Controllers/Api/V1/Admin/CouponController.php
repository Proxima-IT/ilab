<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CouponController extends Controller
{
    /**
     * Helper to restrict creation/editing to platform owners/admins
     */
    private function canModify($user)
    {
        return in_array($user->role, ['super_admin', 'admin']);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        // Security: Managers, Admins, and Super Admins can view. Instructors are strictly blocked.
        if (!in_array($user->role, ['super_admin', 'admin', 'manager'])) {
            return response()->json(['success' => false, 'message' => 'Access denied. You do not have permission to view financials.'], 403);
        }

        $coupons = DB::table('coupons')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $coupons,
            'message' => 'Coupons retrieved successfully.'
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->canModify($request->user())) {
            return response()->json(['success' => false, 'message' => 'Access denied. Admins only.'], 403);
        }

        $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'course_id' => 'nullable|exists:courses,id', // Null means it works on ALL courses
            'max_uses' => 'nullable|integer|min:1',
            'expires_at' => 'required|date|after:today',
            'is_active' => 'boolean'
        ]);

        $couponId = DB::table('coupons')->insertGetId([
            'code' => strtoupper($request->code),
            'type' => $request->type,
            'value' => $request->value,
            'course_id' => $request->course_id,
            'max_uses' => $request->max_uses,
            'used_count' => 0,
            'expires_at' => $request->expires_at,
            'is_active' => $request->is_active ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $coupon = DB::table('coupons')->where('id', $couponId)->first();

        return response()->json([
            'success' => true,
            'data' => $coupon,
            'message' => 'Coupon created successfully.'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if (!$this->canModify($request->user())) {
            return response()->json(['success' => false, 'message' => 'Access denied. Admins only.'], 403);
        }

        $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code,' . $id,
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'course_id' => 'nullable|exists:courses,id',
            'max_uses' => 'nullable|integer|min:1',
            'expires_at' => 'required|date',
            'is_active' => 'boolean'
        ]);

        DB::table('coupons')->where('id', $id)->update([
            'code' => strtoupper($request->code),
            'type' => $request->type,
            'value' => $request->value,
            'course_id' => $request->course_id,
            'max_uses' => $request->max_uses,
            'expires_at' => $request->expires_at,
            'is_active' => $request->has('is_active') ? $request->is_active : true,
            'updated_at' => now(),
        ]);

        $coupon = DB::table('coupons')->where('id', $id)->first();

        return response()->json([
            'success' => true,
            'data' => $coupon,
            'message' => 'Coupon updated successfully.'
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->canModify($request->user())) {
            return response()->json(['success' => false, 'message' => 'Access denied. Admins only.'], 403);
        }

        $coupon = DB::table('coupons')->where('id', $id)->first();
        
        if (!$coupon) {
            return response()->json(['success' => false, 'message' => 'Coupon not found.'], 404);
        }

        // Security: Financial Ledger Protection
        // If a coupon was used, deleting it breaks the history of how a student got a discount.
        if ($coupon->used_count > 0) {
            DB::table('coupons')->where('id', $id)->update(['is_active' => false]);
            return response()->json([
                'success' => true, 
                'message' => 'This coupon has already been used by students. To protect your financial records, it has been deactivated instead of deleted.'
            ]);
        }

        DB::table('coupons')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Coupon deleted successfully.'
        ]);
    }
}