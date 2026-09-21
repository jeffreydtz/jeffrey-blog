import { headers } from "next/headers";
import { localizedPath } from "@/lib/i18n/routing";
import { LanguageSwitcher } from "./LanguageSwitcher";
import Link from "next/link";
import { SoundToggle } from "@/components/scroll/SoundToggle";
import { SearchButton } from "@/components/ui/SearchButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getI18n } from "@/lib/i18n/server";

export async function SiteHeader() {
  const { locale, ui } = await getI18n();
  const NAV_ITEMS = [
    { href: "/archivo", label: ui.nav.archive },
    { href: "/gabinete", label: ui.nav.cabinet },
    { href: "/vinyl", label: ui.nav.vinyl },
    { href: "/acerca", label: ui.nav.about },
    { href: "/colofon", label: ui.nav.colophon },
  ] as const;

  return (
    <header className="print-hidden mx-auto w-full max-w-page px-lg">
      <div className="flex flex-wrap items-center justify-between gap-x-lg gap-y-sm py-lg sm:py-xl">
        <Link
          href={localizedPath("/", locale)}
          className="link-underline weight-hover font-display text-display-sm text-ink"
        >
          {ui.siteTitle}
        </Link>
        <nav
          aria-label={ui.nav.label}
          className="site-navigation flex min-w-0 flex-wrap items-center gap-x-md gap-y-xs sm:gap-x-lg"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={localizedPath(item.href, locale)}
              className="label link-underline weight-hover inline-flex min-h-[var(--control-target)] items-center py-sm text-ink-secondary transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <LanguageSwitcher
            initialPath={(await headers()).get("x-blog-path") ?? "/"}
          />
          <SearchButton />
          <SoundToggle />
          <ThemeToggle />
        </nav>
      </div>
      <div className="hairline" />
    </header>
  );
}
