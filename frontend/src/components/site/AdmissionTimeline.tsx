import { motion } from "framer-motion";
import {
  CalendarCheck,
  CalendarClock,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import type { WebsiteSettings } from "@/services/home.service";

const FALLBACK_YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

export function AdmissionTimeline({ settings }: { settings?: WebsiteSettings["next_batch_schedule"] }) {
  const eyebrow = settings?.eyebrow || "Next Batch";
  const title = settings?.title || "Upcoming practical batch schedule";
  const courseInfo =
    settings?.course_info ||
    "Join the next practical batch with expert guidance and hands-on learning.";
  const demoButtonLabel = settings?.demo_button_label || "View Demo Class";
  const demoUrl = settings?.demo_url || FALLBACK_YOUTUBE_URL;

  const openDemoClass = () => {
    window.open(demoUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-surface/30 py-20 md:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Next Batch Schedule
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground md:text-lg">
            {eyebrow}
          </p>
          <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-gradient-to-r from-primary to-accent" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="group relative"
        >
          <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-primary/15 via-transparent to-accent/15 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />

          <div className="relative rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-glow md:px-10 md:py-10">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr_auto] lg:items-center">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success/10 ring-1 ring-success/20">
                  <CalendarCheck className="h-4 w-4 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Batch Title
                  </p>
                  <p className="line-clamp-2 text-sm font-bold text-foreground">
                    {title}
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex items-start gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/10 ring-1 ring-warning/20">
                  <CalendarClock className="h-4 w-4 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Course Info
                  </p>
                  <p className="line-clamp-3 text-sm font-medium leading-6 text-foreground">
                    {courseInfo}
                  </p>
                </div>
              </motion.div>

              <motion.button
                type="button"
                onClick={openDemoClass}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl gradient-teal px-7 py-4 text-base font-bold text-primary-foreground shadow-glow transition-all hover:shadow-orange-glow"
              >
                <PlayCircle className="h-5 w-5 shrink-0" />
                {demoButtonLabel}
                <Sparkles className="h-4 w-4 shrink-0" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
