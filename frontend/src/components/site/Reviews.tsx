import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Quote, Star, X } from "lucide-react";
import { fetchPublicReviews, type HomeReview } from "@/services/home.service";

function VideoModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm grid place-items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 grid place-items-center h-9 w-9 rounded-full bg-white/95 text-foreground hover:scale-110 transition"
        >
          <X className="h-4 w-4" />
        </button>
        <video src={src} autoPlay controls className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

function ReviewHeader({ review }: { review: HomeReview }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={review.avatar}
        alt={review.name}
        className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
      />
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{review.name}</p>
        {review.role && (
          <p className="text-xs text-muted-foreground truncate">{review.role}</p>
        )}
      </div>
      <div className="ml-auto flex gap-0.5 shrink-0">
        {Array.from({ length: review.rating }).map((_, index) => (
          <Star key={index} className="h-3.5 w-3.5 fill-accent text-accent" />
        ))}
      </div>
    </div>
  );
}

export function Reviews() {
  const [video, setVideo] = useState<string | null>(null);
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);

    fetchPublicReviews(6)
      .then((items) => {
        if (alive) setReviews(items);
      })
      .catch(() => {
        if (alive) setReviews([]);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="reviews" className="py-20 md:py-28 bg-gradient-to-b from-background via-background to-surface/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">
            Student Reviews
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-foreground">
            Loved by{" "}
            <span className="relative inline-block text-primary">
              our learners
              <span className="absolute left-0 -bottom-1 h-1 w-full rounded-full bg-primary/70" />
            </span>
          </h2>
          <p className="mt-6 text-muted-foreground text-base md:text-lg">
            Real stories from students building practical skills with iLab.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-64 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="mt-14 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            Student reviews will appear here soon.
          </div>
        ) : (
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
                className="relative flex h-full flex-col p-6 rounded-2xl bg-card border border-border hover:shadow-card transition-all"
              >
                <ReviewHeader review={review} />

                {review.type === "text" && (
                  <>
                    <Quote className="absolute top-5 right-5 h-7 w-7 text-primary/10" />
                    <p className="mt-5 text-foreground leading-relaxed line-clamp-6">
                      "{review.text}"
                    </p>
                  </>
                )}

                {review.type === "image" && review.image && (
                  <>
                    <div className="mt-5 aspect-video rounded-xl overflow-hidden bg-surface">
                      <img
                        src={review.image}
                        alt={`${review.name}'s review`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {review.text && (
                      <p className="mt-4 text-sm text-foreground leading-relaxed line-clamp-3">
                        "{review.text}"
                      </p>
                    )}
                  </>
                )}

                {review.type === "video" && review.video && review.thumbnail && (
                  <button
                    onClick={() => setVideo(review.video || null)}
                    className="group/v mt-5 relative aspect-video rounded-xl overflow-hidden bg-surface"
                    aria-label={`Play ${review.name}'s video review`}
                  >
                    <img
                      src={review.thumbnail}
                      alt={`${review.name}'s video review`}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover/v:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-foreground/30" />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid h-14 w-14 place-items-center rounded-full bg-white text-primary shadow-orange-glow group-hover/v:scale-110 transition-transform">
                      <Play className="h-6 w-6 ml-0.5 fill-current" />
                    </span>
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary text-white">
                      Video Review
                    </span>
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {video && <VideoModal src={video} onClose={() => setVideo(null)} />}
    </section>
  );
}
