import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useParams, useNavigate } from "react-router-dom";
import { useStudent } from '@/hooks/useStudentData';
import { curriculum, mockQA, courses as mockCourses } from '@/lib/mockData';
import { Play, Pause, Volume2, VolumeX, Maximize, ChevronDown, ChevronRight, Check, Lock, Bookmark, Pin, Save, Clock, FileText, Code2, ExternalLink, MessageCircle, FolderOpen, ArrowLeft, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

const tabs = ['overview', 'notes', 'qna', 'resourcesTab'] as const;

export default function ClassPlayerPage() {
  const { t } = useLanguage();
  const { courseSlug } = useParams({ strict: false });
  const navigate = useNavigate();
  const { enrolledCoursesList, updateCourseProgress, loading } = useStudent();

  const enrolledCourseInfo = enrolledCoursesList.find(e => e.course.slug === courseSlug);
  const course = enrolledCourseInfo?.course || mockCourses.find(c => c.slug === courseSlug) || mockCourses[1];
  const initialProgress = enrolledCourseInfo?.progress || 0;

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [currentTime, setCurrentTime] = useState(812);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('overview');
  const [expandedModules, setExpandedModules] = useState<number[]>([1, 3]);
  const [noteText, setNoteText] = useState('');
  const [savedNotes, setSavedNotes] = useState<{ time: number; text: string }[]>([]);
  const [marked, setMarked] = useState(false);
  const idleRef = useRef<ReturnType<typeof setTimeout>>();

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const totalTime = 1395;

  const resetIdle = useCallback(() => {
    setShowControls(true);
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => playing && setShowControls(false), 3000);
  }, [playing]);

  useEffect(() => {
    if (playing) {
      const id = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalTime) { 
            setPlaying(false); 
            // Mark course progress as increased when video completes
            if (enrolledCourseInfo && enrolledCourseInfo.progress < 100) {
              const nextProgress = Math.min(100, enrolledCourseInfo.progress + 5);
              updateCourseProgress(course.id, nextProgress);
              toast.success("Progress updated!");
            }
            return prev; 
          }
          const nextTime = prev + 1;
          const nextPercent = Math.round((nextTime / totalTime) * 100);
          setProgress(nextPercent);
          return nextTime;
        });
      }, 1000);
      return () => clearInterval(id);
    }
  }, [playing, enrolledCourseInfo, course.id, updateCourseProgress]);

  const saveNote = () => {
    if (!noteText.trim()) return;
    setSavedNotes(prev => [...prev, { time: currentTime, text: noteText }]);
    setNoteText('');
  };

  const handleMarkComplete = () => {
    if (enrolledCourseInfo) {
      const nextProgress = Math.min(100, enrolledCourseInfo.progress + 10);
      updateCourseProgress(course.id, nextProgress);
      setProgress(nextProgress);
      toast.success("Lesson marked as completed! Progress increased.");
    } else {
      toast.info("Enroll in this course to track your progress.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-96 bg-card border border-border/30 rounded-2xl" />
          <div className="w-full lg:w-80 h-96 bg-card border border-border/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  const tabConfig = [
    { key: 'overview' as const, label: 'Overview', icon: null },
    { key: 'notes' as const, label: t('notes'), icon: <FileText className="w-3 h-3 inline mr-1" /> },
    { key: 'qna' as const, label: t('qna'), icon: <MessageCircle className="w-3 h-3 inline mr-1" /> },
    { key: 'resourcesTab' as const, label: t('resourcesTab'), icon: <FolderOpen className="w-3 h-3 inline mr-1" /> },
  ];

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/dashboard/my-courses')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-ui transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </button>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 space-y-4">
          {/* Video Player */}
          <div 
            className="relative aspect-video rounded-2xl overflow-hidden bg-black group/player cursor-none"
            onMouseMove={resetIdle}
            onMouseLeave={() => playing && setShowControls(false)}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
              <Play className="w-16 h-16 text-primary opacity-80 group-hover/player:opacity-100 transition-opacity" />
            </div>

            {/* Video Controls Overlay (simulated) */}
            <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setPlaying(!playing)} className="text-white">
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="text-xs text-white font-mono">{formatTime(currentTime)} / {formatTime(totalTime)}</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full relative">
                  <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <button onClick={() => setMuted(!muted)} className="text-white">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button className="text-white">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-display text-lg text-foreground font-bold">{course.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-ui">Instructor: {course.instructor}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleMarkComplete} 
                className="glass-button px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Mark as Completed
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="glass-card p-5">
            <div className="flex gap-2 border-b border-border/30 pb-3 mb-4">
              {tabConfig.map(tab => (
                <button 
                  key={tab.key} 
                  onClick={() => setActiveTab(tab.key)} 
                  className={`px-3 py-1.5 text-xs font-ui rounded-lg transition-colors ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="text-xs text-muted-foreground font-ui leading-relaxed"
              >
                {activeTab === 'overview' && (
                  <div className="space-y-3">
                    <p>Welcome to this course. In this lesson, we will cover the fundamentals and set up our workspace.</p>
                    <p>Make sure to download the resources from the resources tab and complete the exercises.</p>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input 
                        value={noteText} 
                        onChange={e => setNoteText(e.target.value)} 
                        placeholder="Add a note at this timestamp..." 
                        className="glass-input flex-1 px-3 py-2 text-xs" 
                      />
                      <button onClick={saveNote} className="glass-button px-4 py-2 text-xs">Save</button>
                    </div>
                    <div className="space-y-2">
                      {savedNotes.map((note, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-secondary/25 border border-border/30 flex justify-between items-start">
                          <p>{note.text}</p>
                          <span className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{formatTime(note.time)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'qna' && (
                  <div className="space-y-3">
                    {mockQA.map((q) => (
                      <div key={q.id} className="p-3 rounded-lg border border-border/30 space-y-2">
                        <div className="flex justify-between">
                          <span className="font-semibold text-foreground">{q.user}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{q.time}</span>
                        </div>
                        <p>{q.question}</p>
                        {q.replies.map((r, ri) => (
                          <div key={ri} className="pl-4 border-l-2 border-primary/30 mt-2">
                            <span className="font-semibold text-foreground text-[10px]">{r.user}</span>
                            <p className="text-[11px] mt-0.5">{r.text}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'resourcesTab' && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg border border-border/30 flex items-center justify-between hover:border-primary/35 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Lecture Outline.pdf</p>
                          <p className="text-[10px] text-muted-foreground">1.2 MB · PDF Document</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Modules */}
        <div className="w-full lg:w-80 glass-card p-4 h-fit">
          <h3 className="font-display text-sm text-foreground mb-4">Course Content</h3>
          <div className="space-y-2">
            {curriculum.map((mod) => {
              const isExpanded = expandedModules.includes(mod.id);
              return (
                <div key={mod.id} className="border border-border/20 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setExpandedModules(prev => isExpanded ? prev.filter(id => id !== mod.id) : [...prev, mod.id])}
                    className="w-full px-3 py-2.5 bg-secondary/20 flex items-center justify-between hover:bg-secondary/40 transition-colors"
                  >
                    <span className="font-ui text-xs font-semibold text-foreground text-left">{mod.title}</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {isExpanded && (
                    <div className="p-1 bg-card/50 divide-y divide-border/10">
                      {mod.lectures.map((lec) => (
                        <div key={lec.id} className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded-lg transition-colors cursor-pointer">
                          <div className="flex items-center gap-2 min-w-0">
                            {lec.completed ? <Check className="w-3.5 h-3.5 text-primary shrink-0" /> : <Play className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                            <span className="text-[11px] text-foreground font-ui truncate">{lec.title}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground font-mono">{lec.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
