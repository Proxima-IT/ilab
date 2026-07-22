import { get } from "@/lib/api";

export type DashboardPeriod = "today" | "7" | "30" | "90" | "365" | "all";

export type AdminDashboardMetrics = {
  total_revenue: number;
  total_students: number;
  total_courses: number;
  total_registered_students: number;
  active_enrollments: number;
  completed_enrollments: number;
  suspended_enrollments: number;
};

export type AdminDashboardEnrollment = {
  id: number;
  student_name: string;
  student_email?: string | null;
  student_phone?: string | null;
  course_title: string;
  enrolled_price: string | number | null;
  status: string;
  progress_percentage?: number | null;
  created_at: string;
};

export type AdminDashboardTopCourse = {
  id: number;
  title: string;
  slug?: string | null;
  enrollment_count: number;
  generated_revenue: string | number | null;
  average_progress: string | number | null;
};

export type AdminDashboardLowProgress = {
  student_name: string;
  student_email?: string | null;
  course_title: string;
  progress_percentage: number | null;
  created_at: string;
};

export type AdminDashboardData = {
  role_view: "admin" | "instructor";
  period: DashboardPeriod;
  metrics: AdminDashboardMetrics;
  course_overview: {
    published: number;
    draft: number;
    archived: number;
    free: number;
    paid: number;
  };
  student_overview: {
    new_enrollments: number;
    average_progress: number;
  };
  revenue_overview: {
    date: string;
    revenue: number;
    enrollments: number;
  }[];
  enrollment_status_overview: {
    status: string;
    total: number;
  }[];
  payment_overview: {
    total_amount: number;
    completed_amount: number;
    pending_amount: number;
    refunded_amount: number;
    failed_count: number;
    by_status: {
      status: string;
      total: number;
      amount: number;
    }[];
    by_method: {
      method: string;
      total: number;
      amount: number;
    }[];
  };
  content_overview: {
    certificates: number;
    open_questions: number;
    answered_questions: number;
    published_events: number;
    finished_events: number;
    running_events: number;
    published_blog_posts: number;
    published_reviews: number;
    newsletter_subscribers: number;
    event_registrations: number;
  };
  today_overview: {
    revenue: number;
    enrollments: number;
    students_registered: number;
    certificates: number;
    open_questions: number;
  };
  growth_overview: {
    students: {
      date: string;
      students: number;
    }[];
    enrollments: {
      date: string;
      enrollments: number;
    }[];
  };
  recent_enrollments: AdminDashboardEnrollment[];
  top_courses: AdminDashboardTopCourse[];
  low_progress_students: AdminDashboardLowProgress[];
};

type DashboardResponse = {
  success: boolean;
  data: AdminDashboardData;
  message: string;
  errors: unknown;
};

export const adminDashboardService = {
  async get(period: DashboardPeriod = "today", perPage = 8): Promise<AdminDashboardData> {
    const response = await get<DashboardResponse>("/admin/dashboard", {
      params: {
        period,
        per_page: perPage,
      },
    });

    return response.data;
  },
};
