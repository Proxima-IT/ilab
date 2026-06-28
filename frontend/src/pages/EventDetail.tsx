import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Users, ArrowLeft } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useEffect } from "react";

const events: Record<string, {
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  seats: number;
  description: string;
}> = {
  "1": {
    title: "Free Mobile Repairing Workshop",
    type: "Workshop",
    date: "July 5, 2026",
    time: "03:00 PM - 05:00 PM",
    location: "Online (Zoom)",
    seats: 200,
    description: "Learn the basics of smartphone diagnostics, screen replacement, and battery health testing from expert trainers.",
  },
  "2": {
    title: "Career Talk: From Repair Shop to Tech Entrepreneur",
    type: "Webinar",
    date: "July 12, 2026",
    time: "07:00 PM - 08:30 PM",
    location: "Online (Facebook Live)",
    seats: 500,
    description: "Hear from successful iLab graduates who turned their repairing skills into full-time businesses.",
  },
  "3": {
    title: "iLab Tech Fest 2026",
    type: "Conference",
    date: "August 20, 2026",
    time: "10:00 AM - 06:00 PM",
    location: "Dhaka, Bangladesh",
    seats: 300,
    description: "A full-day tech festival with hands-on labs, competitions, networking, and industry mentors.",
  },
};

export default function EventDetailPage() {
  const { eventId } = useParams();
  const event = eventId ? events[eventId] : null;

  useEffect(() => {
    if (event) {
      document.title = `${event.title} — iLab BD`;
    }
  }, [event]);

  if (!event) {
    return (
      <main className="min-h-screen grid place-items-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <Link to="/events" className="mt-4 inline-block text-primary font-semibold">Browse all events →</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="gradient-hero pt-28 md:pt-36 pb-12 md:pb-20 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to events
            </Link>
            <span className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary-dark text-xs font-bold uppercase tracking-wider">
              {event.type}
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {event.title}
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">{event.description}</p>

            <ul className="mt-6 flex flex-wrap gap-4 text-sm text-foreground">
              <li className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border">
                <Calendar className="h-4 w-4 text-primary-dark" />
                {event.date}
              </li>
              <li className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border">
                <Clock className="h-4 w-4 text-primary-dark" />
                {event.time}
              </li>
              <li className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border">
                <MapPin className="h-4 w-4 text-primary-dark" />
                {event.location}
              </li>
              <li className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border">
                <Users className="h-4 w-4 text-primary-dark" />
                {event.seats} seats
              </li>
            </ul>

            <button
              onClick={() => alert("Registration form coming soon!")}
              className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-full gradient-orange text-white font-bold shadow-orange-glow hover:scale-[1.03] active:scale-[0.98] transition-transform"
            >
              Register now
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
