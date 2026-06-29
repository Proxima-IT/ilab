import { get } from "@/lib/api";
import {
  fetchPublicCourses,
  imageUrl,
  type Course,
} from "@/services/course-catalog.service";

export type HomeReview = {
  id: string;
  type: "text" | "image" | "video";
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  image?: string;
  thumbnail?: string;
  video?: string;
};

type LaravelReview = {
  id: number | string;
  student_name: string;
  student_role?: string | null;
  avatar?: string | null;
  rating?: number | string | null;
  review_text?: string | null;
  media_type?: string | null;
  media_url?: string | null;
  thumbnail?: string | null;
};

type ReviewsResponse = {
  success: boolean;
  data: LaravelReview[];
  message: string;
  errors: unknown;
};

function avatarUrl(path: string | null | undefined, name: string): string {
  if (path) return imageUrl(path);

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F97316&color=fff`;
}

export async function fetchFeaturedCourses(limit = 8): Promise<Course[]> {
  const result = await fetchPublicCourses({
    featured: true,
    sort: "newest",
    perPage: limit,
  });

  return result.items;
}

export async function fetchFreeCourses(limit = 8): Promise<Course[]> {
  const result = await fetchPublicCourses({
    free: true,
    sort: "newest",
    perPage: limit,
  });

  return result.items;
}

export async function fetchPublicReviews(limit = 6): Promise<HomeReview[]> {
  const response = await get<ReviewsResponse>(`/reviews?per_page=${limit}`);

  return response.data.map((review) => {
    const mediaType = review.media_type === "video"
      ? "video"
      : review.media_type === "image"
        ? "image"
        : "text";

    return {
      id: String(review.id),
      type: mediaType,
      name: review.student_name,
      role: review.student_role || "",
      avatar: avatarUrl(review.avatar, review.student_name),
      rating: Math.max(1, Math.min(5, Number(review.rating || 5))),
      text: review.review_text || "",
      image: mediaType === "image" && review.media_url ? imageUrl(review.media_url) : undefined,
      thumbnail:
        mediaType === "video" && review.thumbnail
          ? imageUrl(review.thumbnail)
          : mediaType === "video" && review.media_url
            ? imageUrl(review.media_url)
            : undefined,
      video: mediaType === "video" && review.media_url ? imageUrl(review.media_url) : undefined,
    };
  });
}
