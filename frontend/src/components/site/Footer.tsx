import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { SiteLogo } from "@/components/site/SiteLogo";
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

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
              <a href="mailto:support@ilabbd.com" className="flex items-center gap-2 transition hover:text-primary">
                <Mail className="h-4 w-4" />
                support@ilabbd.com
              </a>
              <a href="tel:+8801234567890" className="flex items-center gap-2 transition hover:text-primary">
                <Phone className="h-4 w-4" />
                +880 1234 567 890
              </a>
            </div>
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
          <p>Built for learners, mentors, and career growth.</p>
        </div>
      </div>
    </footer>
  );
}
