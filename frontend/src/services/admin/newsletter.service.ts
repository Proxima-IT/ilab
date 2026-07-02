import { del, get, put } from "@/lib/api";

export type AdminNewsletterSubscriber = {
  id: number;
  email: string;
  is_active: boolean;
  source?: string | null;
  ip_address?: string | null;
  subscribed_at?: string | null;
  unsubscribed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type PaginatedSubscribers = {
  data: AdminNewsletterSubscriber[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type SubscriberListResponse = {
  success: boolean;
  data: PaginatedSubscribers;
  message: string;
  errors: unknown;
};

type SubscriberMutationResponse = {
  success: boolean;
  data: AdminNewsletterSubscriber | null;
  message: string;
  errors: unknown;
};

export const adminNewsletterService = {
  async list(search = "", status = ""): Promise<PaginatedSubscribers> {
    const response = await get<SubscriberListResponse>("/admin/newsletter/subscribers", {
      params: {
        search: search || undefined,
        status: status || undefined,
        per_page: 50,
      },
    });

    return response.data;
  },

  async update(id: number, isActive: boolean): Promise<SubscriberMutationResponse> {
    return put<SubscriberMutationResponse>(`/admin/newsletter/subscribers/${id}`, {
      is_active: isActive,
    });
  },

  async remove(id: number): Promise<SubscriberMutationResponse> {
    return del<SubscriberMutationResponse>(`/admin/newsletter/subscribers/${id}`);
  },
};
