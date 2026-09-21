import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import matter from "gray-matter";

/** A translation is valid only for the exact source reviewed by its translator. */
export function translatedContent(
  source,
  kind,
  slug,
  locale,
  root = process.cwd(),
) {
  if (
    !/^[a-z0-9][a-z0-9-]*$/.test(slug) ||
    !["posts", "pages"].includes(kind) ||
    !["es", "en"].includes(locale)
  )
    return null;
  const file = path.join(
    root,
    "content",
    "translations",
    locale,
    kind,
    `${slug}.mdx`,
  );
  if (!fs.existsSync(file)) return null;
  const parsed = matter(fs.readFileSync(file, "utf8"));
  const hash = createHash("sha256").update(source).digest("hex");
  if (
    parsed.data.source_hash !== hash ||
    parsed.data.lang !== locale ||
    parsed.data.draft === true ||
    (kind === "posts" && parsed.data.slug !== slug)
  )
    return null;
  if (
    typeof parsed.data.title !== "string" ||
    !parsed.data.title.trim() ||
    (kind === "posts" &&
      (typeof parsed.data.excerpt !== "string" || !parsed.data.excerpt.trim()))
  )
    return null;
  return parsed;
}
