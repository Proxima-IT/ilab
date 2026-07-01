import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import { authStore, type UserRole } from "@/lib/auth";
import { applyPrivateSeo } from "@/lib/seo";
import { imageUrl } from "@/services/course-catalog.service";
import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/site/SiteLogo";
import {
  Bell,
  LayoutDashboard,
  BookOpen,
  CheckCircle2,
  Users,
  Tag,
  GraduationCap,
  CalendarDays,
  Ticket,
  CalendarRange,
  ShoppingBag,
  LogOut,
  Loader2,
  Home,
  Menu,
  Newspaper,
  ShieldCheck,
  Star,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  superOnly?: boolean;
  allowedRoles?: UserRole[];
};

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Control Center",
    items: [
      {
        to: "/admin",
        label: "Dashboard",
        description: "Site overview",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    group: "Learning",
    items: [
      {
        to: "/admin/courses",
        label: "Courses",
        description: "Courses, curriculum, pricing",
        icon: BookOpen,
      },
      {
        to: "/admin/categories",
        label: "Categories",
        description: "Course categories",
        icon: Tag,
      },
      {
        to: "/admin/instructors",
        label: "Instructors",
        description: "Teacher profiles",
        icon: GraduationCap,
      },
      {
        to: "/admin/batches",
        label: "Batches",
        description: "Batch schedule",
        icon: CalendarDays,
      },
    ],
  },
  {
    group: "Students & Sales",
    items: [
      {
        to: "/admin/students",
        label: "Students",
        description: "Student accounts",
        icon: Users,
        allowedRoles: ["super_admin", "admin", "manager", "instructor"],
      },
      {
        to: "/admin/enrollments",
        label: "Enrollments",
        description: "Student course access",
        icon: ShoppingBag,
        superOnly: true,
      },
      {
        to: "/admin/promo-codes",
        label: "Promo Codes",
        description: "Offers and discounts",
        icon: Ticket,
      },
    ],
  },
  {
    group: "Website Pages",
    items: [
      {
        to: "/admin/site",
        label: "Website Settings",
        description: "Hero, images, counts",
        icon: Home,
        allowedRoles: ["super_admin", "admin"],
      },
      {
        to: "/admin/reviews",
        label: "Reviews",
        description: "Student feedback",
        icon: Star,
        allowedRoles: ["super_admin", "admin", "manager"],
      },
    ],
  },
  {
    group: "Publishing",
    items: [
      {
        to: "/admin/blog",
        label: "Blog",
        description: "Posts and authors",
        icon: Newspaper,
      },
      {
        to: "/admin/events",
        label: "Events",
        description: "Events and registrations",
        icon: CalendarRange,
      },
    ],
  },
  {
    group: "Security",
    items: [
      {
        to: "/admin/users",
        label: "Roles & Access",
        description: "Super admin controls",
        icon: ShieldCheck,
        superOnly: true,
      },
    ],
  },
];

const STATIC_NOTIFICATIONS = [
  {
    id: 1,
    title: "New enrollment received",
    message: "A student enrolled in a course. Dynamic admin notifications will be connected later.",
    time: "Just now",
    unread: true,
    icon: ShoppingBag,
  },
  {
    id: 2,
    title: "Course content reminder",
    message: "Check unpublished lessons before the next batch starts.",
    time: "Today",
    unread: true,
    icon: BookOpen,
  },
  {
    id: 3,
    title: "System ready",
    message: "Admin notification center placeholder is active.",
    time: "Yesterday",
    unread: false,
    icon: CheckCircle2,
  },
];

function fallbackAvatar(name?: string | null) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Admin")}&background=111827&color=ffffff`;
}

function resolveAvatar(avatar?: string | null, name?: string | null) {
  if (!avatar) return fallbackAvatar(name);
  return imageUrl(avatar);
}

export default function AdminLayout() {
  const auth = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const roleLabel = auth.role ? auth.role.replace(/_/g, " ") : "Staff";
  const profileName = auth.profile?.name || auth.name || "Admin";
  const profileEmail = auth.profile?.email || auth.email || "";
  const profileAvatar = resolveAvatar(auth.profile?.avatar, profileName);
  const unreadCount = STATIC_NOTIFICATIONS.filter((notification) => notification.unread).length;

  useEffect(() => {
    applyPrivateSeo({
      title: "Admin - iLab BD",
      description: "Private iLab BD admin workspace.",
      path: pathname || "/admin",
    });
  }, [pathname]);

  useEffect(() => {
    if (!auth.loading && !auth.userId) {
      navigate("/admin/login");
    }
  }, [auth.loading, auth.userId, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
    setShowProfile(false);
  }, [pathname]);

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
            Your account ({auth.email}) does not have permission to access this panel.
          </p>
          <button
            onClick={async () => {
              await authStore.logout();
              navigate("/admin/login");
            }}
            className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const logout = async () => {
    await authStore.logout();
    navigate("/admin/login");
  };

  const sidebar = (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-5">
        <SiteLogo size="xs" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">iLab Admin</div>
          <div className="truncate text-[11px] capitalize tracking-wide text-zinc-500">
            {roleLabel}
          </div>
        </div>
      </div>

      <nav className="admin-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4 pr-2">
        {NAV.map((group) => {
          const items = group.items.filter((item) => {
            if (item.superOnly && !auth.isSuperAdmin) return false;
            if (item.allowedRoles?.length && (!auth.role || !item.allowedRoles.includes(auth.role))) return false;
            return true;
          });
          if (items.length === 0) return null;

          return (
            <div key={group.group} className="mb-5">
              <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                {group.group}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const active =
                    item.to === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.to);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={`${group.group}-${item.to}-${item.label}`}
                      to={item.to}
                      className={
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors " +
                        (active
                          ? "bg-primary/15 text-primary"
                          : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white")
                      }
                    >
                      <span
                        className={
                          "grid h-8 w-8 shrink-0 place-items-center rounded-md " +
                          (active
                            ? "bg-primary/15 text-primary"
                            : "bg-zinc-800 text-zinc-400 group-hover:text-white")
                        }
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.label}</span>
                        <span className="block truncate text-[11px] text-zinc-500 group-hover:text-zinc-400">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <div className="mb-2 truncate px-1 text-xs text-zinc-400">{auth.email}</div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          onClick={logout}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-100">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/70 lg:flex">
        {sidebar}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close admin menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex h-full w-80 max-w-[86vw] flex-col border-r border-zinc-800 bg-zinc-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Close admin menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/40 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-md border border-zinc-800 text-zinc-200"
            aria-label="Open admin menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link to="/admin" className="text-sm font-semibold text-zinc-100">
            iLab Admin
          </Link>
          <button
            type="button"
            onClick={logout}
            className="grid h-9 w-9 place-items-center rounded-md border border-zinc-800 text-zinc-200"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 backdrop-blur lg:flex">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Admin Panel</p>
            <h1 className="text-sm font-semibold capitalize text-zinc-100">
              {pathname === "/admin"
                ? "Dashboard"
                : pathname
                    .replace("/admin/", "")
                    .replace(/-/g, " ")
                    .replace(/\//g, " / ")}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((current) => !current);
                  setShowProfile(false);
                }}
                className="relative grid h-10 w-10 place-items-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-primary/40 hover:text-white"
                aria-label="Open notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfile((current) => !current);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900 py-1 pl-1 pr-4 text-left transition hover:border-primary/40"
              >
                <span className="h-10 w-10 overflow-hidden rounded-full bg-zinc-800">
                  <img src={profileAvatar} alt={profileName} className="h-full w-full object-cover" />
                </span>
                <span className="hidden min-w-0 md:block">
                  <span className="block max-w-40 truncate text-xs font-semibold text-white">
                    {profileName}
                  </span>
                  <span className="block max-w-40 truncate text-[11px] text-zinc-500">
                    {profileEmail}
                  </span>
                </span>
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/30">
                  <div className="border-b border-zinc-800 p-4">
                    <div className="flex items-center gap-3">
                      <span className="h-12 w-12 overflow-hidden rounded-full bg-zinc-800">
                        <img src={profileAvatar} alt={profileName} className="h-full w-full object-cover" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{profileName}</p>
                        <p className="truncate text-xs text-zinc-500">{profileEmail}</p>
                        <p className="mt-1 text-[10px] capitalize text-primary">{roleLabel}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <Link
                      to="/admin/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                    >
                      <UserRound className="h-4 w-4" />
                      Admin profile
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setShowNotifications((current) => !current)}
            className="relative grid h-9 w-9 place-items-center rounded-md border border-zinc-800 text-zinc-200"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>
          <Link to="/admin/profile" className="flex min-w-0 items-center gap-2">
            <span className="h-9 w-9 overflow-hidden rounded-full bg-zinc-800">
              <img src={profileAvatar} alt={profileName} className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block max-w-44 truncate text-xs font-semibold text-white">{profileName}</span>
              <span className="block max-w-44 truncate text-[10px] text-zinc-500">{profileEmail}</span>
            </span>
          </Link>
        </div>

        {showNotifications && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-20 backdrop-blur-sm">
            <button
              type="button"
              className="absolute inset-0"
              aria-label="Close notifications"
              onClick={() => setShowNotifications(false)}
            />
            <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-[11px] text-zinc-500">Static preview for now</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                    {unreadCount} unread
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                    aria-label="Close notifications"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[460px] overflow-y-auto p-3">
                {STATIC_NOTIFICATIONS.map((notification) => {
                  const Icon = notification.icon;

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      className={
                        "mb-2 flex w-full gap-3 rounded-xl border p-3 text-left transition hover:border-primary/30 " +
                        (notification.unread
                          ? "border-primary/20 bg-primary/10"
                          : "border-zinc-800 bg-zinc-950/40")
                      }
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-800 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-white">
                            {notification.title}
                          </span>
                          {notification.unread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-[11px] leading-5 text-zinc-400">
                          {notification.message}
                        </span>
                        <span className="mt-2 block text-[10px] text-zinc-500">
                          {notification.time}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
