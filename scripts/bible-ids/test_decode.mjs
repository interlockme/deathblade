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
import { flatten, unflatten } from "./devalue-lite.mjs";

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
  // This page's visible text is laid out differently from the older fixtures (a Full Breakdown
  // block, the engravings as 20/20 rows, no Ark Grid core lines the text parser recognizes), so
  // the text parser reads none of these; the decoded route reads them all from the page data.
  "vambrace-epic-10|ap-adrenaline": "visible-text layout this parser does not read",
  "vambrace-epic-10|ap-adrenaline-stone": "visible-text layout this parser does not read",
  "vambrace-epic-10|ap-astrogem-lv": "visible-text layout this parser does not read",
  "vambrace-epic-10|ap-brace-spec-build": "visible-text layout this parser does not read",
  "vambrace-epic-10|ap-flashy-atk": "visible-text layout this parser does not read",
  "vambrace-epic-10|ap-gear-ability-stone-base-ap": "visible-text layout this parser does not read",
  "vambrace-epic-10|ap-gear-ap-astrogem-lv": "visible-text layout this parser does not read",
  "vambrace-epic-10|ap-gear-weapon-core": "visible-text layout this parser does not read",
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
  "vambrace-epic-10": "9",
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
  "vambrace-epic-10": "blade",
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
// Vambrace: the decoded grade and level must match the item (grade from its id, level from its
// honing) and the flat Basic Atk. Power they imply must equal the game's own stat 114. Anything
// that cannot be read or disagrees leaves the Vambrace at None with a warning, and the rest of the
// loadout still decodes. Every fixture without a Vambrace decodes to None.
{
  const read = (name) => zlib.gunzipSync(fs.readFileSync(path.join(fixDir, name + ".html.gz"))).toString("utf8");
  const html = read("vambrace-epic-10");
  const item = '{id:134301406,slot:"bracer",data:{type:"equipment",stats:[],honing:10,advancedHoning:0}}';
  const stat = "{type:114,value:2030}";
  if (!html.includes(item) || !html.includes(stat)) throw new Error("vambrace-epic-10 no longer holds the literals this check rewrites");
  const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) unexpected++;
    console.log("\n== vambrace: " + label + ": " + (ok ? "ok" : "DIFF got " + JSON.stringify(got) + " want " + JSON.stringify(want)));
  };
  const D = (h) => sandbox.window.BibleDecode.decode(h);
  const shape = (d) => d.ok ? { grade: d.text.vambraceGrade, level: d.text.vambraceLevel, warnings: d.warnings } : { refused: d.reason };
  const none = (why) => ({ grade: "none", level: 0, warnings: ["Couldn't read the Vambrace (" + why + "), so it was left at None. Enter its grade and level by hand."] });
  check("Epic +10 reads Epic, level 10", shape(D(html)), { grade: "epic", level: 10, warnings: [] });
  check("Legendary +10 (grade digit 4) reads Legendary, level 10", shape(D(html.replace(item, item.replace("134301406", "134401406")))), { grade: "legendary", level: 10, warnings: [] });
  check("Relic +17 against stat 2030 is left at None", shape(D(html.replace(item, item.replace("134301406", "134501406").replace("honing:10", "honing:17")))), none("+17 should add 3690 Basic Atk. Power but the page's stats say 2030"));
  check("Epic +11 (out of the Epic range) is left at None", shape(D(html.replace(item, item.replace("honing:10", "honing:11")))), none("level 11 is outside its grade's range"));
  check("Epic +9 against stat 2030 is left at None", shape(D(html.replace(item, item.replace("honing:10", "honing:9")))), none("+9 should add 850 Basic Atk. Power but the page's stats say 2030"));
  check("stat 114 of 0 on a +10 Vambrace is left at None", shape(D(html.replace(stat, "{type:114,value:0}"))), none("+10 should add 2030 Basic Atk. Power but the page's stats say 0"));
  check("an item id outside 134xxxxxx is left at None", shape(D(html.replace(item, item.replace("134301406", "135301406")))), none("unknown item id 135301406"));
  check("a stat 114 with no Vambrace item is left at None", shape(D(html.replace(item, '{id:657830001,slot:"trinity_core",data:{type:"orb"}}'))), none("the page's stats show Basic Atk. Power 2030 but list no Vambrace"));
  for (const name of names) {
    if (name === "vambrace-epic-10") continue;
    const d = D(read(name));
    if (d.ok) check(name + " (no Vambrace)", shape(d), { grade: "none", level: 0, warnings: [] });
  }
  // Payload level: the decoded data carries grade and level, and the visible-text route reads
  // them from the "Vambrace +N" line (lower grade and a warning at 10, 15 and 20).
  const fixLines = JSON.parse(fs.readFileSync(path.join(fixDir, "vambrace-epic-10.lines.json"), "utf8"));
  const at = fixLines.indexOf("Vambrace +10 T4");
  const withLine = (line) => fixLines.map((l, k) => (k === at ? line : l)).filter((l) => l !== null);
  const payload = (lines, dec) => {
    const p = sandbox.__buildBiblePayload(html, lines, true, undefined, dec);
    return { grade: p.data["ap-gear-vambrace-grade"], level: p.data["ap-gear-vambrace-level"], ambiguous: p.warnings.some((w) => w.includes("exists in two grades")) };
  };
  check("decoded payload", payload(fixLines, D(html)), { grade: "epic", level: "10", ambiguous: false });
  check("text route +10 takes Epic and warns", payload(fixLines), { grade: "epic", level: "10", ambiguous: true });
  check("text route +12 reads Legendary", payload(withLine("Vambrace +12 T4")), { grade: "legendary", level: "12", ambiguous: false });
  check("text route +15 takes Legendary and warns", payload(withLine("Vambrace +15 T4")), { grade: "legendary", level: "15", ambiguous: true });
  check("text route +22 reads Ancient", payload(withLine("Vambrace +22 T4")), { grade: "ancient", level: "22", ambiguous: false });
  check("text route with no Vambrace line is None", payload(fixLines.filter((l, k) => k !== at)), { grade: "none", level: "0", ambiguous: false });
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
// Data route: the character's __data.json body must decode exactly like the page HTML it twins.
// Every HTML fixture has a derived data twin (make_data_fixture.mjs --derive-all); the whole
// decode result, refusals included, must match. Two real files of one character are pinned on top:
// one body has a gemless last raid snapshot plus the estimated loadout, the other has every gem on
// the last raid snapshot, and both describe the same gear, so they must decode to the same values.
{
  const read = (f) => zlib.gunzipSync(fs.readFileSync(path.join(fixDir, f))).toString("utf8");
  const Dec = sandbox.window.BibleDecode;
  const check = (label, ok, detail) => {
    if (!ok) unexpected++;
    console.log("\n== data route: " + label + ": " + (ok ? "ok" : "DIFF " + (detail || "")));
  };
  let twins = 0;
  for (const name of names) {
    const twin = name + ".data.json.gz";
    if (!fs.existsSync(path.join(fixDir, twin))) { check(name + " has a data twin", false, "run make_data_fixture.mjs --derive-all"); continue; }
    const a = JSON.stringify(Dec.decode(read(name + ".html.gz")));
    const b = JSON.stringify(Dec.decode(read(twin)));
    twins++;
    check(name + " decodes the same from HTML and from data", a === b, a.slice(0, 200) + " | " + b.slice(0, 200));
  }
  check("every HTML fixture was compared", twins === names.length && twins >= 10, twins + " of " + names.length);

  // Same through buildPayload: no visible text and no HTML on the data route, yet the payload
  // (every calculator field and every warning) must equal the HTML route's.
  let payloadsCompared = 0;
  for (const name of names) {
    const html = read(name + ".html.gz");
    const lines = JSON.parse(fs.readFileSync(path.join(fixDir, name + ".lines.json"), "utf8"));
    const dh = Dec.decode(html), dd = Dec.decode(read(name + ".data.json.gz"));
    if (!dh.ok) continue;
    const ph = sandbox.__buildBiblePayload(html, lines, true, undefined, dh);
    const pd = sandbox.__buildBiblePayload("", null, true, undefined, dd);
    payloadsCompared++;
    check(name + " payload from data (no text lines) equals the HTML route's", !pd.error && JSON.stringify(ph.data) === JSON.stringify(pd.data) && JSON.stringify(ph.warnings) === JSON.stringify(pd.warnings), pd.error || "");
  }
  check("payloads were compared", payloadsCompared >= 8, String(payloadsCompared));

  const raid = Dec.decode(read("data-raid-with-gems.data.json.gz"));
  const est = Dec.decode(read("data-estimated-gemless-raid.data.json.gz"));
  check("real data, gems on the last raid snapshot: raid loadout", raid.ok && raid.kind === "raid" && raid.classId === "blade", JSON.stringify([raid.ok, raid.kind, raid.reason]));
  check("real data, gemless last raid snapshot: estimated loadout", est.ok && est.kind === "estimated" && est.why === "the last raid snapshot had no gems", JSON.stringify([est.ok, est.kind, est.why, est.reason]));
  if (raid.ok && est.ok) {
    check("estimated and raid loadouts of the same character decode to the same text and hydration (Crit total included)", ownShape(raid) === ownShape(est));
    const t = raid.text, h = raid.hydration;
    const pinned = {
      weaponPower: h.weaponPower, mainStat: h.mainStat, critStat: h.critStat, mainStatPct: h.mainStatPct, karma: h.karma,
      quality: t.weaponQuality, gemBaseApSum: t.gemBaseApSum, astrogemAddDmgLv: t.astrogemAddDmgLv, astrogemApLv: t.astrogemApLv,
      braceRateLines: t.braceRateLines, braceDmgLines: t.braceDmgLines, braceDualHitDmgCount: t.braceDualHitDmgCount,
      vambrace: [t.vambraceGrade, t.vambraceLevel], necklaceAddDmg: t.necklaceAddDmg, engravings: t.engravings, stone: t.engravingStonePoints,
      chaos: Object.entries(t.chaosCores).map(([k, v]) => [k, v.name, v.points]), order: Object.entries(t.orderCores).map(([k, v]) => [k, v.name, v.points]),
    };
    const want = {
      weaponPower: 275046, mainStat: 879873, critStat: 658, mainStatPct: 9, karma: { evolution: 28, enlightenment: 30, leap: 28 },
      quality: 100, gemBaseApSum: 13.2, astrogemAddDmgLv: 60, astrogemApLv: 48,
      braceRateLines: [4.2], braceDmgLines: [6.8], braceDualHitDmgCount: 2,
      vambrace: ["epic", 10], necklaceAddDmg: 2.6, engravings: { Grudge: 20, "Ambush Master": 20, "Raid Captain": 20, Adrenaline: 20, "Mass Increase": 20 }, stone: { Grudge: 3, "Ambush Master": 2 },
      chaos: [["Chaos Sun", "Flashy Attack", 20], ["Chaos Moon", "Absorbing Strike", 20], ["Chaos Star", "Attack", 19]],
      order: [["Order Sun", "Slaughter Spectacle", 20], ["Order Moon", "Twin Swords Dance", 20], ["Order Star", "Swift Resolution", 20]],
    };
    check("real data values are pinned", JSON.stringify(pinned) === JSON.stringify(want), JSON.stringify(pinned));
  }

  // The reader in bible-decode.js and the helper the tests use must agree on the real files.
  const raw = JSON.parse(read("data-estimated-gemless-raid.data.json.gz"));
  const viaHelper = raw.nodes.filter((n) => n && n.type === "data").map((n) => unflatten(n.data)).find((p) => p.loadouts).loadouts;
  const viaDecoder = Dec.loadoutObjects !== undefined && Dec.decode(read("data-estimated-gemless-raid.data.json.gz")).ok;
  check("both readers accept the real body", Array.isArray(viaHelper) && viaHelper.length === 3 && viaDecoder);

  // Refusals on the data route are reported, never thrown.
  const base = JSON.parse(read("data-raid-with-gems.data.json.gz"));
  const withPage = (edit) => {
    const pages = base.nodes.map((n) => (n && n.type === "data" ? unflatten(n.data) : null));
    const page = pages.find((p) => p && p.loadouts);
    edit(page);
    const nodes = base.nodes.map((n, i) => (pages[i] ? { type: "data", data: flatten(pages[i]) } : n));
    return JSON.stringify({ type: "data", nodes });
  };
  const refused = (label, body, expect) => {
    let d;
    try { d = Dec.decode(body); } catch (e) { d = { threw: e.message }; }
    check(label, d && d.ok === false && !d.threw && expect.test(d.reason || ""), JSON.stringify(d).slice(0, 200));
  };
  refused("a truncated body is refused with a reason", read("data-raid-with-gems.data.json.gz").slice(0, 3000), /could not read the character data/);
  refused("a body with an unsupported data tag is refused with a reason", JSON.stringify({ type: "data", nodes: [{ type: "skip" }, { type: "data", data: [{ loadouts: 1 }, ["Map", [2, 3]]] }] }), /unsupported data tag Map/);
  refused("a body with no loadouts is refused", JSON.stringify({ type: "data", nodes: [{ type: "skip" }, { type: "data", data: [{ header: 1 }, { class: 2 }, "blade"] }] }), /no loadouts/);
  refused("a body with an out-of-range reference is refused", JSON.stringify({ type: "data", nodes: [{ type: "data", data: [{ loadouts: 9 }] }] }), /bad reference/);

  // Partial import: on the data route a section the decoder cannot read is left out and named in
  // a warning, and every other field still imports. Each case breaks one id the way a game patch
  // would; the page HTML keeps the all-or-nothing refusal (its visible text can take over).
  const UNREAD_FIELDS = {
    bracelet: ["ap-bracelet-rate", "ap-bracelet-rate-2", "ap-bracelet-dmg", "ap-bracelet-dmg-2", "ap-crit-rate-dual", "ap-crit-dmg-dual", "ap-bracelet-addA", "ap-bracelet-addB"],
    gems: ["ap-gear-gem-base-ap"],
    arkGrid: ["ap-astrogem-lv", "ap-gear-ap-astrogem-lv", "ap-flashy-atk", "ap-stable-atk", "ap-swift-core", "ap-crushing-core", "ap-gear-ap-chaos-star", "ap-gear-weapon-core", "ap-brace-spec-build"],
  };
  const raidLoadout = (p) => p.loadouts.find((x) => x.classification === "most_recent_raid");
  const breakIt = {
    bracelet: [(p) => { raidLoadout(p).items.find((i) => i.slot === "bracelet").data.stats.find((st) => st.type === 3).index = 999999; }, /unknown bracelet effect id 3:999999/],
    gems: [(p) => { raidLoadout(p).gems[0].id = 999999999; }, /unknown gem id 999999999/],
    arkGridOption: [(p) => { raidLoadout(p).arkGridCores.find((c) => (c.gems || []).some((g) => (g.opts || []).length)).gems.find((g) => (g.opts || []).length).opts[0].id = 9999; }, /unknown astrogem option id 9999/],
    arkGridCore: [(p) => { raidLoadout(p).arkGridCores[0].id = 999999999; }, /unrecognized Ark Grid core id 999999999/],
  };
  const sectionOf = { bracelet: "bracelet", gems: "gems", arkGridOption: "arkGrid", arkGridCore: "arkGrid" };
  const baseline = sandbox.__buildBiblePayload("", null, true, undefined, raid);
  check("a full decode has no keepKeys", baseline.keepKeys === undefined);
  for (const [name, [edit, expectProblem]] of Object.entries(breakIt)) {
    const d = Dec.decode(withPage(edit));
    const sec = sectionOf[name];
    check(name + ": decodes with the section left out and named", d.ok && JSON.stringify(d.text.unread) === JSON.stringify([sec]) && d.warnings.length === 1 && /^Couldn't read /.test(d.warnings[0]) && expectProblem.test(d.warnings[0]), JSON.stringify([d.ok, d.text && d.text.unread, d.warnings, d.reason]));
    if (!d.ok) continue;
    const p = sandbox.__buildBiblePayload("", null, true, undefined, d);
    const gone = Object.keys(baseline.data).filter((k) => !(k in p.data)).sort();
    const same = Object.keys(p.data).every((k) => JSON.stringify(p.data[k]) === JSON.stringify(baseline.data[k]));
    check(name + ": the section's calculator fields are left out, every other field is unchanged", !p.error && same && JSON.stringify(gone) === JSON.stringify(UNREAD_FIELDS[sec].filter((k) => k in baseline.data).sort()) && gone.length === UNREAD_FIELDS[sec].length, JSON.stringify({ err: p.error, same, gone }));
    check(name + ": keepKeys names exactly the skipped fields (the calculator resets everything on import, so they are carried over from its current values)", JSON.stringify([...(p.keepKeys || [])].sort()) === JSON.stringify([...UNREAD_FIELDS[sec]].sort()), JSON.stringify(p.keepKeys));
    check(name + ": the only new warning is the unread-section one", JSON.stringify(p.warnings) === JSON.stringify(baseline.warnings.concat(d.warnings)), JSON.stringify(p.warnings).slice(0, 300));
  }
  {
    const d = Dec.decode(withPage((p) => { Object.values(breakIt).forEach(([edit]) => edit(p)); }));
    check("every section broken at once: all three left out, the rest of the loadout still imports", d.ok && JSON.stringify(d.text.unread) === JSON.stringify(["bracelet", "gems", "arkGrid"]) && d.hydration.weaponPower === 275046 && d.hydration.critStat === 658 && d.warnings.length === 3, JSON.stringify([d.ok, d.text && d.text.unread, d.reason, d.warnings.length]));
    const p = sandbox.__buildBiblePayload("", null, true, undefined, d);
    const gone = Object.keys(baseline.data).filter((k) => !(k in p.data));
    check("every section broken at once: only the three skip lists disappear from the payload", !p.error && gone.length === Object.values(UNREAD_FIELDS).flat().length && p.data["ap-gear-wp"] === "275046", JSON.stringify([p.error, gone.length]));
  }
  check("an essential section missing is still a refusal on the data route", (() => { const d = Dec.decode(withPage((p) => { raidLoadout(p).battlePoint.parts = []; })); return d.ok === false && /weapon power/.test(d.reason); })());

  // The skip lists must cover everything a section can drive: blank each section out of every
  // fixture's decode and any payload field that changes has to be on that section's list.
  const blank = {
    bracelet: (d) => { ["braceRateLines", "braceDmgLines", "braceDualHitDmgCount", "braceAddA", "braceAddB"].forEach((k) => delete d.text[k]); },
    gems: (d) => { delete d.text.gemBaseApSum; },
    arkGrid: (d) => { d.text.hasArkGrid = false; d.text.chaosCores = {}; d.text.orderCores = {}; delete d.text.astrogemAddDmgLv; delete d.text.astrogemApLv; d.hydration.gridPoints = {}; d.hydration.chaosCores = []; },
  };
  let uncovered = [];
  for (const name of names) {
    const html = read(name + ".html.gz");
    const lines = JSON.parse(fs.readFileSync(path.join(fixDir, name + ".lines.json"), "utf8"));
    const dd = Dec.decode(read(name + ".data.json.gz"));
    if (!dd.ok) continue;
    const full = sandbox.__buildBiblePayload("", null, true, undefined, dd);
    for (const sec of Object.keys(blank)) {
      const copy = JSON.parse(JSON.stringify(dd));
      blank[sec](copy);
      copy.text.unread = undefined;
      const q = sandbox.__buildBiblePayload("", null, true, undefined, copy);
      for (const k of new Set([...Object.keys(full.data), ...Object.keys(q.data)])) {
        if (JSON.stringify(full.data[k]) !== JSON.stringify(q.data[k]) && !UNREAD_FIELDS[sec].includes(k)) uncovered.push(name + ":" + sec + ":" + k);
      }
    }
  }
  check("the skip lists cover every field each section changes, on every fixture", uncovered.length === 0, uncovered.join(", "));

  const other = Dec.decode(read("other-class-support-t4.data.json.gz"));
  check("another class on the data route is refused as notDeathblade", !other.ok && other.notDeathblade === true && other.classId === "yinyangshi", JSON.stringify(other).slice(0, 160));
  const noGems = Dec.decode(withPage((p) => { p.loadouts.forEach((l) => { if (l.classification === "most_recent_raid") l.gems = []; }); }));
  check("a gemless raid loadout with no estimated one still decodes as the raid loadout", noGems.ok && noGems.kind === "raid", JSON.stringify(noGems).slice(0, 160));
  // Control: the comparison above must be able to fail.
  const perturbed = Dec.decode(withPage((p) => { p.loadouts[0].battlePoint.parts.forEach((x) => { if (x.type === 1) x.weaponPower += 1; }); }));
  check("control: a changed weapon power changes the decode", perturbed.ok && perturbed.hydration.weaponPower === raid.hydration.weaponPower + 1);
  // Shared references and special values, the parts of the format the real files do not use.
  const probe = unflatten(JSON.parse('[{"a":1,"b":1,"c":2,"d":-1},[3,-2,-1],[3],7]'));
  const dv = Dec.decode(JSON.stringify({ type: "data", nodes: [{ type: "data", data: [{ loadouts: 1 }, [2, -2], { classification: 3, classId: 4, gems: -1, lastUpdated: 5 }, "most_recent_raid", "force_master", ["Date", "2026-01-01T00:00:00.000Z"]] }] }));
  check("the test helper reads holes, undefined and shared values as the format says", probe.a === probe.b && probe.a.length === 3 && probe.a[0] === 7 && !(1 in probe.a) && probe.a[2] === undefined && probe.c[0] === 7 && probe.d === undefined, JSON.stringify(probe));
  check("the reader in bible-decode.js takes a hole, undefined and a Date tag", !dv.ok && dv.notDeathblade === true && dv.classId === "force_master", JSON.stringify(dv));
}
if (!isolationChecked || !isolationControl) { unexpected++; console.log("\nDIFF     estimated-route isolation check never ran or never moved: it proved nothing"); }
if (!controlFired) { unexpected++; console.log("\nDIFF     icon-color control never fired: the swap test proved nothing"); }
if (strict && unexpected) { console.error("\n" + unexpected + " unexpected difference(s)"); process.exit(1); }
