import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Download, LayoutDashboard, Mail, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getInvoice } from "@/services/payments";

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const invoice_id = searchParams.get("invoice_id") || "";
  const [invoice, setInvoice] = useState<ReturnType<typeof getInvoice>>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "Enrollment successful — iLab BD";
  }, []);

  useEffect(() => {
    if (invoice_id) {
      setInvoice(getInvoice(invoice_id));
    }
  }, [invoice_id]);

  async function copyInvoice() {
    try {
      await navigator.clipboard.writeText(invoice_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="max-w-xl mx-auto rounded-3xl border border-border bg-card shadow-card overflow-hidden"
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
                Welcome to iLab — your enrollment is confirmed.
              </p>
            </div>

            <div className="p-6 md:p-8">
              <div className="rounded-xl border border-border bg-surface/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice ID</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <code className="text-sm font-mono font-bold text-foreground break-all">{invoice_id}</code>
                  <button
                    onClick={copyInvoice}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-surface transition"
                  >
                    <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {invoice && (
                <dl className="mt-5 divide-y divide-border text-sm">
                  <Row label="Course" value={invoice.courseTitle} />
                  <Row label="Student" value={invoice.fullName} />
                  <Row label="Email" value={invoice.email} />
                  <Row label="Phone" value={invoice.phone} />
                  {invoice.coupon && <Row label="Coupon" value={invoice.coupon} />}
                  <Row label="Amount paid" value={`৳${invoice.amount.toLocaleString()}`} bold />
                </dl>
              )}

              <div className="mt-6 rounded-xl bg-primary/5 border border-primary/15 p-4 text-sm flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-foreground/80">
                  We've emailed a copy of your invoice and course access details to{" "}
                  <span className="font-semibold text-foreground">{invoice?.email ?? "your inbox"}</span>.
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
