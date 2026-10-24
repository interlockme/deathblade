(function () {
  "use strict";
  var T = window.BibleIdTables;
  var GEM_BASE_AP_TABLE = { 1: 0, 2: 0.05, 3: 0.1, 4: 0.2, 5: 0.3, 6: 0.45, 7: 0.6, 8: 0.8, 9: 1, 10: 1.2 };
  var VAMBRACE_FLAT_AP_BY_HONING = [0,0,0,0,0,850,850,850,850,850,2030,2030,2030,2030,2030,3690,3690,3690,3690,3690,5980,5980,5980,5980,5980,9050];
  var VAMBRACE_HONING_RANGE = [[0, 10], [10, 15], [15, 20], [20, 25]];
  var VAMBRACE_STAT_FLAT_AP = 114;
  var DEATHBLADE_CLASS_ID = "blade";
  var CHAOS_GRADE_BY_ID_DIGIT = { 5: "Relic", 6: "Ancient" };
  var SLOT_BY_SHAPE = ["Sun", "Moon", "Star"];
  var BRACELET_STAT_INDEXES = { 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1 };
  var BRACELET_LINE_INDEX = { addDmg: 50, critRate: 74, critDmg: 76 };
  var BRACELET_IGNORED_LINES = { 27: 1, 34: 1, 55: 1, 56: 1, 149: 1, 151: 1 };
  var ACCESSORY_INDEX = { neckAdd: 50, atkPct: 49, weaponPct: 152, critRate: 74, critDmg: 76, atkFlat: 124 };
  var PENALTY_ENGRAVING_FROM = 1800;
  var ARK_CRIT_NODE_ID = 1010100;
  var CRIT_STAT_PER_NODE_LEVEL = 50;
  function fail(reason) { return { ok: false, reason: reason }; }
  function skipString(src, i) {
    var q = src[i];
    for (var k = i + 1; k < src.length; k++) {
      if (src[k] === "\\") k++;
      else if (src[k] === q) return k;
    }
    return src.length - 1;
  }
  function balanced(src, openIdx) {
    var open = src[openIdx], close = open === "{" ? "}" : "]";
    var depth = 0;
    for (var i = openIdx; i < src.length; i++) {
      var c = src[i];
      if (c === '"' || c === "'") { i = skipString(src, i); continue; }
      if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) return i + 1; }
    }
    return -1;
  }
  function jsonish(str) {
    return str
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/void 0/g, "null")
      .replace(/([:\[,]\s*)!0(?=\s*[,\]}])/g, "$1true")
      .replace(/([:\[,]\s*)!1(?=\s*[,\]}])/g, "$1false");
  }
  function fieldRaw(obj, key) {
    var depth = 0;
    for (var i = 0; i < obj.length; i++) {
      var c = obj[i];
      if (c === '"' || c === "'") { i = skipString(obj, i); continue; }
      if (c === "{" || c === "[") { depth++; continue; }
      if (c === "}" || c === "]") { depth--; continue; }
      if (depth === 1 && obj.substr(i, key.length + 1) === key + ":" && (obj[i - 1] === "{" || obj[i - 1] === ",")) {
        var v = i + key.length + 1;
        if (obj[v] === "[" || obj[v] === "{") return obj.slice(v, balanced(obj, v));
        var e = v;
        while (e < obj.length && obj[e] !== "," && obj[e] !== "}") e++;
        return obj.slice(v, e);
      }
    }
    return null;
  }
  function fieldJSON(obj, key) {
    var raw = fieldRaw(obj, key);
    if (raw == null) return undefined;
    return JSON.parse(jsonish(raw));
  }
  function topObjects(arr) {
    var out = [], depth = 0, start = -1;
    for (var i = 0; i < arr.length; i++) {
      var c = arr[i];
      if (c === '"' || c === "'") { i = skipString(arr, i); continue; }
      if (c === "{") { if (depth === 0) start = i; depth++; }
      else if (c === "}") { depth--; if (depth === 0) out.push(arr.slice(start, i + 1)); }
    }
    return out;
  }
  function loadoutObjects(rawHtml) {
    var idx = rawHtml.indexOf("loadouts:[");
    if (idx === -1) return null;
    var start = idx + "loadouts:".length;
    var end = balanced(rawHtml, start);
    if (end === -1) return null;
    var byClass = {};
    topObjects(rawHtml.slice(start, end)).forEach(function (o) {
      var m = o.match(/^\{classification:"([^"]*)"/);
      if (m && !(m[1] in byClass)) byClass[m[1]] = o;
    });
    return byClass;
  }
  function hasGems(obj) {
    var raw = fieldRaw(obj, "gems");
    return raw != null && /\{/.test(raw);
  }
  function pickLoadout(byClass) {
    var raid = byClass.most_recent_raid || null;
    var merged = byClass.raid_merged || null;
    if (raid && hasGems(raid)) return { kind: "raid", obj: raid };
    if (merged && hasGems(merged)) return { kind: "estimated", obj: merged, why: raid ? "the last raid snapshot had no gems" : "there is no raid snapshot" };
    if (raid) return { kind: "raid", obj: raid };
    if (merged) return { kind: "estimated", obj: merged, why: "there is no raid snapshot" };
    return null;
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  function braceClauses(line) {
    var parts = (line || "").split(/\.\s+/).map(function (s) { return s.replace(/\.$/, "").trim(); }).filter(Boolean);
    var out = [];
    parts.forEach(function (p) {
      var m = p.match(/^(.+?) ([+-][\d.]+)%$/);
      if (m) out.push([m[1], parseFloat(m[2])]);
    });
    return out;
  }
  function decodeBracelet(items, text) {
    var item = items.filter(function (i) { return i.slot === "bracelet"; })[0];
    if (!item || !item.data || !item.data.stats) return null;
    var rate = [], dmg = [], addA = [], addB = [], dual = 0;
    var stats = item.data.stats;
    for (var i = 0; i < stats.length; i++) {
      var s = stats[i];
      if (s.type === 2) {
        if (BRACELET_STAT_INDEXES[s.index] || BRACELET_IGNORED_LINES[s.index]) continue;
        if (s.index === BRACELET_LINE_INDEX.addDmg) addA.push(s.value / 100);
        else if (s.index === BRACELET_LINE_INDEX.critRate) rate.push(s.value / 100);
        else if (s.index === BRACELET_LINE_INDEX.critDmg) dmg.push(s.value / 100);
        else return "unknown bracelet stat index " + s.index;
        continue;
      }
      if (s.type !== 3 && s.type !== 4) return "unknown bracelet stat type " + s.type;
      var entry = T.bracelet[s.type + ":" + s.index];
      if (!entry) return "unknown bracelet effect id " + s.type + ":" + s.index;
      var clauses = braceClauses(entry.text);
      for (var c = 0; c < clauses.length; c++) {
        var label = clauses[c][0], val = clauses[c][1];
        if (label === "Crit Rate") rate.push(val);
        else if (label === "Crit Damage") dmg.push(val);
        else if (label === "Crit Hit Damage") dual++;
        else if (label === "Additional Damage") {
          var next = clauses[c + 1];
          if (next && /Demon\/Archdemon/i.test(next[0])) addB.push(val);
          else addA.push(val);
        }
      }
    }
    text.braceRateLines = rate;
    text.braceDmgLines = dmg;
    text.braceDualHitDmgCount = dual;
    text.braceAddA = addA;
    text.braceAddB = addB;
    return null;
  }
  function accessoryValue(item, index) {
    var stats = (item && item.data && item.data.stats) || [];
    for (var i = 0; i < stats.length; i++) {
      if (stats[i].type === 2 && stats[i].index === index && stats[i].base === false) return stats[i].value;
    }
    return null;
  }
  function pct(v) { return v == null ? null : v / 100; }
  function decodeAccessories(items, text) {
    var bySlot = {};
    items.forEach(function (i) { bySlot[i.slot] = i; });
    if (bySlot.neck) text.necklaceAddDmg = pct(accessoryValue(bySlot.neck, ACCESSORY_INDEX.neckAdd));
    ["ear1", "ear2"].forEach(function (slot, n) {
      if (!bySlot[slot]) return;
      text["earring" + (n + 1) + "WP"] = pct(accessoryValue(bySlot[slot], ACCESSORY_INDEX.weaponPct));
      text["earring" + (n + 1) + "AP"] = pct(accessoryValue(bySlot[slot], ACCESSORY_INDEX.atkPct));
    });
    ["finger1", "finger2"].forEach(function (slot, n) {
      if (!bySlot[slot]) return;
      text["ring" + (n + 1) + "Rate"] = pct(accessoryValue(bySlot[slot], ACCESSORY_INDEX.critRate));
      text["ring" + (n + 1) + "Dmg"] = pct(accessoryValue(bySlot[slot], ACCESSORY_INDEX.critDmg));
    });
    text.flatApLines = [];
    ["neck", "ear1", "ear2", "finger1", "finger2"].forEach(function (slot) {
      var v = accessoryValue(bySlot[slot], ACCESSORY_INDEX.atkFlat);
      if (v != null) text.flatApLines.push(v);
    });
  }
  var VAMBRACE_GRADE_NAMES = ["epic", "legendary", "relic", "ancient"];
  function decodeVambrace(items, stats, text) {
    text.vambraceGrade = "none";
    text.vambraceLevel = 0;
    text.vambraceWarning = null;
    var item = null;
    items.forEach(function (i) { if (i.slot === "bracer" || i.slot === "vambrace") item = i; });
    var reported = Array.isArray(stats) ? stats.filter(function (s) { return s.type === VAMBRACE_STAT_FLAT_AP; })[0] : null;
    function skip(why) {
      text.vambraceWarning = "Couldn't read the Vambrace (" + why + "), so it was left at None. Enter its grade and level by hand.";
    }
    if (!item) {
      if (reported && reported.value > 0) skip("the page's stats show Basic Atk. Power " + reported.value + " but list no Vambrace");
      return;
    }
    var id = item.id;
    if (typeof id !== "number" || Math.floor(id / 1e6) !== 134 || Math.floor(id / 1e4) % 10 !== 0) return skip("unknown item id " + id);
    var gradeIndex = Math.floor(id / 1e5) % 10 - 3;
    var honing = item.data && item.data.honing;
    if (gradeIndex < 0 || gradeIndex > 3) return skip("unknown grade in item id " + id);
    var range = VAMBRACE_HONING_RANGE[gradeIndex];
    if (!isFinite(honing) || Math.floor(honing) !== honing || honing < range[0] || honing > range[1]) return skip("level " + honing + " is outside its grade's range");
    var flat = VAMBRACE_FLAT_AP_BY_HONING[honing];
    if (reported && reported.value !== flat) return skip("+" + honing + " should add " + flat + " Basic Atk. Power but the page's stats say " + reported.value);
    text.vambraceGrade = VAMBRACE_GRADE_NAMES[gradeIndex];
    text.vambraceLevel = honing;
  }
  function decodeGems(gems, text) {
    if (!gems.length) { text.gemBaseApSum = null; return null; }
    var sum = 0;
    for (var i = 0; i < gems.length; i++) {
      var id = gems[i].id;
      var remap = T.gemRemap[id] != null ? T.gemRemap[id] : id;
      var level = Math.floor(remap / 10) % 100;
      var fromTable = GEM_BASE_AP_TABLE[level];
      if (fromTable == null) return "unknown gem id " + id;
      var effects = gems[i].effects || [];
      for (var e = 0; e < effects.length; e++) {
        if (effects[e].type === 2 && effects[e].id === 150 && round2(effects[e].value / 100) !== fromTable) {
          return "gem id " + id + " effect value " + effects[e].value + " disagrees with its level " + level;
        }
      }
      sum += fromTable;
    }
    text.gemBaseApSum = round2(sum);
    return null;
  }
  function stoneLevel(nodes) {
    var level = 0;
    for (var i = 0; i < T.stoneLevelNodes.length; i++) if (nodes >= T.stoneLevelNodes[i]) level = i;
    return level;
  }
  function decodeEngravings(engravings, items, text) {
    text.engravings = {};
    engravings.forEach(function (e) {
      var name = T.engravingNames[e.id] || ("Engraving " + e.id);
      text.engravings[name] = e.grade === "engrave_grade05" ? 20 : (e.progress || 0);
    });
    text.engravingStonePoints = {};
    var stone = items.filter(function (i) { return i.slot === "ability_stone"; })[0];
    var list = (stone && stone.data && stone.data.engravings) || [];
    list.forEach(function (e) {
      var id = e.id + 1000;
      if (id >= PENALTY_ENGRAVING_FROM) return;
      var name = T.engravingNames[id] || ("Engraving " + id);
      text.engravingStonePoints[name] = stoneLevel(e.nodes);
    });
  }
  function decodeCores(cores, text, hydration) {
    text.hasArkGrid = cores.length > 0;
    text.chaosCores = {};
    text.orderCores = {};
    hydration.chaosCores = [];
    for (var i = 0; i < cores.length; i++) {
      var core = cores[i];
      var sid = String(core.id);
      if (sid.length !== 9 || sid.indexOf("673") !== 0) return "unrecognized Ark Grid core id " + core.id;
      var chaos = sid[3] === "1";
      var shape = SLOT_BY_SHAPE[Number(sid[4])];
      if (!shape) return "unrecognized Ark Grid core shape in id " + core.id;
      var points = 0;
      var gems = core.gems || [];
      for (var g = 0; g < gems.length; g++) {
        if (typeof gems[g].corePoints !== "number") return "core " + core.id + " has a gem without corePoints";
        points += gems[g].corePoints;
      }
      var name = T.coreNames[Math.floor(core.id / 10)];
      var label = (chaos ? "Chaos " : "Order ") + shape;
      if (chaos) {
        if (!name) return "unknown Chaos core id " + core.id;
        var grade = CHAOS_GRADE_BY_ID_DIGIT[Number(sid[8])] || null;
        var entry = { id: core.id, points: points, grade: grade };
        hydration.chaosCores.push(entry);
        hydration.gridPoints[core.id] = points;
        text.chaosCores[label] = { name: name, points: points, coreRef: entry };
      } else {
        text.orderCores[label] = { name: name || ("unknown core " + core.id), points: points };
      }
    }
    return null;
  }
  function decodeAstrogems(cores, text) {
    var addDmg = 0, atk = 0, any = false;
    for (var i = 0; i < cores.length; i++) {
      var gems = cores[i].gems || [];
      for (var g = 0; g < gems.length; g++) {
        var opts = gems[g].opts || [];
        for (var o = 0; o < opts.length; o++) {
          any = true;
          if (!T.astrogemOptions[opts[o].id]) return "unknown astrogem option id " + opts[o].id;
          if (opts[o].id === 2002) addDmg += opts[o].level;
          else if (opts[o].id === 2001) atk += opts[o].level;
        }
      }
    }
    if (any) { text.astrogemAddDmgLv = addDmg; text.astrogemApLv = atk; }
    return null;
  }
  var MAIN_STAT_TYPE = 4;
  var MAIN_STAT_PCT_MAX = 15;
  function mainStatPercent(stats) {
    if (!Array.isArray(stats)) return null;
    function val(type) {
      for (var i = 0; i < stats.length; i++) if (stats[i] && stats[i].type === type) return stats[i].value;
      return undefined;
    }
    var base = [val(3), val(4), val(5)];
    var mult = [val(7), val(8), val(9)];
    var all = base.concat(mult);
    for (var i = 0; i < all.length; i++) if (typeof all[i] !== "number" || !isFinite(all[i])) return null;
    var m = MAIN_STAT_TYPE - 3;
    var others = [0, 1, 2].filter(function (k) { return k !== m; });
    if (!(base[m] > base[others[0]] && base[m] > base[others[1]])) return null;
    if (mult[others[0]] !== mult[others[1]] || mult[m] < mult[others[0]]) return null;
    var pct = (mult[m] - 10000) / 100;
    if (!(pct >= 0 && pct <= MAIN_STAT_PCT_MAX)) return null;
    return round2(pct);
  }
  function loadoutClassId(byClass) {
    for (var k in byClass) {
      var m = byClass[k].match(/classId:"([^"]*)"/);
      if (m) return m[1];
    }
    return null;
  }
  function statValue(stats, type) {
    for (var i = 0; i < (stats || []).length; i++) if (stats[i] && stats[i].type === type) return stats[i].value;
    return undefined;
  }
  function arkCritLevel(obj) {
    var ap = fieldJSON(obj, "arkPassive");
    var list = ap && Array.isArray(ap.evolution) ? ap.evolution : [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === ARK_CRIT_NODE_ID) return list[i].level || 0;
    return 0;
  }
  function estimatedCritStat(byClass, obj, stats) {
    var crit = statValue(stats, 15);
    if (typeof crit !== "number") return crit;
    var swift = statValue(stats, 18);
    var own = arkCritLevel(obj);
    var names = ["most_recent_raid", "most_recent_chaos_dungeon"];
    for (var i = 0; i < names.length; i++) {
      var other = byClass[names[i]];
      if (!other || other === obj) continue;
      var otherStats = fieldJSON(other, "stats");
      if (statValue(otherStats, 15) !== crit || statValue(otherStats, 18) !== swift) continue;
      return crit + (own - arkCritLevel(other)) * CRIT_STAT_PER_NODE_LEVEL;
    }
    return crit;
  }
  function decode(rawHtml) {
    if (!T) return fail("id tables are not loaded");
    var byClass = loadoutObjects(rawHtml);
    if (!byClass) return fail("no loadouts in the page data");
    var classId = loadoutClassId(byClass);
    if (classId != null && classId !== DEATHBLADE_CLASS_ID) {
      return { ok: false, notDeathblade: true, classId: classId, reason: "the page data says class " + classId + ", not " + DEATHBLADE_CLASS_ID };
    }
    var picked = pickLoadout(byClass);
    if (!picked) return fail("no raid loadout in the page data");
    var obj = picked.obj;
    var items, gems, engravings, cores, stats, battlePoint, karma;
    try {
      items = fieldJSON(obj, "items");
      gems = fieldJSON(obj, "gems");
      engravings = fieldJSON(obj, "engravings");
      cores = fieldJSON(obj, "arkGridCores");
      stats = fieldJSON(obj, "stats");
      battlePoint = fieldJSON(obj, "battlePoint");
      karma = fieldJSON(obj, "karma");
    } catch (e) {
      return fail("could not parse the loadout data (" + e.message + ")");
    }
    if (!Array.isArray(items) || !Array.isArray(gems) || !Array.isArray(engravings) || !battlePoint || !Array.isArray(battlePoint.parts)) {
      return fail("loadout data is missing a section this decoder reads");
    }
    cores = Array.isArray(cores) ? cores : [];
    var text = {};
    var hydration = { mainStat: null, weaponPower: null, weaponQuality: null, karma: null, gridPoints: {}, chaosCores: [] };
    battlePoint.parts.forEach(function (p) {
      if (p.type === 1) { hydration.mainStat = p.mainStat; hydration.weaponPower = p.weaponPower; }
      if (p.type === 4 && "quality" in p) text.weaponQuality = p.quality;
    });
    if (hydration.mainStat == null || hydration.weaponPower == null) return fail("no weapon power or main stat in the loadout");
    var crit = (stats || []).filter(function (s) { return s.type === 15; })[0];
    if (crit) {
      try { hydration.critStat = picked.kind === "estimated" ? estimatedCritStat(byClass, obj, stats) : crit.value; }
      catch (e) { hydration.critStat = crit.value; }
    }
    var mainPct = mainStatPercent(stats);
    if (mainPct != null) hydration.mainStatPct = mainPct;
    if (karma && typeof karma.enlightenment === "number" && typeof karma.leap === "number") {
      hydration.karma = { evolution: karma.evolution, enlightenment: karma.enlightenment, leap: karma.leap };
    }
    var problem = decodeBracelet(items, text);
    if (!problem) problem = decodeGems(gems, text);
    if (!problem) problem = decodeCores(cores, text, hydration);
    if (!problem) problem = decodeAstrogems(cores, text);
    if (problem) return fail(problem);
    decodeVambrace(items, stats, text);
    decodeAccessories(items, text);
    decodeEngravings(engravings, items, text);
    return { ok: true, kind: picked.kind, why: picked.why || null, classId: classId, text: text, hydration: hydration, warnings: text.vambraceWarning ? [text.vambraceWarning] : [] };
  }
  window.BibleDecode = { decode: decode, pickLoadout: pickLoadout, loadoutObjects: loadoutObjects };
})();
