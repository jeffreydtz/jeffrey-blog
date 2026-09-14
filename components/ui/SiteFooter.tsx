import { NowWidget } from "@/components/ui/NowWidget";
import { ui } from "@/lib/ui";

export function SiteFooter() {
  return (
    <footer className="print-hidden mx-auto w-full max-w-page px-lg pb-2xl">
      <div className="hairline mb-xl" />
      <div className="mx-auto flex max-w-prose flex-col gap-lg">
        <NowWidget />
        <p className="border-t border-hairline pt-lg text-center text-body-sm text-ink-muted">
          © {new Date().getFullYear()} Jeffrey Dietz ·{" "}
          {ui.footer.rights.toLowerCase()}
        </p>
      </div>
    </footer>
  );
}
