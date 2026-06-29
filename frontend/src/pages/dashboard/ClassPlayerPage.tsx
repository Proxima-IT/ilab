import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  MessageCircle,
  Play,
  Pause,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudent } from "@/hooks/useStudentData";
import {
  learningService,
  type LessonNote,
  type PlayerData,
} from "@/services/student/learning.service";

const tabs = ["overview", "notes", "qna", "resourcesTab"] as const;

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLIFrameElement,
        options: { events?: { onStateChange?: (event: { data: number }) => void } }
      ) => {
        destroy: () => void;
        playVideo: () => void;
        pauseVideo: () => void;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
      };
      PlayerState?: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function formatTime(seconds?: number | null): string {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatDate(date?: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function ClassPlayerPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { courseSlug = "", lectureId = "" } = useParams();
  const { refetch } = useStudent();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const youtubePlayerRef = useRef<{
    destroy: () => void;
    playVideo: () => void;
    pauseVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  } | null>(null);
  const watchSecondsRef = useRef(0);

  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [watermarkPosition, setWatermarkPosition] = useState({ left: 4, top: 4 });
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("overview");
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [noteText, setNoteText] = useState("");
  const [questionText, setQuestionText] = useState("");

  const currentLessonId = player?.lesson.id ?? lectureId;
  const duration = player?.lesson.duration || 0;
  const watchPercent = duration > 0 ? Math.min(100, Math.round((watchSeconds / duration) * 100)) : 0;

  useEffect(() => {
    watchSecondsRef.current = watchSeconds;
  }, [watchSeconds]);

  const loadPlayer = useCallback(async () => {
    if (!courseSlug || !lectureId) return;

    setLoading(true);

    try {
      const data = await learningService.getPlayer(courseSlug, lectureId);
      setPlayer(data);
      setWatchSeconds(data.lesson.watch_seconds || 0);
      setExpandedModules(data.course.sections.map((section) => section.id));
    } catch (error) {
      const status = (error as { response?: { status?: number; data?: { message?: string } } }).response?.status;
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Lesson load kora jacche na.";

      toast.error(message);

      if (status === 401) {
        navigate("/login", { replace: true });
      } else if (status === 403 || status === 404) {
        navigate("/dashboard/my-courses", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [courseSlug, lectureId, navigate]);

  useEffect(() => {
    void loadPlayer();
  }, [loadPlayer]);

  useEffect(() => {
    if (!player || player.lesson.type !== "video" || player.lesson.is_completed || !isTracking) return;

    const interval = window.setInterval(() => {
      setWatchSeconds((current) => Math.min(duration || current + 1, current + 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [duration, isTracking, player]);

  useEffect(() => {
    const positions = [
      { left: 4, top: 4 },
      { left: 64, top: 8 },
      { left: 12, top: 46 },
      { left: 52, top: 58 },
      { left: 34, top: 28 },
      { left: 72, top: 42 },
    ];
    let index = 0;

    const interval = window.setInterval(() => {
      index = (index + 1) % positions.length;
      setWatermarkPosition(positions[index]);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!player?.lesson.video_embed_url || !iframeRef.current) return;

    let cancelled = false;

    const createPlayer = () => {
      if (cancelled || !window.YT?.Player || !iframeRef.current) return;

      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (event) => {
            const state = window.YT?.PlayerState;

            if (!state) return;

            if (event.data === state.PLAYING) {
              setIsPlaying(true);
              setIsTracking(true);
            }

            if (event.data === state.PAUSED) {
              setIsPlaying(false);
              setIsTracking(false);
              void learningService.syncWatchTime(currentLessonId, watchSecondsRef.current);
            }

            if (event.data === state.ENDED) {
              setIsPlaying(false);
              setIsTracking(false);
              setWatchSeconds(duration);
              void (async () => {
                try {
                  await learningService.syncWatchTime(currentLessonId, duration);
                  await learningService.markComplete(currentLessonId);
                  toast.success("Lesson completed automatically.");
                  await loadPlayer();
                  await refetch();
                } catch {
                  toast.error("Lesson auto complete hoyni.");
                }
              })();
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      window.onYouTubeIframeAPIReady = createPlayer;

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      setIsTracking(false);
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, [currentLessonId, duration, loadPlayer, player?.lesson.video_embed_url, refetch]);

  useEffect(() => {
    if (!player || player.lesson.type !== "video") return;

    const interval = window.setInterval(() => {
      void learningService.syncWatchTime(currentLessonId, watchSeconds);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [currentLessonId, player, watchSeconds]);

  const allLessons = useMemo(
    () => player?.course.sections.flatMap((section) => section.lessons) || [],
    [player]
  );
  const currentIndex = allLessons.findIndex((lesson) => String(lesson.id) === String(currentLessonId));
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const reloadAfterMutation = async () => {
    await loadPlayer();
    await refetch();
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;

    setSaving(true);

    try {
      const note = await learningService.addNote(currentLessonId, noteText.trim(), watchSeconds);
      setPlayer((current) =>
        current
          ? {
              ...current,
              lesson: {
                ...current.lesson,
                notes: [...current.lesson.notes, note],
              },
            }
          : current
      );
      setNoteText("");
      toast.success("Note saved.");
    } catch {
      toast.error("Note save hoyni.");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (note: LessonNote) => {
    try {
      await learningService.deleteNote(currentLessonId, note.id);
      setPlayer((current) =>
        current
          ? {
              ...current,
              lesson: {
                ...current.lesson,
                notes: current.lesson.notes.filter((item) => item.id !== note.id),
              },
            }
          : current
      );
    } catch {
      toast.error("Note delete hoyni.");
    }
  };

  const askQuestion = async () => {
    if (!questionText.trim()) return;

    setSaving(true);

    try {
      const question = await learningService.addQuestion(currentLessonId, questionText.trim());
      setPlayer((current) =>
        current
          ? {
              ...current,
              lesson: {
                ...current.lesson,
                questions: [question, ...current.lesson.questions],
              },
            }
          : current
      );
      setQuestionText("");
      toast.success("Question submitted.");
    } catch {
      toast.error("Question submit hoyni.");
    } finally {
      setSaving(false);
    }
  };

  const markComplete = async () => {
    setSaving(true);

    try {
      await learningService.syncWatchTime(currentLessonId, watchSeconds);
      await learningService.markComplete(currentLessonId);
      toast.success("Lesson marked as complete.");
      await reloadAfterMutation();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Lesson complete kora jacche na.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openLesson = (lessonId: number | string) => {
    navigate(`/dashboard/player/${courseSlug}/${lessonId}`);
  };

  const togglePlayback = () => {
    if (!youtubePlayerRef.current) return;

    if (isPlaying) {
      youtubePlayerRef.current.pauseVideo();
    } else {
      youtubePlayerRef.current.playVideo();
    }
  };

  const seekVideo = (event: MouseEvent<HTMLDivElement>) => {
    if (!youtubePlayerRef.current || duration <= 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const seconds = Math.floor(percent * duration);

    youtubePlayerRef.current.seekTo(seconds, true);
    setWatchSeconds(seconds);
    void learningService.syncWatchTime(currentLessonId, seconds);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="h-96 flex-1 rounded-2xl border border-border/30 bg-card" />
          <div className="h-96 w-full rounded-2xl border border-border/30 bg-card lg:w-80" />
        </div>
      </div>
    );
  }

  if (!player) {
    return null;
  }

  const tabConfig = [
    { key: "overview" as const, label: "Overview", icon: <FileText className="mr-1 inline h-3 w-3" /> },
    { key: "notes" as const, label: t("notes"), icon: <FileText className="mr-1 inline h-3 w-3" /> },
    { key: "qna" as const, label: t("qna"), icon: <MessageCircle className="mr-1 inline h-3 w-3" /> },
    { key: "resourcesTab" as const, label: t("resourcesTab"), icon: <FolderOpen className="mr-1 inline h-3 w-3" /> },
  ];

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate("/dashboard/my-courses")}
        className="flex items-center gap-1.5 font-ui text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </button>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
            {player.lesson.video_embed_url ? (
              <iframe
                ref={iframeRef}
                src={player.lesson.video_embed_url}
                title={player.lesson.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-zinc-300">
                Video is not available for this lesson.
              </div>
            )}

            {player.lesson.video_embed_url && (
              <div
                className="absolute inset-x-0 top-0 z-10 h-16 bg-transparent"
                aria-hidden="true"
              />
            )}

            <motion.div
              animate={{
                left: `${watermarkPosition.left}%`,
                top: `${watermarkPosition.top}%`,
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="pointer-events-none absolute rounded bg-black/40 px-2 py-1 font-mono text-[10px] text-white/80"
            >
              {player.watermark.email || player.watermark.name}
            </motion.div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white text-black transition hover:bg-primary hover:text-primary-foreground"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <span className="font-mono text-xs text-white">
                  {formatTime(watchSeconds)} / {formatTime(duration)}
                </span>
                <div
                  onClick={seekVideo}
                  className="relative h-2 flex-1 cursor-pointer rounded-full bg-white/20"
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ width: `${watchPercent}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow"
                    style={{ left: `calc(${watchPercent}% - 7px)` }}
                  />
                </div>
                <span className="font-mono text-xs text-white">{watchPercent}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                {player.lesson.title}
              </h2>
              <p className="mt-0.5 font-ui text-xs text-muted-foreground">
                {player.course.title}
                {player.course.instructor?.name ? ` · ${player.course.instructor.name}` : ""}
              </p>
            </div>

            <button
              onClick={markComplete}
              disabled={saving || player.lesson.is_completed}
              className="glass-button flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {player.lesson.is_completed ? "Completed" : "Mark as Completed"}
            </button>
          </div>

          <div className="glass-card p-5">
            <div className="mb-4 flex flex-wrap gap-2 border-b border-border/30 pb-3">
              {tabConfig.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-lg px-3 py-1.5 font-ui text-xs transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="font-ui text-xs leading-relaxed text-muted-foreground"
              >
                {activeTab === "overview" && (
                  <div className="space-y-3">
                    <p>{player.lesson.content || player.course.description || "No lesson overview added yet."}</p>
                    <p className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      Lesson duration: {formatTime(duration)}
                    </p>
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        value={noteText}
                        onChange={(event) => setNoteText(event.target.value)}
                        placeholder={`Add a note at ${formatTime(watchSeconds)}`}
                        className="glass-input flex-1 px-3 py-2 text-xs"
                      />
                      <button
                        onClick={saveNote}
                        disabled={saving}
                        className="glass-button flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-60"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </button>
                    </div>

                    <div className="space-y-2">
                      {player.lesson.notes.length === 0 && <p>No notes saved yet.</p>}
                      {player.lesson.notes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-border/30 bg-secondary/25 p-2.5"
                        >
                          <div>
                            <span className="mb-1 inline-flex rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">
                              {formatTime(note.timestamp_seconds)}
                            </span>
                            <p>{note.note}</p>
                          </div>
                          <button onClick={() => void deleteNote(note)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "qna" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <textarea
                        value={questionText}
                        onChange={(event) => setQuestionText(event.target.value)}
                        placeholder="Ask a question about this lesson..."
                        rows={3}
                        className="glass-input w-full resize-none px-3 py-2 text-xs"
                      />
                      <button
                        onClick={askQuestion}
                        disabled={saving}
                        className="glass-button flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-60"
                      >
                        <Send className="h-3 w-3" />
                        Submit Question
                      </button>
                    </div>

                    <div className="space-y-3">
                      {player.lesson.questions.length === 0 && <p>No questions yet.</p>}
                      {player.lesson.questions.map((question) => (
                        <div key={question.id} className="space-y-3 rounded-lg border border-border/30 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">
                                {question.user?.name || "Student"}
                              </p>
                              <p className="mt-1">{question.question}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[9px] uppercase">
                              {question.status}
                            </span>
                          </div>

                          {question.answers.map((answer) => (
                            <div key={answer.id} className="border-l-2 border-primary/30 pl-3">
                              <p className="font-semibold text-foreground">
                                {answer.user?.name || "iLab"}
                                {answer.is_instructor_answer && (
                                  <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
                                    Instructor
                                  </span>
                                )}
                              </p>
                              <p className="mt-1 text-[11px]">{answer.answer}</p>
                              <p className="mt-1 text-[9px] text-muted-foreground">
                                {formatDate(answer.created_at)}
                              </p>
                            </div>
                          ))}

                          {question.answers.length === 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              Instructor answer pending.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "resourcesTab" && (
                  <div className="space-y-2">
                    {player.lesson.resources.length === 0 && <p>No resources added yet.</p>}
                    {player.lesson.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-border/30 p-3 transition-colors hover:border-primary/35"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-semibold text-foreground">{resource.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {resource.type.replace("_", " ")}
                              {resource.file_size ? ` · ${resource.file_size}` : ""}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <aside className="glass-card h-fit w-full p-4 lg:w-80">
          <h3 className="mb-4 font-display text-sm text-foreground">Course Content</h3>
          <div className="space-y-2">
            {player.course.sections.map((section) => {
              const isExpanded = expandedModules.includes(section.id);

              return (
                <div key={section.id} className="overflow-hidden rounded-xl border border-border/20">
                  <button
                    onClick={() =>
                      setExpandedModules((current) =>
                        isExpanded
                          ? current.filter((id) => id !== section.id)
                          : [...current, section.id]
                      )
                    }
                    className="flex w-full items-center justify-between bg-secondary/20 px-3 py-2.5 transition-colors hover:bg-secondary/40"
                  >
                    <span className="text-left font-ui text-xs font-semibold text-foreground">
                      {section.title}
                    </span>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-border/10 bg-card/50 p-1">
                      {section.lessons.map((lesson) => {
                        const active = String(lesson.id) === String(currentLessonId);
                        const disabled = lesson.is_available === false;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              if (!disabled) openLesson(lesson.id);
                            }}
                            disabled={disabled}
                            className={`flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors ${
                              active ? "bg-primary/10 text-primary" : "hover:bg-secondary/20"
                            } ${disabled ? "cursor-not-allowed opacity-45 hover:bg-transparent" : ""}`}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              {lesson.is_completed ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                              ) : (
                                <Play className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <span className="truncate font-ui text-[11px]">
                                {lesson.title}
                                {disabled && (
                                  <span className="ml-1 text-[9px] text-muted-foreground">
                                    Not added
                                  </span>
                                )}
                              </span>
                            </div>
                            <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
                              {formatTime(lesson.duration)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {previousLesson && (
              <button
                onClick={() => openLesson(previousLesson.id)}
                className="rounded-lg border border-border/30 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Previous
              </button>
            )}
            {nextLesson && (
              <button
                onClick={() => openLesson(nextLesson.id)}
                className="rounded-lg border border-border/30 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Next
              </button>
            )}
          </div>

          <Link
            to={`/courses/${player.course.slug}`}
            className="mt-3 block text-center text-[11px] text-muted-foreground hover:text-foreground"
          >
            View public course page
          </Link>
        </aside>
      </div>
    </div>
  );
}
