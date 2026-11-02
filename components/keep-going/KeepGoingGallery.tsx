import { KeepGoingVideo } from "@/components/keep-going/KeepGoingVideo";
import { getKeepGoingItems } from "@/lib/keep-going";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function KeepGoingGallery({ ui }: { ui: Dictionary }) {
  const items = getKeepGoingItems();

  return (
    <div className="keep-going-masonry">
      {items.map((item, index) => (
        <figure key={item.src} className="keep-going-item">
          {item.kind === "video" ? (
            <KeepGoingVideo
              src={item.src}
              poster={item.poster}
              width={item.width}
              height={item.height}
              label={`${ui.keepGoing.videoLabel} ${item.n}`}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- galería local ya en webp; next/image aplastaría el webp animado (19)
            <img
              src={item.src}
              alt={`${ui.keepGoing.imageAlt} ${item.n}`}
              width={item.width}
              height={item.height}
              loading={index < 4 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : undefined}
              decoding="async"
              className="keep-going-media"
            />
          )}
        </figure>
      ))}
    </div>
  );
}
