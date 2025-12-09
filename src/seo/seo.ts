import { buildAppUrl } from "@/utils/navigation";

interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

export interface DocumentMetaOptions {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  locale?: string;
  type?: "website" | "article" | "product";
  extraMeta?: MetaTag[];
}

const ensureMetaElement = (
  attrName: "name" | "property",
  attrValue: string,
  content: string
) => {
  if (typeof document === "undefined") return;
  const selector = `meta[${attrName}="${attrValue}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const ensureLinkRel = (rel: string, href: string) => {
  if (typeof document === "undefined") return;
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

export function setDocumentMeta({
  title,
  description,
  canonicalUrl,
  ogImageUrl,
  locale,
  type = "website",
  extraMeta,
}: DocumentMetaOptions) {
  if (typeof document === "undefined") return;
  if (title) {
    document.title = title;
    ensureMetaElement("property", "og:title", title);
    ensureMetaElement("name", "twitter:title", title);
  }
  if (description) {
    ensureMetaElement("name", "description", description);
    ensureMetaElement("property", "og:description", description);
    ensureMetaElement("name", "twitter:description", description);
  }
  const canonical = canonicalUrl ?? (typeof window !== "undefined" ? window.location.href : undefined);
  if (canonical) {
    ensureLinkRel("canonical", canonical);
    ensureMetaElement("property", "og:url", canonical);
  }
  ensureMetaElement("property", "og:type", type);
  ensureMetaElement("name", "twitter:card", "summary_large_image");
  const localeValue = locale ?? (typeof document !== "undefined" ? document.documentElement.lang : undefined);
  if (localeValue) {
    ensureMetaElement("property", "og:locale", localeValue);
  }
  if (ogImageUrl) {
    const imageUrl = ogImageUrl.startsWith("http")
      ? ogImageUrl
      : buildAppUrl(ogImageUrl.replace(/^\/+/, "/"));
    ensureMetaElement("property", "og:image", imageUrl);
    ensureMetaElement("name", "twitter:image", imageUrl);
  }
  extraMeta?.forEach((tag) => {
    if (!tag.content) return;
    if (tag.property) {
      ensureMetaElement("property", tag.property, tag.content);
    } else if (tag.name) {
      ensureMetaElement("name", tag.name, tag.content);
    }
  });
}

export function setJsonLd(id: string, data: unknown | null) {
  if (typeof document === "undefined") return;
  let script = document.getElementById(id);
  if (!data) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  } else if (script.tagName.toLowerCase() !== "script") {
    script.remove();
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data, null, 2);
}
