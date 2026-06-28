import { AdminCrud } from "@/components/admin/AdminCrud";

export default function Page() {
  return (

    <AdminCrud
      table="reviews"
      title="Reviews"
      description="Student testimonials — supports text, image, or video reviews."
      orderBy={{ column: "sort_order", ascending: true }}
      searchColumn="student_name"
      columns={[
        { key: "student_name", label: "Student" },
        { key: "course_title", label: "Course" },
        { key: "rating", label: "Rating" },
        { key: "media_type", label: "Type" },
      ]}
      fields={[
        { name: "student_name", label: "Student name", type: "text", required: true },
        { name: "course_title", label: "Course title", type: "text" },
        { name: "rating", label: "Rating (1-5)", type: "number", defaultValue: 5 },
        { name: "media_type", label: "Type", type: "select", options: [
          { value: "text", label: "Text" }, { value: "image", label: "Image" }, { value: "video", label: "Video" },
        ], defaultValue: "text" },
        { name: "text", label: "Review text", type: "textarea" },
        { name: "media_url", label: "Image / Video URL", type: "url" },
        { name: "avatar_url", label: "Avatar URL", type: "url" },
        { name: "sort_order", label: "Sort order", type: "number", defaultValue: 0 },
        { name: "is_published", label: "Published", type: "boolean", defaultValue: true },
      ]}
    />
  
  );
}
