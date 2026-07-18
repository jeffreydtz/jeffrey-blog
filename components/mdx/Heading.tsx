import { isValidElement, type ReactElement, type ReactNode } from "react";
import { ui } from "@/lib/ui";

/**
 * Overrides de h2/h3 — T11: id slugificado (hecho a mano, sin rehype-slug)
 * + self-link "§" que aparece al hover del título. El ancla usa .heading-anchor
 * (globals.css).
 */

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    return textOf(el.props.children);
  }
  return "";
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sin diacríticos: "Sección" → "seccion"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Heading({
  as: Tag,
  id,
  children,
}: {
  as: "h2" | "h3";
  id: string;
  children?: ReactNode;
}) {
  if (!id) return <Tag>{children}</Tag>;
  return (
    <Tag id={id} className="scroll-mt-lg">
      {children}
      <a href={`#${id}`} aria-label={ui.mdx.anchor} className="heading-anchor">
        §
      </a>
    </Tag>
  );
}

/**
 * Fábrica por documento: h2/h3 comparten un contador de slugs para que títulos
 * repetidos en un mismo post no dupliquen ids ("notas", "notas-2", …).
 * renderMdx crea un par fresco por invocación — el estado no cruza documentos.
 */
export function createHeadings() {
  const counts = new Map<string, number>();
  const dedupedId = (children: ReactNode): string => {
    const base = slugify(textOf(children));
    if (!base) return "";
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  return {
    h2: ({ children }: { children?: ReactNode }) => (
      <Heading as="h2" id={dedupedId(children)}>
        {children}
      </Heading>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <Heading as="h3" id={dedupedId(children)}>
        {children}
      </Heading>
    ),
  };
}
