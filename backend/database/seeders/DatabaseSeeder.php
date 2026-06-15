<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Demo Users
        |--------------------------------------------------------------------------
        */
        $admin = User::updateOrCreate(
            ['email' => 'admin@domainname.com'],
            [
                'name' => 'Super Admin',
                'phone' => '+8801700000001',
                'password' => Hash::make('Password123!'),
                'role' => 'super_admin',
                'status' => true,
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'provider' => null,
                'provider_id' => null,
                'notification_prefs' => [
                    'email' => true,
                    'sms' => true,
                    'push' => true,
                ],
            ]
        );

        $instructor = User::updateOrCreate(
            ['email' => 'instructor@domainname.com'],
            [
                'name' => 'Tahsin Ahmad',
                'phone' => '+8801700000002',
                'password' => Hash::make('Password123!'),
                'role' => 'admin',
                'bio' => 'Backend Specialist & Tech Educator',
                'status' => true,
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'provider' => null,
                'provider_id' => null,
                'notification_prefs' => [
                    'email' => true,
                    'sms' => true,
                    'push' => true,
                ],
            ]
        );

        $student = User::updateOrCreate(
            ['email' => 'student@domainname.com'],
            [
                'name' => 'Demo Student',
                'phone' => '+8801700000003',
                'password' => Hash::make('Password123!'),
                'role' => 'student',
                'status' => true,
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'provider' => null,
                'provider_id' => null,
                'notification_prefs' => [
                    'email' => true,
                    'sms' => true,
                    'push' => true,
                ],
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Categories
        |--------------------------------------------------------------------------
        */
        $catWeb = Category::updateOrCreate(
            ['slug' => 'web-development'],
            [
                'name' => 'Web Development',
                'type' => 'course',
            ]
        );

        $catApp = Category::updateOrCreate(
            ['slug' => 'mobile-app'],
            [
                'name' => 'Mobile App',
                'type' => 'course',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Course
        |--------------------------------------------------------------------------
        */
        $course = Course::updateOrCreate(
            ['slug' => 'complete-laravel-react-bootcamp'],
            [
                'instructor_id' => $instructor->id,
                'category_id' => $catWeb->id,
                'title' => 'Complete Laravel & React Bootcamp',
                'description' => 'Master decoupled architecture by building a real-world EdTech platform from scratch.',
                'thumbnail' => 'https://via.placeholder.com/800x450.png?text=Laravel+React+Bootcamp',
                'intro_video' => 'dQw4w9WgXcQ',
                'price' => 5000.00,
                'discount_price' => 2500.00,
                'sale_starts_at' => now()->subDay(),
                'sale_ends_at' => now()->addDays(7),
                'status' => 'published',
                'type' => 'self_paced',
                'level' => 'intermediate',
                'language' => 'Bengali',
                'tags' => ['Laravel', 'React', 'API', 'Web'],
                'prerequisites' => ['Basic PHP', 'Basic JavaScript'],
                'meta_title' => 'Complete Laravel & React Bootcamp',
                'meta_description' => 'Learn Laravel API and React frontend by building a production-style EdTech platform.',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Sections
        |--------------------------------------------------------------------------
        */
        $section1 = Section::updateOrCreate(
            [
                'course_id' => $course->id,
                'order' => 1,
            ],
            [
                'title' => 'Module 1: API Architecture',
                'unlock_at' => null,
            ]
        );

        $section2 = Section::updateOrCreate(
            [
                'course_id' => $course->id,
                'order' => 2,
            ],
            [
                'title' => 'Module 2: React Frontend',
                'unlock_at' => null,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Lessons
        |--------------------------------------------------------------------------
        */
        Lesson::updateOrCreate(
            [
                'section_id' => $section1->id,
                'order' => 1,
            ],
            [
                'title' => 'Introduction to Decoupled Systems',
                'type' => 'video',
                'video_url' => 'dQw4w9WgXcQ',
                'duration' => 600,
                'is_free' => true,
                'content' => null,
            ]
        );

        Lesson::updateOrCreate(
            [
                'section_id' => $section1->id,
                'order' => 2,
            ],
            [
                'title' => 'Database Schema Design',
                'type' => 'video',
                'video_url' => 'dQw4w9WgXcQ',
                'duration' => 1200,
                'is_free' => false,
                'content' => null,
            ]
        );

        Lesson::updateOrCreate(
            [
                'section_id' => $section2->id,
                'order' => 1,
            ],
            [
                'title' => 'Setting up Vite and Tailwind',
                'type' => 'video',
                'video_url' => 'dQw4w9WgXcQ',
                'duration' => 900,
                'is_free' => false,
                'content' => null,
            ]
        );

        $this->command->info('Database seeded successfully with users, categories, course sections, and lessons.');
        $this->command->warn('Demo password for all seeded users: Password123!');
    }
}