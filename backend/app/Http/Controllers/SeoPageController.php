<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\Course;
use App\Models\Event;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class SeoPageController extends Controller
{
    public function course(string $slug): Response
    {
        $course = Course::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        return $this->render([
            'title' => $course->meta_title ?: $course->title . ' | iLab BD',
            'description' => $course->meta_description ?: $course->description,
            'image' => $course->thumbnail,
            'url' => '/courses/' . $course->slug,
            'type' => 'website',
        ]);
    }

    public function blog(string $slug): Response
    {
        $post = BlogPost::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return $this->render([
            'title' => $post->meta_title ?: $post->title . ' | iLab BD',
            'description' => $post->meta_description ?: ($post->excerpt ?: $post->content),
            'image' => $post->cover_url,
            'url' => '/blog/' . $post->slug,
            'type' => 'article',
        ]);
    }

    public function event(string $slug): Response
    {
        $event = Event::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return $this->render([
            'title' => $event->meta_title ?: $event->title . ' | iLab BD',
            'description' => $event->meta_description ?: $event->description,
            'image' => $event->cover_url,
            'url' => '/events/' . $event->slug,
            'type' => 'website',
        ]);
    }

    private function render(array $meta): Response
    {
        $indexPath = $this->indexPath();

        abort_unless(is_file($indexPath), 404);

        $html = file_get_contents($indexPath);

        $title = $this->cleanTitle($meta['title'] ?? 'iLab BD');
        $description = $this->cleanDescription($meta['description'] ?? '');
        $image = $this->absoluteImageUrl($meta['image'] ?? null);
        $url = $this->frontendUrl($meta['url'] ?? '/');
        $type = $meta['type'] ?? 'website';

        $replacements = [
            'title' => $title,
            'description' => $description,
            'canonical' => $url,
            'og:type' => $type,
            'og:title' => $title,
            'og:description' => $description,
            'og:image' => $image,
            'og:image:alt' => $title,
            'og:url' => $url,
            'twitter:title' => $title,
            'twitter:description' => $description,
            'twitter:image' => $image,
            'twitter:image:alt' => $title,
        ];

        foreach ($replacements as $key => $value) {
            $html = $this->replaceMeta($html, $key, $value);
        }

        $html = preg_replace(
            '/<title>.*?<\/title>/is',
            '<title>' . e($title) . '</title>',
            $html,
            1
        ) ?: $html;

        return response($html)->header('Content-Type', 'text/html; charset=UTF-8');
    }

    private function replaceMeta(string $html, string $name, string $value): string
    {
        $escapedValue = e($value);

        if ($name === 'canonical') {
            return preg_replace(
                '/<link\s+rel=["\']canonical["\']\s+href=["\'][^"\']*["\']\s*\/?>/i',
                '<link rel="canonical" href="' . $escapedValue . '" />',
                $html,
                1
            ) ?: $html;
        }

        $attribute = Str::startsWith($name, ['og:']) ? 'property' : 'name';
        $pattern = '/<meta\s+' . $attribute . '=["\']' . preg_quote($name, '/') . '["\']\s+content=["\'][^"\']*["\']\s*\/?>/i';
        $replacement = '<meta ' . $attribute . '="' . $name . '" content="' . $escapedValue . '" />';
        $updated = preg_replace($pattern, $replacement, $html, 1);

        if ($updated !== $html) {
            return $updated ?: $html;
        }

        return str_replace('</head>', '    ' . $replacement . "\n  </head>", $html);
    }

    private function indexPath(): string
    {
        $paths = array_filter([
            config('app.frontend_index_path'),
            base_path('../frontend/index.html'),
            base_path('../frontend/dist/index.html'),
            '/var/www/ilab/frontend/index.html',
        ]);

        foreach ($paths as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return (string) (config('app.frontend_index_path') ?: base_path('../frontend/index.html'));
    }

    private function cleanTitle(string $title): string
    {
        $title = trim(strip_tags($title));

        return Str::limit($title ?: 'iLab BD', 70, '');
    }

    private function cleanDescription(?string $description): string
    {
        $description = trim(preg_replace('/\s+/', ' ', strip_tags((string) $description)));

        return Str::limit($description ?: 'Learn practical technology skills with iLab BD.', 160, '');
    }

    private function absoluteImageUrl(?string $path): string
    {
        $fallback = $this->frontendUrl('/og-image.jpg');

        if (! $path) {
            return $fallback;
        }

        $path = trim($path);

        if (preg_match('/^https?:\/\//i', $path)) {
            if (preg_match('/\/storage\/(.+)$/i', $path, $matches)) {
                return $this->frontendUrl('/storage/' . ltrim($matches[1], '/'));
            }

            return $path;
        }

        $path = ltrim($path, '/');

        if ($path === '' || $path === 'storage') {
            return $fallback;
        }

        if (Str::startsWith($path, 'storage/')) {
            return $this->frontendUrl('/' . $path);
        }

        return $this->frontendUrl('/' . $path);
    }

    private function frontendUrl(string $path): string
    {
        return rtrim((string) config('app.frontend_url'), '/') . '/' . ltrim($path, '/');
    }
}
