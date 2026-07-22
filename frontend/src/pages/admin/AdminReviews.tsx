import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Camera, Edit3, Loader2, Plus, RefreshCw, Save, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminDeleteModal } from "@/components/admin/AdminDeleteModal";
import { imageUrl } from "@/services/course-catalog.service";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import {
  adminReviewService,
  type AdminReview,
  type ReviewPayload,
} from "@/services/admin/review.service";

type ReviewForm = {
  id?: number;
  student_name: string;
  student_role: string;
  learner_level: "beginner" | "intermediate" | "expert" | "";
  avatar: string;
  rating: string;
  review_text: string;
  media_type: "text" | "image" | "video";
  media_url: string;
  thumbnail: string;
  is_published: boolean;
  sort_order: string;
};

const emptyForm: ReviewForm = {
  student_name: "",
  student_role: "",
  learner_level: "",
  avatar: "",
  rating: "5",
  review_text: "",
  media_type: "text",
  media_url: "",
  thumbnail: "",
  is_published: true,
  sort_order: "0",
};

const allowedRoles = ["super_admin", "admin", "manager"];
const levelLabels: Record<Exclude<ReviewForm["learner_level"], "">, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

function resolveImage(path?: string | null, name = "Student") {
  if (!path) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F97316&color=fff`;
  }

  return imageUrl(path);
}

function toForm(review: AdminReview): ReviewForm {
  return {
    id: review.id,
    student_name: review.student_name || "",
    student_role: review.student_role || "",
    learner_level: review.learner_level || "",
    avatar: review.avatar || "",
    rating: String(review.rating || 5),
    review_text: review.review_text || "",
    media_type: review.media_type || "text",
    media_url: review.media_url || "",
    thumbnail: review.thumbnail || "",
    is_published: Boolean(review.is_published),
    sort_order: String(review.sort_order || 0),
  };
}

function toPayload(form: ReviewForm): ReviewPayload {
  const youtubeUrl = form.media_url.trim();
  const hasUploadedImage = form.media_type === "image" && Boolean(form.media_url.trim());

  return {
    student_name: form.student_name.trim(),
    student_role: form.student_role.trim() || null,
    learner_level: form.learner_level || null,
    avatar: form.avatar.trim() || null,
    rating: Math.max(1, Math.min(5, Number(form.rating || 5))),
    review_text: form.review_text.trim() || null,
    media_type: youtubeUrl ? (hasUploadedImage ? "image" : "video") : "text",
    media_url: youtubeUrl || null,
    thumbnail: null,
    is_published: form.is_published,
    sort_order: Math.max(0, Number(form.sort_order || 0)),
  };
}

export default function AdminReviews() {
  const auth = useAdminAuth();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ReviewForm>(emptyForm);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const canManage = Boolean(auth.role && allowedRoles.includes(auth.role));
  const editing = Boolean(form.id);

  const loadReviews = async (value = search) => {
    setLoading(true);

    try {
      const data = await adminReviewService.list(value);
      setReviews(data.data);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Reviews load hoyni.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      void loadReviews("");
    } else {
      setLoading(false);
    }
  }, [canManage]);

  const filteredReviews = useMemo(() => reviews, [reviews]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (review: AdminReview) => {
    setForm(toForm(review));
    setFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.student_name.trim()) {
      toast.error("Student name is required.");
      return;
    }

    setSaving(true);

    try {
      const payload = toPayload(form);

      if (editing && form.id) {
        await adminReviewService.update(form.id, payload);
        toast.success("Review updated.");
      } else {
        await adminReviewService.create(payload);
        toast.success("Review created.");
      }

      setFormOpen(false);
      setForm(emptyForm);
      await loadReviews();
    } catch (error) {
      const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
      toast.error(firstError || data?.message || "Review save hoyni.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploadingAvatar(true);

    try {
      const path = await adminReviewService.uploadAvatar(file, form.avatar);
      setForm((current) => ({ ...current, avatar: path }));
      toast.success("Review avatar uploaded.");
    } catch {
      toast.error("Avatar upload hoyni.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploadingMedia(true);

    try {
      const path = await adminReviewService.uploadMedia(
        file,
        form.media_type === "image" ? form.media_url : null
      );
      setForm((current) => ({
        ...current,
        media_type: "image",
        media_url: path,
        thumbnail: path,
      }));
      toast.success("Review image uploaded.");
    } catch {
      toast.error("Review image upload hoyni.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const requestDeleteReview = (review: AdminReview) => {
    setDeleteTarget(review);
  };

  const confirmDeleteReview = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await adminReviewService.remove(deleteTarget.id);
      toast.success("Review deleted.");
      setDeleteTarget(null);
      await loadReviews();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Review delete hoyni.";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Access restricted</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Reviews can only be managed by Super Admin, Admin, and Manager accounts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reviews</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Display, add, update, publish, and delete student reviews.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void loadReviews(search);
            }}
            className="w-full border-zinc-700 bg-zinc-900 text-white sm:w-72"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadReviews(search)}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Review
          </Button>
        </div>
      </div>

      {formOpen && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {editing ? "Edit review" : "Add review"}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
            <Field label="Student name">
              <Input value={form.student_name} onChange={(event) => setForm((current) => ({ ...current, student_name: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-white" />
            </Field>

            <Field label="Student role">
              <Input value={form.student_role} onChange={(event) => setForm((current) => ({ ...current, student_role: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-white" />
            </Field>

            <Field label="Learner level">
              <select
                value={form.learner_level}
                onChange={(event) => setForm((current) => ({ ...current, learner_level: event.target.value as ReviewForm["learner_level"] }))}
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
              >
                <option value="">No label</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </Field>

            <Field label="Avatar URL or storage path">
              <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <img
                  src={resolveImage(form.avatar, form.student_name || "Student")}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-zinc-500">
                    {form.avatar || "No avatar uploaded"}
                  </p>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="mt-2 inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                    Upload avatar
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>
            </Field>

            <Field label="Rating">
              <Input type="number" min={1} max={5} value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-white" />
            </Field>

            <Field label="Sort order">
              <Input type="number" min={0} value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-white" />
              <p className="mt-1 text-[11px] text-zinc-500">
                Same order number can be used for multiple reviews.
              </p>
            </Field>

            <div className="lg:col-span-2">
              <Label className="text-zinc-300">Review text</Label>
              <textarea
                value={form.review_text}
                onChange={(event) => setForm((current) => ({ ...current, review_text: event.target.value }))}
                rows={4}
                className="mt-1 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary"
              />
            </div>

            <Field label="YouTube review URL (optional)">
              <Input
                value={form.media_url}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    media_url: event.target.value,
                    media_type: event.target.value.trim() ? "video" : "text",
                  }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
                className="border-zinc-700 bg-zinc-950 text-white"
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Add a YouTube URL to show this review as a video on the homepage.
              </p>
            </Field>

            <Field label="Review image (optional)">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                {form.media_type === "image" && form.media_url ? (
                  <img src={resolveImage(form.media_url)} alt="" className="mb-3 aspect-video w-full rounded-md object-cover" />
                ) : (
                  <p className="mb-3 text-xs text-zinc-500">No review image uploaded.</p>
                )}
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
                >
                  {uploadingMedia ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  Upload review image
                </button>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleMediaUpload}
                />
              </div>
            </Field>

            <div className="flex items-center gap-2 lg:col-span-2">
              <input
                id="review-published"
                type="checkbox"
                checked={form.is_published}
                onChange={(event) => setForm((current) => ({ ...current, is_published: event.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700"
              />
              <Label htmlFor="review-published" className="text-zinc-300">
                Published on website
              </Label>
            </div>

            <div className="flex justify-end gap-2 lg:col-span-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editing ? "Update Review" : "Create Review"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50" />
          ))
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500 md:col-span-2 xl:col-span-3">
            No reviews found.
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-start gap-3">
                <img
                  src={resolveImage(review.avatar, review.student_name)}
                  alt={review.student_name}
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{review.student_name}</p>
                  <p className="truncate text-xs text-zinc-500">{review.student_role || "Student"}</p>
                  {review.learner_level && (
                    <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {levelLabels[review.learner_level]}
                    </span>
                  )}
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] ${review.is_published ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-700 text-zinc-300"}`}>
                  {review.is_published ? "Published" : "Draft"}
                </span>
              </div>

              {review.review_text && (
                <p className="mt-4 line-clamp-4 text-sm leading-6 text-zinc-300">{review.review_text}</p>
              )}

              {review.media_type === "video" && review.media_url && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  YouTube video review: {review.media_url}
                </div>
              )}

              {review.media_type === "image" && review.media_url && (
                <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                  <img
                    src={resolveImage(review.media_url)}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="text-xs capitalize text-zinc-500">
                  {review.media_type} · Order {review.sort_order}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(review)}
                    className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDeleteReview(review)}
                    disabled={deletingId === review.id}
                    className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
                  >
                    {deletingId === review.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete review?"
        description="This review will be removed from the admin panel and public website. This action cannot be undone."
        itemName={deleteTarget ? `Review from ${deleteTarget.student_name}` : undefined}
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        confirmLabel="Delete Review"
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDeleteReview()}
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
