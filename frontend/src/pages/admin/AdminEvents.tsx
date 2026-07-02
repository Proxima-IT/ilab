import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminDeleteModal } from "@/components/admin/AdminDeleteModal";
import { imageUrl } from "@/services/course-catalog.service";

type AdminEvent = {
  id: number;
  title: string;
  slug: string;
  event_type: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  seats: number | null;
  cover_url: string | null;
  description: string;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  registrations_count?: number;
};

type EventsResponse = {
  success: boolean;
  data: {
    data: AdminEvent[];
  };
  message: string;
};

type UploadResponse = {
  success: boolean;
  data: {
    cover_url: string;
  };
};

type EventForm = {
  title: string;
  slug: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  location: string;
  seats: string;
  cover_url: string;
  description: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
};

const emptyForm: EventForm = {
  title: "",
  slug: "",
  event_type: "",
  starts_at: "",
  ends_at: "",
  location: "",
  seats: "",
  cover_url: "",
  description: "",
  meta_title: "",
  meta_description: "",
  is_published: false,
};

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

function eventToForm(event: AdminEvent): EventForm {
  return {
    title: event.title,
    slug: event.slug,
    event_type: event.event_type || "",
    starts_at: toDatetimeLocal(event.starts_at),
    ends_at: toDatetimeLocal(event.ends_at),
    location: event.location || "",
    seats: event.seats ? String(event.seats) : "",
    cover_url: event.cover_url || "",
    description: event.description,
    meta_title: event.meta_title || "",
    meta_description: event.meta_description || "",
    is_published: event.is_published,
  };
}

function toPayload(form: EventForm) {
  return {
    title: form.title,
    slug: form.slug || undefined,
    event_type: form.event_type || null,
    starts_at: form.starts_at,
    ends_at: form.ends_at || null,
    location: form.location || null,
    seats: form.seats ? Number(form.seats) : null,
    cover_url: form.cover_url || null,
    description: form.description,
    meta_title: form.meta_title || null,
    meta_description: form.meta_description || null,
    is_published: form.is_published,
  };
}

export default function AdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm);

  const loadEvents = async () => {
    setLoading(true);

    try {
      const response = await api.get<EventsResponse>("/admin/events", {
        params: { search: search || undefined, per_page: 50 },
      });

      setEvents(response.data.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadEvents();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (event: AdminEvent) => {
    setEditing(event);
    setForm(eventToForm(event));
    setOpen(true);
  };

  const saveEvent = async () => {
    setSaving(true);

    try {
      if (editing) {
        await api.put(`/admin/events/${editing.id}`, toPayload(form));
        toast.success("Event updated.");
      } else {
        await api.post("/admin/events", toPayload(form));
        toast.success("Event created.");
      }

      setOpen(false);
      await loadEvents();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save event.");
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
      const response = await api.post<UploadResponse>("/admin/events/cover", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      updateField("cover_url", response.data.data.cover_url);
      toast.success("Event thumbnail uploaded.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not upload thumbnail.");
    } finally {
      setUploadingCover(false);
    }
  };

  const deleteEvent = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await api.delete(`/admin/events/${deleteTarget.id}`);
      toast.success("Event deleted.");
      setDeleteTarget(null);
      await loadEvents();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete event.");
    } finally {
      setDeleting(false);
    }
  };

  const updateField = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Events</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Workshops, webinars, event schedules, and registration content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search events..."
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
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Starts</th>
              <th className="px-4 py-3 font-medium">Registrations</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  No events yet.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-zinc-900/60">
                  <td className="px-4 py-3 text-zinc-100">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs text-zinc-500">{event.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{event.event_type || "Event"}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {new Date(event.starts_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{event.registrations_count || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${event.is_published ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-700/40 text-zinc-300"}`}>
                      {event.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={() => openEdit(event)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-300 hover:bg-red-950/40 hover:text-red-200" onClick={() => setDeleteTarget(event)}>
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
                {editing ? "Edit event" : "Create event"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Title" value={form.title} onChange={(event) => updateField("title", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input placeholder="Slug (optional)" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input placeholder="Type" value={form.event_type} onChange={(event) => updateField("event_type", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input type="number" placeholder="Seats" value={form.seats} onChange={(event) => updateField("seats", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input type="datetime-local" value={form.starts_at} onChange={(event) => updateField("starts_at", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input type="datetime-local" value={form.ends_at} onChange={(event) => updateField("ends_at", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white" />
              <Input placeholder="Location" value={form.location} onChange={(event) => updateField("location", event.target.value)} className="border-zinc-700 bg-zinc-900 text-white md:col-span-2" />
              <div className="md:col-span-2">
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                  {form.cover_url ? (
                    <img src={imageUrl(form.cover_url)} alt={form.title || "Event thumbnail"} className="h-52 w-full object-cover" />
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
              <Textarea placeholder="Description" value={form.description} onChange={(event) => updateField("description", event.target.value)} className="min-h-28 border-zinc-700 bg-zinc-900 text-white md:col-span-2" />
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
              <Button onClick={saveEvent} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete event?"
        description="This event will be removed from the admin panel and public events page. This action cannot be undone."
        itemName={deleteTarget?.title}
        loading={deleting}
        confirmLabel="Delete Event"
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={() => void deleteEvent()}
      />
    </div>
  );
}
