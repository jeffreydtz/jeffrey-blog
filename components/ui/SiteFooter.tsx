import { NewsletterForm } from "@/components/ui/NewsletterForm";
import { NowWidget } from "@/components/ui/NowWidget";
import { ui } from "@/lib/ui";

export function SiteFooter() {
  return (
    <footer className="print-hidden mx-auto w-full max-w-page px-lg pb-2xl">
      <div className="hairline mb-lg" />
      <div className="flex flex-col justify-between gap-lg sm:flex-row sm:items-end">
        {/* Columna izquierda: "Ahora" (T17) + suscripción */}
        <div className="flex w-full max-w-palette flex-col gap-lg">
          <NowWidget />
          <NewsletterForm className="max-w-form" />
        </div>
        <p className="text-body-sm text-ink-muted">
          © {new Date().getFullYear()} Jeffrey Dietz ·{" "}
          {ui.footer.rights.toLowerCase()}
        </p>
      </div>
    </footer>
  );
}
