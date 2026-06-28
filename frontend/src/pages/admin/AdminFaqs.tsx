import { AdminCrud } from "@/components/admin/AdminCrud";

export default function Page() {
  return (

    <AdminCrud
      table="faqs"
      title="FAQs"
      description="Frequently asked questions for the homepage and course pages."
      orderBy={{ column: "sort_order", ascending: true }}
      searchColumn="question"
      columns={[
        { key: "question", label: "Question" },
        { key: "scope", label: "Scope" },
        { key: "sort_order", label: "Order" },
      ]}
      fields={[
        { name: "question", label: "Question", type: "text", required: true },
        { name: "answer", label: "Answer", type: "textarea", required: true },
        { name: "scope", label: "Scope", type: "select", options: [
          { value: "home", label: "Home" }, { value: "course", label: "Course" }, { value: "general", label: "General" },
        ], defaultValue: "home" },
        { name: "sort_order", label: "Sort order", type: "number", defaultValue: 0 },
      ]}
    />
  
  );
}
