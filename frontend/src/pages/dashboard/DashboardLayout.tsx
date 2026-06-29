import { useEffect, useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  BookOpen,
  BarChart3,
  User,
  LogOut,
  Loader2,
  X,
} from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/lib/auth";
import { useStudent } from "@/hooks/useStudentData";

const mobileNav = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/dashboard/my-courses", icon: BookOpen, label: "Courses" },
  { path: "/dashboard/progress", icon: BarChart3, label: "Progress" },
  { path: "/dashboard/profile", icon: User, label: "Profile" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const { loading } = useStudent();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="bg-glow-primary" />
      <div className="bg-glow-accent" />
      <div className="noise-overlay" />

      <DashboardNavbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <aside className="hidden lg:block fixed left-0 top-[60px] bottom-0 w-60 border-r border-border/30 overflow-y-auto scrollbar-thin z-40 bg-white">
        <div className="min-h-full flex flex-col">
          <div className="flex-1">
            <DashboardSidebar />
          </div>

          <div className="p-4 border-t border-border/30">
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface transition"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", bounce: 0.15 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden border-r border-border/30 overflow-y-auto bg-white"
            >
              <div className="h-[60px] flex items-center justify-between px-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>

              <DashboardSidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="lg:ml-60 pt-[60px] pb-20 lg:pb-6 min-h-screen relative z-10">
        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 z-50 flex items-center justify-around border-t border-border/30 bg-sidebar/95 backdrop-blur-xl">
        {mobileNav.map((item) => {
          const active =
            item.path === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 relative"
            >
              {active && (
                <motion.div
                  layoutId="mobileActive"
                  className="absolute -top-2 w-8 h-0.5 bg-primary rounded-full"
                />
              )}

              <item.icon
                className={`w-5 h-5 ${
                  active
                    ? "text-primary text-glow-primary"
                    : "text-muted-foreground"
                }`}
              />

              {active && (
                <span className="text-[9px] text-primary font-ui">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
