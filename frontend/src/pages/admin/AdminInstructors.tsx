import { AdminCrud } from "@/components/admin/AdminCrud";

export default function Page() {
  return (

    <AdminCrud
      table="instructors"
      title="Instructors"
      description="Teachers and mentors that appear on courses."
      orderBy={{ column: "created_at", ascending: false }}
      searchColumn="name"
      columns={[
        { key: "name", label: "Name" },
        { key: "title", label: "Title" },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "title", label: "Title / Role", type: "text" },
        { name: "avatar_url", label: "Avatar URL", type: "url" },
        { name: "bio", label: "Bio", type: "textarea" },
        { name: "facebook_url", label: "Facebook URL", type: "url" },
        { name: "linkedin_url", label: "LinkedIn URL", type: "url" },
        { name: "youtube_url", label: "YouTube URL", type: "url" },
      ]}
    />
  
  );
}
