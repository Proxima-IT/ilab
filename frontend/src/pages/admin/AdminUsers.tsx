import { useEffect, useState } from "react";
import { listUsers, setUserRole } from "@/lib/admin/bootstrap.functions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";



type User = {
  id: string;
  email: string | undefined;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data as User[]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line

  const toggle = async (u: User, role: "super_admin" | "content_manager") => {
    const enabled = !u.roles.includes(role);
    try {
      await setUserRole({ userId: u.id, role, enabled });
      toast.success("Role updated");
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const filtered = users.filter((u) =>
    !filter || (u.email ?? "").toLowerCase().includes(filter.toLowerCase()) ||
    (u.full_name ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Users & Roles</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage who can access the Admin Panel.</p>
        </div>
        <Input
          placeholder="Search by name or email…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-72 border-zinc-700 bg-zinc-900 text-white"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last sign in</th>
              <th className="px-4 py-3 font-medium">Super Admin</th>
              <th className="px-4 py-3 font-medium">Content Manager</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-500"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-500">No users.</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="text-zinc-200">{u.full_name ?? "—"}</div>
                  <div className="text-xs text-zinc-500">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-zinc-400">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3"><Switch checked={u.roles.includes("super_admin")} onCheckedChange={() => toggle(u, "super_admin")} /></td>
                <td className="px-4 py-3"><Switch checked={u.roles.includes("content_manager")} onCheckedChange={() => toggle(u, "content_manager")} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-zinc-500">
        Tip: ask a teammate to sign up at <span className="text-zinc-300">/admin/login</span>, then enable the role you want here.
        <Button variant="ghost" size="sm" onClick={load} className="ml-2 text-primary hover:bg-zinc-900">Refresh</Button>
      </div>
    </div>
  );
}
