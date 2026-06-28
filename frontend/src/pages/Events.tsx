import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const events = [
  {
    id: "1",
    title: "Free Mobile Repairing Workshop",
    date: "July 5, 2026",
    time: "03:00 PM - 05:00 PM",
    location: "Online (Zoom)",
    seats: 200,
    type: "Workshop",
    description: "Learn the basics of smartphone diagnostics, screen replacement, and battery health testing from expert trainers.",
    cover_url: "https://images.unsplash.com/photo-1581092918056-0e67c8d3e217?w=800&q=80",
    registration_url: "#",
  },
  {
    id: "2",
    title: "Career Talk: From Repair Shop to Tech Entrepreneur",
    date: "July 12, 2026",
    time: "07:00 PM - 08:30 PM",
    location: "Online (Facebook Live)",
    seats: 500,
    type: "Webinar",
    description: "Hear from successful iLab graduates who turned their repairing skills into full-time businesses.",
    cover_url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
    registration_url: "#",
  },
  {
    id: "3",
    title: "iLab Tech Fest 2026",
    date: "August 20, 2026",
    time: "10:00 AM - 06:00 PM",
    location: "Dhaka, Bangladesh",
    seats: 300,
    type: "Conference",
    description: "A full-day tech festival with hands-on labs, competitions, networking, and industry mentors.",
    cover_url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80",
    registration_url: "#",
  },
];

export default function EventsPage() {
  useEffect(() => {
    document.title = "Events — Workshops & Webinars | iLab BD";
  }, []);
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero pt-28 md:pt-36 pb-12 md:pb-20 border-b border-border">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-sm font-semibold text-primary-dark uppercase tracking-wider">Upcoming Events</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Learn, connect, and grow with{" "}
              <span className="text-gradient-teal">iLab</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Join live workshops, webinars, and community events designed to accelerate your career in mobile repairing and tech.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Events list */}
      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-card transition-all"
            >
              {/* Cover Image */}
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={event.cover_url}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-5 flex flex-col flex-1">
                {/* Title */}
                <h2 className="text-xl font-bold text-foreground leading-snug">
                  {event.title}
                </h2>

                {/* Divider */}
                <div className="my-4 border-t border-border" />

                {/* Info rows */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-5 w-5 text-primary-dark shrink-0" />
                    <span className="text-base font-medium">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5 text-primary-dark shrink-0" />
                    <span className="text-base font-medium">{event.time}</span>
                  </div>
                </div>

                {/* Register Button */}
                <Link
                  to={event.registration_url as any}
                  className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-primary text-primary font-bold text-base hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Register Now
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-20 bg-surface border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Want to host an event with iLab?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Partner with us for workshops, campus events, or corporate training sessions.
          </p>
          <Link
            to="/courses"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-orange text-white font-bold shadow-orange-glow hover:scale-[1.03] active:scale-[0.98] transition-transform"
          >
            Browse courses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
