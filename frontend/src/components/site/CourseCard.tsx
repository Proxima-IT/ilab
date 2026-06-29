import { Link } from "react-router-dom";
import { Star, Clock, Users, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const TAKA_SIGN = "\u09F3";

type CourseCardCourse = {
  id: string | number;
  slug: string;
  title: string;
  instructor?: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced" | string;
  mode: "Online" | "Offline" | string;
  rating: number;
  students: number;
  hours: number;
  lessons: number;
  price: number;
  originalPrice?: number;
  tag?: string;
  cover: string;
};

export function CourseCard({
  course,
  index = 0,
}: {
  course: CourseCardCourse;
  index?: number;
}) {
  const detailsPath = `/courses/${course.slug}`;
  const enrollPath = `/enroll/${course.slug}`;
  const format = course.level === "Beginner" ? "Recorded" : "Live";

  const levelBadge =
    course.level === "Beginner"
      ? "bg-emerald-100 text-emerald-700"
      : course.level === "Intermediate"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
      className="group flex h-full flex-col rounded-2xl overflow-hidden bg-card border border-border hover:shadow-card hover:-translate-y-1 transition-all"
    >
      <Link to={detailsPath} className="relative aspect-[16/10] overflow-hidden block">
        <img
          src={course.cover}
          alt={course.title}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {course.tag && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold gradient-orange text-white">
            {course.tag}
          </span>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider">
          {course.category}
        </p>

        <Link
          to={detailsPath}
          className="mt-2 text-base font-bold text-foreground line-clamp-2 group-hover:text-primary-dark transition-colors min-h-[3rem]"
        >
          {course.title}
        </Link>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${levelBadge}`}>
            {course.level}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700">
            {course.mode}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-100 text-violet-700">
            {format}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {course.rating > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <strong className="text-foreground">{course.rating}</strong>
            </span>
          )}
          {course.students > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {course.students.toLocaleString()}
            </span>
          )}
          {course.hours > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {course.hours}h
            </span>
          )}
          {course.lessons > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> {course.lessons}
            </span>
          )}
        </div>

        <div className="mt-auto pt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-foreground">
              {TAKA_SIGN}{course.price.toLocaleString()}
            </p>
            {course.originalPrice && (
              <p className="text-xs text-muted-foreground line-through">
                {TAKA_SIGN}{course.originalPrice.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={detailsPath}
              className="px-5 py-2.5 rounded-full text-sm font-bold border-2 border-primary/30 text-primary-dark hover:bg-primary/5 transition-colors"
            >
              View
            </Link>
            <Link
              to={enrollPath}
              className="px-5 py-2.5 rounded-full text-sm font-bold gradient-orange text-white shadow-orange-glow hover:scale-105 transition-transform"
            >
              Enroll
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}


