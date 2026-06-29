import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import { SiteLogo } from "@/components/site/SiteLogo";
import { useState } from "react";

type FooterLink = { label: string; to?: string; hash?: string; href?: string };

const sections: { title: string; links: FooterLink[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Courses", to: "/courses" },
      { label: "Demo Class", to: "/", hash: "demo" },
      { label: "Structure", to: "/", hash: "structure" },
      { label: "Certificates", to: "/", hash: "certificate" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/", hash: "structure" },
      { label: "Blog", to: "/blog" },
      { label: "Reviews", to: "/", hash: "reviews" },
      { label: "Contact", href: "mailto:hello@ilab.com" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Sign up", to: "/signup" },
      { label: "Log in", to: "/login" },
      { label: "Dashboard", to: "/dashboard" },
      { label: "Help", href: "mailto:support@ilab.com" },
    ],
  },
];

const socials = [
  { Icon: Facebook, href: "https://facebook.com" },
  { Icon: Twitter, href: "https://twitter.com" },
  { Icon: Instagram, href: "https://instagram.com" },
  { Icon: Linkedin, href: "https://linkedin.com" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="bg-foreground text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] gap-10">
          <div>
            <Link to="/">
              <SiteLogo size="md" />
            </Link>
            <p className="mt-4 text-sm text-white/60 max-w-xs">
              The modern EdTech platform helping learners build future-ready careers.
            </p>
            <div className="mt-6 flex gap-2">
              {socials.map(({ Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-primary hover:text-foreground transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {sections.map((s) => (
            <div key={s.title}>
              <p className="text-sm font-bold uppercase tracking-wider text-white/90">{s.title}</p>
              <ul className="mt-4 space-y-3">
                {s.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={`${l.to}${l.hash ? `#${l.hash}` : ""}`} className="text-sm text-white/60 hover:text-primary transition-colors">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className="text-sm text-white/60 hover:text-primary transition-colors">
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-white/90">Newsletter</p>
            <p className="mt-4 text-sm text-white/60">Get learning tips and new course alerts.</p>
            <form className="mt-4 flex gap-2" onSubmit={submit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-lg bg-white/10 border border-white/10 text-sm placeholder:text-white/40 focus:outline-none focus:border-primary"
              />
              <button type="submit" className="px-4 py-2.5 rounded-lg gradient-orange text-white text-sm font-semibold shrink-0">
                {subscribed ? "✓ Done" : "Subscribe"}
              </button>
            </form>
            {subscribed && (
              <p className="mt-2 text-xs text-primary">Thanks! Check your inbox to confirm.</p>
            )}
            <div className="mt-6 space-y-2 text-sm text-white/60">
              <a href="mailto:hello@ilab.com" className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" /> hello@ilab.com</a>
              <a href="tel:+8801234567890" className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" /> +880 1234 567 890</a>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} iLab. All rights reserved.</p>
          <p>Built for learners, by educators.</p>
        </div>
      </div>
    </footer>
  );
}
