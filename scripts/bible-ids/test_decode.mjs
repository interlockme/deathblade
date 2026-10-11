#!/usr/bin/env node
// Cross-checks docs/javascripts/bible-decode.js against the visible-text importer on every
// saved Bible page in scripts/regression/fixtures/. For each fixture the REAL buildPayload
// runs twice (text path, decoded path); every difference in data or warnings is printed.
//   node scripts/bible-ids/test_decode.mjs [--strict]
// With --strict a difference not listed in EXPECTED exits 1.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..");
const js = (n) => fs.readFileSync(path.join(root, "docs", "javascripts", n), "utf8");
const strict = process.argv.includes("--strict");

let src = js("bible-import.js");
const regRe = /window\.SiteUtils\.registerRenderer\(\s*"\.ap-calc"\s*,\s*renderBibleControl\s*\)\s*;?/;
if (!regRe.test(src)) throw new Error("bible-import.js no longer ends with registerRenderer");
src = src.replace(regRe, "window.__bb = buildBookmarklet;");
const host = { console, location: { href: "https://example.invalid/", hash: "", pathname: "/", search: "" } };
host.window = host;
host.SiteUtils = { registerRenderer() {} };
host.document = { addEventListener() {}, readyState: "complete", querySelectorAll() { return []; }, querySelector() { return null; } };
vm.createContext(host);
vm.runInContext(src, host);
const bookmarklet = decodeURIComponent(host.__bb("https://example.invalid/calc/").slice("javascript:".length));
const marker = "window.__dumpArkGridMarkers=dumpArkGridMarkers;";
const cut = bookmarklet.indexOf(marker);
const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(bookmarklet.slice(0, cut + marker.length) + "})();", sandbox);
vm.runInContext(js("bible-id-tables.js"), sandbox);
vm.runInContext(js("bible-decode.js"), sandbox);

// Differences that are intended, keyed "fixture|field". Each needs a reason.
const EXPECTED = {
  // This fixture's last raid snapshot has no gems, so the decoder uses Bible's estimated raid
  // loadout (raid_merged): its gems and main stat are the intended gain.
  "ancient-sun-relic-moon-star|ap-gear-gem-base-ap": "estimated loadout has gems",
  "ancient-sun-relic-moon-star|ap-gear-main-stat": "main stat comes from the estimated loadout",
  // No raid snapshot at all: the text path leaves these empty, the decoder fills them from raid_merged.
  // Gemless last raid snapshot, so the estimated loadout is used. Its stats table is the Chaos
  // Dungeon snapshot's (Crit 158, Swiftness 577) while its Ark Passive is the raid one (Crit node
  // 10, no Swiftness node), so the decoder moves the Crit total by the node difference (658).
  // The text path reads the raid tab and gets 658 too, which is why crit is not listed here.
  "estimated-chaos-stats|ap-gear-gem-base-ap": "estimated loadout has gems",
  "estimated-chaos-stats|ap-gear-main-stat": "main stat comes from the estimated loadout",
  "no-raid-loadout|ap-crit-stat": "filled from estimated loadout",
  "no-raid-loadout|ap-evo-karma": "filled from estimated loadout",
  "no-raid-loadout|ap-gear-gem-base-ap": "estimated loadout has gems",
  "no-raid-loadout|ap-gear-main-stat": "filled from estimated loadout",
  "no-raid-loadout|ap-gear-wp": "filled from estimated loadout",
  "no-raid-loadout|ap-gear-wp-karma-lv": "filled from estimated loadout",
};

// Main Stat % exists only in the decoded data (stats 7-9, see bible-decode.js), never in the
// page text, so every fixture differs on it. The exact value is pinned per fixture: 1% pet plus
// the skin bonus (9 = 8% skins, 5 = 4% skins).
const MAIN_STAT_PCT = {
  "ancient-chaos": "9",
  "ancient-sun-relic-moon-star": "9",
  "no-raid-loadout": "9",
  "estimated-chaos-stats": "9",
  "relic-chaos-star": "5",
  "relic-chaos-sun-moon": "5",
  "bracelet-stat-lines": "5",
};

// The class comes from the page data (classId), checked before anything else is decoded: the five
// Deathblade pages say blade, and each other-class page must be refused as notDeathblade with its
// own class id, never with a bracelet or gem reason.
const CLASS_ID = {
  "ancient-chaos": "blade",
  "ancient-sun-relic-moon-star": "blade",
  "no-raid-loadout": "blade",
  "estimated-chaos-stats": "blade",
  "relic-chaos-star": "blade",
  "relic-chaos-sun-moon": "blade",
  "bracelet-stat-lines": "blade",
  "other-class-support-t4": "yinyangshi",
  "other-class-t3-gear": "force_master",
};

// Icon colors are only a fallback on the decoded route. Swapping the Relic and Ancient gradients in
// the page must not change a decoded payload; the text path (and the bookmarklet) still use them as
// a cross-check, so there the swap has to raise a warning on at least one fixture (the control).
const GRADE_SWAP = {
  "#341a09, #a24006": "#3d3325, #dcc999",
  "#3d3325, #dcc999": "#341a09, #a24006",
  "rgb(52, 26, 9), rgb(162, 64, 6)": "rgb(61, 51, 37), rgb(220, 201, 153)",
  "rgb(61, 51, 37), rgb(220, 201, 153)": "rgb(52, 26, 9), rgb(162, 64, 6)",
};
const swapGrades = (h) => h.replace(/#341a09, #a24006|#3d3325, #dcc999|rgb\(52, 26, 9\), rgb\(162, 64, 6\)|rgb\(61, 51, 37\), rgb\(220, 201, 153\)/g, (m) => GRADE_SWAP[m]);
let controlFired = 0;

const fixDir = path.join(root, "scripts", "regression", "fixtures");
const names = fs.readdirSync(fixDir).filter((f) => f.endsWith(".html.gz")).map((f) => f.slice(0, -8)).sort();
let unexpected = 0;
for (const name of names) {
  const html = zlib.gunzipSync(fs.readFileSync(path.join(fixDir, name + ".html.gz"))).toString("utf8");
  const lines = JSON.parse(fs.readFileSync(path.join(fixDir, name + ".lines.json"), "utf8"));
  const dec = sandbox.window.BibleDecode.decode(html);
  console.log("\n== " + name + ": decode " + (dec.ok ? "ok (" + dec.kind + (dec.why ? ", " + dec.why : "") + ")" : "REFUSED: " + dec.reason));
  const expectClass = CLASS_ID[name];
  if (expectClass === "blade") {
    if (!dec.ok || dec.classId !== "blade") { unexpected++; console.log("  DIFF     class: expected a decoded blade page, got " + JSON.stringify({ ok: dec.ok, classId: dec.classId, reason: dec.reason })); }
    else console.log("  class blade, as pinned");
  } else if (expectClass) {
    if (dec.ok || !dec.notDeathblade || dec.classId !== expectClass) { unexpected++; console.log("  DIFF     class: expected a notDeathblade refusal for " + expectClass + ", got " + JSON.stringify({ ok: dec.ok, notDeathblade: dec.notDeathblade, classId: dec.classId, reason: dec.reason })); }
    else console.log("  class " + expectClass + " refused as notDeathblade, as pinned");
  } else { unexpected++; console.log("  DIFF     class: no pinned class for this fixture (add it to CLASS_ID)"); }
  if (!dec.ok) continue;
  const a = sandbox.__buildBiblePayload(html, lines, true);
  const b = sandbox.__buildBiblePayload(html, lines, true, undefined, dec);
  if (a.error || b.error) console.log("  text error: " + a.error + "\n  decoded error: " + b.error);
  const keys = [...new Set([...Object.keys(a.data || {}), ...Object.keys(b.data || {})])].sort();
  let diffs = 0;
  for (const k of keys) {
    if (JSON.stringify(a.data[k]) !== JSON.stringify(b.data[k])) {
      diffs++;
      const ok = (name + "|" + k) in EXPECTED || (k === "ap-gear-main-stat-pct" && a.data[k] === undefined && b.data[k] === MAIN_STAT_PCT[name]);
      if (!ok) unexpected++;
      console.log("  " + (ok ? "expected " : "DIFF     ") + k + ": text=" + JSON.stringify(a.data[k]) + " decoded=" + JSON.stringify(b.data[k]));
    }
  }
  const wa = JSON.stringify(a.warnings), wb = JSON.stringify(b.warnings);
  if (wa !== wb) console.log("  warnings text=" + wa + "\n           decoded=" + wb);
  const swapped = swapGrades(html);
  if (swapped !== html) {
    const b2 = sandbox.__buildBiblePayload(swapped, lines, true, undefined, dec);
    const same = JSON.stringify(b.data) === JSON.stringify(b2.data) && JSON.stringify(b.warnings) === JSON.stringify(b2.warnings);
    if (!same) unexpected++;
    const a2 = sandbox.__buildBiblePayload(swapped, lines, true);
    const fired = JSON.stringify(a2.warnings) !== JSON.stringify(a.warnings);
    if (fired) controlFired++;
    console.log("  icon colors swapped: decoded payload " + (same ? "unchanged" : "CHANGED") + "; text path " + (fired ? "warned (control fired)" : "did not warn"));
  } else console.log("  icon colors: no Relic/Ancient gradient in this page to swap");
  console.log("  " + (diffs ? diffs + " field difference(s)" : "all " + keys.length + " fields identical"));
}
// Estimated route reads ONLY the estimated loadout. For every fixture that decodes from raid_merged,
// the other snapshots' gear, engravings, cores, karma, weapon power, main stat and quality are
// rewritten; the decoded text and hydration must not move (the one cross-snapshot read is the Crit
// donor lookup, which looks at their stats table, so those stats are left alone here). Control:
// the same rewrite on the estimated loadout itself must move them, or the rewrite proved nothing.
const scramble = (o) => o
  .replace(/weaponPower:\d+/g, "weaponPower:1").replace(/mainStat:\d+/g, "mainStat:2").replace(/quality:\d+/g, "quality:3")
  .replace(/engrave_grade05/g, "engrave_grade01").replace(/progress:\d+/g, "progress:7")
  .replace(/enlightenment:\d+/g, "enlightenment:1").replace(/corePoints:\d+/g, "corePoints:1")
  .replace(/(index:\d+,base:(?:true|false),id:\d+,value:)\d+/g, "$11");
const ownShape = (d) => JSON.stringify({ text: d.text, hydration: d.hydration });
let isolationChecked = 0, isolationControl = 0;
for (const name of names) {
  const html = zlib.gunzipSync(fs.readFileSync(path.join(fixDir, name + ".html.gz"))).toString("utf8");
  const dec = sandbox.window.BibleDecode.decode(html);
  if (!dec.ok || dec.kind !== "estimated") continue;
  const objs = sandbox.window.BibleDecode.loadoutObjects(html);
  let others = html, own = html;
  for (const k of Object.keys(objs)) {
    if (k === "raid_merged") own = own.replace(objs[k], scramble(objs[k]));
    else others = others.replace(objs[k], scramble(objs[k]));
  }
  const d2 = sandbox.window.BibleDecode.decode(others);
  const same = d2.ok && ownShape(d2) === ownShape(dec);
  const d3 = sandbox.window.BibleDecode.decode(own);
  const moved = !d3.ok || ownShape(d3) !== ownShape(dec);
  isolationChecked++;
  if (moved) isolationControl++;
  if (!same || !moved) unexpected++;
  console.log("\n== " + name + ": estimated route ignores the other snapshots: " + (same ? "yes" : "NO (DIFF)") + "; control (same rewrite on the estimated loadout) " + (moved ? "moved it" : "did NOT move it (DIFF)"));
  // No donor (no other snapshot shares the estimated Crit and Swiftness totals): Crit is left as is.
  let noDonor = html;
  for (const k of Object.keys(objs)) if (k !== "raid_merged") noDonor = noDonor.replace(objs[k], objs[k].replace(/\{type:15,value:\d+\}/, "{type:15,value:999}"));
  const d4 = sandbox.window.BibleDecode.decode(noDonor);
  const keptRaw = d4.ok && d4.hydration.critStat === ((objs.raid_merged.match(/\{type:15,value:(\d+)\}/) || [])[1] | 0);
  if (!keptRaw) unexpected++;
  console.log("   no donor snapshot: Crit left as the estimated loadout's own total: " + (keptRaw ? "yes" : "NO (DIFF)"));
}
if (!isolationChecked || !isolationControl) { unexpected++; console.log("\nDIFF     estimated-route isolation check never ran or never moved: it proved nothing"); }
if (!controlFired) { unexpected++; console.log("\nDIFF     icon-color control never fired: the swap test proved nothing"); }
if (strict && unexpected) { console.error("\n" + unexpected + " unexpected difference(s)"); process.exit(1); }
