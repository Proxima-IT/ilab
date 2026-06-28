import { AdminCrud } from "@/components/admin/AdminCrud";

export default function Page() {
  return (

    <AdminCrud
      table="blog_posts"
      title="Blog Posts"
      description="Articles published on the public blog."
      orderBy={{ column: "created_at", ascending: false }}
      searchColumn="title"
      columns={[
        { key: "title", label: "Title" },
        { key: "category", label: "Category" },
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
        { name: "category", label: "Category", type: "text" },
        { name: "read_time", label: "Read time", type: "text", placeholder: "e.g. 5 min" },
        { name: "author_name", label: "Author", type: "text" },
        { name: "cover_url", label: "Cover image URL", type: "url" },
        { name: "excerpt", label: "Excerpt", type: "textarea" },
        { name: "body", label: "Body (Markdown)", type: "textarea" },
        { name: "is_published", label: "Published", type: "boolean" },
        { name: "published_at", label: "Publish date", type: "datetime" },
      ]}
    />
  
  );
}
