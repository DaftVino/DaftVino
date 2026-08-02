// Dev-only: renders README.md's HTML to preview PNGs (light + dark) to eyeball assembly.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const md = readFileSync(join(root, "README.md"), "utf8");

function page(bg, note) {
  return `<!doctype html><meta charset="utf-8"><body style="margin:0;background:${bg}">
  <div style="max-width:900px;margin:0 auto;padding:24px 16px">${md}</div></body>`;
}

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--force-device-scale-factor=2"] });
for (const [name, bg, scheme] of [["preview-light", "#ffffff", "light"], ["preview-dark", "#0d1117", "dark"]]) {
  const p = await browser.newPage();
  await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
  await p.setViewport({ width: 940, height: 1400, deviceScaleFactor: 2 });
  writeFileSync(join(root, ".preview.html"), page(bg));
  await p.goto(pathToFileURL(join(root, ".preview.html")).href, { waitUntil: "networkidle0" });
  await p.screenshot({ path: join(root, `.${name}.png`), fullPage: true });
  await p.close();
  console.log(name, "done");
}
await browser.close();
