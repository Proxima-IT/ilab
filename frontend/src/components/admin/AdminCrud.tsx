import { useEffect, useState } from "react";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = supabaseTyped;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "url"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "json";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
  placeholder?: string;
  helper?: string;
  fullWidth?: boolean;
};

export type Column = {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
};

type Props = {
  table: string;
  title: string;
  description?: string;
  fields: Field[];
  columns: Column[];
  orderBy?: { column: string; ascending?: boolean };
  searchColumn?: string;
};

export function AdminCrud({ table, title, description, fields, columns, orderBy, searchColumn }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = supabase.from(table).select("*");
    if (orderBy) q = q.order(orderBy.column, { ascending: orderBy.ascending ?? false });
    if (search && searchColumn) q = q.ilike(searchColumn, `%${search}%`);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data ?? []) as Record<string, unknown>[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openNew = () => {
    const defaults: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
      else if (f.type === "boolean") defaults[f.name] = false;
      else if (f.type === "json") defaults[f.name] = "[]";
      else defaults[f.name] = "";
    }
    setEditing(null);
    setForm(defaults);
    setOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const next: Record<string, unknown> = {};
    for (const f of fields) {
      const v = row[f.name];
      if (f.type === "json") next[f.name] = v == null ? "[]" : JSON.stringify(v, null, 2);
      else if (v == null) next[f.name] = "";
      else next[f.name] = v;
    }
    setEditing(row);
    setForm(next);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        const v = form[f.name];
        if (f.type === "number") payload[f.name] = v === "" || v == null ? null : Number(v);
        else if (f.type === "boolean") payload[f.name] = !!v;
        else if (f.type === "json") {
          try {
            payload[f.name] = v ? JSON.parse(String(v)) : null;
          } catch {
            throw new Error(`Invalid JSON in ${f.label}`);
          }
        } else if (f.type === "date" || f.type === "datetime") {
          payload[f.name] = v === "" ? null : v;
        } else {
          payload[f.name] = v === "" ? null : v;
        }
      }
      if (editing) {
        const { error } = await supabase.from(table).update(payload).eq("id", editing.id as string);
        if (error) throw error;
        toast.success("Updated");
      } else {
        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
        toast.success("Created");
      }
      setOpen(false);
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Record<string, unknown>) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from(table).delete().eq("id", row.id as string);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    void load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {searchColumn && (
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 border-zinc-700 bg-zinc-900 text-white"
            />
          )}
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-zinc-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-zinc-500">
                  No items yet. Click <span className="text-zinc-300">New</span> to add one.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id as string} className="hover:bg-zinc-900/60">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-zinc-200">
                      {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        onClick={() => remove(row)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-zinc-800 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "New"} {title.replace(/s$/, "")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.fullWidth || f.type === "textarea" || f.type === "json" ? "sm:col-span-2" : ""}>
                <Label className="text-zinc-300">{f.label}{f.required && <span className="text-rose-400"> *</span>}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    rows={4}
                    value={(form[f.name] as string) ?? ""}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-900 text-white"
                  />
                ) : f.type === "json" ? (
                  <Textarea
                    rows={6}
                    value={(form[f.name] as string) ?? "[]"}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="mt-1 font-mono text-xs border-zinc-700 bg-zinc-900 text-white"
                  />
                ) : f.type === "boolean" ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Switch
                      checked={!!form[f.name]}
                      onCheckedChange={(v) => setForm({ ...form, [f.name]: v })}
                    />
                    <span className="text-sm text-zinc-400">{f.helper ?? "Enabled"}</span>
                  </div>
                ) : f.type === "select" ? (
                  <Select
                    value={(form[f.name] as string) ?? ""}
                    onValueChange={(v) => setForm({ ...form, [f.name]: v })}
                  >
                    <SelectTrigger className="mt-1 border-zinc-700 bg-zinc-900 text-white">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={
                      f.type === "number" ? "number" :
                      f.type === "date" ? "date" :
                      f.type === "datetime" ? "datetime-local" :
                      f.type === "url" ? "url" : "text"
                    }
                    placeholder={f.placeholder}
                    value={(form[f.name] as string) ?? ""}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-900 text-white"
                  />
                )}
                {f.helper && f.type !== "boolean" && (
                  <p className="mt-1 text-xs text-zinc-500">{f.helper}</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900">
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
