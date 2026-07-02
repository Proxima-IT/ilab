import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CalendarClock,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminDeleteModal } from "@/components/admin/AdminDeleteModal";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import {
  adminCouponService,
  type AdminCoupon,
  type CouponCourseOption,
  type CouponPayload,
} from "@/services/admin/coupon.service";

type CouponForm = {
  id?: number;
  code: string;
  type: "percentage" | "fixed";
  value: string;
  course_id: string;
  max_uses: string;
  expires_at: string;
  is_active: boolean;
};

const emptyForm: CouponForm = {
  code: "",
  type: "percentage",
  value: "",
  course_id: "",
  max_uses: "",
  expires_at: "",
  is_active: true,
};

const manageRoles = ["super_admin", "admin", "manager"];
const deleteRoles = ["super_admin", "admin"];

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

function toLocalInputValue(date?: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  const offset = parsed.getTimezoneOffset();
  const local = new Date(parsed.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function formatDate(date?: string | null) {
  if (!date) return "No expiry";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatValue(coupon: Pick<AdminCoupon, "type" | "value">) {
  const value = Number(coupon.value || 0);
  return coupon.type === "percentage" ? `${value}%` : `BDT ${value.toLocaleString()}`;
}

function statusOf(coupon: AdminCoupon) {
  if (!coupon.is_active) return { label: "Inactive", className: "bg-zinc-700/60 text-zinc-300" };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) {
    return { label: "Expired", className: "bg-rose-500/10 text-rose-300" };
  }
  if (coupon.max_uses !== null && coupon.max_uses !== undefined && coupon.used_count >= coupon.max_uses) {
    return { label: "Limit reached", className: "bg-amber-500/10 text-amber-300" };
  }
  return { label: "Active", className: "bg-emerald-500/10 text-emerald-300" };
}

function toForm(coupon: AdminCoupon): CouponForm {
  return {
    id: coupon.id,
    code: coupon.code || "",
    type: coupon.type || "percentage",
    value: String(coupon.value ?? ""),
    course_id: coupon.course_id ? String(coupon.course_id) : "",
    max_uses: coupon.max_uses ? String(coupon.max_uses) : "",
    expires_at: toLocalInputValue(coupon.expires_at),
    is_active: Boolean(coupon.is_active),
  };
}

function toPayload(form: CouponForm): CouponPayload {
  return {
    code: form.code.trim().toUpperCase(),
    type: form.type,
    value: Number(form.value || 0),
    course_id: form.course_id ? Number(form.course_id) : null,
    max_uses: form.max_uses ? Number(form.max_uses) : null,
    expires_at: form.expires_at,
    is_active: form.is_active,
  };
}

export default function AdminPromoCodes() {
  const auth = useAdminAuth();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [courses, setCourses] = useState<CouponCourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const canManage = Boolean(auth.role && manageRoles.includes(auth.role));
  const canDelete = Boolean(auth.role && deleteRoles.includes(auth.role));
  const editing = Boolean(form.id);

  const stats = useMemo(() => {
    const active = coupons.filter((coupon) => statusOf(coupon).label === "Active").length;
    const used = coupons.reduce((total, coupon) => total + Number(coupon.used_count || 0), 0);
    const courseSpecific = coupons.filter((coupon) => coupon.course_id).length;

    return { active, used, courseSpecific };
  }, [coupons]);

  const loadCoupons = async () => {
    setLoading(true);

    try {
      const data = await adminCouponService.list({ search, type, status });
      setCoupons(data.data);
    } catch (error) {
      toast.error(firstError(error, "Promo codes load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const options = await adminCouponService.options();
      setCourses(options.courses);
    } catch {
      setCourses([]);
    }
  };

  useEffect(() => {
    if (canManage) {
      void loadCoupons();
      void loadOptions();
    } else {
      setLoading(false);
    }
  }, [canManage, search, type, status]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (coupon: AdminCoupon) => {
    setForm(toForm(coupon));
    setFormOpen(true);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(query.trim());
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.code.trim()) {
      toast.error("Promo code is required.");
      return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) {
      toast.error("Use only letters, numbers, dash, and underscore.");
      return;
    }
    if (Number(form.value || 0) <= 0) {
      toast.error("Discount value must be greater than 0.");
      return;
    }
    if (form.type === "percentage" && Number(form.value) > 100) {
      toast.error("Percentage cannot be greater than 100.");
      return;
    }
    if (!form.expires_at) {
      toast.error("Expiry date is required.");
      return;
    }

    setSaving(true);

    try {
      const payload = toPayload(form);

      if (editing && form.id) {
        await adminCouponService.update(form.id, payload);
        toast.success("Promo code updated.");
      } else {
        await adminCouponService.create(payload);
        toast.success("Promo code created.");
      }

      setFormOpen(false);
      setForm(emptyForm);
      await loadCoupons();
    } catch (error) {
      toast.error(firstError(error, "Promo code save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      const response = await adminCouponService.remove(deleteTarget.id);
      toast.success(response.message || "Promo code deleted.");
      setDeleteTarget(null);
      await loadCoupons();
    } catch (error) {
      toast.error(firstError(error, "Promo code delete hoyni."));
    } finally {
      setDeletingId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Access restricted</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Promo codes can only be managed by Super Admin, Admin, and Manager accounts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Promo Codes</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create course-specific or site-wide discounts for checkout.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search code..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border-zinc-700 bg-zinc-900 text-white sm:w-60"
            />
            <Button type="submit" variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCoupons()}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Promo
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <StatCard icon={<Tag className="h-4 w-4" />} label="Active codes" value={stats.active} />
        <StatCard icon={<CalendarClock className="h-4 w-4" />} label="Total uses" value={stats.used} />
        <StatCard icon={<Tag className="h-4 w-4" />} label="Course-specific" value={stats.courseSpecific} />
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:flex-row">
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">All types</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {formOpen && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">
              {editing ? "Edit promo code" : "Create promo code"}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
            <Field label="Promo code">
              <Input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                placeholder="ILAB50"
                className="border-zinc-700 bg-zinc-950 font-mono uppercase text-white"
              />
            </Field>

            <Field label="Discount type">
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value as CouponForm["type"] }))
                }
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount (BDT)</option>
              </select>
            </Field>

            <Field label="Discount value">
              <Input
                type="number"
                min={0}
                max={form.type === "percentage" ? 100 : undefined}
                step="0.01"
                value={form.value}
                onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                className="border-zinc-700 bg-zinc-950 text-white"
              />
            </Field>

            <Field label="Apply to course">
              <select
                value={form.course_id}
                onChange={(event) => setForm((current) => ({ ...current, course_id: event.target.value }))}
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
              >
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Max uses">
              <Input
                type="number"
                min={1}
                value={form.max_uses}
                onChange={(event) => setForm((current) => ({ ...current, max_uses: event.target.value }))}
                placeholder="Unlimited"
                className="border-zinc-700 bg-zinc-950 text-white"
              />
            </Field>

            <Field label="Expires at">
              <Input
                type="datetime-local"
                value={form.expires_at}
                onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value }))}
                className="border-zinc-700 bg-zinc-950 text-white"
              />
            </Field>

            <div className="flex items-center gap-2 lg:col-span-2">
              <input
                id="promo-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700"
              />
              <Label htmlFor="promo-active" className="text-zinc-300">
                Active at checkout
              </Label>
            </div>

            <div className="flex justify-end gap-2 lg:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editing ? "Update Promo" : "Create Promo"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    No promo codes found.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const statusMeta = statusOf(coupon);
                  const usagePercent = coupon.max_uses
                    ? Math.min(100, Math.round((coupon.used_count / coupon.max_uses) * 100))
                    : 0;

                  return (
                    <tr key={coupon.id}>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm font-semibold text-white">{coupon.code}</div>
                        <div className="mt-0.5 text-xs capitalize text-zinc-500">{coupon.type}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{formatValue(coupon)}</td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate text-zinc-300">
                          {coupon.course?.title || "All courses"}
                        </div>
                        {coupon.course?.slug && (
                          <div className="text-xs text-zinc-500">{coupon.course.slug}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-300">
                          {coupon.used_count} / {coupon.max_uses || "Unlimited"}
                        </div>
                        {coupon.max_uses && (
                          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-zinc-800">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${usagePercent}%` }} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(coupon.expires_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-[11px] ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(coupon)}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 transition hover:bg-zinc-800"
                            aria-label="Edit promo code"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(coupon)}
                              disabled={deletingId === coupon.id}
                              className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
                              aria-label="Delete promo code"
                            >
                              {deletingId === coupon.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete promo code?"
        description="Unused promo codes will be deleted. If this code has already been used, it will be deactivated instead to protect payment history."
        itemName={deleteTarget ? `${deleteTarget.code} - ${formatValue(deleteTarget)}` : undefined}
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        confirmLabel="Delete Promo"
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label className="text-zinc-300">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}
