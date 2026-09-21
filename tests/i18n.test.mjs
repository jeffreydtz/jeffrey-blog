import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { translatedContent } from "../lib/i18n/content.mjs";
const require = createRequire(import.meta.url);
async function moduleUrl(file, replacements = {}) {
  let source = await fs.readFile(new URL(file, import.meta.url), "utf8");
  for (const [from, to] of Object.entries(replacements))
    source = source.replaceAll(from, to);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}
const routingUrl = await moduleUrl("../lib/i18n/routing.ts");
const { negotiateLocale, localizedPath, stripLocale } = await import(
  routingUrl
);
const serverUrl = pathToFileURL(require.resolve("next/server.js")).href;
const { NextRequest } = await import(serverUrl);
const replacements = {
  "@/lib/i18n/routing": routingUrl,
  '"next/server"': JSON.stringify(serverUrl),
};
const { middleware } = await import(
  await moduleUrl("../middleware.ts", replacements)
);
const { GET: setLanguage } = await import(
  await moduleUrl("../app/language/route.ts", replacements)
);

test("negotiation: regions, weights, ordering, unsupported languages and manual preference", () => {
  for (const [header, cookie, expected] of [
    ["en-US,en;q=0.9,es;q=0.8", undefined, "en"],
    ["en;q=.2,es-AR;q=.8", undefined, "es"],
    ["fr-FR, en-GB;q=.7", undefined, "en"],
    ["en;q=0,es;q=1", undefined, "es"],
    ["en;q=bad,es", undefined, "es"],
    ["es;q=.8,en;q=.8", undefined, "es"],
    ["de-DE", undefined, "es"],
    [null, undefined, "es"],
    ["en", "es", "es"],
    ["es", "en", "en"],
    ["en", "invalid", "en"],
  ])
    assert.equal(negotiateLocale(header, cookie), expected);
});

test("paths retain homepage and post queries/fragments without prefixing external or private destinations", () => {
  assert.equal(stripLocale("/en?q=hola#section"), "/?q=hola#section");
  assert.equal(localizedPath("/en?q=hola#section", "es"), "/es?q=hola#section");
  assert.equal(
    localizedPath("/es/posts/hello?q=x#section", "en"),
    "/en/posts/hello?q=x#section",
  );
  for (const p of [
    "/admin",
    "/api/reactions",
    "/rss.xml",
    "/feeds/en",
    "/cover.jpg",
    "//evil.example",
    "https://example.com",
  ])
    assert.equal(localizedPath(p, "en"), p);
});

test("legacy redirects are private, preserve queries; explicit prefix wins and spoofed headers are replaced", () => {
  const legacy = middleware(
    new NextRequest("https://blog.test/archivo?q=hola", {
      headers: { "accept-language": "en-US", cookie: "blog-language=es" },
    }),
  );
  assert.equal(legacy.status, 307);
  assert.equal(
    legacy.headers.get("location"),
    "https://blog.test/es/archivo?q=hola",
  );
  assert.equal(legacy.headers.get("cache-control"), "private, no-store");
  assert.match(legacy.headers.get("vary"), /Accept-Language/);
  const explicit = middleware(
    new NextRequest("https://blog.test/en/archivo?q=hola", {
      headers: {
        "accept-language": "es",
        cookie: "blog-language=es",
        "x-blog-locale": "es",
      },
    }),
  );
  assert.equal(
    explicit.headers.get("x-middleware-rewrite"),
    "https://blog.test/archivo?q=hola",
  );
  assert.equal(
    explicit.headers.get("x-middleware-request-x-blog-locale"),
    "en",
  );
  for (const p of [
    "/admin/now",
    "/api/admin/now-search",
    "/cover.jpg",
    "/rss.xml",
    "/feeds/en",
    "/en/admin/now",
    "/en/api/reactions",
  ]) {
    const response = middleware(
      new NextRequest(`https://blog.test${p}`, {
        headers: { "x-blog-locale": "en", "x-blog-path": "/en" },
      }),
    );
    assert.equal(response.headers.get("location"), null, p);
    assert.equal(response.headers.get("x-middleware-rewrite"), null, p);
    assert.equal(
      response.headers.get("x-middleware-request-x-blog-locale"),
      null,
      p,
    );
  }
});

test("manual and automatic preference works without JS, preserves destination and forbids open redirects", () => {
  const response = setLanguage(
    new NextRequest(
      "https://blog.test/language?locale=en&next=" +
        encodeURIComponent("/es?term=abc#intro"),
    ),
  );
  assert.equal(
    response.headers.get("location"),
    "https://blog.test/en?term=abc#intro",
  );
  assert.match(response.headers.get("set-cookie"), /blog-language=en/);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  const auto = setLanguage(
    new NextRequest("https://blog.test/language?locale=auto&next=/es/vinyl", {
      headers: { "accept-language": "en-GB", cookie: "blog-language=es" },
    }),
  );
  assert.equal(auto.headers.get("location"), "https://blog.test/en/vinyl");
  assert.match(auto.headers.get("set-cookie"), /Max-Age=0/);
  for (const destination of [
    "//evil.test/",
    "https://evil.test/",
    "/admin",
    "/\\evil.test",
    "/en/../admin",
  ]) {
    const unsafe = setLanguage(
      new NextRequest(
        `https://blog.test/language?locale=en&next=${encodeURIComponent(destination)}`,
      ),
    );
    assert.equal(
      unsafe.headers.get("location"),
      "https://blog.test/en",
      destination,
    );
  }
});

test("translation is invalidated by source edits and mismatched identity or draft state", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "blog-translation-"));
  try {
    const dir = path.join(root, "content/translations/en/posts");
    await fs.mkdir(dir, { recursive: true });
    const source = "Original body";
    const hash = createHash("sha256").update(source).digest("hex");
    const translation = `---\nsource_hash: ${hash}\nslug: example\nlang: en\ntitle: Example\nexcerpt: Example excerpt\n---\nEnglish body`;
    const file = path.join(dir, "example.mdx");
    await fs.writeFile(file, translation);
    assert.equal(
      translatedContent(source, "posts", "example", "en", root)?.content.trim(),
      "English body",
    );
    assert.equal(
      translatedContent(source + " edit", "posts", "example", "en", root),
      null,
    );
    for (const invalid of [
      translation.replace("lang: en", "lang: es"),
      translation.replace("slug: example", "slug: other"),
      translation.replace("title: Example", "draft: true\ntitle: Example"),
    ]) {
      await fs.writeFile(file, invalid);
      assert.equal(
        translatedContent(source, "posts", "example", "en", root),
        null,
      );
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("published source controls translation lifecycle: edit, draft, delete, rename and locale cache isolation", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "blog-posts-"));
  const previousCwd = process.cwd();
  const previousEnvironment = process.env.NODE_ENV;
  try {
    await fs.mkdir(path.join(root, "content/posts"), { recursive: true });
    await fs.mkdir(path.join(root, "content/translations/en/posts"), {
      recursive: true,
    });
    const original = `---\ntitle: Original\nslug: example\nexcerpt: Extracto\nlang: es\npublished_at: 2026-01-01\ntags: [Example]\n---\nOriginal body`;
    const sourceFile = path.join(root, "content/posts/example.mdx");
    await fs.writeFile(sourceFile, original);
    await fs.writeFile(
      path.join(root, "content/translations/en/posts/example.mdx"),
      `---\nsource_hash: ${createHash("sha256").update(original).digest("hex")}\nslug: example\ntitle: Translation\nexcerpt: English excerpt\nlang: en\npublished_at: 2030-01-01\n---\nEnglish body`,
    );
    const readingUrl = await moduleUrl("../lib/reading-time.ts");
    const postsUrl = await moduleUrl("../lib/posts.ts", {
      'import "server-only";': "",
      "@/lib/i18n/content.mjs": new URL(
        "../lib/i18n/content.mjs",
        import.meta.url,
      ).href,
      "@/lib/reading-time": readingUrl,
      '"gray-matter"': JSON.stringify(
        pathToFileURL(require.resolve("gray-matter")).href,
      ),
    });
    process.chdir(root);
    process.env.NODE_ENV = "test";
    const { getAllPosts } = await import(postsUrl);
    assert.equal(getAllPosts("en")[0].title, "Translation");
    assert.equal(getAllPosts("es")[0].title, "Original");
    assert.equal(
      getAllPosts("en")[0].published_at,
      "2026-01-01",
      "translation cannot invent publication dates",
    );
    await fs.writeFile(
      sourceFile,
      original.replace("Original body", "Edited body"),
    );
    assert.equal(getAllPosts("en")[0].lang, "es");
    assert.equal(getAllPosts("en")[0].content.trim(), "Edited body");
    await fs.writeFile(
      sourceFile,
      original.replace("title: Original", "draft: true\ntitle: Original"),
    );
    assert.deepEqual(getAllPosts("en"), []);
    await fs.rm(sourceFile);
    assert.deepEqual(
      getAllPosts("en"),
      [],
      "orphaned translation cannot publish a deleted post",
    );
    await fs.writeFile(
      sourceFile,
      original.replace("slug: example", "slug: renamed"),
    );
    assert.equal(getAllPosts("en")[0].lang, "es");
    assert.equal(getAllPosts("en")[0].slug, "renamed");
  } finally {
    process.chdir(previousCwd);
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("legacy RSS keeps subscription identifiers while new feeds use localized IDs", async () => {
  const stubPosts = `data:text/javascript,${encodeURIComponent('export function getAllPosts(){return [{slug:"example",lang:"es",title:"Example",excerpt:"Excerpt",published_at:"2026-01-01",tags:[]}]}')}`;
  const site = `data:text/javascript,${encodeURIComponent('export const SITE={url:"https://blog.test",name:"Blog",description:"Description"}')}`;
  const dict = `data:text/javascript,${encodeURIComponent('export function getDictionary(){return {siteDescription:"Description"}}')}`;
  const { rssResponse } = await import(
    await moduleUrl("../lib/rss.ts", {
      "@/lib/posts": stubPosts,
      "@/lib/site": site,
      "@/lib/i18n/dictionary": dict,
    })
  );
  const legacy = await rssResponse("es", true).text();
  assert.match(
    legacy,
    /<guid isPermaLink="true">https:\/\/blog.test\/posts\/example<\/guid>/,
  );
  assert.match(legacy, /atom:link href="https:\/\/blog.test\/rss.xml"/);
  assert.match(legacy, /<link>https:\/\/blog.test\/es\/posts\/example<\/link>/);
  const englishFallback = await rssResponse("en").text();
  assert.match(
    englishFallback,
    /<guid isPermaLink="true">https:\/\/blog.test\/en\/posts\/example<\/guid>/,
  );
  const modern = await rssResponse("es").text();
  assert.match(
    modern,
    /<guid isPermaLink="true">https:\/\/blog.test\/es\/posts\/example<\/guid>/,
  );
  assert.match(modern, /atom:link href="https:\/\/blog.test\/feeds\/es"/);
});
