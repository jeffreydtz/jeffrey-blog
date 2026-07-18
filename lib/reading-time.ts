const WORDS_PER_MINUTE = 200;

/**
 * Tiempo de lectura sobre markdown/MDX "desnudado":
 * se quitan bloques de código, comentarios MDX, tags JSX/HTML y sintaxis
 * de markdown antes de contar palabras. Redondeado, mínimo 1.
 */
export function readingTimeMinutes(markdown: string): number {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, " ") // bloques de código
    .replace(/`[^`\n]*`/g, " ") // código inline
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ") // comentarios MDX
    .replace(/<[^>\n]+>/g, " ") // tags JSX/HTML
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // imágenes
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → conservar el texto
    .replace(/^[\s]*[#>\-*+]+[\s]*/gm, "") // marcas de heading/lista/quote
    .replace(/[*_~|]+/g, "");

  const words = stripped.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
