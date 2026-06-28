// Mock UddoktaPay client. Swap for real API calls later.
//
// Real integration (server-side, never client) will hit:
//   POST https://sandbox.uddoktapay.com/api/checkout-v2
//   Headers: RT-UDDOKTAPAY-API-KEY: <key>
//   Body: { full_name, email, amount, metadata, redirect_url, return_type, cancel_url, webhook_url }
// And verify with:
//   POST https://sandbox.uddoktapay.com/api/verify-payment  { invoice_id }

export type CouponResult = {
  code: string;
  percentOff: number;
  label: string;
};

const COUPONS: Record<string, CouponResult> = {
  ILAB10: { code: "ILAB10", percentOff: 10, label: "10% student discount" },
  ILAB20: { code: "ILAB20", percentOff: 20, label: "20% early-bird discount" },
  EID2026: { code: "EID2026", percentOff: 25, label: "25% Eid special" },
};

export async function validateCoupon(code: string): Promise<CouponResult | null> {
  await new Promise((r) => setTimeout(r, 350));
  const found = COUPONS[code.trim().toUpperCase()];
  return found ?? null;
}

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
  paymentUrl: string; // in real flow we'd window.location = paymentUrl
  status: "pending";
};

export async function createUddoktaPayCheckout(
  payload: CheckoutPayload,
): Promise<CheckoutResult> {
  // simulate network latency to the gateway
  await new Promise((r) => setTimeout(r, 1100));
  const invoiceId = `UP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
  // Persist locally so the success page can render order details.
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        `ilab.invoice.${invoiceId}`,
        JSON.stringify({ ...payload, invoiceId, createdAt: new Date().toISOString() }),
      );
    } catch {
      /* ignore */
    }
  }
  return {
    invoiceId,
    paymentUrl: `/enroll/success?invoice_id=${invoiceId}`,
    status: "pending",
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
