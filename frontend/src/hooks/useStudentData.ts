import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useAuth } from "@/lib/auth";
import {
  imageUrl,
  normalizeLevel,
  normalizeMode,
  toNumber,
  type Course,
} from "@/services/course-catalog.service";
import { avatarUrl } from "@/lib/avatar";
import {
  studentProfileService,
  type StudentProfileUser,
} from "@/services/student/profile.service";
import { authStore } from "@/lib/auth";

export type StudentData = {
  name: string;
  email: string;
  avatar: string;
  profileUser: StudentProfileUser;
  level: number;
  xp: number;
  xpMax: number;
  enrolledCourses: number;
  overallProgress: number;
  streak: number;
};

export type EnrolledCourseInfo = {
  course: Course;
  progress: number;
  status: string;
  enrollmentId: string;
  firstLessonId: string | null;
  completedLessons: number;
  totalLessons: number;
  totalHours: number;
};

export type StudentContextType = {
  loading: boolean;
  student: StudentData | null;
  profileUser: StudentProfileUser | null;
  enrolledCoursesList: EnrolledCourseInfo[];
  refetch: () => Promise<void>;
  updateCourseProgress: (courseId: string, progress: number) => void;
};

function isUnauthorizedError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } }).response?.status;
  return status === 401 || status === 403;
}

type LaravelEnrollment = {
  id?: number | string;
  course_id?: number | string;
  status?: string;
  course?: {
    id?: number | string;
    title?: string;
    slug?: string;
    thumbnail?: string | null;
    price?: number | string | null;
    discount_price?: number | string | null;
    level?: string | null;
    type?: string | null;
    created_at?: string;
    category?: {
      name?: string | null;
    } | null;
    instructor?: {
      name?: string | null;
    } | null;
    sections?: Array<{
      id?: number | string;
      lessons?: Array<{
        id?: number | string;
        duration?: number | string | null;
      }>;
    }>;
  } | null;
};

type LaravelLessonProgress = {
  lesson_id?: number | string;
  is_completed?: boolean | number;
  lesson?: {
    section?: {
      course_id?: number | string;
    } | null;
  } | null;
};

export const StudentDataContext = createContext<StudentContextType | null>(null);

function resolveAvatar(avatar: string | null | undefined, name: string): string {
  return avatarUrl(avatar, name);
}

function saveProgress(email: string, courseId: string, progress: number) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    `ilab.progress.${email}.${courseId}`,
    String(Math.max(0, Math.min(100, progress)))
  );
}

function normalizeLaravelEnrollment(
  enrollment: LaravelEnrollment,
  progressItems: LaravelLessonProgress[]
): EnrolledCourseInfo | null {
  if (!enrollment.course?.id || !enrollment.course?.title || !enrollment.course?.slug) {
    return null;
  }

  const courseId = String(enrollment.course.id);
  const lessons = (enrollment.course.sections || []).flatMap((section) =>
    section.lessons || []
  );
  const lessonIds = new Set(lessons.map((lesson) => String(lesson.id)));
  const completedLessons = progressItems.filter((progress) => {
    const progressCourseId = progress.lesson?.section?.course_id;

    return (
      Boolean(progress.is_completed) &&
      lessonIds.has(String(progress.lesson_id)) &&
      String(progressCourseId) === courseId
    );
  }).length;
  const totalLessons = lessons.length;
  const progress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const totalSeconds = lessons.reduce((total, lesson) => {
    return total + toNumber(lesson.duration);
  }, 0);
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

  const course: Course = {
    id: String(enrollment.course.id),
    slug: enrollment.course.slug,
    title: enrollment.course.title,
    instructor: enrollment.course.instructor?.name || "Instructor",
    category: enrollment.course.category?.name || "Course",
    level: normalizeLevel(enrollment.course.level || undefined),
    mode: normalizeMode(enrollment.course.type || undefined),
    rating: 0,
    students: 0,
    hours: totalHours,
    lessons: totalLessons,
    price: toNumber(enrollment.course.discount_price ?? enrollment.course.price),
    cover: imageUrl(enrollment.course.thumbnail),
    createdAt: enrollment.course.created_at || new Date().toISOString(),
  };

  return {
    course,
    progress,
    status: enrollment.status || "active",
    enrollmentId: String(enrollment.id || `enrollment-${course.id}`),
    firstLessonId: lessons[0]?.id ? String(lessons[0].id) : null,
    completedLessons,
    totalLessons,
    totalHours,
  };
}

export function useStudentDataValue(): StudentContextType {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [enrolledCoursesList, setEnrolledCoursesList] = useState<
    EnrolledCourseInfo[]
  >([]);

  const loadStudentData = useCallback(async () => {
    if (!user) {
      setStudent(null);
      setEnrolledCoursesList([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const profileResponse = await studentProfileService.getProfile();
      const profileUser = profileResponse.data.user;

      const name = profileUser.name || user.name || "Student";
      const email = profileUser.email || user.email || "";
      const avatar = resolveAvatar(profileUser.avatar, name);

      const apiEnrollments = Array.isArray(profileUser.enrollments)
        ? (profileUser.enrollments as LaravelEnrollment[])
        : [];
      const apiProgress = Array.isArray(profileUser.progress)
        ? (profileUser.progress as LaravelLessonProgress[])
        : [];

      const enrolledList: EnrolledCourseInfo[] = [];
      const processedCourseIds = new Set<string>();

      for (const enrollment of apiEnrollments) {
        const enrolledCourse = normalizeLaravelEnrollment(enrollment, apiProgress);

        if (!enrolledCourse || processedCourseIds.has(enrolledCourse.course.id)) continue;

        processedCourseIds.add(enrolledCourse.course.id);

        enrolledList.push(enrolledCourse);
      }

      const totalCourses = enrolledList.length;
      const totalProgress = enrolledList.reduce(
        (sum, item) => sum + item.progress,
        0
      );

      const overallProgress =
        totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;

      const xp = totalProgress * 15;
      const level = 1 + Math.floor(xp / 1000);
      const xpMax = level * 1000;
      const xpCurrent = xp % 1000;

      setStudent({
        name,
        email,
        avatar,
        profileUser,
        level,
        xp: xpCurrent,
        xpMax,
        enrolledCourses: totalCourses,
        overallProgress,
        streak: 5,
      });

      setEnrolledCoursesList(enrolledList);
    } catch (error) {
      console.error("Error loading student data:", error);

      if (isUnauthorizedError(error)) {
        authStore.clearSession();
        setStudent(null);
        setEnrolledCoursesList([]);
        return;
      }

      setStudent({
        name: user.name || "Student",
        email: user.email || "",
        avatar: resolveAvatar(user.avatar, user.name || "Student"),
        profileUser: user as StudentProfileUser,
        level: 1,
        xp: 0,
        xpMax: 1000,
        enrolledCourses: 0,
        overallProgress: 0,
        streak: 0,
      });

      setEnrolledCoursesList([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadStudentData();
  }, [loadStudentData]);

  const updateCourseProgress = useCallback(
    (courseId: string, progress: number) => {
      if (!user) return;

      const email = user.email || "";

      saveProgress(email, courseId, progress);
      void loadStudentData();
    },
    [user, loadStudentData]
  );

  return {
    loading,
    student,
    profileUser: student?.profileUser ?? null,
    enrolledCoursesList,
    refetch: loadStudentData,
    updateCourseProgress,
  };
}

export function useStudent() {
  const context = useContext(StudentDataContext);

  if (!context) {
    throw new Error("useStudent must be used within a StudentDataProvider");
  }

  return context;
}
