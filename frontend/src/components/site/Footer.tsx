import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteLogo } from "@/components/site/SiteLogo";
import { fetchWebsiteSettings, type WebsiteSettings } from "@/services/home.service";
import { ExternalLink } from "lucide-react";

type SocialMediaItem = {
  name: string;
  url: string;
  icon?: string;
};

const DEFAULT_SOCIALS: SocialMediaItem[] = [
  { name: "Facebook", url: "https://facebook.com", icon: "facebook" },
  { name: "Instagram", url: "https://instagram.com", icon: "instagram" },
  { name: "LinkedIn", url: "https://linkedin.com", icon: "linkedin" },
  { name: "YouTube", url: "https://youtube.com", icon: "youtube" },
  { name: "TikTok", url: "https://tiktok.com", icon: "tiktok" },
];

function renderSocialIcon(type: string): ReactNode {
  const t = (type || "").trim().toLowerCase();

  if (t.includes("facebook") || t === "fb") {
    return (
      <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    );
  }

  if (t.includes("instagram") || t === "insta") {
    return (
      <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    );
  }

  if (t.includes("linkedin")) {
    return (
      <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    );
  }

  if (t.includes("youtube") || t.includes("youtu.be")) {
    return (
      <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }

  if (t.includes("tiktok")) {
    return (
      <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V8.98a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.5a8.27 8.27 0 0 0 4.76 1.5V6.69z"/>
      </svg>
    );
  }

  if (t.includes("twitter") || t === "x") {
    return (
      <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    );
  }

  return <ExternalLink className="h-4 w-4" />;
}

export function Footer() {
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
  const siteName = general?.website_name || "iLab BD";
  const supportEmail = general?.support_email || "support@ilabbd.com";
  const supportPhone = general?.support_phone || "+880 1896-016252";
  const rawPhone = supportPhone.replace(/[^\d+]/g, "");

  const appDownloadUrl = settings?.download_app?.button_url || "#";

  const dynamicSocials = (settings?.system?.social_media || []).filter(
    (item) => item.name && item.url
  );
  const socialList = dynamicSocials.length > 0 ? dynamicSocials : DEFAULT_SOCIALS;

  return (
    <footer className="bg-[#0b0e14] text-white border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.9fr_0.9fr_1.4fr] lg:gap-8 xl:gap-12">
          
          {/* Column 1: Brand & Mobile App */}
          <div className="flex flex-col items-start">
            <Link to="/" aria-label={`${siteName} Home`} className="inline-block">
              <SiteLogo size="lg" showWordmark={false} />
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-300">
              Practical mobile repairing, technology, and career-focused courses for Bangladeshi learners.
            </p>

            <p className="mt-5 text-sm font-semibold text-white">
              ডাউনলোড করুন আমাদের মোবাইল অ্যাপ
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {/* Google Play Button */}
              <a
                href={appDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2.5 rounded-lg border border-white/20 bg-[#161b22] px-3.5 py-2 transition hover:border-white/40 hover:bg-[#1f2630]"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186A2.21 2.21 0 0 1 3 20.627V3.373c0-.616.23-1.18.609-1.559z" fill="#00C1FF"/>
                  <path d="M17.183 8.61L13.792 12l3.391 3.39 3.826-2.186c.725-.415.725-1.993 0-2.408l-3.826-2.186z" fill="#FFD400"/>
                  <path d="M13.792 12L3.609 1.814c.38-.38.943-.61 1.559-.61.433 0 .866.115 1.258.339l10.757 6.147-3.391 4.31z" fill="#00E676"/>
                  <path d="M13.792 12l3.391 4.31-10.757 6.147c-.392.224-.825.339-1.258.339-.616 0-1.179-.23-1.559-.61L13.792 12z" fill="#FF3D00"/>
                </svg>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400">
                    GET IT ON
                  </span>
                  <span className="mt-0.5 text-xs font-bold text-white group-hover:text-gray-100">
                    Google Play
                  </span>
                </div>
              </a>

              {/* App Store Button */}
              <a
                href={appDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2.5 rounded-lg border border-white/20 bg-[#161b22] px-3.5 py-2 transition hover:border-white/40 hover:bg-[#1f2630]"
              >
                <svg className="h-5 w-5 shrink-0 fill-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76 1.01.08 2.05-.51 2.68-1.26z"/>
                </svg>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[9px] text-gray-400">
                    Download on the
                  </span>
                  <span className="mt-0.5 text-xs font-bold text-white group-hover:text-gray-100">
                    App Store
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* Column 2: Learning & Explore */}
          <div>
            <h4 className="text-base font-bold text-white">Learning</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/courses" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  All Courses
                </Link>
              </li>
              <li>
                <Link to="/courses?free=true" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Free Courses
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Events & Workshops
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Blog & Articles
                </Link>
              </li>
              <li>
                <Link to="/#reviews" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Student Reviews
                </Link>
              </li>
              <li>
                <Link to="/#batch-preview" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Next Batch
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Account (Preserving previous exact Legal items) */}
          <div>
            <h4 className="text-base font-bold text-white">Legal & Account</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/terms" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Student Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/certificates" className="text-sm text-gray-300 transition hover:text-emerald-400">
                  Certificates
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Media & Socials */}
          <div>
            <h4 className="text-base font-bold text-white">আমাদের যোগাযোগ মাধ্যম</h4>
            <div className="mt-4 space-y-2.5 text-sm text-gray-300">
              <p>
                কল করুন:{" "}
                <a
                  href={`tel:${rawPhone}`}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  {supportPhone} (24x7)
                </a>
              </p>
              <p>
                হোয়াটসঅ্যাপ:{" "}
                <a
                  href={`https://wa.me/${rawPhone.replace(/\+/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  {supportPhone} (24x7)
                </a>
              </p>
              <p>
                ইমেইল:{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  {supportEmail}
                </a>
              </p>
              <div>
                <span>পার্টনারশিপের জন্য:</span>
                <a
                  href={`mailto:${supportEmail}`}
                  className="block text-emerald-400 font-semibold hover:underline"
                >
                  {supportEmail}
                </a>
              </div>
            </div>

            {/* Dynamic Social Icons Row */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {socialList.map((social) => (
                <a
                  key={`${social.name}-${social.url}`}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  title={social.name}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white transition hover:bg-emerald-500 hover:text-white"
                >
                  {renderSocialIcon(social.icon || social.name)}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <p>
            Website designed and developed by{" "}
            <a
              href="https://facebook.com/proximait"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white/80 transition hover:text-emerald-400"
            >
              Proxima IT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

