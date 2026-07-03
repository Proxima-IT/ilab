import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  MessageCircle,
  Newspaper,
  RefreshCw,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  adminDashboardService,
  type AdminDashboardData,
  type DashboardPeriod,
} from "@/services/admin/dashboard.service";

const periods: { label: string; value: DashboardPeriod }[] = [
  { label: "Today", value: "today" },
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
  { label: "1 year", value: "365" },
  { label: "All time", value: "all" },
];

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string } } }).response?.data;
  return data?.message || fallback;
}

function money(value?: string | number | null) {
  return `৳${Number(value || 0).toLocaleString()}`;
}

function number(value?: string | number | null) {
  return Number(value || 0).toLocaleString();
}

function percent(value?: string | number | null) {
  return `${Math.round(Number(value || 0))}%`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatChartDate(value: string, period: DashboardPeriod) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: period === "365" || period === "all" ? undefined : "numeric",
    year: period === "all" ? "2-digit" : undefined,
  });
}

function statusClass(status: string) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "completed") return "bg-sky-500/10 text-sky-300";
  if (status === "suspended") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("today");
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const maxRevenue = useMemo(() => {
    if (!data?.revenue_overview.length) return 0;
    return Math.max(...data.revenue_overview.map((item) => Number(item.revenue || 0)));
  }, [data]);

  const maxGrowth = useMemo(() => {
    const students = data?.growth_overview.students.map((item) => item.students) || [];
    const enrollments = data?.growth_overview.enrollments.map((item) => item.enrollments) || [];
    return Math.max(0, ...students, ...enrollments);
  }, [data]);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      setData(await adminDashboardService.get(period, 8));
    } catch (error) {
      setData(null);
      toast.error(firstError(error, "Dashboard load hoyni."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [period]);

  if (loading && !data) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {data?.role_view === "instructor"
              ? "Overview for your courses, enrollments, and student progress."
              : "Overview of platform sales, students, courses, and learning activity."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}
            className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-primary"
          >
            {periods.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Wallet}
          label={period === "today" ? "Today's Revenue" : "Period Revenue"}
          value={money(metrics?.total_revenue)}
          tone="text-emerald-300 bg-emerald-500/10"
        />
        <MetricCard
          icon={ShoppingBag}
          label="Active Enrollments"
          value={number(metrics?.active_enrollments)}
          tone="text-primary bg-primary/10"
        />
        <MetricCard
          icon={BookOpen}
          label="Courses"
          value={number(metrics?.total_courses)}
          tone="text-sky-300 bg-sky-500/10"
        />
        <MetricCard
          icon={Users}
          label="Registered Students"
          value={number(metrics?.total_registered_students)}
          tone="text-amber-300 bg-amber-500/10"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <TodayCard label="Today's revenue" value={money(data?.today_overview.revenue)} />
        <TodayCard label="Today's enrollments" value={number(data?.today_overview.enrollments)} />
        <TodayCard label="New students today" value={number(data?.today_overview.students_registered)} />
        <TodayCard label="Certificates today" value={number(data?.today_overview.certificates)} />
        <TodayCard label="New open Q&A today" value={number(data?.today_overview.open_questions)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <MiniPanel
          icon={GraduationCap}
          title="Students"
          items={[
            ["Unique enrolled", number(metrics?.total_students)],
            ["New enrollments", number(data?.student_overview.new_enrollments)],
            ["Average progress", percent(data?.student_overview.average_progress)],
          ]}
        />
        <MiniPanel
          icon={BookOpen}
          title="Course Status"
          items={[
            ["Published", number(data?.course_overview.published)],
            ["Draft", number(data?.course_overview.draft)],
            ["Archived", number(data?.course_overview.archived)],
          ]}
        />
        <MiniPanel
          icon={CheckCircle2}
          title="Course Type"
          items={[
            ["Paid", number(data?.course_overview.paid)],
            ["Free", number(data?.course_overview.free)],
            ["Completed", number(metrics?.completed_enrollments)],
            ["Suspended", number(metrics?.suspended_enrollments)],
          ]}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OwnerCard icon={Wallet} label="Completed payments" value={money(data?.payment_overview.completed_amount)} />
        <OwnerCard icon={AlertTriangle} label="Pending payments" value={money(data?.payment_overview.pending_amount)} />
        <OwnerCard icon={Award} label="Certificates issued" value={number(data?.content_overview.certificates)} />
        <OwnerCard icon={MessageCircle} label="Open Q&A" value={number(data?.content_overview.open_questions)} />
        <OwnerCard icon={CalendarDays} label="Event registrations" value={number(data?.content_overview.event_registrations)} />
        <OwnerCard icon={Newspaper} label="Published blogs" value={number(data?.content_overview.published_blog_posts)} />
        <OwnerCard icon={Star} label="Published reviews" value={number(data?.content_overview.published_reviews)} />
        <OwnerCard icon={Mail} label="Newsletter subscribers" value={number(data?.content_overview.newsletter_subscribers)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Revenue Trend</h2>
              <p className="mt-1 text-xs text-zinc-500">
                {period === "365" || period === "all"
                  ? "Monthly revenue and enrollment movement."
                  : "Daily revenue and enrollment movement."}
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>

          {!data?.revenue_overview.length ? (
            <EmptyState label="No revenue data for this period." />
          ) : (
            <div className="overflow-x-auto pb-1">
              <div className="flex h-64 min-w-[640px] items-end gap-2 border-b border-zinc-800 pb-3">
                {data.revenue_overview.map((item) => {
                  const height = maxRevenue > 0 ? Math.max(8, (Number(item.revenue || 0) / maxRevenue) * 100) : 8;

                  return (
                    <div key={item.date} className="group flex min-w-4 flex-1 flex-col items-center gap-2">
                      <div className="relative flex h-52 w-full items-end">
                        <div
                          className="w-full rounded-t-md bg-primary/80 transition group-hover:bg-primary"
                          style={{ height: `${height}%` }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden min-w-36 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-center text-[11px] shadow-xl group-hover:block">
                          <div className="font-semibold text-white">{money(item.revenue)}</div>
                          <div className="text-zinc-500">{item.enrollments} enrollments</div>
                          <div className="text-zinc-500">{formatDate(item.date)}</div>
                        </div>
                      </div>
                      <span className="w-full truncate text-center text-[10px] text-zinc-500">
                        {formatChartDate(item.date, period)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50">
          <PanelHeader title="Top Courses" subtitle="By enrollment count" icon={<BarChart3 className="h-4 w-4" />} />
          <div className="divide-y divide-zinc-800">
            {!data?.top_courses.length ? (
              <EmptyState label="No course enrollment data." />
            ) : (
              data.top_courses.map((course) => (
                <div key={course.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{course.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{course.slug || "-"}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary">
                      {course.enrollment_count} enrolled
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded-lg bg-zinc-950 px-3 py-2 text-zinc-400">
                      Revenue <b className="ml-1 text-zinc-100">{money(course.generated_revenue)}</b>
                    </span>
                    <span className="rounded-lg bg-zinc-950 px-3 py-2 text-zinc-400">
                      Avg <b className="ml-1 text-zinc-100">{percent(course.average_progress)}</b>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Growth</h2>
              <p className="mt-1 text-xs text-zinc-500">Students and enrollments by date.</p>
            </div>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <DualBarChart
            rows={mergeGrowthRows(data)}
            max={maxGrowth}
            period={period}
            firstKey="students"
            secondKey="enrollments"
            firstLabel="Students"
            secondLabel="Enrollments"
          />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Payment Status</h2>
              <p className="mt-1 text-xs text-zinc-500">Payment amount by status.</p>
            </div>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <HorizontalBars
            rows={(data?.payment_overview.by_status || []).map((item) => ({
              label: item.status,
              value: item.amount,
              caption: `${item.total} payments`,
            }))}
            formatValue={money}
          />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Enrollment Status</h2>
              <p className="mt-1 text-xs text-zinc-500">Course access state.</p>
            </div>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <HorizontalBars
            rows={(data?.enrollment_status_overview || []).map((item) => ({
              label: item.status,
              value: item.total,
              caption: "enrollments",
            }))}
            formatValue={number}
          />
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <PanelHeader title="Recent Enrollments" subtitle="Latest course access" icon={<ShoppingBag className="h-4 w-4" />} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {!data?.recent_enrollments.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10">
                      <EmptyState label="No enrollments yet." />
                    </td>
                  </tr>
                ) : (
                  data.recent_enrollments.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-100">{row.student_name}</div>
                        <div className="text-xs text-zinc-500">{row.student_email || row.student_phone || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{row.course_title}</td>
                      <td className="px-4 py-3 text-zinc-300">{money(row.enrolled_price)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-[11px] capitalize ${statusClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{formatDate(row.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <PanelHeader
            title="Needs Attention"
            subtitle="Active students with 20% or lower progress"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <div className="divide-y divide-zinc-800">
            {!data?.low_progress_students.length ? (
              <EmptyState label="No low-progress students found." />
            ) : (
              data.low_progress_students.map((row, index) => (
                <div key={`${row.student_email}-${row.course_title}-${index}`} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{row.student_name}</p>
                      <p className="mt-1 truncate text-xs text-zinc-500">{row.student_email || "-"}</p>
                      <p className="mt-1 truncate text-xs text-zinc-400">{row.course_title}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
                      {percent(row.progress_percentage)}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${Math.max(0, Math.min(100, Number(row.progress_percentage || 0)))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-400">{label}</div>
    </div>
  );
}

function MiniPanel({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof GraduationCap;
  title: string;
  items: [string, string][];
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <div className="space-y-3">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">{label}</span>
            <span className="font-semibold text-zinc-100">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      </div>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="p-6 text-center text-sm text-zinc-500">{label}</div>;
}

function TodayCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function OwnerCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

type GrowthRow = {
  date: string;
  students: number;
  enrollments: number;
};

function mergeGrowthRows(data: AdminDashboardData | null): GrowthRow[] {
  const rows = new Map<string, GrowthRow>();

  for (const item of data?.growth_overview.students || []) {
    rows.set(item.date, {
      date: item.date,
      students: item.students,
      enrollments: rows.get(item.date)?.enrollments || 0,
    });
  }

  for (const item of data?.growth_overview.enrollments || []) {
    rows.set(item.date, {
      date: item.date,
      students: rows.get(item.date)?.students || 0,
      enrollments: item.enrollments,
    });
  }

  return Array.from(rows.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function DualBarChart({
  rows,
  max,
  period,
  firstKey,
  secondKey,
  firstLabel,
  secondLabel,
}: {
  rows: GrowthRow[];
  max: number;
  period: DashboardPeriod;
  firstKey: "students";
  secondKey: "enrollments";
  firstLabel: string;
  secondLabel: string;
}) {
  if (!rows.length) return <EmptyState label="No growth data for this period." />;

  return (
    <div>
      <div className="mb-4 flex gap-4 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {firstLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          {secondLabel}
        </span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex h-48 min-w-[420px] items-end gap-2 border-b border-zinc-800 pb-3">
          {rows.map((row) => {
            const firstHeight = max > 0 ? Math.max(6, (row[firstKey] / max) * 100) : 6;
            const secondHeight = max > 0 ? Math.max(6, (row[secondKey] / max) * 100) : 6;

            return (
              <div key={row.date} className="group flex min-w-4 flex-1 flex-col items-center gap-2">
                <div className="relative flex h-40 w-full items-end justify-center gap-1">
                  <div className="w-2 rounded-t bg-primary" style={{ height: `${firstHeight}%` }} />
                  <div className="w-2 rounded-t bg-sky-400" style={{ height: `${secondHeight}%` }} />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden min-w-36 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-center text-[11px] shadow-xl group-hover:block">
                    <div className="text-white">{formatDate(row.date)}</div>
                    <div className="text-zinc-500">{firstLabel}: {row[firstKey]}</div>
                    <div className="text-zinc-500">{secondLabel}: {row[secondKey]}</div>
                  </div>
                </div>
                <span className="w-full truncate text-center text-[10px] text-zinc-500">
                  {formatChartDate(row.date, period)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HorizontalBars({
  rows,
  formatValue,
}: {
  rows: { label: string; value: number; caption: string }[];
  formatValue: (value: number) => string;
}) {
  if (!rows.length) return <EmptyState label="No data for this period." />;

  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="capitalize text-zinc-300">{row.label}</span>
            <span className="text-zinc-500">
              {formatValue(row.value)} {row.caption}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
