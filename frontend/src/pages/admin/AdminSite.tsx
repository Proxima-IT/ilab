import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { Camera, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { imageUrl } from "@/services/course-catalog.service";
import type { WebsiteSettings } from "@/services/home.service";
import { adminWebsiteSettingsService } from "@/services/admin/website-settings.service";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";

type SectionKey = keyof WebsiteSettings;

const emptySettings: WebsiteSettings = {
  hero: {
    title_line_1: "",
    title_line_2: "",
    description: "",
    primary_button_label: "",
    primary_button_url: "",
    secondary_button_label: "",
    youtube_url: "",
    image: null,
    counts: [
      { label: "Total Students", value: "5,000+" },
      { label: "Total Videos", value: "1,200+" },
      { label: "Total Courses", value: "50+" },
      { label: "Success Rate", value: "95%" },
    ],
  },
  next_batch: {
    eyebrow: "",
    title: "",
    image: null,
    youtube_url: "",
  },
  next_batch_schedule: {
    eyebrow: "",
    title: "",
    enrollment_start_date: "",
    enrollment_end_date: "",
    course_info: "",
    demo_button_label: "",
    demo_url: "",
    course_url: "",
  },
  offers: {
    title: "",
    highlight: "",
    description: "",
    items: [],
  },
  download_app: {
    title: "",
    description: "",
    button_label_top: "",
    button_label: "",
    button_url: "",
    downloads_count: "",
    image: null,
  },
  reviews: {
    eyebrow: "",
    title: "",
    highlight: "",
    description: "",
  },
};

const offerIcons = [
  "briefcase",
  "users",
  "headphones",
  "book",
  "award",
  "shield",
  "wrench",
  "phone",
  "monitor",
  "lightbulb",
  "message",
  "clock",
  "rocket",
];

export default function AdminSite() {
  const auth = useAdminAuth();
  const [settings, setSettings] = useState<WebsiteSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (auth.role !== "super_admin" && auth.role !== "admin") {
      setLoading(false);
      return;
    }

    adminWebsiteSettingsService
      .get()
      .then((data) => {
        if (mounted) setSettings(data);
      })
      .catch(() => {
        if (mounted) toast.error("Website settings load hoyni.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [auth.role]);

  if (auth.role !== "super_admin" && auth.role !== "admin") {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Admin access required</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Website settings can only be managed by Super Admin and Admin accounts.
        </p>
      </div>
    );
  }

  const updateSection = <K extends SectionKey>(key: K, value: Partial<WebsiteSettings[K]>) => {
    setSettings((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...value,
      },
    }));
  };

  const uploadImage = async (
    event: ChangeEvent<HTMLInputElement>,
    target: "hero.image" | "next_batch.image" | "download_app.image"
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setUploading(target);

    try {
      const path = await adminWebsiteSettingsService.uploadImage(file);
      const [section, field] = target.split(".") as [SectionKey, "image"];
      updateSection(section, { [field]: path } as Partial<WebsiteSettings[typeof section]>);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Image upload hoyni.");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);

    try {
      const data = await adminWebsiteSettingsService.update(settings);
      setSettings(data);
      toast.success("Website settings saved.");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Settings save hoyni.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Website Pages</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Control homepage hero, counts, next batch, offers, app download, and review text.
          </p>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Website
        </Button>
      </div>

      <div className="space-y-6">
        <Section title="Hero Section">
          <TextInput label="Title line 1" value={settings.hero.title_line_1} onChange={(value) => updateSection("hero", { title_line_1: value })} />
          <TextInput label="Title line 2" value={settings.hero.title_line_2} onChange={(value) => updateSection("hero", { title_line_2: value })} />
          <TextArea label="Description" value={settings.hero.description} onChange={(value) => updateSection("hero", { description: value })} />
          <TextInput label="Download button label" value={settings.hero.primary_button_label} onChange={(value) => updateSection("hero", { primary_button_label: value })} />
          <TextInput label="Download button URL" value={settings.hero.primary_button_url} onChange={(value) => updateSection("hero", { primary_button_url: value })} />
          <TextInput label="YouTube button label" value={settings.hero.secondary_button_label} onChange={(value) => updateSection("hero", { secondary_button_label: value })} />
          <TextInput label="Hero YouTube URL" value={settings.hero.youtube_url} onChange={(value) => updateSection("hero", { youtube_url: value })} />
          <ImageInput
            label="Hero image"
            path={settings.hero.image}
            loading={uploading === "hero.image"}
            onChange={(event) => void uploadImage(event, "hero.image")}
          />
          <div className="lg:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <Label className="text-zinc-300">Hero Counts</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  updateSection("hero", {
                    counts: [...settings.hero.counts, { label: "", value: "" }],
                  })
                }
                className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Count
              </Button>
            </div>
            <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {settings.hero.counts.map((count, index) => (
                <div key={index} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Count {index + 1}
                    </span>
                    {settings.hero.counts.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateSection("hero", {
                            counts: settings.hero.counts.filter((_, countIndex) => countIndex !== index),
                          })
                        }
                        className="grid h-7 w-7 place-items-center rounded-md text-rose-300 hover:bg-rose-500/10"
                        aria-label="Remove count"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    value={count.value}
                    onChange={(event) => {
                      const counts = [...settings.hero.counts];
                      counts[index] = { ...counts[index], value: event.target.value };
                      updateSection("hero", { counts });
                    }}
                    placeholder="5,000+"
                    className="border-zinc-700 bg-zinc-900 text-white"
                  />
                  <Input
                    value={count.label}
                    onChange={(event) => {
                      const counts = [...settings.hero.counts];
                      counts[index] = { ...counts[index], label: event.target.value };
                      updateSection("hero", { counts });
                    }}
                    placeholder="Total Students"
                    className="mt-2 border-zinc-700 bg-zinc-900 text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Next Batch Preview">
          <TextInput label="Eyebrow" value={settings.next_batch.eyebrow} onChange={(value) => updateSection("next_batch", { eyebrow: value })} />
          <TextInput label="Preview title" value={settings.next_batch.title} onChange={(value) => updateSection("next_batch", { title: value })} />
          <TextInput label="Watch preview YouTube URL" value={settings.next_batch.youtube_url} onChange={(value) => updateSection("next_batch", { youtube_url: value })} />
          <ImageInput
            label="Next batch image"
            path={settings.next_batch.image}
            loading={uploading === "next_batch.image"}
            onChange={(event) => void uploadImage(event, "next_batch.image")}
          />
        </Section>

        <Section title="Next Batch Schedule">
          <TextInput label="Eyebrow" value={settings.next_batch_schedule.eyebrow} onChange={(value) => updateSection("next_batch_schedule", { eyebrow: value })} />
          <TextInput label="Batch title" value={settings.next_batch_schedule.title} onChange={(value) => updateSection("next_batch_schedule", { title: value })} />
          <TextInput label="Enrollment start date" value={settings.next_batch_schedule.enrollment_start_date} onChange={(value) => updateSection("next_batch_schedule", { enrollment_start_date: value })} />
          <TextInput label="Enrollment end date" value={settings.next_batch_schedule.enrollment_end_date} onChange={(value) => updateSection("next_batch_schedule", { enrollment_end_date: value })} />
          <TextInput label="Demo button label" value={settings.next_batch_schedule.demo_button_label} onChange={(value) => updateSection("next_batch_schedule", { demo_button_label: value })} />
          <TextInput label="Demo video or playlist URL" value={settings.next_batch_schedule.demo_url} onChange={(value) => updateSection("next_batch_schedule", { demo_url: value })} />
          <TextInput label="Course URL" value={settings.next_batch_schedule.course_url} onChange={(value) => updateSection("next_batch_schedule", { course_url: value })} />
          <TextArea label="Course info" value={settings.next_batch_schedule.course_info} onChange={(value) => updateSection("next_batch_schedule", { course_info: value })} />
        </Section>

        <Section title="Offers">
          <TextInput label="Title" value={settings.offers.title} onChange={(value) => updateSection("offers", { title: value })} />
          <TextInput label="Highlight" value={settings.offers.highlight} onChange={(value) => updateSection("offers", { highlight: value })} />
          <TextArea label="Description" value={settings.offers.description} onChange={(value) => updateSection("offers", { description: value })} />
          <div className="lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-zinc-300">Offer Cards</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  updateSection("offers", {
                    items: [
                      ...settings.offers.items,
                      { icon: "briefcase", title: "", description: "", background_color: "#fff4ed" },
                    ],
                  })
                }
                className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <div className="grid gap-3">
              {settings.offers.items.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 md:grid-cols-[160px_1fr_auto]">
                  <select
                    value={item.icon}
                    onChange={(event) => {
                      const items = [...settings.offers.items];
                      items[index] = { ...items[index], icon: event.target.value };
                      updateSection("offers", { items });
                    }}
                    className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
                  >
                    {offerIcons.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                  <div className="grid gap-2">
                    <Input
                      value={item.title}
                      onChange={(event) => {
                        const items = [...settings.offers.items];
                        items[index] = { ...items[index], title: event.target.value };
                        updateSection("offers", { items });
                      }}
                      placeholder="Offer title"
                      className="border-zinc-700 bg-zinc-900 text-white"
                    />
                    <textarea
                      value={item.description}
                      onChange={(event) => {
                        const items = [...settings.offers.items];
                        items[index] = { ...items[index], description: event.target.value };
                        updateSection("offers", { items });
                      }}
                      rows={2}
                      placeholder="Offer description"
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                    />
                    <div className="grid gap-2 sm:grid-cols-[90px_1fr] sm:items-center">
                      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs font-semibold text-zinc-300">
                        <input
                          type="color"
                          value={item.background_color || "#fff4ed"}
                          onChange={(event) => {
                            const items = [...settings.offers.items];
                            items[index] = { ...items[index], background_color: event.target.value };
                            updateSection("offers", { items });
                          }}
                          className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        Color
                      </label>
                      <Input
                        value={item.background_color || ""}
                        onChange={(event) => {
                          const items = [...settings.offers.items];
                          items[index] = { ...items[index], background_color: event.target.value };
                          updateSection("offers", { items });
                        }}
                        placeholder="#fff4ed"
                        className="border-zinc-700 bg-zinc-900 text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSection("offers", {
                        items: settings.offers.items.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                    className="grid h-10 w-10 place-items-center rounded-md border border-zinc-700 text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Download App">
          <TextInput label="Title" value={settings.download_app.title} onChange={(value) => updateSection("download_app", { title: value })} />
          <TextArea label="Description" value={settings.download_app.description} onChange={(value) => updateSection("download_app", { description: value })} />
          <TextInput label="Button top label" value={settings.download_app.button_label_top} onChange={(value) => updateSection("download_app", { button_label_top: value })} />
          <TextInput label="Button label" value={settings.download_app.button_label} onChange={(value) => updateSection("download_app", { button_label: value })} />
          <TextInput label="Button URL" value={settings.download_app.button_url} onChange={(value) => updateSection("download_app", { button_url: value })} />
          <TextInput label="Downloads count" value={settings.download_app.downloads_count} onChange={(value) => updateSection("download_app", { downloads_count: value })} />
          <ImageInput
            label="Download app image"
            path={settings.download_app.image}
            loading={uploading === "download_app.image"}
            onChange={(event) => void uploadImage(event, "download_app.image")}
          />
        </Section>

        <Section title="Reviews Section Text">
          <TextInput label="Eyebrow" value={settings.reviews.eyebrow} onChange={(value) => updateSection("reviews", { eyebrow: value })} />
          <TextInput label="Title" value={settings.reviews.title} onChange={(value) => updateSection("reviews", { title: value })} />
          <TextInput label="Highlight" value={settings.reviews.highlight} onChange={(value) => updateSection("reviews", { highlight: value })} />
          <TextArea label="Description" value={settings.reviews.description} onChange={(value) => updateSection("reviews", { description: value })} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h2 className="mb-4 text-base font-semibold text-white">{title}</h2>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label className="text-zinc-300">{label}</Label>
      <Input value={value || ""} onChange={(event) => onChange(event.target.value)} className="mt-1 border-zinc-700 bg-zinc-950 text-white" />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="lg:col-span-2">
      <Label className="text-zinc-300">{label}</Label>
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-1 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary"
      />
    </div>
  );
}

function ImageInput({
  label,
  path,
  loading,
  onChange,
}: {
  label: string;
  path?: string | null;
  loading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <Label className="text-zinc-300">{label}</Label>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-20 w-28 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          {path ? (
            <img src={imageUrl(path)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-[11px] text-zinc-500">No image</div>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          Upload
          <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={onChange} />
        </label>
      </div>
    </div>
  );
}
