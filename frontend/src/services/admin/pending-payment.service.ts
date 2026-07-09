import { get, put } from "@/lib/api";

export type AdminPendingPayment = {
  id: string;
  user_id: number;
  course_id: number;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  transaction_id?: string | null;
  gateway_invoice_id?: string | null;
  gateway_status?: string | null;
  payment_method?: string | null;
  sender_number?: string | null;
  bank_details?: {
    bank_name?: string | null;
    account_name?: string | null;
    account_number?: string | null;
    branch_name?: string | null;
    routing_number?: string | null;
    swift_code?: string | null;
    reference?: string | null;
  } | null;
  created_at: string;
  updated_at?: string | null;
  student?: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
  } | null;
  course?: {
    id: number;
    title: string;
    slug?: string | null;
    thumbnail?: string | null;
  } | null;
};

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
  errors: unknown;
};

export const adminPendingPaymentService = {
  async list(params: { page?: number; search?: string; per_page?: number }) {
    const response = await get<ApiResponse<Paginated<AdminPendingPayment>>>("/admin/pending-payments", {
      params: {
        page: params.page || 1,
        search: params.search || undefined,
        per_page: params.per_page || 20,
      },
    });

    return response.data;
  },

  async approve(id: string) {
    const response = await put<ApiResponse<AdminPendingPayment>>(`/admin/pending-payments/${id}/approve`);
    return response;
  },

  async reject(id: string) {
    const response = await put<ApiResponse<AdminPendingPayment>>(`/admin/pending-payments/${id}/reject`);
    return response;
  },
};
