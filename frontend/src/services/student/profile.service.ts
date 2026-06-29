import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

export type StudentProfileUser = AuthUser & {
  district?: string | null;
  education_level?: string | null;
  bio?: string | null;
  notification_prefs?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    lecture?: boolean;
    streak?: boolean;
    congrats?: boolean;
  } | null;
  enrollments?: unknown[];
  progress?: unknown[];
};

export type StudentProfileResponse = {
  success: boolean;
  data: {
    user: StudentProfileUser;
    profile_completed: boolean;
    phone_verification_required: boolean;
  };
  message: string;
  errors: unknown;
};

export type UpdateStudentProfilePayload = {
  name?: string;
  phone?: string | null;
  email?: string | null;
  district?: string | null;
  education_level?: string | null;
  bio?: string | null;
  notification_prefs?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    lecture?: boolean;
    streak?: boolean;
    congrats?: boolean;
  };
};

export type StudentNotificationPrefs = NonNullable<
  StudentProfileUser["notification_prefs"]
>;

export type UpdateStudentPasswordPayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export const studentProfileService = {
  async getProfile(): Promise<StudentProfileResponse> {
    const response = await api.get<StudentProfileResponse>("/student/profile");
    return response.data;
  },

  async updateProfile(
    payload: UpdateStudentProfilePayload
  ): Promise<StudentProfileResponse> {
    const response = await api.put<StudentProfileResponse>(
      "/student/profile",
      payload
    );

    return response.data;
  },

  async updateAvatar(file: File): Promise<StudentProfileResponse> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post<StudentProfileResponse>(
      "/student/profile/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  async updatePassword(
    payload: UpdateStudentPasswordPayload
  ): Promise<StudentProfileResponse> {
    const response = await api.put<StudentProfileResponse>(
      "/student/profile/password",
      payload
    );

    return response.data;
  },

  async updateNotifications(
    notification_prefs: StudentNotificationPrefs
  ): Promise<StudentProfileResponse> {
    const response = await api.put<StudentProfileResponse>(
      "/student/profile/notifications",
      { notification_prefs }
    );

    return response.data;
  },
};
