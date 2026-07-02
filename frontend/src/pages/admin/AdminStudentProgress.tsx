import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BarChart3, BookOpen, Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminStudentProgressService,
  type AdminProgressCourse,
  type AdminStudentProgress,
} from "@/services/admin/student-progress.service";

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function statusClass(status: string) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "completed") return "bg-primary/10 text-primary";
  if (status === "suspended") return "bg-rose-500/10 text-rose-300";
  return "bg-zinc-700/40 text-zinc-300";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminStudentProgress() {
  const [rows, setRows] = useState<AdminStudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courses, setCourses] = useState<AdminProgressCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");

  const averageProgress = useMemo(() => {
    if (!rows.length) return 0;
    return Math.round(
      rows.reduce((sum, row) => sum + clampProgress(row.calculated_progress), 0) / rows.length
    );
  }, [rows]);

  const loadProgress = async () => {
    setLoading(true);

    try {
      const data = await adminStudentProgressService.list(searchTerm, status, courseId);
      setRows(data.data);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Student progress load hoyni.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    setCoursesLoading(true);

    try {
      const data = await adminStudentProgressService.courses();
      setCourses(data);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Course list load hoyni.";
      toast.error(message);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    void loadProgress();
  }, [searchTerm, status, courseId]);

  useEffect(() => {
    void loadCourses();
  }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchTerm(query.trim());
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Student Progress</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Select a course to see all enrolled students and their progress.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search student or course..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border-zinc-700 bg-zinc-900 text-white sm:w-72"
            />
            <Button type="submit" variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            disabled={coursesLoading}
            className="h-10 min-w-64 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadProgress()}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Records</div>
          <div className="mt-2 text-2xl font-semibold text-white">{rows.length}</div>
          <div className="mt-1 text-xs text-zinc-500">
            {courseId ? "Students in selected course" : "All progress records"}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Average Progress</div>
          <div className="mt-2 text-2xl font-semibold text-white">{averageProgress}%</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Active Courses</div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {rows.filter((row) => row.status === "active").length}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Lessons</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Enrolled</th>
                <th className="px-4 py-3 font-medium">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    No progress found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const progress = clampProgress(row.calculated_progress);

                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-100">{row.student_name}</div>
                        <div className="mt-0.5 text-xs text-zinc-500">
                          {row.student_email || row.student_phone || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span>{row.course_title}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-500">{row.course_slug || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {row.completed_lessons} / {row.total_lessons}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2.5 w-40 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-mono text-xs text-zinc-300">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-[11px] capitalize ${statusClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{formatDate(row.enrolled_at)}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {formatDate(row.last_watched_at || row.last_completed_at)}
                      </td>
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
