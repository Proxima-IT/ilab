import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CourseCard } from "@/components/site/CourseCard";

import {
  fetchCourses,
  CATEGORIES,
  LEVELS,
  MODES,
  SORTS,
  type CoursesResult,
} from "@/services/courses";

const SORT_LABELS: Record<(typeof SORTS)[number], string> = {
  newest: "Newest",
  popular: "Most Popular",
  rating: "Top Rated",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

export default function CourseListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const level = searchParams.get("level") || "";
  const mode = searchParams.get("mode") || "";
  const sort = (searchParams.get("sort") as typeof SORTS[number]) || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const free = searchParams.get("free") === "true";

  const updateSearch = (updates: Record<string, any>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === "" || val === false) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    setSearchParams(next);
  };

  // Debounced search input (local state mirrors URL ?q=)
  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => setSearchInput(q), [q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== q) {
        updateSearch({ q: searchInput, page: 1 });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [result, setResult] = useState<CoursesResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "All Courses — Mobile Repairing & Tech Training | iLab BD";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCourses({ q, category, level, mode, sort, page, perPage: 9, free }).then((res) => {
      if (!cancelled) {
        setResult(res);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [q, category, level, mode, sort, page, free]);

  const activeFilters = [
    mode && { key: "mode" as const, label: mode },
    level && { key: "level" as const, label: level },
    category && { key: "category" as const, label: category },
    q && { key: "q" as const, label: `"${q}"` },
  ].filter(Boolean) as { key: "mode" | "category" | "level" | "q"; label: string }[];

  const clearAll = () => {
    setSearchParams({});
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-surface/30">
      <Header />

      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="container relative px-4 mx-auto">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary-dark text-xs font-semibold mb-4"
            >
              Explore {free ? "Free" : "All"} Programs
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4"
            >
              Master Your Skills.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground font-ui"
            >
              Choose from our selection of industry-grade courses and build a future-ready career.
            </motion.p>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-8 max-w-6xl mx-auto">
            {/* Search */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search courses..."
                className="w-full h-12 pl-12 pr-10 rounded-2xl border border-border bg-card text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div>
                <select
                  value={mode}
                  onChange={(e) => updateSearch({ mode: e.target.value, page: 1 })}
                  className="w-full h-11 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">All Modes</option>
                  {MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={level}
                  onChange={(e) => updateSearch({ level: e.target.value, page: 1 })}
                  className="w-full h-11 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">All Levels</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={category}
                  onChange={(e) => updateSearch({ category: e.target.value, page: 1 })}
                  className="w-full h-11 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={sort}
                  onChange={(e) => updateSearch({ sort: e.target.value, page: 1 })}
                  className="w-full h-11 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  {SORTS.map((s) => (
                    <option key={s} value={s}>{SORT_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap justify-center mb-6">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => updateSearch({ [f.key]: "", page: 1 })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary-dark text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  {f.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          {loading && !result ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-8 w-full bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : result && result.items.length > 0 ? (
            <>
              <div className={`grid sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
                {result.items.map((c, i) => (
                  <CourseCard key={c.id} course={c} index={i} />
                ))}
              </div>

              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                onChange={(p) => updateSearch({ page: p })}
              />
            </>
          ) : (
            <EmptyState onClear={clearAll} />
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-16">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-surface disabled:opacity-50 transition"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium text-muted-foreground font-mono px-3">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-surface disabled:opacity-50 transition"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
        <Search className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No courses found</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-5">
        We couldn't find any courses matching your filters. Try clearing them to start over.
      </p>
      <button
        onClick={onClear}
        className="inline-flex h-10 items-center justify-center rounded-full gradient-orange text-white px-6 text-sm font-semibold shadow-orange-glow hover:scale-[1.01] active:scale-[0.99] transition-transform"
      >
        Reset all filters
      </button>
    </div>
  );
}
