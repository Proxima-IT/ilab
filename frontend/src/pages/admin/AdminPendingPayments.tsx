import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock3, Loader2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminPendingPaymentService,
  type AdminPendingPayment,
} from "@/services/admin/pending-payment.service";
import { imageUrl } from "@/services/course-catalog.service";

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

function money(value: number | string | null | undefined) {
  return `৳${Number(value || 0).toLocaleString()}`;
}

function dateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function fallbackAvatar(name?: string | null) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Student")}&background=0f766e&color=ffffff`;
}

function studentAvatar(payment: AdminPendingPayment) {
  return payment.student?.avatar ? imageUrl(payment.student.avatar) : fallbackAvatar(payment.student?.name);
}

export default function AdminPendingPayments() {
  const [rows, setRows] = useState<AdminPendingPayment[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const bankLike = rows.filter((row) => (row.payment_method || "").toLowerCase().includes("bank")).length;
    return { visible: rows.length, bankLike };
  }, [rows]);

  const loadRows = async (nextPage = page) => {
    setLoading(true);

    try {
      const data = await adminPendingPaymentService.list({
        page: nextPage,
        search: search.trim(),
      });

      setRows(data.data);
      setPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } catch (error) {
      toast.error(firstError(error, "Pending payments load kora jayni."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows(1);
    }, 250);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const approve = async (payment: AdminPendingPayment) => {
    setActionId(payment.id);

    try {
      await adminPendingPaymentService.approve(payment.id);
      toast.success("Payment approved. Student can access the course now.");
      await loadRows(page);
    } catch (error) {
      toast.error(firstError(error, "Payment approve kora jayni."));
    } finally {
      setActionId(null);
    }
  };

  const reject = async (payment: AdminPendingPayment) => {
    setActionId(payment.id);

    try {
      await adminPendingPaymentService.reject(payment.id);
      toast.success("Pending payment rejected.");
      await loadRows(page);
    } catch (error) {
      toast.error(firstError(error, "Payment reject kora jayni."));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Payments</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Pending Payment Approvals</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Review bank/manual UddoktaPay payments before giving course access.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Summary label="Pending" value={String(total)} />
          <Summary label="Bank visible" value={String(stats.bankLike)} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, course, invoice..."
            className="border-zinc-800 bg-zinc-950 pl-9 text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-60 place-items-center rounded-xl border border-zinc-800 bg-zinc-950/60">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="grid min-h-60 place-items-center rounded-xl border border-zinc-800 bg-zinc-950/60 text-center">
          <div>
            <Clock3 className="mx-auto h-8 w-8 text-zinc-600" />
            <p className="mt-3 text-sm font-semibold text-zinc-200">No pending payments</p>
            <p className="mt-1 text-xs text-zinc-500">New bank/manual payment requests will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {rows.map((payment) => (
                  <tr key={payment.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={studentAvatar(payment)}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-zinc-100">{payment.student?.name || "Unknown student"}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{payment.student?.email || payment.student?.phone || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-zinc-100">{payment.course?.title || "Unknown course"}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{payment.course?.slug || "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-primary">{money(payment.amount)}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {payment.payment_method || "Manual/bank pending"} · {payment.gateway_invoice_id || payment.transaction_id || "-"}
                      </p>
                      {payment.sender_number && (
                        <p className="mt-0.5 text-xs text-zinc-500">Sender: {payment.sender_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-zinc-500">{dateTime(payment.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => approve(payment)}
                          disabled={Boolean(actionId)}
                          className="bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          {actionId === payment.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => reject(payment)}
                          disabled={Boolean(actionId)}
                          className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => loadRows(page - 1)}
            className="border-zinc-700 text-zinc-200"
          >
            Previous
          </Button>
          <span className="text-xs text-zinc-500">
            Page {page} of {lastPage}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={page >= lastPage || loading}
            onClick={() => loadRows(page + 1)}
            className="border-zinc-700 text-zinc-200"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
