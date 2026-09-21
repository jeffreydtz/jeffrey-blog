import type { Metadata } from "next";
import { Fraunces, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { SoundProvider } from "@/components/scroll/SoundProvider";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SITE } from "@/lib/site";
import { hasPageTurnAsset } from "@/lib/sound";
import { getI18n } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/client";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  axes: ["opsz"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale, ui } = await getI18n();
  return {
    metadataBase: new URL(SITE.url),
    title: { default: ui.siteTitle, template: `%s · ${ui.siteTitle}` },
    description: ui.siteDescription,
    authors: [{ name: SITE.author, url: SITE.url }],
    creator: SITE.author,
    alternates: { types: { "application/rss+xml": `/feeds/${locale}` } },
    openGraph: {
      type: "website",
      locale: locale === "es" ? "es_AR" : "en_US",
      siteName: SITE.name,
      images: [`/${locale}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

/**
 * Anti-FOUC: decide el tema antes del primer paint.
 * localStorage "theme" ("dark" | "light") → fallback prefers-color-scheme.
 */
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, ui } = await getI18n();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fraunces.variable} ${sourceSerif.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <LocaleProvider locale={locale}>
          <SoundProvider available={hasPageTurnAsset()}>
            <a href="#contenido" className="skip-link print-hidden z-50">
              {ui.skipToContent}
            </a>
            <SiteHeader />
            <main id="contenido" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </SoundProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
