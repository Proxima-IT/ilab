import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  HelpCircle,
  Lock,
  PlayCircle,
  Radio,
  ShieldCheck,
  Star,
  Users,
  Video,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CourseCard } from "@/components/site/CourseCard";
import {
  fetchPublicCourseBySlug,
  fetchPublicCourses,
  type Course,
  type CourseLessonType,
  type PublicCourseDetails,
} from "@/services/course-catalog.service";
import { applyJsonLd, applySeo, breadcrumbSchema, siteUrl } from "@/lib/seo";

const TAKA_SIGN = "\u09F3";

export default function CourseDetailsPage() {
  const { slug } = useParams();
  const [course, setCourse] = useState<PublicCourseDetails | null>(null);
  const [related, setRelated] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!slug) return;

    const courseSlug = slug;
    let cancelled = false;

    async function loadCourse() {
      setLoading(true);
      setErrorMessage("");

      try {
        const courseResponse = await fetchPublicCourseBySlug(courseSlug);
        const relatedResponse = await fetchPublicCourses({
          categoryId: courseResponse.categoryId,
          perPage: 4,
        });

        if (cancelled) return;

        setCourse(courseResponse);
        setRelated(
          relatedResponse.items
            .filter((item) => item.slug !== courseResponse.slug)
            .slice(0, 3)
        );
        applyCourseSeo(courseResponse);
      } catch (error: any) {
        if (!cancelled) {
          setCourse(null);
          setErrorMessage(
            error?.response?.data?.message || "Course details could not load."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCourse();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[70vh] grid place-items-center pt-24">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  if (errorMessage || !course) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[70vh] grid place-items-center px-4 pt-24 text-center">
          <div>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-500">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Course not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {errorMessage || "The course you are looking for is unavailable."}
            </p>
            <Link
              to="/courses"
              className="mt-5 inline-flex items-center gap-2 rounded-full gradient-orange px-5 py-2.5 text-sm font-bold text-white"
            >
              <ChevronLeft className="h-4 w-4" /> Browse courses
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <CourseHero course={course} />

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-14 min-w-0 text-left">
            <CourseOverview course={course} />
            <CurriculumAccordion course={course} />
            <Requirements items={course.prerequisites} />
            <InstructorSection course={course} />
            <CertificateSection course={course} />
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <EnrollmentCard course={course} />
            </div>
          </aside>
        </div>

        {related.length > 0 && <RelatedCourses items={related} />}
      </div>

      <Footer />
      <StickyMobileCTA course={course} />
    </main>
  );
}

function seoDescription(course: PublicCourseDetails): string {
  const plain = course.description.replace(/<[^>]*>/g, '').trim();
  if (plain.length > 155) return `${plain.slice(0, 152)}...`;
  return plain || `Learn ${course.title} at iLab BD.`;
}

function applyCourseSeo(course: PublicCourseDetails) {
  const title = `${course.title} | iLab BD`;
  const description = seoDescription(course);
  const url = siteUrl(`/courses/${course.slug}`);

  applySeo({
    title,
    description,
    path: `/courses/${course.slug}`,
    image: course.cover,
  });

  applyJsonLd("page-json-ld", [
    breadcrumbSchema([
      { name: "Home", url: siteUrl("/") },
      { name: "Courses", url: siteUrl("/courses") },
      { name: course.title, url },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description,
      image: course.cover,
      url,
      provider: {
        "@type": "Organization",
        name: "iLab BD",
        url: siteUrl("/"),
      },
      offers: {
        "@type": "Offer",
        price: course.price,
        priceCurrency: "BDT",
        availability: "https://schema.org/InStock",
        url,
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: course.mode,
        inLanguage: course.language,
      },
    },
  ]);
}

function youtubeEmbedUrl(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  const watchMatch = trimmed.match(/[?&]v=([^&]+)/);
  const shortMatch = trimmed.match(/youtu\.be\/([^?&]+)/);
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([^?&]+)/);
  const id = watchMatch?.[1] || shortMatch?.[1] || embedMatch?.[1] || trimmed;

  if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;

  return `https://www.youtube.com/embed/${id}`;
}

function CourseHero({ course }: { course: PublicCourseDetails }) {
  const [playing, setPlaying] = useState(false);
  const enrollPath = `/enroll/${course.slug}`;
  const embedUrl = youtubeEmbedUrl(course.introVideo);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.205_0.04_257)] via-[oklch(0.25_0.05_240)] to-[oklch(0.18_0.04_220)] pt-28 pb-12 text-white md:pt-36 md:pb-16">
      <div className="absolute inset-0 opacity-25 [background:radial-gradient(60%_50%_at_70%_20%,oklch(0.50_0.18_195),transparent_60%),radial-gradient(40%_40%_at_20%_80%,#F76A21,transparent_70%)]" />

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center justify-center gap-1.5 text-xs text-white/60">
          <Link to="/" className="hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/courses" className="hover:text-white">Courses</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-white/90">{course.category}</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              {course.category}
            </span>
            {course.tag && (
              <span className="rounded-full gradient-orange px-3 py-1 text-xs font-bold">
                {course.tag}
              </span>
            )}
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              {course.level}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              {course.mode}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {course.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 md:text-lg">
            {course.description || "Build practical skills with a structured iLab course."}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-white">
            {course.students > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {course.students.toLocaleString()} enrolled
              </span>
            )}
            {course.hours > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {course.hours}h
              </span>
            )}
            {course.lessons > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" /> {course.lessons} lessons
              </span>
            )}
            {course.language && (
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> {course.language}
              </span>
            )}
            {course.updatedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Updated {formatMonthYear(course.updatedAt)}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm text-white/70">
            Created by <span className="font-semibold text-white">{course.instructor}</span>
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to={enrollPath}
              className="inline-flex items-center justify-center gap-2 rounded-full gradient-orange px-7 py-3.5 text-sm font-bold shadow-orange-glow transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Enroll Now - {TAKA_SIGN}{course.price.toLocaleString()}
            </Link>
            {embedUrl && (
              <button
                onClick={() => setPlaying(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
              >
                <PlayCircle className="h-5 w-5" /> Preview Course
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="relative mx-auto mt-10 aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-2xl"
        >
          {playing && embedUrl ? (
            <iframe
              src={`${embedUrl}?autoplay=1&rel=0`}
              title={`${course.title} preview video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <button
              onClick={() => embedUrl && setPlaying(true)}
              className="group relative block h-full w-full"
            >
              <img src={course.cover} alt={course.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              {embedUrl && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-white/95 text-foreground shadow-2xl transition-transform group-hover:scale-110">
                    <PlayCircle className="h-10 w-10" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-medium text-white">
                <span className="rounded-full bg-black/60 px-3 py-1 backdrop-blur">
                  {embedUrl ? "Free intro preview" : "Course preview"}
                </span>
                {(course.hours > 0 || course.lessons > 0) && (
                  <span className="rounded-full bg-black/60 px-3 py-1 backdrop-blur">
                    {[course.hours > 0 ? `${course.hours}h` : null, course.lessons > 0 ? `${course.lessons} lessons` : null]
                      .filter(Boolean)
                      .join(" - ")}
                  </span>
                )}
              </div>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function EnrollmentCard({ course }: { course: PublicCourseDetails }) {
  const discount = course.originalPrice
    ? Math.round(100 - (course.price / course.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      id="enroll"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-card"
    >
      <div className="relative aspect-video">
        <img src={course.cover} alt={course.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 grid place-items-center bg-black/30">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-foreground">
            <PlayCircle className="h-7 w-7" />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-end gap-3">
          <span className="text-3xl font-extrabold text-foreground">
            {TAKA_SIGN}{course.price.toLocaleString()}
          </span>
          {course.originalPrice && (
            <>
              <span className="text-base text-muted-foreground line-through">
                {TAKA_SIGN}{course.originalPrice.toLocaleString()}
              </span>
              <span className="ml-auto rounded-full gradient-orange px-2.5 py-1 text-xs font-bold text-white">
                {discount}% OFF
              </span>
            </>
          )}
        </div>

        <Link
          to={`/enroll/${course.slug}`}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full gradient-orange py-3.5 text-sm font-bold text-white shadow-orange-glow transition-transform hover:scale-[1.02] active:scale-[0.99]"
        >
          Enroll Now
        </Link>

        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success" /> Secure enrollment with course access after payment.
        </p>

        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm font-bold text-foreground">This course includes</p>
          <ul className="mt-3 space-y-2.5 text-sm text-foreground/85">
            {course.hours > 0 && <CourseInclude icon={<Video className="h-4 w-4" />} label={`${course.hours} hours of lessons`} />}
            {course.lessons > 0 && <CourseInclude icon={<BookOpen className="h-4 w-4" />} label={`${course.lessons} structured lessons`} />}
            <CourseInclude icon={<Award className="h-4 w-4" />} label="Certificate after completion" />
            <CourseInclude icon={<Globe className="h-4 w-4" />} label={`Language: ${course.language}`} />
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function CourseInclude({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span>{label}</span>
    </li>
  );
}

function CourseOverview({ course }: { course: PublicCourseDetails }) {
  const outcomes = useMemo(
    () =>
      course.learningOutcomes.length > 0
        ? course.learningOutcomes
        : [
            `Understand the core concepts of ${course.category}.`,
            "Follow a structured curriculum from basics to practical work.",
            "Build confidence through organized lessons and resources.",
            "Prepare for hands-on practice and real learning outcomes.",
          ],
    [course.category, course.learningOutcomes]
  );

  return (
    <Section eyebrow="Overview" title="What you will learn">
      <div className="grid gap-3.5 sm:grid-cols-2">
        {outcomes.map((outcome, index) => (
          <motion.div
            key={outcome}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-card"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Check className="h-4 w-4" />
            </span>
            <p className="text-sm leading-relaxed text-foreground">{outcome}</p>
          </motion.div>
        ))}
      </div>

      {course.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {course.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-dark">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Section>
  );
}

function CurriculumAccordion({ course }: { course: PublicCourseDetails }) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(course.sections[0]?.id ? [course.sections[0].id] : [])
  );

  const totalLessons = course.sections.reduce(
    (total, section) => total + section.lessons.length,
    0
  );

  const toggle = (id: string) => {
    setOpenSections((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Section eyebrow="Curriculum" title="Course curriculum">
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span>{course.sections.length} sections</span>
        <span>{totalLessons} lessons</span>
        {course.hours > 0 && <span>{course.hours}h total</span>}
        {course.sections.length > 0 && (
          <button
            onClick={() => setOpenSections(new Set(course.sections.map((section) => section.id)))}
            className="ml-auto font-semibold text-primary hover:text-primary-dark"
          >
            Expand all
          </button>
        )}
      </div>

      {course.sections.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Curriculum will be published soon.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
          {course.sections.map((section) => {
            const open = openSections.has(section.id);

            return (
              <div key={section.id}>
                <button
                  onClick={() => toggle(section.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-surface/60"
                >
                  <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </motion.span>
                  <span className="flex-1 font-semibold text-foreground">{section.title}</span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {section.lessons.length} lessons
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden bg-surface/30"
                    >
                      <ul className="px-5 pb-3">
                        {section.lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="group flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0"
                          >
                            <LessonTypeIcon type={lesson.type} />
                            <span className="flex-1 truncate text-sm text-foreground">{lesson.title}</span>
                            {lesson.isFree ? (
                              <span className="text-xs font-semibold text-primary">Preview</span>
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                              {lesson.duration}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function LessonTypeIcon({ type }: { type: CourseLessonType }) {
  const className = "h-4 w-4 shrink-0 text-primary";
  if (type === "pdf") return <FileText className={className} />;
  if (type === "quiz") return <HelpCircle className={className} />;
  if (type === "live") return <Radio className={`${className} text-accent`} />;
  return <PlayCircle className={className} />;
}

function Requirements({ items }: { items: string[] }) {
  return (
    <Section eyebrow="Prerequisites" title="Requirements">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No special requirements. Start with curiosity and commitment.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-foreground/90">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function InstructorSection({ course }: { course: PublicCourseDetails }) {
  const hasStats = course.instructorCoursesCount > 0 || course.instructorStudentsCount > 0;

  if (!course.instructor && !course.instructorAvatar && !course.instructorBio && !hasStats) {
    return null;
  }

  return (
    <Section eyebrow="Your mentor" title="Meet your instructor">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row">
          {course.instructorAvatar && (
            <img
              src={course.instructorAvatar}
              alt={course.instructor || "Instructor"}
              className="h-24 w-24 shrink-0 rounded-2xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            {course.instructor && (
              <h3 className="text-xl font-bold text-foreground">{course.instructor}</h3>
            )}

            {hasStats && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/90">
                {course.instructorCoursesCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {course.instructorCoursesCount.toLocaleString()} courses
                  </span>
                )}
                {course.instructorStudentsCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    {course.instructorStudentsCount.toLocaleString()} students
                  </span>
                )}
              </div>
            )}

            {course.instructorBio && (
              <p className="mt-4 text-sm leading-relaxed text-foreground/85">
                {course.instructorBio}
              </p>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

function CertificateSection({ course }: { course: PublicCourseDetails }) {
  return (
    <Section eyebrow="Certification" title="Earn a certificate">
      <div className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-card lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="grid h-12 w-12 place-items-center rounded-xl gradient-teal text-white shadow-glow">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-xl font-bold text-foreground">Complete the course and show your achievement.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            After completing {course.title}, you can use your iLab certificate as proof of learning.
          </p>
        </div>
        <Link
          to={`/enroll/${course.slug}`}
          className="inline-flex items-center justify-center rounded-full gradient-orange px-6 py-3 text-sm font-bold text-white shadow-orange-glow"
        >
          Enroll & Earn Certificate
        </Link>
      </div>
    </Section>
  );
}

function RelatedCourses({ items }: { items: Course[] }) {
  return (
    <section className="mt-20">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">More to explore</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">Related courses</h2>
        </div>
        <Link to="/courses" className="hidden text-sm font-semibold text-primary hover:text-primary-dark sm:inline-flex">
          View all
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <CourseCard key={item.id} course={item} index={index} />
        ))}
      </div>
    </section>
  );
}

function StickyMobileCTA({ course }: { course: PublicCourseDetails }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-card/95 p-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur lg:hidden">
      <div className="min-w-0">
        <p className="text-base font-extrabold leading-none text-foreground">
          {TAKA_SIGN}{course.price.toLocaleString()}
        </p>
        {course.originalPrice && (
          <p className="text-xs text-muted-foreground line-through">
            {TAKA_SIGN}{course.originalPrice.toLocaleString()}
          </p>
        )}
      </div>
      <Link
        to={`/enroll/${course.slug}`}
        className="inline-flex flex-1 items-center justify-center rounded-full gradient-orange py-3 text-sm font-bold text-white shadow-orange-glow"
      >
        Enroll Now
      </Link>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-28">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function formatMonthYear(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
