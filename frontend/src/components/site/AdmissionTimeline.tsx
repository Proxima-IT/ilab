import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  Clock,
  PlayCircle,
  UserRound,
} from "lucide-react";
import {
  fetchPublicCourses,
  type Course,
} from "@/services/course-catalog.service";

const TAKA_SIGN = "\u09F3";

function formatDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(course: Course) {
  if (course.price <= 0) return "Free";

  return `${TAKA_SIGN}${course.price.toLocaleString()}`;
}

export function AdmissionTimeline() {
  const [latestCourse, setLatestCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    fetchPublicCourses({ sort: "newest", perPage: 1 })
      .then((response) => {
        if (alive) setLatestCourse(response.items[0] ?? null);
      })
      .catch(() => {
        if (alive) setLatestCourse(null);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const courseDetailPath = latestCourse ? `/courses/${latestCourse.slug}` : "/courses";
  const enrollPath = latestCourse ? `/enroll/${latestCourse.slug}` : "/courses";

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
            Reserve your seat for the newest published course.
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

            <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:gap-8">
              <div className="flex flex-1 flex-col gap-4 xl:flex-row xl:items-stretch">
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-1 items-center gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success/10 ring-1 ring-success/20">
                    <CalendarCheck className="h-4 w-4 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Latest Published Course
                    </p>
                    {isLoading ? (
                      <div className="mt-1 h-5 w-44 rounded bg-muted animate-pulse" />
                    ) : (
                      <p className="line-clamp-1 text-sm font-bold text-foreground">
                        {latestCourse?.title || "No course published yet"}
                      </p>
                    )}
                    <p className="text-[11px] font-medium text-success">
                      {latestCourse ? `${latestCourse.category} Course` : "Publish a course to show it here"}
                    </p>
                  </div>
                </motion.div>

                <div className="hidden h-auto w-px bg-gradient-to-b from-transparent via-border to-transparent xl:block" />

                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-1 items-center gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/10 ring-1 ring-warning/20">
                    <CalendarClock className="h-4 w-4 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Course Info
                    </p>
                    {isLoading ? (
                      <div className="mt-1 h-5 w-36 rounded bg-muted animate-pulse" />
                    ) : latestCourse ? (
                      <>
                        <p className="text-sm font-bold text-foreground">
                          {formatPrice(latestCourse)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-warning">
                          {latestCourse.instructor && (
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="h-3 w-3" />
                              {latestCourse.instructor}
                            </span>
                          )}
                          {latestCourse.hours > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {latestCourse.hours}h
                            </span>
                          )}
                          {latestCourse.lessons > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {latestCourse.lessons} lessons
                            </span>
                          )}
                          <span>{formatDate(latestCourse.createdAt)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-foreground">No data available</p>
                        <p className="text-[11px] font-medium text-warning">
                          Add a published course first
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>

              <div className="hidden h-10 w-px bg-gradient-to-b from-transparent via-border to-transparent lg:block" />

              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <motion.button
                  type="button"
                  onClick={() => {
                    document.getElementById("batch-preview")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-base font-semibold text-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary hover:shadow-md"
                >
                  <PlayCircle className="h-5 w-5 shrink-0" />
                  View Demo Class
                </motion.button>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={courseDetailPath}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-base font-semibold text-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary hover:shadow-md"
                  >
                    <BookOpen className="h-5 w-5 shrink-0" />
                    Course Outline
                  </Link>
                </motion.div>
              </div>

              <div className="lg:shrink-0">
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to={enrollPath}
                    className="animate-pulse-glow relative inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-teal px-8 py-4 text-base font-bold text-primary-foreground shadow-glow transition-all hover:shadow-orange-glow sm:w-auto"
                  >
                    Enroll Now
                    <ArrowRight className="h-5 w-5 shrink-0" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
