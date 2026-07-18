import matter from "gray-matter";
import { compileMDX, type MDXRemoteProps } from "next-mdx-remote/rsc";
import { Bandcamp } from "@/components/mdx/Bandcamp";
import { CodeBlock } from "@/components/mdx/CodeBlock";
import { createHeadings } from "@/components/mdx/Heading";
import { LinkCard } from "@/components/mdx/LinkCard";
import { MdxImage } from "@/components/mdx/MdxImage";
import { MdxLink } from "@/components/mdx/MdxLink";
import { SoundCloud } from "@/components/mdx/SoundCloud";
import { Spotify } from "@/components/mdx/Spotify";
import { Tweet } from "@/components/mdx/Tweet";
import { Blockquote, Hr } from "@/components/mdx/Typography";
import { Vimeo } from "@/components/mdx/Vimeo";
import { YouTube } from "@/components/mdx/YouTube";

/**
 * Mapa de componentes MDX — fase 4 (T09–T11).
 *
 * Embeds (spec FR-004): <YouTube/>, <Vimeo/>, <Spotify/>, <SoundCloud/>,
 * <Bandcamp/>, <Tweet/>, <LinkCard/>.
 * Overrides tipográficos: blockquote, pre (Shiki), img (next/image),
 * h2/h3 (anclas), a (externo-consciente), hr. El code inline lo estila
 * globals.css (`.prose-blog :not(pre) > code`), sin componente.
 *
 * Nota sobre "imports lazy": acá todo es Server Component — no viaja al
 * bundle de cliente (la única isla client es LazyEmbed, importada solo por
 * YouTube/Vimeo), así que next/dynamic por componente no ahorraría nada y
 * rompe con RSC async (Tweet/LinkCard). Imports estáticos a propósito.
 */
const baseMdxComponents: MDXRemoteProps["components"] = {
  // Embeds
  YouTube,
  Vimeo,
  Spotify,
  SoundCloud,
  Bandcamp,
  Tweet,
  LinkCard,
  // Overrides tipográficos
  a: MdxLink,
  blockquote: Blockquote,
  hr: Hr,
  img: MdxImage,
  pre: CodeBlock,
};

/** Separa frontmatter y cuerpo de un archivo MDX crudo. */
export function parseMdxFile(raw: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const { data, content } = matter(raw);
  return { data, content };
}

/**
 * Compila un cuerpo MDX (sin frontmatter — lib/posts.ts ya lo separó)
 * a un elemento RSC listo para renderizar.
 */
export async function renderMdx(source: string) {
  const { content } = await compileMDX({
    source,
    // h2/h3 se crean por documento: contador compartido para dedupe de ids.
    components: { ...baseMdxComponents, ...createHeadings() },
    options: { parseFrontmatter: false },
  });
  return content;
}
