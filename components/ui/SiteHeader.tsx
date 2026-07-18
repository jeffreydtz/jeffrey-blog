import Link from "next/link";
import { SoundToggle } from "@/components/scroll/SoundToggle";
import { SearchButton } from "@/components/ui/SearchButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ui } from "@/lib/ui";

const NAV_ITEMS = [
  { href: "/archivo", label: ui.nav.archive },
  { href: "/acerca", label: ui.nav.about },
  { href: "/colofon", label: ui.nav.colophon },
] as const;

export function SiteHeader() {
  return (
    <header className="print-hidden mx-auto w-full max-w-page px-lg">
      <div className="flex flex-wrap items-center justify-between gap-x-lg gap-y-sm py-lg sm:py-xl">
        <Link
          href="/"
          className="link-underline weight-hover font-display text-display-sm text-ink"
        >
          {ui.siteTitle}
        </Link>
        <nav
          aria-label="Principal"
          className="flex items-center gap-md sm:gap-lg"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label link-underline weight-hover py-sm text-ink-secondary transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <SearchButton />
          <SoundToggle />
          <ThemeToggle />
        </nav>
      </div>
      <div className="hairline" />
    </header>
  );
}
