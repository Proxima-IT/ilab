import { get, post } from "@/lib/api";
import { imageUrl } from "@/services/course-catalog.service";

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string | null;
  date: string;
  time: string;
  location: string;
  seats: number | null;
  description: string;
  coverUrl: string;
  metaTitle: string;
  metaDescription: string;
  isFinished: boolean;
  registrationsCount: number;
};

export type EventRegistrationPayload = {
  full_name: string;
  email: string;
  phone: string;
  education?: string;
  profession?: string;
  why_want_to_learn: string;
};

type LaravelEvent = {
  id: number | string;
  slug: string;
  title: string;
  event_type?: string | null;
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  seats?: number | null;
  description?: string | null;
  cover_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_finished?: boolean;
  registrations_count?: number;
};

type EventsResponse = {
  success: boolean;
  data: LaravelEvent[];
  message: string;
  errors: unknown;
  meta?: {
    pagination?: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  };
};

type EventResponse = {
  success: boolean;
  data: LaravelEvent;
  message: string;
  errors: unknown;
};

type RegistrationResponse = {
  success: boolean;
  data: unknown;
  message: string;
  errors: unknown;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatTimeRange(startsAt: string, endsAt?: string | null): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const start = formatter.format(new Date(startsAt));
  const end = endsAt ? formatter.format(new Date(endsAt)) : "";

  return end ? `${start} - ${end}` : start;
}

function mapEvent(event: LaravelEvent): PublicEvent {
  const fallbackDescription = "";

  return {
    id: String(event.id),
    slug: event.slug,
    title: event.title,
    type: event.event_type || "Event",
    startsAt: event.starts_at,
    endsAt: event.ends_at || null,
    date: formatDate(event.starts_at),
    time: formatTimeRange(event.starts_at, event.ends_at),
    location: event.location || "Online",
    seats: event.seats ?? null,
    description: event.description || fallbackDescription,
    coverUrl: imageUrl(event.cover_url),
    metaTitle: event.meta_title || `${event.title} | iLab BD`,
    metaDescription:
      event.meta_description ||
      event.description ||
      "Join iLab events, workshops, webinars, and practical learning sessions.",
    isFinished: Boolean(event.is_finished),
    registrationsCount: Number(event.registrations_count || 0),
  };
}

export async function fetchPublicEvents(): Promise<PublicEvent[]> {
  const response = await get<EventsResponse>("/events?per_page=24");
  return response.data.map(mapEvent);
}

export async function fetchPublicEvent(slug: string): Promise<PublicEvent> {
  const response = await get<EventResponse>(`/events/${encodeURIComponent(slug)}`);
  return mapEvent(response.data);
}

export async function registerForEvent(
  slug: string,
  payload: EventRegistrationPayload
): Promise<RegistrationResponse> {
  return post<RegistrationResponse>(
    `/events/${encodeURIComponent(slug)}/registrations`,
    payload
  );
}
