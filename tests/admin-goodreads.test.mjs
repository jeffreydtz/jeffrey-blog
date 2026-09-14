import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";

const source = await fs.readFile(
  new URL("../lib/admin/goodreads-refresh.ts", import.meta.url),
  "utf8",
);
let id = 0;
async function setup(overrides = {}) {
  const calls = [];
  const snapshot = {
    profileUrl: "https://www.goodreads.com/user/show/123-test",
    verifiedAt: "2026-09-14T00:00:00.000Z",
    books: [{ id: "1" }],
    currentlyReading: [{ id: "2", title: "Current Book" }],
  };
  const deps = {
    requireAdmin: async () => {
      calls.push("auth");
    },
    rateLimit: () => true,
    repoFile: async (path) => {
      calls.push(["read", path]);
      return { sha: "old-sha", text: "previous snapshot" };
    },
    buildGoodreadsSnapshot: async () => {
      calls.push("rss");
      return snapshot;
    },
    commitFile: async (...args) => {
      calls.push(["commit", ...args]);
    },
    triggerDeploy: async () => {
      calls.push("deploy");
      return { triggered: true };
    },
    githubUserMessage: (error) =>
      `Safe GitHub error: ${error.status ?? "unavailable"}`,
    config: { profileUrl: "trusted", shelves: ["read", "currently-reading"] },
    ...overrides,
  };
  const key = `__goodreadsTest${id++}`;
  globalThis[key] = deps;
  const output = ts.transpileModule(
    source.replace(/^import[\s\S]*?;\n/gm, ""),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    },
  ).outputText;
  const code = `const { ${Object.keys(deps).join(",")} } = globalThis[${JSON.stringify(key)}];\n${output}`;
  const loaded = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
  delete globalThis[key];
  return { ...loaded, calls, snapshot };
}

test("unauthenticated action redirects before all reads, fetches, writes and deploys", async () => {
  const redirect = new Error("NEXT_REDIRECT");
  const { updateGoodreads, calls } = await setup({
    requireAdmin: async () => {
      throw redirect;
    },
  });
  for (const intent of ["refresh", "publish"])
    await assert.rejects(
      updateGoodreads(intent),
      (error) => error === redirect,
    );
  assert.deepEqual(calls, []);
});

test("refresh authenticates, captures SHA before RSS, commits only snapshot then deploys", async () => {
  const { updateGoodreads, calls, snapshot } = await setup();
  const result = await updateGoodreads("refresh");
  assert.deepEqual(calls.slice(0, 3), [
    "auth",
    ["read", "content/data/goodreads.json"],
    "rss",
  ]);
  assert.equal(calls[3][0], "commit");
  assert.equal(calls[3][1], "content/data/goodreads.json");
  assert.deepEqual(JSON.parse(calls[3][2]), snapshot);
  assert.equal(calls[3][4], "old-sha");
  assert.equal(calls[4], "deploy");
  assert.equal(result.status, "publishing");
  assert.match(result.message, /cuando termine/);
  assert.equal(result.currentTitle, "Current Book");
});

test("invalid feeds or timeout preserve existing snapshot and never deploy", async () => {
  const { updateGoodreads, calls } = await setup({
    buildGoodreadsSnapshot: async () => {
      throw new Error("SECRET remote body");
    },
  });
  const result = await updateGoodreads("refresh");
  assert.equal(result.status, "error");
  assert.match(result.message, /conserva/);
  assert.doesNotMatch(result.message, /SECRET/);
  assert.deepEqual(calls, ["auth", ["read", "content/data/goodreads.json"]]);
});

test("GitHub missing file/read errors fail before downloading feeds", async () => {
  for (const repoFile of [
    async () => null,
    async () => {
      throw { status: 403 };
    },
  ]) {
    const { updateGoodreads, calls } = await setup({ repoFile });
    assert.equal((await updateGoodreads("refresh")).status, "error");
    assert.deepEqual(calls, ["auth"]);
  }
});

test("SHA conflicts and permission failures do not deploy or retry blind writes", async () => {
  for (const status of [409, 403]) {
    const { updateGoodreads, calls } = await setup({
      commitFile: async () => {
        throw { status };
      },
    });
    const result = await updateGoodreads("refresh");
    assert.equal(result.status, "error");
    assert.match(result.message, new RegExp(String(status)));
    assert.ok(!calls.includes("deploy"));
  }
});

test("deploy failure preserves saved state and publication can retry without another commit/RSS", async () => {
  let triggered = false;
  const { updateGoodreads, calls } = await setup({
    triggerDeploy: async () => ({ triggered }),
  });
  const result = await updateGoodreads("refresh");
  assert.equal(result.status, "saved");
  const before = calls.length;
  triggered = true;
  assert.equal((await updateGoodreads("publish")).status, "publishing");
  assert.deepEqual(calls.slice(before), ["auth"]);
});

test("rate limit stops authenticated request before network", async () => {
  const { updateGoodreads, calls } = await setup({ rateLimit: () => false });
  assert.equal((await updateGoodreads("refresh")).status, "error");
  assert.deepEqual(calls, ["auth"]);
});

test("double submit is blocked and a failed refresh releases the in-process guard", async () => {
  let release;
  const paused = new Promise((resolve) => {
    release = resolve;
  });
  const { updateGoodreads } = await setup({
    buildGoodreadsSnapshot: async () => {
      await paused;
      throw new Error("offline");
    },
  });
  const first = updateGoodreads("refresh");
  await new Promise((resolve) => setImmediate(resolve));
  assert.match((await updateGoodreads("refresh")).message, /en curso/);
  release();
  await first;
  assert.equal((await updateGoodreads("publish")).status, "publishing");
});

test("oversized serialized snapshot is rejected before commit or deploy", async () => {
  const { updateGoodreads, calls } = await setup({
    buildGoodreadsSnapshot: async () => ({ books: ["a".repeat(900_001)] }),
  });
  assert.equal((await updateGoodreads("refresh")).status, "error");
  assert.equal(
    calls.some((call) => Array.isArray(call) && call[0] === "commit"),
    false,
  );
  assert.equal(calls.includes("deploy"), false);
});

test("a rate-limited publication retry retains the retry control", async () => {
  const { updateGoodreads, calls } = await setup({ rateLimit: () => false });
  const result = await updateGoodreads("publish");
  assert.equal(result.status, "error");
  assert.equal(result.canPublish, true);
  assert.deepEqual(calls, ["auth"]);
});
