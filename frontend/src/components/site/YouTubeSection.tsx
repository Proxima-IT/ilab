import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import { SiteLogo } from "@/components/site/SiteLogo";
import type { WebsiteSettings } from "@/services/home.service";

type SocialMediaItem = NonNullable<NonNullable<WebsiteSettings["system"]>["social_media"]>[number];

function findYoutubeUrl(socialMedia?: SocialMediaItem[]): string | null {
  const item = socialMedia?.find((social) => {
    const name = `${social.name} ${social.icon} ${social.url}`.toLowerCase();
    return name.includes("youtube") || name.includes("youtu.be");
  });

  return item?.url || null;
}

export function YouTubeSection({
  socialMedia,
}: {
  socialMedia?: SocialMediaItem[];
}) {
  const youtubeUrl = findYoutubeUrl(socialMedia);
  const tipsImage =
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=720&q=85";
  const channelCard = (
    <>
      <SiteLogo size="sm" />
      <div className="flex items-center gap-1.5 rounded-md bg-[#FF0000] px-2.5 py-1.5 text-white">
        <Play className="h-3 w-3 fill-white" />
        <span className="text-xs font-semibold">YouTube</span>
      </div>
      <span className="text-xs font-medium text-muted-foreground">2K+</span>
    </>
  );

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
              {youtubeUrl ? (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mx-auto mt-5 inline-flex w-fit items-center gap-3 rounded-xl bg-background px-4 py-3 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl sm:mx-0"
                >
                  {channelCard}
                </a>
              ) : (
                <div className="mx-auto mt-5 inline-flex w-fit items-center gap-3 rounded-xl bg-background px-4 py-3 shadow-lg shadow-black/10 sm:mx-0">
                  {channelCard}
                </div>
              )}
            </div>

            {/* Right: animated visual */}
            <div className="flex justify-center sm:justify-end">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full max-w-[210px] sm:max-w-[235px] md:max-w-[260px]"
              >
                <div className="overflow-hidden rounded-2xl border border-background/10 bg-background/10 p-2 shadow-2xl shadow-black/25">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-background">
                    <img
                      src={tipsImage}
                      alt="Learning quick tips on YouTube"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <motion.div
                      animate={{ opacity: [0.35, 0.75, 0.35], x: ["-35%", "35%", "-35%"] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-y-0 left-0 w-1/2 rotate-12 bg-white/20 blur-2xl"
                    />
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#FF0000] px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                      <Play className="h-3 w-3 fill-white" />
                      Tips
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/95 p-3 shadow-lg shadow-black/20"
                    >
                      <p className="text-[10px] font-bold uppercase text-accent">Quick Tips</p>
                      <p className="mt-1 text-sm font-extrabold leading-tight text-foreground">
                        Weekly learning shorts
                      </p>
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.08, 1] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-3 top-8 grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground shadow-orange-glow"
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
