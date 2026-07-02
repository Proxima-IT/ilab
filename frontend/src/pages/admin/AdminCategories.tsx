import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Edit3, Loader2, Plus, RefreshCw, Save, Search, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminDeleteModal } from "@/components/admin/AdminDeleteModal";
import { imageUrl } from "@/services/course-catalog.service";
import {
  adminCategoryService,
  type AdminCategory,
  type CategoryPayload,
} from "@/services/admin/category.service";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";

type CategoryForm = {
  id?: number;
  name: string;
  type: "course" | "blog";
  description: string;
  icon: string;
  image: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: CategoryForm = {
  name: "",
  type: "course",
  description: "",
  icon: "",
  image: "",
  sort_order: "0",
  is_active: true,
};

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

function toForm(category: AdminCategory): CategoryForm {
  return {
    id: category.id,
    name: category.name || "",
    type: category.type || "course",
    description: category.description || "",
    icon: category.icon || "",
    image: category.image || "",
    sort_order: String(category.sort_order || 0),
    is_active: category.is_active !== false,
  };
}

function toPayload(form: CategoryForm): CategoryPayload {
  return {
    name: form.name.trim(),
    type: form.type,
    description: form.description.trim() || null,
    icon: form.icon.trim() || null,
    image: form.image.trim() || null,
    sort_order: Number(form.sort_order || 0),
    is_active: form.is_active,
  };
}

export default function AdminCategories() {
  const auth = useAdminAuth();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const canManage = Boolean(auth.role && ["super_admin", "admin", "manager"].includes(auth.role));
  const canDelete = auth.role === "super_admin" || auth.role === "admin";
  const editing = Boolean(form.id);

  const loadCategories = async () => {
    setLoading(true);

    try {
      const data = await adminCategoryService.list(search, type);
      setCategories(data.data);
    } catch (error) {
      toast.error(firstError(error, "Categories load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      void loadCategories();
    } else {
      setLoading(false);
    }
  }, [canManage, search, type]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (category: AdminCategory) => {
    setForm(toForm(category));
    setFormOpen(true);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(query.trim());
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploading(true);

    try {
      const image = await adminCategoryService.uploadImage(file, form.image);
      setForm((current) => ({ ...current, image }));
      toast.success("Category image uploaded.");
    } catch (error) {
      toast.error(firstError(error, "Category image upload hoyni."));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setSaving(true);

    try {
      const payload = toPayload(form);

      if (editing && form.id) {
        await adminCategoryService.update(form.id, payload);
        toast.success("Category updated.");
      } else {
        await adminCategoryService.create(payload);
        toast.success("Category created.");
      }

      setFormOpen(false);
      setForm(emptyForm);
      await loadCategories();
    } catch (error) {
      toast.error(firstError(error, "Category save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await adminCategoryService.remove(deleteTarget.id);
      toast.success("Category deleted.");
      setDeleteTarget(null);
      await loadCategories();
    } catch (error) {
      toast.error(firstError(error, "Category delete hoyni."));
    } finally {
      setDeletingId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Access restricted</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Categories can only be managed by Super Admin, Admin, and Manager accounts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Categories</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage course categories, images, icons, and public ordering.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search categories..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border-zinc-700 bg-zinc-900 text-white sm:w-72"
            />
            <Button type="submit" variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <Button type="button" variant="outline" onClick={() => void loadCategories()} className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
        >
          <option value="">All types</option>
          <option value="course">Course</option>
          <option value="blog">Blog</option>
        </select>
      </div>

      {formOpen && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {editing ? "Edit category" : "Add category"}
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
            <Field label="Name">
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-white" />
            </Field>

            <Field label="Type">
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as CategoryForm["type"] }))}
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-primary"
              >
                <option value="course">Course</option>
                <option value="blog">Blog</option>
              </select>
            </Field>

            <Field label="Icon name">
              <Input value={form.icon} onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))} placeholder="BookOpen" className="border-zinc-700 bg-zinc-950 text-white" />
            </Field>

            <Field label="Sort order">
              <Input type="number" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-white" />
            </Field>

            <Field label="Image">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                  {form.image ? (
                    <img src={imageUrl(form.image)} alt="Category preview" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="grid aspect-video place-items-center text-xs text-zinc-500">
                      No image uploaded
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-xs text-zinc-500">
                    {form.image || "Upload JPG, PNG, or WEBP"}
                  </p>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    Upload
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </Field>

            <div>
              <Label className="text-zinc-300">Description</Label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={5}
                className="mt-1 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 lg:col-span-2">
              <input
                id="category-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                className="h-4 w-4 rounded border-zinc-700"
              />
              <Label htmlFor="category-active" className="text-zinc-300">
                Active
              </Label>
            </div>

            <div className="flex justify-end gap-2 lg:col-span-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editing ? "Update Category" : "Create Category"}
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
        ) : categories.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500 md:col-span-2 xl:col-span-3">
            No categories found.
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div className="aspect-video bg-zinc-950">
                {category.image ? (
                  <img src={imageUrl(category.image)} alt={category.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-zinc-600">
                    <Tag className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">{category.name}</h3>
                    <p className="mt-1 truncate text-xs text-zinc-500">{category.slug}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] ${category.is_active === false ? "bg-zinc-700 text-zinc-300" : "bg-emerald-500/10 text-emerald-300"}`}>
                    {category.is_active === false ? "Inactive" : "Active"}
                  </span>
                </div>
                {category.description && (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">{category.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                  <span>{category.type} · Order {category.sort_order || 0}</span>
                  <span>
                    {category.type === "blog"
                      ? `${category.blog_posts_count || 0} blogs`
                      : `${category.courses_count || 0} courses`}
                  </span>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
                      disabled={deletingId === category.id}
                      className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
                    >
                      {deletingId === category.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete category?"
        description="Categories that contain courses cannot be deleted. Move or reassign courses first."
        itemName={deleteTarget?.name}
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
        confirmLabel="Delete Category"
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-zinc-300">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
