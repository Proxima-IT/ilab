import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudent } from '@/hooks/useStudentData';
import { Play, CheckCircle2, BookOpen } from 'lucide-react';
import { Link } from "react-router-dom";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function MyCoursesPage() {
  const { t } = useLanguage();
  const { student, enrolledCoursesList, loading } = useStudent();

  if (loading || !student) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-card border border-border/30 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Map enrolled courses list to match original UI signature
  const mappedCourses = enrolledCoursesList.map((e, index) => {
    const colors = ["#0d9488", "#f76a21", "#8b5cf6", "#3b82f6", "#ec4899"];
    const color = colors[index % colors.length];
    const totalLectures = e.course.lessons || 30;
    const completedLectures = Math.round((e.progress / 100) * totalLectures);
    const hoursSpent = Math.round((e.progress / 100) * e.course.hours);
    return {
      id: e.course.id,
      title: e.course.title,
      slug: e.course.slug,
      progress: e.progress,
      instructor: e.course.instructor,
      color,
      lectures: [completedLectures, totalLectures],
      hoursSpent,
    };
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <h1 className="font-display text-xl text-foreground">{t('allMyCourses')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mappedCourses.map((course, i) => (
          <motion.div key={course.id} variants={item} whileHover={{ y: -6, scale: 1.02 }} className="glass-card overflow-hidden group cursor-pointer">
            <div className="h-32 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${course.color}30, ${course.color}08)` }}>
              {course.progress === 100 && (
                <div className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-ui flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {t('completed')}
                </div>
              )}
              <svg className="absolute bottom-3 right-3 w-10 h-10" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(13, 148, 136, 0.12)" strokeWidth="3" />
                <motion.circle cx="18" cy="18" r="15.5" fill="none" stroke="#0D9488" strokeWidth="3" strokeDasharray={`${course.progress} ${100 - course.progress}`} strokeDashoffset="25" strokeLinecap="round" initial={{ strokeDasharray: '0 100' }} whileInView={{ strokeDasharray: `${course.progress} ${100 - course.progress}` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1 }} />
                <text x="18" y="20" textAnchor="middle" fill="#0D9488" fontSize="8" fontFamily="JetBrains Mono">{course.progress}%</text>
              </svg>
              <BookOpen className="w-10 h-10 group-hover:scale-110 transition-transform" style={{ color: course.color }} />
            </div>
            <div className="p-4">
              <h3 className="font-ui text-sm font-semibold text-foreground">{course.title}</h3>
              <p className="text-xs text-muted-foreground font-ui mt-1">{course.instructor}</p>
              <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} whileInView={{ width: `${course.progress}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground font-mono">{course.lectures[0]}/{course.lectures[1]} {t('lecturesCompleted')}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{course.hoursSpent}h</span>
              </div>
              {course.progress < 100 && (
                <Link to={`/dashboard/player/${course.slug}/1`}>
                  <motion.button whileHover={{ scale: 1.05 }} className="glass-button w-full mt-3 py-2 text-xs flex items-center justify-center gap-1.5">
                    <Play className="w-3 h-3" /> {t('continue')}
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
