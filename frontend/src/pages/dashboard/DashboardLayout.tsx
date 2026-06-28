import { useState } from 'react';
import { Link, useLocation, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from 'framer-motion';
import { Home, BookOpen, BarChart3, User } from 'lucide-react';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

const mobileNav = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/dashboard/my-courses', icon: BookOpen, label: 'Courses' },
  { path: '/dashboard/progress', icon: BarChart3, label: 'Progress' },
  { path: '/dashboard/profile', icon: User, label: 'Profile' },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient glows */}
      <div className="bg-glow-primary" />
      <div className="bg-glow-accent" />
      <div className="noise-overlay" />

      <DashboardNavbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-[60px] bottom-0 w-60 border-r border-border/30 overflow-y-auto scrollbar-thin z-40 bg-sidebar">
        <DashboardSidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
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
              transition={{ type: 'spring', bounce: 0.15 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden border-r border-border/30 overflow-y-auto bg-sidebar"
            >
              <div className="h-[60px] flex items-center px-4">
                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground">✕</button>
              </div>
              <DashboardSidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
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

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 z-50 flex items-center justify-around border-t border-border/30 bg-sidebar/95 backdrop-blur-xl">
        {mobileNav.map((item) => {
          const active = item.path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center gap-0.5 relative">
              {active && (
                <motion.div layoutId="mobileActive" className="absolute -top-2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <item.icon className={`w-5 h-5 ${active ? 'text-primary text-glow-primary' : 'text-muted-foreground'}`} />
              {active && <span className="text-[9px] text-primary font-ui">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
