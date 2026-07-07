import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  ShoppingBag,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudent } from "@/hooks/useStudentData";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function formatHours(hours: number): string {
  if (!hours) return "0h";
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
}

export default function MyCoursesPage() {
  const { t } = useLanguage();
  const { student, enrolledCoursesList, loading } = useStudent();

  if (loading || !student) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-72 rounded-2xl border border-border/30 bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  if (enrolledCoursesList.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[calc(100vh-140px)] grid place-items-center"
      >
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingBag className="h-8 w-8" />
          </div>

          <h1 className="font-display text-2xl text-foreground">
            No courses yet
          </h1>

          <p className="mt-3 font-ui text-sm leading-6 text-muted-foreground">
            After you enroll in a course, it will appear here with your lessons
            and progress.
          </p>

          <Link
            to="/courses"
            className="glass-button mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-xs"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Browse Courses
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl text-foreground">
            {t("allMyCourses")}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {enrolledCoursesList.length} enrolled course
            {enrolledCoursesList.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enrolledCoursesList.map((enrollment, index) => {
          const course = enrollment.course;
          const continueTo = enrollment.firstLessonId
            ? `/dashboard/player/${course.slug}/${enrollment.firstLessonId}`
            : null;

          return (
            <motion.article
              key={enrollment.enrollmentId}
              variants={item}
              whileHover={{ y: -6, scale: 1.01 }}
              className="glass-card overflow-hidden"
            >
              <div className="relative h-36 overflow-hidden bg-secondary">
                <img
                  src={course.cover}
                  alt={course.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />

                {enrollment.progress === 100 && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2 py-1 font-ui text-[10px] text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    {t("completed")}
                  </div>
                )}

                <svg
                  className="absolute bottom-3 right-3 h-11 w-11"
                  viewBox="0 0 36 36"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="3"
                  />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="3"
                    strokeDasharray={`${enrollment.progress} ${
                      100 - enrollment.progress
                    }`}
                    strokeDashoffset="25"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 100" }}
                    whileInView={{
                      strokeDasharray: `${enrollment.progress} ${
                        100 - enrollment.progress
                      }`,
                    }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                  <text
                    x="18"
                    y="20"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8"
                    fontFamily="JetBrains Mono"
                  >
                    {enrollment.progress}%
                  </text>
                </svg>
              </div>

              <div className="p-4">
                <h3 className="line-clamp-2 font-ui text-sm font-semibold text-foreground">
                  {course.title}
                </h3>
                <p className="mt-1 font-ui text-xs text-muted-foreground">
                  {course.instructor}
                </p>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${enrollment.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1 font-mono">
                    <BookOpen className="h-3 w-3" />
                    <span>
                      {enrollment.completedLessons}/{enrollment.totalLessons}{" "}
                      {t("lecturesCompleted")}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{formatHours(enrollment.totalHours)}</span>
                  </div>
                </div>

                {continueTo ? (
                  <Link to={continueTo}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      className="glass-button mt-4 flex w-full items-center justify-center gap-1.5 py-2 text-xs"
                    >
                      <Play className="h-3 w-3" />
                      {enrollment.progress >= 100 ? "Review Course" : t("continue")}
                    </motion.button>
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="glass-button mt-4 flex w-full cursor-not-allowed items-center justify-center gap-1.5 py-2 text-xs opacity-60"
                  >
                    <Clock className="h-3 w-3" />
                    Classes not added yet
                  </button>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.div>
  );
}
