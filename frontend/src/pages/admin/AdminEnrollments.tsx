import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BookOpen,
  CalendarClock,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldOff,
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
  adminEnrollmentService,
  type AdminEnrollment,
  type EnrollmentCourseOption,
  type EnrollmentPayload,
  type EnrollmentStatus,
  type EnrollmentStudentOption,
  type EnrollmentUpdatePayload,
} from "@/services/admin/enrollment.service";

type EnrollmentForm = {
  id?: number;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_price: string;
  progress_percentage: string;
  enrolled_at: string;
  expires_at: string;
};

const emptyForm: EnrollmentForm = {
  user_id: "",
  course_id: "",
  status: "active",
  enrolled_price: "0",
  progress_percentage: "0",
  enrolled_at: "",
  expires_at: "",
};

const statuses: EnrollmentStatus[] = ["active", "completed", "suspended", "expired"];

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function money(value?: string | number | null) {
  return `৳${Number(value || 0).toLocaleString()}`;
}

function effectiveCoursePrice(course?: EnrollmentCourseOption | null) {
  if (!course) return 0;
  if (course.type === "free") return 0;
  return Number(course.discount_price ?? course.price ?? 0);
}

function fallbackAvatar(name?: string | null) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Student")}&background=18181b&color=ffffff`;
}

function resolveImage(path?: string | null, name?: string | null) {
  return path ? imageUrl(path) : fallbackAvatar(name);
}

function statusClass(status: EnrollmentStatus) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "completed") return "bg-sky-500/10 text-sky-300";
  if (status === "suspended") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

export default function AdminEnrollments() {
  const auth = useAdminAuth();
  const [rows, setRows] = useState<AdminEnrollment[]>([]);
  const [students, setStudents] = useState<EnrollmentStudentOption[]>([]);
  const [courses, setCourses] = useState<EnrollmentCourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminEnrollment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<EnrollmentForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [courseId, setCourseId] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const canManage = Boolean(auth.role && ["super_admin", "admin"].includes(auth.role));
  const editing = Boolean(form.id);

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return students;

    return students.filter((student) =>
      [student.name, student.email, student.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [studentSearch, students]);

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === form.course_id) || null,
    [courses, form.course_id]
  );

  const loadOptions = async () => {
    setOptionsLoading(true);

    try {
      const data = await adminEnrollmentService.options();
      setStudents(data.students);
      setCourses(data.courses);
    } catch (error) {
      toast.error(firstError(error, "Enrollment options load hoyni."));
    } finally {
      setOptionsLoading(false);
    }
  };

  const loadRows = async (nextPage = page) => {
    setLoading(true);

    try {
      const data = await adminEnrollmentService.list({
        page: nextPage,
        search: searchTerm,
        status,
        course_id: courseId,
        per_page: 20,
      });
      setRows(data.data);
      setPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } catch (error) {
      toast.error(firstError(error, "Enrollment list load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.userId) {
      void loadOptions();
    }
  }, [auth.userId]);

  useEffect(() => {
    if (auth.userId) {
      void loadRows(1);
    }
  }, [auth.userId, searchTerm, status, courseId]);

  const openCreate = () => {
    const today = new Date().toISOString().slice(0, 10);
    setForm({ ...emptyForm, enrolled_at: today });
    setStudentSearch("");
    setFormOpen(true);
  };

  const openEdit = (row: AdminEnrollment) => {
    setForm({
      id: row.id,
      user_id: String(row.user_id),
      course_id: String(row.course_id),
      status: row.status,
      enrolled_price: String(row.enrolled_price ?? 0),
      progress_percentage: String(row.progress_percentage ?? 0),
      enrolled_at: toDateInput(row.enrolled_at),
      expires_at: toDateInput(row.expires_at),
    });
    setStudentSearch(row.student_name || "");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setForm(emptyForm);
  };

  const handleCourseChange = (value: string) => {
    const course = courses.find((item) => String(item.id) === value);
    setForm((current) => ({
      ...current,
      course_id: value,
      enrolled_price: editing ? current.enrolled_price : String(effectiveCoursePrice(course)),
    }));
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchTerm(query.trim());
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canManage) return;
    if (!form.user_id || !form.course_id) {
      toast.error("Student and course are required.");
      return;
    }

    const price = Number(form.enrolled_price || 0);
    const progress = Number(form.progress_percentage || 0);

    if (Number.isNaN(price) || price < 0) {
      toast.error("Enrollment price must be 0 or more.");
      return;
    }
    if (Number.isNaN(progress) || progress < 0 || progress > 100) {
      toast.error("Progress must be between 0 and 100.");
      return;
    }

    setSaving(true);

    try {
      if (editing && form.id) {
        const payload: EnrollmentUpdatePayload = {
          status: form.status,
          progress_percentage: progress,
          enrolled_price: price,
          enrolled_at: form.enrolled_at || null,
          expires_at: form.expires_at || null,
        };

        await adminEnrollmentService.update(form.id, payload);
        toast.success("Enrollment updated.");
      } else {
        const payload: EnrollmentPayload = {
          user_id: Number(form.user_id),
          course_id: Number(form.course_id),
          enrolled_price: price,
          status: form.status === "expired" ? "active" : form.status,
          enrolled_at: form.enrolled_at || null,
          expires_at: form.expires_at || null,
        };

        await adminEnrollmentService.create(payload);
        toast.success("Student enrolled successfully.");
      }

      closeForm();
      await loadRows(1);
    } catch (error) {
      toast.error(firstError(error, "Enrollment save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await adminEnrollmentService.remove(deleteTarget.id);
      toast.success("Student course access revoked.");
      setDeleteTarget(null);
      await loadRows(page);
    } catch (error) {
      toast.error(firstError(error, "Enrollment revoke hoyni."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Enrollments</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Control student course access, expiry, price, and progress from one place.
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search student or course..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border-zinc-700 bg-zinc-900 text-white lg:w-72"
            />
            <Button type="submit" variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="all">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="all">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            onClick={() => void loadRows(page)}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          {canManage && (
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Enrollment
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <SummaryCard icon={UserRound} label="Total enrollments" value={String(total)} />
        <SummaryCard
          icon={BookOpen}
          label="Active on this page"
          value={String(rows.filter((row) => row.status === "active").length)}
        />
        <SummaryCard
          icon={CalendarClock}
          label="Expired on this page"
          value={String(rows.filter((row) => row.status === "expired").length)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Access</th>
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
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-12 text-center text-zinc-500">
                    No enrollments found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveImage(row.student_avatar, row.student_name)}
                          alt={row.student_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-100">{row.student_name}</p>
                          <p className="truncate text-xs text-zinc-500">
                            {row.student_email || row.student_phone || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveImage(row.course_thumbnail, row.course_title)}
                          alt={row.course_title}
                          className="h-12 w-20 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-100">{row.course_title}</p>
                          <p className="truncate text-xs text-zinc-500">{row.course_slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{money(row.enrolled_price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(Number(row.progress_percentage || 0), 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-400">{Number(row.progress_percentage || 0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] capitalize ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div>Enrolled {formatDate(row.enrolled_at)}</div>
                      <div className="mt-1 text-xs text-zinc-500">Expires {formatDate(row.expires_at)}</div>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 transition hover:bg-zinc-800"
                            aria-label="Edit enrollment"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            disabled={deletingId === row.id}
                            className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Revoke enrollment"
                          >
                            {deletingId === row.id ? (
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

        <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            Page {page} of {lastPage} · {total} enrollments
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => void loadRows(page - 1)}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= lastPage || loading}
              onClick={() => void loadRows(page + 1)}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {formOpen && canManage && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm">
          <button type="button" className="absolute inset-0" aria-label="Close enrollment form" onClick={closeForm} />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editing ? "Update Enrollment" : "Add Enrollment"}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {editing ? "Update course access and progress." : "Give a student access to a course."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 p-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Label className="text-zinc-300">Student</Label>
                {!editing && (
                  <Input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search by name, email, or phone..."
                    disabled={optionsLoading}
                    className="mt-1 border-zinc-700 bg-zinc-900 text-white"
                  />
                )}
                <select
                  value={form.user_id}
                  onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))}
                  disabled={editing || optionsLoading}
                  className="mt-2 h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{optionsLoading ? "Loading students..." : "Select student"}</option>
                  {filteredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} {student.email ? `- ${student.email}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <Label className="text-zinc-300">Course</Label>
                <select
                  value={form.course_id}
                  onChange={(event) => handleCourseChange(event.target.value)}
                  disabled={editing || optionsLoading}
                  className="mt-1 h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{optionsLoading ? "Loading courses..." : "Select course"}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} {course.instructor_name ? `- ${course.instructor_name}` : ""}
                    </option>
                  ))}
                </select>
                {selectedCourse && !editing && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Suggested price: {money(effectiveCoursePrice(selectedCourse))}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-zinc-300">Status</Label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as EnrollmentStatus }))
                  }
                  className="mt-1 h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item} disabled={!editing && item === "expired"}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-zinc-300">Enrollment price</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.enrolled_price}
                  onChange={(event) => setForm((current) => ({ ...current, enrolled_price: event.target.value }))}
                  className="mt-1 border-zinc-700 bg-zinc-900 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Progress (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.progress_percentage}
                  disabled={!editing}
                  onChange={(event) => setForm((current) => ({ ...current, progress_percentage: event.target.value }))}
                  className="mt-1 border-zinc-700 bg-zinc-900 text-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Enrolled date</Label>
                <Input
                  type="date"
                  value={form.enrolled_at}
                  onChange={(event) => setForm((current) => ({ ...current, enrolled_at: event.target.value }))}
                  className="mt-1 border-zinc-700 bg-zinc-900 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Expiry date</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value }))}
                  className="mt-1 border-zinc-700 bg-zinc-900 text-white"
                />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 lg:col-span-2">
                <div className="flex gap-3">
                  <ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <p className="text-xs leading-5 text-zinc-400">
                    Revoking an enrollment deletes this student's lesson progress for this course. Updating status keeps
                    the progress data.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 lg:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={saving}
                  className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {editing ? "Update Enrollment" : "Enroll Student"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Revoke course access?"
        description="This removes the student's enrollment and clears their lesson progress for this course. This action cannot be undone."
        itemName={deleteTarget ? `${deleteTarget.student_name} - ${deleteTarget.course_title}` : undefined}
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        confirmLabel="Revoke Access"
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
