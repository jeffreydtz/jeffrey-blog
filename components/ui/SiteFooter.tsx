import { NowWidget } from "@/components/ui/NowWidget";
import { getI18n } from "@/lib/i18n/server";

export async function SiteFooter() {
  const { ui } = await getI18n();
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
