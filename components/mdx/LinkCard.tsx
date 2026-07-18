import { fetchLinkCard } from "@/lib/og-scrape";

/**
 * Uso en MDX: `<LinkCard url="https://…" />` — T10.
 * RSC async: scrape OpenGraph en build/render time (cache commiteado en
 * .cache/embeds/), nunca iframe (spec FR-004). Visual: borde fino 1px, título
 * serif (font-display), descripción en una línea ink-muted, dominio en label
 * de tracking amplio, miniatura og:image opcional al costado. Sin sombras.
 * Fallback (sin cache + red caída): link plano estilado con el dominio.
 */
export async function LinkCard({ url }: { url?: string }) {
  if (!url || !/^https?:\/\/\S+$/.test(url)) {
    throw new Error(
      `[mdx] <LinkCard>: prop "url" requerida — URL absoluta http(s), p. ej. <LinkCard url="https://en.wikipedia.org/wiki/IndieWeb" />. Recibido: ${JSON.stringify(url)}`,
    );
  }

  const data = await fetchLinkCard(url);
  const domain = new URL(data?.url ?? url).hostname.replace(/^www\./, "");

  if (!data) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="my-lg block rounded-subtle border border-hairline p-md no-underline"
      >
        <span className="label block">{domain}</span>
        <span className="mt-2xs block text-body-sm break-all text-ink-secondary">
          {url}
        </span>
      </a>
    );
  }

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="my-lg flex items-center gap-lg rounded-subtle border border-hairline p-md no-underline transition-colors hover:bg-paper-raised"
    >
      <span className="block min-w-0 flex-1">
        <span className="label block">{domain}</span>
        <span className="mt-2xs block font-display text-display-sm text-ink">
          {data.title}
        </span>
        {data.description ? (
          <span className="mt-2xs block truncate text-body-sm text-ink-muted">
            {data.description}
          </span>
        ) : null}
      </span>
      {data.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- og:image de host arbitrario; next/image con remotePatterns comodín volvería el optimizador un proxy abierto
        <img
          src={data.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="hidden h-2xl w-2xl shrink-0 rounded-subtle border border-hairline object-cover sm:block"
        />
      ) : null}
    </a>
  );
}
