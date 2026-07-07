import { api, upload } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
  errors: unknown;
};

export type LoginPayload = {
  login: string;
  password: string;
  portal: "student" | "admin";
  device_id?: string;
  platform?: "web" | "android" | "ios";
  fcm_token?: string | null;
};

export type LoginData = {
  user: AuthUser;
  token: string;
  token_type?: string;
  profile_completed?: boolean;
  phone_verification_required?: boolean;
  email_verification_required?: boolean;
};

export type LoginResponse = ApiResponse<LoginData>;

export type AdminProfileResponse = ApiResponse<{
  profile: AuthUser;
  stats?: {
    total_courses: number;
    total_students: number;
  };
  courses?: unknown[];
}>;

export type UpdateAdminProfilePayload = {
  name?: string;
  bio?: string | null;
};

export type RegisterPayload = {
  name: string;
  phone?: string | null;
  email: string;
  password: string;
  password_confirmation: string;
  device_id?: string;
  platform?: "web" | "android" | "ios";
  fcm_token?: string | null;
};

export type RegisterResponse = ApiResponse<{
  user?: AuthUser;
  verification_required: boolean;
  email?: string;
  profile_completed?: boolean;
  email_verification_required?: boolean;
}>;

export type VerifyEmailPayload = {
  email: string;
  otp: string;
  device_id?: string;
  platform?: "web" | "android" | "ios";
  fcm_token?: string | null;
};

export type ForgotPasswordPayload = {
  identifier: string;
};

export type ResetPasswordPayload = {
  identifier: string;
  otp: string;
  password: string;
  password_confirmation: string;
};

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", payload);
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>("/auth/register", payload);
    return response.data;
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/verify-email", payload);
    return response.data;
  },

  async resendEmailVerification(
    email: string
  ): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      "/auth/resend-email-verification",
      { email }
    );

    return response.data;
  },

  async logout(): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>("/auth/logout");
    return response.data;
  },

  async forgotPassword(
    payload: ForgotPasswordPayload
  ): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      "/auth/forgot-password",
      payload
    );

    return response.data;
  },

  async resetPassword(
    payload: ResetPasswordPayload
  ): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(
      "/auth/reset-password",
      payload
    );

    return response.data;
  },

  async getStudentProfile(): Promise<ApiResponse<AuthUser>> {
    const response = await api.get<ApiResponse<AuthUser>>("/student/profile");
    return response.data;
  },

  async getAdminProfile(): Promise<AdminProfileResponse> {
    const response = await api.get<AdminProfileResponse>("/admin/profile");

    return response.data;
  },

  async updateAdminProfile(
    payload: UpdateAdminProfilePayload
  ): Promise<ApiResponse<{ profile: AuthUser }>> {
    const response = await api.put<ApiResponse<{ profile: AuthUser }>>(
      "/admin/profile",
      payload
    );

    return response.data;
  },

  async updateAdminAvatar(file: File): Promise<ApiResponse<{ profile: AuthUser }>> {
    const formData = new FormData();
    formData.append("avatar", file);

    return upload<ApiResponse<{ profile: AuthUser }>>(
      "/admin/profile/avatar",
      formData
    );
  },
};
