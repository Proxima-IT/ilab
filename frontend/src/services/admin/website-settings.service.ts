import { get, put, upload } from "@/lib/api";
import type { WebsiteSettings } from "@/services/home.service";

type WebsiteSettingsResponse = {
  success: boolean;
  data: WebsiteSettings;
  message: string;
  errors: unknown;
};

type UploadResponse = {
  success: boolean;
  data: {
    path: string;
  };
  message: string;
  errors: unknown;
};

export const adminWebsiteSettingsService = {
  async get(): Promise<WebsiteSettings> {
    const response = await get<WebsiteSettingsResponse>("/admin/website-settings");
    return response.data;
  },

  async update(settings: WebsiteSettings): Promise<WebsiteSettings> {
    const response = await put<WebsiteSettingsResponse>("/admin/website-settings", {
      settings,
    });

    return response.data;
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await upload<UploadResponse>(
      "/admin/website-settings/images",
      formData
    );

    return response.data.path;
  },
};
