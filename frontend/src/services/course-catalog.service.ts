import { get } from "@/lib/api";

export type Level = "Beginner" | "Intermediate" | "Advanced";
export type Category = string;
export type Mode = "Online" | "Offline";

export type CourseCategoryOption = {
  id: string;
  name: string;
  slug: string;
  coursesCount: number;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  category: Category;
  categoryId?: string;
  level: Level;
  mode: Mode;
  rating: number;
  students: number;
  hours: number;
  lessons: number;
  price: number;
  originalPrice?: number;
  tag?: string;
  cover: string;
  createdAt: string;
};

export const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];
export const MODES: Mode[] = ["Online", "Offline"];

export const SORTS = [
  "newest",
  "popular",
  "rating",
  "price-asc",
  "price-desc",
] as const;

export type Sort = (typeof SORTS)[number];

export type CoursesQuery = {
  q?: string;
  categoryId?: string;
  level?: string;
  mode?: string;
  sort?: Sort;
  page?: number;
  perPage?: number;
  free?: boolean;
  featured?: boolean;
};

export type CoursesResult = {
  items: Course[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

type LaravelCategory = {
  id: number | string;
  name: string;
  slug: string;
  courses_count?: number;
};

export type LaravelCourse = {
  id: number | string;
  title: string;
  slug: string;
  thumbnail?: string | null;
  price?: string | number | null;
  discount_price?: string | number | null;
  type?: "self_paced" | "batch" | "free" | string;
  level?: "beginner" | "intermediate" | "advanced" | string;
  created_at?: string;
  learning_outcomes?: string[] | string | null;
  category?: {
    id?: number | string;
    name?: string;
    slug?: string;
  } | null;
  instructor?: {
    id?: number | string;
    name?: string | null;
    avatar?: string | null;
    bio?: string | null;
  } | null;
  sections?: LaravelCourseSection[];
  enrollments_count?: number;
  instructor_stats?: {
    courses_count?: number;
    students_count?: number;
  } | null;
};

type LaravelCourseLesson = {
  id: number | string;
  title: string;
  type: "video" | "pdf" | "quiz" | "live_session" | string;
  duration?: number | string | null;
  is_free?: boolean | number;
};

type LaravelCourseSection = {
  id: number | string;
  title: string;
  lessons?: LaravelCourseLesson[];
};

type LaravelCategoriesResponse = {
  success: boolean;
  data: LaravelCategory[];
  message: string;
  errors: unknown;
};

type LaravelCoursesResponse = {
  success: boolean;
  data: LaravelCourse[];
  message: string;
  errors: unknown;
  meta?: {
    pagination?: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  };
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80";

export function backendSiteUrl(): string {
  const explicit = import.meta.env.VITE_BACKEND_URL as string | undefined;

  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1") as string;

  return apiBase.replace(/\/api\/v\d+\/?$/, "").replace(/\/+$/, "");
}

export function storageSiteUrl(): string {
  const explicit = import.meta.env.VITE_STORAGE_URL as string | undefined;

  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  return `${backendSiteUrl()}/storage`;
}

export function imageUrl(path?: string | null): string {
  if (!path) return FALLBACK_COVER;

  if (/^https?:\/\//i.test(path)) {
    const storagePath = path.match(/\/storage\/(.+)$/i)?.[1];

    if (storagePath) {
      return `${storageSiteUrl()}/${storagePath.replace(/^\/+/, "")}`;
    }

    return path;
  }

  const cleanPath = path.replace(/^\/+|\/+$/g, "");

  if (!cleanPath || cleanPath === "storage") {
    return FALLBACK_COVER;
  }

  if (cleanPath.startsWith("storage/")) {
    return `${storageSiteUrl()}/${cleanPath.replace(/^storage\/+/, "")}`;
  }

  return `${backendSiteUrl()}/${cleanPath}`;
}

export function toNumber(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeLevel(level?: string): Level {
  if (level === "intermediate") return "Intermediate";
  if (level === "advanced") return "Advanced";
  return "Beginner";
}

export function normalizeMode(type?: string): Mode {
  return type === "batch" ? "Offline" : "Online";
}

export function countLessons(course: LaravelCourse): number {
  if (!Array.isArray(course.sections)) return 0;

  return course.sections.reduce((total, section) => {
    return total + (Array.isArray(section.lessons) ? section.lessons.length : 0);
  }, 0);
}

export function totalLessonSeconds(course: LaravelCourse): number {
  if (!Array.isArray(course.sections)) return 0;

  return course.sections.reduce((total, section) => {
    if (!Array.isArray(section.lessons)) return total;

    return total + section.lessons.reduce((lessonTotal, lesson) => {
      const duration = Number(lesson.duration || 0);
      return lessonTotal + (Number.isFinite(duration) ? duration : 0);
    }, 0);
  }, 0);
}

export function mapCourse(course: LaravelCourse): Course {
  const regularPrice = toNumber(course.price);
  const discountPrice =
    course.discount_price !== null && course.discount_price !== undefined
      ? toNumber(course.discount_price)
      : null;

  const finalPrice = discountPrice ?? regularPrice;
  const lessonCount = countLessons(course);
  const totalSeconds = totalLessonSeconds(course);
  const realHours = totalSeconds > 0 ? Math.max(1, Math.ceil(totalSeconds / 3600)) : 0;

  return {
    id: String(course.id),
    slug: course.slug,
    title: course.title,
    instructor: course.instructor?.name || "iLab Instructor",
    category: course.category?.name || "Uncategorized",
    categoryId: course.category?.id ? String(course.category.id) : undefined,
    level: normalizeLevel(course.level),
    mode: normalizeMode(course.type),
    rating: 0,
    students: Number(course.enrollments_count || 0),
    hours: realHours,
    lessons: lessonCount,
    price: finalPrice,
    originalPrice:
      discountPrice !== null && regularPrice > finalPrice
        ? regularPrice
        : undefined,
    tag: course.type === "free" || finalPrice === 0 ? "Free" : undefined,
    cover: imageUrl(course.thumbnail),
    createdAt: course.created_at || new Date().toISOString(),
  };
}

function sortCourses(items: Course[], sort: Sort): Course[] {
  const sorted = [...items];

  switch (sort) {
    case "popular":
      return sorted.sort((a, b) => b.students - a.students);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "newest":
    default:
      return sorted.sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
      );
  }
}

export async function fetchCourseCategories(): Promise<CourseCategoryOption[]> {
  const response = await get<LaravelCategoriesResponse>("/categories?type=course");

  return response.data.map((category) => ({
    id: String(category.id),
    name: category.name,
    slug: category.slug,
    coursesCount: Number(category.courses_count || 0),
  }));
}

export async function fetchPublicCourses(
  query: CoursesQuery = {}
): Promise<CoursesResult> {
  const {
    q = "",
    categoryId = "",
    level = "",
    mode = "",
    sort = "newest",
    page = 1,
    perPage = 9,
  free,
  featured,
  } = query;

  const params = new URLSearchParams();

  if (q.trim()) params.set("search", q.trim());
  if (categoryId) params.set("category_id", categoryId);
  if (level) params.set("level", level.toLowerCase());

  if (free === true) {
    params.set("free", "1");
  } else if (mode === "Offline") {
    params.set("type", "batch");
  } else if (mode === "Online") {
    params.set("type", "self_paced");
  }

  if (featured === true) params.set("featured", "1");

  params.set("page", String(page));
  params.set("per_page", String(perPage));

  const response = await get<LaravelCoursesResponse>(
    `/courses?${params.toString()}`
  );

  let items = response.data.map(mapCourse);

  if (free === false) {
    items = items.filter((course) => course.price > 0);
  }

  items = sortCourses(items, sort);

  const pagination = response.meta?.pagination;

  return {
    items,
    total: pagination?.total ?? items.length,
    page: pagination?.current_page ?? page,
    perPage: pagination?.per_page ?? perPage,
    totalPages:
      pagination?.last_page ?? Math.max(1, Math.ceil(items.length / perPage)),
  };
}


export type CourseLessonType = "video" | "pdf" | "quiz" | "live";

export type CourseDetailLesson = {
  id: string;
  title: string;
  type: CourseLessonType;
  duration: string;
  isFree: boolean;
};

export type CourseDetailSection = {
  id: string;
  title: string;
  lessons: CourseDetailLesson[];
};

export type PublicCourseDetails = Course & {
  description: string;
  language: string;
  updatedAt: string;
  introVideo: string | null;
  prerequisites: string[];
  learningOutcomes: string[];
  tags: string[];
  instructorBio: string;
  instructorAvatar: string | null;
  instructorCoursesCount: number;
  instructorStudentsCount: number;
  sections: CourseDetailSection[];
};

type LaravelCourseDetailsResponse = {
  success: boolean;
  data: LaravelCourse & {
    description?: string | null;
    language?: string | null;
    intro_video?: string | null;
    updated_at?: string | null;
    tags?: string[] | string | null;
    prerequisites?: string[] | string | null;
    learning_outcomes?: string[] | string | null;
    sections?: LaravelCourseSection[];
  };
  message: string;
  errors: unknown;
};

function parseList(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function normalizeLessonType(type?: string): CourseLessonType {
  if (type === "pdf") return "pdf";
  if (type === "quiz") return "quiz";
  if (type === "live_session") return "live";
  return "video";
}

function formatDuration(value: string | number | null | undefined): string {
  const seconds = Number(value ?? 0);

  if (!Number.isFinite(seconds) || seconds <= 0) return "--";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export async function fetchPublicCourseBySlug(
  slug: string
): Promise<PublicCourseDetails> {
  const response = await get<LaravelCourseDetailsResponse>(
    `/courses/${encodeURIComponent(slug)}`
  );

  const base = mapCourse(response.data);
  const sections = (response.data.sections || []).map((section) => ({
    id: String(section.id),
    title: section.title,
    lessons: (section.lessons || []).map((lesson) => ({
      id: String(lesson.id),
      title: lesson.title,
      type: normalizeLessonType(lesson.type),
      duration: formatDuration(lesson.duration),
      isFree: Boolean(lesson.is_free),
    })),
  }));

  return {
    ...base,
    description: response.data.description || "",
    language: response.data.language || "Bangla",
    updatedAt: response.data.updated_at || response.data.created_at || new Date().toISOString(),
    introVideo: response.data.intro_video || null,
    prerequisites: parseList(response.data.prerequisites),
    learningOutcomes: parseList(response.data.learning_outcomes),
    tags: parseList(response.data.tags),
    instructorBio: response.data.instructor?.bio || "",
    instructorAvatar: response.data.instructor?.avatar
      ? imageUrl(response.data.instructor.avatar)
      : null,
    instructorCoursesCount: Number(response.data.instructor_stats?.courses_count || 0),
    instructorStudentsCount: Number(response.data.instructor_stats?.students_count || 0),
    sections,
  };
}
