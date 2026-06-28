import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/site/SiteLogo";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Tag,
  GraduationCap,
  CalendarDays,
  Ticket,
  FileText,
  CalendarRange,
  MessageSquareQuote,
  HelpCircle,
  Sparkles,
  Settings,
  ShoppingBag,
  LogOut,
  Loader2,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; superOnly?: boolean };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Catalog",
    items: [
      { to: "/admin/courses", label: "Courses", icon: BookOpen },
      { to: "/admin/categories", label: "Categories", icon: Tag },
      { to: "/admin/instructors", label: "Instructors", icon: GraduationCap },
      { to: "/admin/batches", label: "Batches", icon: CalendarDays },
      { to: "/admin/promo-codes", label: "Promo Codes", icon: Ticket },
    ],
  },
  {
    group: "Commerce",
    items: [
      { to: "/admin/enrollments", label: "Enrollments", icon: ShoppingBag, superOnly: true },
    ],
  },
  {
    group: "Content",
    items: [
      { to: "/admin/blog", label: "Blog", icon: FileText },
      { to: "/admin/events", label: "Events", icon: CalendarRange },
      { to: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
      { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { to: "/admin/offerings", label: "What We Offer", icon: Sparkles },
      { to: "/admin/site", label: "Site Sections", icon: Settings },
    ],
  },
  {
    group: "Access",
    items: [{ to: "/admin/users", label: "Users & Roles", icon: Users, superOnly: true }],
  },
];

export default function AdminLayout() {
  const auth = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = "Admin — iLab BD";
  }, []);

  useEffect(() => {
    if (!auth.loading && !auth.userId) {
      navigate("/admin/login");
    }
  }, [auth.loading, auth.userId, navigate]);

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-300">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!auth.userId) return null;

  if (!auth.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-center text-zinc-200">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-semibold">Admin access required</h1>
          <p className="text-sm text-zinc-400">
            Your account ({auth.email}) does not have an admin role yet. If you are the site
            owner, claim the first super admin role to unlock the panel.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/admin/claim"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Claim Super Admin
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/admin/login");
              }}
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-100">
      <aside className="hidden w-64 flex-col border-r border-zinc-800 bg-zinc-900/60 lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-5">
          <SiteLogo size="xs" />
          <div>
            <div className="text-sm font-semibold">iLab Admin</div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">
              {auth.isSuperAdmin ? "Super Admin" : "Content Manager"}
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => {
            const items = group.items.filter((i) => !i.superOnly || auth.isSuperAdmin);
            if (items.length === 0) return null;
            return (
              <div key={group.group} className="mb-5">
                <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  {group.group}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active =
                      item.to === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.to);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors " +
                          (active
                            ? "bg-primary/15 text-primary"
                            : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white")
                        }
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-zinc-800 p-3">
          <div className="mb-2 px-1 text-xs text-zinc-400">{auth.email}</div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/admin/login");
            }}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="border-b border-zinc-800 bg-zinc-900/40 px-6 py-3 lg:hidden">
          <Link to="/admin" className="text-sm font-semibold text-zinc-100">
            iLab Admin
          </Link>
        </div>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
