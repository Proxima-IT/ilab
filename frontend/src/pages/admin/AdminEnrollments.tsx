import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";



type Row = {
  id: string;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  amount: number;
  promo_code: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  course_id: string;
};

export default function EnrollmentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("all");
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("enrollments").select("*").order("created_at", { ascending: false });
    if (status !== "all") q = q.eq("status", status as never);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("enrollments")
      .update({
        status: editing.status as never,
        payment_method: editing.payment_method,
        payment_reference: editing.payment_reference,
        notes: editing.notes,
      })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setOpen(false);
    void load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Enrollments</h1>
          <p className="mt-1 text-sm text-zinc-400">All payments and student enrollments.</p>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44 border-zinc-700 bg-zinc-900 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-500"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-500">No enrollments.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-zinc-200">{r.student_name}</td>
                <td className="px-4 py-3 text-zinc-400">{r.student_email}</td>
                <td className="px-4 py-3 text-zinc-300">৳{Number(r.amount).toLocaleString()}</td>
                <td className="px-4 py-3 text-zinc-400">{r.payment_method ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={
                    "rounded-full px-2 py-0.5 text-xs " +
                    (r.status === "paid" ? "bg-emerald-500/10 text-emerald-300"
                      : r.status === "pending" ? "bg-amber-500/10 text-amber-300"
                      : "bg-rose-500/10 text-rose-300")
                  }>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }} className="text-zinc-300 hover:bg-zinc-800">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border-zinc-800 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle>Update Enrollment</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="rounded-md bg-zinc-900 p-3 text-sm">
                <div className="text-zinc-200">{editing.student_name}</div>
                <div className="text-xs text-zinc-500">{editing.student_email} · ৳{Number(editing.amount).toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-zinc-300">Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger className="mt-1 border-zinc-700 bg-zinc-900 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "paid", "failed", "refunded", "cancelled"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Payment method</Label>
                <Input value={editing.payment_method ?? ""} onChange={(e) => setEditing({ ...editing, payment_method: e.target.value })} className="mt-1 border-zinc-700 bg-zinc-900 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300">Payment reference</Label>
                <Input value={editing.payment_reference ?? ""} onChange={(e) => setEditing({ ...editing, payment_reference: e.target.value })} className="mt-1 border-zinc-700 bg-zinc-900 text-white" />
              </div>
              <div>
                <Label className="text-zinc-300">Notes</Label>
                <Input value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="mt-1 border-zinc-700 bg-zinc-900 text-white" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900">Cancel</Button>
            <Button onClick={update}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
