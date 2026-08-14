import "server-only";

/**
 * Publicación desde el panel: los commits del admin van a GitHub, pero el
 * webhook GitHub→Vercel de este proyecto no dispara (constatado 2026-08-14).
 * Un Deploy Hook de Vercel (URL secreta en VERCEL_DEPLOY_HOOK_URL) cubre el
 * hueco: POST → Vercel buildea desde main. Sin la env var, el guardado igual
 * queda commiteado y se avisa que falta publicar a mano.
 */
export async function triggerDeploy(): Promise<{
  triggered: boolean;
  detail: string;
}> {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) {
    return {
      triggered: false,
      detail:
        "Commit hecho. Falta VERCEL_DEPLOY_HOOK_URL para rebuildear solo — deploy manual: vercel deploy --prod --yes",
    };
  }
  try {
    const res = await fetch(url, { method: "POST", cache: "no-store" });
    if (!res.ok) {
      return {
        triggered: false,
        detail: `Commit hecho, pero el deploy hook respondió ${res.status}.`,
      };
    }
    return { triggered: true, detail: "Commit hecho y rebuild disparado." };
  } catch {
    return {
      triggered: false,
      detail: "Commit hecho, pero no se pudo llamar al deploy hook.",
    };
  }
}
