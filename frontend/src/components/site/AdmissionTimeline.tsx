import { motion } from "framer-motion";
import {
  CalendarCheck,
  CalendarClock,
  BookOpen,
  PlayCircle,
  ArrowRight,
} from "lucide-react";

export function AdmissionTimeline() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-surface/30 py-20 md:py-28">
      {/* Background decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-primary/6 blur-[120px] animate-float-slow" />
        <div className="absolute -bottom-32 -right-20 h-[380px] w-[380px] rounded-full bg-accent/6 blur-[120px] animate-float-slow-reverse" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/4 blur-[100px] animate-blob" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
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
            Reserve your seat before enrollment closes.
          </p>
          <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-gradient-to-r from-primary to-accent" />
        </motion.div>

        {/* Floating schedule card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="group relative"
        >
          {/* Hover glow ring */}
          <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-primary/15 via-transparent to-accent/15 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />

          <div className="relative rounded-3xl border border-border/70 bg-card px-6 py-8 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-glow md:px-10 md:py-10">
            {/* Subtle top accent line */}
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:gap-8">
              {/* Left — Enrollment dates (compact landscape) */}
              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-stretch">
                {/* Enrollment Starts */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-1 items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success/10 ring-1 ring-success/20">
                    <CalendarCheck className="h-4 w-4 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Enrollment Starts
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      September 10, 2026
                    </p>
                    <p className="text-[11px] font-medium text-success">
                      Applications Open
                    </p>
                  </div>
                </motion.div>

                {/* Vertical divider */}
                <div className="hidden h-auto w-px bg-gradient-to-b from-transparent via-border to-transparent sm:block" />

                {/* Enrollment Ends */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-1 items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warning/10 ring-1 ring-warning/20">
                    <CalendarClock className="h-4 w-4 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Enrollment Ends
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      September 24, 2026
                    </p>
                    <p className="text-[11px] font-medium text-warning">
                      Limited Seats Available
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Horizontal divider on tablet */}
              <div className="hidden h-10 w-px bg-gradient-to-b from-transparent via-border to-transparent lg:block" />

              {/* Center — Quick actions (bigger) */}
              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <motion.a
                  href="#demo"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-base font-semibold text-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary hover:shadow-md"
                >
                  <PlayCircle className="h-5 w-5 shrink-0" />
                  View Demo Class
                </motion.a>
                <motion.a
                  href="#outline"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-base font-semibold text-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary hover:shadow-md"
                >
                  <BookOpen className="h-5 w-5 shrink-0" />
                  Course Outline
                </motion.a>
              </div>

              {/* Right — Primary CTA (bigger) */}
              <div className="lg:shrink-0">
                <motion.a
                  href="#enroll"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="animate-pulse-glow relative inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-teal px-8 py-4 text-base font-bold text-primary-foreground shadow-glow transition-all hover:shadow-orange-glow sm:w-auto"
                >
                  Enroll Now
                  <ArrowRight className="h-5 w-5 shrink-0" />
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
