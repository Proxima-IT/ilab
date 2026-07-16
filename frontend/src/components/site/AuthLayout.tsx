import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { SiteLogo } from "@/components/site/SiteLogo";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  highlight: { eyebrow: string; heading: string; bullets: string[] };
  compact?: boolean;
};

export function AuthLayout({ title, subtitle, children, footer, highlight, compact = false }: Props) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <aside className={`relative hidden lg:flex flex-col justify-between overflow-hidden gradient-teal text-white ${compact ? "p-8" : "p-12"}`}>
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(80%_60%_at_20%_10%,white,transparent_60%)]" />
        <div className="relative">
          <Link to="/">
            <SiteLogo size="md" />
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative ${compact ? "space-y-4" : "space-y-6"}`}
        >
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            {highlight.eyebrow}
          </span>
          <h2 className={`${compact ? "text-3xl" : "text-4xl"} font-bold leading-tight max-w-md`}>{highlight.heading}</h2>
          <ul className={`${compact ? "space-y-2 text-sm" : "space-y-3"} text-white/90`}>
            {highlight.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        <div className="relative text-sm text-white/80">© {new Date().getFullYear()} iLab. Future-ready learning.</div>
      </aside>

      {/* Right form */}
      <section className={`flex flex-col px-6 sm:px-10 md:px-16 lg:px-20 ${compact ? "py-5" : "py-10"}`}>
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden">
            <SiteLogo size="sm" />
          </Link>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`mx-auto w-full max-w-md flex-1 flex flex-col justify-center ${compact ? "py-4" : "py-10"}`}
        >
          <h1 className={`${compact ? "text-2xl" : "text-3xl"} font-bold tracking-tight text-foreground`}>{title}</h1>
          <p className={`${compact ? "mt-1 text-sm" : "mt-2"} text-muted-foreground`}>{subtitle}</p>
          <div className={compact ? "mt-5" : "mt-8"}>{children}</div>
          <div className={`${compact ? "mt-4" : "mt-6"} text-sm text-muted-foreground text-center`}>{footer}</div>
        </motion.div>
      </section>
    </main>
  );
}
