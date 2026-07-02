import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BellRing,
  BookOpen,
  Check,
  Loader2,
  Plus,
  Search,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { imageUrl } from "@/services/course-catalog.service";
import {
  adminNotificationService,
  type AdminNotificationCourse,
  type AdminNotificationStudent,
} from "@/services/admin/notification.service";

const notificationTypes = [
  { value: "admin_message", label: "General message" },
  { value: "special_offer", label: "Special offer" },
  { value: "event", label: "Event" },
  { value: "new_lecture", label: "New lecture" },
  { value: "course_completion", label: "Course completion" },
  { value: "certificate_ready", label: "Certificate ready" },
];

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

function fallbackAvatar(name?: string | null) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Student")}&background=18181b&color=ffffff`;
}

function avatarSrc(student: AdminNotificationStudent) {
  return student.avatar ? imageUrl(student.avatar) : fallbackAvatar(student.name);
}

export default function AdminNotifications() {
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<AdminNotificationStudent[]>([]);
  const [studentSearching, setStudentSearching] = useState(false);
  const [courseQuery, setCourseQuery] = useState("");
  const [courses, setCourses] = useState<AdminNotificationCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseStudents, setCourseStudents] = useState<AdminNotificationStudent[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseStudentsLoading, setCourseStudentsLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<AdminNotificationStudent[]>([]);
  const [type, setType] = useState("admin_message");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [sending, setSending] = useState(false);

  const selectedIds = useMemo(
    () => new Set(selectedStudents.map((student) => student.id)),
    [selectedStudents]
  );

  const loadCourses = async (search = courseQuery) => {
    setCoursesLoading(true);

    try {
      setCourses(await adminNotificationService.courses(search.trim()));
    } catch (error) {
      toast.error(firstError(error, "Course list load hoyni."));
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses("");
  }, []);

  const addStudent = (student: AdminNotificationStudent) => {
    setSelectedStudents((current) => {
      if (current.some((item) => item.id === student.id)) return current;
      return [...current, student];
    });
  };

  const addManyStudents = (students: AdminNotificationStudent[]) => {
    setSelectedStudents((current) => {
      const merged = new Map<number, AdminNotificationStudent>();
      current.forEach((student) => merged.set(student.id, student));
      students.forEach((student) => merged.set(student.id, student));
      return Array.from(merged.values());
    });
  };

  const removeStudent = (studentId: number) => {
    setSelectedStudents((current) => current.filter((student) => student.id !== studentId));
  };

  const handleStudentSearch = async (event: FormEvent) => {
    event.preventDefault();
    const search = studentQuery.trim();

    if (search.length < 2) {
      toast.error("Search at least 2 characters.");
      return;
    }

    setStudentSearching(true);

    try {
      setStudentResults(await adminNotificationService.searchStudents(search));
    } catch (error) {
      toast.error(firstError(error, "Student search hoyni."));
    } finally {
      setStudentSearching(false);
    }
  };

  const handleCourseSearch = (event: FormEvent) => {
    event.preventDefault();
    void loadCourses();
  };

  const loadCourseStudents = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setCourseStudents([]);

    if (!courseId) return;

    setCourseStudentsLoading(true);

    try {
      setCourseStudents(await adminNotificationService.courseStudents(Number(courseId)));
    } catch (error) {
      toast.error(firstError(error, "Course students load hoyni."));
    } finally {
      setCourseStudentsLoading(false);
    }
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();

    if (selectedStudents.length === 0) {
      toast.error("Select at least one student.");
      return;
    }
    if (!title.trim()) {
      toast.error("Notification title is required.");
      return;
    }
    if (!message.trim()) {
      toast.error("Notification message is required.");
      return;
    }

    setSending(true);

    try {
      const data = await adminNotificationService.send({
        user_ids: selectedStudents.map((student) => student.id),
        type,
        title: title.trim(),
        message: message.trim(),
        action_url: actionUrl.trim() || null,
      });

      toast.success(`Notification sent to ${data.sent_count} student${data.sent_count === 1 ? "" : "s"}.`);
      setTitle("");
      setMessage("");
      setActionUrl("");
      setSelectedStudents([]);
      setStudentResults([]);
      setStudentQuery("");
    } catch (error) {
      toast.error(firstError(error, "Notification send hoyni."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Notifications</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Search students, select course learners, and send targeted dashboard notifications.
          </p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {selectedStudents.length} selected
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-white">Search student</h2>
            </div>

            <form onSubmit={handleStudentSearch} className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={studentQuery}
                onChange={(event) => setStudentQuery(event.target.value)}
                placeholder="Search by name, email, or phone..."
                className="border-zinc-700 bg-zinc-950 text-white"
              />
              <Button type="submit" disabled={studentSearching}>
                {studentSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search
              </Button>
            </form>

            <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
              {studentResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  Search first. Students are not listed by default.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {studentResults.map((student) => (
                    <div key={student.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={avatarSrc(student)}
                          alt={student.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{student.name}</p>
                          <p className="truncate text-xs text-zinc-500">
                            {student.email || student.phone || "No contact"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedIds.has(student.id) ? "outline" : "default"}
                        disabled={selectedIds.has(student.id)}
                        onClick={() => addStudent(student)}
                        className={selectedIds.has(student.id) ? "border-zinc-700 bg-transparent text-zinc-400" : ""}
                      >
                        {selectedIds.has(student.id) ? <Check className="mr-2 h-3.5 w-3.5" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
                        {selectedIds.has(student.id) ? "Added" : "Add"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-white">Select by course</h2>
            </div>

            <form onSubmit={handleCourseSearch} className="mb-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={courseQuery}
                onChange={(event) => setCourseQuery(event.target.value)}
                placeholder="Search courses..."
                className="border-zinc-700 bg-zinc-950 text-white"
              />
              <Button type="submit" variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
                {coursesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Find
              </Button>
            </form>

            <select
              value={selectedCourseId}
              onChange={(event) => void loadCourseStudents(event.target.value)}
              className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800">
              {courseStudentsLoading ? (
                <div className="px-4 py-8 text-center text-zinc-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </div>
              ) : !selectedCourseId ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  Select a course to load enrolled students.
                </div>
              ) : courseStudents.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No enrolled students found for this course.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Users className="h-4 w-4 text-primary" />
                      {courseStudents.length} students
                    </div>
                    <Button type="button" size="sm" onClick={() => addManyStudents(courseStudents)}>
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Add all
                    </Button>
                  </div>
                  <div className="max-h-80 divide-y divide-zinc-800 overflow-y-auto admin-scrollbar">
                    {courseStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{student.name}</p>
                          <p className="truncate text-xs text-zinc-500">
                            {student.email || student.phone || "No contact"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addStudent(student)}
                          disabled={selectedIds.has(student.id)}
                          className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Add student"
                        >
                          {selectedIds.has(student.id) ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-4 flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-white">Message</h2>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <Label className="text-zinc-300">Type</Label>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
                >
                  {notificationTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-zinc-300">Title</Label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1 border-zinc-700 bg-zinc-950 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Message</Label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="mt-1 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Action URL</Label>
                <Input
                  value={actionUrl}
                  onChange={(event) => setActionUrl(event.target.value)}
                  placeholder="/dashboard/my-courses"
                  className="mt-1 border-zinc-700 bg-zinc-950 text-white"
                />
              </div>

              <Button type="submit" disabled={sending || selectedStudents.length === 0} className="w-full">
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Notification
              </Button>
            </form>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Selected students</h2>
              {selectedStudents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStudents([])}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  Clear all
                </button>
              )}
            </div>

            {selectedStudents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
                No students selected yet.
              </div>
            ) : (
              <div className="admin-scrollbar max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {selectedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={avatarSrc(student)}
                        alt={student.name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{student.name}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {student.email || student.phone || "No contact"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStudent(student.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                      aria-label="Remove student"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
