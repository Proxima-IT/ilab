import { AdminCrud } from "@/components/admin/AdminCrud";

export default function Page() {
  return (

    <AdminCrud
      table="categories"
      title="Categories"
      description="Course categories used by filters and listings."
      orderBy={{ column: "sort_order", ascending: true }}
      searchColumn="name"
      columns={[
        { key: "name", label: "Name" },
        { key: "slug", label: "Slug" },
        { key: "sort_order", label: "Order" },
      ]}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "slug", label: "Slug", type: "text", required: true, helper: "URL-friendly, lowercase, dash-separated" },
        { name: "icon", label: "Icon name (lucide)", type: "text" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "sort_order", label: "Sort order", type: "number", defaultValue: 0 },
      ]}
    />
  
  );
}
