export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://ilabbd.com").replace(/\/$/, "");
export const SITE_NAME = "iLab BD";
export const SITE_TAGLINE = "Fast Solutions, Trusted Service";
export const TWITTER_SITE = "@iLabBD";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

type HeadLink = {
  rel: string;
  href: string;
  type?: string;
  sizes?: string;
  crossOrigin?: "anonymous" | "use-credentials";
};

/** Site-wide favicon links — include in the root route head on every page. */
export const FAVICON_LINKS: HeadLink[] = [
  { rel: "icon", href: "/favicon.jpg", type: "image/jpeg" },
  { rel: "apple-touch-icon", href: "/favicon.jpg", type: "image/jpeg" },
];

export type SeoOptions = {
  title: string;
  description: string;
  path?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  robots?: string;
  noIndex?: boolean;
};

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

function canonicalUrl(path = "/"): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  return absoluteUrl(path);
}

export function buildSeoHead(options: SeoOptions, extraLinks: HeadLink[] = []) {
  const {
    title,
    description,
    path = "/",
    ogTitle = title,
    ogDescription = description,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = "website",
    robots,
    noIndex = false,
  } = options;

  const canonical = canonicalUrl(path);
  const robotsContent = noIndex
    ? "noindex, nofollow"
    : (robots ?? "index, follow, max-image-preview:large");

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: robotsContent },
      { property: "og:type", content: ogType },
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:image", content: ogImage },
      { property: "og:url", content: canonical },
      { property: "og:site_name", content: SITE_NAME },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: ogTitle },
      { name: "twitter:description", content: ogDescription },
      { name: "twitter:image", content: ogImage },
      { name: "twitter:site", content: TWITTER_SITE },
    ],
    links: [{ rel: "canonical", href: canonical }, ...extraLinks],
  };
}

export function buildPrivateSeo(options: Pick<SeoOptions, "title" | "description" | "path">) {
  return buildSeoHead({ ...options, noIndex: true });
}
