import { motion } from "framer-motion";
import { useState } from "react";
import { Play } from "lucide-react";
import { VideoModal } from "@/components/site/Hero";

const BATCH_PREVIEW_YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

export function BatchPreview() {
  const [open, setOpen] = useState(false);
  return (
    <section id="batch-preview" className="py-12 md:py-16 bg-gradient-to-b from-background via-background to-surface/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden shadow-card border border-border aspect-video bg-foreground"
        >
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80"
            alt="Next batch preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
          <button
            onClick={() => setOpen(true)}
            aria-label="Play batch preview"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center h-20 w-20 md:h-24 md:w-24 rounded-full bg-white text-primary shadow-orange-glow hover:scale-110 transition-transform"
          >
            <Play className="h-8 w-8 md:h-10 md:w-10 ml-1 fill-current" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-primary">
              Watch Preview
            </p>
            <h3 className="mt-1 text-xl md:text-3xl font-bold">
              A glimpse of our next batch
            </h3>
          </div>
        </motion.div>
      </div>
      <VideoModal
        open={open}
        onClose={() => setOpen(false)}
        youtubeUrl={BATCH_PREVIEW_YOUTUBE_URL}
        title="Next batch preview video"
      />
    </section>
  );
}
