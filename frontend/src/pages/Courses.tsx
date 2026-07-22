import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CourseCard } from "@/components/site/CourseCard";
import { applyJsonLd, applySeo, breadcrumbSchema, siteUrl } from "@/lib/seo";

import {
  fetchPublicCourses,
  fetchCourseCategories,
  LEVELS,
  MODES,
  SORTS,
  type CourseCategoryOption,
  type CoursesResult,
} from "@/services/course-catalog.service";

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
  const categoryId = searchParams.get("category_id") || "";
  const level = searchParams.get("level") || "";
  const mode = searchParams.get("mode") || "";
  const sort = (searchParams.get("sort") as (typeof SORTS)[number]) || "newest";
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const free = searchParams.get("free") === "true";

  const [searchInput, setSearchInput] = useState(q);
  const [categories, setCategories] = useState<CourseCategoryOption[]>([]);
  const [result, setResult] = useState<CoursesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const updateSearch = (updates: Record<string, string | number | boolean>) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    setSearchParams(next);
  };

  useEffect(() => {
    applySeo({
      title: free
        ? "Free Mobile Repairing & Tech Courses | iLab BD"
        : "All Courses - Mobile Repairing & Tech Training | iLab BD",
      description:
        "Explore iLab BD mobile repairing and technology courses. Filter by category, level, mode, price, and find free or featured courses.",
      path: free ? "/courses?free=true" : "/courses",
    });
  }, [free]);

  useEffect(() => {
    const items = result?.items || [];

    applyJsonLd("page-json-ld", [
      breadcrumbSchema([
        { name: "Home", url: siteUrl("/") },
        { name: "Courses", url: siteUrl("/courses") },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: free
          ? "Free Mobile Repairing & Tech Courses"
          : "All Mobile Repairing & Tech Courses",
        url: siteUrl(free ? "/courses?free=true" : "/courses"),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: items.map((course, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: siteUrl(`/courses/${course.slug}`),
            name: course.title,
          })),
        },
      },
    ]);
  }, [free, result]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetchCourseCategories();

        if (!cancelled) {
          setCategories(response);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchInput !== q) {
        updateSearch({ q: searchInput, page: 1 });
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, q]);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchPublicCourses({
          q,
          categoryId,
          level,
          mode,
          sort,
          page,
          perPage: 12,
          free,
        });

        if (!cancelled) {
          setResult(response);
        }
      } catch (error: any) {
        if (!cancelled) {
          setResult(null);
          setErrorMessage(
            error?.response?.data?.message ||
              "Could not load courses. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, [q, categoryId, level, mode, sort, page, free]);

  const selectedCategory = categories.find(
    (category) => category.id === categoryId
  );

  const activeFilters = [
    mode && { key: "mode" as const, label: mode },
    level && { key: "level" as const, label: level },
    categoryId && {
      key: "category_id" as const,
      label: selectedCategory?.name || "Selected category",
    },
    q && { key: "q" as const, label: `"${q}"` },
  ].filter(Boolean) as {
    key: "mode" | "category_id" | "level" | "q";
    label: string;
  }[];

  const clearAll = () => {
    setSearchParams({});
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-surface/30">
      <Header />

      <section className="relative isolate overflow-hidden border-b border-teal-200 bg-background pt-24 pb-10 md:pt-28 md:pb-12">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(20,184,166,0.22),rgba(240,253,250,0.95)_45%,rgba(249,115,22,0.18))]" />
        <div className="container relative px-4 mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 text-primary-dark text-sm font-bold shadow-sm ring-1 ring-primary/10 md:text-base"
            >
              Explore {free ? "Free" : "All"} Programs
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-3"
            >
              Master Your Skills.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground font-ui"
            >
              Choose from our selection of industry-grade courses and build a
              future-ready career.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="bg-background py-10 md:py-12">
        <div className="container relative px-4 mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-7 max-w-6xl mx-auto">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <select
                value={mode}
                onChange={(event) =>
                  updateSearch({ mode: event.target.value, page: 1 })
                }
                className="w-full h-11 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">All Modes</option>
                {MODES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={level}
                onChange={(event) =>
                  updateSearch({ level: event.target.value, page: 1 })
                }
                className="w-full h-11 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">All Levels</option>
                {LEVELS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={categoryId}
                onChange={(event) =>
                  updateSearch({ category_id: event.target.value, page: 1 })
                }
                className="w-full h-11 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(event) =>
                  updateSearch({ sort: event.target.value, page: 1 })
                }
                className="w-full h-11 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {SORTS.map((item) => (
                  <option key={item} value={item}>
                    {SORT_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap justify-center mb-6">
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => updateSearch({ [filter.key]: "", page: 1 })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary-dark text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  {filter.label}
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

          {errorMessage ? (
            <ErrorState
              message={errorMessage}
              onRetry={() => updateSearch({ page })}
            />
          ) : loading && !result ? (
            <CourseSkeleton />
          ) : result && result.items.length > 0 ? (
            <>
              <div
                className={`grid sm:grid-cols-2 xl:grid-cols-4 gap-5 transition-opacity ${
                  loading ? "opacity-60" : "opacity-100"
                }`}
              >
                {result.items.map((course, index) => (
                  <CourseCard key={course.id} course={course} index={index} />
                ))}
              </div>

              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                onChange={(nextPage) => updateSearch({ page: nextPage })}
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

function CourseSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse"
        >
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
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
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

      <h3 className="text-lg font-semibold text-foreground mb-1">
        No courses found
      </h3>

      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-5">
        We could not find any courses matching your filters. Try clearing them
        to start over.
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

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-20">
      <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">
        Courses could not load
      </h3>

      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-5">
        {message}
      </p>

      <button
        onClick={onRetry}
        className="inline-flex h-10 items-center justify-center rounded-full gradient-orange text-white px-6 text-sm font-semibold shadow-orange-glow hover:scale-[1.01] active:scale-[0.99] transition-transform"
      >
        Try again
      </button>
    </div>
  );
}

