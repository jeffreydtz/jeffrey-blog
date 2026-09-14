import "server-only";
import type { Now } from "@/lib/now";
import { GitHubApiError } from "@/lib/admin/github";
import {
  accumulateListening,
  listeningFromNowSource,
  parseListeningHistory,
} from "@/lib/listening-history";

const HISTORY_PATH = "content/data/listening-history.json";
const NOW_PATH = "lib/now.ts";

/** One parent, one tree, one fast-forward: no partial saves or lost concurrent songs. */
export async function commitNowWithHistory(
  nextNow: Now,
  serializedNow: string,
  message: string,
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("[admin] GITHUB_TOKEN no configurado");
  const repo = process.env.ADMIN_GITHUB_REPO ?? "jeffreydtz/jeffrey-blog";
  const branch = process.env.ADMIN_GITHUB_BRANCH ?? "main";
  const base = `https://api.github.com/repos/${repo}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
  ): Promise<unknown> {
    const response = await fetch(`${base}/${path}`, {
      method,
      headers,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok)
      throw new GitHubApiError(
        response.status,
        `${method} ${path}`,
        await response.text(),
      );
    return response.json();
  }
  const refPath = `git/refs/heads/${branch.split("/").map(encodeURIComponent).join("/")}`;
  const ref = (await request(refPath.replace("git/refs/", "git/ref/"))) as {
    object: { sha: string };
  };
  const parent = ref.object.sha;
  const commit = (await request(`git/commits/${parent}`)) as {
    tree: { sha: string };
  };
  async function fileAt(path: string): Promise<string | null> {
    try {
      const file = (await request(
        `contents/${path}?ref=${encodeURIComponent(parent)}`,
      )) as { content: string; encoding: string };
      if (file.encoding !== "base64" || typeof file.content !== "string")
        throw new Error("Archivo de historial demasiado grande.");
      return Buffer.from(file.content, "base64").toString("utf8");
    } catch (error) {
      if (
        error instanceof GitHubApiError &&
        error.status === 404 &&
        path === HISTORY_PATH
      )
        return null;
      throw error;
    }
  }
  const [previousSource, historySource] = await Promise.all([
    fileAt(NOW_PATH),
    fileAt(HISTORY_PATH),
  ]);
  if (!previousSource) throw new Error("No se encontró la canción anterior.");
  const history = accumulateListening(
    historySource
      ? parseListeningHistory(JSON.parse(historySource))
      : { version: 1, tracks: [] },
    listeningFromNowSource(previousSource),
    nextNow.listening,
  );
  const tree = (await request("git/trees", "POST", {
    base_tree: commit.tree.sha,
    tree: [
      { path: NOW_PATH, mode: "100644", type: "blob", content: serializedNow },
      {
        path: HISTORY_PATH,
        mode: "100644",
        type: "blob",
        content: `${JSON.stringify(history, null, 2)}\n`,
      },
    ],
  })) as { sha: string };
  const next = (await request("git/commits", "POST", {
    message: `${message}\n\nvia /admin`,
    tree: tree.sha,
    parents: [parent],
  })) as { sha: string };
  // If main advanced, this sibling cannot fast-forward: GitHub returns 422.
  await request(refPath, "PATCH", { sha: next.sha, force: false });
}
