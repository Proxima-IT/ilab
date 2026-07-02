import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Award,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminDeleteModal } from "@/components/admin/AdminDeleteModal";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import {
  adminCertificateService,
  type AdminCertificate,
  type CertificateOptionCourse,
  type CertificateOptionStudent,
  type CertificatePayload,
} from "@/services/admin/certificate.service";

type CertificateForm = {
  id?: string;
  user_id: string;
  course_id: string;
  verification_code: string;
  authorized_signatory_name: string;
  authorized_signatory_title: string;
  eligible_progress: string;
  issued_at: string;
};

const emptyForm: CertificateForm = {
  user_id: "",
  course_id: "",
  verification_code: "",
  authorized_signatory_name: "Authorized Signature",
  authorized_signatory_title: "iLab BD",
  eligible_progress: "90",
  issued_at: "",
};

function toDatetimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toForm(certificate: AdminCertificate): CertificateForm {
  return {
    id: certificate.id,
    user_id: String(certificate.user_id),
    course_id: String(certificate.course_id),
    verification_code: certificate.verification_code || "",
    authorized_signatory_name: certificate.authorized_signatory_name || "",
    authorized_signatory_title: certificate.authorized_signatory_title || "",
    eligible_progress: String(certificate.eligible_progress || 90),
    issued_at: toDatetimeLocal(certificate.issued_at),
  };
}

function toPayload(form: CertificateForm): CertificatePayload {
  return {
    user_id: Number(form.user_id),
    course_id: Number(form.course_id),
    verification_code: form.verification_code.trim() || null,
    authorized_signatory_name: form.authorized_signatory_name.trim() || null,
    authorized_signatory_title: form.authorized_signatory_title.trim() || null,
    eligible_progress: Number(form.eligible_progress || 90),
    issued_at: form.issued_at || null,
  };
}

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

export default function AdminCertificates() {
  const auth = useAdminAuth();
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [students, setStudents] = useState<CertificateOptionStudent[]>([]);
  const [courses, setCourses] = useState<CertificateOptionCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCertificate | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CertificateForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const canManage = useMemo(
    () => Boolean(auth.role && ["super_admin", "admin", "manager"].includes(auth.role)),
    [auth.role]
  );
  const editing = Boolean(form.id);

  const loadCertificates = async (nextPage = page) => {
    setLoading(true);

    try {
      const data = await adminCertificateService.list(searchTerm, nextPage);
      setCertificates(data.data);
      setPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } catch (error) {
      toast.error(firstError(error, "Certificate list load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async (nextStudentSearch = studentSearch) => {
    if (!canManage) return;

    setOptionsLoading(true);

    try {
      const data = await adminCertificateService.options(nextStudentSearch.trim());
      setStudents(data.students);
      setCourses(data.courses);
    } catch (error) {
      toast.error(firstError(error, "Certificate options load hoyni."));
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.userId) {
      void loadCertificates(1);
    }
  }, [auth.userId, searchTerm]);

  useEffect(() => {
    if (auth.userId && canManage) {
      void loadOptions("");
    }
  }, [auth.userId, canManage]);

  useEffect(() => {
    if (!formOpen || !canManage || editing) return;

    const term = studentSearch.trim();

    if (term.length < 2) {
      setStudents([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadOptions(term);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [studentSearch, formOpen, canManage, editing]);

  const openCreate = () => {
    setForm(emptyForm);
    setStudentSearch("");
    setStudents([]);
    setFormOpen(true);
  };

  const openEdit = (certificate: AdminCertificate) => {
    setForm(toForm(certificate));
    setStudentSearch(certificate.user?.name || "");
    if (certificate.user) {
      setStudents([
        {
          id: certificate.user.id,
          name: certificate.user.name,
          email: certificate.user.email,
          phone: certificate.user.phone,
        },
      ]);
    }
    setFormOpen(true);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(query.trim());
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canManage) return;
    if (!form.user_id || !form.course_id) {
      toast.error("Student and course are required.");
      return;
    }

    setSaving(true);

    try {
      const payload = toPayload(form);

      if (editing && form.id) {
        await adminCertificateService.update(form.id, payload);
        toast.success("Certificate updated.");
      } else {
        await adminCertificateService.create(payload);
        toast.success("Certificate created.");
      }

      setFormOpen(false);
      setForm(emptyForm);
      await loadCertificates();
    } catch (error) {
      toast.error(firstError(error, "Certificate save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await adminCertificateService.remove(deleteTarget.id);
      toast.success("Certificate deleted.");
      setDeleteTarget(null);
      await loadCertificates();
    } catch (error) {
      toast.error(firstError(error, "Certificate delete hoyni."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Certificates</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {canManage
              ? "Issue, edit, and remove student course certificates."
              : "View certificates issued for your courses."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search certificates..."
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
            onClick={() => void loadCertificates()}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canManage && (
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Issue Certificate
            </Button>
          )}
        </div>
      </div>

      {formOpen && canManage && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Award className="h-4 w-4 text-primary" />
              {editing ? "Edit certificate" : "Issue certificate"}
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
              <Label className="text-zinc-300">Student</Label>
              {!editing && (
                <Input
                  value={studentSearch}
                  onChange={(event) => {
                    setStudentSearch(event.target.value);
                    setForm((current) => ({ ...current, user_id: "" }));
                  }}
                  placeholder="Search by student name, email, or phone..."
                  className="mt-1 border-zinc-700 bg-zinc-950 text-white"
                />
              )}
              <select
                value={form.user_id}
                onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))}
                disabled={optionsLoading}
                className="mt-2 h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
              >
                <option value="">
                  {optionsLoading
                    ? "Searching students..."
                    : studentSearch.trim().length < 2 && !editing
                      ? "Type at least 2 characters"
                      : "Select student"}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} {student.email ? `- ${student.email}` : student.phone ? `- ${student.phone}` : ""}
                  </option>
                ))}
              </select>
              {!editing && studentSearch.trim().length >= 2 && !optionsLoading && students.length === 0 && (
                <p className="mt-2 text-xs text-amber-300">No matching student found.</p>
              )}
            </div>

            <div>
              <Label className="text-zinc-300">Course</Label>
              <select
                value={form.course_id}
                onChange={(event) => setForm((current) => ({ ...current, course_id: event.target.value }))}
                disabled={optionsLoading}
                className="mt-1 h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-zinc-300">Verification code</Label>
              <Input
                value={form.verification_code}
                onChange={(event) => setForm((current) => ({ ...current, verification_code: event.target.value }))}
                placeholder="Leave blank for auto code"
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">Issued date</Label>
              <Input
                type="datetime-local"
                value={form.issued_at}
                onChange={(event) => setForm((current) => ({ ...current, issued_at: event.target.value }))}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">Signatory name</Label>
              <Input
                value={form.authorized_signatory_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, authorized_signatory_name: event.target.value }))
                }
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">Signatory title</Label>
              <Input
                value={form.authorized_signatory_title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, authorized_signatory_title: event.target.value }))
                }
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label className="text-zinc-300">Eligible progress</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.eligible_progress}
                onChange={(event) => setForm((current) => ({ ...current, eligible_progress: event.target.value }))}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div className="flex items-end justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || optionsLoading}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editing ? "Update Certificate" : "Issue Certificate"}
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
                <th className="px-4 py-3 font-medium">Certificate</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Signatory</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                {canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-12 text-center text-zinc-500">
                    No certificates found.
                  </td>
                </tr>
              ) : (
                certificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold text-primary">
                        {certificate.verification_code}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {certificate.eligible_progress}% eligible progress
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div className="font-medium text-zinc-100">{certificate.user?.name || "-"}</div>
                      <div className="text-xs text-zinc-500">
                        {certificate.user?.email || certificate.user?.phone || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div>{certificate.course?.title || "-"}</div>
                      <div className="text-xs text-zinc-500">
                        {certificate.course?.instructor?.name || "No instructor"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div>{certificate.authorized_signatory_name || "-"}</div>
                      <div className="text-xs text-zinc-500">{certificate.authorized_signatory_title || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{formatDate(certificate.issued_at)}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(certificate)}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 transition hover:bg-zinc-800"
                            aria-label="Edit certificate"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(certificate)}
                            disabled={deletingId === certificate.id}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Delete certificate"
                          >
                            {deletingId === certificate.id ? (
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
        <AdminPagination
          page={page}
          lastPage={lastPage}
          total={total}
          label="certificates"
          loading={loading}
          onPageChange={(nextPage) => void loadCertificates(nextPage)}
        />
      </div>

      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete certificate?"
        description="This certificate will no longer appear in the student's dashboard. This action cannot be undone."
        itemName={deleteTarget ? `${deleteTarget.user?.name || "Student"} - ${deleteTarget.course?.title || "Course"}` : undefined}
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        confirmLabel="Delete Certificate"
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
