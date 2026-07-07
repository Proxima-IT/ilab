import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  BookOpen,
  Camera,
  Edit3,
  FileText,
  FolderOpen,
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
import {
  adminCourseBuilderService,
  type AdminCourse,
  type AdminCourseOption,
  type AdminLesson,
  type AdminLessonResource,
  type AdminSection,
  type CoursePayload,
} from "@/services/admin/course-builder.service";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import { imageUrl } from "@/services/course-catalog.service";

type CourseForm = {
  id?: number;
  title: string;
  category_id: string;
  instructor_id: string;
  description: string;
  thumbnail: string;
  intro_video: string;
  price: string;
  discount_price: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  type: "self_paced" | "batch" | "free";
  level: "beginner" | "intermediate" | "advanced";
  language: string;
  tags: string;
  prerequisites: string;
  learning_outcomes: string;
  meta_title: string;
  meta_description: string;
};

type SectionForm = {
  id?: number;
  course_id: number;
  title: string;
  order: string;
  unlock_at: string;
};

type LessonForm = {
  id?: number;
  section_id: number;
  title: string;
  type: "video" | "pdf" | "quiz" | "live_session";
  video_url: string;
  content: string;
  live_link: string;
  live_start_time: string;
  duration: string;
  is_free: boolean;
  order: string;
};

type ResourceForm = {
  id?: number;
  lesson_id: number;
  title: string;
  url: string;
  type: AdminLessonResource["type"];
  file_size: string;
  order: string;
  is_active: boolean;
};

const emptyCourse: CourseForm = {
  title: "",
  category_id: "",
  instructor_id: "",
  description: "",
  thumbnail: "",
  intro_video: "",
  price: "0",
  discount_price: "",
  status: "draft",
  is_featured: false,
  type: "self_paced",
  level: "beginner",
  language: "Bengali",
  tags: "",
  prerequisites: "",
  learning_outcomes: "",
  meta_title: "",
  meta_description: "",
};

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

function lines(value?: string[] | null) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function toArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toDateInput(date?: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function courseToForm(course: AdminCourse): CourseForm {
  return {
    id: course.id,
    title: course.title || "",
    category_id: String(course.category_id || ""),
    instructor_id: String(course.instructor_id || ""),
    description: course.description || "",
    thumbnail: course.thumbnail || "",
    intro_video: course.intro_video || "",
    price: String(course.price ?? 0),
    discount_price: course.discount_price ? String(course.discount_price) : "",
    status: course.status || "draft",
    is_featured: Boolean(course.is_featured),
    type: course.type || "self_paced",
    level: course.level || "beginner",
    language: course.language || "Bengali",
    tags: lines(course.tags),
    prerequisites: lines(course.prerequisites),
    learning_outcomes: lines(course.learning_outcomes),
    meta_title: course.meta_title || "",
    meta_description: course.meta_description || "",
  };
}

function coursePayload(form: CourseForm): CoursePayload {
  return {
    title: form.title.trim(),
    category_id: Number(form.category_id),
    instructor_id: form.instructor_id ? Number(form.instructor_id) : null,
    description: form.description.trim(),
    thumbnail: form.thumbnail.trim() || null,
    intro_video: form.intro_video.trim() || null,
    price: Number(form.price || 0),
    discount_price: form.discount_price ? Number(form.discount_price) : null,
    status: form.status,
    is_featured: form.is_featured,
    type: form.type,
    level: form.level,
    language: form.language.trim() || "Bengali",
    tags: toArray(form.tags),
    prerequisites: toArray(form.prerequisites),
    learning_outcomes: toArray(form.learning_outcomes),
    meta_title: form.meta_title.trim() || null,
    meta_description: form.meta_description.trim() || null,
  };
}

export default function AdminCourses() {
  const auth = useAdminAuth();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [selected, setSelected] = useState<AdminCourse | null>(null);
  const [categories, setCategories] = useState<AdminCourseOption[]>([]);
  const [instructors, setInstructors] = useState<AdminCourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "curriculum">("details");
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourse);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [sectionForm, setSectionForm] = useState<SectionForm | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm | null>(null);
  const [resourceForm, setResourceForm] = useState<ResourceForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number; label: string } | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const canDelete = auth.role === "super_admin" || auth.role === "admin";
  const canManageInstructor = auth.role === "super_admin" || auth.role === "admin" || auth.role === "manager";
  const isInstructor = auth.role === "instructor";
  const editingCourse = Boolean(courseForm.id);
  const currentInstructorLabel = selected?.instructor?.name || auth.name || "Current instructor";
  const selectedStats = useMemo(() => {
    const sections = selected?.sections || [];
    const lessons = sections.flatMap((section) => section.lessons || []);
    const resources = lessons.flatMap((lesson) => lesson.resources || []);
    return { sections: sections.length, lessons: lessons.length, resources: resources.length };
  }, [selected]);

  const loadOptions = async () => {
    const data = await adminCourseBuilderService.options();
    setCategories(data.categories);
    setInstructors(data.instructors);
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await adminCourseBuilderService.list(search, status);
      setCourses(data.data);
      if (!selected && data.data[0]) {
        await selectCourse(data.data[0].id);
      }
    } catch (error) {
      toast.error(firstError(error, "Courses load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  const selectCourse = async (id: number) => {
    setLoading(true);
    try {
      const course = await adminCourseBuilderService.show(id);
      setSelected(course);
      setCourseForm(courseToForm(course));
      setActiveTab("details");
      setSectionForm(null);
      setLessonForm(null);
      setResourceForm(null);
    } catch (error) {
      toast.error(firstError(error, "Course details load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  const reloadSelected = async () => {
    if (selected?.id) await selectCourse(selected.id);
    await loadCourses();
  };

  useEffect(() => {
    void loadOptions();
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [search, status]);

  const handleCourseSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!courseForm.title.trim() || !courseForm.category_id || !courseForm.description.trim()) {
      toast.error("Title, category, and description are required.");
      return;
    }
    if (canManageInstructor && !courseForm.instructor_id) {
      toast.error("Please assign an instructor before saving this course.");
      return;
    }

    setSaving(true);
    try {
      const payload = coursePayload(courseForm);
      const course = editingCourse && courseForm.id
        ? await adminCourseBuilderService.update(courseForm.id, payload)
        : await adminCourseBuilderService.create(payload);
      toast.success(editingCourse ? "Course updated." : "Course created.");
      await selectCourse(course.id);
      await loadCourses();
    } catch (error) {
      toast.error(firstError(error, "Course save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploadingThumbnail(true);

    try {
      const thumbnail = await adminCourseBuilderService.uploadThumbnail(file, courseForm.thumbnail);
      setCourseForm((current) => ({ ...current, thumbnail }));
      toast.success("Course thumbnail uploaded.");
    } catch (error) {
      toast.error(firstError(error, "Thumbnail upload hoyni."));
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const saveSection = async () => {
    if (!sectionForm?.title.trim()) return toast.error("Module title is required.");
    setSaving(true);
    try {
      if (sectionForm.id) {
        await adminCourseBuilderService.updateSection(sectionForm.id, {
          title: sectionForm.title.trim(),
          order: Number(sectionForm.order || 0),
          unlock_at: sectionForm.unlock_at || null,
        });
        toast.success("Module updated.");
      } else {
        await adminCourseBuilderService.createSection({
          course_id: sectionForm.course_id,
          title: sectionForm.title.trim(),
          order: Number(sectionForm.order || 0) || undefined,
          unlock_at: sectionForm.unlock_at || null,
        });
        toast.success("Module created.");
      }
      setSectionForm(null);
      await reloadSelected();
    } catch (error) {
      toast.error(firstError(error, "Module save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  const saveLesson = async () => {
    if (!lessonForm?.title.trim()) return toast.error("Lesson title is required.");
    setSaving(true);
    try {
      const payload = {
        title: lessonForm.title.trim(),
        type: lessonForm.type,
        video_url: lessonForm.video_url.trim() || null,
        content: lessonForm.content.trim() || null,
        live_link: lessonForm.live_link.trim() || null,
        live_start_time: lessonForm.live_start_time || null,
        duration: Number(lessonForm.duration || 0),
        is_free: lessonForm.is_free,
        order: Number(lessonForm.order || 0) || undefined,
      };
      if (lessonForm.id) {
        await adminCourseBuilderService.updateLesson(lessonForm.id, payload);
        toast.success("Lesson updated.");
      } else {
        await adminCourseBuilderService.createLesson({ ...payload, section_id: lessonForm.section_id });
        toast.success("Lesson created.");
      }
      setLessonForm(null);
      await reloadSelected();
    } catch (error) {
      toast.error(firstError(error, "Lesson save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  const saveResource = async () => {
    if (!resourceForm?.title.trim() || !resourceForm.url.trim()) return toast.error("Resource title and URL are required.");
    setSaving(true);
    try {
      const payload = {
        lesson_id: resourceForm.lesson_id,
        title: resourceForm.title.trim(),
        url: resourceForm.url.trim(),
        type: resourceForm.type,
        file_size: resourceForm.file_size.trim() || null,
        order: Number(resourceForm.order || 0),
        is_active: resourceForm.is_active,
      };
      if (resourceForm.id) {
        await adminCourseBuilderService.updateResource(resourceForm.id, payload);
        toast.success("Resource updated.");
      } else {
        await adminCourseBuilderService.createResource(payload);
        toast.success("Resource created.");
      }
      setResourceForm(null);
      await reloadSelected();
    } catch (error) {
      toast.error(firstError(error, "Resource save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "course") await adminCourseBuilderService.removeCourse(deleteTarget.id);
      if (deleteTarget.type === "section") await adminCourseBuilderService.removeSection(deleteTarget.id);
      if (deleteTarget.type === "lesson") await adminCourseBuilderService.removeLesson(deleteTarget.id);
      if (deleteTarget.type === "resource") await adminCourseBuilderService.removeResource(deleteTarget.id);
      toast.success("Deleted successfully.");
      setDeleteTarget(null);
      if (deleteTarget.type === "course") {
        setSelected(null);
        setCourseForm(emptyCourse);
      }
      await loadCourses();
      if (selected && deleteTarget.type !== "course") await selectCourse(selected.id);
    } catch (error) {
      toast.error(firstError(error, "Delete hoyni."));
    }
  };

  const startNewCourse = () => {
    setSelected(null);
    setCourseForm({
      ...emptyCourse,
      instructor_id: isInstructor && auth.userId ? String(auth.userId) : "",
    });
    setActiveTab("details");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="border-b border-zinc-800 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">Courses</h1>
              <p className="mt-1 text-xs text-zinc-500">Single-page course builder</p>
            </div>
            <Button size="sm" onClick={startNewCourse}>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(query.trim());
            }}
            className="flex gap-2"
          >
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." className="border-zinc-700 bg-zinc-950 text-white" />
            <Button type="submit" variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="admin-scrollbar max-h-[calc(100vh-260px)] overflow-y-auto p-2">
          {loading && courses.length === 0 ? (
            <div className="p-8 text-center text-zinc-500"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">No courses found.</div>
          ) : (
            courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => void selectCourse(course.id)}
                className={`mb-2 w-full rounded-lg border p-3 text-left transition ${
                  selected?.id === course.id ? "border-primary/40 bg-primary/10" : "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900"
                }`}
              >
                <div className="line-clamp-2 text-sm font-semibold text-white">{course.title}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>{course.category?.name || "No category"}</span>
                  <span className="capitalize">{course.status}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mb-5 flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">{editingCourse ? courseForm.title : "Create Course"}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Manage course info, SEO, modules, lessons, videos, and Drive resources from one page.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Modules" value={selectedStats.sections} />
            <MiniStat label="Lessons" value={selectedStats.lessons} />
            <MiniStat label="Resources" value={selectedStats.resources} />
          </div>
        </div>

        <div className="mb-5 flex gap-2">
          <TabButton active={activeTab === "details"} onClick={() => setActiveTab("details")} icon={<FileText className="h-4 w-4" />} label="Details" />
          <TabButton active={activeTab === "curriculum"} onClick={() => setActiveTab("curriculum")} icon={<FolderOpen className="h-4 w-4" />} label="Curriculum" disabled={!selected} />
          <Button type="button" variant="outline" onClick={() => void loadCourses()} className="ml-auto border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {activeTab === "details" ? (
          <form onSubmit={handleCourseSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Title"><Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
              <Field label="Category">
                <select value={courseForm.category_id} onChange={(e) => setCourseForm({ ...courseForm, category_id: e.target.value })} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white">
                  <option value="">Select category</option>
                  {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </Field>
              <Field label="Instructor">
                {canManageInstructor ? (
                  <select value={courseForm.instructor_id} onChange={(e) => setCourseForm({ ...courseForm, instructor_id: e.target.value })} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white">
                    <option value="">Select instructor</option>
                    {instructors.map((item) => <option key={item.id} value={item.id}>{item.name || item.email}</option>)}
                  </select>
                ) : (
                  <div
                    aria-disabled="true"
                    className="pointer-events-none select-none rounded-md border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-500"
                  >
                    {editingCourse ? currentInstructorLabel : "You will be assigned as the instructor automatically."}
                  </div>
                )}
              </Field>
              <Field label="Status">
                <select value={courseForm.status} onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value as CourseForm["status"] })} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white">
                  <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
                </select>
              </Field>
              <Field label="Type">
                <select value={courseForm.type} onChange={(e) => setCourseForm({ ...courseForm, type: e.target.value as CourseForm["type"] })} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white">
                  <option value="self_paced">Self paced</option><option value="batch">Batch</option><option value="free">Free</option>
                </select>
              </Field>
              <Field label="Level">
                <select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value as CourseForm["level"] })} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white">
                  <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                </select>
              </Field>
              <Field label="Price"><Input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
              <Field label="Discount price"><Input type="number" value={courseForm.discount_price} onChange={(e) => setCourseForm({ ...courseForm, discount_price: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
              <Field label="Thumbnail">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                    {courseForm.thumbnail ? (
                      <img
                        src={imageUrl(courseForm.thumbnail)}
                        alt="Course thumbnail preview"
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="grid aspect-video place-items-center text-xs text-zinc-500">
                        No thumbnail uploaded
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-xs text-zinc-500">
                      {courseForm.thumbnail || "Upload JPG, PNG, or WEBP"}
                    </p>
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={uploadingThumbnail}
                      className="inline-flex shrink-0 items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {uploadingThumbnail ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                      Upload
                    </button>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                    />
                  </div>
                </div>
              </Field>
              <Field label="YouTube intro video ID/URL"><Input value={courseForm.intro_video} onChange={(e) => setCourseForm({ ...courseForm, intro_video: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
              <Field label="Language"><Input value={courseForm.language} onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
              <div className="flex items-center gap-2 pt-7">
                <input id="featured-course" type="checkbox" checked={courseForm.is_featured} onChange={(e) => setCourseForm({ ...courseForm, is_featured: e.target.checked })} />
                <Label htmlFor="featured-course" className="text-zinc-300">Featured on website</Label>
              </div>
              <Field label="Description"><Textarea value={courseForm.description} onChange={(value) => setCourseForm({ ...courseForm, description: value })} /></Field>
              <Field label="Learning outcomes, one per line"><Textarea value={courseForm.learning_outcomes} onChange={(value) => setCourseForm({ ...courseForm, learning_outcomes: value })} /></Field>
              <Field label="Prerequisites, one per line"><Textarea value={courseForm.prerequisites} onChange={(value) => setCourseForm({ ...courseForm, prerequisites: value })} /></Field>
              <Field label="Tags, one per line"><Textarea value={courseForm.tags} onChange={(value) => setCourseForm({ ...courseForm, tags: value })} /></Field>
              <Field label="SEO title"><Input value={courseForm.meta_title} onChange={(e) => setCourseForm({ ...courseForm, meta_title: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
              <Field label="SEO description"><Textarea value={courseForm.meta_description} onChange={(value) => setCourseForm({ ...courseForm, meta_description: value })} /></Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              {editingCourse && canDelete && (
                <Button type="button" variant="outline" onClick={() => courseForm.id && setDeleteTarget({ type: "course", id: courseForm.id, label: courseForm.title })} className="border-rose-500/40 bg-transparent text-rose-300 hover:bg-rose-500/10">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </form>
        ) : selected ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setSectionForm({ course_id: selected.id, title: "", order: "", unlock_at: "" })}>
                <Plus className="mr-2 h-4 w-4" /> Add Module
              </Button>
            </div>
            {sectionForm && <SectionEditor form={sectionForm} setForm={setSectionForm} onSave={saveSection} saving={saving} />}
            {lessonForm && <LessonEditor form={lessonForm} setForm={setLessonForm} onSave={saveLesson} saving={saving} />}
            {resourceForm && <ResourceEditor form={resourceForm} setForm={setResourceForm} onSave={saveResource} saving={saving} />}

            {(selected.sections || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">No modules yet. Add your first module.</div>
            ) : (
              selected.sections?.map((section) => (
                <div key={section.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{section.order}. {section.title}</h3>
                      <p className="text-xs text-zinc-500">{section.lessons?.length || 0} lessons</p>
                    </div>
                    <div className="flex gap-2">
                      <IconButton icon={<Plus className="h-4 w-4" />} label="Add lesson" onClick={() => setLessonForm({ section_id: section.id, title: "", type: "video", video_url: "", content: "", live_link: "", live_start_time: "", duration: "", is_free: false, order: "" })} />
                      <IconButton icon={<Edit3 className="h-4 w-4" />} label="Edit module" onClick={() => setSectionForm({ id: section.id, course_id: section.course_id, title: section.title, order: String(section.order), unlock_at: toDateInput(section.unlock_at) })} />
                      {canDelete && <IconButton danger icon={<Trash2 className="h-4 w-4" />} label="Delete module" onClick={() => setDeleteTarget({ type: "section", id: section.id, label: section.title })} />}
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(section.lessons || []).map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        canDelete={canDelete}
                        onEdit={() => setLessonForm({ id: lesson.id, section_id: lesson.section_id, title: lesson.title, type: lesson.type as LessonForm["type"], video_url: lesson.video_url || "", content: lesson.content || "", live_link: lesson.live_link || "", live_start_time: toDateInput(lesson.live_start_time), duration: String(lesson.duration || ""), is_free: Boolean(lesson.is_free), order: String(lesson.order || "") })}
                        onDelete={() => setDeleteTarget({ type: "lesson", id: lesson.id, label: lesson.title })}
                        onResource={() => setResourceForm({ lesson_id: lesson.id, title: "", url: "", type: "google_drive", file_size: "", order: "", is_active: true })}
                        onEditResource={(resource) => setResourceForm({ id: resource.id, lesson_id: resource.lesson_id, title: resource.title, url: resource.url, type: resource.type, file_size: resource.file_size || "", order: String(resource.order || ""), is_active: Boolean(resource.is_active) })}
                        onDeleteResource={(resource) => setDeleteTarget({ type: "resource", id: resource.id, label: resource.title })}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </main>

      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.type || "item"}?`}
        description="This action cannot be undone. Courses with enrollments and modules with lessons may be blocked by the backend."
        itemName={deleteTarget?.label}
        confirmLabel="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-zinc-300">{label}</Label><div className="mt-1">{children}</div></div>;
}

function Textarea({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary" />;
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2"><div className="text-lg font-semibold text-white">{value}</div><div className="text-[10px] text-zinc-500">{label}</div></div>;
}

function TabButton({ active, icon, label, disabled, onClick }: { active: boolean; icon: React.ReactNode; label: string; disabled?: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-primary text-primary-foreground" : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}>{icon}{label}</button>;
}

function IconButton({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return <button type="button" aria-label={label} onClick={onClick} className={`grid h-8 w-8 place-items-center rounded-md border border-zinc-700 transition ${danger ? "text-rose-300 hover:bg-rose-500/10" : "text-zinc-300 hover:bg-zinc-800"}`}>{icon}</button>;
}

function SectionEditor({ form, setForm, onSave, saving }: { form: SectionForm; setForm: (form: SectionForm | null) => void; onSave: () => void; saving: boolean }) {
  return <EditorShell title={form.id ? "Edit module" : "Add module"} onClose={() => setForm(null)} onSave={onSave} saving={saving}>
    <Field label="Module title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <Field label="Order"><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <Field label="Unlock at"><Input type="datetime-local" value={form.unlock_at} onChange={(e) => setForm({ ...form, unlock_at: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
  </EditorShell>;
}

function LessonEditor({ form, setForm, onSave, saving }: { form: LessonForm; setForm: (form: LessonForm | null) => void; onSave: () => void; saving: boolean }) {
  return <EditorShell title={form.id ? "Edit lesson" : "Add lesson"} onClose={() => setForm(null)} onSave={onSave} saving={saving}>
    <Field label="Lesson title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <Field label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LessonForm["type"] })} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"><option value="video">Video</option><option value="pdf">PDF</option><option value="quiz">Quiz</option><option value="live_session">Live session</option></select></Field>
    <Field label="YouTube video ID/URL"><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <Field label="Duration seconds"><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <Field label="Order"><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <Field label="Live link"><Input value={form.live_link} onChange={(e) => setForm({ ...form, live_link: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <Field label="Live start"><Input type="datetime-local" value={form.live_start_time} onChange={(e) => setForm({ ...form, live_start_time: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <div className="flex items-center gap-2 pt-7"><input id="lesson-free" type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} /><Label htmlFor="lesson-free" className="text-zinc-300">Free preview</Label></div>
    <div className="lg:col-span-2"><Field label="Content / class note"><Textarea value={form.content} onChange={(value) => setForm({ ...form, content: value })} /></Field></div>
  </EditorShell>;
}

function ResourceEditor({ form, setForm, onSave, saving }: { form: ResourceForm; setForm: (form: ResourceForm | null) => void; onSave: () => void; saving: boolean }) {
  return <EditorShell title={form.id ? "Edit resource" : "Add resource"} onClose={() => setForm(null)} onSave={onSave} saving={saving}>
    <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <Field label="Drive/resource URL"><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <Field label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ResourceForm["type"] })} className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"><option value="google_drive">Google Drive</option><option value="pdf">PDF</option><option value="doc">Doc</option><option value="sheet">Sheet</option><option value="slide">Slide</option><option value="zip">Zip</option><option value="link">Link</option></select></Field>
    <Field label="File size"><Input value={form.file_size} onChange={(e) => setForm({ ...form, file_size: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <Field label="Order"><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="border-zinc-700 bg-zinc-950 text-white" /></Field>
    <div className="flex items-center gap-2 pt-7"><input id="resource-active" type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /><Label htmlFor="resource-active" className="text-zinc-300">Active</Label></div>
  </EditorShell>;
}

function EditorShell({ title, children, saving, onClose, onSave }: { title: string; children: React.ReactNode; saving: boolean; onClose: () => void; onSave: () => void }) {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
    <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-white">{title}</h3><button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button></div>
    <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    <div className="mt-4 flex justify-end"><Button onClick={onSave} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button></div>
  </div>;
}

function LessonCard({ lesson, canDelete, onEdit, onDelete, onResource, onEditResource, onDeleteResource }: { lesson: AdminLesson; canDelete: boolean; onEdit: () => void; onDelete: () => void; onResource: () => void; onEditResource: (resource: AdminLessonResource) => void; onDeleteResource: (resource: AdminLessonResource) => void }) {
  return <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><p className="truncate text-sm font-semibold text-white">{lesson.order}. {lesson.title}</p></div><p className="mt-1 text-xs text-zinc-500">{lesson.type.replace("_", " ")} · {lesson.duration || 0}s {lesson.is_free ? "· Free preview" : ""}</p></div>
      <div className="flex gap-2"><IconButton icon={<Plus className="h-4 w-4" />} label="Add resource" onClick={onResource} /><IconButton icon={<Edit3 className="h-4 w-4" />} label="Edit lesson" onClick={onEdit} />{canDelete && <IconButton danger icon={<Trash2 className="h-4 w-4" />} label="Delete lesson" onClick={onDelete} />}</div>
    </div>
    {(lesson.resources || []).length > 0 && <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">{lesson.resources?.map((resource) => <div key={resource.id} className="flex items-center justify-between gap-3 rounded-md bg-zinc-900 px-3 py-2 text-xs"><a href={resource.url} target="_blank" rel="noreferrer" className="truncate text-zinc-300 hover:text-primary">{resource.title}</a><div className="flex gap-2"><button onClick={() => onEditResource(resource)} className="text-zinc-500 hover:text-white">Edit</button>{canDelete && <button onClick={() => onDeleteResource(resource)} className="text-rose-400 hover:text-rose-300">Delete</button>}</div></div>)}</div>}
  </div>;
}
