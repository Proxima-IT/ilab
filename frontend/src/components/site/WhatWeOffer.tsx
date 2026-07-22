import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Briefcase,
  Clock,
  Headphones,
  Lightbulb,
  MessageCircle,
  MonitorPlay,
  Phone,
  Rocket,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import type { WebsiteSettings } from "@/services/home.service";

const offers = [
  {
    icon: Briefcase,
    title: "Job Interview Training",
    desc: "Special job interview training for learners who finish practical tracks with strong projects.",
    tint: "bg-[hsl(20_90%_96%)]",
    backgroundColor: undefined,
    iconBg: "bg-[hsl(20_90%_92%)]",
    iconColor: "text-primary",
  },
  {
    icon: Users,
    title: "1:1 Mentorship",
    desc: "Expert mentors help plan your roadmap, solve problems, and guide you to your goal.",
    tint: "bg-[hsl(160_40%_94%)]",
    backgroundColor: undefined,
    iconBg: "bg-[hsl(160_40%_88%)]",
    iconColor: "text-[hsl(160_60%_35%)]",
  },
  {
    icon: Headphones,
    title: "Support Session",
    desc: "Ask questions, share your screen, and get direct support when you need it.",
    tint: "bg-[hsl(220_70%_96%)]",
    backgroundColor: undefined,
    iconBg: "bg-[hsl(220_70%_92%)]",
    iconColor: "text-[hsl(220_80%_55%)]",
  },
];

const iconMap = {
  award: Award,
  book: BookOpen,
  briefcase: Briefcase,
  clock: Clock,
  headphones: Headphones,
  lightbulb: Lightbulb,
  message: MessageCircle,
  monitor: MonitorPlay,
  phone: Phone,
  rocket: Rocket,
  shield: ShieldCheck,
  users: Users,
  wrench: Wrench,
};

export function WhatWeOffer({ settings }: { settings?: WebsiteSettings["offers"] }) {
  const items = settings?.items?.length
    ? settings.items.map((item, index) => ({
        icon: iconMap[item.icon as keyof typeof iconMap] || offers[index]?.icon || Briefcase,
        title: item.title,
        desc: item.description,
        backgroundColor: item.background_color,
        tint: offers[index]?.tint || "bg-[hsl(20_90%_96%)]",
        iconBg: offers[index]?.iconBg || "bg-[hsl(20_90%_92%)]",
        iconColor: offers[index]?.iconColor || "text-primary",
      }))
    : offers;

  return (
    <section id="what-we-offer" className="py-20 md:py-28 bg-gradient-to-b from-background via-background to-surface/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            {settings?.title || "What we"}{" "}
            <span className="relative inline-block text-primary">
              {settings?.highlight || "offers!"}
              <span className="absolute left-0 -bottom-1 h-1 w-full rounded-full bg-primary/70" />
            </span>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg md:text-xl leading-relaxed">
            {settings?.description ||
              "Unlimited help, guidelines, even Google Meet screen-sharing to solve your problems - join this course to get it all."}
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((o, i) => (
            <motion.div
              key={o.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`${o.tint} rounded-2xl p-8 shadow-card border border-border/40 hover:shadow-lg transition-shadow`}
              style={o.backgroundColor ? { backgroundColor: o.backgroundColor } : undefined}
            >
              <div className={`grid h-16 w-16 place-items-center rounded-2xl ${o.iconBg}`}>
                <o.icon className={`h-8 w-8 ${o.iconColor}`} />
              </div>
              <h3 className="mt-6 text-xl font-bold text-foreground">{o.title}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{o.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
