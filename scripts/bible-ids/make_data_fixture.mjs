#!/usr/bin/env node
// Builds __data.json importer fixtures in scripts/regression/fixtures/ (NAME.data.json.gz).
//   node scripts/bible-ids/make_data_fixture.mjs --real NAME path/to/__data.json
//   node scripts/bible-ids/make_data_fixture.mjs --derive-all
//
// --real anonymizes a saved https://lostark.bible/character/<REGION>/<name>/__data.json?x-sveltekit-invalidated=011
// response. Open it in a fresh tab straight from the address bar, select all, copy, save. The
// loadouts are kept exactly as Bible sent them; the page header (account ids, guild, stronghold,
// portrait, history, view counts) is reduced to what carries no identity. The file holds no
// character name, so the script cannot check for it: name the fixture for what it exercises.
//
// --derive-all writes a data twin (same stem) of every NAME.html.gz fixture, built from that
// page's embedded loadouts. Twins are synthetic: they pin that both formats decode the same,
// not Bible's real format. Real files are the only proof of that format.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { dataBody, unflatten } from "./devalue-lite.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..");
const fixtures = path.join(root, "scripts", "regression", "fixtures");
const js = (n) => fs.readFileSync(path.join(root, "docs", "javascripts", n), "utf8");

const sandbox = {};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(js("bible-id-tables.js"), sandbox);
vm.runInContext(js("bible-decode.js"), sandbox);
const D = sandbox.BibleDecode;

const write = (name, body) => {
  const file = path.join(fixtures, name + ".data.json.gz");
  fs.writeFileSync(file, zlib.gzipSync(Buffer.from(body, "utf8"), { level: 9 }));
  console.log("wrote", path.relative(root, file), body.length, "bytes");
};

function real(name, file) {
  const body = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!body || body.type !== "data" || !Array.isArray(body.nodes)) throw new Error("not a __data.json body");
  const pages = body.nodes.filter((n) => n && n.type === "data").map((n) => unflatten(n.data));
  const layout = pages.find((p) => p && p.header);
  const page = pages.find((p) => p && Array.isArray(p.loadouts));
  if (!layout || !page) throw new Error("no layout header or loadouts in the file");
  const h = layout.header;
  const scrubbedLayout = {
    header: { class: h.class, ilvl: h.ilvl, level: h.level, combatPower: h.combatPower },
    redirectedFrom: null,
    suggestions: [],
  };
  const scrubbedPage = {
    loadouts: page.loadouts,
    stale: false,
    views: { d: 1, m: 1, y: 2026, v: [] },
    characterInfo: page.characterInfo,
    combatPowerDistribution: {},
  };
  const text = dataBody(scrubbedLayout, scrubbedPage);
  const leaks = [h.guild && h.guild.name, h.stronghold && h.stronghold.name, h.sn && String(h.sn)].filter((x) => x && text.includes(JSON.stringify(x).slice(1, -1)));
  if (leaks.length) throw new Error("still contains an identifying string: " + leaks.join(", "));
  write(name, text);
}

function deriveAll() {
  for (const f of fs.readdirSync(fixtures).filter((x) => x.endsWith(".html.gz")).sort()) {
    const name = f.replace(/\.html\.gz$/, "");
    const html = zlib.gunzipSync(fs.readFileSync(path.join(fixtures, f))).toString("utf8");
    const byClass = D.loadoutObjects(html);
    if (!byClass) { console.log("skip", name, "(no loadouts)"); continue; }
    const loadouts = Object.values(byClass).map((o) => D.parseLoadout(o));
    const classId = (loadouts.find((l) => l.classId) || {}).classId;
    write(name, dataBody({ header: { class: classId }, redirectedFrom: null, suggestions: [] }, { loadouts, stale: false }));
  }
}

const args = process.argv.slice(2);
if (args[0] === "--real" && args.length === 3) real(args[1], args[2]);
else if (args[0] === "--derive-all") deriveAll();
else { console.error("usage: make_data_fixture.mjs --real NAME file | --derive-all"); process.exit(2); }
