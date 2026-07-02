import { get } from "@/lib/api";

export type AdminActivityLog = {
  id: number;
  user_id?: number | null;
  user_name?: string | null;
  user_email?: string | null;
  role?: string | null;
  action: "viewed" | "created" | "updated" | "deleted" | string;
  method: string;
  path: string;
  description?: string | null;
  resource_label?: string | null;
  activity_title?: string | null;
  activity_summary?: string | null;
  status_code?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: {
    query?: Record<string, unknown>;
    input?: Record<string, unknown>;
  } | null;
  created_at: string;
};

type PaginatedActivity = {
  data: AdminActivityLog[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type ActivityResponse = {
  success: boolean;
  data: PaginatedActivity;
  message: string;
  errors: unknown;
};

export const adminActivityService = {
  async list({
    search = "",
    role = "",
    action = "",
    date = "",
    page = 1,
  }: {
    search?: string;
    role?: string;
    action?: string;
    date?: string;
    page?: number;
  } = {}): Promise<PaginatedActivity> {
    const response = await get<ActivityResponse>("/admin/activity", {
      params: {
        search: search || undefined,
        role: role || undefined,
        action: action || undefined,
        date: date || undefined,
        page,
        per_page: 50,
      },
    });

    return response.data;
  },
};
