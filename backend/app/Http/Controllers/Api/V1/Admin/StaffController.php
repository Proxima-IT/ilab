<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

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
                'avatar',
                'bio',
                'status',
                'created_at',
                'updated_at',
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

            'bio' => ['nullable', 'string', 'max:2000'],

            'status' => ['nullable', 'boolean'],
        ]);

        $staff = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'bio' => $validated['bio'] ?? null,

            'password' => Hash::make(
                $validated['password']
            ),

            'role' => $validated['role'],

            'status' => $validated['status'] ?? true,

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

    public function update(
        Request $request,
        int $id
    ): JsonResponse {
        $this->authorizeSuperAdmin($request);

        $staff = User::findOrFail($id);

        if (! $this->isEditableStaff($staff)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid target account.',
                'errors' => null,
            ], 400);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($staff->id),
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'phone')->ignore($staff->id),
            ],

            'role' => [
                'required',
                'in:admin,manager,instructor,content_manager',
            ],

            'bio' => ['nullable', 'string', 'max:2000'],

            'status' => ['required', 'boolean'],

            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $staff->fill([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'bio' => $validated['bio'] ?? null,
            'status' => $validated['status'],
            'email_verified_at' => !empty($validated['email'])
                ? ($staff->email === ($validated['email'] ?? null) ? $staff->email_verified_at : now())
                : null,
            'phone_verified_at' => !empty($validated['phone'])
                ? ($staff->phone === ($validated['phone'] ?? null) ? $staff->phone_verified_at : now())
                : null,
        ]);

        if (! empty($validated['password'])) {
            $staff->password = Hash::make($validated['password']);
            $staff->tokens()->delete();
        }

        $staff->save();

        return response()->json([
            'success' => true,
            'data' => [
                'staff' => $this->staffResource($staff->fresh()),
            ],
            'message' => 'Staff account updated successfully.',
            'errors' => null,
        ]);
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

        if (! $this->isEditableStaff($staff)) {
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

    private function isEditableStaff(User $staff): bool
    {
        return in_array(
            $staff->role,
            [
                'admin',
                'manager',
                'instructor',
                'content_manager',
            ],
            true
        );
    }

    private function staffResource(User $staff): array
    {
        return [
            'id' => $staff->id,
            'name' => $staff->name,
            'email' => $staff->email,
            'phone' => $staff->phone,
            'role' => $staff->role,
            'avatar' => $staff->avatar,
            'bio' => $staff->bio,
            'status' => (bool) $staff->status,
            'created_at' => $staff->created_at,
            'updated_at' => $staff->updated_at,
        ];
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
