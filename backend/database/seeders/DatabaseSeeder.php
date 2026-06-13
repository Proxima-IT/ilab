<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Course;
use App\Models\Section;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Core Users
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@domainname.com',
            'phone' => '+8801700000001',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);

        $instructor = User::create([
            'name' => 'Tahsin Ahmad',
            'email' => 'instructor@domainname.com',
            'phone' => '+8801700000002',
            'password' => Hash::make('password'),
            'role' => 'admin', // Admins can create courses
            'bio' => 'Backend Specialist & Tech Educator',
        ]);

        $student = User::create([
            'name' => 'Demo Student',
            'email' => 'student@domainname.com',
            'phone' => '+8801700000003',
            'password' => Hash::make('password'),
            'role' => 'student',
        ]);

        // 2. Create Categories
        $catWeb = Category::create(['name' => 'Web Development', 'slug' => 'web-development', 'type' => 'course']);
        $catApp = Category::create(['name' => 'Mobile App', 'slug' => 'mobile-app', 'type' => 'course']);

        // 3. Create a Master Course
        $course = Course::create([
            'instructor_id' => $instructor->id,
            'category_id' => $catWeb->id,
            'title' => 'Complete Laravel & React Bootcamp',
            'slug' => 'complete-laravel-react-bootcamp',
            'description' => 'Master decoupled architecture by building a real-world EdTech platform from scratch.',
            'thumbnail' => 'https://via.placeholder.com/800x450.png?text=Laravel+React+Bootcamp',
            'price' => 5000.00,
            'discount_price' => 2500.00,
            'status' => 'published',
            'type' => 'self_paced',
            'level' => 'Intermediate',
            'language' => 'Bengali',
            'tags' => ['Laravel', 'React', 'API', 'Web'],
        ]);

        // 4. Create Sections & Lessons
        $section1 = Section::create(['course_id' => $course->id, 'title' => 'Module 1: API Architecture', 'order' => 1]);
        
        Lesson::create([
            'section_id' => $section1->id,
            'title' => 'Introduction to Decoupled Systems',
            'type' => 'video',
            'video_url' => 'dQw4w9WgXcQ', // Dummy YouTube ID
            'duration' => 600,
            'is_free' => true, // Preview lesson
            'order' => 1,
        ]);

        Lesson::create([
            'section_id' => $section1->id,
            'title' => 'Database Schema Design',
            'type' => 'video',
            'video_url' => 'dQw4w9WgXcQ',
            'duration' => 1200,
            'is_free' => false,
            'order' => 2,
        ]);

        $section2 = Section::create(['course_id' => $course->id, 'title' => 'Module 2: React Frontend', 'order' => 2]);
        
        Lesson::create([
            'section_id' => $section2->id,
            'title' => 'Setting up Vite and Tailwind',
            'type' => 'video',
            'video_url' => 'dQw4w9WgXcQ',
            'duration' => 900,
            'is_free' => false,
            'order' => 1,
        ]);

        echo "✅ Database seeded successfully with Users, Categories, and a Course Hierarchy!\n";
    }
}