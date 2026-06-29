<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\BlogPost;
use App\Models\Course;
use App\Models\Event;
use App\Models\Lesson;
use App\Models\Review;
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

        $catBlogCareer = Category::updateOrCreate(
            ['slug' => 'career-guides'],
            [
                'name' => 'Career Guides',
                'type' => 'blog',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Blog Posts
        |--------------------------------------------------------------------------
        */
        $blogPosts = [
            [
                'title' => 'How Mobile Repairing Skills Can Build a Real Career',
                'slug' => 'mobile-repairing-skills-real-career',
                'excerpt' => 'A practical guide to turning mobile repairing skills into income, job opportunities, and a service business.',
                'content' => implode("\n\n", [
                    'Mobile repairing is a practical skill that can create income quickly when it is learned with the right process.',
                    'Start with diagnostics, charging issues, display replacement, battery health, and safe tool handling. These are the problems customers bring most often.',
                    'Build trust by documenting every repair, explaining the issue clearly, and giving realistic delivery times.',
                    'After learning the basics, add software troubleshooting, data backup, and professional customer support to increase your value.',
                ]),
                'cover_url' => 'https://images.unsplash.com/photo-1581092918056-0e67c8d3e217?w=1200&q=80',
                'author_name' => 'iLab Team',
                'author_avatar' => null,
                'meta_title' => 'Mobile Repairing Career Guide | iLab BD',
                'meta_description' => 'Learn how mobile repairing skills can help you build a job-ready career or start a repair business in Bangladesh.',
                'is_published' => true,
                'published_at' => now()->subDays(4),
            ],
            [
                'title' => 'What to Learn Before Joining a Mobile Repairing Course',
                'slug' => 'before-joining-mobile-repairing-course',
                'excerpt' => 'The simple preparation steps that help beginners get more value from a hands-on mobile repairing course.',
                'content' => implode("\n\n", [
                    'You do not need advanced technical knowledge before joining a mobile repairing course, but a little preparation helps a lot.',
                    'Learn the basic names of phone parts, understand how to handle tools safely, and practice careful observation.',
                    'Bring a notebook and write down symptoms, possible causes, and repair steps during every class.',
                    'The goal is not memorization. The goal is learning a repeatable diagnostic process.',
                ]),
                'cover_url' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80',
                'author_name' => 'Tahsin Ahmad',
                'author_avatar' => null,
                'meta_title' => 'Before Joining a Mobile Repairing Course | iLab BD',
                'meta_description' => 'Beginner preparation tips before joining a mobile repairing course at iLab BD.',
                'is_published' => true,
                'published_at' => now()->subDays(9),
            ],
        ];

        foreach ($blogPosts as $post) {
            BlogPost::updateOrCreate(
                ['slug' => $post['slug']],
                array_merge($post, [
                    'category_id' => $catBlogCareer->id,
                    'author_id' => $instructor->id,
                ])
            );
        }

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
                'is_featured' => true,
                'type' => 'self_paced',
                'level' => 'intermediate',
                'language' => 'Bengali',
                'tags' => ['Laravel', 'React', 'API', 'Web'],
                'prerequisites' => ['Basic PHP', 'Basic JavaScript'],
                'learning_outcomes' => [
                    'Design Laravel APIs for a decoupled React application',
                    'Build protected authentication flows with Sanctum tokens',
                    'Structure course, section, lesson, enrollment, and progress data',
                    'Connect React pages to real Laravel API responses',
                    'Prepare an EdTech project for production-level improvements',
                ],
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

        /*
        |--------------------------------------------------------------------------
        | Reviews
        |--------------------------------------------------------------------------
        */
        $reviews = [
            [
                'student_name' => 'Sadia Rahman',
                'student_role' => 'Frontend Engineer',
                'avatar' => null,
                'rating' => 5,
                'review_text' => 'iLab helped me build a real portfolio and understand how production projects are structured.',
                'media_type' => 'text',
                'media_url' => null,
                'thumbnail' => null,
                'sort_order' => 1,
            ],
            [
                'student_name' => 'Tanvir Hasan',
                'student_role' => 'Mobile Repair Technician',
                'avatar' => null,
                'rating' => 5,
                'review_text' => 'The lessons were practical and the instructor explained each repair step clearly.',
                'media_type' => 'text',
                'media_url' => null,
                'thumbnail' => null,
                'sort_order' => 2,
            ],
            [
                'student_name' => 'Maliha Chowdhury',
                'student_role' => 'Freelancer',
                'avatar' => null,
                'rating' => 5,
                'review_text' => 'I started taking client work after finishing the course projects.',
                'media_type' => 'text',
                'media_url' => null,
                'thumbnail' => null,
                'sort_order' => 3,
            ],
        ];

        foreach ($reviews as $review) {
            Review::updateOrCreate(
                ['student_name' => $review['student_name']],
                array_merge(['is_published' => true], $review)
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Events
        |--------------------------------------------------------------------------
        */
        $events = [
            [
                'title' => 'Free Mobile Repairing Workshop',
                'slug' => 'free-mobile-repairing-workshop',
                'event_type' => 'Workshop',
                'starts_at' => now()->addDays(10)->setTime(15, 0),
                'ends_at' => now()->addDays(10)->setTime(17, 0),
                'location' => 'Online (Zoom)',
                'seats' => 200,
                'cover_url' => 'https://images.unsplash.com/photo-1581092918056-0e67c8d3e217?w=1200&q=80',
                'description' => 'Learn smartphone diagnostics, screen replacement, battery health testing, and practical repair workflow from expert trainers.',
                'meta_title' => 'Free Mobile Repairing Workshop | iLab BD',
                'meta_description' => 'Register for a free iLab mobile repairing workshop and learn practical smartphone repair skills from expert trainers.',
                'is_published' => true,
            ],
            [
                'title' => 'Career Talk: From Repair Shop to Tech Entrepreneur',
                'slug' => 'career-talk-repair-shop-to-tech-entrepreneur',
                'event_type' => 'Webinar',
                'starts_at' => now()->addDays(17)->setTime(19, 0),
                'ends_at' => now()->addDays(17)->setTime(20, 30),
                'location' => 'Online (Facebook Live)',
                'seats' => 500,
                'cover_url' => 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80',
                'description' => 'Hear from successful iLab graduates who turned mobile repairing skills into full-time businesses.',
                'meta_title' => 'Mobile Repairing Career Talk | iLab BD',
                'meta_description' => 'Join iLab graduates and mentors for a live career talk about building a business from mobile repairing skills.',
                'is_published' => true,
            ],
            [
                'title' => 'Finished Demo Event',
                'slug' => 'finished-demo-event',
                'event_type' => 'Workshop',
                'starts_at' => now()->subDays(5)->setTime(15, 0),
                'ends_at' => now()->subDays(5)->setTime(17, 0),
                'location' => 'Dhaka, Bangladesh',
                'seats' => 100,
                'cover_url' => 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=1200&q=80',
                'description' => 'This demo event is already finished, so the frontend should show the finished state and disable registration.',
                'meta_title' => 'Finished Demo Event | iLab BD',
                'meta_description' => 'This event is finished and registration is closed.',
                'is_published' => true,
            ],
        ];

        foreach ($events as $event) {
            Event::updateOrCreate(['slug' => $event['slug']], $event);
        }

        $this->command->info('Database seeded successfully with users, categories, blog posts, course sections, lessons, reviews, and events.');
        $this->command->warn('Demo password for all seeded users: Password123!');
    }
}
