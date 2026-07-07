import { get, post } from "@/lib/api";

export type CouponResult = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discountAmount: number;
  finalAmount: number;
  label: string;
};

export type CheckoutPayload = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  fullName: string;
  email: string;
  phone: string;
  amount: number;
  coupon?: string;
};

export type CheckoutResult = {
  invoiceId: string;
  paymentUrl?: string;
  redirectUrl?: string;
  isFree: boolean;
};

export type PaymentInvoice = {
  invoiceId: string;
  status: "pending" | "completed" | "failed" | "refunded" | string;
  amount: number;
  method: string;
  transactionId?: string | null;
  paymentMethod?: string | null;
  senderNumber?: string | null;
  gatewayTransactionId?: string | null;
  course: {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string | null;
  };
  coupon?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
};

type CouponPreviewResponse = {
  success: boolean;
  data: {
    code: string;
    type: "percentage" | "fixed";
    value: number | string;
    discount_amount: number | string;
    final_amount: number | string;
    label: string;
  } | null;
  message: string;
  errors: unknown;
};

type CheckoutResponse = {
  success: boolean;
  data: {
    is_free: boolean;
    invoice_id: string;
    payment_url?: string;
    redirect_url?: string;
  };
  message: string;
  errors: unknown;
};

type PaymentInvoiceResponse = {
  success: boolean;
  data: {
    invoice_id: string;
    status: string;
    amount: number | string;
    method: string;
    transaction_id?: string | null;
    payment_method?: string | null;
    sender_number?: string | null;
    gateway_transaction_id?: string | null;
    course: {
      id: number;
      title: string;
      slug: string;
      thumbnail?: string | null;
    };
    coupon?: string | null;
    paid_at?: string | null;
    created_at?: string | null;
  };
  message: string;
  errors: unknown;
};

export async function validateCoupon(code: string, courseId: string): Promise<CouponResult | null> {
  if (!code.trim()) return null;

  const response = await post<CouponPreviewResponse>("/checkout/coupon/preview", {
    course_id: Number(courseId),
    coupon_code: code.trim().toUpperCase(),
  });

  if (!response.data) return null;

  return {
    code: response.data.code,
    type: response.data.type,
    value: Number(response.data.value || 0),
    discountAmount: Number(response.data.discount_amount || 0),
    finalAmount: Number(response.data.final_amount || 0),
    label: response.data.label,
  };
}

export async function createUddoktaPayCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  const response = await post<CheckoutResponse>("/checkout/init", {
    course_id: Number(payload.courseId),
    coupon_code: payload.coupon || null,
    phone: payload.phone,
  });

  const result = {
    invoiceId: response.data.invoice_id,
    paymentUrl: response.data.payment_url,
    redirectUrl: response.data.redirect_url,
    isFree: response.data.is_free,
  };

  rememberInvoice({
    ...payload,
    invoiceId: result.invoiceId,
    createdAt: new Date().toISOString(),
  });

  return result;
}

export function rememberInvoice(invoice: CheckoutPayload & { invoiceId: string; createdAt: string }) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(`ilab.invoice.${invoice.invoiceId}`, JSON.stringify(invoice));
  } catch {
    /* ignore */
  }
}

export async function fetchPaymentInvoice(invoiceId: string): Promise<PaymentInvoice> {
  const response = await get<PaymentInvoiceResponse>(
    `/checkout/payments/${encodeURIComponent(invoiceId)}`
  );

  return {
    invoiceId: response.data.invoice_id,
    status: response.data.status,
    amount: Number(response.data.amount || 0),
    method: response.data.method,
    transactionId: response.data.transaction_id,
    paymentMethod: response.data.payment_method,
    senderNumber: response.data.sender_number,
    gatewayTransactionId: response.data.gateway_transaction_id,
    course: response.data.course,
    coupon: response.data.coupon,
    paidAt: response.data.paid_at,
    createdAt: response.data.created_at,
  };
}

export function getInvoice(invoiceId: string): (CheckoutPayload & { invoiceId: string; createdAt: string }) | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(`ilab.invoice.${invoiceId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
