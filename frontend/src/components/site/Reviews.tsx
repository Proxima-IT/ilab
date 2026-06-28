import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, Play, X } from "lucide-react";

type Review =
  | {
      type: "text";
      name: string;
      role: string;
      avatar: string;
      rating: number;
      text: string;
    }
  | {
      type: "image";
      name: string;
      role: string;
      avatar: string;
      rating: number;
      text: string;
      image: string;
    }
  | {
      type: "video";
      name: string;
      role: string;
      avatar: string;
      rating: number;
      thumbnail: string;
      video: string;
    };

const reviews: Review[] = [
  {
    type: "text",
    name: "Sadia Rahman",
    role: "Frontend Engineer @ Pathao",
    avatar: "https://i.pravatar.cc/120?img=47",
    rating: 5,
    text: "iLab completely changed my career path. The mentors are world-class and the projects gave me a portfolio that actually got me hired.",
  },
  {
    type: "video",
    name: "Tanvir Hasan",
    role: "Data Analyst @ bKash",
    avatar: "https://i.pravatar.cc/120?img=12",
    rating: 5,
    thumbnail:
      "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=900&q=80",
    video:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    type: "image",
    name: "Maliha Chowdhury",
    role: "Product Designer @ ShopUp",
    avatar: "https://i.pravatar.cc/120?img=32",
    rating: 5,
    text: "The community is incredible. Got hired within 2 months — here's my offer letter!",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
  },
  {
    type: "text",
    name: "Rafiul Karim",
    role: "Backend Engineer @ Chaldal",
    avatar: "https://i.pravatar.cc/120?img=15",
    rating: 5,
    text: "Live mentorship and the 1:1 sessions are unmatched. I learned more in 3 months than 2 years on my own.",
  },
  {
    type: "image",
    name: "Nusrat Jahan",
    role: "UI Designer @ Pickaboo",
    avatar: "https://i.pravatar.cc/120?img=20",
    rating: 5,
    text: "My final project from iLab is now in my portfolio and helped me land my first job.",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80",
  },
  {
    type: "video",
    name: "Imran Hossain",
    role: "Full-stack Dev @ ShareTrip",
    avatar: "https://i.pravatar.cc/120?img=33",
    rating: 5,
    thumbnail:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80",
    video:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
];

function VideoModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm grid place-items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
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

function Header({ r }: { r: Review }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={r.avatar}
        alt={r.name}
        className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
      />
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{r.name}</p>
        <p className="text-xs text-muted-foreground truncate">{r.role}</p>
      </div>
      <div className="ml-auto flex gap-0.5 shrink-0">
        {Array.from({ length: r.rating }).map((_, idx) => (
          <Star key={idx} className="h-3.5 w-3.5 fill-accent text-accent" />
        ))}
      </div>
    </div>
  );
}

export function Reviews() {
  const [video, setVideo] = useState<string | null>(null);

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
              25,000+
              <span className="absolute left-0 -bottom-1 h-1 w-full rounded-full bg-primary/70" />
            </span>{" "}
            learners
          </h2>
          <p className="mt-6 text-muted-foreground text-base md:text-lg">
            Real stories from graduates building careers they love.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {reviews.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="relative flex h-full flex-col p-6 rounded-2xl bg-card border border-border hover:shadow-card transition-all"
            >
              <Header r={r} />

              {r.type === "text" && (
                <>
                  <Quote className="absolute top-5 right-5 h-7 w-7 text-primary/10" />
                  <p className="mt-5 text-foreground leading-relaxed line-clamp-6">
                    "{r.text}"
                  </p>
                </>
              )}

              {r.type === "image" && (
                <>
                  <div className="mt-5 aspect-video rounded-xl overflow-hidden bg-surface">
                    <img
                      src={r.image}
                      alt={`${r.name}'s review`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-4 text-sm text-foreground leading-relaxed line-clamp-3">
                    "{r.text}"
                  </p>
                </>
              )}

              {r.type === "video" && (
                <button
                  onClick={() => setVideo(r.video)}
                  className="group/v mt-5 relative aspect-video rounded-xl overflow-hidden bg-surface"
                  aria-label={`Play ${r.name}'s video review`}
                >
                  <img
                    src={r.thumbnail}
                    alt={`${r.name}'s video review`}
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
      </div>

      {video && <VideoModal src={video} onClose={() => setVideo(null)} />}
    </section>
  );
}
