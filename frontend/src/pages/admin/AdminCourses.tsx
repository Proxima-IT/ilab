import { AdminCrud } from "@/components/admin/AdminCrud";

export default function Page() {
  return (

    <AdminCrud
      table="courses"
      title="Courses"
      description="Manage every course. Build curriculum from each course's edit dialog."
      orderBy={{ column: "created_at", ascending: false }}
      searchColumn="title"
      columns={[
        { key: "title", label: "Title" },
        { key: "level", label: "Level" },
        { key: "mode", label: "Mode" },
        { key: "price", label: "Price", render: (r) => "৳" + Number(r.price ?? 0).toLocaleString() },
        {
          key: "is_published",
          label: "Status",
          render: (r) => (
            <span className={"rounded-full px-2 py-0.5 text-xs " + (r.is_published ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-700/40 text-zinc-300")}>
              {r.is_published ? "Published" : "Draft"}
            </span>
          ),
        },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "slug", label: "Slug", type: "text", required: true },
        { name: "short_description", label: "Short description", type: "textarea" },
        { name: "description", label: "Full description", type: "textarea" },
        { name: "mode", label: "Mode", type: "select", options: [
          { value: "online", label: "Online" }, { value: "offline", label: "Offline" },
        ], defaultValue: "online" },
        { name: "level", label: "Level", type: "select", options: [
          { value: "beginner", label: "Beginner" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" },
        ], defaultValue: "beginner" },
        { name: "type", label: "Type", type: "select", options: [
          { value: "live", label: "Live" }, { value: "recorded", label: "Recorded" },
        ], defaultValue: "recorded" },
        { name: "price", label: "Price (৳)", type: "number", defaultValue: 0 },
        { name: "discounted_price", label: "Discounted price (৳)", type: "number" },
        { name: "duration", label: "Duration", type: "text", placeholder: "e.g. 3 months" },
        { name: "language", label: "Language", type: "text", defaultValue: "Bangla" },
        { name: "thumbnail_url", label: "Thumbnail URL", type: "url" },
        { name: "preview_video_url", label: "Preview video URL", type: "url" },
        { name: "hero_badge", label: "Hero badge text", type: "text" },
        { name: "rating", label: "Rating (0-5)", type: "number", defaultValue: 4.8 },
        { name: "total_students", label: "Total students", type: "number", defaultValue: 0 },
        { name: "fun_facts", label: "Fun facts (JSON array of strings)", type: "json", defaultValue: "[]" },
        { name: "learning_outcomes", label: "Learning outcomes (JSON array of strings)", type: "json", defaultValue: "[]" },
        { name: "target_audience", label: "Target audience (JSON array)", type: "json", defaultValue: "[]" },
        { name: "requirements", label: "Requirements (JSON array)", type: "json", defaultValue: "[]" },
        { name: "is_published", label: "Published", type: "boolean", helper: "Show on the public site" },
        { name: "is_featured", label: "Featured", type: "boolean", helper: "Highlight on the home page" },
        { name: "is_free", label: "Free course", type: "boolean" },
      ]}
    />
  
  );
}
