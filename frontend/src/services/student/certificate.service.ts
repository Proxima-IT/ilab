import { get } from "@/lib/api";

export type StudentCertificate = {
  id: string;
  verification_code: string;
  authorized_signatory_name?: string | null;
  authorized_signatory_title?: string | null;
  eligible_progress: number;
  issued_at: string;
  user?: {
    id: number;
    name: string;
    email?: string | null;
  };
  course?: {
    id: number;
    title: string;
    slug: string;
    instructor?: {
      id: number;
      name: string;
    } | null;
  };
};

type CertificatesResponse = {
  success: boolean;
  data: {
    certificates: StudentCertificate[];
    eligible_progress: number;
  };
  message: string;
  errors: unknown;
};

let certificatesCache: CertificatesResponse["data"] | null = null;
let certificatesRequest: Promise<CertificatesResponse["data"]> | null = null;
let certificatesCacheKey: string | null = null;

function currentCacheKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("ilab.access_token");
}

export const certificateService = {
  async getCertificates(force = false) {
    const cacheKey = currentCacheKey();

    if (!force && certificatesCache && certificatesCacheKey === cacheKey) {
      return certificatesCache;
    }

    if (!force && certificatesRequest && certificatesCacheKey === cacheKey) {
      return certificatesRequest;
    }

    certificatesCacheKey = cacheKey;
    certificatesRequest = get<CertificatesResponse>("/student/certificates").then(
      (response) => {
        certificatesCache = response.data;
        certificatesRequest = null;
        return response.data;
      }
    );

    return certificatesRequest;
  },

  clearCache() {
    certificatesCache = null;
    certificatesRequest = null;
    certificatesCacheKey = null;
  },
};
