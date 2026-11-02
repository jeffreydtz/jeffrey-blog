import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

async function loadSequence() {
  const source = await fs.readFile(
    new URL("../lib/keep-going-sequence.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
  return import(moduleUrl);
}

const { KEEP_GOING_SEQUENCE, advanceSequence, keyToStep, swipeDirection } =
  await loadSequence();

test("↑ → ↑ → completes; wrong keys and idle-style restarts reset the index", () => {
  let index = 0;
  for (const key of ["ArrowUp", "ArrowRight", "ArrowUp", "ArrowRight"]) {
    index = advanceSequence(index, keyToStep(key));
  }
  assert.equal(index, KEEP_GOING_SEQUENCE.length);

  assert.equal(advanceSequence(0, "right"), 0);
  assert.equal(advanceSequence(1, "up"), 1, "a new ↑ after a lone ↑ restarts");
  assert.equal(advanceSequence(2, "down"), 0);
  assert.equal(advanceSequence(0, keyToStep("a") ?? "a"), 0);
});

test("swipe helper maps finger movement to the same four directions", () => {
  assert.equal(swipeDirection(0, -80), "up");
  assert.equal(swipeDirection(80, 0), "right");
  assert.equal(swipeDirection(0, 80), "down");
  assert.equal(swipeDirection(-80, 0), "left");
  assert.equal(swipeDirection(10, -10), null);
});

test("gallery ships stills and videos, skipping ads, 14 (duplicate) and 24 (404)", async () => {
  const dir = new URL("../public/keep-going/", import.meta.url);
  const files = await fs.readdir(dir);
  const images = files.filter(
    (name) => name.endsWith(".webp") && !name.includes("-poster"),
  );
  const posters = files.filter((name) => name.endsWith("-poster.webp"));
  const videos = files.filter((name) => name.endsWith(".mp4"));

  assert.equal(images.length, 56);
  assert.equal(videos.length, 2);
  assert.equal(posters.length, 2);
  assert.ok(images.includes("1.webp"));
  assert.ok(images.includes("16.webp"));
  assert.ok(images.includes("19.webp"));
  assert.ok(!images.includes("14.webp"));
  assert.ok(!images.includes("24.webp"));
  assert.ok(videos.includes("59.mp4"));
  assert.ok(videos.includes("60.mp4"));
  assert.equal(
    files.some((name) => name.startsWith("ad-") || name.includes("og-")),
    false,
  );

  const animated = await fs.readFile(new URL("19.webp", dir));
  assert.ok(animated.includes("ANIM"), "19.webp stays an animated webp");
});

test("keep-going stays off nav, palette, sitemap and is noindexed", async () => {
  const root = new URL("../", import.meta.url);
  const files = {
    sitemap: await fs.readFile(new URL("app/sitemap.ts", root), "utf8"),
    header: await fs.readFile(
      new URL("components/ui/SiteHeader.tsx", root),
      "utf8",
    ),
    palette: await fs.readFile(
      new URL("components/ui/CommandPalette.tsx", root),
      "utf8",
    ),
    page: await fs.readFile(new URL("app/keep-going/page.tsx", root), "utf8"),
    routing: await fs.readFile(new URL("lib/i18n/routing.ts", root), "utf8"),
  };

  assert.doesNotMatch(files.sitemap, /["']\/keep-going["']/);
  assert.doesNotMatch(files.header, /keep-going/);
  assert.doesNotMatch(files.palette, /keep-going/);
  assert.match(files.page, /index:\s*false/);
  assert.doesNotMatch(
    files.routing,
    /keep-going/,
    "hidden route is not a localized public path",
  );
});

test("keep-going media files are non-empty webp/mp4", async () => {
  const dir = path.join(process.cwd(), "public", "keep-going");
  const files = await fs.readdir(dir);
  assert.ok(files.length >= 60);
  for (const name of files) {
    const stat = await fs.stat(path.join(dir, name));
    assert.ok(stat.size > 1000, name);
  }
});
