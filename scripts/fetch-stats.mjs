// Fetches live GitHub stats -> data/stats.json (+ data/calendar.json).
// Auth: process.env.GITHUB_TOKEN (or GH_TOKEN). Falls back to existing files on failure.
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const LOGIN = "DaftVino";
const TOKEN = process.env.STATS_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

// language bar colours (rank order) — tuned to read on the dark stats band
const LANG_COLORS = ["#C52F3F", "#7a7a99", "#9a9ab2", "#c9c8d6"];

const QUERY = `query($login:String!){
  user(login:$login){
    contributionsCollection{
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalRepositoriesWithContributedCommits
      contributionCalendar{ totalContributions weeks{ firstDay contributionDays{ date contributionCount weekday } } }
    }
    repositories(privacy:PUBLIC, first:100, ownerAffiliations:OWNER, isFork:false){
      nodes{ name languages(first:10){ edges{ size node{ name } } } } }
  }
}`;

async function main() {
  if (!TOKEN) {
    console.warn("No GITHUB_TOKEN — keeping existing data/stats.json");
    if (!existsSync(join(root, "data/stats.json"))) throw new Error("no token and no cached stats");
    return;
  }
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const u = json.data.user;
  const cc = u.contributionsCollection;

  // aggregate languages across public repos (byte-weighted)
  const totals = {};
  for (const repo of u.repositories.nodes) {
    for (const e of repo.languages.edges) totals[e.node.name] = (totals[e.node.name] || 0) + e.size;
  }
  const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const languages = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, size], i) => ({ name, pct: Math.round((size / grand) * 100), color: LANG_COLORS[i] || "#c9c8d6" }));

  const stats = {
    commits: cc.totalCommitContributions,
    prs: cc.totalPullRequestContributions,
    issues: cc.totalIssueContributions,
    repos: cc.totalRepositoriesWithContributedCommits,
    totalContributions: cc.contributionCalendar.totalContributions,
    languages,
    updated: process.env.BUILD_DATE || "",
  };

  writeFileSync(join(root, "data/stats.json"), JSON.stringify(stats, null, 2));
  writeFileSync(join(root, "data/calendar.json"), JSON.stringify(cc.contributionCalendar, null, 2));
  console.log("stats:", stats.commits, "commits /", stats.prs, "PRs /", stats.issues, "issues | langs:", languages.map((l) => `${l.name} ${l.pct}%`).join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });
