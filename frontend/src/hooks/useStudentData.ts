import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useAuth } from "@/lib/auth";
import { fetchCourses, type Course } from "@/services/courses";
import { studentProfileService } from "@/services/student/profile.service";

export type StudentData = {
  name: string;
  email: string;
  avatar: string;
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
};

export type StudentContextType = {
  loading: boolean;
  student: StudentData | null;
  enrolledCoursesList: EnrolledCourseInfo[];
  refetch: () => Promise<void>;
  updateCourseProgress: (courseId: string, progress: number) => void;
};

type LaravelEnrollment = {
  id?: number | string;
  course_id?: number | string;
  status?: string;
  progress_percentage?: number | string | null;
  course?: {
    id?: number | string;
    title?: string;
    slug?: string;
    thumbnail?: string | null;
    created_at?: string;
  } | null;
};

export const StudentDataContext = createContext<StudentContextType | null>(null);

function buildAvatar(name: string): string {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
    name
  )}`;
}

function getSavedProgress(email: string, courseId: string, fallback = 0): number {
  if (typeof window === "undefined") return fallback;

  const savedProgress = window.localStorage.getItem(
    `ilab.progress.${email}.${courseId}`
  );

  if (!savedProgress) return fallback;

  const parsed = Number.parseInt(savedProgress, 10);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function saveProgress(email: string, courseId: string, progress: number) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    `ilab.progress.${email}.${courseId}`,
    String(Math.max(0, Math.min(100, progress)))
  );
}

function normalizeLaravelCourse(
  enrollment: LaravelEnrollment,
  fallbackCourses: Course[]
): Course | null {
  const courseId = enrollment.course_id ?? enrollment.course?.id;
  const courseSlug = enrollment.course?.slug;

  const matchedCourse = fallbackCourses.find(
    (course) =>
      String(course.id) === String(courseId) ||
      Boolean(courseSlug && course.slug === courseSlug)
  );

  if (matchedCourse) return matchedCourse;

  if (!enrollment.course?.id || !enrollment.course?.title || !enrollment.course?.slug) {
    return null;
  }

  return {
    id: String(enrollment.course.id),
    slug: enrollment.course.slug,
    title: enrollment.course.title,
    instructor: "Instructor",
    category: "Mobile",
    level: "Beginner",
    mode: "Online",
    rating: 4.8,
    students: 0,
    hours: 20,
    lessons: 30,
    price: 0,
    cover:
      enrollment.course.thumbnail ||
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80",
    createdAt: enrollment.course.created_at || new Date().toISOString(),
  };
}

export function useStudentDataValue(): StudentContextType {
  const { user } = useAuth();
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
      const avatar = profileUser.avatar || buildAvatar(name);

      const coursesResponse = await fetchCourses({ perPage: 100 });
      const allCourses = coursesResponse.items;

      const apiEnrollments = Array.isArray(profileUser.enrollments)
        ? (profileUser.enrollments as LaravelEnrollment[])
        : [];

      const enrolledList: EnrolledCourseInfo[] = [];
      const processedCourseIds = new Set<string>();

      for (const enrollment of apiEnrollments) {
        const course = normalizeLaravelCourse(enrollment, allCourses);

        if (!course || processedCourseIds.has(course.id)) continue;

        processedCourseIds.add(course.id);

        const apiProgress = Number(enrollment.progress_percentage ?? 0);
        const safeApiProgress = Number.isFinite(apiProgress) ? apiProgress : 0;
        const progress = getSavedProgress(email, course.id, safeApiProgress);

        enrolledList.push({
          course,
          progress,
          status: enrollment.status || "active",
          enrollmentId: String(enrollment.id || `enrollment-${course.id}`),
        });
      }

      if (enrolledList.length === 0) {
        const freeCourse = allCourses.find((course) => course.price === 0) || allCourses[0];

        if (freeCourse) {
          const progress = getSavedProgress(email, freeCourse.id, 25);
          saveProgress(email, freeCourse.id, progress);

          enrolledList.push({
            course: freeCourse,
            progress,
            status: "active",
            enrollmentId: "demo-enrollment",
          });
        }
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

      setStudent({
        name: user.name || "Student",
        email: user.email || "",
        avatar: user.avatar || buildAvatar(user.name || "Student"),
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
  }, [user]);

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