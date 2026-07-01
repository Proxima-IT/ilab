import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminDeleteModal } from "@/components/admin/AdminDeleteModal";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import {
  staffService,
  type StaffPayload,
  type StaffRole,
  type StaffUser,
} from "@/services/admin/staff.service";

const roleOptions: { value: StaffRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "instructor", label: "Instructor" },
  { value: "content_manager", label: "Content Manager" },
];

type StaffForm = {
  id?: number;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  bio: string;
  status: boolean;
  password: string;
};

const emptyForm: StaffForm = {
  name: "",
  email: "",
  phone: "",
  role: "instructor",
  bio: "",
  status: true,
  password: "",
};

function roleLabel(role: string) {
  return role.replace(/_/g, " ");
}

function toForm(staff: StaffUser): StaffForm {
  return {
    id: staff.id,
    name: staff.name || "",
    email: staff.email || "",
    phone: staff.phone || "",
    role: staff.role === "super_admin" ? "admin" : staff.role,
    bio: staff.bio || "",
    status: Boolean(staff.status),
    password: "",
  };
}

function toPayload(form: StaffForm, creating: boolean): StaffPayload {
  return {
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    role: form.role,
    bio: form.bio.trim() || null,
    status: form.status,
    password: form.password || (creating ? "" : undefined),
  };
}

export default function AdminUsers() {
  const auth = useAdminAuth();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<StaffForm>(emptyForm);

  const editing = Boolean(form.id);

  const loadStaff = async () => {
    setLoading(true);

    try {
      const data = await staffService.list();
      setStaff(data.data);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Staff list load hoyni.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isSuperAdmin) {
      void loadStaff();
    } else {
      setLoading(false);
    }
  }, [auth.isSuperAdmin]);

  const filteredStaff = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return staff;

    return staff.filter((item) =>
      [item.name, item.email, item.phone, item.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [query, staff]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item: StaffUser) => {
    if (item.role === "super_admin") {
      toast.error("Super admin profile can be updated from profile page only.");
      return;
    }

    setForm(toForm(item));
    setFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    if (!editing && !form.password) {
      toast.error("Password is required for new staff.");
      return;
    }

    if (form.password && form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);

    try {
      const payload = toPayload(form, !editing);

      if (editing && form.id) {
        await staffService.update(form.id, payload);
        toast.success("Staff profile updated.");
      } else {
        await staffService.create(payload);
        toast.success("Staff account created.");
      }

      setFormOpen(false);
      setForm(emptyForm);
      await loadStaff();
    } catch (error) {
      const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
      toast.error(firstError || data?.message || "Staff save hoyni.");
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteStaff = (item: StaffUser) => {
    if (item.role === "super_admin") {
      toast.error("Super admin cannot be deleted here.");
      return;
    }

    setDeleteTarget(item);
  };

  const confirmDeleteStaff = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await staffService.remove(deleteTarget.id);
      toast.success("Staff account deleted.");
      setDeleteTarget(null);
      await loadStaff();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Staff delete hoyni.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!auth.isSuperAdmin) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-zinc-500" />
        <h1 className="mt-4 text-xl font-semibold text-white">Super admin only</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Staff control is available only for super admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Staff Control</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create, edit, delete, and update passwords for admin staff.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search staff..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full border-zinc-700 bg-zinc-900 text-white sm:w-72"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadStaff()}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      {formOpen && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <UserCog className="h-4 w-4 text-primary" />
              {editing ? "Edit staff profile" : "Create staff profile"}
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label className="text-zinc-300">Name</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">Role</Label>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({ ...current, role: event.target.value as StaffRole }))
                }
                className="mt-1 h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-zinc-300">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">Phone</Label>
              <Input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">
                {editing ? "New password" : "Password"}
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editing ? "Leave blank to keep old password" : "Minimum 8 characters"}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">Status</Label>
              <select
                value={form.status ? "active" : "inactive"}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value === "active" }))
                }
                className="mt-1 h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <Label className="text-zinc-300">Bio</Label>
              <textarea
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                rows={4}
                className="mt-1 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary"
              />
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
                {editing ? "Update Staff" : "Create Staff"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    No staff found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((item) => {
                  const editable = item.role !== "super_admin";

                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-100">{item.name}</div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                          {item.bio || "No bio added"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] capitalize text-primary">
                          {roleLabel(item.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        <div>{item.email || "-"}</div>
                        <div className="text-xs text-zinc-500">{item.phone || "-"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            "rounded-full px-2 py-1 text-[11px] " +
                            (item.status
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-rose-500/10 text-rose-300")
                          }
                        >
                          {item.status ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            disabled={!editable}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Edit staff"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                      <button
                            type="button"
                            onClick={() => requestDeleteStaff(item)}
                            disabled={!editable || deletingId === item.id}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Delete staff"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
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
        title="Delete staff account?"
        description="This staff member will lose access to the admin panel. This action cannot be undone."
        itemName={deleteTarget ? `${deleteTarget.name} (${roleLabel(deleteTarget.role)})` : undefined}
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        confirmLabel="Delete Staff"
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDeleteStaff()}
      />
    </div>
  );
}
