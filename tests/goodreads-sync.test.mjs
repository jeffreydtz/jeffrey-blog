import test from "node:test";
import assert from "node:assert/strict";
import { buildGoodreadsSnapshot } from "../lib/goodreads-sync.mjs";

const config = {
  profileUrl: "https://www.goodreads.com/user/show/123-test",
  shelves: ["read", "currently-reading"],
};
const item = (id, cover = true) =>
  `<item><book_id>${id}</book_id><title>Book ${id}</title><author_name>Author</author_name><link>https://www.goodreads.com/review/show/${id}</link><description><![CDATA[<a href="https://www.goodreads.com/book/show/${id}">Book</a>]]></description><user_rating>4</user_rating>${cover ? `<book_large_image_url>https://i.gr-assets.com/books/${id}.jpg</book_large_image_url>` : ""}</item>`;
const feed = (shelf, items = "", user = "123") =>
  `<rss version="2.0"><channel><link><![CDATA[https://www.goodreads.com/review/list_rss/${user}?shelf=${shelf}]]></link>${items}</channel></rss>`;
function source(read, current, calls = []) {
  return async (url, init) => {
    calls.push({ url: String(url), init });
    const shelf = url.searchParams.get("shelf");
    return new Response(
      feed(
        shelf,
        url.searchParams.get("page") === "1"
          ? shelf === "read"
            ? read
            : current
          : "",
      ),
    );
  };
}

test("shared sync paginates both shelves and keeps Leído and current order independent", async () => {
  const calls = [];
  const snapshot = await buildGoodreadsSnapshot(config, {
    fetchImpl: source(item(1), item(2) + item(3), calls),
  });
  assert.deepEqual(
    snapshot.books.map((b) => b.id),
    ["1"],
  );
  assert.deepEqual(
    snapshot.currentlyReading.map((b) => b.id),
    ["2", "3"],
  );
  assert.equal(calls.length, 4);
  for (const { url, init } of calls) {
    assert.equal(new URL(url).hostname, "www.goodreads.com");
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal);
  }
});

test("empty currently-reading is valid and does not borrow read books", async () => {
  const snapshot = await buildGoodreadsSnapshot(config, {
    fetchImpl: source(item(1), ""),
  });
  assert.deepEqual(snapshot.currentlyReading, []);
  assert.equal(snapshot.books.length, 1);
});

test("Open Library fallback applies only to read books and failure stays optional", async () => {
  const rss = source(item(1, false), item(2, false));
  let covers = 0;
  const fetchImpl = async (url, init) => {
    if (url.hostname === "openlibrary.org") {
      covers++;
      return new Response(JSON.stringify({ docs: [{ cover_i: 42 }] }));
    }
    return rss(url, init);
  };
  const snapshot = await buildGoodreadsSnapshot(config, { fetchImpl });
  assert.equal(
    snapshot.books[0].coverUrl,
    "https://covers.openlibrary.org/b/id/42-L.jpg",
  );
  assert.equal(snapshot.currentlyReading[0].coverUrl, undefined);
  assert.equal(covers, 1);
  const noCover = await buildGoodreadsSnapshot(config, {
    fetchImpl: async (url, init) => {
      if (url.hostname === "openlibrary.org") throw new Error("offline");
      return rss(url, init);
    },
  });
  assert.equal(noCover.books.length, 1);
  assert.equal(noCover.books[0].coverUrl, undefined);
});

test("invalid config cannot fetch arbitrary hosts or additional shelves", async () => {
  for (const bad of [
    { ...config, profileUrl: "https://evil.test/user/show/123" },
    { ...config, profileUrl: "https://www.goodreads.com:444/user/show/123" },
    { ...config, shelves: ["read"] },
    { ...config, shelves: ["read", "read"] },
  ]) {
    await assert.rejects(
      buildGoodreadsSnapshot(bad, {
        fetchImpl: () => assert.fail("must not fetch"),
      }),
    );
  }
});

test("a bad second shelf rejects the complete snapshot and cancels sibling requests", async () => {
  let signal;
  await assert.rejects(
    buildGoodreadsSnapshot(config, {
      fetchImpl: async (url, init) => {
        signal = init.signal;
        return new Response(
          url.searchParams.get("shelf") === "read"
            ? feed("read", item(1))
            : "<html>Login</html>",
        );
      },
    }),
  );
  assert.equal(signal.aborted, true);
});

test("wrong profile, HTTP error and redirects reject before producing a snapshot", async () => {
  for (const response of [
    new Response(feed("read", "", "999")),
    new Response("denied", { status: 403 }),
    new Response("", { status: 302 }),
  ]) {
    await assert.rejects(
      buildGoodreadsSnapshot(config, {
        fetchImpl: async () => response.clone(),
      }),
    );
  }
});

test("stream size cap cancels a body even without content-length", async () => {
  let cancelled = 0;
  await assert.rejects(
    buildGoodreadsSnapshot(config, {
      fetchImpl: async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(2_000_001));
            },
            cancel() {
              cancelled++;
            },
          }),
        ),
    }),
  );
  assert.ok(cancelled > 0);
});

test("abort/deadline preserves the prior snapshot by failing the builder", async () => {
  const signal = AbortSignal.abort();
  await assert.rejects(
    buildGoodreadsSnapshot(config, {
      signal,
      fetchImpl: () => assert.fail("must not fetch"),
    }),
  );
});

test("repeated final RSS page terminates but full pagination limit fails closed", async () => {
  const repeated = await buildGoodreadsSnapshot(config, {
    fetchImpl: async (url) =>
      new Response(feed(url.searchParams.get("shelf"), item(1))),
  });
  assert.equal(repeated.books.length, 1);
  let count = 0;
  await assert.rejects(
    buildGoodreadsSnapshot(config, {
      fetchImpl: async (url) => {
        count++;
        return new Response(
          feed(
            url.searchParams.get("shelf"),
            item(Number(url.searchParams.get("page"))),
          ),
        );
      },
    }),
    /pagination limit/,
  );
  assert.ok(count <= 40);
});
