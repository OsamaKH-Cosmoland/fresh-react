const getBaseUrl = () => {
  const base = import.meta.env.BASE_URL ?? "/";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

export const buildAppUrl = (pathname: string) => {
  const normalizedBase = getBaseUrl();
  if (pathname.startsWith("/")) {
    return `${normalizedBase}${pathname}`;
  }
  return `${normalizedBase}/${pathname}`;
};

export const buildSectionHref = (hash: string) => {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const target = String(hash).replace(/^#/, "");
  return `${normalizedBase}#${target}`;
};

export const normalizeHref = (href: string) => {
  if (href.startsWith("#")) {
    return buildSectionHref(href);
  }
  if (href.startsWith("?")) {
    return `${getBaseUrl()}${href}`;
  }
  return buildAppUrl(href);
};
