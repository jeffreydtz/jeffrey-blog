import type { Metadata } from "next";
import { Fraunces, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { SoundProvider } from "@/components/scroll/SoundProvider";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SITE } from "@/lib/site";
import { hasPageTurnAsset } from "@/lib/sound";
import { ui } from "@/lib/ui";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: ui.siteTitle,
    template: `%s · ${ui.siteTitle}`,
  },
  description: ui.siteDescription,
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
};

/**
 * Anti-FOUC: decide el tema antes del primer paint.
 * localStorage "theme" ("dark" | "light") → fallback prefers-color-scheme.
 */
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${fraunces.variable} ${sourceSerif.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <SoundProvider available={hasPageTurnAsset()}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </SoundProvider>
      </body>
    </html>
  );
}
