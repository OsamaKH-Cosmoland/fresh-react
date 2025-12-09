import { useEffect, useMemo } from "react";
import { useTranslation } from "@/localization/locale";
import { buildAppUrl } from "@/utils/navigation";
import { setDocumentMeta, setJsonLd } from "./seo";
import { ROUTE_META, type SeoRoute } from "./routeMeta";

export interface UseSeoOptions {
  route: SeoRoute;
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImageUrl?: string;
  jsonLd?: { id: string; data: unknown }[];
}

const resolveUrl = (value?: string) => {
  if (!value) return undefined;
  if (value.startsWith("http")) {
    return value;
  }
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return buildAppUrl(normalized);
};

export function useSeo(options: UseSeoOptions) {
  const { route, title, description, canonicalPath, ogImageUrl, jsonLd } = options;
  const { t, locale } = useTranslation();
  const routeConfig = ROUTE_META[route];
  const resolvedTitle = title ?? t(routeConfig.titleKey);
  const resolvedDescription =
    description ?? (routeConfig.descriptionKey ? t(routeConfig.descriptionKey) : undefined);
  const resolvedCanonical = resolveUrl(canonicalPath ?? routeConfig.canonicalPath);
  const resolvedOgImage = ogImageUrl ?? routeConfig.ogImageUrl;
  const { extraMeta, type } = routeConfig;

  useEffect(() => {
    setDocumentMeta({
      title: resolvedTitle,
      description: resolvedDescription,
      canonicalUrl: resolvedCanonical,
      ogImageUrl: resolvedOgImage,
      locale,
      type,
      extraMeta,
    });
  }, [resolvedTitle, resolvedDescription, resolvedCanonical, resolvedOgImage, locale, type, extraMeta]);

  useEffect(() => {
    if (!jsonLd?.length) return;
    jsonLd.forEach(({ id, data }) => setJsonLd(id, data));
    return () => {
      jsonLd.forEach(({ id }) => setJsonLd(id, null));
    };
  }, [jsonLd]);
}
