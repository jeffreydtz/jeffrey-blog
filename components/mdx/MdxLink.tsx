import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/**
 * Override de `a` — T11, consciente de destino:
 * externo (http/https) → target="_blank" + rel="noopener noreferrer";
 * interno ("/…") → next/link; anclas y mailto → <a> plano.
 * El estilo (subrayado fino que se intensifica al hover) viene de
 * `.prose-blog a` en globals.css: en prosa el link mantiene subrayado visible
 * en reposo — legibilidad de libro, no chrome.
 */
export function MdxLink({
  href = "",
  children,
  ...rest
}: ComponentPropsWithoutRef<"a">) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
