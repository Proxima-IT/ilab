import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Gift,
  LogOut,
  Menu,
  MessageCircle,
  UserCog,
} from "lucide-react";
import { useStudent } from "@/hooks/useStudentData";
import { SiteLogo } from "@/components/site/SiteLogo";
import {
  notificationService,
  type StudentNotification,
  type StudentNotificationType,
} from "@/services/student/notification.service";
import { applyFallbackAvatar } from "@/lib/avatar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/my-courses": "My Courses",
  "/dashboard/progress": "Progress",
  "/dashboard/certificates": "Certificates",
  "/dashboard/leaderboard": "Leaderboard",
  "/dashboard/resources": "Resources",
  "/dashboard/profile": "Profile",
};

const websiteNav = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Free Courses", to: "/courses?free=true" },
  { label: "Events", to: "/events" },
  { label: "Review", to: "/#reviews" },
  { label: "Blog", to: "/blog" },
];

type DashboardNavbarProps = {
  onMenuToggle: () => void;
  onLogout: () => void;
};

export default function DashboardNavbar({
  onMenuToggle,
  onLogout,
}: DashboardNavbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { student, loading } = useStudent();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const pageTitle = pageTitles[pathname] || pathname.includes("/player")
    ? "Class Player"
    : "Dashboard";

  const notificationIcons: Record<StudentNotificationType, typeof Bell> = {
    new_lecture: BookOpen,
    special_offer: Gift,
    event: CalendarDays,
    profile_update: UserCog,
    course_completion: CheckCircle2,
    certificate_ready: Award,
    admin_message: Bell,
    qna_answer: MessageCircle,
  };

  function formatNotificationTime(date: string): string {
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  }

  function sortNotifications(items: StudentNotification[]) {
    return [...items].sort((a, b) => {
      const dateDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return dateDiff || b.id - a.id;
    }).slice(0, 15);
  }

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications(force = false) {
      try {
        const data = await notificationService.getLatest(force);

        if (mounted) {
          setNotifications(sortNotifications(data.notifications));
          setUnreadCount(data.unread_count);
        }
      } catch {
        if (mounted) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    }

    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications(true);
      }
    };

    void loadNotifications(true);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadNotifications(true);
      }
    }, 30000);

    document.addEventListener("visibilitychange", refreshOnFocus);
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnFocus);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);

  const handleNotificationClick = async (notification: StudentNotification) => {
    if (!notification.read_at) {
      const updated = await notificationService.markRead(notification.id);
      setNotifications((current) =>
        sortNotifications(
          current.map((item) => (item.id === notification.id ? updated : item))
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    if (notification.action_url) {
      setShowNotifications(false);
      navigate(notification.action_url);
    }
  };

  const toggleNotifications = async () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);

    if (nextOpen) {
      const data = await notificationService.getLatest(true);
      setNotifications(sortNotifications(data.notifications));
      setUnreadCount(data.unread_count);
    }
  };

  if (loading || !student) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-4 lg:px-6 bg-card border-b border-border/35">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </header>
    );
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-4 lg:px-6 glass-card"
      style={{
        borderRadius: 0,
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
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

      <nav className="hidden lg:flex items-center gap-1">
        {websiteNav.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => void toggleNotifications()}
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/30"
          >
            <Bell className="w-4 h-4" />
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[9px] font-mono rounded-full flex items-center justify-center accent-glow"
            >
              {unreadCount}
            </motion.span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-12 w-[340px] glass-card overflow-hidden p-0"
              >
                <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
                  <p className="font-ui text-xs font-semibold text-foreground">Notifications</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                    {unreadCount} unread
                  </span>
                </div>

                <div className="max-h-[420px] space-y-1 overflow-y-auto p-2">
                  {notifications.length === 0 && (
                    <div className="p-5 text-center text-xs text-muted-foreground">
                      No notifications yet.
                    </div>
                  )}

                  {notifications.map((notification) => {
                    const Icon = notificationIcons[notification.type] || Bell;
                    const read = Boolean(notification.read_at);

                    return (
                      <button
                        key={notification.id}
                        onClick={() => void handleNotificationClick(notification)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          read
                            ? "border-border/30 bg-card/60 hover:bg-secondary/20"
                            : "border-primary/25 bg-primary/10 shadow-sm hover:bg-primary/15"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                              read ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`font-ui text-[12px] font-semibold leading-snug ${
                                  read ? "text-muted-foreground" : "text-foreground"
                                }`}
                              >
                                {notification.title}
                              </p>
                              {!read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                            </div>
                            <p className="mt-1 line-clamp-2 font-ui text-[11px] leading-snug text-muted-foreground">
                              {notification.message}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] capitalize text-muted-foreground">
                                {notification.type.replace("_", " ")}
                              </span>
                              <span className="shrink-0 text-[9px] text-muted-foreground">
                                {formatNotificationTime(notification.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onLogout}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>

        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/40 primary-glow">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-full h-full object-cover"
            onError={(event) => applyFallbackAvatar(event, student.name)}
          />
        </div>
      </div>
    </header>
  );
}
