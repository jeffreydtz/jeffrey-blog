import { isValidElement, type ReactElement, type ReactNode } from "react";
import { highlightCode } from "@/lib/shiki";

/**
 * Override de `pre` (bloques de código fenced) — T11.
 * RSC async: extrae el texto crudo del <code> hijo y lo resalta con Shiki en
 * build time (dual theme, ver lib/shiki.ts). El <code> hijo nunca pasa por el
 * mapa de componentes MDX: el HTML lo emite Shiki completo.
 * Lenguaje desconocido → <pre> plano, el build no rompe.
 */

interface CodeProps {
  className?: string;
  children?: ReactNode;
}

export async function CodeBlock({ children }: { children?: ReactNode }) {
  const codeEl = isValidElement<CodeProps>(children)
    ? (children as ReactElement<CodeProps>)
    : null;
  const raw =
    typeof codeEl?.props.children === "string" ? codeEl.props.children : null;

  if (raw === null) {
    return <pre>{children}</pre>;
  }

  const lang =
    /language-([\w+-]+)/.exec(codeEl?.props.className ?? "")?.[1] ?? "text";
  const code = raw.replace(/\n$/, "");
  const html = await highlightCode(code, lang);

  if (!html) {
    return (
      <pre>
        <code>{code}</code>
      </pre>
    );
  }

  // Shiki devuelve el <pre class="shiki"> completo, con spans ya coloreados
  // por variables --shiki-light/--shiki-dark (globals.css elige según .dark).
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
