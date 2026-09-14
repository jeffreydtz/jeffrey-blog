import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";

async function load(path, mocks = {}) {
  const source = await fs.readFile(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)(
    (name) => {
      if (name in mocks) return mocks[name];
      throw new Error("Unexpected dependency " + name);
    },
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
const history = await load("../lib/listening-history.ts");
const data = await load("../lib/admin/now-data.ts", {
  "@/lib/listening-history": history,
});
function form() {
  return new FormData();
}
function filled() {
  const f = form();
  for (const [k, v] of Object.entries({
    listeningTitle: "New song",
    listeningArtist: "Artist",
    listeningApple: "https://music.apple.com/us/song/1234",
    listeningSpotify: "https://open.spotify.com/track/5s7iwYrSPspe5DfMJoscM8",
    readingTitle: "Manual reading",
    readingAuthor: "Writer",
  }))
    f.set(k, v);
  return f;
}
async function action({ unauthorized = false, conflict = false } = {}) {
  const events = [];
  const mocks = {
    "gray-matter": {},
    "next/navigation": {
      redirect: (url) => {
        events.push({ type: "redirect", url });
        throw new Error("REDIRECT");
      },
    },
    "@/lib/admin/auth": {
      requireAdmin: async () => {
        events.push({ type: "auth" });
        if (unauthorized) throw new Error("UNAUTHORIZED");
      },
    },
    "@/lib/admin/github": {
      githubUserMessage: () => "GitHub rechazó el commit.",
    },
    "@/lib/admin/listening-history": {
      commitNowWithHistory: async (now, source) => {
        events.push({ type: "commit", now, source });
        if (conflict) throw new Error("Conflict");
      },
    },
    "@/lib/admin/now-data": data,
    "@/lib/listening-history": history,
    "@/lib/admin/deploy": {
      triggerDeploy: async () => {
        events.push({ type: "deploy" });
        return { detail: "Saved" };
      },
    },
    "@/lib/rate-limit": {},
  };
  return { events, ...(await load("../app/admin/actions.ts", mocks)) };
}

test("saveNow authenticates, saves accumulated data and only then deploys", async () => {
  const { events, saveNowAction } = await action();
  await assert.rejects(() => saveNowAction(filled()), /REDIRECT/);
  assert.deepEqual(
    events.map((e) => e.type),
    ["auth", "commit", "deploy", "redirect"],
  );
  const saved = events[1];
  assert.deepEqual(
    history.listeningFromNowSource(saved.source),
    saved.now.listening,
  );
  assert.equal(saved.now.reading.title, "Manual reading");
  assert.ok(saved.now.listening.appleUrl);
  assert.ok(saved.now.listening.spotifyTrackUrl);
});

test("unauthenticated and invalid URL saves never reach Git or deploy", async () => {
  const denied = await action({ unauthorized: true });
  await assert.rejects(() => denied.saveNowAction(filled()), /UNAUTHORIZED/);
  assert.deepEqual(
    denied.events.map((e) => e.type),
    ["auth"],
  );
  const invalid = await action();
  const f = filled();
  f.set("listeningSpotify", "https://evil.test/track/abc");
  await assert.rejects(() => invalid.saveNowAction(f), /REDIRECT/);
  assert.deepEqual(
    invalid.events.map((e) => e.type),
    ["auth", "redirect"],
  );
});

test("Git conflict returns editor error and does not trigger a deploy", async () => {
  const { events, saveNowAction } = await action({ conflict: true });
  await assert.rejects(() => saveNowAction(filled()), /REDIRECT/);
  assert.deepEqual(
    events.map((e) => e.type),
    ["auth", "commit", "redirect"],
  );
  assert.ok(events.at(-1).url.startsWith("/admin/now?e="));
});
