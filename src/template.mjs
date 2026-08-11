// Builds the production HTML that the renderer screenshots into README panels.
// Single source of truth for layout + styling (mirrors the approved mockup).

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function badge(b) {
  return `<span class="badge"><span class="k">${esc(b.k)}</span><span class="v ${esc(b.tone)}">${esc(b.v)}</span></span>`;
}

function tile(t, forge = false) {
  const badges = t.badges.map(badge).join("");
  return `<div class="tilewrap" id="tile-${esc(t.id)}"><div class="card notch${forge ? " forge" : ""}">
    <p class="ch"><span class="ld"></span> ${esc(t.name)}</p>
    <p class="cb">${esc(t.desc)}</p>
    <div class="bl">${badges}</div>
    <span class="cardlink">&#8599;</span>
  </div></div>`;
}

function kicker(id, label) {
  return `<div class="notchchip" id="${id}"><span class="n">//</span> ${esc(label)}</div>`;
}

export function buildHTML(p, stats, heatmapSvg) {
  const metrics = [
    { b: stats.commits.toLocaleString("en-US"), s: "commits" },
    { b: String(stats.prs), s: "pull requests" },
    { b: String(stats.issues), s: "issues" },
    { b: String(stats.repos), s: "repos" },
    { b: "MIT", s: "licensed" },
  ];
  const metricHTML = metrics.map((m) => `<div class="metric"><b>${esc(m.b)}</b><span>${esc(m.s)}</span></div>`).join("");
  const badgeHTML = p.badges.map(badge).join("");
  const langHTML = stats.languages.map((l) => `<i style="width:${l.pct}%;background:${l.color}"></i>`).join("");
  const legHTML = stats.languages.map((l) => `<span><i class="d" style="background:${l.color}"></i>${esc(l.name)} ${l.pct}%</span>`).join("");
  const capHTML = p.capabilities.map((c) => `<div class="cap"><div class="ct">${esc(c.title)}</div><div class="cd">${esc(c.body)}</div></div>`).join("");
  const workTiles = p.selectedWork.map((t) => tile(t, false)).join("");
  const forgeTiles = p.inTheForge.map((t) => tile(t, true)).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --red:#C52F3F; --red600:#A82833; --red700:#8F212B; --red50:#FBECEE;
    --ink900:#26263A; --ink700:#363650; --ink500:#4A4A66;
    --paper:#FAFAFB; --surface:#FFFFFF; --border:#E5E4EA; --muted:#5E5D6E;
    --dark:#22223A; --dark2:#2c2c46; --dmuted:#C9C8D6; --dmuted2:#9997AB; --dborder:#3a3a55;
    --ok:#2f9e5f;
    --display:'Space Grotesk','Segoe UI',system-ui,sans-serif;
    --body:'Inter','Segoe UI',system-ui,sans-serif;
    --mono:'JetBrains Mono',Consolas,monospace;
    --radius:3px; --radius-lg:4px;
  }
  *{box-sizing:border-box}
  body{margin:0;background:transparent;font-family:var(--body);color:var(--ink700);line-height:1.55;-webkit-font-smoothing:antialiased}
  .panel{width:880px}
  .full{width:880px}

  /* hero */
  #hero{padding:6px 4px 8px}
  .herorow{display:flex;gap:26px;flex-wrap:wrap;align-items:center;justify-content:center}
  .wm{width:140px;flex:none}
  .wm-dark{display:none}
  .hero-split{flex:1;min-width:270px;border-left:1px solid var(--border);padding-left:22px}
  .name{font-family:var(--display);color:var(--ink900);font-weight:600;font-size:16px;margin:0}
  .name .h{color:var(--muted);font-weight:500}
  .pitch{color:var(--muted);font-size:13.5px;margin:5px 0 0;max-width:58ch}

  /* interactive elements rendered as standalone images */
  .btn{font-family:var(--display);font-weight:600;font-size:13px;text-decoration:none;padding:7px 13px;border-radius:var(--radius);display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;width:max-content}
  .btn.primary{background:var(--red);color:#fff}
  .btn.outline{background:transparent;color:var(--ink700);border-color:var(--border)}
  .flink{font-family:var(--display);font-weight:500;font-size:13px;color:var(--ink700);text-decoration:none;display:inline-flex;align-items:center;gap:7px;padding-bottom:2px;width:max-content}
  .flink svg{width:16px;height:16px;color:var(--red);flex:none}
  .ctarow{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:16px 0 0}
  .linkrow{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
  .ctabtns{display:flex;gap:8px;align-items:center}
  .ctacell{padding:6px 2px}
  .badge2{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 14px;border-radius:var(--radius);font-family:var(--display);font-weight:500;font-size:13px;line-height:1;white-space:nowrap;text-decoration:none;width:max-content}
  .badge2 svg{width:15px;height:15px;flex:none}
  .b2-red{background:var(--red);color:#fff}
  .b2-ink{background:var(--ink700);color:#fff}
  .b2-ghost{background:#f2f2f5;color:var(--ink700);border:1px solid var(--border)}
  .b2-ghost svg{color:var(--red)}
  html[data-theme="dark"] .b2-ghost{background:#161b22;color:#c9d1d9;border-color:#30363d}

  /* dark stats band */
  .band{background:var(--dark);color:#fff;padding:18px 30px;border-radius:var(--radius-lg)}
  .metrics{display:flex;flex-wrap:wrap;border:1px solid var(--dborder);border-radius:var(--radius-lg);overflow:hidden;margin:0 0 16px}
  .metric{flex:1;min-width:96px;padding:12px 14px;border-right:1px solid var(--dborder);text-align:center}
  .metric:last-child{border-right:none}
  .metric b{font-family:var(--display);font-weight:600;color:#fff;font-size:21px;display:block;line-height:1.05}
  .metric span{font-family:var(--mono);font-size:10.5px;color:var(--dmuted2);text-transform:uppercase;letter-spacing:.06em}
  .badge{display:inline-flex;font-family:var(--mono);font-size:10.5px;line-height:1;border-radius:2px;overflow:hidden;vertical-align:middle}
  .badge .k{background:#44445e;color:#fff;padding:4px 7px;letter-spacing:.02em}
  .badge .v{padding:4px 7px;color:#fff;letter-spacing:.02em}
  .v.red{background:var(--red)} .v.ink{background:var(--ink700)} .v.ok{background:var(--ok)} .v.mit{background:#5a5a72} .v.ember{background:#8f212b}
  .brow{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
  .langbar{display:flex;height:9px;border-radius:2px;overflow:hidden;margin:0 0 8px;border:1px solid var(--dborder)}
  .langbar i{display:block;height:100%}
  .leg{display:flex;flex-wrap:wrap;gap:14px;font-family:var(--mono);font-size:11px;color:var(--dmuted)}
  .leg span{display:inline-flex;align-items:center;gap:6px}
  .leg .d{width:8px;height:8px;border-radius:2px;display:inline-block}
  .heat{margin-top:16px;border-top:1px solid var(--dborder);padding-top:14px}
  .heatlab{font-family:var(--mono);font-size:11px;color:var(--red);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
  .heat img,.heat svg{width:100%;height:auto;display:block}

  /* kickers */
  .notchchip{display:inline-flex;align-items:center;gap:7px;background:var(--ink900);color:#fff;font-family:var(--mono);font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;padding:5px 14px 5px 10px;clip-path:polygon(0 0,100% 0,100% 100%,9px 100%);width:max-content}
  .notchchip .n{color:var(--red)}

  /* capabilities */
  #cap{width:880px}
  .cap{display:flex;gap:14px;padding:10px 0;border-bottom:1px solid var(--border)}
  .cap:first-child{border-top:1px solid var(--border)}
  .cap .ct{font-family:var(--display);font-weight:600;color:var(--ink900);font-size:14px;min-width:180px}
  .cap .cd{color:var(--muted);font-size:13px}

  /* tiles */
  .tilewrap{width:440px;padding:5px 13px}
  .card{border:1px solid var(--border);border-radius:var(--radius-lg);padding:13px 14px 12px;background:var(--surface);position:relative;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%);display:flex;flex-direction:column;min-height:118px}
  .card.forge{min-height:150px}
  .card .ch{display:flex;align-items:center;gap:7px;font-family:var(--display);font-weight:600;color:var(--ink900);font-size:14.5px;margin:0 0 4px}
  .card .ch .ld{width:9px;height:9px;border-radius:50%;flex:none;background:var(--red)}
  .card .cb{color:var(--muted);font-size:12.5px;margin:0 0 9px;line-height:1.45}
  .card .bl{display:flex;flex-wrap:wrap;gap:5px;margin-top:auto}
  .cardlink{position:absolute;top:12px;right:12px;color:var(--muted);font-size:14px}

  /* support + footer */
  #support{width:880px;padding:4px}
  .support{border:1px dashed var(--border);border-radius:var(--radius-lg);padding:13px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#fcfcfd}
  .support p{margin:0;font-size:13px;color:var(--muted);flex:1;min-width:230px}
  .footer{background:var(--dark);color:#fff;padding:18px 30px;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;border-radius:var(--radius-lg)}
  .footer img{height:24px}
  .fb-dark{display:none}
  html[data-theme="dark"] .fb-light{display:none}
  html[data-theme="dark"] .fb-dark{display:block}
  .footer .fmeta{color:var(--dmuted2);font-family:var(--mono);font-size:11px}
  .footer .fsoc{margin-left:auto;display:flex;gap:14px}
  .footer .fsoc span{color:var(--dmuted);font-size:12.5px;font-family:var(--mono)}

  /* dark theme (GitHub dark surfaces) */
  html[data-theme="dark"] .wm-light{display:none}
  html[data-theme="dark"] .wm-dark{display:block}
  html[data-theme="dark"] .name{color:#e6edf3}
  html[data-theme="dark"] .name .h{color:#8b949e}
  html[data-theme="dark"] .pitch{color:#9aa4af}
  html[data-theme="dark"] .hero-split{border-left-color:#30363d}
  html[data-theme="dark"] .flink{color:#c9d1d9}
  html[data-theme="dark"] .btn.outline{color:#c9d1d9;border-color:#30363d}
  html[data-theme="dark"] .cap{border-color:#30363d}
  html[data-theme="dark"] .cap .ct{color:#e6edf3}
  html[data-theme="dark"] .cap .cd{color:#9aa4af}
  html[data-theme="dark"] .card{background:#0d1117;border-color:#30363d}
  html[data-theme="dark"] .card .ch{color:#e6edf3}
  html[data-theme="dark"] .card .cb{color:#9aa4af}
  html[data-theme="dark"] .support{background:#0d1117;border-color:#30363d}
  html[data-theme="dark"] .support p{color:#9aa4af}

  /* layout wrapper only for on-screen debugging; each element captured individually */
  .stack{display:flex;flex-direction:column;gap:20px;align-items:flex-start;padding:20px}
</style>
</head>
<body>
<div class="stack">

  <div id="herotext" class="hero-split" style="width:560px;border-left:none;padding-left:0">
    <p class="name">I'm ${esc(p.name)} <span class="h">— building as</span> ${esc(p.brand)} <span class="h">(</span>@${esc(p.handle)}<span class="h">)</span></p>
    <p class="pitch">${esc(p.pitch)}</p>
  </div>

  <!-- CTA elements captured individually, wrapped in real links in the README -->
  <div class="ctacell" id="bdg-web"><a class="badge2 b2-ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>daftforge.com</a></div>
  <div class="ctacell" id="bdg-email"><a class="badge2 b2-ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>Email</a></div>
  <div class="ctacell" id="bdg-linkedin"><a class="badge2 b2-ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>in/james-baker</a></div>
  <div class="ctacell" id="bdg-work"><a class="badge2 b2-red">Work with me</a></div>
  <div class="ctacell" id="bdg-call"><a class="badge2 b2-ink">Book a call</a></div>

  <div id="stats" class="band panel">
    <div class="metrics">${metricHTML}</div>
    <div class="brow">${badgeHTML}</div>
    <div class="langbar">${langHTML}</div>
    <div class="leg">${legHTML}</div>
    <div class="heat">
      <div class="heatlab">// forge heat &middot; ${stats.totalContributions.toLocaleString("en-US")} contributions this year</div>
      ${heatmapSvg}
    </div>
  </div>

  ${kicker("k01", "01 · what i build")}
  <div id="cap">${capHTML}</div>

  ${kicker("k02", "02 · selected work")}
  ${workTiles}

  ${kicker("k03", "03 · in the forge")}
  ${forgeTiles}

  ${kicker("k04", "04 · support the open tools")}
  <div id="support" class="panel"><div class="support"><p>${esc(p.support.line)}</p><a class="btn primary">${esc(p.support.cta)}</a></div></div>


</div>
</body>
</html>`;
}
