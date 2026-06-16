<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $staff = User::query()
            ->whereIn('role', [
                'super_admin',
                'admin',
                'manager',
                'instructor',
                'content_manager',
            ])
            ->select([
                'id',
                'name',
                'email',
                'phone',
                'role',
                'status',
                'created_at',
            ])
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $staff,
            'message' => 'Staff list retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'nullable',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20',
                'unique:users,phone',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
            ],

            'role' => [
                'required',
                'in:admin,manager,instructor,content_manager',
            ],
        ]);

        $staff = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,

            'password' => Hash::make(
                $validated['password']
            ),

            'role' => $validated['role'],

            'status' => true,

            'email_verified_at' =>
                !empty($validated['email'])
                    ? now()
                    : null,

            'phone_verified_at' =>
                !empty($validated['phone'])
                    ? now()
                    : null,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'role' => $staff->role,
            ],
            'message' => ucfirst(
                str_replace('_', ' ', $staff->role)
            ) . ' account created successfully.',
            'errors' => null,
        ], 201);
    }

    public function destroy(
        Request $request,
        int $id
    ): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $staff = User::findOrFail($id);

        if (
            $staff->id === $request->user()->id
        ) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' =>
                    'You cannot delete your own account.',
                'errors' => null,
            ], 403);
        }

        if (
            !in_array(
                $staff->role,
                [
                    'admin',
                    'manager',
                    'instructor',
                    'content_manager',
                ],
                true
            )
        ) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid target account.',
                'errors' => null,
            ], 400);
        }

        $staff->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Staff account removed successfully.',
            'errors' => null,
        ]);
    }

    private function authorizeSuperAdmin(
        Request $request
    ): void
    {
        abort_if(
            $request->user()->role !== 'super_admin',
            403,
            'Super Admin access required.'
        );
    }
}