// Tell Bing / Yandex / Seznam (IndexNow) about every URL in the live sitemap.
// ChatGPT search and Copilot use Bing's index, so this gets new and changed
// pages into AI search quickly. Run after a deploy that changes many pages:
//   node .github/perf/indexnow.mjs
// The key file must be live at https://elitezonej.com/<key>.txt (public/).
import { readdirSync, readFileSync } from "node:fs";

const HOST = "elitezonej.com";
const keyFile = readdirSync("public").find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("No IndexNow key file in public/");
const key = readFileSync(`public/${keyFile}`, "utf8").trim();

const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replaceAll("&amp;", "&"));

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList: urls }),
});
console.log(`IndexNow: submitted ${urls.length} URLs -> HTTP ${res.status}`);
