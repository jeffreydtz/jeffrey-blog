import "server-only";
import { codeToHtml, type ThemeRegistration } from "shiki";

/**
 * Highlight de código server-side (SSG) con Shiki, dual theme — T11.
 *
 * Dos temas propios y silenciosos que armonizan con DESIGN.md: nada de neón,
 * colores de tinta cálida sobre papel. Los hex de ESTE archivo son la fuente
 * de tokens de color de código (análogo al frontmatter de DESIGN.md — un tema
 * TextMate no puede leer CSS custom properties); derivados de la familia
 * ink/accent de la paleta. El fondo del bloque NO sale del tema: lo pone
 * globals.css con `var(--color-paper-raised)` para que siga al modo.
 *
 * Estrategia dual estándar de Shiki: `themes: {light, dark}` +
 * `defaultColor: false` → cada span lleva `--shiki-light` / `--shiki-dark`
 * y globals.css elige la variable según `.dark`.
 */

// "Tinta de día": sobre paper-raised #EFEADD, tinta #1A1815.
const PAPER_LIGHT: ThemeRegistration = {
  name: "paper-light",
  type: "light",
  colors: {
    "editor.background": "#EFEADD",
    "editor.foreground": "#1A1815",
  },
  settings: [
    { settings: { foreground: "#1A1815" } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#9A9182", fontStyle: "italic" },
    },
    {
      scope: [
        "keyword",
        "storage.type",
        "storage.modifier",
        "keyword.operator.new",
        "entity.name.tag",
      ],
      settings: { foreground: "#7A3B2E" },
    },
    {
      scope: ["string", "punctuation.definition.string", "string.template"],
      settings: { foreground: "#5A6B3B" },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "support.constant",
      ],
      settings: { foreground: "#8A5A2B" },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call.generic",
      ],
      settings: { foreground: "#3F5B6B" },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
        "entity.other.attribute-name",
      ],
      settings: { foreground: "#6B5535" },
    },
    {
      scope: ["variable", "variable.parameter", "meta.object-literal.key"],
      settings: { foreground: "#4A453C" },
    },
    {
      scope: ["punctuation", "meta.brace", "keyword.operator"],
      settings: { foreground: "#4A453C" },
    },
  ],
};

// "Tinta de noche": sobre paper-raised oscuro #242019, hueso #E8E2D4.
const PAPER_DARK: ThemeRegistration = {
  name: "paper-dark",
  type: "dark",
  colors: {
    "editor.background": "#242019",
    "editor.foreground": "#E8E2D4",
  },
  settings: [
    { settings: { foreground: "#E8E2D4" } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#77705F", fontStyle: "italic" },
    },
    {
      scope: [
        "keyword",
        "storage.type",
        "storage.modifier",
        "keyword.operator.new",
        "entity.name.tag",
      ],
      settings: { foreground: "#C88A70" },
    },
    {
      scope: ["string", "punctuation.definition.string", "string.template"],
      settings: { foreground: "#A8B380" },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "support.constant",
      ],
      settings: { foreground: "#C9A36B" },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call.generic",
      ],
      settings: { foreground: "#8FAAB5" },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
        "entity.other.attribute-name",
      ],
      settings: { foreground: "#C4B48E" },
    },
    {
      scope: ["variable", "variable.parameter", "meta.object-literal.key"],
      settings: { foreground: "#B5AC99" },
    },
    {
      scope: ["punctuation", "meta.brace", "keyword.operator"],
      settings: { foreground: "#B5AC99" },
    },
  ],
};

/**
 * Devuelve el HTML resaltado (root <pre class="shiki">) o null si el lenguaje
 * no existe — el caller renderiza un <pre> plano; un lenguaje desconocido en
 * un post no debe tirar el deploy.
 */
export async function highlightCode(
  code: string,
  lang: string,
): Promise<string | null> {
  try {
    return await codeToHtml(code, {
      lang,
      themes: { light: PAPER_LIGHT, dark: PAPER_DARK },
      defaultColor: false,
    });
  } catch {
    console.warn(`[shiki] lenguaje desconocido "${lang}" — render plano`);
    return null;
  }
}
