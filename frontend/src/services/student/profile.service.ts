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
  };
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
};