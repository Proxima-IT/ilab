import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  fetchPublicEvents,
  registerForEvent,
  type EventRegistrationPayload,
  type PublicEvent,
} from "@/services/event.service";
import { applyJsonLd, applySeo, breadcrumbSchema, siteUrl } from "@/lib/seo";

const emptyForm: EventRegistrationPayload = {
  full_name: "",
  email: "",
  phone: "",
  education: "",
  profession: "",
  why_want_to_learn: "",
};

function applyEventsSeo(events: PublicEvent[]) {
  const title = "Events, Workshops & Webinars | iLab BD";
  const description =
    "Join iLab events, workshops, webinars, and live mobile repairing learning sessions in Bangladesh.";
  const image = events[0]?.coverUrl || null;

  applySeo({ title, description, path: "/events", image });
  applyJsonLd("page-json-ld", [
    breadcrumbSchema([
      { name: "Home", url: siteUrl("/") },
      { name: "Events", url: siteUrl("/events") },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: siteUrl("/events"),
      mainEntity: {
        "@type": "ItemList",
        itemListElement: events.map((event, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: siteUrl(`/events/${event.slug}`),
          name: event.title,
        })),
      },
    },
  ]);
}

function RegistrationModal({
  event,
  onClose,
  onRegistered,
}: {
  event: PublicEvent;
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [form, setForm] = useState<EventRegistrationPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateField = (name: keyof EventRegistrationPayload, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await registerForEvent(event.slug, form);
      const successMessage = response.message || "Registration completed successfully.";
      setMessage(successMessage);
      setSubmitted(true);
      setForm(emptyForm);
      toast.success(successMessage);
      onRegistered();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Registration failed. Please check your information and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close registration form"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-surface text-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Event Registration
        </p>
        <h2 className="mt-2 pr-10 text-2xl font-extrabold text-foreground">
          {event.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {event.date} at {event.time}
        </p>

        {submitted ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="mt-3 text-xl font-bold text-emerald-800">
              Registration successful
            </h3>
            <p className="mt-2 text-sm font-medium text-emerald-700">
              {message}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Full name"
                value={form.full_name}
                onChange={(inputEvent) => updateField("full_name", inputEvent.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(inputEvent) => updateField("email", inputEvent.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                required
                placeholder="Phone"
                value={form.phone}
                onChange={(inputEvent) => updateField("phone", inputEvent.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                placeholder="Education"
                value={form.education}
                onChange={(inputEvent) => updateField("education", inputEvent.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                placeholder="Profession"
                value={form.profession}
                onChange={(inputEvent) => updateField("profession", inputEvent.target.value)}
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:col-span-2"
              />
              <textarea
                required
                minLength={10}
                rows={4}
                placeholder="Why want to learn this?"
                value={form.why_want_to_learn}
                onChange={(inputEvent) => updateField("why_want_to_learn", inputEvent.target.value)}
                className="resize-none rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:col-span-2"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl gradient-orange px-6 py-3 text-base font-bold text-white shadow-orange-glow transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Registration
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);

  const upcomingCount = useMemo(
    () => events.filter((event) => !event.isFinished).length,
    [events]
  );

  const loadEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchPublicEvents();
      setEvents(response);
      applyEventsSeo(response);
    } catch (requestError: any) {
      setEvents([]);
      setError(
        requestError?.response?.data?.message ||
          "Could not load events. Please try again."
      );
      applyEventsSeo([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden gradient-hero pt-28 md:pt-36 pb-12 md:pb-20 border-b border-border">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-semibold text-primary-dark uppercase tracking-wider">
              Upcoming Events
            </p>
            <h1 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Learn, connect, and grow with <span className="text-gradient-teal">iLab</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Join live workshops, webinars, and community events designed to accelerate your career in mobile repairing and tech.
            </p>
            <p className="mt-5 text-sm font-semibold text-primary-dark">
              {upcomingCount} active event{upcomingCount === 1 ? "" : "s"} available
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-[420px] rounded-2xl bg-card animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              No published events are available right now.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <motion.article
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-card transition-all"
                >
                  <Link to={`/events/${event.slug}`} className="relative overflow-hidden aspect-video">
                    <img
                      src={event.coverUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white ${event.isFinished ? "bg-zinc-700" : "bg-primary"}`}>
                      {event.isFinished ? "Finished" : event.type}
                    </span>
                  </Link>

                  <div className="p-5 flex flex-col flex-1">
                    <Link
                      to={`/events/${event.slug}`}
                      className="text-xl font-bold text-foreground leading-snug hover:text-primary-dark transition-colors"
                    >
                      {event.title}
                    </Link>
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                      {event.description}
                    </p>

                    <div className="my-4 border-t border-border" />

                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Calendar className="h-5 w-5 text-primary-dark shrink-0" />
                        <span className="text-base font-medium">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Clock className="h-5 w-5 text-primary-dark shrink-0" />
                        <span className="text-base font-medium">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="h-5 w-5 text-primary-dark shrink-0" />
                        <span className="text-base font-medium">{event.location}</span>
                      </div>
                      {event.seats !== null && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Users className="h-5 w-5 text-primary-dark shrink-0" />
                          <span className="text-base font-medium">{event.seats} seats</span>
                        </div>
                      )}
                    </div>

                    {event.isFinished ? (
                      <button
                        type="button"
                        disabled
                        className="mt-auto w-full inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border-2 border-muted bg-muted px-4 py-3.5 text-base font-bold text-muted-foreground"
                      >
                        Finished
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-primary text-primary font-bold text-base hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        Register Now
                      </button>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 md:py-20 bg-surface border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Want to prepare before joining an event?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Explore practical iLab courses and build your mobile repairing foundation.
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

      {selectedEvent && (
        <RegistrationModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegistered={loadEvents}
        />
      )}

      <Footer />
    </main>
  );
}
