// Renders README.md the way GitHub actually does: GitHub Markdown API -> HTML,
// styled with github-markdown-css. Screenshots light + dark. Dev-only verification.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const md = readFileSync(join(root, "README.md"), "utf8");

const res = await fetch("https://api.github.com/markdown", {
  method: "POST",
  headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ text: md, mode: "gfm", context: "DaftVino/DaftVino" }),
});
const bodyHtml = await res.text();
if (!res.ok) { console.error("markdown API failed", res.status, bodyHtml.slice(0, 300)); process.exit(1); }

function page(scheme) {
  const canvas = scheme === "dark" ? "#0d1117" : "#ffffff";
  return `<!doctype html><html data-color-mode="${scheme}" data-light-theme="light" data-dark-theme="dark"><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.css"></head>
  <body style="margin:0;background:${canvas}">
  <article class="markdown-body" style="max-width:900px;margin:0 auto;padding:32px 24px;background:${canvas}">
  ${bodyHtml}
  </article></body></html>`;
}

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--force-device-scale-factor=2"] });
for (const scheme of ["light", "dark"]) {
  const p = await browser.newPage();
  await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
  await p.setViewport({ width: 940, height: 1400, deviceScaleFactor: 2 });
  writeFileSync(join(root, ".gh.html"), page(scheme));
  await p.goto(pathToFileURL(join(root, ".gh.html")).href, { waitUntil: "networkidle0" });
  await p.screenshot({ path: join(root, `.gh-${scheme}.png`), fullPage: true });
  await p.close();
  console.log("gh-" + scheme, "done");
}
await browser.close();
