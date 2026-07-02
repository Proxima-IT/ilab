import { get, put } from "@/lib/api";

export type SystemSettings = {
  general: {
    website_name: string;
    support_email: string;
    support_phone: string;
    currency_code: string;
    currency_symbol: string;
  };
  payments: {
    uddoktapay_enabled: boolean;
    free_enrollment_enabled: boolean;
    manual_payment_enabled: boolean;
    sandbox_mode: boolean;
    payment_support_text: string;
    manual_payment_instructions: string;
  };
  maintenance: {
    enabled: boolean;
    title: string;
    message: string;
    allowed_ips: string[];
  };
};

export type PaymentEnvironment = {
  uddoktapay_api_url_configured: boolean;
  uddoktapay_api_key_configured: boolean;
};

type SystemSettingsResponse = {
  success: boolean;
  data: {
    settings: SystemSettings;
    payment_environment: PaymentEnvironment;
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
