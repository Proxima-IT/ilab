<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Access denied. Super Admin only.'], 403);
        }

        // UPDATED: Now includes 'instructor' in the fetch list
        $staff = User::whereIn('role', ['admin', 'manager', 'instructor', 'super_admin'])
                     ->orderBy('role')
                     ->get(['id', 'name', 'email', 'phone', 'role', 'created_at']);

        return response()->json([
            'success' => true,
            'data' => $staff,
            'message' => 'Staff and Instructors retrieved.'
        ]);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Access denied. Super Admin only.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20|unique:users',
            'password' => 'required|string|min:8',
            // UPDATED: Now allows creation of instructors
            'role' => 'required|in:admin,manager,instructor', 
        ]);

        $staff = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'email_verified_at' => now(), 
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'role' => $staff->role,
            ],
            'message' => ucfirst($staff->role) . ' account created successfully.'
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Access denied. Super Admin only.'], 403);
        }

        $staff = User::findOrFail($id);

        // Security: Prevent Super Admin from accidentally deleting themselves
        if ($staff->id === $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'You cannot revoke your own super admin access.'], 403);
        }

        // UPDATED: Allow deletion of instructors as well
        if (!in_array($staff->role, ['admin', 'manager', 'instructor'])) {
            return response()->json(['success' => false, 'message' => 'Invalid target. Can only revoke admin, manager, or instructor accounts.'], 400);
        }

        $staff->delete();

        return response()->json([
            'success' => true,
            'message' => ucfirst($staff->role) . ' access revoked successfully.'
        ]);
    }
}