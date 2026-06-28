import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Video, Users, FileText, Trophy, MessageSquare, Code2 } from "lucide-react";

const features = [
  { icon: Video, title: "Live Classes", desc: "Interactive sessions with industry experts every week." },
  { icon: Code2, title: "Hands-on Projects", desc: "Build a portfolio of real-world projects employers love." },
  { icon: Users, title: "Peer Cohorts", desc: "Learn alongside motivated peers and grow together." },
  { icon: MessageSquare, title: "1:1 Mentorship", desc: "Personalized guidance from senior practitioners." },
  { icon: FileText, title: "Curated Resources", desc: "Notes, PDFs, and references for every lesson." },
  { icon: Trophy, title: "Certification", desc: "Industry-recognized certificate on completion." },
];

export function CourseStructure() {
  return (
    <section id="structure" className="py-20 md:py-28 bg-surface relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-semibold text-primary-dark uppercase tracking-wider">Course Structure</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-foreground">
              Built for outcomes, not just lessons
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every course follows a proven framework that combines live teaching,
              practice, mentorship, and assessment — so you actually master the skill.
            </p>
            <Link
              to="/courses"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-dark hover:gap-3 transition-all"
            >
              Explore curriculum →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary-dark group-hover:gradient-teal group-hover:text-white transition-all">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
