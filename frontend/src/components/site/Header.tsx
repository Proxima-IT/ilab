import { Link, useNavigate, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { SiteLogo } from "@/components/site/SiteLogo";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

type NavItem = { label: string; to: string; hash?: string; search?: Record<string, unknown> };

const navItems: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
  { label: "Free Courses", to: "/courses", search: { free: true } },
  { label: "Events", to: "/events" },
  { label: "Review", to: "/", hash: "reviews" },
  { label: "Blog", to: "/blog" },
];

function getPath(item: NavItem) {
  let path = item.to;
  if (item.search?.free) path += "?free=true";
  if (item.hash) path += `#${item.hash}`;
  return path;
}

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-soft"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 h-16 md:h-20 md:flex md:justify-between">
          <Link to="/" className="group min-w-0 py-1">
            <SiteLogo size="xl" className="md:[&_img]:h-16 md:[&_img]:w-16" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={getPath(item)}
                end={item.to === "/"}
                className={({ isActive }) => 
                  `px-3.5 py-2 text-base font-semibold transition-colors rounded-lg hover:bg-surface ${
                    isActive && !item.hash ? "text-foreground bg-surface" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-base font-bold rounded-full gradient-teal text-white shadow-glow hover:scale-[1.03] active:scale-[0.98] transition-transform"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-base font-bold rounded-full border border-border text-foreground hover:bg-surface transition"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 text-base font-bold rounded-full gradient-orange text-white shadow-orange-glow hover:scale-[1.03] active:scale-[0.98] transition-transform"
              >
                Login / SignUp
              </Link>
            )}
          </div>

          <button
            className="md:hidden grid place-items-center h-10 w-10 rounded-lg hover:bg-surface"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-4 pt-2 flex flex-col gap-1 border-t border-border"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={getPath(item)}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2.5 text-center text-base font-bold rounded-full gradient-teal text-white"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                      navigate("/");
                    }}
                    className="flex-1 px-4 py-2.5 text-center text-base font-bold rounded-full border border-border"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 text-center text-base font-bold rounded-full gradient-orange text-white"
                >
                  Login / SignUp
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
