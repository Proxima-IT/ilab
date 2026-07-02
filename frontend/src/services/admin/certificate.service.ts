import { del, get, post, put } from "@/lib/api";

export type AdminCertificate = {
  id: string;
  user_id: number;
  course_id: number;
  verification_code: string;
  authorized_signatory_name: string | null;
  authorized_signatory_title: string | null;
  eligible_progress: number;
  issued_at: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  course?: {
    id: number;
    title: string;
    slug?: string | null;
    instructor?: {
      id: number;
      name: string;
      email?: string | null;
    } | null;
  } | null;
};

export type CertificatePayload = {
  user_id: number;
  course_id: number;
  verification_code?: string | null;
  authorized_signatory_name?: string | null;
  authorized_signatory_title?: string | null;
  eligible_progress?: number;
  issued_at?: string | null;
};

export type CertificateOptionStudent = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type CertificateOptionCourse = {
  id: number;
  title: string;
  slug?: string | null;
  instructor?: {
    id: number;
    name: string;
  } | null;
};

type PaginatedCertificates = {
  data: AdminCertificate[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type CertificateListResponse = {
  success: boolean;
  data: PaginatedCertificates;
  message: string;
  errors: unknown;
};

type CertificateMutationResponse = {
  success: boolean;
  data: AdminCertificate | null;
  message: string;
  errors: unknown;
};

type CertificateOptionsResponse = {
  success: boolean;
  data: {
    students: CertificateOptionStudent[];
    courses: CertificateOptionCourse[];
  };
  message: string;
  errors: unknown;
};

export const adminCertificateService = {
  async list(search = "", page = 1): Promise<PaginatedCertificates> {
    const response = await get<CertificateListResponse>("/admin/certificates", {
      params: { page, search: search || undefined, per_page: 20 },
    });

    return response.data;
  },

  async options(studentSearch = ""): Promise<CertificateOptionsResponse["data"]> {
    const response = await get<CertificateOptionsResponse>("/admin/certificates/options", {
      params: {
        student_search: studentSearch || undefined,
      },
    });
    return response.data;
  },

  async create(payload: CertificatePayload): Promise<CertificateMutationResponse> {
    return post<CertificateMutationResponse>("/admin/certificates", payload);
  },

  async update(id: string, payload: CertificatePayload): Promise<CertificateMutationResponse> {
    return put<CertificateMutationResponse>(`/admin/certificates/${id}`, payload);
  },

  async remove(id: string): Promise<CertificateMutationResponse> {
    return del<CertificateMutationResponse>(`/admin/certificates/${id}`);
  },
};
