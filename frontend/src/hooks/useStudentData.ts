import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchCourses, type Course } from "@/services/courses";

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

export const StudentDataContext = createContext<StudentContextType | null>(null);

export function useStudentDataValue(): StudentContextType {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [enrolledCoursesList, setEnrolledCoursesList] = useState<EnrolledCourseInfo[]>([]);

  const loadStudentData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user profile from Supabase
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const name = profile?.full_name || user.name || "Student";
      const email = profile?.email || user.email || "";
      const avatar = profile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

      // 2. Fetch all courses (try Supabase first, fallback to mock service)
      let allCourses: Course[] = [];
      const { data: dbCourses } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true);

      if (dbCourses && dbCourses.length > 0) {
        allCourses = dbCourses.map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          instructor: c.instructor || "Instructor",
          category: (c.category as any) || "Mobile",
          level: (c.level as any) || "Beginner",
          mode: (c.mode as any) || "Online",
          rating: Number(c.rating || 4.8),
          students: Number(c.total_students || 0),
          hours: Number(c.duration?.replace(/[^0-9]/g, "") || 20),
          lessons: 30, // Default lesson count
          price: Number(c.price || 0),
          originalPrice: c.discounted_price ? Number(c.discounted_price) : undefined,
          cover: c.thumbnail_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80",
          createdAt: c.created_at,
        }));
      } else {
        // Fallback to mock service
        const res = await fetchCourses({ perPage: 100 });
        allCourses = res.items;
      }

      // 3. Fetch enrollments from Supabase
      const { data: dbEnrollments } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_email", email);

      const enrolledList: EnrolledCourseInfo[] = [];

      // We also check localStorage for local testing enrollments
      const localInvoices: any[] = [];
      if (typeof window !== "undefined") {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key?.startsWith("ilab.invoice.")) {
            try {
              const invoice = JSON.parse(window.localStorage.getItem(key) || "");
              if (invoice && invoice.email === email) {
                localInvoices.push(invoice);
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      // Merge DB enrollments and LocalStorage invoices
      const processedCourseIds = new Set<string>();

      const addCourse = (courseId: string, slug: string, status: string, enrollmentId: string) => {
        const course = allCourses.find((c) => c.id === courseId || c.slug === slug);
        if (course && !processedCourseIds.has(course.id)) {
          processedCourseIds.add(course.id);

          // Retrieve progress from localStorage
          let progress = 0;
          if (typeof window !== "undefined") {
            const savedProgress = window.localStorage.getItem(`ilab.progress.${email}.${course.id}`);
            if (savedProgress) {
              progress = parseInt(savedProgress, 10);
            } else {
              // Deterministic initial progress so it's not 0% everywhere on first load
              progress = Math.abs(course.title.length * 7) % 65;
              window.localStorage.setItem(`ilab.progress.${email}.${course.id}`, String(progress));
            }
          }

          enrolledList.push({
            course,
            progress,
            status,
            enrollmentId,
          });
        }
      };

      // Process DB enrollments first
      if (dbEnrollments) {
        dbEnrollments.forEach((env) => {
          addCourse(env.course_id, "", env.status, env.id);
        });
      }

      // Process LocalStorage invoices
      localInvoices.forEach((inv) => {
        addCourse(inv.courseId, inv.courseSlug, "paid", inv.invoiceId);
      });

      // If absolutely no courses enrolled, add one free course as a default starter
      if (enrolledList.length === 0) {
        const freeCourse = allCourses.find((c) => c.price === 0) || allCourses[0];
        if (freeCourse) {
          const defaultProgress = 25;
          if (typeof window !== "undefined") {
            window.localStorage.setItem(`ilab.progress.${email}.${freeCourse.id}`, String(defaultProgress));
          }
          enrolledList.push({
            course: freeCourse,
            progress: defaultProgress,
            status: "paid",
            enrollmentId: "demo-enrollment",
          });
        }
      }

      // Calculate overall stats
      const totalCourses = enrolledList.length;
      const totalProgress = enrolledList.reduce((acc, curr) => acc + curr.progress, 0);
      const overallProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;

      // Gamification: XP & Level
      const xp = totalProgress * 15; // 15 XP per 1% progress
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
        streak: 5, // Default streak
      });

      setEnrolledCoursesList(enrolledList);
    } catch (err) {
      console.error("Error loading student data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadStudentData();
  }, [loadStudentData]);

  const updateCourseProgress = useCallback((courseId: string, progress: number) => {
    if (!user) return;
    const email = user.email || "";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`ilab.progress.${email}.${courseId}`, String(progress));
      void loadStudentData();
    }
  }, [user, loadStudentData]);

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
