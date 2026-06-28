import { AdminCrud } from "@/components/admin/AdminCrud";

export default function Page() {
  return (

    <AdminCrud
      table="events"
      title="Events"
      description="Workshops, webinars and meetups."
      orderBy={{ column: "starts_at", ascending: false }}
      searchColumn="title"
      columns={[
        { key: "title", label: "Title" },
        { key: "event_type", label: "Type" },
        { key: "starts_at", label: "Starts" },
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
        { name: "event_type", label: "Type", type: "text", placeholder: "Workshop / Webinar / Meetup" },
        { name: "starts_at", label: "Starts at", type: "datetime" },
        { name: "ends_at", label: "Ends at", type: "datetime" },
        { name: "location", label: "Location", type: "text" },
        { name: "seats", label: "Seats", type: "number" },
        { name: "cover_url", label: "Cover image URL", type: "url" },
        { name: "registration_url", label: "Registration URL", type: "url" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "is_published", label: "Published", type: "boolean" },
      ]}
    />
  
  );
}
