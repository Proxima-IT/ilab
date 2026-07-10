import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bold, Heading1, Heading2, ImagePlus, Italic, Link as LinkIcon, List, Loader2, Pencil, Plus, Quote, Table2, Trash2, Type, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminDeleteModal } from "@/components/admin/AdminDeleteModal";
import { imageUrl } from "@/services/course-catalog.service";
import { renderBlogContent } from "@/lib/blog-bbcode";

type AdminBlogPost = {
  id: number;
  category_id?: number | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  author_name: string | null;
  author_avatar: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
  category?: {
    name?: string | null;
  } | null;
};

type BlogResponse = {
  success: boolean;
  data: {
    data: AdminBlogPost[];
  };
};

type UploadResponse = {
  success: boolean;
  data: {
    cover_url: string;
  };
};

type BlogCategory = {
  id: number;
  name: string;
  slug: string;
};

type CategoryResponse = {
  success: boolean;
  data: {
    data: BlogCategory[];
  };
};

type BlogForm = {
  category_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  meta_title: string;
  meta_description: string;
  published_at: string;
  is_published: boolean;
};

const emptyForm: BlogForm = {
  category_id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_url: "",
  meta_title: "",
  meta_description: "",
  published_at: "",
  is_published: false,
};

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

function postToForm(post: AdminBlogPost): BlogForm {
  return {
    category_id: post.category_id ? String(post.category_id) : "",
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    content: post.content || "",
    cover_url: post.cover_url || "",
    meta_title: post.meta_title || "",
    meta_description: post.meta_description || "",
    published_at: toDatetimeLocal(post.published_at),
    is_published: post.is_published,
  };
}

function toPayload(form: BlogForm) {
  return {
    category_id: form.category_id ? Number(form.category_id) : null,
    title: form.title,
    slug: form.slug || undefined,
    excerpt: form.excerpt || null,
    content: form.content,
    cover_url: form.cover_url || null,
    meta_title: form.meta_title || null,
    meta_description: form.meta_description || null,
    published_at: form.published_at || null,
    is_published: form.is_published,
  };
}

const contentSnippets = [
  {
    label: "Heading",
    icon: Heading1,
    value: "[h1]Main section heading[/h1]",
  },
  {
    label: "Sub heading",
    icon: Heading2,
    value: "[h2]Sub heading[/h2]",
  },
  {
    label: "Big text",
    icon: Type,
    value: "[big]Important sentence or introduction text.[/big]",
  },
  {
    label: "List",
    icon: List,
    value: "[ul]\n[li]First point[/li]\n[li]Second point[/li]\n[li]Third point[/li]\n[/ul]",
  },
  {
    label: "Table",
    icon: Table2,
    value: "[table]\n[tr][th]Topic[/th][th]Details[/th][/tr]\n[tr][td]Example[/td][td]Write details here[/td][/tr]\n[/table]",
  },
  {
    label: "Quote",
    icon: Quote,
    value: "[quote]Write an important quote or note here.[/quote]",
  },
  {
    label: "Bold",
    icon: Bold,
    value: "[b]bold text[/b]",
  },
  {
    label: "Italic",
    icon: Italic,
    value: "[i]italic text[/i]",
  },
  {
    label: "Link",
    icon: LinkIcon,
    value: "[link=https://example.com]Link text[/link]",
  },
];

export default function AdminBlog() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<BlogForm>(emptyForm);

  const loadPosts = async () => {
    setLoading(true);

    try {
      const response = await api.get<BlogResponse>("/admin/blog-posts", {
        params: {
          search: search || undefined,
          per_page: 50,
        },
      });

      setPosts(response.data.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load blog posts.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get<CategoryResponse>("/admin/categories", {
        params: {
          type: "blog",
          per_page: 100,
        },
      });

      setCategories(response.data.data.data);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPosts();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (post: AdminBlogPost) => {
    setEditing(post);
    setForm(postToForm(post));
    setOpen(true);
  };

  const savePost = async () => {
    setSaving(true);

    try {
      if (editing) {
        await api.put(`/admin/blog-posts/${editing.id}`, toPayload(form));
        toast.success("Blog post updated.");
      } else {
        await api.post("/admin/blog-posts", toPayload(form));
        toast.success("Blog post created.");
      }

      setOpen(false);
      await loadPosts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save blog post.");
    } finally {
      setSaving(false);
    }
  };

  const uploadCover = async (file?: File) => {
    if (!file) return;

    const data = new FormData();
    data.append("cover", file);

    setUploadingCover(true);

    try {
      const response = await api.post<UploadResponse>("/admin/blog-posts/cover", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      updateField("cover_url", response.data.data.cover_url);
      toast.success("Blog thumbnail uploaded.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not upload thumbnail.");
    } finally {
      setUploadingCover(false);
    }
  };

  const deletePost = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await api.delete(`/admin/blog-posts/${deleteTarget.id}`);
      toast.success("Blog post deleted.");
      setDeleteTarget(null);
      await loadPosts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete blog post.");
    } finally {
      setDeleting(false);
    }
  };

  const updateField = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const insertContentSnippet = (snippet: string) => {
    setForm((current) => ({
      ...current,
      content: current.content.trim()
        ? `${current.content.trim()}\n\n${snippet}`
        : snippet,
    }));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Blog Posts</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Articles published on the public blog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-56 border-zinc-700 bg-zinc-900 text-white"
          />
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No blog posts yet.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-zinc-900/60">
                  <td className="px-4 py-3 text-zinc-100">
                    <div className="font-medium">{post.title}</div>
                    <div className="text-xs text-zinc-500">{post.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{post.category?.name || "Blog"}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${post.is_published ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-700/40 text-zinc-300"}`}>
                      {post.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={() => openEdit(post)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-300 hover:bg-red-950/40 hover:text-red-200" onClick={() => setDeleteTarget(post)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editing ? "Edit blog post" : "Create blog post"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Title" value={form.title} onChange={(event) => updateField("title", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input placeholder="Slug (optional)" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <select
                value={form.category_id}
                onChange={(event) => updateField("category_id", event.target.value)}
                className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
              >
                <option value="">Select blog category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input type="datetime-local" value={form.published_at} onChange={(event) => updateField("published_at", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <div className="md:col-span-2">
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                  {form.cover_url ? (
                    <img src={imageUrl(form.cover_url)} alt={form.title || "Blog thumbnail"} className="h-52 w-full object-cover" />
                  ) : (
                    <div className="grid h-52 place-items-center text-sm text-zinc-500">No thumbnail uploaded</div>
                  )}
                </div>
                <label className="mt-3 inline-flex cursor-pointer items-center rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-900">
                  {uploadingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                  Upload thumbnail
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingCover}
                    onChange={(event) => void uploadCover(event.target.files?.[0])}
                  />
                </label>
              </div>
              <Textarea placeholder="Excerpt" value={form.excerpt} onChange={(event) => updateField("excerpt", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white md:col-span-2" />
              <div className="md:col-span-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {contentSnippets.map((snippet) => {
                      const Icon = snippet.icon;

                      return (
                        <button
                          key={snippet.label}
                          type="button"
                          onClick={() => insertContentSnippet(snippet.value)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-primary hover:text-white"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {snippet.label}
                        </button>
                      );
                    })}
                  </div>
                  <Textarea
                    placeholder={"Content. Use blank lines between paragraphs.\n\nExample:\n[h1]Heading[/h1]\n\n[big]Important text[/big]\n\n[ul]\n[li]Point one[/li]\n[li]Point two[/li]\n[/ul]"}
                    value={form.content}
                    onChange={(event) => updateField("content", event.target.value)}
                    className="min-h-64 border-zinc-700 bg-zinc-950 font-mono text-sm text-white"
                  />
                  <div className="mt-3 grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400 sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-zinc-200">Simple format</p>
                      <p className="mt-1">Use buttons above. Keep one blank line between each block.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-200">Inline format</p>
                      <p className="mt-1">Use [b]bold[/b], [i]italic[/i], or [link=https://example.com]link[/link].</p>
                    </div>
                  </div>
                </div>
                {form.content.trim() && (
                  <div className="mt-4 rounded-xl border border-zinc-800 bg-white p-5 text-slate-900">
                    <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Preview</p>
                    <div className="space-y-5">
                      {renderBlogContent(form.content)}
                    </div>
                  </div>
                )}
              </div>
              <Input placeholder="SEO title" value={form.meta_title} onChange={(event) => updateField("meta_title", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white md:col-span-2" />
              <Textarea placeholder="SEO description" value={form.meta_description} onChange={(event) => updateField("meta_description", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white md:col-span-2" />
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input type="checkbox" checked={form.is_published} onChange={(event) => updateField("is_published", event.target.checked)} />
                Published
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={savePost} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete blog post?"
        description="This blog post will be removed from the admin panel and public blog. This action cannot be undone."
        itemName={deleteTarget?.title}
        loading={deleting}
        confirmLabel="Delete Post"
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={() => void deletePost()}
      />
    </div>
  );
}
