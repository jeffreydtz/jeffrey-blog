import "server-only";
import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

/**
 * Galería /keep-going — assets en public/keep-going/.
 * Importados de jackfriks.com/keep-going: 1–16.jpeg (salvo 14, duplicado de 5)
 * y 17–58.webp (salvo 24, 404), más 59/60 como video + poster. Sin avisos,
 * foto ni OG del original. 19.webp es un webp animado: se sirve tal cual.
 */

export type KeepGoingImage = {
  kind: "image";
  n: number;
  src: string;
  width: number;
  height: number;
};

export type KeepGoingVideo = {
  kind: "video";
  n: number;
  src: string;
  poster: string;
  width: number;
  height: number;
};

export type KeepGoingItem = KeepGoingImage | KeepGoingVideo;

const MEDIA_DIR = path.join(process.cwd(), "public", "keep-going");

/** Canvas del webp animado 19 (VP8X / markup original); image-size no lo lee. */
const ANIMATED_FALLBACK: Record<number, { width: number; height: number }> = {
  19: { width: 480, height: 270 },
};

function readSize(
  file: string,
  fallback?: { width: number; height: number },
): { width: number; height: number } {
  try {
    const { width, height } = imageSize(fs.readFileSync(file));
    if (width && height) return { width, height };
  } catch {
    /* animated webp y codecs raros caen al fallback */
  }
  if (fallback) return fallback;
  throw new Error(`[keep-going] no pude leer dimensiones de ${file}`);
}

export function getKeepGoingItems(): KeepGoingItem[] {
  const names = fs.readdirSync(MEDIA_DIR);
  const numbers = new Set<number>();
  for (const name of names) {
    const match = name.match(/^(\d+)\.(webp|mp4)$/);
    if (match) numbers.add(Number(match[1]));
  }

  return [...numbers]
    .sort((a, b) => a - b)
    .map((n): KeepGoingItem => {
      const videoName = `${n}.mp4`;
      if (names.includes(videoName)) {
        const posterName = `${n}-poster.webp`;
        if (!names.includes(posterName)) {
          throw new Error(`[keep-going] falta poster de video ${n}`);
        }
        const size = readSize(path.join(MEDIA_DIR, posterName));
        return {
          kind: "video",
          n,
          src: `/keep-going/${videoName}`,
          poster: `/keep-going/${posterName}`,
          ...size,
        };
      }
      const imageName = `${n}.webp`;
      if (!names.includes(imageName)) {
        throw new Error(`[keep-going] falta imagen ${n}`);
      }
      const size = readSize(
        path.join(MEDIA_DIR, imageName),
        ANIMATED_FALLBACK[n],
      );
      return {
        kind: "image",
        n,
        src: `/keep-going/${imageName}`,
        ...size,
      };
    });
}
