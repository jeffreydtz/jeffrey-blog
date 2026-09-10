import "server-only";

/**
 * Cliente mínimo de la GitHub Contents API para el panel /admin.
 *
 * El repo sigue siendo la única fuente de verdad: cada guardado del panel es
 * un commit real a `main`. El panel no toca el filesystem del deploy (que en
 * Vercel es de solo lectura y efímero) — lee y escribe SIEMPRE contra GitHub.
 *
 * Necesita GITHUB_TOKEN (fine-grained, permiso Contents: Read and write
 * sobre el repo). Un token de solo lectura — o el GITHUB_TOKEN de Actions
 * sin `contents: write` — responde 403 "Resource not accessible by personal
 * access token". Nunca se loguea ni viaja al cliente.
 */

/** Error de la GitHub API con status, para mapear mensajes al panel. */
export class GitHubApiError extends Error {
  readonly status: number;
  readonly githubMessage: string;

  constructor(status: number, what: string, body: string) {
    const githubMessage = parseGithubMessage(body);
    super(
      `[admin] GitHub ${what} falló (${status}): ${githubMessage || body.slice(0, 200)}`,
    );
    this.name = "GitHubApiError";
    this.status = status;
    this.githubMessage = githubMessage;
  }
}

function parseGithubMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: unknown };
    return typeof parsed.message === "string" ? parsed.message : "";
  } catch {
    return body.slice(0, 200).trim();
  }
}

function asGitHubApiError(error: unknown): GitHubApiError | null {
  if (error instanceof GitHubApiError) return error;
  if (
    error instanceof Error &&
    error.name === "GitHubApiError" &&
    "status" in error &&
    typeof (error as GitHubApiError).status === "number"
  ) {
    return error as GitHubApiError;
  }
  return null;
}

/**
 * Mensaje en español para el panel. No inventa tokens: si GitHub dijo 403
 * de permisos, dice cómo corregir el fine-grained token.
 */
export function githubUserMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.includes("GITHUB_TOKEN no configurado")
  ) {
    return "Falta GITHUB_TOKEN en las env vars del deploy.";
  }
  const gh = asGitHubApiError(error);
  if (gh) {
    const msg = gh.githubMessage.toLowerCase();
    if (gh.status === 401) {
      return "GitHub rechazó el token (inválido o vencido). Generá un fine-grained token nuevo con Contents: Read and write sobre este repo.";
    }
    if (
      gh.status === 403 ||
      msg.includes("resource not accessible by personal access token")
    ) {
      return "GitHub denegó la escritura (403): el token no tiene permiso Contents: Read and write sobre este repo. En GitHub → Settings → Developer settings → Fine-grained tokens → este token → Repository permissions → Contents = Read and write. Un token de solo lectura o el GITHUB_TOKEN de Actions no alcanza.";
    }
    if (gh.status === 404) {
      return "GitHub no encontró el archivo o el repositorio. Revisá ADMIN_GITHUB_REPO.";
    }
    if (gh.status === 409 || gh.status === 422) {
      return "GitHub rechazó el commit (¿el archivo cambió mientras editabas?). Recargá y reintentá.";
    }
    return `GitHub rechazó el guardado (${gh.status}).`;
  }
  return "No se pudo guardar. Intentá de nuevo.";
}

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
  throw new GitHubApiError(res.status, what, body);
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
