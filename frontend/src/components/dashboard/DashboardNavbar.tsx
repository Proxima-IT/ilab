import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, Flame } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudent } from '@/hooks/useStudentData';
import { notificationsData } from '@/lib/mockData';
import { SiteLogo } from '@/components/site/SiteLogo';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/my-courses': 'আমার Courses',
  '/dashboard/progress': 'Progress',
  '/dashboard/certificates': 'Certificates',
  '/dashboard/leaderboard': 'Leaderboard',
  '/dashboard/resources': 'Resources',
  '/dashboard/profile': 'Profile',
};

const websiteNav = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Free Courses", to: "/courses?free=true" },
  { label: "Events", to: "/events" },
  { label: "Review", to: "/#reviews" },
  { label: "Blog", to: "/blog" },
];

export default function DashboardNavbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { pathname } = useLocation();
  const { student, loading } = useStudent();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const pageTitle = pageTitles[pathname] || (pathname.includes('/player') ? 'Class Player' : 'Dashboard');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading || !student) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-4 lg:px-6 bg-card border-b border-border/35">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-4 lg:px-6 glass-card" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuToggle} className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <SiteLogo size="xs" showWordmark />
        </Link>
        <AnimatePresence mode="wait">
          <motion.span
            key={pathname}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="hidden xl:block text-xs text-muted-foreground font-ui ml-4 px-3 py-1 rounded-lg bg-primary/10 border border-primary/15"
          >
            {pageTitle}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Center Website Nav */}
      <nav className="hidden lg:flex items-center gap-1">
        {websiteNav.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              pathname === item.to
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/30"
          >
            <Bell className="w-4 h-4" />
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[9px] font-mono rounded-full flex items-center justify-center accent-glow"
            >
              3
            </motion.span>
          </button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-12 w-72 glass-card p-3 space-y-2"
              >
                {notificationsData.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'success' ? 'bg-primary' : n.type === 'warning' ? 'bg-accent' : 'bg-muted-foreground'}`} />
                    <div>
                      <p className="text-xs text-foreground font-ui">{n.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Streak */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-accent font-display text-xs bg-accent/10 border border-accent/20">
          <span>{student.streak}</span>
          <Flame className="w-3.5 h-3.5" />
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/40 primary-glow">
          <img src={student.avatar} alt="" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
}
