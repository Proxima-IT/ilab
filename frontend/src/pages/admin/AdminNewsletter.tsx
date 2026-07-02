import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Edit3, Loader2, Mail, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminDeleteModal } from "@/components/admin/AdminDeleteModal";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import {
  adminNewsletterService,
  type AdminNewsletterSubscriber,
} from "@/services/admin/newsletter.service";

const allowedRoles = ["super_admin", "admin", "manager", "content_manager"];

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function AdminNewsletter() {
  const auth = useAdminAuth();
  const [subscribers, setSubscribers] = useState<AdminNewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminNewsletterSubscriber | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const canManage = Boolean(auth.role && allowedRoles.includes(auth.role));

  const stats = useMemo(() => {
    const active = subscribers.filter((subscriber) => subscriber.is_active).length;
    return {
      active,
      inactive: subscribers.length - active,
      total: subscribers.length,
    };
  }, [subscribers]);

  const loadSubscribers = async () => {
    setLoading(true);

    try {
      const data = await adminNewsletterService.list(search, status);
      setSubscribers(data.data);
    } catch (error) {
      toast.error(firstError(error, "Newsletter subscribers load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      void loadSubscribers();
    } else {
      setLoading(false);
    }
  }, [canManage, search, status]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(query.trim());
  };

  const toggleStatus = async (subscriber: AdminNewsletterSubscriber) => {
    setUpdatingId(subscriber.id);

    try {
      await adminNewsletterService.update(subscriber.id, !subscriber.is_active);
      toast.success(subscriber.is_active ? "Subscriber deactivated." : "Subscriber reactivated.");
      await loadSubscribers();
    } catch (error) {
      toast.error(firstError(error, "Subscriber update hoyni."));
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await adminNewsletterService.remove(deleteTarget.id);
      toast.success("Subscriber deleted.");
      setDeleteTarget(null);
      await loadSubscribers();
    } catch (error) {
      toast.error(firstError(error, "Subscriber delete hoyni."));
    } finally {
      setDeletingId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Access restricted</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Newsletter subscribers can only be managed by content and admin staff.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Newsletter</h1>
          <p className="mt-1 text-sm text-zinc-400">
            View and manage public footer newsletter subscribers.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search email..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border-zinc-700 bg-zinc-900 text-white sm:w-72"
            />
            <Button type="submit" variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadSubscribers()}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Inactive" value={stats.inactive} />
      </div>

      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">All subscribers</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Subscribed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                    No subscribers found.
                  </td>
                </tr>
              ) : (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-zinc-100">
                        <Mail className="h-4 w-4 text-primary" />
                        {subscriber.email}
                      </div>
                      {subscriber.ip_address && (
                        <div className="mt-0.5 text-xs text-zinc-500">{subscriber.ip_address}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{subscriber.source || "-"}</td>
                    <td className="px-4 py-3 text-zinc-400">{formatDate(subscriber.subscribed_at || subscriber.created_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-1 text-[11px] " +
                          (subscriber.is_active
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-zinc-700/60 text-zinc-300")
                        }
                      >
                        {subscriber.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleStatus(subscriber)}
                          disabled={updatingId === subscriber.id}
                          className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-60"
                          aria-label="Toggle subscriber status"
                        >
                          {updatingId === subscriber.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Edit3 className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(subscriber)}
                          disabled={deletingId === subscriber.id}
                          className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
                          aria-label="Delete subscriber"
                        >
                          {deletingId === subscriber.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete newsletter subscriber?"
        description="This email will be removed from the newsletter subscriber list. This action cannot be undone."
        itemName={deleteTarget?.email}
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        confirmLabel="Delete Subscriber"
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}
