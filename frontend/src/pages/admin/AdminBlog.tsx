import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AdminBlogPost = {
  id: number;
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

type BlogForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  author_name: string;
  author_avatar: string;
  meta_title: string;
  meta_description: string;
  published_at: string;
  is_published: boolean;
};

const emptyForm: BlogForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_url: "",
  author_name: "",
  author_avatar: "",
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
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    content: post.content || "",
    cover_url: post.cover_url || "",
    author_name: post.author_name || "",
    author_avatar: post.author_avatar || "",
    meta_title: post.meta_title || "",
    meta_description: post.meta_description || "",
    published_at: toDatetimeLocal(post.published_at),
    is_published: post.is_published,
  };
}

function toPayload(form: BlogForm) {
  return {
    title: form.title,
    slug: form.slug || undefined,
    excerpt: form.excerpt || null,
    content: form.content,
    cover_url: form.cover_url || null,
    author_name: form.author_name || null,
    author_avatar: form.author_avatar || null,
    meta_title: form.meta_title || null,
    meta_description: form.meta_description || null,
    published_at: form.published_at || null,
    is_published: form.is_published,
  };
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBlogPost | null>(null);
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

  const deletePost = async (post: AdminBlogPost) => {
    if (!confirm(`Delete "${post.title}"?`)) return;

    try {
      await api.delete(`/admin/blog-posts/${post.id}`);
      toast.success("Blog post deleted.");
      await loadPosts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete blog post.");
    }
  };

  const updateField = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
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
                      <Button size="sm" variant="ghost" className="text-red-300 hover:bg-red-950/40 hover:text-red-200" onClick={() => deletePost(post)}>
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
                Close
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Title" value={form.title} onChange={(event) => updateField("title", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input placeholder="Slug (optional)" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input placeholder="Author name" value={form.author_name} onChange={(event) => updateField("author_name", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input type="datetime-local" value={form.published_at} onChange={(event) => updateField("published_at", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input placeholder="Cover image URL or storage path" value={form.cover_url} onChange={(event) => updateField("cover_url", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white md:col-span-2" />
              <Input placeholder="Author avatar URL or storage path" value={form.author_avatar} onChange={(event) => updateField("author_avatar", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white md:col-span-2" />
              <Textarea placeholder="Excerpt" value={form.excerpt} onChange={(event) => updateField("excerpt", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white md:col-span-2" />
              <Textarea placeholder="Content. Use blank lines between paragraphs." value={form.content} onChange={(event) => updateField("content", event.target.value)} className="min-h-44 border-zinc-700 bg-zinc-900 text-white md:col-span-2" />
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
    </div>
  );
}
