import { motion } from "framer-motion";
import { Play, Users, Video, GraduationCap, Download, Youtube, X } from "lucide-react";

import { Link } from "react-router-dom";
import { useState } from "react";
import heroTechnician from "@/assets/hero-technician.jpg";

/* ---------------- Sub-components ---------------- */

function HeroCTA({ onWatch }: { onWatch: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25 }}
      className="mt-10 flex flex-col sm:flex-row gap-4"
    >
      <a
        href="#download"
        className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-md bg-primary text-primary-foreground font-semibold text-base shadow-md hover:brightness-110 active:scale-[0.98] transition"
      >
        <Download className="h-5 w-5" />
        Download Our App
      </a>
      <button
        onClick={onWatch}
        className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-md border-2 border-primary/30 bg-background text-foreground font-semibold text-base hover:border-primary-dark hover:bg-primary-dark hover:text-primary-foreground transition"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary-dark group-hover:bg-primary-foreground/20">
          <Youtube className="h-4 w-4" />
        </span>
        Watch on YouTube
      </button>
    </motion.div>
  );
}

const STATS = [
  { icon: Users, value: "5,000+", label: "Total Students" },
  { icon: Video, value: "1,200+", label: "Total Videos" },
  { icon: GraduationCap, value: "50+", label: "Total Courses" },
];


function TrustStats() {
  return (
    <motion.ul
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.45 }}
      className="mt-14 flex flex-wrap gap-x-12 gap-y-6"
    >
      {STATS.map((s, i) => (
        <motion.li
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
          className="flex items-center gap-3"
        >
          <s.icon className="h-10 w-10 text-primary-dark" strokeWidth={1.5} />
          <span className="text-base leading-tight">
            <span className="block text-2xl font-extrabold text-foreground">{s.value}</span>
            <span className="text-foreground font-bold text-lg">{s.label}</span>
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

function HeroImage() {
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
          src={heroTechnician}
          alt="Professional mobile repairing technician at work"
          className="h-full w-full object-cover object-center"
          loading="eager"
        />
      </div>


    </motion.div>
  );
}

/* ---------------- Main Hero ---------------- */

export function Hero() {
  const [showVideo, setShowVideo] = useState(false);

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
              Learn Mobile Repairing.
              <br />
              Build a Real Career.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-6 text-lg text-muted-foreground max-w-md"
            >
              Job-ready skills, expert instructors, and certified training to help
              you get hired or start your own business.
            </motion.p>

            <HeroCTA onWatch={() => setShowVideo(true)} />
            <TrustStats />
          </div>
        </div>

        {/* Right image */}
        <HeroImage />

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
              src={heroTechnician}
              alt="Professional mobile repairing technician at work"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>

      <VideoModal open={showVideo} onClose={() => setShowVideo(false)} />
    </section>
  );
}

export function VideoModal({
  open,
  onClose,
  src,
}: {
  open: boolean;
  onClose: () => void;
  src?: string;
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
        <video
          src={
            src ??
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          }
          autoPlay
          controls
          className="h-full w-full object-cover"
        />
      </motion.div>
    </div>
  );
}
