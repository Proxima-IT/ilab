import { motion } from "framer-motion";
import { Briefcase, Users, Headphones } from "lucide-react";

const offers = [
  {
    icon: Briefcase,
    title: "Job Interview Training",
    desc: "For those who are serious about their career. Special job interview training for learners who finish data structures, algorithms, and software development tracks with strong projects.",
    tint: "bg-[hsl(20_90%_96%)]",
    iconBg: "bg-[hsl(20_90%_92%)]",
    iconColor: "text-primary",
  },
  {
    icon: Users,
    title: "1:1 Mentorship",
    desc: "A team of expert mentors will be by your side. When needed, they'll sit with you on Google Meet, plan your roadmap, solve problems, and guide you to your goal.",
    tint: "bg-[hsl(160_40%_94%)]",
    iconBg: "bg-[hsl(160_40%_88%)]",
    iconColor: "text-[hsl(160_60%_35%)]",
  },
  {
    icon: Headphones,
    title: "Support Session",
    desc: "Three times a day, ask questions directly in live classes on our system. Share your screen, show your problems and get solutions. Learn together with everyone — as many times as you need.",
    tint: "bg-[hsl(220_70%_96%)]",
    iconBg: "bg-[hsl(220_70%_92%)]",
    iconColor: "text-[hsl(220_80%_55%)]",
  },
];

export function WhatWeOffer() {
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
            What we{" "}
            <span className="relative inline-block text-primary">
              offers!
              <span className="absolute left-0 -bottom-1 h-1 w-full rounded-full bg-primary/70" />
            </span>
          </h2>
          <p className="mt-6 text-muted-foreground text-base md:text-lg leading-relaxed">
            Unlimited help, guidelines, even Google Meet screen-sharing to solve
            your problems — join this course to get it all.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {offers.map((o, i) => (
            <motion.div
              key={o.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`${o.tint} rounded-2xl p-8 shadow-card border border-border/40 hover:shadow-lg transition-shadow`}
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
