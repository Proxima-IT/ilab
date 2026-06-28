import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Autoplay from "embla-carousel-autoplay";
import { CourseCard } from "@/components/site/CourseCard";
import { fetchCourses, type Course } from "@/services/courses";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function FreeCourses() {
  const [items, setItems] = useState<Course[]>([]);
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));

  useEffect(() => {
    let alive = true;
    fetchCourses({ sort: "popular", perPage: 8 }).then((r) => {
      if (alive) {
        setItems(
          r.items.map((c) => ({ ...c, price: 0, originalPrice: c.price, tag: "Free" })),
        );
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="free-courses" className="py-20 md:py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">
            100% Free
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-foreground">
            Free{" "}
            <span className="relative inline-block text-primary">
              Courses
              <span className="absolute left-0 -bottom-1 h-1 w-full rounded-full bg-primary/70" />
            </span>
          </h2>
          <p className="mt-6 text-muted-foreground text-base md:text-lg leading-relaxed">
            Start learning today with our free, beginner-friendly courses — no
            payment, no commitments, just pure value.
          </p>
        </motion.div>

        <div className="mt-14">
          {items.length === 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[16/22] rounded-2xl bg-card animate-pulse" />
              ))}
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
              <CarouselPrevious className="-left-2 md:-left-6 h-11 w-11 bg-background border-2 border-primary/30 text-primary-dark hover:bg-primary hover:text-white" />
              <CarouselNext className="-right-2 md:-right-6 h-11 w-11 bg-background border-2 border-primary/30 text-primary-dark hover:bg-primary hover:text-white" />
            </Carousel>
          )}
        </div>
      </div>
    </section>
  );
}
