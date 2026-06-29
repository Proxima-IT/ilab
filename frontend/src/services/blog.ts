import { get } from "@/lib/api";
import { imageUrl } from "@/services/course-catalog.service";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  cover: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string[];
  metaTitle: string;
  metaDescription: string;
};

type LaravelBlogPost = {
  id: number | string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_url?: string | null;
  author_name?: string | null;
  author_avatar?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  category?: {
    name?: string | null;
  } | null;
  author?: {
    name?: string | null;
    avatar?: string | null;
  } | null;
};

type BlogPostsResponse = {
  success: boolean;
  data: LaravelBlogPost[];
  message: string;
  errors: unknown;
};

type BlogPostResponse = {
  success: boolean;
  data: LaravelBlogPost;
  message: string;
  errors: unknown;
};

function formatDate(value?: string | null): string {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function splitContent(content?: string | null): string[] {
  if (!content) return [];

  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function fallbackAvatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`;
}

function mapPost(post: LaravelBlogPost): BlogPost {
  const authorName = post.author?.name || post.author_name || "iLab Team";
  const authorAvatar = post.author?.avatar || post.author_avatar;
  const excerpt = post.excerpt || "";

  return {
    id: String(post.id),
    slug: post.slug,
    title: post.title,
    excerpt,
    category: post.category?.name || "Blog",
    date: formatDate(post.published_at || post.created_at),
    cover: imageUrl(post.cover_url),
    author: {
      name: authorName,
      avatar: authorAvatar ? imageUrl(authorAvatar) : fallbackAvatar(authorName),
    },
    content: splitContent(post.content),
    metaTitle: post.meta_title || `${post.title} | iLab BD Blog`,
    metaDescription:
      post.meta_description ||
      excerpt ||
      "Read iLab BD blog articles, mobile repairing guides, and career resources.",
  };
}

export async function fetchPosts(): Promise<BlogPost[]> {
  const response = await get<BlogPostsResponse>("/blog-posts?per_page=24");
  return response.data.map(mapPost);
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const response = await get<BlogPostResponse>(
      `/blog-posts/${encodeURIComponent(slug)}`
    );

    return mapPost(response.data);
  } catch {
    return null;
  }
}
