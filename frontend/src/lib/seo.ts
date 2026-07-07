type SeoOptions = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  robots?: string;
  publishedTime?: string | null;
  modifiedTime?: string | null;
};

const SITE_NAME = "iLab BD";
const BRAND_TITLE = "iLab BD";
const DEFAULT_DESCRIPTION =
  "iLab BD offers practical mobile repairing, technology, and career-focused courses for Bangladeshi learners.";

export function siteUrl(path = "/"): string {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined;
  const origin = (configured || window.location.origin).replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return new URL(cleanPath, origin).toString();
}

function apiOrigin(): string {
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";

  if (!apiBase) return window.location.origin;

  try {
    return new URL(apiBase).origin;
  } catch {
    return window.location.origin;
  }
}

export function storageUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, "");
  const configured = import.meta.env.VITE_STORAGE_URL as string | undefined;
  const base = configured || `${apiOrigin()}/storage`;

  return `${base.replace(/\/+$/, "")}/${cleanPath}`;
}

export function defaultFaviconUrl(): string {
  return storageUrl("website/ilab_ico.png");
}

export function defaultOgImageUrl(): string {
  return siteUrl("/og-image.jpg");
}

export function applyFavicon(url = defaultFaviconUrl()) {
  const selectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
  ];

  selectors.forEach((selector) => {
    document.head.querySelectorAll(selector).forEach((tag) => tag.remove());
  });

  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.type = "image/png";
  icon.href = url;
  document.head.appendChild(icon);

  const shortcut = document.createElement("link");
  shortcut.rel = "shortcut icon";
  shortcut.type = "image/png";
  shortcut.href = url;
  document.head.appendChild(shortcut);

  const apple = document.createElement("link");
  apple.rel = "apple-touch-icon";
  apple.href = url;
  document.head.appendChild(apple);
}

export function applySeo({
  title,
  description,
  path,
  image,
  type = "website",
  robots = "index,follow,max-image-preview:large",
  publishedTime,
  modifiedTime,
}: SeoOptions) {
  const url = path ? siteUrl(path) : window.location.href;
  const socialImage = image || defaultOgImageUrl();
  const safeDescription = trimDescription(description || DEFAULT_DESCRIPTION);
  const safeTitle = normalizeTitle(title);

  document.documentElement.lang = "en";
  document.title = safeTitle;
  applyFavicon();
  removeJsonLd("page-json-ld");

  setMeta("description", safeDescription);
  setMeta("robots", robots);
  setMeta("author", BRAND_TITLE);
  setMeta("theme-color", "#0d9488");
  setMeta("application-name", BRAND_TITLE);
  setLink("canonical", url);

  setMeta("og:type", type, true);
  setMeta("og:site_name", SITE_NAME, true);
  setMeta("og:title", safeTitle, true);
  setMeta("og:description", safeDescription, true);
  setMeta("og:image", socialImage, true);
  setMeta("og:image:alt", safeTitle, true);
  setMeta("og:url", url, true);
  setMeta("og:locale", "en_US", true);

  if (type === "article") {
    if (publishedTime) setMeta("article:published_time", publishedTime, true);
    if (modifiedTime) setMeta("article:modified_time", modifiedTime, true);
  }

  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", safeTitle);
  setMeta("twitter:description", safeDescription);
  setMeta("twitter:image", socialImage);
  setMeta("twitter:image:alt", safeTitle);

  applyJsonLd("organization-json-ld", organizationSchema());
  applyJsonLd("website-json-ld", websiteSchema());
}

type PrivateSeoInput =
  | string
  | Pick<SeoOptions, "title" | "description" | "path">;

export function applyPrivateSeo(
  input: PrivateSeoInput,
  fallbackDescription = "Private iLab BD page."
) {
  const options =
    typeof input === "string"
      ? { title: input, description: fallbackDescription }
      : input;

  applySeo({
    title: options.title,
    description: options.description,
    path: options.path,
    robots: "noindex,nofollow",
  });
}

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(tag);
  }

  tag.content = content;
}

function setLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!tag) {
    tag = document.createElement("link");
    tag.rel = rel;
    document.head.appendChild(tag);
  }

  tag.href = href;
}

export function applyJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  let script = document.getElementById(id) as HTMLScriptElement | null;

  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

export function removeJsonLd(id: string) {
  document.getElementById(id)?.remove();
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl("/"),
    logo: defaultFaviconUrl(),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      areaServed: "BD",
      availableLanguage: ["en", "bn"],
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl("/courses")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function normalizeTitle(title: string): string {
  const clean = title.trim();
  return clean.includes("iLab") ? clean : `${clean} | iLab BD`;
}

function trimDescription(description: string): string {
  const clean = description.replace(/\s+/g, " ").trim() || DEFAULT_DESCRIPTION;
  return clean.length > 160 ? `${clean.slice(0, 157).trim()}...` : clean;
}
