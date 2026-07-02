import { del, get, post, put, upload } from "@/lib/api";

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  type: "course" | "blog";
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
  courses_count?: number;
  blog_posts_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type CategoryPayload = {
  name: string;
  type: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

type PaginatedCategories = {
  data: AdminCategory[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type ListResponse = {
  success: boolean;
  data: PaginatedCategories;
  message: string;
  errors: unknown;
};

type CategoryResponse = {
  success: boolean;
  data: AdminCategory;
  message: string;
  errors: unknown;
};

type DeleteResponse = {
  success: boolean;
  data: null;
  message: string;
  errors: unknown;
};

type UploadImageResponse = {
  success: boolean;
  data: {
    image: string;
  };
  message: string;
  errors: unknown;
};

export const adminCategoryService = {
  async list(search = "", type = ""): Promise<PaginatedCategories> {
    const response = await get<ListResponse>("/admin/categories", {
      params: {
        search: search || undefined,
        type: type || undefined,
        per_page: 100,
      },
    });

    return response.data;
  },

  async create(payload: CategoryPayload): Promise<AdminCategory> {
    const response = await post<CategoryResponse>("/admin/categories", payload);
    return response.data;
  },

  async update(id: number, payload: CategoryPayload): Promise<AdminCategory> {
    const response = await put<CategoryResponse>(`/admin/categories/${id}`, payload);
    return response.data;
  },

  async remove(id: number): Promise<DeleteResponse> {
    return del<DeleteResponse>(`/admin/categories/${id}`);
  },

  async uploadImage(file: File, oldImage?: string | null): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    if (oldImage) {
      formData.append("old_image", oldImage);
    }

    const response = await upload<UploadImageResponse>("/admin/categories/image", formData);
    return response.data.image;
  },
};
