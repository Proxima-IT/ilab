import { post } from "@/lib/api";

type SubscribeResponse = {
  success: boolean;
  data: unknown;
  message: string;
  errors: unknown;
};

export const newsletterService = {
  async subscribe(email: string) {
    return post<SubscribeResponse>("/newsletter/subscribe", {
      email,
      source: "footer",
    });
  },
};
