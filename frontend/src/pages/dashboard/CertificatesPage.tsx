import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudent } from '@/hooks/useStudentData';
import { Download, Share2, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CertificatesPage() {
  const { t } = useLanguage();
  const { student, enrolledCoursesList, loading } = useStudent();

  if (loading || !student) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-card border border-border/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Separate courses into completed and in progress
  const completed = enrolledCoursesList.filter(c => c.progress === 100).map(e => e.course);
  const inProgress = enrolledCoursesList.filter(c => c.progress < 100);

  // If there are no completed courses, mock one for demonstration of the certificate card
  if (completed.length === 0 && enrolledCoursesList.length > 0) {
    completed.push({
      id: "demo-cert",
      slug: "mobile-repairing-fundamentals",
      title: "Mobile Repairing Fundamentals",
      instructor: "Md. Rakib Hasan",
      category: "Mobile",
      level: "Beginner",
      mode: "Offline",
      rating: 4.8,
      students: 3200,
      hours: 12,
      lessons: 28,
      price: 0,
      cover: "",
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <h1 className="font-display text-xl text-foreground">{t('myCertificates')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {completed.map((course) => (
          <motion.div key={course.id} variants={item} whileHover={{ rotateY: 12, scale: 1.02 }} style={{ perspective: 1000 }} className="glass-card hud-card p-6 text-center cursor-pointer primary-glow">
            <p className="font-display text-[10px] text-primary tracking-[0.3em] mb-3">ILAB BD</p>
            <p className="text-xs text-muted-foreground font-ui mb-4">{t('certificateOf')}</p>
            <p className="font-ui text-lg text-foreground font-semibold">{student.name}</p>
            <p className="text-sm text-muted-foreground font-ui mt-1">{course.title}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-3">Verified Credential</p>
            <div className="flex gap-2 mt-4 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => toast.success('Download start hocche...')} className="glass-button px-3 py-1.5 text-[10px] flex items-center gap-1">
                <Download className="w-3 h-3" /> {t('download')}
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => { navigator.clipboard.writeText(`https://ilabbd.com/cert/${course.id}`); toast.success('Link copy hoyeche!'); }} className="glass-card px-3 py-1.5 text-[10px] text-foreground font-ui flex items-center gap-1 hover:border-primary/30">
                <Share2 className="w-3 h-3" /> {t('share')}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {inProgress.length > 0 && (
        <>
          <h2 className="font-display text-sm text-foreground mt-8">{t('inProgress')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((e) => (
              <motion.div key={e.course.id} variants={item} className="glass-card p-5 text-center opacity-60 relative">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Lock className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="font-ui text-sm text-foreground font-medium">{e.course.title}</p>
                <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} whileInView={{ width: `${e.progress}%` }} viewport={{ once: true }} />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-2">{e.progress}% — {100 - e.progress}% {t('remaining')}</p>
                <p className="text-[10px] text-muted-foreground font-ui mt-2">{t('earnCertificate')}</p>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
