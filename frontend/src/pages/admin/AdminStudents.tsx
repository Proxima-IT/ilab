import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Edit3,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminDeleteModal } from "@/components/admin/AdminDeleteModal";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import {
  adminStudentService,
  type AdminStudent,
  type AdminStudentPayload,
} from "@/services/admin/student.service";

type StudentForm = {
  id?: number;
  name: string;
  email: string;
  phone: string;
  district: string;
  education_level: string;
  bio: string;
  status: boolean;
  password: string;
};

const emptyForm: StudentForm = {
  name: "",
  email: "",
  phone: "",
  district: "",
  education_level: "",
  bio: "",
  status: true,
  password: "",
};

function toForm(student: AdminStudent): StudentForm {
  return {
    id: student.id,
    name: student.name || "",
    email: student.email || "",
    phone: student.phone || "",
    district: student.district || "",
    education_level: student.education_level || "",
    bio: student.bio || "",
    status: Boolean(student.status),
    password: "",
  };
}

function toPayload(form: StudentForm, creating: boolean): AdminStudentPayload {
  return {
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
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

export default function AdminStudents() {
  const auth = useAdminAuth();
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStudent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const canManage = useMemo(
    () => Boolean(auth.role && ["super_admin", "admin", "manager"].includes(auth.role)),
    [auth.role]
  );
  const editing = Boolean(form.id);

  const loadStudents = async () => {
    setLoading(true);

    try {
      const data = await adminStudentService.list(1, searchTerm);
      setStudents(data.data);
    } catch (error) {
      toast.error(firstError(error, "Student list load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.userId) {
      void loadStudents();
    }
  }, [auth.userId, searchTerm]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (student: AdminStudent) => {
    setForm(toForm(student));
    setFormOpen(true);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchTerm(query.trim());
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canManage) return;
    if (!form.name.trim()) {
      toast.error("Student name is required.");
      return;
    }
    if (!editing && !form.password) {
      toast.error("Password is required for new student.");
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
        await adminStudentService.update(form.id, payload);
        toast.success("Student account updated.");
      } else {
        await adminStudentService.create(payload);
        toast.success("Student account created and verified.");
      }

      setFormOpen(false);
      setForm(emptyForm);
      await loadStudents();
    } catch (error) {
      toast.error(firstError(error, "Student save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteStudent = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await adminStudentService.remove(deleteTarget.id);
      toast.success("Student account deleted.");
      setDeleteTarget(null);
      await loadStudents();
    } catch (error) {
      toast.error(firstError(error, "Student delete hoyni."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Students</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {canManage
              ? "Create, edit, delete, and verify student accounts from the admin panel."
              : "View unique students enrolled in your courses."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search students..."
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
            onClick={() => void loadStudents()}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canManage && (
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          )}
        </div>
      </div>

      {formOpen && canManage && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <UserPlus className="h-4 w-4 text-primary" />
              {editing ? "Edit student account" : "Create verified student account"}
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
              <Label className="text-zinc-300">Education</Label>
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
                {editing ? "Update Student" : "Create Student"}
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
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Education</th>
                <th className="px-4 py-3 font-medium">Courses</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
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
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-12 text-center text-zinc-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-100">{student.name}</div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                        {student.bio || "No bio added"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div className="flex items-center gap-1">
                        {student.email || "-"}
                        {student.email_verified_at && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                        {student.phone || "-"}
                        {student.phone_verified_at && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div>{student.education_level || "-"}</div>
                      <div className="text-xs text-zinc-500">{student.district || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] text-primary">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {student.enrolled_courses_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-1 text-[11px] " +
                          (student.status
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300")
                        }
                      >
                        {student.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(student)}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 transition hover:bg-zinc-800"
                            aria-label="Edit student"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(student)}
                            disabled={deletingId === student.id}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Delete student"
                          >
                            {deletingId === student.id ? (
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
        title="Delete student account?"
        description="This student will lose access to the learning dashboard. This action cannot be undone."
        itemName={deleteTarget ? `${deleteTarget.name} (${deleteTarget.email || deleteTarget.phone || "no contact"})` : undefined}
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        confirmLabel="Delete Student"
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDeleteStudent()}
      />
    </div>
  );
}
