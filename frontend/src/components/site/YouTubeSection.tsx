import { motion } from "framer-motion";
import { Lightbulb, Play, User } from "lucide-react";
import { SiteLogo } from "@/components/site/SiteLogo";

export function YouTubeSection() {
  return (
    <section id="youtube" className="py-4 sm:py-6 md:py-8 bg-gradient-to-b from-background via-background to-surface/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-foreground"
        >
          <div className="grid items-center gap-6 px-5 py-8 sm:grid-cols-[1fr_auto] sm:gap-8 sm:px-8 sm:py-10 md:px-12 md:py-12 lg:px-14">
            {/* Left: copy + YouTube card */}
            <div className="flex flex-col justify-center text-center sm:text-left">
              <h2 className="text-xl font-extrabold leading-tight tracking-tight text-background sm:text-2xl md:text-3xl">
                Get free learning tips <br className="hidden sm:block" />
                Subscribe to iLab&apos;s YouTube{" "}
                <span className="text-accent">Subscribe</span>
              </h2>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-background/60 sm:text-sm">
                Watch tutorials, career advice, and quick learning hacks every week.
              </p>

              {/* YouTube channel card */}
              <div className="mx-auto mt-5 inline-flex w-fit items-center gap-3 rounded-xl bg-background px-4 py-3 shadow-lg shadow-black/10 sm:mx-0">
                <SiteLogo size="sm" />
                <div className="flex items-center gap-1.5 rounded-md bg-[#FF0000] px-2.5 py-1.5 text-white">
                  <Play className="h-3 w-3 fill-white" />
                  <span className="text-xs font-semibold">YouTube</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">2K+</span>
              </div>
            </div>

            {/* Right: illustration */}
            <div className="flex justify-center sm:justify-end">
              <div className="relative w-full max-w-[180px] sm:max-w-[200px] md:max-w-[220px]">
                {/* Main circle */}
                <div className="aspect-square rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-primary shadow-glow">
                      <User className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="mt-1 h-12 w-10 rounded-b-2xl bg-primary/80" />
                  </div>
                </div>

                {/* Floating lightbulb */}
                <div className="absolute -top-1 right-2 grid h-9 w-9 place-items-center rounded-full bg-accent shadow-orange-glow">
                  <Lightbulb className="h-4 w-4 text-accent-foreground" />
                </div>

                {/* Quick Tips badge */}
                <div className="absolute bottom-2 -right-2 rounded-lg bg-white px-3 py-1.5 shadow-lg shadow-black/10">
                  <p className="text-[10px] font-bold leading-none text-accent">Quick!</p>
                  <p className="text-[10px] font-bold leading-none text-foreground">Tips!</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
