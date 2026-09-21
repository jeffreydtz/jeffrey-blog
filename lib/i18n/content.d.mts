export function translatedContent(
  source: string,
  kind: "posts" | "pages",
  slug: string,
  locale: "es" | "en",
  root?: string,
): { data: Record<string, unknown>; content: string } | null;
