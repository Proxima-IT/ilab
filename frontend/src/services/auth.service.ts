import { api } from "@/lib/api";
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
};

export type LoginResponse = ApiResponse<LoginData>;

export type RegisterPayload = {
  name: string;
  phone: string;
  email?: string | null;
  password: string;
  password_confirmation: string;
  device_id?: string;
  platform?: "web" | "android" | "ios";
  fcm_token?: string | null;
};

export type RegisterResponse = LoginResponse;

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

  async getAdminProfile(): Promise<ApiResponse<{ profile: AuthUser }>> {
    const response = await api.get<ApiResponse<{ profile: AuthUser }>>(
      "/admin/profile"
    );

    return response.data;
  },
};