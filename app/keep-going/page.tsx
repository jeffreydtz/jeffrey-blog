import type { Metadata } from "next";
import { KeepGoingGallery } from "@/components/keep-going/KeepGoingGallery";
import { getI18n } from "@/lib/i18n/server";

const ORIGINAL = "https://www.jackfriks.com/keep-going";

export async function generateMetadata(): Promise<Metadata> {
  const { ui } = await getI18n();
  return {
    title: ui.keepGoing.title,
    description: ui.keepGoing.intro,
    robots: { index: false, follow: false },
  };
}

/**
 * /keep-going — easter egg, sin nav, sin sitemap, noindex.
 * Galería inspirada en jackfriks.com/keep-going, con los tokens de la casa.
 */
export default async function KeepGoingPage() {
  const { ui } = await getI18n();

  return (
    <div className="mx-auto w-full max-w-page px-lg">
      <header className="py-2xl sm:py-3xl">
        <h1 className="font-display text-display-lg text-ink">
          {ui.keepGoing.title}
        </h1>
        <p className="mt-md max-w-prose text-ink-secondary">
          {ui.keepGoing.intro}
        </p>
      </header>
      <KeepGoingGallery ui={ui} />
      <p className="mt-xl pb-2xl text-body-sm text-ink-muted">
        {ui.keepGoing.credit}{" "}
        <a
          href={ORIGINAL}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline"
        >
          {ui.keepGoing.creditHost}
        </a>
      </p>
    </div>
  );
}
