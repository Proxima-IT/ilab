import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudent } from '@/hooks/useStudentData';
import { quizData, studyTimeData } from '@/lib/mockData';
import { Target, CheckCircle2, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, CartesianGrid } from 'recharts';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function ProgressRing({ percentage }: { percentage: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 180 180" className="w-44 h-44">
      <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(13, 148, 136, 0.12)" strokeWidth="10" />
      <motion.circle cx="90" cy="90" r={r} fill="none" stroke="#0D9488" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} transform="rotate(-90 90 90)" initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (percentage / 100) * c }} transition={{ duration: 1.5, ease: 'easeOut' }} style={{ filter: 'drop-shadow(0 0 8px rgba(13, 148, 136, 0.3))' }} />
      <text x="90" y="82" textAnchor="middle" fill="#0D9488" fontSize="28" fontFamily="Orbitron">{percentage}%</text>
      <text x="90" y="105" textAnchor="middle" fill="#475569" fontSize="11" fontFamily="Exo 2">Complete</text>
    </svg>
  );
}

export default function ProgressPage() {
  const { t } = useLanguage();
  const [timeFilter, setTimeFilter] = useState('week');
  const { student, enrolledCoursesList, loading } = useStudent();

  if (loading || !student) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 bg-card border border-border/30 rounded-2xl animate-pulse" />
          <div className="lg:col-span-2 h-64 bg-card border border-border/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const avgScore = Math.round(quizData.reduce((a, q) => a + q.score, 0) / quizData.length);
  const passed = quizData.filter(q => q.score >= 60).length;
  const highest = Math.max(...quizData.map(q => q.score));

  // Map enrolled courses list to match original UI signature
  const mappedCourses = enrolledCoursesList.map((e, index) => {
    const colors = ["#0d9488", "#f76a21", "#8b5cf6", "#3b82f6", "#ec4899"];
    const color = colors[index % colors.length];
    const totalLectures = e.course.lessons || 30;
    const completedLectures = Math.round((e.progress / 100) * totalLectures);
    const hoursSpent = Math.round((e.progress / 100) * e.course.hours);
    
    // Format a mock last watched date
    const lastWatched = new Date(Date.now() - (index * 2) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return {
      id: e.course.id,
      title: e.course.title,
      slug: e.course.slug,
      progress: e.progress,
      instructor: e.course.instructor,
      color,
      lectures: [completedLectures, totalLectures],
      hoursSpent,
      lastWatched,
    };
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <h1 className="font-display text-xl text-foreground">{t('myProgress')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={item} className="glass-card p-6 flex flex-col items-center justify-center">
          <ProgressRing percentage={student.overallProgress} />
          <p className="text-xs text-muted-foreground font-ui mt-3">{student.enrolledCourses} courses · {student.overallProgress}% {t('completed')}</p>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2 glass-card p-4 overflow-x-auto">
          <table className="w-full text-xs font-ui min-w-[500px]">
            <thead>
              <tr className="text-muted-foreground border-b border-border/30">
                <th className="text-left py-2 font-medium">{t('courseName')}</th>
                <th className="text-left py-2 font-medium">{t('completed')}</th>
                <th className="text-left py-2 font-medium">{t('lecturesCol')}</th>
                <th className="text-left py-2 font-medium">{t('timeSpent')}</th>
                <th className="text-left py-2 font-medium">{t('lastWatched')}</th>
              </tr>
            </thead>
            <tbody>
              {mappedCourses.map((c, i) => (
                <motion.tr key={c.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors" whileHover={{ x: 2 }}>
                  <td className="py-3 text-foreground font-medium">{c.title}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} whileInView={{ width: `${c.progress}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                      </div>
                      <span className="font-mono text-primary">{c.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground font-mono">{c.lectures[0]}/{c.lectures[1]}</td>
                  <td className="py-3 text-muted-foreground font-mono">{c.hoursSpent}h</td>
                  <td className="py-3 text-muted-foreground">{c.lastWatched}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>

      <motion.div variants={item} className="glass-card p-5">
        <h3 className="font-display text-sm text-foreground mb-4">{t('quizResults')}</h3>
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart data={quizData}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <ReferenceLine y={60} stroke="#F76A21" strokeDasharray="5 5" label={{ value: 'Pass', fill: '#F76A21', fontSize: 9 }} />
              <Bar dataKey="score" fill="url(#barGrad)" radius={[4, 4, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-3 text-[11px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {t('avgScore')}: {avgScore}%</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t('passed')}: {passed}/{quizData.length}</span>
          <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {t('highestScore')}: {highest}%</span>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm text-foreground">{t('timeAnalytics')}</h3>
          <div className="flex gap-1">
            {['week', 'month', 'all'].map(f => (
              <button key={f} onClick={() => setTimeFilter(f)} className={`px-2.5 py-1 rounded-full text-[10px] font-ui transition-colors ${timeFilter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {f === 'week' ? t('thisWeek') : f === 'month' ? t('thisMonth') : t('allTime')}
              </button>
            ))}
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer>
            <LineChart data={studyTimeData.slice(0, timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 30)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(13, 148, 136, 0.08)" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Line type="monotone" dataKey="target" stroke="#F76A21" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name={t('target')} />
              <Line type="monotone" dataKey="actual" stroke="#0D9488" strokeWidth={2} dot={false} name={t('actual')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

    </motion.div>
  );
}
