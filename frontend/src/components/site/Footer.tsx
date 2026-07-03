import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  Phone,
  Send,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLogo } from "@/components/site/SiteLogo";
import { fetchWebsiteSettings, type WebsiteSettings } from "@/services/home.service";
import { newsletterService } from "@/services/newsletter.service";

type FooterLink = { label: string; to: string };

const sections: { title: string; links: FooterLink[] }[] = [
  {
    title: "Learning",
    links: [
      { label: "All Courses", to: "/courses" },
      { label: "Free Courses", to: "/courses?free=true" },
      { label: "Featured Courses", to: "/#courses" },
      { label: "Student Reviews", to: "/#reviews" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Home", to: "/" },
      { label: "Events", to: "/events" },
      { label: "Blog", to: "/blog" },
      { label: "Next Batch", to: "/#batch-preview" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", to: "/login" },
      { label: "Sign Up", to: "/signup" },
      { label: "Student Dashboard", to: "/dashboard" },
      { label: "My Profile", to: "/profile" },
    ],
  },
];

const socialIcons: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
};

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchWebsiteSettings()
      .then((data) => {
        if (mounted) setSettings(data);
      })
      .catch(() => {
        if (mounted) setSettings(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const general = settings?.system?.general;
  const socialLinks = (settings?.system?.social_media || []).filter((item) => item.name && item.url);
  const supportEmail = general?.support_email || "support@ilabbd.com";
  const supportPhone = general?.support_phone || "+880 1234 567 890";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim().toLowerCase();

    if (!value) return;

    setSubmitting(true);
    setSuccess(false);

    try {
      await newsletterService.subscribe(value);
      setEmail("");
      setSuccess(true);
      toast.success("Newsletter subscription successful.");
    } catch (error) {
      toast.error(firstError(error, "Newsletter subscribe hoyni."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-foreground text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.25fr]">
          <div>
            <Link to="/" aria-label="iLab BD home">
              <SiteLogo size="md" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">
              Practical mobile servicing and career-focused technology courses for Bangladeshi learners.
            </p>
            <div className="mt-6 space-y-2 text-sm text-white/60">
              <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 transition hover:text-primary">
                <Mail className="h-4 w-4" />
                {supportEmail}
              </a>
              <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="flex items-center gap-2 transition hover:text-primary">
                <Phone className="h-4 w-4" />
                {supportPhone}
              </a>
            </div>
            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {socialLinks.map((item) => {
                  const Icon = socialIcons[item.icon.trim().toLowerCase()] || ExternalLink;

                  return (
                    <a
                      key={`${item.name}-${item.url}`}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.name}
                      title={item.name}
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:border-primary/40 hover:bg-primary hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-sm font-bold uppercase tracking-wider text-white/90">{section.title}</p>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-white/60 transition hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-white/90">Newsletter</p>
            <p className="mt-4 text-sm leading-6 text-white/60">
              Get course updates, events, and learning tips in your inbox.
            </p>
            <form className="mt-4 flex gap-2" onSubmit={submit}>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSuccess(false);
                }}
                placeholder="you@email.com"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm placeholder:text-white/40 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg gradient-orange px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Subscribe
              </button>
            </form>
            {success && (
              <p className="mt-2 text-xs text-primary">Subscribed successfully. Thank you.</p>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} iLab BD. All rights reserved.</p>
          <p>
            Website designed and developed by{" "}
            <a
              href="https://facebook.com/proximait"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white/80 transition hover:text-primary"
            >
              Proxima IT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
