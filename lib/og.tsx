import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * OG images (T15) — tarjeta old-money: crema, tinta, filete fino, Fraunces.
 * Sin gradientes, sin sombras. Una sola paleta (la clara): la OG image es
 * una tarjeta impresa, no tiene dark mode.
 *
 * Tokens espejo de DESIGN.md (paleta clara) — mismo criterio que
 * lib/shiki.ts: ImageResponse/satori no puede leer CSS custom properties,
 * así que ESTA es su fuente de tokens. Si DESIGN.md cambia, esto se
 * actualiza a mano.
 */
const OG_COLORS = {
  paper: "#F5F1E8",
  ink: "#1A1815",
  inkMuted: "#7A7264",
  hairline: "#D9D2C3",
} as const;

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

/**
 * Fraunces 500 estático (assets/fonts/Fraunces-500.ttf, instanciado desde
 * la variable por Google Fonts) — bundled: la generación de OG no depende
 * de la red en build. Promesa memoizada: un solo read para todas las cards.
 */
let frauncesData: Promise<Buffer> | null = null;
function loadFraunces(): Promise<Buffer> {
  frauncesData ??= fs.readFile(
    path.join(process.cwd(), "assets", "fonts", "Fraunces-500.ttf"),
  );
  return frauncesData;
}

export interface OgCard {
  /** Línea superior en mayúsculas con tracking amplio (nombre del sitio). */
  eyebrow: string;
  /** Título grande en Fraunces. */
  title: string;
  /** Línea inferior en mayúsculas (fecha · autor, o descripción). */
  footer: string;
}

export async function renderOgImage({
  eyebrow,
  title,
  footer,
}: OgCard): Promise<ImageResponse> {
  const fraunces = await loadFraunces();
  const titleSize = title.length > 55 ? 56 : 68;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: OG_COLORS.paper,
        padding: 56,
        fontFamily: "Fraunces",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: `1px solid ${OG_COLORS.hairline}`,
          padding: 64,
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 5,
            color: OG_COLORS.inkMuted,
          }}
        >
          {eyebrow.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: titleSize,
            lineHeight: 1.15,
            letterSpacing: -1,
            color: OG_COLORS.ink,
            maxWidth: 940,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            color: OG_COLORS.inkMuted,
          }}
        >
          {footer.toUpperCase()}
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 500, style: "normal" },
      ],
    },
  );
}
