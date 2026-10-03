/**
 * Renders `docs/iconography/iconography.ts` as `docs/iconography/index.html`.
 *
 * Glyphs are inlined from `lucide-static` and, for the `was` column, from `@mui/icons-material`, so
 * the page is self-contained. A Lucide name that does not exist fails the run rather than leaving a
 * blank in the document.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import {
  type AppFunction,
  areas,
  designRules,
  openQuestions,
} from "../../docs/iconography/iconography";
import {
  type Concept,
  type ConceptKey,
  concepts,
  type Glyph,
  moleculeNode,
  type Status,
  strokeWidth,
} from "../../src/components/iconConcepts";

const require = createRequire(import.meta.url);
const lucideIcons = path.join(path.dirname(require.resolve("lucide-static")), "../../icons");
const muiIcons = path.dirname(require.resolve("@mui/icons-material/package.json"));
const muiInternalIcons = path.join(
  path.dirname(require.resolve("@mui/material/package.json")),
  "internal/svg-icons",
);
const output = path.join(import.meta.dirname, "../../docs/iconography/index.html");

const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const slug = (text: string) =>
  text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");

/** The custom molecule glyph, as markup: the same shapes the application draws. */
const moleculeSvg = moleculeNode
  .map(
    ([tag, attributes]) =>
      `<${tag} ${Object.entries(attributes)
        .filter(([key]) => key !== "key")
        // The molecule's attributes are all path data and coordinates, written as strings.
        .map(([key, value]) => `${key}="${value as string}"`)
        .join(" ")}/>`,
  )
  .join("");

const lucideSvg = (name: string, size = 24) => {
  const inner =
    (name === "molecule" ? moleculeSvg : undefined) ??
    readFileSync(path.join(lucideIcons, `${name}.svg`), "utf8")
      .replace(/^[\s\S]*?<svg[^>]*>/u, "")
      .replace(/<\/svg>\s*$/u, "");
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${(strokeWidth * 24) / size}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
};

/** A Material icon's paths, read from the icon module's source. */
const muiSvg = (name: string) => {
  let source: string;
  try {
    source = readFileSync(path.join(muiIcons, `${name}.js`), "utf8");
  } catch {
    source = readFileSync(path.join(muiInternalIcons, `${name}.js`), "utf8");
  }
  const shapes = [...source.matchAll(/\("(path|circle|ellipse|rect)",\s*\{([^}]*)\}/gu)].map(
    ([, tag, props]) =>
      `<${tag} ${[...props.matchAll(/(\w+):\s*"([^"]*)"/gu)].map(([, key, value]) => `${key}="${value}"`).join(" ")}/>`,
  );
  return `<svg class="mui" viewBox="0 0 24 24" aria-hidden="true">${shapes.join("")}</svg>`;
};

const glyphName = (glyph: Glyph) => (typeof glyph === "string" ? glyph : "coloured dot");

const glyphHtml = (glyph: Glyph, size = 24) =>
  typeof glyph === "string"
    ? `<span class="g" title="${escape(glyph)}">${lucideSvg(glyph, size)}</span>`
    : `<span class="g" title="coloured dot, no icon"><span class="dot" style="background:${glyph.dot}"></span></span>`;

const statusLabels: Record<Status, string> = {
  decided: "Decided",
  open: "Open",
  proposed: "Proposed",
};
const statusBadge = (status: Status) =>
  `<span class="status ${status}">${statusLabels[status]}</span>`;

const conceptEntries = Object.entries(concepts) as [ConceptKey, Concept][];
const conceptOf = (key: ConceptKey): Concept => concepts[key];

// Which functions use each concept, and which Material icons it replaces.
const usedBy = new Map<ConceptKey, Set<string>>();
const replaces = new Map<ConceptKey, Set<string>>();
for (const area of areas) {
  for (const appFunction of area.functions) {
    for (const usage of appFunction.usages) {
      for (const key of [usage.concepts].flat()) {
        usedBy.set(key, (usedBy.get(key) ?? new Set()).add(appFunction.name));
        if (usage.was) {
          replaces.set(key, (replaces.get(key) ?? new Set()).add(usage.was));
        }
      }
    }
  }
}

const groups = [...new Set(conceptEntries.map(([, concept]) => concept.group))];

const vocabularyRows = groups
  .map(
    (group) =>
      `<tr class="grp"><th colspan="6">${escape(group)}</th></tr>${conceptEntries
        .filter(([, concept]) => concept.group === group)
        .map(([key, concept]) => {
          const was = [...(replaces.get(key) ?? [])];
          const alternatives = concept.alternatives ?? [];
          return `<tr id="c-${key}">
            <td><b>${escape(concept.label)}</b>${concept.note ? `<div class="note">${escape(concept.note)}</div>` : ""}</td>
            <td>${statusBadge(concept.status)}</td>
            <td class="new">${glyphHtml(concept.glyph)}${typeof concept.glyph === "string" ? glyphHtml(concept.glyph, 16) : ""}<br><code>${escape(glyphName(concept.glyph))}</code></td>
            <td>${was.length > 0 ? `${was.map((name) => `<span class="g" title="${name}">${muiSvg(name)}</span>`).join("")}<br><code>${was.join(", ")}</code>` : '<span class="none">none</span>'}</td>
            <td>${alternatives.map((name) => `<span class="alt">${glyphHtml(name)}<code>${escape(name)}</code></span>`).join("") || '<span class="none">—</span>'}</td>
            <td class="used">${[...(usedBy.get(key) ?? [])].map((name) => escape(name)).join(", ") || '<span class="none">unused</span>'}</td>
          </tr>`;
        })
        .join("")}`,
  )
  .join("");

const counts = { added: 0, high: 0, medium: 0, replaced: 0 };

const functionHtml = (appFunction: AppFunction) => `
  <article class="fn" id="${slug(appFunction.name)}">
    <h3>${escape(appFunction.name)}</h3>
    <div class="where"><span class="label">Appears on</span><ul>${appFunction.pages.map((page) => `<li>${escape(page)}</li>`).join("")}</ul></div>
    <table class="cmp">
      <thead><tr><th>Element</th><th>Before (Material)</th><th></th><th>Icon (Lucide)</th><th>Change</th></tr></thead>
      <tbody>${appFunction.usages
        .map((usage) => {
          const keys = [usage.concepts].flat();
          let change: string;
          if (keys.every((key) => typeof conceptOf(key).glyph !== "string")) {
            change = '<span class="tag keep">No icon</span>';
          } else if (usage.was) {
            counts.replaced++;
            change = '<span class="tag replace">Replace</span>';
          } else if (usage.priority) {
            counts[usage.priority]++;
            change = `<span class="tag ${usage.priority}">Add · ${usage.priority === "high" ? "High" : "Medium"}</span>`;
          } else {
            counts.added++;
            change = '<span class="tag added">New</span>';
          }
          return `<tr>
            <td>${escape(usage.element)}</td>
            <td class="old">${usage.was ? `<span class="g" title="${usage.was}">${muiSvg(usage.was)}</span><code>${escape(usage.was)}</code>` : '<span class="none">no icon</span>'}</td>
            <td class="arrow">→</td>
            <td class="new">${keys.map((key) => `<a class="pick" href="#c-${key}">${glyphHtml(conceptOf(key).glyph)}<span>${escape(conceptOf(key).label)}</span></a>`).join("")}</td>
            <td>${change}</td>
          </tr>`;
        })
        .join("")}</tbody>
    </table>
  </article>`;

const sections = areas
  .map(
    (area) =>
      `<section><h2 id="${slug(area.title)}">${escape(area.title)}</h2>${area.functions.map((appFunction) => functionHtml(appFunction)).join("")}</section>`,
  )
  .join("");

const statusCounts = Object.fromEntries(
  (["decided", "proposed", "open"] as const).map((status) => [
    status,
    conceptEntries.filter(([, concept]) => concept.status === status).length,
  ]),
);
const functionCount = areas.reduce((total, area) => total + area.functions.length, 0);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Data Manager UI — iconography</title>
<style>
  :root { --fg:#1d1d1f; --muted:#5f6368; --line:#e3e3e3; --bg:#fafafa; --card:#fff; --accent:#1976d2;
          --high:#c62828; --med:#ef6c00; --rep:#455a64; --newbg:#f1f8e9; --ok:#2e7d32; --open:#6a1b9a; }
  @media (prefers-color-scheme: dark) {
    :root { --fg:#e8e8e8; --muted:#a0a0a0; --line:#333; --bg:#121212; --card:#1c1c1c; --accent:#90caf9; --newbg:#1e2a1a; --ok:#81c784; --open:#ce93d8; }
  }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:var(--fg); background:var(--bg); }
  .wrap { display:grid; grid-template-columns:250px 1fr; max-width:1500px; margin:0 auto; }
  nav { position:sticky; top:0; height:100vh; overflow:auto; padding:24px 16px; border-right:1px solid var(--line); font-size:13px; }
  nav a { color:inherit; text-decoration:none; display:block; padding:2px 0; }
  nav a:hover { color:var(--accent); }
  nav .area { font-weight:700; margin-top:12px; }
  nav .sub { padding-left:10px; color:var(--muted); }
  main { padding:32px 40px 80px; min-width:0; }
  h1 { margin:0 0 4px; font-size:28px; }
  h2 { margin:48px 0 8px; font-size:22px; border-bottom:2px solid var(--line); padding-bottom:6px; }
  h3 { margin:0 0 6px; font-size:17px; }
  .lede { color:var(--muted); max-width:85ch; }
  .stats { display:flex; gap:12px; flex-wrap:wrap; margin:20px 0; }
  .stat { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:10px 14px; }
  .stat b { display:block; font-size:22px; }
  .fn { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:16px 18px; margin:14px 0; }
  .where { display:flex; gap:8px; font-size:13px; margin-bottom:8px; }
  .where .label { font-weight:600; white-space:nowrap; }
  .where ul { margin:0; padding:0; list-style:none; }
  table { border-collapse:collapse; width:100%; font-size:13.5px; }
  th { text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); font-weight:600; padding:6px 8px; }
  td { border-top:1px solid var(--line); padding:6px 8px; vertical-align:middle; }
  td.arrow { color:var(--muted); width:1%; }
  td.new { background:var(--newbg); }
  .g { display:inline-flex; align-items:center; justify-content:center; vertical-align:middle; margin-right:6px; color:var(--fg); }
  .g svg { width:24px; height:24px; }
  .g svg.mui { fill:currentColor; }
  .g svg[width="16"] { width:16px; height:16px; }
  .dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin:7px; }
  .pick { display:inline-flex; align-items:center; margin-right:12px; color:inherit; text-decoration:none; white-space:nowrap; }
  .pick:hover span { text-decoration:underline; }
  code { font:12px ui-monospace, SFMono-Regular, Menlo, monospace; }
  .none { color:var(--muted); font-style:italic; }
  .tag { font-size:11px; font-weight:700; text-transform:uppercase; white-space:nowrap; }
  .tag.replace { color:var(--rep); } .tag.high { color:var(--high); } .tag.medium { color:var(--med); }
  .tag.keep, .tag.added { color:var(--muted); }
  .status { font-size:11px; font-weight:700; text-transform:uppercase; padding:2px 6px; border-radius:4px; border:1px solid currentColor; white-space:nowrap; }
  .status.decided { color:var(--ok); } .status.proposed { color:var(--muted); } .status.open { color:var(--open); }
  table.vocab { background:var(--card); border:1px solid var(--line); }
  table.vocab tr.grp th { background:var(--bg); font-size:13px; color:var(--fg); text-transform:none; letter-spacing:0; padding-top:14px; }
  table.vocab td { vertical-align:top; }
  .alt { display:inline-flex; align-items:center; margin:0 10px 4px 0; opacity:.8; }
  .note { color:var(--muted); font-size:12.5px; margin-top:2px; max-width:60ch; }
  td.used { font-size:12.5px; color:var(--muted); max-width:28ch; }
  ol.q li, ol.how li { margin:8px 0; max-width:95ch; }
  @media (max-width:1000px) { .wrap { grid-template-columns:1fr; } nav { display:none; } main { padding:20px; } }
</style>
</head>
<body>
<div class="wrap">
<nav>
  <a href="#top"><b>Iconography</b></a>
  <a href="#maintaining">Maintaining this document</a>
  <a href="#rules">Design rules</a>
  <a href="#questions">Open questions</a>
  <a href="#vocabulary">Concept vocabulary</a>
  ${areas.map((area) => `<a class="area" href="#${slug(area.title)}">${escape(area.title)}</a>${area.functions.map((appFunction) => `<a class="sub" href="#${slug(appFunction.name)}">${escape(appFunction.name)}</a>`).join("")}`).join("")}
</nav>
<main id="top">
  <h1>Data Manager UI — iconography</h1>
  <p class="lede">The design record for the application's icons (<a href="https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/200">#200</a>):
  a <b>concept vocabulary</b> giving each idea in the app one Lucide glyph, and every function with the pages it appears on and the concept each of its elements uses.
  The <i>Before</i> column records the Material icon each element used before the move to Lucide.
  Glyphs are drawn from <code>lucide-static</code> at 24px; the vocabulary also shows 16px.</p>
  <div class="stats">
    <div class="stat"><b>${functionCount}</b>functions</div>
    <div class="stat"><b>${conceptEntries.length}</b>concepts</div>
    <div class="stat"><b>${statusCounts.decided}</b>decided</div>
    <div class="stat"><b>${statusCounts.proposed}</b>proposed</div>
    <div class="stat"><b>${statusCounts.open}</b>open</div>
    <div class="stat"><b>COUNT_REPLACED</b>Material icons replaced</div>
    <div class="stat"><b>COUNT_HIGH / COUNT_MEDIUM</b>High / Medium additions</div>
  </div>

  <h2 id="maintaining">Maintaining this document</h2>
  <p class="lede">This page is generated. Edit <code>src/components/iconConcepts.ts</code> (the concepts) or <code>docs/iconography/iconography.ts</code> (where they appear) and run <code>pnpm docs:iconography</code>; never edit the HTML.</p>
  <ol class="how">
    <li><b>A new function</b>: add it to its area with the pages it appears on, and give every element that carries an icon a concept from the vocabulary.</li>
    <li><b>A new idea</b> with no concept that means the same thing: add a concept with status <i>Proposed</i>, and list alternatives if the choice is debatable.</li>
    <li><b>A changed glyph</b>: change the concept, never the function; every function using it follows. Mark it <i>Decided</i> once agreed.</li>
    <li><b>An undecided glyph</b>: mark the concept <i>Open</i> and add an open question.</li>
  </ol>

  <h2 id="rules">Design rules</h2>
  <ol class="q">${designRules.map((rule) => `<li><b>${escape(rule.title)}.</b> ${escape(rule.body)}</li>`).join("")}</ol>

  <h2 id="questions">Open questions</h2>
  <ol class="q">${openQuestions.map((question) => `<li><b>${escape(question.title)}.</b> ${escape(question.body)}</li>`).join("")}</ol>${openQuestions.length === 0 ? `<p class="lede">None.</p>` : ""}

  <h2 id="vocabulary">Concept vocabulary</h2>
  <table class="vocab">
    <thead><tr><th>Concept</th><th>Status</th><th>Glyph</th><th>Replaces</th><th>Alternatives</th><th>Used by</th></tr></thead>
    <tbody>${vocabularyRows}</tbody>
  </table>

  ${sections}
</main>
</div>
</body>
</html>
`;

writeFileSync(
  output,
  html
    .replace("COUNT_REPLACED", String(counts.replaced))
    .replace("COUNT_HIGH", String(counts.high))
    .replace("COUNT_MEDIUM", String(counts.medium)),
);
console.log(
  `Wrote ${path.relative(process.cwd(), output)}: ${functionCount} functions, ${conceptEntries.length} concepts`,
);
