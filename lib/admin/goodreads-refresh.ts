import "server-only";
import { requireAdmin } from "@/lib/admin/auth";
import { commitFile, githubUserMessage, repoFile } from "@/lib/admin/github";
import { triggerDeploy } from "@/lib/admin/deploy";
import { rateLimit } from "@/lib/rate-limit";
import { buildGoodreadsSnapshot } from "@/lib/goodreads-sync.mjs";
import config from "@/content/data/goodreads-config.json";

export interface GoodreadsRefreshState {
  status: "idle" | "error" | "saved" | "publishing";
  message: string;
  currentTitle?: string;
  verifiedAt?: string;
  canPublish?: boolean;
}

const SNAPSHOT_PATH = "content/data/goodreads.json";
// Best-effort per instance. The GitHub blob SHA protects concurrent writes
// across instances; neither this flag nor rateLimit is a distributed lock.
let running = false;

export async function updateGoodreads(
  intent: "refresh" | "publish",
): Promise<GoodreadsRefreshState> {
  // Keep outside try/catch: preserve the framework's authentication redirect.
  await requireAdmin();
  if (running || !rateLimit("admin-goodreads", 2)) {
    return {
      status: "error",
      canPublish: intent === "publish",
      message:
        "Ya hay una actualización en curso o llegaste al límite. Esperá un minuto y reintentá.",
    };
  }
  running = true;
  try {
    let currentTitle: string | undefined;
    let verifiedAt: string | undefined;
    if (intent === "refresh") {
      let existing;
      try {
        // Capture SHA BEFORE RSS, so a slower request cannot replace newer data.
        existing = await repoFile(SNAPSHOT_PATH);
        if (!existing)
          return {
            status: "error",
            message:
              "No se encontró el snapshot en el repositorio. No se guardó ningún cambio.",
          };
      } catch (error) {
        return { status: "error", message: githubUserMessage(error) };
      }
      let snapshot;
      try {
        snapshot = await buildGoodreadsSnapshot(config);
      } catch {
        return {
          status: "error",
          message:
            "No se pudo verificar Goodreads. Puede estar demorado o el perfil no ser público. Se conserva la última lectura guardada; reintentá en un minuto.",
        };
      }
      const text = `${JSON.stringify(snapshot, null, 2)}\n`;
      // Stay within the Contents API's readable JSON/base64 file size.
      if (Buffer.byteLength(text, "utf8") > 900_000)
        return {
          status: "error",
          message:
            "La biblioteca supera el tamaño admitido. Se conserva la última versión guardada.",
        };
      try {
        await commitFile(
          SNAPSHOT_PATH,
          text,
          "chore: actualizar Goodreads desde la web",
          existing.sha,
        );
      } catch (error) {
        return { status: "error", message: githubUserMessage(error) };
      }
      currentTitle =
        snapshot.currentlyReading?.[0]?.title ?? "Sin lectura en curso";
      verifiedAt = snapshot.verifiedAt;
    }
    const result = await triggerDeploy();
    return {
      status: result.triggered ? "publishing" : "saved",
      message: result.triggered
        ? "Lecturas guardadas. Publicación solicitada; el sitio se actualizará cuando termine la compilación."
        : "Las lecturas quedaron guardadas, pero no se pudo iniciar la publicación. Reintentá publicar; si sigue fallando, revisá el Deploy Hook en la configuración de Vercel.",
      currentTitle,
      verifiedAt,
      canPublish: !result.triggered,
    };
  } finally {
    running = false;
  }
}
