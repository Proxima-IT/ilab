import { motion } from "framer-motion";
import {
  CalendarCheck,
  CalendarX,
  FileText,
  PlayCircle,
} from "lucide-react";
import type { WebsiteSettings } from "@/services/home.service";

function deriveEnrollUrl(courseUrl: string): string {
  const fallback = "/courses";

  if (!courseUrl.trim()) return fallback;

  try {
    const url = new URL(courseUrl, window.location.origin);
    url.pathname = url.pathname.replace(/^\/courses\//, "/enroll/");
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : url.toString();
  } catch {
    return courseUrl.startsWith("/courses/")
      ? courseUrl.replace(/^\/courses\//, "/enroll/")
      : fallback;
  }
}

export function AdmissionTimeline({ settings }: { settings?: WebsiteSettings["next_batch_schedule"] }) {
  const title = settings?.title || "Next Batch Schedule";
  const enrollmentStart = settings?.enrollment_start_date || "September 10, 2026";
  const enrollmentEnd = settings?.enrollment_end_date || "September 24, 2026";
  const demoButtonLabel = settings?.demo_button_label || "View Demo Class";
  const demoUrl = settings?.demo_url?.trim() || "";
  const courseUrl = settings?.course_url || "/courses";
  const enrollUrl = deriveEnrollUrl(courseUrl);
  const hasDemoUrl = Boolean(demoUrl);

  const openDemoClass = () => {
    if (!hasDemoUrl) return;
    window.open(demoUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-surface/30 py-16 md:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl lg:text-4xl">
            {title}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="relative rounded-3xl border border-border bg-white px-4 py-5 shadow-card sm:px-6 md:px-8">
            <div className="rounded-2xl bg-primary/5 px-4 py-5 sm:px-6">
              <div className="grid items-center gap-5 lg:grid-cols-[1fr_1fr_auto]">
                <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
                  <ScheduleDate
                    icon={<CalendarCheck className="h-4 w-4 text-primary" />}
                    iconTone="bg-emerald-50"
                    label="Enrollment Start"
                    value={enrollmentStart}
                  />
                  <ScheduleDate
                    icon={<CalendarX className="h-4 w-4 text-accent" />}
                    iconTone="bg-orange-50"
                    label="Enrollment End"
                    value={enrollmentEnd}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                  <button
                    type="button"
                    onClick={openDemoClass}
                    disabled={!hasDemoUrl}
                    className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-primary/30 bg-white px-4 text-xs font-bold text-primary-dark transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-primary-dark"
                  >
                    <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                    {demoButtonLabel}
                  </button>
                  <a
                    href={courseUrl}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-primary/30 bg-white px-4 text-xs font-bold text-primary-dark transition hover:bg-primary hover:text-white"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Course Outline
                  </a>
                  <a
                    href={enrollUrl}
                    className="inline-flex h-10 items-center justify-center rounded-full gradient-orange px-5 text-xs font-bold text-white shadow-orange-glow transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Enroll Now!
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ScheduleDate({
  icon,
  iconTone,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconTone: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${iconTone}`}>
        {icon}
      </span>
      <div>
        <p className="text-sm font-extrabold leading-tight text-foreground md:text-base">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
