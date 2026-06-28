import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { weeklyActivity, analyticsData, liveSessions, achievementsList } from '@/lib/mockData';
import { useStudent } from '@/hooks/useStudentData';
import { Link } from "react-router-dom";
import { Play, Calendar, BookOpen, CheckCircle2, Flame, Award, Trophy, Zap, Star, Target, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function OverviewPage() {
  const { t } = useLanguage();
  const { student, enrolledCoursesList, loading } = useStudent();
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('welcomeMorning') : hour < 17 ? t('welcomeAfternoon') : t('welcomeEvening');
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const chartData = analyticsData.map((d) => ({ ...d, name: dayNames[d.day] }));

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

  const certificatesEarned = enrolledCoursesList.filter(c => c.progress === 100).length + 1;

  const stats = [
    { icon: BookOpen, value: student.enrolledCourses, label: t('enrolledCourses'), glow: '' },
    { icon: CheckCircle2, value: student.overallProgress, label: t('completed'), suffix: '%', glow: '' },
    { icon: Flame, value: student.streak, label: t('streak'), glow: 'accent-glow' },
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
      color,
      lectures: [completedLectures, totalLectures],
    };
  });

  const activeCourse = mappedCourses[0] || {
    title: "No courses enrolled",
    slug: "",
    progress: 0,
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Welcome Hero */}
      <motion.div variants={item} className="glass-card hud-card p-6 animated-mesh relative overflow-hidden">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <p className="text-lg font-ui text-foreground">{greeting}, {student.name}!</p>
          <p className="text-sm text-muted-foreground mt-1 font-ui">{t('todayGoal')}</p>
          {mappedCourses.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link to={`/dashboard/player/${activeCourse.slug}/1`}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="glass-button px-5 py-2.5 text-sm flex items-center gap-2">
                  <Play className="w-4 h-4" /> {t('resumeWhere')}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Active Session & Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div variants={item} className="lg:col-span-2 glass-card p-5">
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

        {/* Live Session */}
        <motion.div variants={item} className="glass-card p-5 flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-accent/10 text-accent border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> LIVE NOW
            </span>
            <h4 className="font-display text-base text-foreground mt-3 font-bold">{liveSessions[0].title}</h4>
            <p className="text-xs text-muted-foreground mt-1 font-ui">Instructor: {liveSessions[0].instructor}</p>
          </div>
          <div className="pt-4 border-t border-border/30 mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>{liveSessions[0].time}</span>
            </div>
            <div className="flex gap-2">
              <Link to={liveSessions[0].joinUrl}>
                <motion.button whileHover={{ scale: 1.05 }} className="glass-button px-4 py-2 text-xs flex items-center gap-1.5">
                  <Play className="w-3 h-3" /> {t('startNow')}
                </motion.button>
              </Link>
              <Link to="/dashboard/my-courses">
                <button className="px-4 py-2 text-xs glass-card text-foreground font-ui hover:border-primary/30 transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> {t('viewCurriculum')}
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Course Grid */}
      <motion.div variants={item}>
        <h3 className="font-display text-sm text-foreground mb-3">{t('allMyCourses')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mappedCourses.map((course, i) => (
            <Link key={course.id} to={`/dashboard/player/${course.slug}/1`}>
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
    </motion.div>
  );
}
