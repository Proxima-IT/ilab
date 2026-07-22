import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { CourseCard } from "@/components/site/CourseCard";
import { fetchFeaturedCourses } from "@/services/home.service";
import type { Course } from "@/services/course-catalog.service";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function Courses() {
  const [items, setItems] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }));

  useEffect(() => {
    let alive = true;
    setIsLoading(true);

    fetchFeaturedCourses(8)
      .then((courses) => {
        if (alive) setItems(courses);
      })
      .catch(() => {
        if (alive) setItems([]);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="courses" className="py-20 md:py-28 bg-gradient-to-b from-background via-background to-surface/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-base font-semibold text-primary uppercase tracking-wider">Featured Courses</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-foreground">
            Learn skills the{" "}
            <span className="relative inline-block text-primary">
              industry
              <span className="absolute left-0 -bottom-1 h-1 w-full rounded-full bg-primary/70" />
            </span>{" "}
            is hiring for
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Build practical skills with curated courses selected for career-focused learners.
          </p>
          <Link
            to="/courses"
            className="mt-6 inline-flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-bold gradient-orange text-white shadow-orange-glow hover:scale-105 hover:shadow-lg transition-all"
          >
            Browse all courses <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[16/22] rounded-2xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            Featured courses will appear here after you mark courses as featured.
          </div>
        ) : (
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[autoplay.current]}
            className="relative px-2"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {items.map((c, i) => (
                <CarouselItem
                  key={c.id}
                  className="pl-4 md:pl-6 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <div className="h-full">
                    <CourseCard course={c} index={i} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-2 md:-left-6 h-11 w-11 bg-card border-2 border-primary/30 text-primary-dark hover:bg-primary hover:text-white" />
            <CarouselNext className="-right-2 md:-right-6 h-11 w-11 bg-card border-2 border-primary/30 text-primary-dark hover:bg-primary hover:text-white" />
          </Carousel>
        )}
      </div>
    </section>
  );
}
