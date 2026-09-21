"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";

export function LanguageSwitcher({ initialPath }: { initialPath: string }) {
  const { locale } = useI18n();
  const pathname = usePathname();
  const [path, setPath] = useState(initialPath);
  useEffect(() => {
    const sync = () =>
      setPath(
        window.location.pathname +
          window.location.search +
          window.location.hash,
      );
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);
  return (
    <div
      role="group"
      aria-label={locale === "es" ? "Idioma" : "Language"}
      className="flex items-center gap-xs"
    >
      {(["es", "en", "auto"] as const).map((choice) => (
        <a
          key={choice}
          href={`/language?locale=${choice}&next=${encodeURIComponent(path)}`}
          hrefLang={choice === "auto" ? undefined : choice}
          lang={choice === "auto" ? undefined : choice}
          aria-current={choice === locale ? "true" : undefined}
          title={
            choice === "auto"
              ? locale === "es"
                ? "Usar idioma del sistema"
                : "Use system language"
              : choice === "es"
                ? "Español"
                : "English"
          }
          className="label link-underline inline-flex min-h-[var(--control-target)] items-center px-xs text-ink-secondary aria-[current=true]:text-ink aria-[current=true]:underline"
        >
          {choice === "auto" ? "Auto" : choice.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
