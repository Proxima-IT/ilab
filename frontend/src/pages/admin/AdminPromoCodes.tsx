import { AdminCrud } from "@/components/admin/AdminCrud";

export default function Page() {
  return (

    <AdminCrud
      table="promo_codes"
      title="Promo Codes"
      description="Discount codes that apply at checkout."
      orderBy={{ column: "created_at", ascending: false }}
      searchColumn="code"
      columns={[
        { key: "code", label: "Code" },
        { key: "discount_type", label: "Type" },
        { key: "discount_value", label: "Value" },
        { key: "used_count", label: "Used" },
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
        { name: "code", label: "Code", type: "text", required: true, helper: "Customers type this at checkout" },
        { name: "discount_type", label: "Discount type", type: "select", options: [
          { value: "percent", label: "Percent (%)" }, { value: "flat", label: "Flat (৳)" },
        ], defaultValue: "percent" },
        { name: "discount_value", label: "Discount value", type: "number", required: true },
        { name: "course_id", label: "Course ID (leave blank for all)", type: "text" },
        { name: "valid_from", label: "Valid from", type: "datetime" },
        { name: "valid_until", label: "Valid until", type: "datetime" },
        { name: "max_uses", label: "Max uses", type: "number" },
        { name: "is_active", label: "Active", type: "boolean", defaultValue: true },
      ]}
    />
  
  );
}
