import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { analyticsData } from '@/lib/mockData';
import { useStudent } from '@/hooks/useStudentData';
import { Link } from "react-router-dom";
import { Award, BookOpen, CheckCircle2, ChevronDown, MessageCircle, Play } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  studentQnaService,
  type StudentDashboardQuestion,
} from "@/services/student/qna.service";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function formatDate(date?: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function statusClass(status: string) {
  if (status === "answered") return "bg-primary/10 text-primary";
  if (status === "closed") return "bg-secondary text-muted-foreground";
  return "bg-amber-500/10 text-amber-600";
}

export default function OverviewPage() {
  const { t } = useLanguage();
  const { student, enrolledCoursesList, loading } = useStudent();
  const [questions, setQuestions] = useState<StudentDashboardQuestion[]>([]);
  const [qnaLoading, setQnaLoading] = useState(true);
  const [visibleQuestions, setVisibleQuestions] = useState(5);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('welcomeMorning') : hour < 17 ? t('welcomeAfternoon') : t('welcomeEvening');
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const chartData = analyticsData.map((d) => ({ ...d, name: dayNames[d.day] }));

  useEffect(() => {
    let mounted = true;

    async function loadQna() {
      setQnaLoading(true);

      try {
        const data = await studentQnaService.list();

        if (mounted) {
          setQuestions(data);
        }
      } catch {
        if (mounted) {
          setQuestions([]);
        }
      } finally {
        if (mounted) setQnaLoading(false);
      }
    }

    void loadQna();

    return () => {
      mounted = false;
    };
  }, []);

  const displayedQuestions = useMemo(
    () => questions.slice(0, visibleQuestions),
    [questions, visibleQuestions]
  );

  if (loading || !student) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-card border border-border/30 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-card border border-border/30 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-card border border-border/30 rounded-2xl" />
      </div>
    );
  }

  const certificatesEarned = enrolledCoursesList.filter(c => c.progress === 100).length;

  const stats = [
    { icon: BookOpen, value: student.enrolledCourses, label: t('enrolledCourses'), glow: '' },
    { icon: CheckCircle2, value: student.overallProgress, label: t('completed'), suffix: '%', glow: '' },
    { icon: Award, value: certificatesEarned, label: t('certificatesEarned'), glow: 'primary-glow' },
  ];

  // Map enrolled courses list to match original UI signature
  const mappedCourses = enrolledCoursesList.map((e, index) => {
    const colors = ["#0d9488", "#f76a21", "#8b5cf6", "#3b82f6", "#ec4899"];
    const color = colors[index % colors.length];
    const totalLectures = e.course.lessons || 30;
    const completedLectures = Math.round((e.progress / 100) * totalLectures);
    return {
      id: e.course.id,
      title: e.course.title,
      slug: e.course.slug,
      progress: e.progress,
      firstLessonId: e.firstLessonId,
      color,
      lectures: [completedLectures, e.totalLessons],
    };
  });

  const activeCourse = mappedCourses[0] || {
    title: "No courses enrolled",
    slug: "",
    progress: 0,
    firstLessonId: null,
  };
  const activeCourseLink = activeCourse.firstLessonId
    ? `/dashboard/player/${activeCourse.slug}/${activeCourse.firstLessonId}`
    : "/dashboard/my-courses";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Welcome Hero */}
      <motion.div variants={item} className="glass-card hud-card p-6 animated-mesh relative overflow-hidden">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <p className="text-lg font-ui text-foreground">{greeting}, {student.name}!</p>
          <p className="text-sm text-muted-foreground mt-1 font-ui">{t('todayGoal')}</p>
          {mappedCourses.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link to={activeCourseLink}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="glass-button px-5 py-2.5 text-sm flex items-center gap-2">
                  <Play className="w-4 h-4" /> {activeCourse.firstLessonId ? t('resumeWhere') : "View course"}
                </motion.button>
              </Link>
              <p className="text-xs text-muted-foreground font-ui">
                {activeCourse.title} — Progress: {activeCourse.progress}% {t('completed')}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} variants={item} className={`glass-card p-4 flex items-center gap-3 ${stat.glow}`}>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-ui">{stat.label}</p>
              <p className="text-lg font-display text-foreground font-bold mt-0.5">
                {stat.value}
                {stat.suffix && <span className="text-xs font-ui text-muted-foreground ml-0.5">{stat.suffix}</span>}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Chart */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div variants={item} className="glass-card p-5">
          <h3 className="font-display text-sm text-foreground mb-4">{t('weeklyActivity')}</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.1)" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#chartColor)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Course Grid */}
      <motion.div variants={item}>
        <h3 className="font-display text-sm text-foreground mb-3">{t('allMyCourses')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mappedCourses.map((course, i) => (
            <Link
              key={course.id}
              to={course.firstLessonId ? `/dashboard/player/${course.slug}/${course.firstLessonId}` : "/dashboard/my-courses"}
            >
              <motion.div whileHover={{ y: -4 }} className="glass-card p-4 cursor-pointer group">
                <div className="h-16 rounded-lg mb-3 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${course.color}22, ${course.color}08)` }}>
                  {course.progress === 100 ? <CheckCircle2 className="w-8 h-8 text-primary" /> : <BookOpen className="w-8 h-8" style={{ color: course.color }} />}
                </div>
                <h4 className="font-ui text-sm text-foreground font-medium">{course.title}</h4>
                {course.progress === 100 ? (
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-ui">
                    <CheckCircle2 className="w-3 h-3" /> {t('completed')}
                  </span>
                ) : (
                  <>
                    <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} whileInView={{ width: `${course.progress}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">{course.progress}% · Completed {course.lectures[0]}/{course.lectures[1]} lectures</p>
                  </>
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm text-foreground">My Q&A</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Questions you asked while watching lessons and instructor answers.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] text-primary">
            <MessageCircle className="h-3 w-3" />
            {questions.length}
          </span>
        </div>

        {qnaLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-24 rounded-xl border border-border/30 bg-card" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-xl border border-border/30 p-6 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-foreground">No questions yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ask a question from the lesson player Q&A tab.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedQuestions.map((question) => (
              <div key={question.id} className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${statusClass(question.status)}`}>
                        {question.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(question.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                      {question.question}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {question.lesson?.section?.course?.title || "Course"} · {question.lesson?.title || "Lesson"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {question.answers.length > 0 ? (
                    question.answers.map((answer) => (
                      <div key={answer.id} className="rounded-lg border-l-2 border-primary/40 bg-background/40 px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {answer.user?.name || "iLab"}
                          </span>
                          {answer.is_instructor_answer && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
                              Answer
                            </span>
                          )}
                          <span className="text-[9px] text-muted-foreground">
                            {formatDate(answer.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {answer.answer}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Instructor answer pending.</p>
                  )}
                </div>
              </div>
            ))}

            {visibleQuestions < questions.length && (
              <button
                type="button"
                onClick={() => setVisibleQuestions((current) => current + 5)}
                className="glass-button mx-auto flex items-center gap-1.5 px-4 py-2 text-xs"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Show more
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
