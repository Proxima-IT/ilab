import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Facebook,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Youtube,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  fetchWebsiteSettings,
  type WebsiteSettings,
} from "@/services/home.service";
import { applyJsonLd, applySeo, breadcrumbSchema, siteUrl } from "@/lib/seo";

type SocialMediaItem = NonNullable<NonNullable<WebsiteSettings["system"]>["social_media"]>[number];

function socialIcon(item: SocialMediaItem) {
  const text = `${item.name} ${item.icon} ${item.url}`.toLowerCase();

  if (text.includes("facebook")) return Facebook;
  if (text.includes("youtube") || text.includes("youtu.be")) return Youtube;
  if (text.includes("whatsapp")) return MessageCircle;

  return Globe2;
}

function normalizePhoneHref(phone?: string | null) {
  if (!phone) return "#";

  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default function ContactPage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applySeo({
      title: "Contact iLab BD | Mobile Repairing Training Support",
      description:
        "Contact iLab BD for course support, admission guidance, events, certificates, and mobile repairing training information.",
      path: "/contact",
    });
    applyJsonLd("page-json-ld", [
      breadcrumbSchema([
        { name: "Home", url: siteUrl("/") },
        { name: "Contact", url: siteUrl("/contact") },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contact iLab BD",
        url: siteUrl("/contact"),
      },
    ]);
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchWebsiteSettings()
      .then((data) => {
        if (mounted) setSettings(data);
      })
      .catch(() => {
        if (mounted) setSettings(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const general = settings?.system?.general;
  const socialMedia = useMemo(
    () => settings?.system?.social_media?.filter((item) => item.url) || [],
    [settings?.system?.social_media],
  );
  const websiteName = general?.website_name || "iLab BD";
  const supportEmail = general?.support_email || "support@ilabbd.com";
  const supportPhone = general?.support_phone || "+880 1700-000000";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(135deg,rgba(13,148,136,0.16),rgba(255,255,255,0.96)_46%,rgba(249,115,22,0.14))] pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-dark">
              Contact
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
              Talk with {websiteName}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              Need help choosing a course, checking admission details, or solving an account issue?
              Reach the iLab team through the official support channels below.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8"
          >
            <h2 className="text-2xl font-extrabold text-foreground">Get support</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              We usually reply during working hours. For urgent payment or enrollment help,
              use phone support.
            </p>

            <div className="mt-7 grid gap-4">
              <ContactInfoCard
                icon={Phone}
                label="Phone support"
                value={supportPhone}
                href={normalizePhoneHref(supportPhone)}
                loading={loading}
              />
              <ContactInfoCard
                icon={Mail}
                label="Email support"
                value={supportEmail}
                href={`mailto:${supportEmail}`}
                loading={loading}
              />
              <ContactInfoCard
                icon={Clock}
                label="Support hours"
                value="Saturday - Thursday, 10:00 AM - 7:00 PM"
                loading={loading}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="grid gap-6"
          >
            <div className="rounded-3xl border border-border bg-foreground p-6 text-background shadow-card md:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Send className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold">Start learning with confidence</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-background/70">
                Ask about course outline, next batch schedule, free courses, certificates, or
                student dashboard access. We will guide you to the right path.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-foreground transition hover:bg-primary hover:text-white"
                >
                  Browse courses <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Send email
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="text-xl font-extrabold text-foreground">Social channels</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Follow official iLab updates from admin controlled social links.
              </p>

              {socialMedia.length > 0 ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {socialMedia.map((item) => {
                    const Icon = socialIcon(item);

                    return (
                      <a
                        key={`${item.name}-${item.url}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 rounded-2xl border border-border bg-surface/50 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/10"
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary-dark transition group-hover:bg-primary group-hover:text-white">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-foreground">
                            {item.name || "Social link"}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.url}
                          </span>
                        </span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface/60 p-5 text-sm text-muted-foreground">
                  Social links will appear here after they are added from System Settings.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ContactInfoCard({
  icon: Icon,
  label,
  value,
  href,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  loading?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface/50 p-4 transition hover:border-primary/30 hover:bg-primary/10">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary-dark">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {loading ? (
          <span className="mt-1 block h-5 w-44 animate-pulse rounded bg-muted" />
        ) : (
          <span className="mt-1 block break-words text-sm font-bold text-foreground md:text-base">
            {value}
          </span>
        )}
      </span>
    </div>
  );

  if (!href || href === "#") return content;

  return (
    <a href={href} className="block">
      {content}
    </a>
  );
}
