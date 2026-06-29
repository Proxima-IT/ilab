import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { SiteLogo } from "@/components/site/SiteLogo";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

type NavItem = {
  label: string;
  path: string;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { label: "Home", path: "/", exact: true },
  { label: "Courses", path: "/courses" },
  { label: "Free Courses", path: "/courses?free=true", exact: true },
  { label: "Events", path: "/events" },
  { label: "Reviews", path: "/#reviews", exact: true },
  { label: "Blog", path: "/blog" },
];

function splitPath(path: string) {
  const url = new URL(path, "http://ilab.local");

  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  };
}

function hasQueryValue(search: string, key: string, value: string) {
  return new URLSearchParams(search).get(key) === value;
}

function isNavItemActive(item: NavItem, currentPath: string, currentSearch: string, currentHash: string) {
  const target = splitPath(item.path);

  if (target.pathname === "/courses" && target.search === "?free=true") {
    return currentPath === "/courses" && hasQueryValue(currentSearch, "free", "true");
  }

  if (item.exact) {
    return (
      currentPath === target.pathname &&
      currentSearch === target.search &&
      currentHash === target.hash
    );
  }

  if (target.pathname === "/courses") {
    return currentPath.startsWith("/courses") && !hasQueryValue(currentSearch, "free", "true");
  }

  return currentPath === target.pathname || currentPath.startsWith(`${target.pathname}/`);
}

export function Header() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const hasHeaderBackground = scrolled || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const hash = location.hash.slice(1);
    const timeoutId = window.setTimeout(() => {
      const target = document.getElementById(hash);

      if (!target) return;

      const headerOffset = 92;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    }, 50);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const dashboardPath = isAdmin ? "/admin" : "/dashboard";
  const dashboardLabel = isAdmin ? "Admin" : "Dashboard";

  const navLinkClass = (item: NavItem) => {
    const active = isNavItemActive(
      item,
      location.pathname,
      location.search,
      location.hash
    );

    return `px-3.5 py-2 text-base font-semibold transition-colors rounded-lg hover:bg-surface ${
      active
        ? "text-foreground bg-surface"
        : "text-muted-foreground hover:text-foreground"
    }`;
  };

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        hasHeaderBackground
          ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-soft"
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
              <Link
                key={item.label}
                to={item.path}
                className={navLinkClass(item)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-base font-bold rounded-full gradient-teal text-white shadow-glow hover:scale-[1.03] active:scale-[0.98] transition-transform"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {dashboardLabel}
                </Link>

                <button
                  onClick={handleLogout}
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
            className="md:hidden grid place-items-center h-10 w-10 rounded-lg bg-surface/80 hover:bg-surface border border-border"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden mb-4 mt-2 rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-soft p-3 flex flex-col gap-1"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`${navLinkClass(item)} block px-4 py-3 bg-surface/60 hover:bg-surface rounded-xl`}
              >
                {item.label}
              </Link>
            ))}

            <div className="flex gap-2 pt-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2.5 text-center text-base font-bold rounded-full gradient-teal text-white"
                  >
                    {dashboardLabel}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2.5 text-center text-base font-bold rounded-full border border-border bg-surface"
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
