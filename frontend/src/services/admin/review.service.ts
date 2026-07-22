import { del, get, post, put, upload } from "@/lib/api";

export type AdminReview = {
  id: number;
  student_name: string;
  student_role: string | null;
  learner_level: "beginner" | "intermediate" | "expert" | null;
  avatar: string | null;
  rating: number;
  review_text: string | null;
  media_type: "text" | "image" | "video";
  media_url: string | null;
  thumbnail: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ReviewPayload = {
  student_name: string;
  student_role?: string | null;
  learner_level?: "beginner" | "intermediate" | "expert" | null;
  avatar?: string | null;
  rating: number;
  review_text?: string | null;
  media_type: "text" | "image" | "video";
  media_url?: string | null;
  thumbnail?: string | null;
  is_published: boolean;
  sort_order?: number;
};

type PaginatedReviews = {
  data: AdminReview[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type ListResponse = {
  success: boolean;
  data: PaginatedReviews;
  message: string;
  errors: unknown;
};

type ReviewResponse = {
  success: boolean;
  data: AdminReview;
  message: string;
  errors: unknown;
};

type DeleteResponse = {
  success: boolean;
  data: null;
  message: string;
  errors: unknown;
};

type UploadAvatarResponse = {
  success: boolean;
  data: {
    path: string;
  };
  message: string;
  errors: unknown;
};

export const adminReviewService = {
  async list(search = ""): Promise<PaginatedReviews> {
    const response = await get<ListResponse>("/admin/reviews", {
      params: {
        search: search || undefined,
        per_page: 100,
      },
    });

    return response.data;
  },

  async create(payload: ReviewPayload): Promise<AdminReview> {
    const response = await post<ReviewResponse>("/admin/reviews", payload);
    return response.data;
  },

  async update(id: number, payload: ReviewPayload): Promise<AdminReview> {
    const response = await put<ReviewResponse>(`/admin/reviews/${id}`, payload);
    return response.data;
  },

  async remove(id: number): Promise<DeleteResponse> {
    return del<DeleteResponse>(`/admin/reviews/${id}`);
  },

  async uploadAvatar(file: File, oldAvatar?: string | null): Promise<string> {
    const formData = new FormData();
    formData.append("avatar", file);

    if (oldAvatar) {
      formData.append("old_avatar", oldAvatar);
    }

    const response = await upload<UploadAvatarResponse>(
      "/admin/reviews/avatar",
      formData
    );

    return response.data.path;
  },

  async uploadMedia(file: File, oldImage?: string | null): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    if (oldImage) {
      formData.append("old_image", oldImage);
    }

    const response = await upload<UploadAvatarResponse>(
      "/admin/reviews/media",
      formData
    );

    return response.data.path;
  },
};
