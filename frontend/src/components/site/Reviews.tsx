import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import {
  fetchPublicReviews,
  type HomeReview,
  type WebsiteSettings,
} from "@/services/home.service";

function youtubeEmbedUrl(value?: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}?rel=0`;

  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([^?&]+)/);
  if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}?rel=0`;

  const idMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (idMatch?.[1]) return `https://www.youtube.com/embed/${idMatch[1]}?rel=0`;

  return null;
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

export function Reviews({ settings }: { settings?: WebsiteSettings["reviews"] }) {
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
            {settings?.eyebrow || "Student Reviews"}
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-foreground">
            {settings?.title || "Loved by"}{" "}
            <span className="relative inline-block text-primary">
              {settings?.highlight || "our learners"}
              <span className="absolute left-0 -bottom-1 h-1 w-full rounded-full bg-primary/70" />
            </span>
          </h2>
          <p className="mt-6 text-muted-foreground text-base md:text-lg">
            {settings?.description || "Real stories from students building practical skills with iLab."}
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
              <ReviewCard key={review.id} review={review} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review, index }: { review: HomeReview; index: number }) {
  const embedUrl = useMemo(() => youtubeEmbedUrl(review.video), [review.video]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-card"
    >
      <ReviewHeader review={review} />

      {(review.type === "text" || (review.type === "video" && !embedUrl)) && (
        <>
          <Quote className="absolute right-5 top-5 h-7 w-7 text-primary/10" />
          <p className="mt-5 leading-relaxed text-foreground line-clamp-6">
            "{review.text}"
          </p>
        </>
      )}

      {review.type === "image" && review.image && (
        <>
          <div className="mt-5 aspect-video overflow-hidden rounded-xl bg-surface">
            <img
              src={review.image}
              alt={`${review.name}'s review`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          {review.text && (
            <p className="mt-4 text-sm leading-relaxed text-foreground line-clamp-3">
              "{review.text}"
            </p>
          )}
        </>
      )}

      {review.type === "video" && embedUrl && (
        <>
          <div className="mt-5 overflow-hidden rounded-xl border border-primary/10 bg-foreground shadow-soft">
            <div className="aspect-video">
              <iframe
                src={embedUrl}
                title={`${review.name}'s video review`}
                className="h-full w-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
          {review.text && (
            <p className="mt-4 text-sm leading-relaxed text-foreground line-clamp-3">
              "{review.text}"
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}
