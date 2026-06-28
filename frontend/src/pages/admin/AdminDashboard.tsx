import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ShoppingBag, Users, DollarSign } from "lucide-react";



type Stat = { label: string; value: string | number; icon: typeof BookOpen; tint: string };

export default function Dashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { label: "Total Revenue", value: "—", icon: DollarSign, tint: "text-emerald-400 bg-emerald-500/10" },
    { label: "Enrollments", value: "—", icon: ShoppingBag, tint: "text-primary bg-primary/10" },
    { label: "Active Courses", value: "—", icon: BookOpen, tint: "text-sky-400 bg-sky-500/10" },
    { label: "Users", value: "—", icon: Users, tint: "text-amber-400 bg-amber-500/10" },
  ]);
  const [recent, setRecent] = useState<{ id: string; student_name: string; amount: number; status: string; created_at: string }[]>([]);

  useEffect(() => {
    void (async () => {
      const [enr, courses, users, recentEnr] = await Promise.all([
        supabase.from("enrollments").select("amount,status", { count: "exact" }),
        supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("enrollments").select("id,student_name,amount,status,created_at").order("created_at", { ascending: false }).limit(8),
      ]);
      const revenue = (enr.data ?? [])
        .filter((e) => e.status === "paid")
        .reduce((acc, e) => acc + Number(e.amount ?? 0), 0);
      setStats([
        { label: "Total Revenue", value: "৳" + revenue.toLocaleString(), icon: DollarSign, tint: "text-emerald-400 bg-emerald-500/10" },
        { label: "Enrollments", value: enr.count ?? 0, icon: ShoppingBag, tint: "text-primary bg-primary/10" },
        { label: "Active Courses", value: courses.count ?? 0, icon: BookOpen, tint: "text-sky-400 bg-sky-500/10" },
        { label: "Users", value: users.count ?? 0, icon: Users, tint: "text-amber-400 bg-amber-500/10" },
      ]);
      setRecent((recentEnr.data ?? []) as typeof recent);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-400">Overview of your site.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.tint}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold text-white">{s.value}</div>
              <div className="text-xs text-zinc-400">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-200">Recent enrollments</div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-2 font-medium">Student</th>
              <th className="px-5 py-2 font-medium">Amount</th>
              <th className="px-5 py-2 font-medium">Status</th>
              <th className="px-5 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {recent.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-zinc-500">No enrollments yet.</td></tr>
            ) : (
              recent.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 text-zinc-200">{r.student_name}</td>
                  <td className="px-5 py-3 text-zinc-300">৳{Number(r.amount).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={
                      "rounded-full px-2 py-0.5 text-xs " +
                      (r.status === "paid" ? "bg-emerald-500/10 text-emerald-300"
                        : r.status === "pending" ? "bg-amber-500/10 text-amber-300"
                        : "bg-rose-500/10 text-rose-300")
                    }>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
