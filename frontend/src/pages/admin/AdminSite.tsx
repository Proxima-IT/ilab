import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";



const SECTIONS = [
  { key: "hero", label: "Hero", helper: "headline, subheadline, CTA labels & URLs, image_url" },
  { key: "stats", label: "Stats", helper: "total_students, total_videos, total_courses" },
  { key: "download_app", label: "Download App", helper: "headline, playstore_url, appstore_url, screenshot_url" },
  { key: "youtube_section", label: "YouTube Section", helper: "headline, channel_name, subscribers, channel_url" },
  { key: "footer", label: "Footer", helper: "about, facebook, youtube, linkedin, email, phone, address" },
];

export default function SiteSections() {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: rows } = await supabase.from("site_sections").select("key, data");
      const map: Record<string, string> = {};
      for (const s of SECTIONS) {
        const row = (rows ?? []).find((r) => r.key === s.key);
        map[s.key] = JSON.stringify(row?.data ?? {}, null, 2);
      }
      setData(map);
      setLoading(false);
    })();
  }, []);

  const save = async (key: string) => {
    setSavingKey(key);
    try {
      const parsed = JSON.parse(data[key] ?? "{}");
      const { error } = await supabase
        .from("site_sections")
        .upsert({ key, data: parsed }, { onConflict: "key" });
      if (error) throw error;
      toast.success(`${key} saved`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Site Sections</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Edit homepage and global site content. Each section is a JSON object — match the field
        names listed in the helper text.
      </p>

      <div className="mt-6 space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.key} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <Label className="text-zinc-200 text-base">{s.label}</Label>
                <p className="text-xs text-zinc-500">Fields: {s.helper}</p>
              </div>
              <Button onClick={() => save(s.key)} disabled={savingKey === s.key}>
                {savingKey === s.key ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
            <Textarea
              rows={10}
              value={data[s.key] ?? ""}
              onChange={(e) => setData({ ...data, [s.key]: e.target.value })}
              className="font-mono text-xs border-zinc-700 bg-zinc-950 text-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
