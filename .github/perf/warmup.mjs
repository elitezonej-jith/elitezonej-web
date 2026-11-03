// Warm the /api/img resizer before Lighthouse runs (used by the Lighthouse CI
// workflow). In production Vercel's CDN serves resized images from cache; a
// bare `next start` would otherwise resize every image during the first
// measurement, on the same CPU as the browser, and skew the score.
// Usage: node .github/perf/warmup.mjs http://localhost:3100 / /collection?c=men ...
const [base, ...paths] = process.argv.slice(2);
if (!base || paths.length === 0) {
  console.error("usage: node .github/perf/warmup.mjs <baseUrl> <path> [path...]");
  process.exit(2);
}
const urls = new Set();
for (const p of paths) {
  const html = await (await fetch(base + p)).text();
  for (const m of html.matchAll(/\/api\/img\?[^"'\s,]+/g)) urls.add(m[0].replaceAll("&amp;", "&"));
}
let ok = 0;
for (const u of urls) {
  const r = await fetch(base + u);
  await r.arrayBuffer();
  if (r.ok) ok++;
}
console.log(`warmed ${ok}/${urls.size} image variants for ${paths.length} pages`);
