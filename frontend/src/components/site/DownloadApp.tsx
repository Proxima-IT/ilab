import { motion } from "framer-motion";
import { Play } from "lucide-react";

export function DownloadApp() {
  return (
    <section id="download" className="py-4 sm:py-6 md:py-8 bg-gradient-to-b from-background via-background to-surface/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-foreground"
        >
          <div className="grid items-center gap-4 px-5 py-6 sm:grid-cols-[1fr_auto] sm:gap-6 sm:px-8 sm:py-8 md:px-12 md:py-10 lg:px-14">
            {/* Left: copy */}
            <div className="flex flex-col justify-center text-center sm:text-left">
              <h2 className="text-xl font-extrabold leading-tight tracking-tight text-background sm:text-2xl md:text-3xl">
                Download iLab App
              </h2>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-background/60 sm:max-w-sm sm:text-sm">
                Excel your learning curve and embrace new experiences on the go.
              </p>

              <a
                href="#"
                className="mx-auto mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-background px-4 py-2 transition-opacity hover:opacity-90 sm:mx-0"
              >
                <Play className="h-4 w-4 fill-foreground text-foreground" />
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-foreground/70">
                    GET IT ON
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    Google Play
                  </span>
                </div>
              </a>

              <div className="mt-3 flex items-center justify-center gap-2.5 sm:justify-start">
                <div className="flex -space-x-2">
                  {[
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=80",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64&q=80",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-6 w-6 rounded-full border-2 border-foreground object-cover"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-background">25K+</p>
                  <p className="text-[10px] text-background/60">Downloads</p>
                </div>
              </div>
            </div>

            {/* Right: compact phone mockup */}
            <div className="flex justify-center sm:justify-end">
              <div className="relative w-full max-w-[120px] sm:max-w-[140px] md:max-w-[160px]">
                <div className="relative overflow-hidden rounded-[1.5rem] border-[3px] border-background/20 bg-background/5">
                  <div className="absolute top-0 left-1/2 z-10 mt-1.5 h-[14px] w-16 -translate-x-1/2 rounded-full bg-foreground" />
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80"
                    alt="iLab mobile app preview"
                    className="aspect-[9/16] w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
