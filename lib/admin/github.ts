import "server-only";

/**
 * Cliente mínimo de la GitHub Contents API para el panel /admin.
 *
 * El repo sigue siendo la única fuente de verdad: cada guardado del panel es
 * un commit real a `main`. El panel no toca el filesystem del deploy (que en
 * Vercel es de solo lectura y efímero) — lee y escribe SIEMPRE contra GitHub.
 *
 * Necesita GITHUB_TOKEN (fine-grained, permiso Contents read/write sobre el
 * repo). Nunca se loguea ni viaja al cliente.
 */

const API = "https://api.github.com";
const REPO = process.env.ADMIN_GITHUB_REPO ?? "jeffreydtz/jeffrey-blog";
const BRANCH = process.env.ADMIN_GITHUB_BRANCH ?? "main";

export interface RepoFile {
  path: string;
  sha: string;
  text: string;
}

export interface RepoEntry {
  name: string;
  path: string;
  sha: string;
}

function ghHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("[admin] GITHUB_TOKEN no configurado");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function contentsUrl(path: string): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${API}/repos/${REPO}/contents/${encoded}`;
}

async function ghFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...ghHeaders(), ...init?.headers },
    cache: "no-store",
  });
  return res;
}

async function fail(res: Response, what: string): Promise<never> {
  const body = await res.text().catch(() => "");
  throw new Error(
    `[admin] GitHub ${what} falló (${res.status}): ${body.slice(0, 300)}`,
  );
}

/** Archivo del repo (rama main) o null si no existe. */
export async function repoFile(path: string): Promise<RepoFile | null> {
  const res = await ghFetch(`${contentsUrl(path)}?ref=${BRANCH}`);
  if (res.status === 404) return null;
  if (!res.ok) await fail(res, `GET ${path}`);
  const data = (await res.json()) as { sha: string; content: string };
  return {
    path,
    sha: data.sha,
    text: Buffer.from(data.content, "base64").toString("utf8"),
  };
}

/** Listado de un directorio del repo (solo archivos). */
export async function repoDir(path: string): Promise<RepoEntry[]> {
  const res = await ghFetch(`${contentsUrl(path)}?ref=${BRANCH}`);
  if (res.status === 404) return [];
  if (!res.ok) await fail(res, `GET ${path}/`);
  const data = (await res.json()) as Array<{
    type: string;
    name: string;
    path: string;
    sha: string;
  }>;
  return data
    .filter((e) => e.type === "file")
    .map(({ name, path: p, sha }) => ({ name, path: p, sha }));
}

/** Crea o actualiza (con sha) un archivo — un commit a main. */
export async function commitFile(
  path: string,
  text: string,
  message: string,
  sha?: string,
): Promise<void> {
  const res = await ghFetch(contentsUrl(path), {
    method: "PUT",
    body: JSON.stringify({
      message: `${message}\n\nvia /admin`,
      content: Buffer.from(text, "utf8").toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) await fail(res, `PUT ${path}`);
}

/** Borra un archivo — un commit a main. */
export async function deleteRepoFile(
  path: string,
  message: string,
  sha: string,
): Promise<void> {
  const res = await ghFetch(contentsUrl(path), {
    method: "DELETE",
    body: JSON.stringify({
      message: `${message}\n\nvia /admin`,
      sha,
      branch: BRANCH,
    }),
  });
  if (!res.ok) await fail(res, `DELETE ${path}`);
}
