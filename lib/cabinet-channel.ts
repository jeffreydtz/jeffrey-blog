/** Verified via the channel's public Atom feed and YouTube oEmbed on 2026-09-10.
 * A missing verified video should be null: keep the real channel link visible. */
export const cabinetChannel: {
  url: string;
  video: {
    id: string;
    title: string;
    publishedAt: string;
    sourceUrl: string;
  } | null;
} = {
  url: "https://www.youtube.com/@shefrii",
  video: {
    id: "0xqXGjghVpw",
    title: "Lo que nadie me contó del primer año como programador",
    publishedAt: "2026-07-24T01:36:56+00:00",
    sourceUrl:
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCA3jf05nGvtY5lPZTML-MDA",
  },
};
