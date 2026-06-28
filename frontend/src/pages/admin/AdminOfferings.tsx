import { AdminCrud } from "@/components/admin/AdminCrud";

export default function Page() {
  return (

    <AdminCrud
      table="offerings"
      title="What We Offer"
      description="Cards shown in the “What we offers” section on the homepage."
      orderBy={{ column: "sort_order", ascending: true }}
      searchColumn="title"
      columns={[
        { key: "title", label: "Title" },
        { key: "icon", label: "Icon" },
        { key: "sort_order", label: "Order" },
      ]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea" },
        { name: "icon", label: "Icon name (lucide)", type: "text", placeholder: "e.g. Briefcase" },
        { name: "color_token", label: "Color token", type: "text", placeholder: "primary | accent | emerald | rose" },
        { name: "sort_order", label: "Sort order", type: "number", defaultValue: 0 },
        { name: "is_published", label: "Published", type: "boolean", defaultValue: true },
      ]}
    />
  
  );
}
