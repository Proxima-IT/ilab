<?php

namespace App\Support;

use App\Models\AdminNotification;
use Illuminate\Support\Facades\DB;

class AdminNotificationDispatcher
{
    public static function newEnrollment(int $userId, int $courseId, float|int|string $price): void
    {
        $student = DB::table('users')
            ->select('id', 'name', 'email', 'phone')
            ->where('id', $userId)
            ->first();

        $course = DB::table('courses')
            ->select('id', 'title', 'slug', 'instructor_id')
            ->where('id', $courseId)
            ->first();

        if (! $student || ! $course) {
            return;
        }

        $recipientIds = DB::table('users')
            ->whereIn('role', ['admin', 'manager'])
            ->where('status', true)
            ->whereNull('deleted_at')
            ->pluck('id')
            ->push($course->instructor_id)
            ->filter()
            ->unique()
            ->values();

        foreach ($recipientIds as $recipientId) {
            AdminNotification::createForUser(
                (int) $recipientId,
                AdminNotification::TYPE_NEW_ENROLLMENT,
                'New course enrollment',
                ($student->name ?: 'A student') . ' enrolled in ' . $course->title . '.',
                '/admin/enrollments',
                [
                    'student_id' => $student->id,
                    'student_name' => $student->name,
                    'student_email' => $student->email,
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                    'course_slug' => $course->slug,
                    'price' => (float) $price,
                ]
            );
        }
    }
}
