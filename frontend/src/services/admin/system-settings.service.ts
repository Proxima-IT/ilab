import { get, put } from "@/lib/api";

export type SystemSettings = {
  general: {
    website_name: string;
    support_email: string;
    support_phone: string;
    currency_code: string;
    currency_symbol: string;
  };
  social_media: {
    name: string;
    icon: string;
    url: string;
  }[];
  maintenance: {
    enabled: boolean;
    title: string;
    message: string;
    allowed_ips: string[];
  };
};

type SystemSettingsResponse = {
  success: boolean;
  data: {
    settings: SystemSettings;
  };
  message: string;
  errors: unknown;
};

export const adminSystemSettingsService = {
  async get(): Promise<SystemSettingsResponse["data"]> {
    const response = await get<SystemSettingsResponse>("/admin/system-settings");
    return response.data;
  },

  async update(settings: SystemSettings): Promise<SystemSettingsResponse["data"]> {
    const response = await put<SystemSettingsResponse>("/admin/system-settings", {
      settings,
    });

    return response.data;
  },
};
