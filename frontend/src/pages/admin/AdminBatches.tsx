import { AdminCrud } from "@/components/admin/AdminCrud";

export default function Page() {
  return (

    <AdminCrud
      table="batches"
      title="Batches"
      description="Next batch schedule shown on the homepage and course detail pages."
      orderBy={{ column: "start_date", ascending: false }}
      searchColumn="name"
      columns={[
        { key: "name", label: "Name" },
        { key: "start_date", label: "Start" },
        { key: "end_date", label: "End" },
        { key: "seats", label: "Seats" },
        {
          key: "is_active",
          label: "Active",
          render: (r) => (
            <span className={"rounded-full px-2 py-0.5 text-xs " + (r.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-700/40 text-zinc-300")}>
              {r.is_active ? "Yes" : "No"}
            </span>
          ),
        },
      ]}
      fields={[
        { name: "name", label: "Batch name", type: "text", required: true },
        { name: "course_id", label: "Course ID", type: "text", helper: "Paste the course UUID" },
        { name: "start_date", label: "Start date", type: "date" },
        { name: "end_date", label: "End date", type: "date" },
        { name: "enrollment_start", label: "Enrollment opens", type: "date" },
        { name: "enrollment_end", label: "Enrollment closes", type: "date" },
        { name: "seats", label: "Seats", type: "number" },
        { name: "preview_video_url", label: "Preview video URL", type: "url" },
        { name: "demo_class_url", label: "Demo class URL", type: "url" },
        { name: "course_outline_url", label: "Course outline URL", type: "url" },
        { name: "enroll_url", label: "Enroll URL", type: "url" },
        { name: "is_active", label: "Active", type: "boolean", defaultValue: true },
        { name: "is_featured_homepage", label: "Show on homepage", type: "boolean" },
      ]}
    />
  
  );
}
