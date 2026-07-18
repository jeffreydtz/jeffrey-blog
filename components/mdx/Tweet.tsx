import { fetchTweet } from "@/lib/oembed";
import { ui } from "@/lib/ui";

/**
 * Uso en MDX: `<Tweet id="20" />` — T10.
 * RSC async: resuelve el oEmbed en build/render time (cache commiteado en
 * .cache/embeds/) y pinta una cita ESTÁTICA con el tratamiento editorial del
 * sitio. Sin widget de Twitter, sin iframe. Si no hay dato (ni cache ni red)
 * → fallback: link estilado "Ver en X".
 */
export async function Tweet({ id }: { id?: string }) {
  if (!id || !/^\d{1,25}$/.test(id)) {
    throw new Error(
      `[mdx] <Tweet>: prop "id" requerida — el id numérico del estado, p. ej. <Tweet id="20" />. Recibido: ${JSON.stringify(id)}`,
    );
  }

  const tweet = await fetchTweet(id);
  const statusUrl = tweet?.url ?? `https://twitter.com/i/status/${id}`;

  if (!tweet) {
    return (
      <div className="my-lg border-l border-hairline pl-lg">
        <a
          href={statusUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="label link-underline no-underline"
        >
          {ui.mdx.tweetFallback}
        </a>
        <span className="mt-2xs block text-body-sm break-all text-ink-muted">
          {statusUrl}
        </span>
      </div>
    );
  }

  return (
    <blockquote className="my-xl border-l border-hairline py-2xs pl-lg">
      <p className="whitespace-pre-line text-ink">{tweet.text}</p>
      <footer className="mt-md flex flex-wrap items-baseline gap-x-md gap-y-2xs">
        <span className="label text-ink-secondary">{tweet.author}</span>
        <a
          href={statusUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="label link-underline no-underline"
        >
          {tweet.date ? `${tweet.date} · ` : ""}
          {ui.mdx.tweetView}
        </a>
      </footer>
    </blockquote>
  );
}
