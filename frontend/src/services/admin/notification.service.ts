import { get, post } from "@/lib/api";

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

export const adminNotificationService = {
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
