import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Download,
  LayoutDashboard,
  Loader2,
  Mail,
  PartyPopper,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  fetchPaymentInvoice,
  getInvoice,
  type PaymentInvoice,
} from "@/services/payments";
import { applySeo } from "@/lib/seo";

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoice_id") || "";
  const [localInvoice, setLocalInvoice] =
    useState<ReturnType<typeof getInvoice>>(null);
  const [serverInvoice, setServerInvoice] = useState<PaymentInvoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    applySeo({
      title: "Enrollment Successful | iLab BD",
      description: "Your iLab BD course enrollment was completed successfully.",
      path: "/enroll/success",
      robots: "noindex,nofollow",
    });
  }, []);

  useEffect(() => {
    if (!invoiceId) return;

    setLocalInvoice(getInvoice(invoiceId));
    setInvoiceLoading(true);

    fetchPaymentInvoice(invoiceId)
      .then(setServerInvoice)
      .catch(() => setServerInvoice(null))
      .finally(() => setInvoiceLoading(false));
  }, [invoiceId]);

  const courseTitle = serverInvoice?.course.title || localInvoice?.courseTitle || "your course";
  const email = localInvoice?.email || "your inbox";
  const amount = serverInvoice?.amount ?? localInvoice?.amount;
  const coupon = serverInvoice?.coupon || localInvoice?.coupon;

  async function copyInvoice() {
    try {
      await navigator.clipboard.writeText(invoiceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 md:pt-28 lg:pt-32">
        <div className="container mx-auto px-4 pb-12 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-card md:rounded-3xl"
          >
            <div className="relative gradient-orange p-8 text-center text-white">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.15 }}
                className="mx-auto grid place-items-center h-20 w-20 rounded-full bg-white/20 backdrop-blur"
              >
                <CheckCircle2 className="h-12 w-12" />
              </motion.div>
              <h1 className="mt-5 text-2xl md:text-3xl font-extrabold inline-flex items-center gap-2">
                Payment successful <PartyPopper className="h-6 w-6" />
              </h1>
              <p className="mt-1.5 text-sm text-white/90">
                Welcome to iLab - your enrollment is confirmed.
              </p>
            </div>

            <div className="p-6 md:p-8">
              <div className="rounded-xl border border-border bg-surface/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Invoice ID
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <code className="text-sm font-mono font-bold text-foreground break-all">
                    {invoiceId}
                  </code>
                  <button
                    onClick={copyInvoice}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-surface transition"
                  >
                    <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {invoiceLoading && (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/60 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading verified invoice...
                </div>
              )}

              {(serverInvoice || localInvoice) && !invoiceLoading && (
                <dl className="mt-5 divide-y divide-border text-sm">
                  <Row label="Course" value={courseTitle} />
                  {localInvoice?.fullName && <Row label="Student" value={localInvoice.fullName} />}
                  {localInvoice?.email && <Row label="Email" value={localInvoice.email} />}
                  {localInvoice?.phone && <Row label="Phone" value={localInvoice.phone} />}
                  {serverInvoice?.paymentMethod && <Row label="Payment method" value={serverInvoice.paymentMethod} />}
                  {serverInvoice?.gatewayTransactionId && <Row label="Transaction ID" value={serverInvoice.gatewayTransactionId} />}
                  {coupon && <Row label="Coupon" value={coupon} />}
                  {amount !== undefined && (
                    <Row label="Amount paid" value={`৳${amount.toLocaleString()}`} bold />
                  )}
                </dl>
              )}

              <div className="mt-6 rounded-xl bg-primary/5 border border-primary/15 p-4 text-sm flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-foreground/80">
                  We've emailed a copy of your invoice and course access details to{" "}
                  <span className="font-semibold text-foreground">{email}</span>.
                </p>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-full gradient-orange py-3 text-sm font-bold text-white shadow-orange-glow hover:scale-[1.02] transition-transform"
                >
                  <LayoutDashboard className="h-4 w-4" /> Go to dashboard
                </Link>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-sm font-semibold hover:bg-surface transition"
                >
                  <Download className="h-4 w-4" /> Download invoice
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="py-2.5 flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right ${bold ? "font-extrabold text-foreground text-base" : "font-semibold text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}
