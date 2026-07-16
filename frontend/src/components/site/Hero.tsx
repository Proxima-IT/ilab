import { motion } from "framer-motion";
import { Users, Video, GraduationCap, Download, Youtube, X } from "lucide-react";

import { Link } from "react-router-dom";
import { useState } from "react";
import heroTechnician from "@/assets/hero-technician.jpg";
import type { WebsiteSettings } from "@/services/home.service";
import { imageUrl } from "@/services/course-catalog.service";

export const HERO_YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

function youtubeEmbedUrl(url: string): string {
  const trimmed = url.trim();
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([^?&]+)/);
  const watchMatch = trimmed.match(/[?&]v=([^?&]+)/);
  const shortMatch = trimmed.match(/youtu\.be\/([^?&]+)/);
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([^?&]+)/);
  const id = embedMatch?.[1] || watchMatch?.[1] || shortMatch?.[1] || shortsMatch?.[1] || trimmed;

  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
}

/* ---------------- Sub-components ---------------- */

function HeroCTA({
  onWatch,
  settings,
}: {
  onWatch: () => void;
  settings?: WebsiteSettings["hero"];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25 }}
      className="mt-10 flex flex-col sm:flex-row gap-4"
    >
      <a
        href={settings?.primary_button_url || "#download"}
        className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-md bg-primary text-primary-foreground font-semibold text-base shadow-md hover:brightness-110 active:scale-[0.98] transition"
      >
        <Download className="h-5 w-5" />
        {settings?.primary_button_label || "Download Our App"}
      </a>
      <button
        onClick={onWatch}
        className="group inline-flex cursor-pointer items-center justify-center gap-3 px-8 py-4 rounded-md border-2 border-primary/30 bg-background text-foreground font-semibold text-base hover:border-primary hover:bg-primary hover:text-white active:scale-[0.98] transition"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary-dark transition group-hover:bg-white/20 group-hover:text-white">
          <Youtube className="h-4 w-4" />
        </span>
        {settings?.secondary_button_label || "Watch on YouTube"}
      </button>
    </motion.div>
  );
}

const FALLBACK_STATS = [
  { icon: Users, value: "5,000+", label: "Total Students" },
  { icon: Video, value: "1,200+", label: "Total Videos" },
  { icon: GraduationCap, value: "50+", label: "Total Courses" },
];


function TrustStats({ settings }: { settings?: WebsiteSettings["hero"] }) {
  const stats = (settings?.counts?.length ? settings.counts : FALLBACK_STATS).slice(0, 3);

  return (
    <motion.ul
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.45 }}
      className="mt-14 flex flex-wrap gap-x-12 gap-y-6"
    >
      {stats.map((s, i) => {
        const Icon = FALLBACK_STATS[i]?.icon || Users;

        return (
        <motion.li
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
          className="flex items-center gap-3"
        >
          <Icon className="h-10 w-10 text-primary-dark" strokeWidth={1.5} />
          <span className="text-base leading-tight">
            <span className="block text-2xl font-extrabold text-foreground">{s.value}</span>
            <span className="text-foreground font-bold text-lg">{s.label}</span>
          </span>
        </motion.li>
      )})}
    </motion.ul>
  );
}

function HeroImage({ image }: { image?: string | null }) {
  const src = image ? imageUrl(image) : heroTechnician;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="relative hidden lg:block h-full min-h-[640px]"
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="heroCurve" clipPathUnits="objectBoundingBox">
            <path d="M 0.14,0 C 0.04,0.2 0,0.4 0.07,0.55 C 0.14,0.7 0.04,0.88 0.16,1 L 1,1 L 1,0 Z" />
          </clipPath>
        </defs>
      </svg>
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: "url(#heroCurve)", WebkitClipPath: "url(#heroCurve)" }}
      >
        <img
          src={src}
          alt="Professional mobile repairing technician at work"
          className="h-full w-full object-cover object-center"
          loading="eager"
        />
      </div>


    </motion.div>
  );
}

/* ---------------- Main Hero ---------------- */

export function Hero({ settings }: { settings?: WebsiteSettings["hero"] }) {
  const [showVideo, setShowVideo] = useState(false);
  const heroImageSrc = settings?.image ? imageUrl(settings.image) : heroTechnician;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-surface/30 pt-20 md:pt-24">
      <div className="lg:grid lg:grid-cols-2 lg:min-h-[680px]">
        {/* Left content */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-16 py-12 md:py-16 lg:py-20 flex items-center">
          <div className="w-full max-w-xl mx-auto lg:mx-0 lg:ml-auto lg:mr-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-extrabold tracking-tight text-foreground leading-[1.05]"
            >
              {settings?.title_line_1 || "Learn Mobile Repairing."}
              <br />
              {settings?.title_line_2 || "Build a Real Career."}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-6 text-lg text-muted-foreground max-w-md"
            >
              {settings?.description ||
                "Job-ready skills, expert instructors, and certified training to help you get hired or start your own business."}
            </motion.p>

            <HeroCTA settings={settings} onWatch={() => setShowVideo(true)} />
            <TrustStats settings={settings} />
          </div>
        </div>

        {/* Right image */}
        <HeroImage image={settings?.image} />

        {/* Mobile image fallback */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:hidden px-4 sm:px-6 pb-12 md:pb-20"
        >
          <div className="relative rounded-2xl overflow-hidden aspect-[16/10] shadow-card">
            <img
              src={heroImageSrc}
              alt="Professional mobile repairing technician at work"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>

      <VideoModal
        open={showVideo}
        onClose={() => setShowVideo(false)}
        youtubeUrl={settings?.youtube_url || HERO_YOUTUBE_URL}
        title="iLab YouTube video"
      />
    </section>
  );
}

export function VideoModal({
  open,
  onClose,
  youtubeUrl = HERO_YOUTUBE_URL,
  title = "YouTube video",
}: {
  open: boolean;
  onClose: () => void;
  youtubeUrl?: string;
  title?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm grid place-items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 grid place-items-center h-9 w-9 rounded-full bg-white/95 text-foreground hover:scale-110 transition"
        >
          <X className="h-4 w-4" />
        </button>
        <iframe
          src={youtubeEmbedUrl(youtubeUrl)}
          title={title}
          className="h-full w-full object-cover"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </motion.div>
    </div>
  );
}
