<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    public static function defaults(): array
    {
        return [
            'hero' => [
                'title_line_1' => 'Learn Mobile Repairing.',
                'title_line_2' => 'Build a Real Career.',
                'description' => 'Job-ready skills, expert instructors, and certified training to help you get hired or start your own business.',
                'primary_button_label' => 'Download Our App',
                'primary_button_url' => '#download',
                'secondary_button_label' => 'Watch on YouTube',
                'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'image' => null,
                'counts' => [
                    ['label' => 'Total Students', 'value' => '5,000+'],
                    ['label' => 'Total Videos', 'value' => '1,200+'],
                    ['label' => 'Total Courses', 'value' => '50+'],
                ],
            ],
            'next_batch' => [
                'eyebrow' => 'Watch Preview',
                'title' => 'A glimpse of our next batch',
                'course_info' => 'Join the next practical batch with expert guidance and hands-on learning.',
                'image' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
                'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            ],
            'offers' => [
                'title' => 'What we',
                'highlight' => 'offers!',
                'description' => 'Unlimited help, guidelines, even Google Meet screen-sharing to solve your problems - join this course to get it all.',
                'items' => [
                    [
                        'icon' => 'briefcase',
                        'title' => 'Job Interview Training',
                        'description' => 'Special job interview training for learners who finish practical tracks with strong projects.',
                    ],
                    [
                        'icon' => 'users',
                        'title' => '1:1 Mentorship',
                        'description' => 'Expert mentors help plan your roadmap, solve problems, and guide you to your goal.',
                    ],
                    [
                        'icon' => 'headphones',
                        'title' => 'Support Session',
                        'description' => 'Ask questions, share your screen, and get direct support when you need it.',
                    ],
                ],
            ],
            'download_app' => [
                'title' => 'Download iLab App',
                'description' => 'Excel your learning curve and embrace new experiences on the go.',
                'button_label_top' => 'GET IT ON',
                'button_label' => 'Google Play',
                'button_url' => '#',
                'downloads_count' => '25K+',
                'image' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80',
            ],
            'reviews' => [
                'eyebrow' => 'Student Reviews',
                'title' => 'Loved by',
                'highlight' => 'our learners',
                'description' => 'Real stories from students building practical skills with iLab.',
            ],
        ];
    }

    public static function allSettings(): array
    {
        $defaults = self::defaults();
        $saved = self::query()->pluck('value', 'key')->all();

        foreach ($defaults as $key => $value) {
            if (array_key_exists($key, $saved) && is_array($saved[$key])) {
                $defaults[$key] = array_replace_recursive($value, $saved[$key]);
            }
        }

        return $defaults;
    }
}
