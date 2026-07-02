import { get, put } from "@/lib/api";

export type StudentNotificationType =
  | "new_lecture"
  | "special_offer"
  | "event"
  | "profile_update"
  | "course_completion"
  | "certificate_ready"
  | "admin_message"
  | "qna_answer";

export type StudentNotification = {
  id: number;
  type: StudentNotificationType;
  title: string;
  message: string;
  action_url?: string | null;
  data?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at: string;
};

export type StudentNotificationSettings = Record<StudentNotificationType, boolean> & {
  email: boolean;
  sms: boolean;
  push: boolean;
};

type NotificationsResponse = {
  success: boolean;
  data: {
    notifications: StudentNotification[];
    unread_count: number;
  };
  message: string;
  errors: unknown;
};

type SettingsResponse = {
  success: boolean;
  data: StudentNotificationSettings;
  message: string;
  errors: unknown;
};

let notificationsCache: NotificationsResponse["data"] | null = null;
let notificationsRequest: Promise<NotificationsResponse["data"]> | null = null;
let notificationsCacheKey: string | null = null;

function currentCacheKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("ilab.access_token");
}

export const notificationService = {
  async getLatest(force = false) {
    const cacheKey = currentCacheKey();

    if (!force && notificationsCache && notificationsCacheKey === cacheKey) {
      return notificationsCache;
    }

    if (!force && notificationsRequest && notificationsCacheKey === cacheKey) {
      return notificationsRequest;
    }

    notificationsCacheKey = cacheKey;
    notificationsRequest = get<NotificationsResponse>("/student/notifications").then(
      (response) => {
        notificationsCache = response.data;
        notificationsRequest = null;
        return response.data;
      }
    );

    return notificationsRequest;
  },

  async markRead(id: number) {
    const response = await put<{ success: boolean; data: StudentNotification }>(
      `/student/notifications/${id}/read`
    );

    if (notificationsCache) {
      notificationsCache = {
        ...notificationsCache,
        unread_count: Math.max(0, notificationsCache.unread_count - 1),
        notifications: notificationsCache.notifications.map((notification) =>
          notification.id === id ? response.data : notification
        ),
      };
    }

    return response.data;
  },

  async getSettings() {
    const response = await get<SettingsResponse>("/student/notification-settings");
    return response.data;
  },

  async updateSettings(payload: Partial<StudentNotificationSettings>) {
    const response = await put<SettingsResponse>(
      "/student/notification-settings",
      payload
    );

    return response.data;
  },

  clearCache() {
    notificationsCache = null;
    notificationsRequest = null;
    notificationsCacheKey = null;
  },
};
