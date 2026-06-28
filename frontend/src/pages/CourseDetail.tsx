import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Users, Clock, BookOpen, Globe, Calendar, ChevronDown, ChevronRight,
  PlayCircle, FileText, HelpCircle, Radio, Lock, Check, Heart, ShieldCheck,
  Award, Smartphone, Download, Infinity as InfinityIcon, Video, Sparkles,
  Trophy, GraduationCap, Quote,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CourseCard } from "@/components/site/CourseCard";
import { fetchCourseBySlug, fetchCourses, type CourseDetails, type LessonType } from "@/services/courses";
import { formatDate } from "@/lib/utils";
import { useCountdown } from "@/hooks/use-countdown";
import { IncludeIcon } from "@/components/site/IncludeIcon";

export default function CourseDetailsPage() {
  const { slug } = useParams();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    Promise.all([
      fetchCourseBySlug(slug),
      fetchCourses({ perPage: 4 })
    ]).then(([courseRes, relatedRes]) => {
      if (cancelled) return;
      if (!courseRes) {
        setError(true);
        setLoading(false);
        return;
      }
      setCourse(courseRes);
      setRelated((relatedRes?.items || []).filter((c) => c.slug !== slug).slice(0, 3));
      setLoading(false);
      document.title = `${courseRes.title} — iLab BD`;
    }).catch(() => {
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <main className="min-h-screen grid place-items-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <Link to="/courses" className="mt-4 inline-block text-primary font-semibold">Browse all courses →</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <CourseHero course={course} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 pt-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-16 min-w-0 text-left">
            <LearningOutcomes outcomes={course.outcomes} />
            <CurriculumAccordion course={course} />
            <Audience items={course.audience} />
            <Requirements items={course.requirements} />
            <InstructorProfileSection profile={course.instructorProfile} />
            <ReviewsSection course={course} />
            <FAQAccordion faqs={course.faqs} />
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <EnrollmentCard course={course} />
            </div>
          </aside>
        </div>

        {/* FINAL ENROLLMENT CTA (above More to explore) */}
        <FinalCTA course={course} />

        {/* RELATED */}
        {related.length > 0 && <RelatedCourses items={related} />}
      </div>

      <Footer />

      {/* Mobile sticky bottom CTA */}
      <StickyMobileCTA course={course} />
    </main>
  );
}

/* ===========================  HERO  =========================== */

function CourseHero({ course }: { course: CourseDetails }) {
  const [playing, setPlaying] = useState(false);
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.205_0.04_257)] via-[oklch(0.25_0.05_240)] to-[oklch(0.18_0.04_220)] text-white pt-28 pb-12 md:pt-36 md:pb-16">
      <div className="absolute inset-0 opacity-25 [background:radial-gradient(60%_50%_at_70%_20%,oklch(0.50_0.18_195),transparent_60%),radial-gradient(40%_40%_at_20%_80%,#F76A21,transparent_70%)]" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <nav className="flex items-center justify-center gap-1.5 text-xs text-white/60 mb-6">
          <Link to="/" className="hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/courses" className="hover:text-white">Courses</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white/90 truncate">{course.category}</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-accent-light" /> {course.category}
            </span>
            {course.tag && (
              <span className="rounded-full gradient-orange px-3 py-1 text-xs font-bold">{course.tag}</span>
            )}
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{course.level}</span>
          </div>

          <h1 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            {course.title}
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl mx-auto">{course.description}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-white">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {course.rating}
              <span className="font-bold text-white/80">({course.students.toLocaleString()} students)</span>
            </span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {course.students.toLocaleString()} enrolled</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Updated {formatDate(course.updatedAt)}</span>
            <span className="inline-flex items-center gap-1.5"><Globe className="h-4 w-4" /> {course.language}</span>
          </div>

          <p className="mt-5 text-sm text-white/70">
            Created by <span className="font-semibold text-white">{course.instructor}</span>
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/enroll/$slug" params={{ slug: course.slug }} className="inline-flex items-center justify-center gap-2 rounded-full gradient-orange px-7 py-3.5 text-sm font-bold shadow-orange-glow hover:scale-[1.03] active:scale-[0.98] transition-transform">
              Enroll Now — ৳{course.price.toLocaleString()}
            </Link>
            <button
              onClick={() => setPlaying(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 backdrop-blur px-6 py-3.5 text-sm font-semibold hover:bg-white/20 transition"
            >
              <PlayCircle className="h-5 w-5" /> Preview Course
            </button>
          </div>
        </motion.div>

        {/* Landscape preview video aligned with hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mt-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/30 aspect-video mx-auto"
        >
          {playing ? (
            <video src={course.introVideo} autoPlay controls className="h-full w-full object-cover" />
          ) : (
            <button onClick={() => setPlaying(true)} className="group block h-full w-full relative">
              <img src={course.cover} alt={course.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid place-items-center h-20 w-20 rounded-full bg-white/95 text-foreground shadow-2xl group-hover:scale-110 transition-transform">
                  <PlayCircle className="h-10 w-10" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-medium text-white">
                <span className="rounded-full bg-black/60 backdrop-blur px-3 py-1">Free Intro Preview</span>
                <span className="rounded-full bg-black/60 backdrop-blur px-3 py-1">{course.hours}h · {course.lessons} lessons</span>
              </div>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ===========================  ENROLLMENT CARD  =========================== */

function EnrollmentCard({ course }: { course: CourseDetails }) {
  const discount = course.originalPrice
    ? Math.round(100 - (course.price / course.originalPrice) * 100)
    : 0;
  const countdown = useCountdown(2 * 24 * 3600 + 7 * 3600 + 42 * 60);

  return (
    <motion.div
      id="enroll"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-border bg-card shadow-card overflow-hidden"
    >
      <div className="relative aspect-video">
        <img src={course.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/30 grid place-items-center">
          <div className="grid place-items-center h-14 w-14 rounded-full bg-white/95 text-foreground"><PlayCircle className="h-7 w-7" /></div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-end gap-3">
          <span className="text-3xl font-extrabold text-foreground">৳{course.price.toLocaleString()}</span>
          {course.originalPrice && (
            <>
              <span className="text-base text-muted-foreground line-through">৳{course.originalPrice.toLocaleString()}</span>
              <span className="ml-auto rounded-full gradient-orange px-2.5 py-1 text-xs font-bold text-white">{discount}% OFF</span>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2.5 text-sm">
          <span className="text-accent font-semibold">🔥 Offer ends in</span>
          <span className="ml-auto font-mono font-bold text-foreground tabular-nums">{countdown}</span>
        </div>

        <Link to="/enroll/$slug" params={{ slug: course.slug }} className="mt-5 w-full inline-flex items-center justify-center rounded-full gradient-orange py-3.5 text-sm font-bold text-white shadow-orange-glow hover:scale-[1.02] active:scale-[0.99] transition-transform">
          Enroll Now
        </Link>
        <button className="mt-2.5 w-full inline-flex items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-semibold text-foreground hover:bg-surface transition">
          <Heart className="h-4 w-4" /> Add to Wishlist
        </button>

        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success" />
          30-day money-back guarantee · lifetime access
        </p>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm font-bold text-foreground">This course includes</p>
          <ul className="mt-3 space-y-2.5 text-sm text-foreground/85">
            {course.includes.map((i) => (
              <li key={i.label} className="flex items-start gap-2.5">
                <IncludeIcon name={i.icon} />
                <span>{i.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function IncludeIcon({ name }: { name: string }) {
  const props = { className: "h-4 w-4 mt-0.5 text-primary shrink-0" };
  if (name === "video") return <Video {...props} />;
  if (name === "download") return <Download {...props} />;
  if (name === "award") return <Award {...props} />;
  if (name === "infinity") return <InfinityIcon {...props} />;
  if (name === "smartphone") return <Smartphone {...props} />;
  return <Users {...props} />;
}

/* ===========================  LEARNING OUTCOMES  =========================== */

function LearningOutcomes({ outcomes }: { outcomes: string[] }) {
  return (
    <Section id="outcomes" eyebrow="Outcomes" title="What you'll be able to do">
      <div className="grid sm:grid-cols-2 gap-3.5">
        {outcomes.map((o, i) => (
          <motion.div
            key={o}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-card transition-all"
          >
            <span className="grid place-items-center h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary">
              <Check className="h-4 w-4" />
            </span>
            <p className="text-sm text-foreground leading-relaxed">{o}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ===========================  CURRICULUM  =========================== */

function CurriculumAccordion({ course }: { course: CourseDetails }) {
  const [openSections, setOpen] = useState<Set<string>>(new Set([course.sections[0]?.id]));
  const totalLessons = course.sections.reduce((a, s) => a + s.lessons.length, 0);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <Section id="curriculum" eyebrow="Curriculum" title="Course curriculum">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground mb-4">
        <span>{course.sections.length} sections</span>
        <span>· {totalLessons} lessons</span>
        <span>· {course.hours}h total</span>
        <button
          onClick={() => setOpen(new Set(course.sections.map((s) => s.id)))}
          className="ml-auto text-primary font-semibold hover:text-primary-dark"
        >
          Expand all
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        {course.sections.map((s) => {
          const open = openSections.has(s.id);
          const mins = s.lessons.reduce((a, l) => a + parseDurationMin(l.duration), 0);
          return (
            <div key={s.id}>
              <button
                onClick={() => toggle(s.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface/60 transition"
              >
                <motion.span animate={{ rotate: open ? 90 : 0 }} className="text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </motion.span>
                <span className="font-semibold text-foreground flex-1">{s.title}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {s.lessons.length} lessons · {mins} min
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
                      {s.lessons.map((l) => (
                        <li
                          key={l.id}
                          className="group flex items-center gap-3 py-2.5 border-b border-border/60 last:border-0"
                        >
                          <LessonTypeIcon type={l.type} />
                          <span className="text-sm text-foreground flex-1 truncate">{l.title}</span>
                          {l.preview ? (
                            <button className="text-xs font-semibold text-primary hover:text-primary-dark">
                              Preview
                            </button>
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">{l.duration}</span>
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
    </Section>
  );
}

function LessonTypeIcon({ type }: { type: LessonType }) {
  const cls = "h-4 w-4 text-primary shrink-0";
  if (type === "video") return <PlayCircle className={cls} />;
  if (type === "pdf") return <FileText className={cls} />;
  if (type === "quiz") return <HelpCircle className={cls} />;
  return <Radio className={cls + " text-accent"} />;
}

function parseDurationMin(d: string) {
  const m = d.match(/^(\d+):/);
  return m ? parseInt(m[1], 10) : 5;
}

/* ===========================  AUDIENCE  =========================== */

function Audience({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <Section id="audience" eyebrow="Who it's for" title="Who this course is for">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-card transition"
          >
            <div className="grid place-items-center h-10 w-10 rounded-xl gradient-teal text-white shadow-glow">
              <GraduationCap className="h-5 w-5" />
            </div>
            <p className="mt-3 font-bold text-foreground">{a.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ===========================  REQUIREMENTS  =========================== */

function Requirements({ items }: { items: string[] }) {
  return (
    <Section id="requirements" eyebrow="Prerequisites" title="Requirements">
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-3 text-foreground/90">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {r}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ===========================  INSTRUCTOR  =========================== */

function InstructorProfileSection({ profile }: { profile: CourseDetails["instructorProfile"] }) {
  return (
    <Section id="instructor" eyebrow="Your mentor" title="Meet your instructor">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row gap-6">
          <img src={profile.avatar} alt={profile.name} className="h-24 w-24 rounded-2xl object-cover shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-foreground">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">{profile.title}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-foreground/90">
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-accent text-accent" /> <strong>{profile.rating}</strong> instructor rating</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {profile.students.toLocaleString()} students</span>
              <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {profile.courses} courses</span>
              <span className="inline-flex items-center gap-1.5"><Trophy className="h-4 w-4 text-accent" /> {profile.experience}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.badges.map((b) => (
                <span key={b} className="rounded-full bg-primary/10 text-primary-dark px-2.5 py-1 text-xs font-semibold">{b}</span>
              ))}
            </div>
            <p className="mt-4 text-sm text-foreground/85 leading-relaxed">{profile.bio}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ===========================  REVIEWS  =========================== */

function ReviewsSection({ course }: { course: CourseDetails }) {
  return (
    <Section id="reviews" eyebrow="Reviews" title="What students say">
      <div className="grid md:grid-cols-[260px_1fr] gap-8 items-start">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
          <div className="text-5xl font-extrabold text-foreground">{course.rating.toFixed(1)}</div>
          <div className="mt-2 flex items-center justify-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.round(course.rating) ? "fill-accent text-accent" : "text-muted"}`} />
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{course.students.toLocaleString()} ratings</p>
          <div className="mt-5 space-y-2">
            {course.ratingDistribution.map((r) => (
              <div key={r.stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{r.stars}</span>
                <Star className="h-3 w-3 fill-accent text-accent" />
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="w-8 text-muted-foreground text-right tabular-nums">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {course.reviews.map((r, i) => (
            <motion.article
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="relative rounded-2xl border border-border bg-card p-5 hover:shadow-card transition"
            >
              <Quote className="absolute top-4 right-4 h-5 w-5 text-primary/20" />
              <div className="flex items-center gap-3">
                <img src={r.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-bold text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-muted"}`} />
                ))}
              </div>
              <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{r.text}</p>
              {r.completed && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2 py-0.5 text-[11px] font-semibold">
                  <Check className="h-3 w-3" /> Course completed
                </span>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ===========================  CERTIFICATE  =========================== */

function CertificatePreview({ courseTitle }: { courseTitle: string }) {
  return (
    <Section id="certificate" eyebrow="Certification" title="Earn a verifiable certificate">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl border-2 border-primary/20 p-8 bg-gradient-to-br from-surface to-card shadow-card"
        >
          <div className="absolute top-4 right-4 grid place-items-center h-12 w-12 rounded-full gradient-teal text-white shadow-glow">
            <Award className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Certificate of Completion</p>
          <p className="mt-2 text-sm text-muted-foreground">This certifies that</p>
          <p className="mt-3 text-2xl font-bold text-foreground font-display">— Your Name —</p>
          <p className="mt-3 text-sm text-muted-foreground">has successfully completed</p>
          <p className="mt-2 text-lg font-bold text-primary-dark">{courseTitle}</p>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Verification ID</p>
              <p className="font-mono text-sm font-semibold text-foreground">ILAB-2026-XK7Q2</p>
            </div>
            <div className="text-right">
              <p className="font-display text-lg text-primary-dark italic">iLab</p>
              <p className="text-xs text-muted-foreground">Signed · CEO</p>
            </div>
          </div>
        </motion.div>

        <div>
          <ul className="space-y-3">
            {[
              "Industry-recognized digital credential",
              "Unique verification ID — share on LinkedIn",
              "Hiring partners trust the iLab badge",
              "Shareable PDF + on-chain verification",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-primary/10 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-foreground/90">{b}</span>
              </li>
            ))}
          </ul>
          <a href="#enroll" className="mt-6 inline-flex items-center gap-2 rounded-full gradient-orange px-6 py-3 text-sm font-bold text-white shadow-orange-glow hover:scale-[1.03] transition-transform">
            Enroll & Earn Certificate
          </a>
        </div>
      </div>
    </Section>
  );
}

/* ===========================  FAQ  =========================== */

function FAQAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <Section id="faq" eyebrow="FAQ" title="Frequently asked questions">
      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {faqs.map((f, i) => {
          const open = openIdx === i;
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface/60 transition"
              >
                <span className="font-semibold text-foreground flex-1">{f.q}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ===========================  RELATED  =========================== */

function RelatedCourses({ items }: { items: ReturnType<typeof useRelatedItems> }) {
  return (
    <section className="mt-20">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">More to explore</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-foreground">Students also enrolled in</h2>
        </div>
        <Link to="/courses" className="hidden sm:inline-flex text-sm font-semibold text-primary hover:text-primary-dark">View all →</Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
      </div>
    </section>
  );
}

// helper for typing only
function useRelatedItems() { return [] as Awaited<ReturnType<typeof fetchCourses>>["items"]; }

/* ===========================  FINAL CTA  =========================== */

const PROMO_CODES: Record<string, number> = {
  ILAB10: 10,
  ILAB20: 20,
  WELCOME: 15,
};

function FinalCTA({ course }: { course: CourseDetails }) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finalPrice = applied
    ? Math.round(course.price * (1 - applied.pct / 100))
    : course.price;

  const handleApply = () => {
    const key = code.trim().toUpperCase();
    if (!key) return;
    const pct = PROMO_CODES[key];
    if (pct) {
      setApplied({ code: key, pct });
      setError(null);
    } else {
      setApplied(null);
      setError("Invalid promo code");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-20 relative overflow-hidden rounded-3xl gradient-teal text-white p-8 md:p-14 text-left"
    >
      <div className="absolute inset-0 opacity-30 [background:radial-gradient(60%_60%_at_80%_0%,white,transparent_60%)]" />
      <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">{course.title}</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold leading-tight max-w-2xl">
            Start building practical {course.category.toLowerCase()} skills today.
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/85">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> 30-day money-back</span>
            <span className="inline-flex items-center gap-1.5"><InfinityIcon className="h-4 w-4" /> Lifetime access</span>
          </div>
        </div>

        <div className="w-full md:w-[320px] rounded-2xl bg-white/10 backdrop-blur p-5 border border-white/15">
          <label className="text-xs font-bold uppercase tracking-wider text-white/80">Promo code</label>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="flex-1 rounded-full bg-white/95 text-foreground px-4 py-2.5 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleApply}
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white hover:opacity-95 transition"
            >
              Apply
            </button>
          </div>
          {applied && (
            <p className="mt-2 text-xs font-semibold text-accent-light">
              ✓ {applied.code} applied — {applied.pct}% off
            </p>
          )}
          {error && <p className="mt-2 text-xs font-semibold text-white/90">{error}</p>}

          <div className="mt-4 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-white">৳{finalPrice.toLocaleString()}</span>
            {applied && (
              <span className="text-base text-white/60 line-through pb-1">৳{course.price.toLocaleString()}</span>
            )}
          </div>

          <Link
            to="/enroll/$slug"
            params={{ slug: course.slug }}
            className="mt-4 w-full inline-flex items-center justify-center rounded-full bg-white text-primary-dark px-6 py-3.5 text-sm font-bold shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-transform"
          >
            Enroll Now — ৳{finalPrice.toLocaleString()}
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

/* ===========================  STICKY MOBILE CTA  =========================== */

function StickyMobileCTA({ course }: { course: CourseDetails }) {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border p-3 flex items-center gap-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]">
      <div className="min-w-0">
        <p className="text-base font-extrabold text-foreground leading-none">৳{course.price.toLocaleString()}</p>
        {course.originalPrice && (
          <p className="text-xs text-muted-foreground line-through">৳{course.originalPrice.toLocaleString()}</p>
        )}
      </div>
      <Link to="/enroll/$slug" params={{ slug: course.slug }} className="flex-1 inline-flex items-center justify-center rounded-full gradient-orange py-3 text-sm font-bold text-white shadow-orange-glow">
        Enroll Now
      </Link>
    </div>
  );
}

/* ===========================  Shared bits  =========================== */

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">{eyebrow}</p>
      <h2 className="mt-2 text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function useCountdown(initialSeconds: number) {
  const [s, setS] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setS((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
  }, [s]);
}
function pad(n: number) { return n.toString().padStart(2, "0"); }
