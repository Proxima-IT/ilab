<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Student Profile", description: "Endpoints for student dashboard and profile management")]
class StudentProfileController extends Controller
{
    #[OA\Get(
        path: "/api/v1/student/profile",
        summary: "Get Student Profile & Dashboard Data",
        description: "Returns the authenticated student's profile along with their enrolled courses and progress.",
        security: [["sanctum" => []]],
        tags: ["Student Profile"],
        responses: [
            new OA\Response(response: 200, description: "Profile retrieved successfully"),
            new OA\Response(response: 401, description: "Unauthenticated")
        ]
    )]
    public function show(Request $request)
    {
        // Ensure only students access this
        if ($request->user()->role !== 'student') {
            return response()->json(['success' => false, 'message' => 'Unauthorized profile access.'], 403);
        }

        // Load the user with their specific student context
        $user = $request->user()->load([
            'enrollments.course' => function($query) {
                $query->select('id', 'title', 'slug', 'thumbnail', 'type');
            },
            'progress'
        ]);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Student profile retrieved successfully.'
        ]);
    }

    #[OA\Put(
        path: "/api/v1/student/profile",
        summary: "Update Student Profile",
        security: [["sanctum" => []]],
        tags: ["Student Profile"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "name", type: "string"),
                    new OA\Property(property: "bio", type: "string"),
                    new OA\Property(property: "district", type: "string"),
                    new OA\Property(property: "education_level", type: "string"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Profile updated successfully")
        ]
    )]
    public function update(Request $request)
    {
        if ($request->user()->role !== 'student') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'district' => 'nullable|string|max:100',
            'education_level' => 'nullable|string|max:100',
            'notification_prefs' => 'nullable|array'
        ]);

        $request->user()->update($validated);

        return response()->json([
            'success' => true,
            'data' => $request->user()->fresh(),
            'message' => 'Profile updated successfully.'
        ]);
    }
}