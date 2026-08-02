// Renders the "forge heat" contribution heatmap as an inline SVG string.
// Standard full-year layout, forge-heat ramp, "forge lit" marker at first activity.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const EMPTY = "#2b2b45";
const RAMP = ["#5c2130", "#8f212b", "#c52f3f", "#e8562f", "#ff8c42"];
function heat(c) {
  if (c <= 0) return EMPTY;
  if (c <= 4) return RAMP[0];
  if (c <= 12) return RAMP[1];
  if (c <= 29) return RAMP[2];
  if (c <= 59) return RAMP[3];
  return RAMP[4];
}
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function buildHeatmap() {
  const cal = JSON.parse(readFileSync(join(root, "data/calendar.json"), "utf8"));
  const weeks = cal.weeks;
  const CELL = 11, GAP = 3, R = 2, TOP = 18, LEFT = 30;
  const cols = weeks.length, rows = 7;
  const W = LEFT + cols * (CELL + GAP);
  const H = TOP + rows * (CELL + GAP) + 22;

  let cells = "", monthLabels = "", lastMonth = -1;
  weeks.forEach((w, x) => {
    const m = new Date(w.firstDay + "T00:00:00").getMonth();
    if (m !== lastMonth) { monthLabels += `<text x="${LEFT + x*(CELL+GAP)}" y="12" class="mlab">${MON[m]}</text>`; lastMonth = m; }
    w.contributionDays.forEach((d) => {
      const cx = LEFT + x*(CELL+GAP), cy = TOP + d.weekday*(CELL+GAP);
      const glow = d.contributionCount > 29 ? ' filter="url(#g)"' : "";
      cells += `<rect x="${cx}" y="${cy}" width="${CELL}" height="${CELL}" rx="${R}" fill="${heat(d.contributionCount)}"${glow}><title>${d.date}: ${d.contributionCount} contributions</title></rect>`;
    });
  });

  const wd = { 1: "Mon", 3: "Wed", 5: "Fri" };
  let wdLabels = "";
  for (const [y, l] of Object.entries(wd)) wdLabels += `<text x="0" y="${TOP + y*(CELL+GAP) + 10}" class="wlab">${l}</text>`;

  const legY = TOP + rows*(CELL+GAP) + 12;
  let legend = `<text x="${LEFT}" y="${legY+2}" class="wlab">cold</text>`;
  [EMPTY, ...RAMP].forEach((c, i) => { legend += `<rect x="${LEFT + 34 + i*(CELL+2)}" y="${legY-9}" width="${CELL-1}" height="${CELL-1}" rx="${R}" fill="${c}"/>`; });
  legend += `<text x="${LEFT + 34 + (RAMP.length+1)*(CELL+2) + 4}" y="${legY+2}" class="wlab">hot</text>`;

  const firstActive = weeks.findIndex((w) => w.contributionDays.some((d) => d.contributionCount > 0));
  let mark = "";
  if (firstActive >= 0) {
    const mx = LEFT + firstActive*(CELL+GAP) + CELL/2;
    mark = `<path d="M${mx-4} ${legY-2} L${mx+4} ${legY-2} L${mx} ${legY-9} Z" fill="#C52F3F"/><text x="${mx+8}" y="${legY+2}" class="flab">forge lit</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Contribution heatmap, ${cal.totalContributions} contributions this year">
<defs><filter id="g" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<style>.mlab{font:500 9px 'JetBrains Mono',monospace;fill:#9997ab;letter-spacing:.02em}.wlab{font:500 9px 'JetBrains Mono',monospace;fill:#9997ab}.flab{font:500 9px 'JetBrains Mono',monospace;fill:#C52F3F;letter-spacing:.03em}</style></defs>
${monthLabels}${wdLabels}${cells}${legend}${mark}
</svg>`;
}
