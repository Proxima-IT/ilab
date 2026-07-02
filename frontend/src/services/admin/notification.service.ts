import { get, post, put } from "@/lib/api";

export type AdminNotificationStudent = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
};

export type AdminNotificationCourse = {
  id: number;
  title: string;
  slug?: string | null;
  instructor_id?: number | null;
};

export type AdminNotificationPayload = {
  user_ids: number[];
  type: string;
  title: string;
  message: string;
  action_url?: string | null;
};

export type AdminTopbarNotification = {
  id: number;
  type: "new_enrollment" | string;
  title: string;
  message: string;
  action_url?: string | null;
  data?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at: string;
};

type ListResponse<T> = {
  success: boolean;
  data: T;
  message: string;
  errors: unknown;
};

type SendResponse = {
  success: boolean;
  data: {
    sent_count: number;
  };
  message: string;
  errors: unknown;
};

type TopbarResponse = {
  success: boolean;
  data: {
    notifications: AdminTopbarNotification[];
    unread_count: number;
    qna_open_count: number;
  };
  message: string;
  errors: unknown;
};

type SummaryResponse = {
  success: boolean;
  data: {
    unread_count: number;
    qna_open_count: number;
  };
  message: string;
  errors: unknown;
};

export const adminNotificationService = {
  async latest(): Promise<TopbarResponse["data"]> {
    const response = await get<TopbarResponse>("/admin/notifications");
    return response.data;
  },

  async summary(): Promise<SummaryResponse["data"]> {
    const response = await get<SummaryResponse>("/admin/notifications/summary");
    return response.data;
  },

  async markRead(id: number): Promise<AdminTopbarNotification> {
    const response = await put<ListResponse<AdminTopbarNotification>>(`/admin/notifications/${id}/read`);

    return response.data;
  },

  async searchStudents(search: string): Promise<AdminNotificationStudent[]> {
    const response = await get<ListResponse<AdminNotificationStudent[]>>(
      "/admin/notifications/students",
      { params: { search } }
    );

    return response.data;
  },

  async courses(search = ""): Promise<AdminNotificationCourse[]> {
    const response = await get<ListResponse<AdminNotificationCourse[]>>(
      "/admin/notifications/courses",
      { params: { search: search || undefined } }
    );

    return response.data;
  },

  async courseStudents(courseId: number): Promise<AdminNotificationStudent[]> {
    const response = await get<ListResponse<AdminNotificationStudent[]>>(
      `/admin/notifications/courses/${courseId}/students`
    );

    return response.data;
  },

  async send(payload: AdminNotificationPayload): Promise<SendResponse["data"]> {
    const response = await post<SendResponse>("/admin/notifications/send", payload);
    return response.data;
  },
};
