import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Detección del asset de sonido EN BUILD (plan.md, decisión #5): si el foley
 * no existe, el chrome de sonido no se renderiza y el navegador jamás pide
 * el archivo (cero 404s). Se evalúa en el RSC del layout — agregar el mp3
 * requiere un rebuild/redeploy, documentado en public/sounds/README.md.
 */
export function hasPageTurnAsset(): boolean {
  return fs.existsSync(
    path.join(process.cwd(), "public", "sounds", "page-turn.mp3"),
  );
}
