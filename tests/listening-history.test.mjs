import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";

async function moduleSource(path) {
  const source = await fs.readFile(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}
const historyUrl = await moduleSource("../lib/listening-history.ts");
const {
  accumulateListening,
  parseListeningHistory,
  parseListeningTrack,
  listeningFromNowSource,
} = await import(historyUrl);
const a = { title: "I Wish It Would Rain Down", artist: "Phil Collins" };
const b = { title: "Andar Conmigo", artist: "Julieta Venegas" };
const empty = { version: 1, tracks: [] };

test("successive saves retain previous and current songs and updates never duplicate", () => {
  const first = accumulateListening(empty, a, b);
  const next = accumulateListening(first, b, {
    title: "Nuevo",
    artist: "Otra persona",
  });
  assert.deepEqual(
    next.tracks.map((t) => t.title),
    [a.title, b.title, "Nuevo"],
  );
  const updated = accumulateListening(next, {
    ...a,
    title: "  I Wish  It Would Rain Down  ",
    coverUrl: "https://example.com/cover.jpg",
  });
  assert.equal(updated.tracks.length, 3);
  assert.equal(updated.tracks[0].coverUrl, "https://example.com/cover.jpg");
  assert.deepEqual(
    first.tracks.map((t) => t.title),
    [a.title, b.title],
  );
});

test("provider track IDs deduplicate changed labels but albums do not collapse distinct songs", () => {
  const spotifyTrackUrl =
    "https://open.spotify.com/track/5s7iwYrSPspe5DfMJoscM8";
  const appleUrl = "https://music.apple.com/us/album/hits/123?i=456";
  assert.equal(
    accumulateListening(
      empty,
      { ...a, spotifyTrackUrl },
      { ...a, title: "Updated label", spotifyTrackUrl },
    ).tracks.length,
    1,
  );
  assert.equal(
    accumulateListening(
      empty,
      { ...a, appleUrl },
      {
        ...a,
        title: "Updated label",
        appleUrl: "https://music.apple.com/ar/song/456",
      },
    ).tracks.length,
    1,
  );
  const spotifyUrl = "https://open.spotify.com/album/7z6woPD6HInYpLQYqiLO1K";
  assert.equal(
    accumulateListening(empty, { ...a, spotifyUrl }, { ...b, spotifyUrl })
      .tracks.length,
    2,
  );
});

test("malformed histories and untrusted provider URLs fail closed", () => {
  for (const raw of [
    null,
    {},
    { version: 2, tracks: [] },
    { version: 1, tracks: [{}] },
  ])
    assert.throws(() => parseListeningHistory(raw));
  for (const appleUrl of [
    "javascript:alert(1)",
    "https://music.apple.com.evil.test/us/song/1",
    "https://music.apple.com@evil.test/us/song/1",
  ])
    assert.throws(() => parseListeningTrack({ ...a, appleUrl }));
  assert.throws(() =>
    parseListeningTrack({
      ...a,
      spotifyTrackUrl: "https://open.spotify.com/album/7z6woPD6HInYpLQYqiLO1K",
    }),
  );
});

test("reads actual generated now source without executing embedded strings", async () => {
  const source = await fs.readFile(
    new URL("../lib/now.ts", import.meta.url),
    "utf8",
  );
  assert.deepEqual(listeningFromNowSource(source).title, b.title);
  assert.match(
    listeningFromNowSource(source).coverUrl,
    /^https:\/\/is1-ssl\.mzstatic\.com/,
  );
  const malicious = 'A "quote" and ${process.exit()}';
  const fixture = `export const now: Now = {\n  listening: {\n    title: ${JSON.stringify(malicious)},\n    artist: "Someone",\n  },\n};`;
  assert.equal(listeningFromNowSource(fixture).title, malicious);
  assert.throws(() => listeningFromNowSource("export const now = runCode();"));
});

const githubUrl = `data:text/javascript;base64,${Buffer.from("export class GitHubApiError extends Error { constructor(status,what,body) { super(what); this.status=status; } }").toString("base64")}`;
const atomicSource = (
  await fs.readFile(
    new URL("../lib/admin/listening-history.ts", import.meta.url),
    "utf8",
  )
)
  .replace('import "server-only";', "")
  .replace('"@/lib/admin/github"', JSON.stringify(githubUrl))
  .replace('"@/lib/listening-history"', JSON.stringify(historyUrl));
const atomicJs = ts.transpileModule(atomicSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const { commitNowWithHistory } = await import(
  `data:text/javascript;base64,${Buffer.from(atomicJs).toString("base64")}`
);

function previousSource(track) {
  return `export const now: Now = {\n  listening: {\n    title: ${JSON.stringify(track.title)},\n    artist: ${JSON.stringify(track.artist)},\n  },\n};`;
}
function fakeGit({ conflict = false, malformed = false } = {}) {
  const calls = [];
  return {
    calls,
    fetch: async (url, init) => {
      const body = init.body ? JSON.parse(init.body) : null;
      calls.push({ url, method: init.method, body });
      let result;
      if (url.includes("/git/ref/")) result = { object: { sha: "head-A" } };
      else if (url.endsWith("/git/commits/head-A"))
        result = { tree: { sha: "tree-A" } };
      else if (url.includes("/contents/lib/now.ts"))
        result = {
          encoding: "base64",
          content: Buffer.from(previousSource(a)).toString("base64"),
        };
      else if (url.includes("/contents/content/data/listening-history.json"))
        result = {
          encoding: "base64",
          content: Buffer.from(
            malformed ? "bad-json" : JSON.stringify(empty),
          ).toString("base64"),
        };
      else if (url.endsWith("/git/trees")) result = { sha: "tree-B" };
      else if (url.endsWith("/git/commits")) result = { sha: "head-B" };
      else if (url.includes("/git/refs/")) {
        if (conflict)
          return new Response('{"message":"Update is not a fast forward"}', {
            status: 422,
          });
        result = {};
      } else throw new Error("Unexpected request " + url);
      return Response.json(result);
    },
  };
}

test("atomic save reads one SHA, writes current+history in one tree, never forces branch", async () => {
  const fake = fakeGit();
  const savedFetch = globalThis.fetch;
  const savedToken = process.env.GITHUB_TOKEN;
  globalThis.fetch = fake.fetch;
  process.env.GITHUB_TOKEN = "fixture-only-not-a-real-token";
  try {
    await commitNowWithHistory(
      { listening: b },
      previousSource(b),
      "fixture save",
    );
    assert.ok(
      fake.calls
        .filter((c) => c.url.includes("/contents/"))
        .every((c) => c.url.endsWith("?ref=head-A")),
    );
    const tree = fake.calls.find((c) => c.url.endsWith("/git/trees")).body;
    assert.equal(tree.base_tree, "tree-A");
    assert.equal(tree.tree.length, 2);
    assert.deepEqual(
      JSON.parse(tree.tree.find((t) => t.path.includes("history")).content)
        .tracks,
      [a, b],
    );
    const commit = fake.calls.find((c) => c.url.endsWith("/git/commits")).body;
    assert.deepEqual(commit.parents, ["head-A"]);
    assert.deepEqual(fake.calls.at(-1).body, { sha: "head-B", force: false });
    assert.equal(fake.calls.length, 7);
  } finally {
    globalThis.fetch = savedFetch;
    if (savedToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = savedToken;
  }
});

test("concurrent branch advance and corrupt history do not overwrite a newer main", async () => {
  const savedFetch = globalThis.fetch;
  const savedToken = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "fixture-only-not-a-real-token";
  try {
    const conflict = fakeGit({ conflict: true });
    globalThis.fetch = conflict.fetch;
    await assert.rejects(
      () =>
        commitNowWithHistory({ listening: b }, previousSource(b), "fixture"),
      (e) => e.status === 422,
    );
    assert.equal(conflict.calls.filter((c) => c.method === "PATCH").length, 1);
    const corrupt = fakeGit({ malformed: true });
    globalThis.fetch = corrupt.fetch;
    await assert.rejects(() =>
      commitNowWithHistory({ listening: b }, previousSource(b), "fixture"),
    );
    assert.ok(corrupt.calls.every((c) => c.method === "GET"));
  } finally {
    globalThis.fetch = savedFetch;
    if (savedToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = savedToken;
  }
});

test("generated now remains consumable with all provider fields and quotes/newlines", async () => {
  const os = await import("node:os");
  const path = await import("node:path");
  const serializerSource = (
    await fs.readFile(
      new URL("../lib/admin/now-data.ts", import.meta.url),
      "utf8",
    )
  ).replace('"@/lib/listening-history"', JSON.stringify(historyUrl));
  const js = ts.transpileModule(serializerSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  const { serializeNow } = await import(
    `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
  );
  const data = {
    listening: {
      ...b,
      title: 'Quote " and line\nbreak',
      appleUrl: "https://music.apple.com/us/song/123456",
      spotifyTrackUrl: "https://open.spotify.com/track/5s7iwYrSPspe5DfMJoscM8",
    },
    reading: { title: "Keep reading", author: "Author" },
  };
  const generated = serializeNow(data);
  assert.deepEqual(listeningFromNowSource(generated), data.listening);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "blog-now-contract-"));
  try {
    const nowFile = path.join(dir, "now.ts");
    const consumer = path.join(dir, "consumer.ts");
    await fs.writeFile(nowFile, generated);
    await fs.writeFile(
      consumer,
      'import { now } from "./now"; const providers: Array<string | undefined> = [now.listening.appleUrl, now.listening.spotifyUrl, now.listening.spotifyTrackUrl]; export { providers };',
    );
    const root = path.resolve(new URL("..", import.meta.url).pathname);
    const program = ts.createProgram([nowFile, consumer], {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      baseUrl: root,
      paths: { "@/*": ["./*"] },
      types: [],
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(
      diagnostics.length,
      0,
      diagnostics
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"))
        .join("\n"),
    );
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
