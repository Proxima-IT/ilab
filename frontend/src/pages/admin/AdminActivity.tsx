import { useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import {
  adminActivityService,
  type AdminActivityLog,
} from "@/services/admin/activity.service";

type PageMeta = {
  current: number;
  last: number;
  total: number;
};

const emptyMeta: PageMeta = { current: 1, last: 1, total: 0 };

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function roleLabel(role?: string | null) {
  return role ? role.replace(/_/g, " ") : "Unknown";
}

function actionStyle(action: string) {
  if (action === "created") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
  if (action === "updated") return "border-sky-500/25 bg-sky-500/10 text-sky-300";
  if (action === "deleted") return "border-rose-500/25 bg-rose-500/10 text-rose-300";
  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

function actionIcon(action: string) {
  if (action === "created") return PlusCircle;
  if (action === "updated") return Wand2;
  if (action === "deleted") return Trash2;
  return Eye;
}

function firstError(error: unknown, fallback: string) {
  return (error as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
}

export default function AdminActivity() {
  const auth = useAdminAuth();
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PageMeta>(emptyMeta);
  const hasFilter = Boolean(searchTerm || role || action || date);

  const loadActivity = async () => {
    if (!auth.isSuperAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await adminActivityService.list({
        search: searchTerm,
        role,
        action,
        date,
        page,
      });
      setLogs(data.data);
      setMeta({
        current: data.current_page,
        last: data.last_page,
        total: data.total,
      });
    } catch (error) {
      toast.error(firstError(error, "Activity logs load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActivity();
  }, [auth.isSuperAdmin, searchTerm, role, action, date, page]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(query.trim());
  };

  if (!auth.isSuperAdmin) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <Activity className="mx-auto h-10 w-10 text-zinc-500" />
        <h1 className="mt-4 text-xl font-semibold text-white">Super admin only</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Activity monitoring is restricted to super admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Activity Monitor</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Select a date or role first, then review clear staff actions without noisy API call rows.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search user, path, action..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border-zinc-700 bg-zinc-900 text-white sm:w-72"
            />
            <Button type="submit" variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="">All roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="instructor">Instructor</option>
            <option value="content_manager">Content Manager</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
          />
          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="">All actions</option>
            <option value="viewed">Viewed</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadActivity()}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
              <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {(searchTerm || role || action || date) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery("");
                setSearchTerm("");
                setRole("");
                setAction("");
                setDate("");
                setPage(1);
              }}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Total Logs</div>
          <div className="mt-2 text-2xl font-semibold text-white">{meta.total}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Page</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {meta.current}/{meta.last}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Current Filter</div>
          <div className="mt-2 text-sm font-semibold capitalize text-white">
            {hasFilter
              ? [date, role ? roleLabel(role) : null, action, searchTerm].filter(Boolean).join(" / ")
              : "Select a filter"}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <p className="text-sm font-semibold text-white">Recent Activity</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading || meta.current <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading || meta.current >= meta.last}
              onClick={() => setPage((current) => current + 1)}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    {hasFilter
                      ? "No activity logs found for this filter."
                      : "Select a date, role, action, or search term to show activity."}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const Icon = actionIcon(log.action);

                  return (
                    <tr key={log.id}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] capitalize ${actionStyle(log.action)}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-100">{log.user_name || "Unknown"}</div>
                        <div className="text-xs text-zinc-500">
                          {log.user_email || "-"} · {roleLabel(log.role)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        <div className="font-medium text-zinc-100">
                          {log.activity_title || log.resource_label || "Admin activity"}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-zinc-500">
                          {log.activity_summary || log.description || "-"}
                        </div>
                        <details className="mt-1">
                          <summary className="cursor-pointer text-[10px] text-zinc-600 hover:text-zinc-400">
                            Technical URL
                          </summary>
                          <div className="mt-1 font-mono text-[10px] text-zinc-600">
                            {log.method} {log.path}
                          </div>
                        </details>
                      </td>
                      <td className="px-4 py-3">
                        <span className={
                          "rounded-full px-2 py-1 text-[11px] " +
                          ((log.status_code || 0) < 400
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300")
                        }>
                          {log.status_code || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{log.ip_address || "-"}</td>
                      <td className="px-4 py-3 text-zinc-500">{formatDate(log.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
