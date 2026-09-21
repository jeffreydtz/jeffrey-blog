export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const localeCookie = "blog-language";
export function isLocale(value: unknown): value is Locale {
  return value === "es" || value === "en";
}

/** Honor quality weights and regional variants, preserving header order on ties. */
export function negotiateLocale(
  header: string | null,
  preference?: string,
): Locale {
  if (isLocale(preference)) return preference;
  const choices = (header ?? "")
    .split(",")
    .map((part, index) => {
      const [range, ...params] = part.trim().toLowerCase().split(";");
      const quality = params.find((param) => param.trim().startsWith("q="));
      const q = quality ? Number(quality.trim().slice(2)) : 1;
      return { locale: range.split("-")[0], q, index };
    })
    .filter(({ q }) => Number.isFinite(q) && q > 0 && q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { locale } of choices) if (isLocale(locale)) return locale;
  return "es";
}

export function stripLocale(path: string): string {
  const bare = path.replace(/^\/(es|en)(?=\/|\?|#|$)/, "");
  return !bare || /^[?#]/.test(bare) ? `/${bare}` : bare;
}

/** Public documents only; never prefix admin, APIs, files or external URLs. */
export function isPublicPath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  return (
    pathname === "/" ||
    /^\/(archivo|gabinete|vinyl|acerca|colofon)\/?$/.test(pathname) ||
    /^\/posts\/[^/.]+\/?$/.test(pathname)
  );
}

export function localizedPath(path: string, locale: Locale): string {
  const bare = stripLocale(path);
  if (!isPublicPath(bare)) return path;
  return `/${locale}${bare === "/" ? "" : bare.startsWith("/?") || bare.startsWith("/#") ? bare.slice(1) : bare}`;
}
