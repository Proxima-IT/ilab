<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\StudentNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CertificateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $certificates = Certificate::query()
            ->with([
                'user:id,name,email,phone',
                'course:id,title,slug,instructor_id',
                'course.instructor:id,name,email',
            ])
            ->when($request->user()->role === 'instructor', function ($query) use ($request) {
                $query->whereHas('course', function ($courseQuery) use ($request) {
                    $courseQuery->where('instructor_id', $request->user()->id);
                });
            })
            ->when(! empty($validated['search']), function ($query) use ($validated) {
                $search = '%' . $validated['search'] . '%';
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->where('verification_code', 'like', $search)
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery
                                ->where('name', 'like', $search)
                                ->orWhere('email', 'like', $search)
                                ->orWhere('phone', 'like', $search);
                        })
                        ->orWhereHas('course', function ($courseQuery) use ($search) {
                            $courseQuery->where('title', 'like', $search);
                        });
                });
            })
            ->latest('issued_at')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $certificates,
            'message' => 'Certificates retrieved successfully.',
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $certificate = Certificate::create([
            'user_id' => $validated['user_id'],
            'course_id' => $validated['course_id'],
            'verification_code' => $validated['verification_code'] ?? $this->verificationCode(),
            'authorized_signatory_name' => $validated['authorized_signatory_name'] ?? config('app.certificate_signatory_name', 'Authorized Signature'),
            'authorized_signatory_title' => $validated['authorized_signatory_title'] ?? config('app.certificate_signatory_title', 'iLab BD'),
            'eligible_progress' => $validated['eligible_progress'] ?? 90,
            'issued_at' => $validated['issued_at'] ?? now(),
        ]);

        StudentNotification::createForStudent(
            (int) $certificate->user_id,
            'certificate_ready',
            'Certificate ready',
            'Your certificate is ready to download.',
            '/dashboard/certificates',
            ['course_id' => $certificate->course_id, 'certificate_id' => $certificate->id]
        );

        return response()->json([
            'success' => true,
            'data' => $certificate->load([
                'user:id,name,email,phone',
                'course:id,title,slug,instructor_id',
                'course.instructor:id,name,email',
            ]),
            'message' => 'Certificate created successfully.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $certificate = Certificate::findOrFail($id);
        $validated = $request->validate($this->rules($certificate));

        $certificate->update([
            'user_id' => $validated['user_id'],
            'course_id' => $validated['course_id'],
            'verification_code' => $validated['verification_code'] ?? $certificate->verification_code,
            'authorized_signatory_name' => $validated['authorized_signatory_name'] ?? null,
            'authorized_signatory_title' => $validated['authorized_signatory_title'] ?? null,
            'eligible_progress' => $validated['eligible_progress'] ?? 90,
            'issued_at' => $validated['issued_at'] ?? $certificate->issued_at,
        ]);

        return response()->json([
            'success' => true,
            'data' => $certificate->fresh()->load([
                'user:id,name,email,phone',
                'course:id,title,slug,instructor_id',
                'course.instructor:id,name,email',
            ]),
            'message' => 'Certificate updated successfully.',
            'errors' => null,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        Certificate::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Certificate deleted successfully.',
            'errors' => null,
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_search' => ['nullable', 'string', 'max:120'],
        ]);

        $students = collect();

        if (! empty($validated['student_search']) && strlen($validated['student_search']) >= 2) {
            $search = '%' . $validated['student_search'] . '%';

            $students = User::query()
                ->where('role', 'student')
                ->where('status', true)
                ->where(function ($query) use ($search) {
                    $query
                        ->where('name', 'like', $search)
                        ->orWhere('email', 'like', $search)
                        ->orWhere('phone', 'like', $search);
                })
                ->select('id', 'name', 'email', 'phone')
                ->orderBy('name')
                ->limit(20)
                ->get();
        }

        $courses = Course::query()
            ->when($request->user()->role === 'instructor', function ($query) use ($request) {
                $query->where('instructor_id', $request->user()->id);
            })
            ->select('id', 'title', 'slug', 'instructor_id')
            ->with('instructor:id,name')
            ->orderBy('title')
            ->limit(500)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'students' => $students,
                'courses' => $courses,
            ],
            'message' => 'Certificate options retrieved successfully.',
            'errors' => null,
        ]);
    }

    private function rules(?Certificate $certificate = null): array
    {
        return [
            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where('role', 'student'),
                Rule::unique('certificates', 'user_id')
                    ->where(fn ($query) => $query->where('course_id', request('course_id')))
                    ->ignore($certificate?->id),
            ],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'verification_code' => [
                'nullable',
                'string',
                'max:80',
                Rule::unique('certificates', 'verification_code')->ignore($certificate?->id),
            ],
            'authorized_signatory_name' => ['nullable', 'string', 'max:255'],
            'authorized_signatory_title' => ['nullable', 'string', 'max:255'],
            'eligible_progress' => ['nullable', 'integer', 'min:1', 'max:100'],
            'issued_at' => ['nullable', 'date'],
        ];
    }

    private function verificationCode(): string
    {
        do {
            $code = 'ILAB-' . now()->format('Y') . '-' . strtoupper(Str::random(8));
        } while (Certificate::where('verification_code', $code)->exists());

        return $code;
    }
}
