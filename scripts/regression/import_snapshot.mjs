#!/usr/bin/env node
// Runs the REAL buildPayload from docs/javascripts/bible-import.js against every saved
// Bible page in fixtures/ and prints one JSON document to stdout (or --out FILE).
//
//   node scripts/regression/import_snapshot.mjs [--src path/to/bible-import.js] [--out file]
//
// Each fixture is a pair: NAME.html.gz (the saved page, exactly as the bookmarklet would
// see document.documentElement.outerHTML) and NAME.lines.json (document.body.innerText
// split on newlines, trimmed, blanks dropped: the same `lines` the bookmarklet passes).
// make_fixture.py builds that pair from a "Save page as" .html file.
//
// The output has, per fixture:
//   payload     what buildPayload returns (data, warnings, characterName, error)
//   gradeDebug  the Chaos grade icon-gradient decode
//   structured  facts read straight out of the page's hydration data, independent of
//               the importer (core ids/points, gem values, stone nodes, accessory
//               roll lines, icon-gradient grades). These are NOT used by the importer;
//               they are recorded so a change to the importer can be checked against
//               the page's own structured data, and so a change in Bible's payload shape
//               shows up as a diff here.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : dflt; };
const srcPath = path.resolve(opt("--src", path.join(here, "..", "..", "docs", "javascripts", "bible-import.js")));
const outPath = opt("--out", null);
const fixDir = path.join(here, "fixtures");

// ---- load the importer without a browser -------------------------------------------
// The file is one IIFE that ends by registering a renderer. Swap that call for a hook
// that hands back buildBookmarklet, whose output embeds buildPayload and the LAST_*
// debug accessors (that is exactly the code the bookmarklet runs on lostark.bible).
let src = fs.readFileSync(srcPath, "utf8");
const regRe = /window\.SiteUtils\.registerRenderer\(\s*"\.ap-calc"\s*,\s*renderBibleControl\s*\)\s*;?/;
if (!regRe.test(src)) throw new Error("bible-import.js no longer ends with registerRenderer(\".ap-calc\", renderBibleControl); update import_snapshot.mjs");
src = src.replace(regRe, "window.__bb = buildBookmarklet;");
const host = { console, location: { href: "https://example.invalid/", hash: "", pathname: "/", search: "" } };
host.window = host;
host.SiteUtils = { registerRenderer() {} };
host.document = { addEventListener() {}, readyState: "complete", querySelectorAll() { return []; }, querySelector() { return null; } };
vm.createContext(host);
vm.runInContext(src, host);
const bookmarklet = decodeURIComponent(host.__bb("https://example.invalid/calc/").slice("javascript:".length));
// Keep everything up to the debug accessors; drop the runner that would touch a real DOM.
const marker = "window.__dumpArkGridMarkers=dumpArkGridMarkers;";
const cut = bookmarklet.indexOf(marker);
if (cut < 0) throw new Error("bookmarklet body layout changed: could not find the debug accessor block");
const body = bookmarklet.slice(0, cut + marker.length) + "})();";
const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(body, sandbox);

// ---- structured facts from the hydration data --------------------------------------
function bal(s, i, open, close) {
  let d = 0;
  for (let k = i; k < s.length; k++) {
    if (s[k] === open) d++;
    else if (s[k] === close) { d--; if (d === 0) return k + 1; }
  }
  return -1;
}
function topObjects(arr) {
  const out = []; let d = 0, st = 0;
  for (let k = 0; k < arr.length; k++) {
    if (arr[k] === "{") { if (d === 0) st = k; d++; }
    else if (arr[k] === "}") { d--; if (d === 0) out.push(arr.slice(st, k + 1)); }
  }
  return out;
}
const GRADE_BY_GRADIENT = {
  "#3d3325, #dcc999": "Ancient", "#341a09, #a24006": "Relic",
  "rgb(61, 51, 37), rgb(220, 201, 153)": "Ancient", "rgb(52, 26, 9), rgb(162, 64, 6)": "Relic",
};
const COLOR_STOP = "(?:rgb\\([^)]*\\)|#[0-9a-fA-F]{3,6})";
const GRADIENT_RE = new RegExp("linear-gradient\\(135deg, " + COLOR_STOP + "(?:, " + COLOR_STOP + ")*\\)", "g");

function structuredFacts(html) {
  const out = { loadouts: [], raid: null };
  const li = html.indexOf("loadouts:[");
  if (li < 0) return out;
  const start = li + "loadouts:".length;
  const objs = topObjects(html.slice(start, bal(html, start, "[", "]")));
  out.loadouts = objs.map((o) => (o.match(/classification:"([^"]*)"/) || [])[1] || null);
  const raid = objs.find((o) => o.indexOf('classification:"most_recent_raid"') >= 0);
  if (!raid) return out;
  const facts = {};

  const a = raid.indexOf("arkGridCores:[");
  if (a >= 0) {
    const s = a + "arkGridCores:".length;
    facts.cores = topObjects(raid.slice(s, bal(raid, s, "[", "]"))).map((c) => {
      const m = c.match(/^\{id:(\d+),base:(\d+)/);
      const pts = [...c.matchAll(/corePoints:(\d+)/g)].reduce((n, x) => n + +x[1], 0);
      return { base: +m[2], id: +m[1], idLastDigit: +m[1] % 10, gemPoints: pts };
    });
  }
  const g = raid.indexOf("gems:[{");
  if (g >= 0) {
    const s = g + "gems:".length;
    const blob = raid.slice(s, bal(raid, s, "[", "]"));
    facts.gemApEffectValues = [...blob.matchAll(/type:2,id:150,value:(\d+)/g)].map((x) => +x[1]);
  }
  const st = raid.indexOf('slot:"ability_stone"');
  if (st >= 0) facts.stoneNodes = [...raid.slice(st, st + 300).matchAll(/\{id:(\d+),nodes:(\d+)\}/g)].map((x) => ({ id: +x[1], nodes: +x[2] }));
  facts.accessoryRolls = {};
  for (const slot of ["neck", "ear1", "ear2", "finger1", "finger2"]) {
    const i = raid.indexOf('slot:"' + slot + '"');
    if (i < 0) continue;
    const j = raid.indexOf("stats:[", i);
    const blob = raid.slice(j + "stats:".length, bal(raid, j + "stats:".length, "[", "]"));
    facts.accessoryRolls[slot] = [...blob.matchAll(/index:(\d+),base:false,id:\d+,value:(\d+)/g)].map((x) => [+x[1], +x[2]]);
  }
  facts.iconGradientGrades = {};
  for (const slot of ["order_sun", "order_moon", "order_star", "chaos_sun", "chaos_moon", "chaos_star"]) {
    const i = html.indexOf("emoticon_arkgrid_" + slot);
    if (i < 0) { facts.iconGradientGrades[slot] = null; continue; }
    const m = html.slice(Math.max(0, i - 1000), i).match(GRADIENT_RE);
    facts.iconGradientGrades[slot] = m ? (GRADE_BY_GRADIENT[m[m.length - 1].slice("linear-gradient(135deg, ".length, -1)] || "unknown") : null;
  }
  out.raid = facts;
  return out;
}

// ---- run ---------------------------------------------------------------------------
const result = { importerSource: path.relative(process.cwd(), srcPath), fixtures: {} };
const names = fs.readdirSync(fixDir).filter((f) => f.endsWith(".html.gz")).map((f) => f.slice(0, -".html.gz".length)).sort();
for (const name of names) {
  const html = zlib.gunzipSync(fs.readFileSync(path.join(fixDir, name + ".html.gz"))).toString("utf8");
  const lines = JSON.parse(fs.readFileSync(path.join(fixDir, name + ".lines.json"), "utf8"));
  // The debug object lives for the whole process: clear it so one fixture's entries never leak into the next.
  const dbg = sandbox.__lastChaosGradeDebug();
  for (const k of Object.keys(dbg)) delete dbg[k];
  let payload;
  try { payload = sandbox.__buildBiblePayload(html, lines, true); }
  catch (e) { payload = { threw: String(e && e.message || e) }; }
  result.fixtures[name] = {
    payload,
    gradeDebug: JSON.parse(JSON.stringify(sandbox.__lastChaosGradeDebug())),
    structured: structuredFacts(html),
  };
}
const text = JSON.stringify(result, null, 1) + "\n";
if (outPath) fs.writeFileSync(outPath, text); else process.stdout.write(text);
