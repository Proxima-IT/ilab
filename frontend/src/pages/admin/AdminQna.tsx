import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminQnaService,
  type AdminQnaQuestion,
} from "@/services/admin/qna.service";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClass(status: string) {
  if (status === "answered") return "bg-emerald-500/10 text-emerald-300";
  if (status === "closed") return "bg-zinc-700/40 text-zinc-300";
  return "bg-amber-500/10 text-amber-300";
}

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

type PageMeta = {
  current: number;
  last: number;
  total: number;
};

const emptyMeta: PageMeta = { current: 1, last: 1, total: 0 };

function Pagination({
  meta,
  onPage,
  disabled,
}: {
  meta: PageMeta;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-zinc-500">
        Page {meta.current} of {meta.last} · {meta.total} total
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || meta.current <= 1}
          onClick={() => onPage(meta.current - 1)}
          className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || meta.current >= meta.last}
          onClick={() => onPage(meta.current + 1)}
          className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminQna() {
  const [questions, setQuestions] = useState<AdminQnaQuestion[]>([]);
  const [unanswered, setUnanswered] = useState<AdminQnaQuestion[]>([]);
  const [lessonHistory, setLessonHistory] = useState<AdminQnaQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<AdminQnaQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [unansweredLoading, setUnansweredLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [mainPage, setMainPage] = useState(1);
  const [unansweredPage, setUnansweredPage] = useState(1);
  const [mainMeta, setMainMeta] = useState<PageMeta>(emptyMeta);
  const [unansweredMeta, setUnansweredMeta] = useState<PageMeta>(emptyMeta);

  const openCount = useMemo(() => unansweredMeta.total, [unansweredMeta.total]);
  const chatHistory = useMemo(
    () => [...lessonHistory].sort((first, second) => {
      return new Date(first.created_at || 0).getTime() - new Date(second.created_at || 0).getTime();
    }),
    [lessonHistory]
  );

  const syncSelectedQuestion = (nextQuestions: AdminQnaQuestion[]) => {
    if (!selectedQuestion) return;
    const fresh = nextQuestions.find((question) => question.id === selectedQuestion.id);
    if (fresh) setSelectedQuestion(fresh);
  };

  const loadQuestions = async () => {
    setLoading(true);

    try {
      const data = await adminQnaService.list({
        search: searchTerm,
        status,
        page: mainPage,
        perPage: 20,
      });
      setQuestions(data.data);
      setMainMeta({
        current: data.current_page,
        last: data.last_page,
        total: data.total,
      });
      syncSelectedQuestion(data.data);
    } catch (error) {
      toast.error(firstError(error, "Q&A list load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  const loadUnanswered = async () => {
    setUnansweredLoading(true);

    try {
      const data = await adminQnaService.list({
        status: "open",
        page: unansweredPage,
        perPage: 25,
      });
      setUnanswered(data.data);
      setUnansweredMeta({
        current: data.current_page,
        last: data.last_page,
        total: data.total,
      });
      if (!selectedQuestion && data.data[0]) {
        setSelectedQuestion(data.data[0]);
      }
    } catch (error) {
      toast.error(firstError(error, "Unanswered questions load hoyni."));
    } finally {
      setUnansweredLoading(false);
    }
  };

  const loadLessonHistory = async (question: AdminQnaQuestion | null) => {
    const lessonId = question?.lesson?.id;
    const userId = question?.user?.id;

    if (!lessonId || !userId) {
      setLessonHistory([]);
      return;
    }

    setHistoryLoading(true);

    try {
      const data = await adminQnaService.list({
        lessonId,
        userId,
        page: 1,
        perPage: 50,
      });
      setLessonHistory(data.data);
    } catch (error) {
      toast.error(firstError(error, "Class Q&A history load hoyni."));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
  }, [searchTerm, status, mainPage]);

  useEffect(() => {
    void loadUnanswered();
  }, [unansweredPage]);

  useEffect(() => {
    void loadLessonHistory(selectedQuestion);
    setAnswerText("");
  }, [selectedQuestion?.id]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setMainPage(1);
    setSearchTerm(query.trim());
  };

  const selectQuestion = (question: AdminQnaQuestion) => {
    setSelectedQuestion(question);
  };

  const submitAnswer = async () => {
    if (!selectedQuestion) return;

    const answer = answerText.trim();

    if (!answer) {
      toast.error("Answer is required.");
      return;
    }

    setSavingId(selectedQuestion.id);

    try {
      const data = await adminQnaService.answer(selectedQuestion.id, answer);

      if (data.question) {
        setSelectedQuestion(data.question);
      }

      setAnswerText("");
      await Promise.all([loadQuestions(), loadUnanswered(), loadLessonHistory(data.question || selectedQuestion)]);
      toast.success("Answer submitted.");
    } catch (error) {
      toast.error(firstError(error, "Answer submit hoyni."));
    } finally {
      setSavingId(null);
    }
  };

  const closeQuestion = async () => {
    if (!selectedQuestion) return;

    setSavingId(selectedQuestion.id);

    try {
      await adminQnaService.close(selectedQuestion.id);
      const closed = { ...selectedQuestion, status: "closed" as const };
      setSelectedQuestion(closed);
      await Promise.all([loadQuestions(), loadUnanswered(), loadLessonHistory(closed)]);
      toast.success("Question closed.");
    } catch (error) {
      toast.error(firstError(error, "Question close hoyni."));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Lesson Q&A</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Answer student questions from course lessons. Instructors only see their own courses.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search question, student, lesson..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border-zinc-700 bg-zinc-900 text-white sm:w-72"
            />
            <Button type="submit" variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setMainPage(1);
            }}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="">All status</option>
            <option value="open">Open</option>
            <option value="answered">Answered</option>
            <option value="closed">Closed</option>
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void loadQuestions();
              void loadUnanswered();
            }}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="border-b border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Unanswered</h2>
                <p className="mt-1 text-xs text-zinc-500">Newest open questions</p>
              </div>
              <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">
                {openCount}
              </span>
            </div>
          </div>

          <div className="max-h-[680px] overflow-y-auto p-3">
            {unansweredLoading ? (
              <div className="p-8 text-center text-zinc-500">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </div>
            ) : unanswered.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">No unanswered questions.</div>
            ) : (
              <div className="space-y-2">
                {unanswered.map((question) => {
                  const selected = selectedQuestion?.id === question.id;

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => selectQuestion(question)}
                      className={
                        "w-full rounded-lg border p-3 text-left transition " +
                        (selected
                          ? "border-primary/40 bg-primary/10"
                          : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-white">
                          {question.user?.name || "Student"}
                        </span>
                        <span className="shrink-0 text-[10px] text-zinc-500">
                          {formatDate(question.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-300">
                        {question.question}
                      </p>
                      <p className="mt-2 truncate text-[10px] text-zinc-500">
                        {question.lesson?.section?.course?.title || "-"} · {question.lesson?.title || "-"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {unansweredMeta.total > 25 && (
            <div className="border-t border-zinc-800 p-3">
              <Pagination
                meta={unansweredMeta}
                disabled={unansweredLoading}
                onPage={setUnansweredPage}
              />
            </div>
          )}
        </aside>

        <main className="space-y-5">
          <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="px-5 pt-5 text-sm font-semibold text-white">Student Q&A Chat</h2>
                <p className="px-5 pt-1 text-xs text-zinc-500">
                  Only the selected open question and previous Q&A from the same student for this class
                </p>
              </div>
              {historyLoading && <Loader2 className="mr-5 mt-5 h-4 w-4 animate-spin text-zinc-500" />}
            </div>

            {!selectedQuestion ? (
              <div className="px-5 pb-8 pt-4 text-center text-zinc-500">
                <MessageCircle className="mx-auto h-10 w-10" />
                <p className="mt-3 text-sm">Select an unanswered question to answer.</p>
              </div>
            ) : selectedQuestion.status !== "open" ? (
              <div className="px-5 pb-8 pt-4 text-center text-zinc-500">
                <MessageCircle className="mx-auto h-10 w-10" />
                <p className="mt-3 text-sm">Only open questions can be answered here.</p>
              </div>
            ) : lessonHistory.length === 0 ? (
              <div className="px-5 pb-8 pt-4 text-sm text-zinc-500">
                No previous Q&A found from this student for this class.
              </div>
            ) : (
              <>
                <div className="border-y border-zinc-800 bg-zinc-950/50 px-5 py-3">
                  <div className="font-semibold text-zinc-100">{selectedQuestion.user?.name || "Student"}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {selectedQuestion.user?.email || selectedQuestion.user?.phone || "No contact"} · {selectedQuestion.lesson?.section?.course?.title || "-"} · {selectedQuestion.lesson?.title || "-"}
                  </div>
                </div>

                <div className="admin-scrollbar max-h-[520px] space-y-4 overflow-y-auto bg-zinc-950/60 p-4">
                  {chatHistory.map((question) => (
                    <div key={question.id} className="space-y-3">
                      <div className="flex justify-start">
                        <div
                          className={
                            "max-w-[82%] rounded-2xl rounded-bl-md border px-4 py-3 " +
                            (question.id === selectedQuestion.id
                              ? "border-primary/30 bg-primary/10"
                              : "border-zinc-800 bg-zinc-900")
                          }
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-white">
                              {question.user?.name || "Student"}
                            </span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] capitalize ${statusClass(question.status)}`}>
                              {question.status}
                            </span>
                          </div>
                          <p className="text-sm leading-6 text-zinc-200">{question.question}</p>
                          <p className="mt-1 text-[10px] text-zinc-500">{formatDate(question.created_at)}</p>
                        </div>
                      </div>

                      {question.answers.length > 0 && (
                        <div className="space-y-2">
                          {question.answers.map((answer) => (
                            <div key={answer.id} className="flex justify-end">
                              <div className="max-w-[82%] rounded-2xl rounded-br-md border border-primary/20 bg-primary/10 px-4 py-3">
                                <div className="mb-1 flex flex-wrap items-center justify-end gap-2">
                                  <span className="text-xs font-semibold text-primary">
                                    {answer.user?.name || "Staff"}
                                  </span>
                                  {answer.is_instructor_answer && (
                                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
                                      Answer
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm leading-6 text-zinc-100">{answer.answer}</p>
                                <p className="mt-1 text-right text-[10px] text-zinc-500">
                                  {formatDate(answer.created_at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.answers.length === 0 && question.id !== selectedQuestion.id && (
                        <div className="flex justify-end">
                          <div className="max-w-[82%] rounded-2xl rounded-br-md border border-zinc-800 bg-zinc-900/70 px-4 py-3">
                            <p className="text-xs text-zinc-500">Answer pending.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-800 bg-zinc-900/80 p-4">
                  <textarea
                    value={answerText}
                    onChange={(event) => setAnswerText(event.target.value)}
                    rows={4}
                    placeholder={`Write an answer to ${selectedQuestion.user?.name || "this student"}...`}
                    className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary"
                  />
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={savingId === selectedQuestion.id}
                      onClick={() => void closeQuestion()}
                      className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Close
                    </Button>
                    <Button
                      type="button"
                      disabled={savingId === selectedQuestion.id}
                      onClick={() => void submitAnswer()}
                    >
                      {savingId === selectedQuestion.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Submit Answer
                    </Button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">All Questions</h2>
                <p className="mt-1 text-xs text-zinc-500">Paginated list with current filters</p>
              </div>
              <Pagination meta={mainMeta} disabled={loading} onPage={setMainPage} />
            </div>

            {loading ? (
              <div className="p-8 text-center text-zinc-500">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">No questions found.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {questions.map((question) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => {
                      if (question.status === "open") selectQuestion(question);
                    }}
                    className={
                      "flex w-full flex-col gap-2 px-1 py-3 text-left transition sm:flex-row sm:items-center sm:justify-between " +
                      (question.status === "open"
                        ? "hover:bg-zinc-950/30"
                        : "cursor-default opacity-70")
                    }
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${statusClass(question.status)}`}>
                          {question.status}
                        </span>
                        <span className="text-xs font-semibold text-white">{question.user?.name || "Student"}</span>
                      </span>
                      <span className="mt-1 line-clamp-1 block text-xs text-zinc-400">{question.question}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-zinc-500">{formatDate(question.created_at)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
