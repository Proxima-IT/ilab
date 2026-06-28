import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Play, Calendar, Clock, Check } from "lucide-react";
import { VideoModal } from "@/components/site/Hero";

const perks = [
  "Live, interactive 90-minute session",
  "Meet your instructor and ask questions",
  "Get a feel for our learning platform",
  "Free — no credit card required",
];

export function DemoClass() {
  const [videoOpen, setVideoOpen] = useState(false);
  return (
    <section id="demo" className="py-20 md:py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden grid lg:grid-cols-2 gap-0 bg-foreground text-white relative">
          {/* Decorative */}
          <div className="absolute inset-0 opacity-30 -z-0">
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative p-8 md:p-12 lg:p-14 z-10"
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">Try a Free Demo</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold leading-tight">
              Experience an iLab class before you commit
            </h2>
            <p className="mt-4 text-white/70">
              Sit in on a live class with our top instructors. See the teaching style,
              meet fellow learners, and decide if iLab is the right fit.
            </p>

            <ul className="mt-6 space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary/20 text-primary shrink-0">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-white/85">{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" /> Every Saturday
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> 8:00 PM (GMT+6)
              </span>
            </div>

            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-full gradient-orange text-white font-semibold shadow-orange-glow hover:scale-[1.03] transition-transform"
            >
              Book Your Free Seat
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative min-h-[320px] lg:min-h-full"
          >
            <img
              src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80"
              alt="Live demo class"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-foreground/30 to-foreground/60" />
            <button
              onClick={() => setVideoOpen(true)}
              aria-label="Play preview"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center h-20 w-20 rounded-full bg-white text-accent shadow-orange-glow hover:scale-110 transition-transform"
            >
              <Play className="h-7 w-7 ml-1 fill-current" />
            </button>
          </motion.div>
        </div>
      </div>
      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </section>
  );
}
