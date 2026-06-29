import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LeaderboardPage() {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-120px)] grid place-items-center"
    >
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Trophy className="h-8 w-8" />
        </div>

        <h1 className="font-display text-2xl text-foreground">
          {t("leaderboardTitle")}
        </h1>

        <p className="mt-3 font-ui text-sm leading-6 text-muted-foreground">
          Leaderboard is coming soon. Student rankings and achievements will be
          available here after launch.
        </p>
      </div>
    </motion.div>
  );
}
