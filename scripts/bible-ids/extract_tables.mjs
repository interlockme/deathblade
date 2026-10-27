#!/usr/bin/env node
// Regenerates docs/javascripts/bible-id-tables.js from LOA-SIM, either from its source
// checkout (preferred) or from a saved copy of its character chunk (the big hashed
// _app/immutable/chunks/*.js file, see README.md).
//   node scripts/bible-ids/extract_tables.mjs --from-source path/to/loa-sim [--out file]
//   node scripts/bible-ids/extract_tables.mjs path/to/chunk.js [--out file]
// --from-source imports src/lib/upgrade-planner/{game-data,tables,stones}.ts with Node's
// built-in type stripping (Node 22.18+ or 24+), so no minified variable names are involved.
// Only plain game-data tables are copied (id -> name / effect text / value). Nothing is
// guessed: a table that cannot be found makes the script fail instead of writing a gap.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flagValue = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const sourceDir = flagValue("--from-source");
const outPath = flagValue("--out") || path.join(here, "..", "..", "docs", "javascripts", "bible-id-tables.js");
const chunkPath = sourceDir ? null : argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--out");
if (!sourceDir && !chunkPath) { console.error("usage: extract_tables.mjs (--from-source loa-sim-dir | chunk.js) [--out file]"); process.exit(2); }

const HEADER_NOTE = sourceDir ? "a LOA-SIM source checkout" : "a saved LOA-SIM chunk";

// Builds the same tables object from LOA-SIM's TypeScript source. Every table is checked
// for the shape the decoder reads; a missing export or an empty table throws.
async function tablesFromSource(dir) {
  const base = path.resolve(dir, "src", "lib", "upgrade-planner");
  const load = (f) => import(pathToFileURL(path.join(base, f)).href);
  const [gd, tb, st] = await Promise.all([load("game-data.ts"), load("tables.ts"), load("stones.ts")]);
  const need = (v, n) => { if (v == null || (typeof v === "object" && !Object.keys(v).length)) throw new Error("source table " + n + " is missing or empty"); return v; };
  const bracelet = {};
  for (const e of need(gd.BRACELET_EFFECTS, "BRACELET_EFFECTS")) bracelet[e.key] = { value: e.value, family: e.family, grade: e.grade, text: e.text, t4: !!e.t4 };
  const engravingNames = {};
  for (const [k, v] of Object.entries(need(gd.ENGRAVING_ICONS, "ENGRAVING_ICONS"))) engravingNames[k] = v[1];
  Object.assign(engravingNames, need(tb.ENGRAVING_NAMES, "ENGRAVING_NAMES"));
  // An accessory line is kept only when its matcher accepts exactly one (type, index) pair, which is
  // what the decoder keys on; a matcher on a whole type (the necklace Outgoing Damage line) is skipped.
  const accessoryLines = [];
  for (const l of need(tb.ACCESSORY_LINES, "ACCESSORY_LINES")) {
    const hits = [];
    for (const type of [1, 2, 3, 4, 5]) for (let index = 0; index <= 400; index++) if (l.match({ type, index })) hits.push([type, index]);
    if (hits.length !== 1) continue;
    accessoryLines.push({ key: l.key, name: l.name, type: hits[0][0], index: hits[0][1], low: l.values.low, mid: l.values.mid, high: l.values.high });
  }
  if (!accessoryLines.length) throw new Error("no accessory lines parsed");
  const stoneLevelNodes = [...need(st.STONE_LEVEL_NODES, "STONE_LEVEL_NODES")];
  if (stoneLevelNodes.length !== 5) throw new Error("stone level table has " + stoneLevelNodes.length + " entries, expected 5");
  return {
    coreNames: need(gd.CORE_NAMES, "CORE_NAMES"),
    bracelet,
    engravingNames,
    astrogemOptions: need(tb.ASTROGEM_OPTION_NAMES, "ASTROGEM_OPTION_NAMES"),
    astrogemOptionsShort: need(tb.ASTROGEM_OPTION_SHORT, "ASTROGEM_OPTION_SHORT"),
    accessoryLines,
    gemRemap: need(gd.GEM_REGULAR, "GEM_REGULAR"),
    stoneLevelNodes,
  };
}

function tablesFromChunk() {
  const s = fs.readFileSync(chunkPath, "utf8");

  function balanced(src, i) {
    const open = src[i], close = open === "{" ? "}" : "]";
    let d = 0, q = null;
    for (let k = i; k < src.length; k++) {
      const c = src[k];
      if (q) { if (c === "\\") k++; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'" || c === "`") { q = c; continue; }
      if (c === open) d++;
      else if (c === close) { d--; if (d === 0) return k + 1; }
    }
    throw new Error("unbalanced literal");
  }
  function literal(name, kind) {
    const re = new RegExp("[,;\\s]" + name + "=\\" + kind);
    const m = re.exec(s);
    if (!m) throw new Error("table " + name + " not found in chunk");
    const start = m.index + m[0].length - 1;
    return s.slice(start, balanced(s, start));
  }
  const evalLit = (name, kind) => new Function("return (" + literal(name, kind) + ")")();

  const coreNames = evalLit("M1", "{");          // id // 10 (8 digits) -> core name
  const engravingsGlobal = evalLit("zn", "{");   // id -> [icon, name]
  const engravingsClass = evalLit("K1", "{");    // id -> name (class engravings, wins over zn)
  const astrogemShort = evalLit("Zr", "{");
  const astrogemLong = evalLit("Ya", "{");
  const gemRemap = evalLit("w1", "{");
  const stoneLevelNodes = evalLit("L0", "[");  // ability stone: nodes needed for level 0..4
  if (stoneLevelNodes.length !== 5) throw new Error("stone level table has " + stoneLevelNodes.length + " entries, expected 5");
  const braceletRaw = literal("V0", "[");
  const bracelet = {};
  for (const m of braceletRaw.matchAll(/\{key:"(\d+):(\d+)",value:([\d.]+),family:"([^"]+)",grade:(\d),text:"((?:[^"\\]|\\.)*)",t4:(!0|!1)(?:,side:"([^"]*)")?\}/g)) {
    bracelet[m[1] + ":" + m[2]] = { value: +m[3], family: m[4], grade: +m[5], text: JSON.parse('"' + m[6] + '"'), t4: m[7] === "!0" };
  }
  const nBraceRaw = (braceletRaw.match(/\{key:"/g) || []).length;
  if (Object.keys(bracelet).length !== nBraceRaw) throw new Error("bracelet entries parsed " + Object.keys(bracelet).length + " of " + nBraceRaw);

  const accessoryLines = [];
  const yn = literal("Yn", "[");
  for (const m of yn.matchAll(/\{key:"([^"]+)",name:"([^"]+)",match:a=>a\.type===(\d+)&&a\.index===(\d+),values:\{low:([\d.e]+),mid:([\d.e]+),high:([\d.e]+)\}/g)) {
    accessoryLines.push({ key: m[1], name: m[2], type: +m[3], index: +m[4], low: +m[5], mid: +m[6], high: +m[7] });
  }
  if (!accessoryLines.length) throw new Error("no accessory lines parsed");

  const engravingNames = {};
  for (const [k, v] of Object.entries(engravingsGlobal)) engravingNames[k] = v[1];
  Object.assign(engravingNames, engravingsClass);
  return { coreNames, bracelet, engravingNames, astrogemOptions: astrogemLong, astrogemOptionsShort: astrogemShort, accessoryLines, gemRemap, stoneLevelNodes };
}

const tables = sourceDir ? await tablesFromSource(sourceDir) : tablesFromChunk();
const counts = Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v).length]));
const head = "// GENERATED by scripts/bible-ids/extract_tables.mjs from " + HEADER_NOTE + ". Do not edit by hand.\n"
  + "// Lost Ark game-data id tables (id -> name / effect / value) used by bible-decode.js.\n"
  + "// Counts: " + JSON.stringify(counts) + "\n";
fs.writeFileSync(outPath, head + "window.BibleIdTables = " + JSON.stringify(tables) + ";\n");
console.log("wrote", outPath, counts, fs.statSync(outPath).size, "bytes");
