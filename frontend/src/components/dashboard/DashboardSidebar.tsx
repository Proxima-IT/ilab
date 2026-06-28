import { Link, useLocation } from "react-router-dom";
import { motion } from 'framer-motion';
import { Home, BookOpen, BarChart3, Award, Trophy, FolderOpen, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudent } from '@/hooks/useStudentData';

const navItems = [
  { path: '/dashboard', icon: Home, labelKey: 'overview' },
  { path: '/dashboard/my-courses', icon: BookOpen, labelKey: 'myCourses' },
  { path: '/dashboard/progress', icon: BarChart3, labelKey: 'progress' },
  { path: '/dashboard/certificates', icon: Award, labelKey: 'certificates' },
  { path: '/dashboard/leaderboard', icon: Trophy, labelKey: 'leaderboard' },
  { path: '/dashboard/resources', icon: FolderOpen, labelKey: 'resources' },
  { path: '/dashboard/profile', icon: Settings, labelKey: 'profile' },
];

export default function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const { pathname } = useLocation();
  const { student, loading } = useStudent();
  const { t } = useLanguage();

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  if (loading || !student) {
    return (
      <div className="flex flex-col h-full py-4 px-4 space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        </div>
        <div className="h-2 bg-muted rounded w-full" />
        <div className="space-y-2 pt-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-muted rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full py-4">
      {/* Student Identity */}
      <div className="px-4 pb-4 mb-4 border-b border-border/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/50 animate-pulse-glow">
              <img src={student.avatar} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-ui font-semibold text-foreground text-sm truncate">
              {student.name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs px-1.5 py-0.5 rounded glass-card text-accent font-mono">
                {t('level')} {student.level}
              </span>
            </div>
          </div>
        </div>
        {/* XP Bar */}
        <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(student.xp / student.xpMax) * 100}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 font-mono">
          {student.xp}/{student.xpMax} XP
        </p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-ui transition-all duration-200 ${
                active
                  ? 'nav-active text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 nav-active rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Stats */}
      <div className="px-4 pt-4 mt-4 border-t border-border/30">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-ui">
          <BookOpen className="w-3 h-3" />
          <span>{student.enrolledCourses} Courses</span>
          <span>·</span>
          <span>{student.overallProgress}% {t('completed')}</span>
        </div>
      </div>
    </div>
  );
}
