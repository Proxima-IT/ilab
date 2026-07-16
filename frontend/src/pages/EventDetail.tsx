import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  fetchPublicEvent,
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

function applyEventSeo(event: PublicEvent) {
  applySeo({
    title: event.metaTitle,
    description: event.metaDescription,
    path: `/events/${event.slug}`,
    image: event.coverUrl,
    type: "article",
  });
  applyJsonLd("page-json-ld", [
    breadcrumbSchema([
      { name: "Home", url: siteUrl("/") },
      { name: "Events", url: siteUrl("/events") },
      { name: event.title, url: siteUrl(`/events/${event.slug}`) },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.metaDescription,
      image: event.coverUrl,
      startDate: event.startsAt,
      endDate: event.endsAt || undefined,
      eventStatus: event.isFinished ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
      location: {
        "@type": "Place",
        name: event.location,
      },
      organizer: {
        "@type": "Organization",
        name: "iLab BD",
        url: siteUrl("/"),
      },
      url: siteUrl(`/events/${event.slug}`),
    },
  ]);
}

function RegistrationForm({
  event,
  onRegistered,
}: {
  event: PublicEvent;
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

  if (event.isFinished) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Registration Closed
        </p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">This event is finished</h2>
        <p className="mt-2 text-muted-foreground">Please browse other active events or courses.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        Register Now
      </p>
      <h2 className="mt-2 text-2xl font-bold text-foreground">Reserve your seat</h2>

      {submitted ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <h3 className="mt-3 text-xl font-bold text-emerald-800">
            Registration successful
          </h3>
          <p className="mt-2 text-sm font-medium text-emerald-700">{message}</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <input required placeholder="Full name" value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <input required placeholder="Phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <input placeholder="Education" value={form.education} onChange={(event) => updateField("education", event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <input placeholder="Profession" value={form.profession} onChange={(event) => updateField("profession", event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <textarea required minLength={10} rows={4} placeholder="Why want to learn this?" value={form.why_want_to_learn} onChange={(event) => updateField("why_want_to_learn", event.target.value)} className="resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl gradient-orange px-6 py-3 text-base font-bold text-white shadow-orange-glow transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Registration
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvent = async () => {
    if (!eventId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetchPublicEvent(eventId);
      setEvent(response);
      applyEventSeo(response);
    } catch (requestError: any) {
      setEvent(null);
      setError(
        requestError?.response?.data?.message ||
          "The event you are looking for is unavailable."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvent();
  }, [eventId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="h-96 rounded-2xl bg-card animate-pulse" />
          </div>
        </section>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Header />
        <section className="grid min-h-[70vh] place-items-center px-4 text-center">
          <div>
            <h1 className="text-2xl font-bold">Event not found</h1>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Link to="/events" className="mt-4 inline-block text-primary font-semibold">
              Browse all events
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="gradient-hero pt-28 md:pt-36 pb-12 md:pb-20 border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to events
            </Link>

            <span className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${event.isFinished ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary-dark"}`}>
              {event.isFinished ? "Finished" : event.type}
            </span>

            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {event.title}
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">{event.description}</p>

            <ul className="mt-6 flex flex-wrap gap-3 text-sm text-foreground">
              <li className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border">
                <Calendar className="h-4 w-4 text-primary-dark" />
                <span>
                  <span className="font-semibold">Start:</span> {event.startDateTime}
                </span>
              </li>
              {event.finishDateTime && (
                <li className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border">
                  <Clock className="h-4 w-4 text-primary-dark" />
                  <span>
                    <span className="font-semibold">Finish:</span> {event.finishDateTime}
                  </span>
                </li>
              )}
              <li className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border">
                <MapPin className="h-4 w-4 text-primary-dark" />
                {event.location}
              </li>
              {event.seats !== null && (
                <li className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border">
                  <Users className="h-4 w-4 text-primary-dark" />
                  {event.seats} seats
                </li>
              )}
            </ul>
          </motion.div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <img src={event.coverUrl} alt={event.title} className="aspect-video h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <article className="prose prose-zinc max-w-none">
            <h2>About this event</h2>
            <p>{event.description}</p>
          </article>

          <RegistrationForm event={event} onRegistered={() => undefined} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
