import { YouTube } from "@/components/mdx/YouTube";
import { cabinetChannel } from "@/lib/cabinet-channel";
import { ui } from "@/lib/ui";

export function CabinetChannel() {
  const { url, video } = cabinetChannel;
  return (
    <section
      aria-labelledby="cabinet-channel-title"
      className="mt-2xl max-w-prose"
    >
      <h2 id="cabinet-channel-title" className="font-display text-display-md">
        {ui.cabinet.channelTitle}
      </h2>
      {video && (
        <YouTube id={video.id} title={video.title} caption={video.title} />
      )}
      <a
        href={url}
        className="link-underline inline-flex min-h-12 items-center text-body-sm text-ink-secondary"
      >
        {ui.cabinet.channelLink}
      </a>
    </section>
  );
}
