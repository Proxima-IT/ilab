import { CheckCircle2, LockKeyhole, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";

type RoleKey = "super_admin" | "admin" | "manager" | "instructor" | "content_manager";

type PermissionRow = {
  area: string;
  description: string;
  roles: RoleKey[];
};

const roles: { key: RoleKey; label: string; tone: string }[] = [
  { key: "super_admin", label: "Super Admin", tone: "border-primary/30 bg-primary/10 text-primary" },
  { key: "admin", label: "Admin", tone: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  { key: "manager", label: "Manager", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  { key: "instructor", label: "Instructor", tone: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  { key: "content_manager", label: "Content Manager", tone: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300" },
];

const permissions: PermissionRow[] = [
  {
    area: "Admin Login",
    description: "Can enter the private admin panel.",
    roles: ["super_admin", "admin", "manager", "instructor", "content_manager"],
  },
  {
    area: "Staff Control",
    description: "Create, edit, delete staff accounts and update passwords.",
    roles: ["super_admin"],
  },
  {
    area: "Website Settings",
    description: "Control home page texts, images, counters, and website content settings.",
    roles: ["super_admin", "admin"],
  },
  {
    area: "Reviews",
    description: "Create, update, reorder, and delete public reviews.",
    roles: ["super_admin", "admin", "manager"],
  },
  {
    area: "Students",
    description: "View students. Admin-level roles can add, edit, and delete student accounts.",
    roles: ["super_admin", "admin", "manager", "instructor"],
  },
  {
    area: "Student Management",
    description: "Add, edit, delete students and mark admin-created students as verified.",
    roles: ["super_admin", "admin", "manager"],
  },
  {
    area: "Instructor Profiles",
    description: "View instructor profiles and stats. Admin-level roles can manage instructor accounts.",
    roles: ["super_admin", "admin", "manager", "instructor"],
  },
  {
    area: "Courses",
    description: "Create and update course content. Instructor access is scoped to own courses.",
    roles: ["super_admin", "admin", "manager", "instructor", "content_manager"],
  },
  {
    area: "Course Delete",
    description: "Delete courses only when no enrollments exist.",
    roles: ["super_admin", "admin"],
  },
  {
    area: "Enrollments",
    description: "View enrollment ledger. Manual enrollment/revoke stays admin controlled.",
    roles: ["super_admin", "admin", "manager", "instructor"],
  },
  {
    area: "Student Progress",
    description: "Read-only progress list by course and student.",
    roles: ["super_admin", "admin", "manager", "instructor"],
  },
  {
    area: "Certificates",
    description: "View certificates. Admin-level roles can issue, edit, and delete certificates.",
    roles: ["super_admin", "admin", "manager", "instructor"],
  },
  {
    area: "Certificate Management",
    description: "Issue, edit, and delete student certificates.",
    roles: ["super_admin", "admin", "manager"],
  },
  {
    area: "Blog & Events",
    description: "Create, update, delete publishing content and upload thumbnails.",
    roles: ["super_admin", "admin", "manager", "content_manager"],
  },
  {
    area: "Promo Codes",
    description: "Manage offers and discounts.",
    roles: ["super_admin", "admin", "manager", "content_manager"],
  },
  {
    area: "Permission Matrix",
    description: "View this role and permission matrix.",
    roles: ["super_admin"],
  },
];

function roleLabel(role: string) {
  return role.replace(/_/g, " ");
}

export default function AdminPermissionsMatrix() {
  const auth = useAdminAuth();

  if (!auth.isSuperAdmin) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-300" />
        <h1 className="mt-4 text-xl font-semibold text-white">Super admin only</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Permission matrix access is restricted to super admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Role & Permission Matrix</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Read-only overview of admin panel access by staff role.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
          <LockKeyhole className="h-4 w-4" />
          Super admin access
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-5">
        {roles.map((role) => (
          <div key={role.key} className={`rounded-xl border p-4 ${role.tone}`}>
            <ShieldCheck className="h-5 w-5" />
            <div className="mt-3 text-sm font-semibold">{role.label}</div>
            <div className="mt-1 text-[11px] capitalize opacity-80">{roleLabel(role.key)}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="w-72 px-4 py-3 font-medium">Permission</th>
                {roles.map((role) => (
                  <th key={role.key} className="px-4 py-3 text-center font-medium">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {permissions.map((permission) => (
                <tr key={permission.area}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-zinc-100">{permission.area}</div>
                    <div className="mt-1 text-xs leading-5 text-zinc-500">{permission.description}</div>
                  </td>
                  {roles.map((role) => {
                    const allowed = permission.roles.includes(role.key);

                    return (
                      <td key={`${permission.area}-${role.key}`} className="px-4 py-4 text-center">
                        <span
                          className={
                            "inline-flex h-9 w-9 items-center justify-center rounded-full border " +
                            (allowed
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-zinc-800 bg-zinc-950/60 text-zinc-600")
                          }
                        >
                          {allowed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
