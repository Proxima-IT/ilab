import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BookOpen,
  CheckCircle2,
  Edit3,
  GraduationCap,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminDeleteModal } from "@/components/admin/AdminDeleteModal";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import { imageUrl } from "@/services/course-catalog.service";
import {
  adminInstructorService,
  type AdminInstructor,
  type AdminInstructorPayload,
} from "@/services/admin/instructor.service";

type InstructorForm = {
  id?: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  district: string;
  education_level: string;
  bio: string;
  status: boolean;
  password: string;
};

const emptyForm: InstructorForm = {
  name: "",
  email: "",
  phone: "",
  avatar: "",
  district: "",
  education_level: "",
  bio: "",
  status: true,
  password: "",
};

function fallbackAvatar(name?: string | null) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Instructor")}&background=111827&color=ffffff`;
}

function avatarSrc(avatar?: string | null, name?: string | null) {
  return avatar ? imageUrl(avatar) : fallbackAvatar(name);
}

function toForm(instructor: AdminInstructor): InstructorForm {
  return {
    id: instructor.id,
    name: instructor.name || "",
    email: instructor.email || "",
    phone: instructor.phone || "",
    avatar: instructor.avatar || "",
    district: instructor.district || "",
    education_level: instructor.education_level || "",
    bio: instructor.bio || "",
    status: Boolean(instructor.status),
    password: "",
  };
}

function toPayload(form: InstructorForm, creating: boolean): AdminInstructorPayload {
  return {
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    avatar: form.avatar || null,
    district: form.district.trim() || null,
    education_level: form.education_level.trim() || null,
    bio: form.bio.trim() || null,
    status: form.status,
    password: form.password || (creating ? "" : undefined),
  };
}

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

export default function AdminInstructors() {
  const auth = useAdminAuth();
  const [instructors, setInstructors] = useState<AdminInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminInstructor | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<InstructorForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const canManage = useMemo(
    () => Boolean(auth.role && ["super_admin", "admin", "manager"].includes(auth.role)),
    [auth.role]
  );
  const editing = Boolean(form.id);

  const loadInstructors = async () => {
    setLoading(true);

    try {
      const data = await adminInstructorService.list(1, searchTerm);
      setInstructors(data.data);
    } catch (error) {
      toast.error(firstError(error, "Instructor list load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.userId) {
      void loadInstructors();
    }
  }, [auth.userId, searchTerm]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (instructor: AdminInstructor) => {
    setForm(toForm(instructor));
    setFormOpen(true);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchTerm(query.trim());
  };

  const handleAvatarChange = async (file?: File) => {
    if (!file) return;

    setUploadingAvatar(true);

    try {
      const avatar = await adminInstructorService.uploadAvatar(file);
      setForm((current) => ({ ...current, avatar }));
      toast.success("Instructor avatar uploaded.");
    } catch (error) {
      toast.error(firstError(error, "Avatar upload hoyni."));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canManage) return;
    if (!form.name.trim()) {
      toast.error("Instructor name is required.");
      return;
    }
    if (!editing && !form.password) {
      toast.error("Password is required for new instructor.");
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
        await adminInstructorService.update(form.id, payload);
        toast.success("Instructor profile updated.");
      } else {
        await adminInstructorService.create(payload);
        toast.success("Instructor account created.");
      }

      setFormOpen(false);
      setForm(emptyForm);
      await loadInstructors();
    } catch (error) {
      toast.error(firstError(error, "Instructor save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteInstructor = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await adminInstructorService.remove(deleteTarget.id);
      toast.success("Instructor account deleted.");
      setDeleteTarget(null);
      await loadInstructors();
    } catch (error) {
      toast.error(firstError(error, "Instructor delete hoyni."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Instructors</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {canManage
              ? "Manage instructor profiles, avatars, passwords, and course ownership stats."
              : "View your instructor profile and course stats."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search instructors..."
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
            onClick={() => void loadInstructors()}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canManage && (
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Instructor
            </Button>
          )}
        </div>
      </div>

      {formOpen && canManage && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <UserRound className="h-4 w-4 text-primary" />
              {editing ? "Edit instructor profile" : "Create instructor profile"}
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[220px_1fr_1fr]">
            <div className="lg:row-span-4">
              <Label className="text-zinc-300">Avatar</Label>
              <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <img
                  src={avatarSrc(form.avatar, form.name)}
                  alt={form.name || "Instructor"}
                  className="mx-auto h-28 w-28 rounded-full object-cover"
                />
                <label className="mt-4 flex cursor-pointer items-center justify-center rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-200 transition hover:bg-zinc-800">
                  {uploadingAvatar ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-2 h-4 w-4" />
                  )}
                  Upload photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingAvatar}
                    onChange={(event) => void handleAvatarChange(event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            <div>
              <Label className="text-zinc-300">Name</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">{editing ? "New password" : "Password"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editing ? "Leave blank to keep old password" : "Minimum 8 characters"}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
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
              <Label className="text-zinc-300">Expertise / Education</Label>
              <Input
                value={form.education_level}
                onChange={(event) => setForm((current) => ({ ...current, education_level: event.target.value }))}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">District</Label>
              <Input
                value={form.district}
                onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))}
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

            <div className="flex justify-end gap-2 lg:col-span-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploadingAvatar}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editing ? "Update Instructor" : "Create Instructor"}
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
                <th className="px-4 py-3 font-medium">Instructor</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Expertise</th>
                <th className="px-4 py-3 font-medium">Courses</th>
                <th className="px-4 py-3 font-medium">Students</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : instructors.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-12 text-center text-zinc-500">
                    No instructors found.
                  </td>
                </tr>
              ) : (
                instructors.map((instructor) => (
                  <tr key={instructor.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarSrc(instructor.avatar, instructor.name)}
                          alt={instructor.name}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-100">{instructor.name}</div>
                          <div className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                            {instructor.bio || "No bio added"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div className="flex items-center gap-1">
                        {instructor.email || "-"}
                        {instructor.email_verified_at && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                        {instructor.phone || "-"}
                        {instructor.phone_verified_at && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div>{instructor.education_level || "-"}</div>
                      <div className="text-xs text-zinc-500">{instructor.district || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-300">
                        <BookOpen className="h-3.5 w-3.5" />
                        {instructor.courses_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] text-primary">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {instructor.students_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-1 text-[11px] " +
                          (instructor.status
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300")
                        }
                      >
                        {instructor.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(instructor)}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 transition hover:bg-zinc-800"
                            aria-label="Edit instructor"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(instructor)}
                            disabled={deletingId === instructor.id || Boolean(instructor.courses_count)}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Delete instructor"
                            title={instructor.courses_count ? "Reassign courses before deleting" : "Delete instructor"}
                          >
                            {deletingId === instructor.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete instructor account?"
        description="This instructor will lose admin panel access. Instructors with assigned courses cannot be deleted until their courses are reassigned."
        itemName={deleteTarget ? `${deleteTarget.name} (${deleteTarget.email || deleteTarget.phone || "no contact"})` : undefined}
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        confirmLabel="Delete Instructor"
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDeleteInstructor()}
      />
    </div>
  );
}
