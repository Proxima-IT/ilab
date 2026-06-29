import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  FileText,
  FolderOpen,
  Link as LinkIcon,
  Loader2,
  Search,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  learningService,
  type LessonResource,
  type ResourceCourse,
} from "@/services/student/learning.service";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function ResourceIcon({ type }: { type: string }) {
  if (type === "google_drive" || type === "link") {
    return <LinkIcon className="h-4 w-4 text-primary" />;
  }

  return <FileText className="h-4 w-4 text-primary" />;
}

function resourceMeta(resource: LessonResource): string {
  const type = resource.type.replace("_", " ");
  return resource.file_size ? `${type} · ${resource.file_size}` : type;
}

export default function ResourcesPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<ResourceCourse[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadResources() {
      setLoading(true);

      try {
        const data = await learningService.getResources();
        if (mounted) setCourses(data);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadResources();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) return courses;

    return courses
      .map((course) => ({
        ...course,
        sections: course.sections
          .map((section) => ({
            ...section,
            lessons: section.lessons
              .map((lesson) => ({
                ...lesson,
                resources: lesson.resources.filter((resource) => {
                  return (
                    course.title.toLowerCase().includes(needle) ||
                    section.title.toLowerCase().includes(needle) ||
                    lesson.title.toLowerCase().includes(needle) ||
                    resource.title.toLowerCase().includes(needle)
                  );
                }),
              }))
              .filter((lesson) => lesson.resources.length > 0),
          }))
          .filter((section) => section.lessons.length > 0),
      }))
      .filter((course) => course.sections.length > 0);
  }, [courses, search]);

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-140px)] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="font-display text-xl text-foreground">{t("myResources")}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Resources from your enrolled courses.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("searchResources")}
          className="glass-input w-full px-4 py-2.5 pl-9 font-ui text-xs"
        />
      </div>

      {filteredCourses.length === 0 ? (
        <motion.div variants={item} className="glass-card p-8 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg text-foreground">
            No resources found
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            When resources are added to your enrolled lessons, they will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {filteredCourses.map((course) => (
            <motion.section key={course.id} variants={item} className="glass-card p-5">
              <h2 className="font-display text-base text-foreground">{course.title}</h2>

              <div className="mt-4 space-y-4">
                {course.sections.map((section) => (
                  <div key={section.id} className="rounded-xl border border-border/30 p-3">
                    <h3 className="font-ui text-sm font-semibold text-foreground">
                      {section.title}
                    </h3>

                    <div className="mt-3 space-y-3">
                      {section.lessons.map((lesson) => (
                        <div key={lesson.id} className="rounded-lg bg-secondary/20 p-3">
                          <p className="font-ui text-xs font-semibold text-foreground">
                            {lesson.title}
                          </p>

                          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                            {lesson.resources.map((resource) => (
                              <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/70 p-3 transition hover:border-primary/40 hover:bg-card"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <ResourceIcon type={resource.type} />
                                  <div className="min-w-0">
                                    <p className="truncate font-ui text-xs font-medium text-foreground">
                                      {resource.title}
                                    </p>
                                    <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">
                                      {resourceMeta(resource)}
                                    </p>
                                  </div>
                                </div>
                                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </motion.div>
  );
}
