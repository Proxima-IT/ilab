import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudent } from '@/hooks/useStudentData';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Bell, Mail, Flame, GraduationCap, BookOpen, CheckCircle2, Award, Star, Save } from 'lucide-react';
import { toast } from 'sonner';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const settingsTabs = ['personalInfo', 'password', 'notifications', 'privacy'] as const;

type FormState = {
  name: string;
  email: string;
  phone: string;
  location: string;
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative w-10 h-5 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-secondary'}`}>
      <motion.div className="absolute top-0.5 w-4 h-4 rounded-full bg-foreground" animate={{ left: on ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </button>
  );
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, login } = useAuth();
  const { student, enrolledCoursesList, loading, refetch } = useStudent();
  const [activeTab, setActiveTab] = useState<typeof settingsTabs[number]>('personalInfo');
  
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', location: 'Bangladesh' });
  const [notifs, setNotifs] = useState({ lecture: true, email: false, streak: true, congrats: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name,
        email: student.email,
        phone: '', // Default or fetch if available
        location: 'Bangladesh',
      });
    }
  }, [student]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Update in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.name.trim(),
          phone: form.phone.trim(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      // 2. Update authStore
      login({
        ...user,
        name: form.name.trim(),
      });

      // 3. Refetch student data
      await refetch();
      toast.success('Successfully save hoyeche!');
    } catch (e) {
      console.error(e);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !student) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-card border border-border/30 rounded-2xl animate-pulse" />
          <div className="lg:col-span-2 h-64 bg-card border border-border/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const completedCourses = enrolledCoursesList.filter(c => c.progress === 100).length;
  const certificatesEarned = completedCourses + 1;

  const profileStats = [
    { icon: BookOpen, label: `${student.enrolledCourses} Courses Enrolled` },
    { icon: CheckCircle2, label: `${completedCourses} Course Complete` },
    { icon: Award, label: `${certificatesEarned} ${t('certificatesEarned')}` },
    { icon: Flame, label: `${student.streak} ${t('streak')}` },
    { icon: Star, label: `${t('level')} ${student.level} — Apprentice` },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <h1 className="font-display text-xl text-foreground">{t('profileSettings')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="glass-card p-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/30 mx-auto">
              <img src={student.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <h3 className="font-ui text-lg font-semibold text-foreground">{student.name}</h3>
          <p className="text-xs text-muted-foreground font-ui">{student.email}</p>
          <p className="text-xs text-muted-foreground font-ui">{form.location}</p>

          <div className="mt-6 space-y-2 text-left">
            {profileStats.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-ui py-1">
                <s.icon className="w-4 h-4 text-primary/60" /> {s.label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2 glass-card p-5">
          <div className="flex gap-1 border-b border-border/30 mb-5">
            {settingsTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-3 py-2 text-xs font-ui transition-colors ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {t(tab)}
                {activeTab === tab && <motion.div layoutId="settingsTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {activeTab === 'personalInfo' && (
                <div className="space-y-4">
                  {[
                    { label: t('fullName'), key: 'name' as const },
                    { label: t('email'), key: 'email' as const, disabled: true },
                    { label: t('phone'), key: 'phone' as const },
                    { label: t('location'), key: 'location' as const },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-[11px] text-muted-foreground font-ui block mb-1">{field.label}</label>
                      <input
                        value={form[field.key]}
                        disabled={field.disabled}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        className={`glass-input w-full px-3 py-2 text-xs font-ui ${field.disabled ? 'opacity-60 cursor-not-allowed bg-secondary/20' : ''}`}
                      />
                    </div>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="glass-button px-6 py-2.5 text-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3 h-3" /> {saving ? 'Saving...' : t('save')}
                  </motion.button>
                </div>
              )}

              {activeTab === 'password' && (
                <div className="space-y-4">
                  {['Current Password', 'New Password', 'Confirm Password'].map((label) => (
                    <div key={label}>
                      <label className="text-[11px] text-muted-foreground font-ui block mb-1">{label}</label>
                      <input type="password" className="glass-input w-full px-3 py-2 text-xs font-ui" />
                    </div>
                  ))}
                  <motion.button whileHover={{ scale: 1.02 }} onClick={handleSave} className="glass-button px-6 py-2.5 text-xs flex items-center gap-1.5">
                    <Save className="w-3 h-3" /> {t('save')}
                  </motion.button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  {[
                    { key: 'lecture' as const, icon: <Bell className="w-4 h-4" />, label: t('notifNewLecture') },
                    { key: 'email' as const, icon: <Mail className="w-4 h-4" />, label: t('notifEmail') },
                    { key: 'streak' as const, icon: <Flame className="w-4 h-4" />, label: t('notifStreak') },
                    { key: 'congrats' as const, icon: <GraduationCap className="w-4 h-4" />, label: t('notifCongrats') },
                  ].map((n) => (
                    <div key={n.key} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{n.icon}</span>
                        <span className="text-xs font-ui text-foreground">{n.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Toggle on={notifs[n.key]} onToggle={() => setNotifs({ ...notifs, [n.key]: !notifs[n.key] })} />
                        <span className="text-[10px] text-muted-foreground font-ui w-8">{notifs[n.key] ? t('on') : t('off')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="text-xs text-muted-foreground font-ui space-y-3">
                  <p>Tomar data secure rakhte amader top priority.</p>
                  <p>Amra kono third party er sathe tomar personal info share kori na.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
