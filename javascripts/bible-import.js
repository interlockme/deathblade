(function () {
  var NECKLACE_TABLE = { None: 0, Low: 0.7, Mid: 1.6, High: 2.6 };
  var EARRING_WP_TABLE = { None: 0, Low: 0.8, Mid: 1.8, High: 3 };
  var EARRING_AP_TABLE = { None: 0, Low: 0.4, Mid: 0.95, High: 1.55 };
  var RING_RATE_TABLE = { None: 0, Low: 0.4, Mid: 0.95, High: 1.55 };
  var RING_DMG_TABLE = { None: 0, Low: 1.1, Mid: 2.4, High: 4 };
  var BRACE_RATE_TABLE = { None: 0, Low: 3.4, Mid: 4.2, High: 5 };
  var BRACE_DMG_TABLE = { None: 0, Low: 6.8, Mid: 8.4, High: 10 };
  var BRACE_ADD_A_TABLE = { None: 0, Low: 3, Mid: 3.5, High: 4 };
  var BRACE_ADD_B_TABLE = { None: 0, Low: 2.5, Mid: 3, High: 3.5 };
  var LAST_LOADOUT_CANDIDATES = null;
  var LAST_ARK_GRID_CORES_RAW = null;
  var CHAOS_GRADE_COLORS = {
    "#3d3325, #dcc999": "Ancient",
    "#341a09, #a24006": "Relic",
    "rgb(61, 51, 37), rgb(220, 201, 153)": "Ancient",
    "rgb(52, 26, 9), rgb(162, 64, 6)": "Relic",
  };
  var CHAOS_GRID_BASES = [10004, 10005, 10006];
  var CHAOS_GRADE_BY_ID_DIGIT = { 5: "Relic", 6: "Ancient" };
  function tierMatch(table, value) {
    if (value == null || isNaN(value)) return null;
    var best = null;
    var bestDiff = 0.06;
    for (var key in table) {
      var diff = Math.abs(table[key] - value);
      if (diff < bestDiff) { bestDiff = diff; best = key; }
    }
    return best;
  }
  function tierMatchOrNone(table, value, label, warnings) {
    var match = tierMatch(table, value);
    if (match) return match;
    if (value != null && !isNaN(value)) {
      warnings.push(label + ": observed " + value + "% doesn't match any known tier - defaulted to None, pick it manually if this looks wrong.");
    }
    return "None";
  }
  function findBalanced(src, openIdx, openChar, closeChar) {
    var depth = 0;
    for (var i = openIdx; i < src.length; i++) {
      if (src[i] === openChar) depth++;
      else if (src[i] === closeChar) { depth--; if (depth === 0) return i + 1; }
    }
    return -1;
  }
  function jsonish(str) {
    return str
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/void 0/g, "null");
  }
  function splitTopLevelObjects(src) {
    var objs = [], depth = 0, start = -1;
    for (var i = 0; i < src.length; i++) {
      var c = src[i];
      if (c === "{") { if (depth === 0) start = i; depth++; }
      else if (c === "}") { depth--; if (depth === 0) objs.push(src.slice(start, i + 1)); }
    }
    return objs;
  }
  function extractLoadoutJSON(rawHtml) {
    var loadoutsIdx = rawHtml.indexOf("loadouts:[");
    if (loadoutsIdx === -1) return null;
    var arrStart = loadoutsIdx + "loadouts:".length;
    var arrEnd = findBalanced(rawHtml, arrStart, "[", "]");
    if (arrEnd === -1) return null;
    var loadoutObjs = splitTopLevelObjects(rawHtml.slice(arrStart, arrEnd));
    var raid = null;
    for (var i = 0; i < loadoutObjs.length; i++) {
      if (loadoutObjs[i].indexOf('classification:"most_recent_raid"') !== -1) { raid = loadoutObjs[i]; break; }
    }
    LAST_LOADOUT_CANDIDATES = loadoutObjs.map(function (o) {
      var clsM = o.match(/classification:"([^"]*)"/);
      return {
        classification: clsM ? clsM[1] : null,
        hasBattlePoint: o.indexOf("battlePoint:{") !== -1,
        hasGridCores: o.indexOf("arkGridCores:[") !== -1,
      };
    });
    if (!raid) return { noRaidLoadout: true, mainStat: null, weaponPower: null, weaponQuality: null, karma: null, gridPoints: {}, chaosCores: [] };
    var result = { mainStat: null, weaponPower: null, weaponQuality: null, karma: null, gridPoints: {}, chaosCores: [] };
    var bpIdx = raid.indexOf("battlePoint:{");
    if (bpIdx !== -1) {
      var bpStart = bpIdx + "battlePoint:".length;
      var bpEnd = findBalanced(raid, bpStart, "{", "}");
      try {
        var bp = JSON.parse(jsonish(raid.slice(bpStart, bpEnd)));
        (bp.parts || []).forEach(function (p) {
          if (p.type === 1) { result.mainStat = p.mainStat; result.weaponPower = p.weaponPower; }
          if (p.type === 4 && "quality" in p) result.weaponQuality = p.quality;
          if (p.type === 29 && p.id) result.gridPoints[p.id] = p.points;
        });
      } catch (e) {   }
    }
    var agcIdx = raid.indexOf("arkGridCores:[");
    if (agcIdx !== -1) {
      var agcStart = agcIdx + "arkGridCores:".length;
      var agcEnd = findBalanced(raid, agcStart, "[", "]");
      try {
        var cores = JSON.parse(jsonish(raid.slice(agcStart, agcEnd)));
        LAST_ARK_GRID_CORES_RAW = cores;
        result.chaosCores = [];
        cores.forEach(function (c) {
          if (CHAOS_GRID_BASES.indexOf(c.base) === -1) return;
          var gemSum = 0, gemsOk = Array.isArray(c.gems);
          if (gemsOk) c.gems.forEach(function (g) { if (typeof g.corePoints === "number") gemSum += g.corePoints; else gemsOk = false; });
          result.chaosCores.push({ id: c.id, points: gemsOk ? gemSum : result.gridPoints[c.id], grade: CHAOS_GRADE_BY_ID_DIGIT[c.id % 10] || null });
        });
      } catch (e) { result.chaosCores = []; }
    }
    var karmaM = raid.match(/karma:\{evolution:(\d+),enlightenment:(\d+),leap:(\d+)\}/);
    if (karmaM) result.karma = { evolution: +karmaM[1], enlightenment: +karmaM[2], leap: +karmaM[3] };
    var itemsIdx = raid.indexOf("items:[");
    var statsSearchFrom = 0;
    if (itemsIdx !== -1) {
      var itemsStart = itemsIdx + "items:".length;
      var itemsEnd = findBalanced(raid, itemsStart, "[", "]");
      if (itemsEnd !== -1) statsSearchFrom = itemsEnd - 1;
    }
    var statsIdx = raid.indexOf("],stats:[", statsSearchFrom);
    LAST_CRIT_STAT_DEBUG = { itemsIdx: itemsIdx, statsIdx: statsIdx, statsArr: null, rawWindow: null };
    if (statsIdx !== -1) {
      var statsStart = statsIdx + 2 + "stats:".length;
      var statsEnd = findBalanced(raid, statsStart, "[", "]");
      LAST_CRIT_STAT_DEBUG.rawWindow = raid.slice(Math.max(0, statsIdx - 80), statsEnd + 20);
      try {
        var statsArr = JSON.parse(jsonish(raid.slice(statsStart, statsEnd)));
        LAST_CRIT_STAT_DEBUG.statsArr = statsArr;
        var critEntry = statsArr.find(function (s) { return s.type === 15; });
        if (critEntry) result.critStat = critEntry.value;
      } catch (e) {   }
    }
    return result;
  }
  var LAST_CHAOS_GRADE_DEBUG = {};
  function findChaosGrade(rawHtml, slot) {
    var idx = rawHtml.indexOf("emoticon_arkgrid_" + slot);
    if (idx === -1) { LAST_CHAOS_GRADE_DEBUG[slot] = { markerFound: false }; return null; }
    var windowStr = rawHtml.slice(Math.max(0, idx - 1000), idx);
    var COLOR_STOP = "(?:rgb\\([^)]*\\)|#[0-9a-fA-F]{3,6})";
    var GRADIENT_RE = new RegExp("linear-gradient\\(135deg, " + COLOR_STOP + "(?:, " + COLOR_STOP + ")*\\)", "g");
    var matches = windowStr.match(GRADIENT_RE);
    if (!matches || !matches.length) {
      LAST_CHAOS_GRADE_DEBUG[slot] = { markerFound: true, gradientsInWindow: [], windowTail: windowStr.slice(-300) };
      return null;
    }
    var fullMatch = matches[matches.length - 1];
    var lastColor = fullMatch.slice("linear-gradient(135deg, ".length, -1);
    var grade = CHAOS_GRADE_COLORS[lastColor] || null;
    LAST_CHAOS_GRADE_DEBUG[slot] = { markerFound: true, gradientsInWindow: matches, lastColor: lastColor, resolvedGrade: grade };
    return grade;
  }
  function matchChaosCore(cores, claimed, points, iconGrade) {
    var open = cores.filter(function (c) { return claimed.indexOf(c) === -1 && c.points === points; });
    if (open.length > 1) {
      var g = iconGrade();
      var same = g ? open.filter(function (c) { return c.grade === g; }) : [];
      if (same.length) open = same;
    }
    if (!open.length) return null;
    var ambiguous = open.some(function (c) { return c.grade !== open[0].grade; });
    return { core: open[0], ambiguous: ambiguous };
  }
  var LAST_ARK_GRID_MARKER_DUMP = null;
  var LAST_CRIT_STAT_DEBUG = null;
  function dumpArkGridMarkers(rawHtml) {
    var re = /arkgrid/gi;
    var hits = [];
    var m;
    while ((m = re.exec(rawHtml)) !== null && hits.length < 8) {
      var start = Math.max(0, m.index - 60);
      var end = Math.min(rawHtml.length, m.index + 80);
      hits.push(rawHtml.slice(start, end));
    }
    LAST_ARK_GRID_MARKER_DUMP = hits;
    return hits;
  }
  function parseStatLine(line) {
    var m = (line || "").match(/^(.+?) ([+-][\d.]+)(%)?$/);
    if (!m) return null;
    return { label: m[1], value: parseFloat(m[2]), isPct: !!m[3] };
  }
  function scanAccessoryBlock(lines, start, end) {
    var pct = [], flat = [];
    for (var i = start; i < end; i++) {
      var s = parseStatLine(lines[i]);
      if (!s) continue;
      if (s.isPct) pct.push([s.label, s.value]);
      else flat.push([s.label, s.value]);
    }
    return { pct: pct, flat: flat };
  }
  function firstPct(pairs, label) {
    var hit = pairs.pct.filter(function (p) { return p[0] === label; });
    return hit.length ? hit[0][1] : null;
  }
  function parseBraceClauses(line) {
    var parts = (line || "").split(/\.\s+/).map(function (s) { return s.replace(/\.$/, "").trim(); }).filter(Boolean);
    var out = [];
    parts.forEach(function (p) {
      var m = p.match(/^(.+?) ([+-][\d.]+)%$/);
      if (m) out.push([m[1], parseFloat(m[2])]);
    });
    return out;
  }
  function parseVisibleText(lines) {
    var out = {};
    out.onRaidLoadoutText = lines.indexOf("Current Loadout (Raid)") !== -1 || lines.indexOf("Estimated Raid Loadout") !== -1;
    function idxOf(label, from) {
      for (var i = from || 0; i < lines.length; i++) if (lines[i] === label) return i;
      return -1;
    }
    function idxOfNth(label, n) {
      var count = 0;
      for (var i = 0; i < lines.length; i++) {
        if (lines[i] === label) { if (count === n) return i; count++; }
      }
      return -1;
    }
    function idxOfRegex(re, from) {
      for (var i = from || 0; i < lines.length; i++) if (re.test(lines[i] || "")) return i;
      return -1;
    }
    function idxOfNthRegex(re, n) {
      var count = 0;
      for (var i = 0; i < lines.length; i++) {
        if (re.test(lines[i] || "")) { if (count === n) return i; count++; }
      }
      return -1;
    }
    var ACCESSORY_HEADER_RE = /^(Necklace|Earring|Ring|Stone|Bracelet) T\d/;
    var boundaries = [];
    for (var bi = 0; bi < lines.length; bi++) if (ACCESSORY_HEADER_RE.test(lines[bi])) boundaries.push(bi);
    var firstGemsIdx = idxOfNth("Gems", 0);
    if (firstGemsIdx !== -1) boundaries.push(firstGemsIdx);
    boundaries.sort(function (a, b) { return a - b; });
    function blockEnd(start) {
      for (var k = 0; k < boundaries.length; k++) if (boundaries[k] > start) return boundaries[k];
      return lines.length;
    }
    var weaponIdx = idxOfRegex(/^Weapon \+\d+ T\d/);
    if (weaponIdx !== -1) {
      var wq = parseInt(lines[weaponIdx + 1], 10);
      if (!isNaN(wq)) out.weaponQuality = wq;
    }
    var neckIdx = idxOfRegex(/^Necklace T\d/);
    var accessoryBlocks = [];
    if (neckIdx !== -1) {
      var neck = scanAccessoryBlock(lines, neckIdx + 1, blockEnd(neckIdx));
      out.necklaceAddDmg = firstPct(neck, "Additional Damage");
      accessoryBlocks.push(neck);
    }
    var ear1Idx = idxOfNthRegex(/^Earring T\d/, 0), ear2Idx = idxOfNthRegex(/^Earring T\d/, 1);
    if (ear1Idx !== -1) {
      var ear1 = scanAccessoryBlock(lines, ear1Idx + 1, blockEnd(ear1Idx));
      out.earring1WP = firstPct(ear1, "Weapon Power");
      out.earring1AP = firstPct(ear1, "Atk. Power");
      accessoryBlocks.push(ear1);
    }
    if (ear2Idx !== -1) {
      var ear2 = scanAccessoryBlock(lines, ear2Idx + 1, blockEnd(ear2Idx));
      out.earring2WP = firstPct(ear2, "Weapon Power");
      out.earring2AP = firstPct(ear2, "Atk. Power");
      accessoryBlocks.push(ear2);
    }
    var ring1Idx = idxOfNthRegex(/^Ring T\d/, 0), ring2Idx = idxOfNthRegex(/^Ring T\d/, 1);
    if (ring1Idx !== -1) {
      var ring1 = scanAccessoryBlock(lines, ring1Idx + 1, blockEnd(ring1Idx));
      out.ring1Rate = firstPct(ring1, "Crit Rate");
      out.ring1Dmg = firstPct(ring1, "Crit Damage");
      accessoryBlocks.push(ring1);
    }
    if (ring2Idx !== -1) {
      var ring2 = scanAccessoryBlock(lines, ring2Idx + 1, blockEnd(ring2Idx));
      out.ring2Rate = firstPct(ring2, "Crit Rate");
      out.ring2Dmg = firstPct(ring2, "Crit Damage");
      accessoryBlocks.push(ring2);
    }
    out.vambraceGrade = "none";
    out.vambraceLevel = 0;
    out.vambraceAmbiguousGrade = false;
    for (var vi = 0; vi < lines.length; vi++) {
      var vm = /^Vambrace\s*\+(\d+)/.exec(lines[vi]) || (lines[vi] === "Vambrace" ? /^\+(\d+)$/.exec(lines[vi + 1] || "") : null);
      if (!vm) continue;
      var vl = Number(vm[1]);
      if (vl < 0 || vl > 25) break;
      out.vambraceLevel = vl;
      out.vambraceGrade = vl <= 10 ? "epic" : vl <= 15 ? "legendary" : vl <= 20 ? "relic" : "ancient";
      out.vambraceAmbiguousGrade = vl === 10 || vl === 15 || vl === 20;
      break;
    }
    out.flatApLines = [];
    accessoryBlocks.forEach(function (block) {
      block.flat.forEach(function (pair) {
        if (pair[0] === "Attack Power" || pair[0] === "Atk. Power") out.flatApLines.push(pair[1]);
      });
    });
    var GEM_BASE_AP_TABLE = { 1: 0, 2: 0.05, 3: 0.1, 4: 0.2, 5: 0.3, 6: 0.45, 7: 0.6, 8: 0.8, 9: 1, 10: 1.2 };
    out.gemBaseApSum = null;
    if (firstGemsIdx !== -1) {
      var sum = 0, foundAny = false;
      for (var g = firstGemsIdx + 1; g < lines.length; g++) {
        var gm = (lines[g] || "").match(/^Lv\. (\d+)$/);
        if (!gm) break;
        foundAny = true;
        sum += GEM_BASE_AP_TABLE[+gm[1]] || 0;
      }
      if (foundAny) out.gemBaseApSum = Math.round(sum * 100) / 100;
    }
    var stoneIdx = idxOfRegex(/^Stone T\d/);
    out.engravingStonePoints = {};
    if (stoneIdx !== -1) {
      var stoneEnd = blockEnd(stoneIdx);
      for (var si = stoneIdx + 1; si + 1 < stoneEnd; si += 2) {
        var lvM = (lines[si + 1] || "").match(/^Lv\.(\d+)$/);
        if (lvM) out.engravingStonePoints[lines[si]] = +lvM[1];
      }
    }
    var braceIdx = idxOfRegex(/^Bracelet T\d/);
    if (braceIdx !== -1) {
      var braceEnd = blockEnd(braceIdx);
      var i0 = braceIdx + 1;
      if (/rolls remaining/i.test(lines[i0] || "")) i0++;
      var rateList = [], dmgList = [], addAList = [], addBList = [], dualCount = 0;
      for (var bi2 = i0; bi2 < braceEnd; bi2++) {
        var statM = (lines[bi2] || "").match(/^(Crit|Specialization|Swiftness|Domination|Endurance|Expertise) \+(-?\d+)$/);
        if (statM) continue;
        var clauses = parseBraceClauses(lines[bi2]);
        for (var ci = 0; ci < clauses.length; ci++) {
          var label = clauses[ci][0], val = clauses[ci][1];
          if (label === "Crit Rate") rateList.push(val);
          else if (label === "Crit Damage") dmgList.push(val);
          else if (label === "Crit Hit Damage") dualCount++;
          else if (label === "Additional Damage") {
            var nextClause = clauses[ci + 1];
            if (nextClause && /Demon\/Archdemon/i.test(nextClause[0])) addBList.push(val);
            else addAList.push(val);
          }
        }
      }
      out.braceRateLines = rateList;
      out.braceDmgLines = dmgList;
      out.braceDualHitDmgCount = dualCount;
      out.braceAddA = addAList;
      out.braceAddB = addBList;
    }
    var NO_ARK_GRID_MSG = "This character has no Ark Grid cores equipped.";
    var agIdx = -1;
    if (idxOf(NO_ARK_GRID_MSG) === -1) {
      for (var agScan = 0; agScan < lines.length; agScan++) {
        if (lines[agScan] === "Ark Grid" && !/%$/.test(lines[agScan + 1] || "")) { agIdx = agScan; break; }
      }
    }
    out.hasArkGrid = agIdx !== -1;
    var cardsIdx = idxOf("Cards", agIdx);
    for (var a = agIdx; a !== -1 && a < (cardsIdx === -1 ? lines.length : cardsIdx); a++) {
      var lvM2 = (lines[a] || "").match(/^Lv\. (\d+)$/);
      if (!lvM2) continue;
      var nextLine = lines[a + 1] || "";
      if (/^Attack Power \+/.test(nextLine)) out.astrogemApLv = +lvM2[1];
      if (/^Additional Damage \+/.test(nextLine)) out.astrogemAddDmgLv = +lvM2[1];
    }
    out.chaosCores = {};
    out.orderCores = {};
    ["Order Sun", "Order Moon", "Chaos Sun", "Chaos Moon", "Chaos Star"].forEach(function (slotLabel) {
      var slotIdx = idxOf(slotLabel, agIdx);
      if (slotIdx === -1 || lines[slotIdx - 1] !== "|") return;
      var ptM = (lines[slotIdx - 2] || "").match(/^(\d+)$/);
      var name = lines[slotIdx - 3];
      if (!ptM || !name) return;
      var bucket = slotLabel.indexOf("Order") === 0 ? out.orderCores : out.chaosCores;
      bucket[slotLabel] = { name: name, points: +ptM[1] };
    });
    var engHeaderIdx = idxOfNth("Engravings", 1);
    out.engravings = {};
    if (engHeaderIdx !== -1) {
      for (var e = engHeaderIdx + 1; e < engHeaderIdx + 20 && e + 1 < lines.length; e++) {
        var ptM = (lines[e + 1] || "").match(/^(\d+)\/20$/);
        if (ptM) out.engravings[lines[e]] = +ptM[1];
      }
    }
    return out;
  }
  var CLASS_NAME_LOOKBACK_LINES = 6;
  function checkDeathbladeClass(lines) {
    var cpIdx = -1;
    for (var i = 0; i < lines.length; i++) { if (lines[i] === "Combat Power") { cpIdx = i; break; } }
    if (cpIdx === -1) return "not-loaded";
    var windowStart = Math.max(0, cpIdx - CLASS_NAME_LOOKBACK_LINES);
    for (var j = cpIdx - 1; j >= windowStart; j--) {
      if (lines[j] === "Deathblade") return "deathblade";
    }
    return "wrong-class";
  }
  function extractCharacterName(lines) {
    var cpIdx = -1;
    for (var i = 0; i < lines.length; i++) { if (lines[i] === "Combat Power") { cpIdx = i; break; } }
    if (cpIdx <= 0) return null;
    var windowStart = Math.max(0, cpIdx - CLASS_NAME_LOOKBACK_LINES);
    for (var j = cpIdx - 1; j >= windowStart; j--) {
      if (lines[j] === "Deathblade") return lines[j + 1] || null;
    }
    return null;
  }
  function buildPayload(rawHtml, lines, onRaidLoadoutConfirmed, unconfirmedWarning, decoded) {
    var hydration = decoded ? decoded.hydration : extractLoadoutJSON(rawHtml);
    if (!hydration) return { error: "Couldn't find character data on this page - make sure you're on a Bible character page and it's fully loaded." };
    var characterName = null;
    if (lines) {
      var classCheck = checkDeathbladeClass(lines);
      if (classCheck === "not-loaded") {
        return { error: "Couldn't confirm this is a Deathblade character page - make sure it's fully loaded and try again." };
      }
      if (classCheck === "wrong-class") {
        return { error: "This doesn't look like a Deathblade - Bible import only supports Deathblade." };
      }
      characterName = extractCharacterName(lines);
    }
    var text = decoded ? decoded.text : parseVisibleText(lines);
    var data = {};
    var warnings = [];
    if (decoded && decoded.kind === "estimated") {
      warnings.push("Used Bible's estimated raid loadout because " + decoded.why + ". It is the best raid gear Bible has seen, which can differ from what the character wears now.");
    }
    if (hydration.noRaidLoadout) {
      warnings.push("No raid loadout snapshot found for this character - Weapon Power, Main Stat, Crit Stat, and Karma couldn't be auto-filled from that source. Chaos Grid core grades fall back to the icon colors in the page HTML, so they are still read. Accessories, bracelet, gems, engravings, and ability stone were still read from the page text below; fill in the rest manually.");
    }
    if (hydration.weaponPower != null) data["ap-gear-wp"] = String(hydration.weaponPower);
    if (hydration.mainStat != null) data["ap-gear-main-stat"] = String(hydration.mainStat);
    if (hydration.critStat != null) data["ap-crit-stat"] = String(hydration.critStat);
    if (hydration.mainStatPct != null) data["ap-gear-main-stat-pct"] = String(hydration.mainStatPct);
    data["ap-weapon-quality"] = "0";
    if (text.weaponQuality != null) data["ap-weapon-quality"] = String(text.weaponQuality);
    data["ap-gear-wp-karma-lv"] = "0";
    data["ap-evo-karma"] = "1";
    if (hydration.karma) {
      data["ap-gear-wp-karma-lv"] = String(hydration.karma.enlightenment);
      var leapRank = Math.min(6, Math.max(1, Math.floor((hydration.karma.leap - 1) / 4) + 1));
      data["ap-evo-karma"] = String(leapRank);
    }
    data["ap-necklace"] = tierMatchOrNone(NECKLACE_TABLE, text.necklaceAddDmg, "Necklace", warnings);
    data["ap-gear-wp-earring1"] = tierMatchOrNone(EARRING_WP_TABLE, text.earring1WP, "Earring 1 (Weapon Power)", warnings);
    data["ap-gear-wp-earring2"] = tierMatchOrNone(EARRING_WP_TABLE, text.earring2WP, "Earring 2 (Weapon Power)", warnings);
    data["ap-gear-ap-earring1"] = tierMatchOrNone(EARRING_AP_TABLE, text.earring1AP, "Earring 1 (Atk. Power)", warnings);
    data["ap-gear-ap-earring2"] = tierMatchOrNone(EARRING_AP_TABLE, text.earring2AP, "Earring 2 (Atk. Power)", warnings);
    data["ap-ring1-rate"] = tierMatchOrNone(RING_RATE_TABLE, text.ring1Rate, "Ring 1 (Crit Rate)", warnings);
    data["ap-ring2-rate"] = tierMatchOrNone(RING_RATE_TABLE, text.ring2Rate, "Ring 2 (Crit Rate)", warnings);
    data["ap-ring1-dmg"] = tierMatchOrNone(RING_DMG_TABLE, text.ring1Dmg, "Ring 1 (Crit Damage)", warnings);
    data["ap-ring2-dmg"] = tierMatchOrNone(RING_DMG_TABLE, text.ring2Dmg, "Ring 2 (Crit Damage)", warnings);
    data["ap-bracelet-rate"] = "None";
    data["ap-bracelet-rate-2"] = "None";
    data["ap-bracelet-dmg"] = "None";
    data["ap-bracelet-dmg-2"] = "None";
    data["ap-crit-rate-dual"] = false;
    data["ap-crit-dmg-dual"] = false;
    data["ap-bracelet-addA"] = "None";
    data["ap-bracelet-addB"] = "None";
    if (text.braceRateLines) {
      data["ap-bracelet-rate"] = tierMatch(BRACE_RATE_TABLE, text.braceRateLines[0]) || "None";
      data["ap-bracelet-rate-2"] = tierMatch(BRACE_RATE_TABLE, text.braceRateLines[1]) || "None";
    }
    if (text.braceDmgLines) {
      data["ap-bracelet-dmg"] = tierMatch(BRACE_DMG_TABLE, text.braceDmgLines[0]) || "None";
      data["ap-bracelet-dmg-2"] = tierMatch(BRACE_DMG_TABLE, text.braceDmgLines[1]) || "None";
    }
    if (text.braceDualHitDmgCount != null) {
      data["ap-crit-rate-dual"] = text.braceDualHitDmgCount >= 1;
      data["ap-crit-dmg-dual"] = text.braceDualHitDmgCount >= 2;
    }
    if (text.braceAddA && text.braceAddA.length) data["ap-bracelet-addA"] = tierMatch(BRACE_ADD_A_TABLE, text.braceAddA[0]) || "None";
    if (text.braceAddB && text.braceAddB.length) data["ap-bracelet-addB"] = tierMatch(BRACE_ADD_B_TABLE, text.braceAddB[0]) || "None";
    data["ap-astrogem-lv"] = text.astrogemAddDmgLv != null ? String(text.astrogemAddDmgLv) : "0";
    data["ap-gear-ap-astrogem-lv"] = text.astrogemApLv != null ? String(text.astrogemApLv) : "0";
    data["ap-flashy-atk"] = "None";
    data["ap-stable-atk"] = "None|0P";
    data["ap-swift-core"] = "None|0P";
    data["ap-crushing-core"] = "None|0P";
    data["ap-gear-ap-chaos-star"] = "None|0P";
    data["ap-gear-weapon-core"] = "None|0P";
    var CHAOS_CORE_FIELDS = {
      "Flashy Attack": { field: "ap-flashy-atk", format: "space17" },
      "Stable Attack": { field: "ap-stable-atk", format: "pipe" },
      "Swift Attack": { field: "ap-swift-core", format: "pipe" },
      "Crushing Strike": { field: "ap-crushing-core", format: "pipe" },
      "Attack": { field: "ap-gear-ap-chaos-star", format: "pipe", mergedAt10: true },
      "Weapon": { field: "ap-gear-weapon-core", format: "pipe", mergedAt10: true },
    };
    var CHAOS_SLOT_TO_KEY = { "Chaos Sun": "chaos_sun", "Chaos Moon": "chaos_moon", "Chaos Star": "chaos_star" };
    var claimedCores = [];
    var chaosMatch = {};
    var chaosIconGrades = {};
    var chaosIconGrade = function (key) {
      if (!(key in chaosIconGrades)) chaosIconGrades[key] = findChaosGrade(rawHtml, key);
      return chaosIconGrades[key];
    };
    if (text.hasArkGrid && text.chaosCores && hydration.chaosCores) {
      ["Chaos Sun", "Chaos Moon", "Chaos Star"].forEach(function (slotLabel) {
        var slotCore = text.chaosCores[slotLabel];
        if (!slotCore) return;
        var hit = slotCore.coreRef
          ? { core: slotCore.coreRef, ambiguous: false }
          : matchChaosCore(hydration.chaosCores, claimedCores, slotCore.points, function () { return chaosIconGrade(CHAOS_SLOT_TO_KEY[slotLabel]); });
        if (hit) { claimedCores.push(hit.core); chaosMatch[slotLabel] = hit; }
      });
    }
    if (text.hasArkGrid && text.chaosCores) {
      Object.keys(text.chaosCores).forEach(function (slotLabel) {
        var core = text.chaosCores[slotLabel];
        var target = CHAOS_CORE_FIELDS[core.name];
        if (!target) {
          return;
        }
        var matched = chaosMatch[slotLabel] || null;
        if (!matched && hydration.chaosCores && hydration.chaosCores.length) {
          warnings.push(slotLabel + ": page text says " + core.points + "P but no Chaos core in the page's own data (most-recent-raid snapshot) has that many points - kept the page text's " + core.points + "P since that reflects what's currently equipped; the snapshot can be stale. Worth a second look if this doesn't match what you expect.");
        }
        if (core.points < 10) {
          data[target.field] = target.format === "space17" ? "None" : "None|0P";
          return;
        }
        if (target.format === "pipe" && core.points < 14) {
          data[target.field] = target.mergedAt10 ? "Any|10P" : "None|0P";
          return;
        }
        if (target.format === "pipe" && core.points < 17) {
          data[target.field] = "Any|14P";
          return;
        }
        if (target.format === "space17" && core.points < 17) {
          data[target.field] = "Epic-Leg 10P";
          return;
        }
        var gradeKey = CHAOS_SLOT_TO_KEY[slotLabel];
        var idGrade = matched && !matched.ambiguous ? matched.core.grade : null;
        var iconGrade = decoded && idGrade ? null : chaosIconGrade(gradeKey);
        var grade = idGrade || iconGrade;
        if (idGrade && iconGrade && idGrade !== iconGrade) {
          warnings.push(slotLabel + " (" + core.name + ", " + core.points + "P): the core id says " + idGrade + " but the icon colors say " + iconGrade + " - used " + idGrade + ". Worth a second look.");
        }
        if (!grade) {
          var gradeDebug = LAST_CHAOS_GRADE_DEBUG[gradeKey];
          var gradeDetail = "";
          if (gradeDebug && gradeDebug.lastColor) {
            gradeDetail = " (found color \"" + gradeDebug.lastColor + "\", which isn't a recognized grade)";
          } else if (gradeDebug && gradeDebug.markerFound === false) {
            gradeDetail = " (couldn't even find this slot's icon marker on the page)";
          }
          warnings.push(slotLabel + " (" + core.name + ", " + core.points + "P): couldn't read its grade (Relic/Ancient) from the page" + gradeDetail + " - left unset, pick it manually.");
          return;
        }
        if (target.format === "space17") {
          data[target.field] = grade + " 17P";
        } else {
          data[target.field] = grade + "|" + core.points + "P";
        }
      });
    }
    var ORDER_SUN_MOON_TO_BUILD = {
      "Deathblade Surge||Surge Core": "surge-111",
      "Slaughter Spectacle||Twin Swords Dance": "surge-222",
      "Deathblade Rush||Death Blitz": "surge-333",
      "Art Master||Arts Core": "re-111",
      "Levin Slash||Arts Core": "re-111",
      "Levin Slash||Deathblade Wave": "re-333",
    };
    if (text.orderCores && text.orderCores["Order Sun"] && text.orderCores["Order Moon"]) {
      var sunMoonKey = text.orderCores["Order Sun"].name + "||" + text.orderCores["Order Moon"].name;
      var detectedBuild = ORDER_SUN_MOON_TO_BUILD[sunMoonKey];
      if (detectedBuild) {
        data["ap-brace-spec-build"] = detectedBuild;
      } else {
        warnings.push("Order Sun/Moon (\"" + text.orderCores["Order Sun"].name + "\" / \"" + text.orderCores["Order Moon"].name + "\") didn't match a known build - Build wasn't auto-set, pick it manually.");
      }
    } else if (!(text.unread && text.unread.indexOf("arkGrid") !== -1)) {
      warnings.push("Couldn't find Order Sun/Moon cores on this page (Order Grid not equipped, or a read failure) - Build wasn't auto-set, verify it matches your actual build manually.");
    }
    if (text.hasArkGrid && hydration.chaosCores) {
      var unreadSlots = Object.keys(CHAOS_SLOT_TO_KEY).filter(function (slotLabel) { return !text.chaosCores[slotLabel]; });
      var unaccounted = hydration.chaosCores.filter(function (c) { return claimedCores.indexOf(c) === -1 && c.points > 0; });
      if (unreadSlots.length && unaccounted.length) {
        warnings.push(unreadSlots.join(", ") + ": the page's own data shows " + unaccounted.map(function (c) { return c.points + "P"; }).join(", ") + " invested in Chaos cores that no slot read from the page text accounts for, but this file couldn't read a core name for " + (unreadSlots.length > 1 ? "them" : "it") + " from the page text - left unset, pick it manually.");
      }
    }
    data["ap-adrenaline"] = "Not Used";
    data["ap-kbw"] = "Not Used";
    if (text.engravings) {
      if ("Adrenaline" in text.engravings) data["ap-adrenaline"] = Math.round(text.engravings["Adrenaline"] / 5) + " Nodes";
      if ("Keen Blunt Weapon" in text.engravings) data["ap-kbw"] = Math.round(text.engravings["Keen Blunt Weapon"] / 5) + " Nodes";
    }
    data["ap-adrenaline-stone"] = "0 Lv.";
    data["ap-kbw-stone"] = "0 Lv.";
    if (text.engravingStonePoints) {
      if ("Adrenaline" in text.engravingStonePoints) data["ap-adrenaline-stone"] = text.engravingStonePoints["Adrenaline"] + " Lv.";
      if ("Keen Blunt Weapon" in text.engravingStonePoints) data["ap-kbw-stone"] = text.engravingStonePoints["Keen Blunt Weapon"] + " Lv.";
      var stoneSum = 0;
      for (var k in text.engravingStonePoints) stoneSum += text.engravingStonePoints[k];
      data["ap-gear-ability-stone-base-ap"] = stoneSum >= 5;
    }
    data["ap-gear-gem-base-ap"] = text.gemBaseApSum != null ? String(text.gemBaseApSum) : "0";
    var flatApSum = (text.flatApLines || []).reduce(function (a, b) { return a + b; }, 0);
    data["ap-gear-flat-ap"] = String(flatApSum);
    data["ap-gear-vambrace-grade"] = text.vambraceGrade || "none";
    data["ap-gear-vambrace-level"] = String(text.vambraceLevel || 0);
    if (decoded && decoded.warnings) decoded.warnings.forEach(function (w) { warnings.push(w); });
    if (!decoded && text.vambraceAmbiguousGrade) {
      warnings.push("Bible's page text doesn't say the Vambrace's grade and +" + text.vambraceLevel + " exists in two grades, so it was set to " + text.vambraceGrade + ". Check the grade against your Vambrace.");
    }
    var onRaidLoadout = onRaidLoadoutConfirmed != null ? onRaidLoadoutConfirmed : text.onRaidLoadoutText;
    if (!onRaidLoadout) {
      warnings.unshift(unconfirmedWarning || "Couldn't confirm this was scanned from \"Raid Loadout\" (auto-switch may have failed or hadn't finished rendering yet). Weapon Power/Main Stat/karma/grid points are always read correctly either way, but accessories, bracelet, gems, engravings, and Ark Grid core names may reflect the wrong loadout tab - click \"Raid Loadout\" on the character page yourself and re-run if any of those look off.");
    }
    var UNREAD_FIELDS = {
      bracelet: ["ap-bracelet-rate", "ap-bracelet-rate-2", "ap-bracelet-dmg", "ap-bracelet-dmg-2", "ap-crit-rate-dual", "ap-crit-dmg-dual", "ap-bracelet-addA", "ap-bracelet-addB"],
      gems: ["ap-gear-gem-base-ap"],
      arkGrid: ["ap-astrogem-lv", "ap-gear-ap-astrogem-lv", "ap-flashy-atk", "ap-stable-atk", "ap-swift-core", "ap-crushing-core", "ap-gear-ap-chaos-star", "ap-gear-weapon-core", "ap-brace-spec-build"],
    };
    var keepKeys = [];
    if (text.unread) {
      text.unread.forEach(function (section) {
        (UNREAD_FIELDS[section] || []).forEach(function (field) {
          delete data[field];
          keepKeys.push(field);
        });
      });
    }
    var result = { data: data, warnings: warnings, characterName: characterName };
    if (keepKeys.length) result.keepKeys = keepKeys;
    return result;
  }
  function bookmarkletBody(calculatorUrl) {
    try {
      var RELOAD_KEY = "bibleImportReloadedFor";
      if (sessionStorage.getItem(RELOAD_KEY) !== location.href) {
        sessionStorage.setItem(RELOAD_KEY, location.href);
        alert("Bible import: refreshing this page first to make sure its data is current - click the bookmarklet again once it reloads.");
        location.reload();
        return;
      }
    } catch (e) {
    }
    function currentLines() {
      return document.body.innerText.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
    }
    function finish(lines, onRaidLoadoutConfirmed) {
      var html = document.documentElement.outerHTML;
      var payload = window.__buildBiblePayload(html, lines, onRaidLoadoutConfirmed);
      if (window.console && console.log) {
        console.log("[Bible import] page at scan time: " + location.href + " (title: " + document.title + ")");
        console.log("[Bible import] loadout candidates seen on this page:\n" + JSON.stringify(window.__lastLoadoutCandidates(), null, 2));
        console.log("[Bible import] raw Ark Grid core objects (raid loadout):\n" + JSON.stringify(window.__lastArkGridCoresRaw(), null, 2));
        console.log("[Bible import] Chaos Grid grade decode debug:\n" + JSON.stringify(window.__lastChaosGradeDebug(), null, 2));
        window.__dumpArkGridMarkers(html);
        console.log("[Bible import] raw \"arkgrid\" marker scan (case-insensitive, first 8 hits with context):\n" + JSON.stringify(window.__lastArkGridMarkerDump(), null, 2));
        console.log("[Bible import] crit stat extraction debug:\n" + JSON.stringify(window.__lastCritStatDebug(), null, 2));
        console.log("[Bible import] final data sent to calculator:\n" + JSON.stringify(payload.data, null, 2));
        console.log("[Bible import] warnings:\n" + JSON.stringify(payload.warnings, null, 2));
        console.log("[Bible import] raw visible text lines (" + lines.length + " total):\n" + JSON.stringify(lines, null, 2));
      }
      if (payload.error) { alert("Bible import: " + payload.error); return; }
      var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      location.href = calculatorUrl + "#bible-import=" + encoded;
    }
    function findRaidLoadoutButton() {
      var buttons = document.querySelectorAll("button");
      for (var i = 0; i < buttons.length; i++) {
        var t = (buttons[i].textContent || "").trim();
        if (t === "Raid Loadout" || t === "Estimated Raid Loadout") return buttons[i];
      }
      return null;
    }
    function findLoadoutTabButtons() {
      var buttons = document.querySelectorAll("button");
      var out = [];
      for (var i = 0; i < buttons.length; i++) {
        var t = (buttons[i].textContent || "").trim();
        if (t && t.length < 60 && t.toLowerCase().indexOf("loadout") !== -1) out.push(t);
      }
      return out;
    }
    function describeRaidButton(btn) {
      if (!btn) return null;
      return {
        outerHTML: btn.outerHTML,
        className: btn.className,
        ariaSelected: btn.getAttribute("aria-selected"),
        ariaCurrent: btn.getAttribute("aria-current"),
        disabled: btn.disabled,
      };
    }
    try {
      var lines = currentLines();
      var btn = findRaidLoadoutButton();
      var beforeDescribe = describeRaidButton(btn);
      if (btn) {
        btn.click();
        setTimeout(function () {
          try {
            var linesAfter = currentLines();
            var btnAfter = findRaidLoadoutButton();
            var afterDescribe = describeRaidButton(btnAfter);
            var confirmed = !!(btnAfter && (" " + btnAfter.className + " ").indexOf(" bg-neutral-800 ") !== -1);
            if (window.console && console.log) {
              console.log("[Bible import] Raid Loadout button before click:\n" + JSON.stringify(beforeDescribe, null, 2));
              console.log("[Bible import] Raid Loadout button after click+wait:\n" + JSON.stringify(afterDescribe, null, 2));
              console.log("[Bible import] visible text changed after click: " + (lines.join("\n") !== linesAfter.join("\n")));
            }
            finish(linesAfter, confirmed);
          }
          catch (e) { alert("Bible import failed: " + e.message); }
        }, 400);
        return;
      }
      var loadoutTabs = findLoadoutTabButtons();
      if (window.console && console.log) {
        console.log("[Bible import] no \"Raid Loadout\" switch button; loadout-ish tab labels seen: " + JSON.stringify(loadoutTabs));
      }
      for (var li = 0; li < loadoutTabs.length; li++) {
        if (/current/i.test(loadoutTabs[li]) && /raid/i.test(loadoutTabs[li])) {
          finish(lines, true);
          return;
        }
      }
      if (loadoutTabs.length) {
        finish(lines, false);
        return;
      }
      var singleLoadoutIsRaid = lines.indexOf("Current Loadout (Raid)") !== -1 || lines.indexOf("Estimated Raid Loadout") !== -1;
      finish(lines, singleLoadoutIsRaid);
    } catch (e) {
      alert("Bible import failed: " + e.message);
    }
  }
  function stripComments(src) {
    var out = "", i = 0, n = src.length;
    var inSL = false, inML = false, inStr = false, strCh = "";
    while (i < n) {
      var c = src[i], c2 = src[i + 1];
      if (inSL) { if (c === "\n") { inSL = false; out += c; } i++; continue; }
      if (inML) { if (c === "*" && c2 === "/") { inML = false; i += 2; continue; } i++; continue; }
      if (inStr) {
        out += c;
        if (c === "\\") { out += src[i + 1]; i += 2; continue; }
        if (c === strCh) inStr = false;
        i++; continue;
      }
      if (c === '"' || c === "'") { inStr = true; strCh = c; out += c; i++; continue; }
      if (c === "/" && c2 === "/") { inSL = true; i += 2; continue; }
      if (c === "/" && c2 === "*") { inML = true; i += 2; continue; }
      out += c; i++;
    }
    return out.split("\n").map(function (l) { return l.trim(); }).filter(Boolean).join("\n");
  }
  function buildBookmarklet(calculatorUrl) {
    var extractionSrc = [
      findBalanced, jsonish, splitTopLevelObjects, extractLoadoutJSON,
      findChaosGrade, matchChaosCore, dumpArkGridMarkers, parseStatLine, scanAccessoryBlock, firstPct,
      parseBraceClauses, parseVisibleText, tierMatch, tierMatchOrNone, checkDeathbladeClass, extractCharacterName, buildPayload,
    ].map(function (fn) { return stripComments(fn.toString()); }).join("\n");
    var tableSrc = [
      "var CLASS_NAME_LOOKBACK_LINES=" + JSON.stringify(CLASS_NAME_LOOKBACK_LINES) + ";",
      "var NECKLACE_TABLE=" + JSON.stringify(NECKLACE_TABLE) + ";",
      "var EARRING_WP_TABLE=" + JSON.stringify(EARRING_WP_TABLE) + ";",
      "var EARRING_AP_TABLE=" + JSON.stringify(EARRING_AP_TABLE) + ";",
      "var RING_RATE_TABLE=" + JSON.stringify(RING_RATE_TABLE) + ";",
      "var RING_DMG_TABLE=" + JSON.stringify(RING_DMG_TABLE) + ";",
      "var BRACE_RATE_TABLE=" + JSON.stringify(BRACE_RATE_TABLE) + ";",
      "var BRACE_DMG_TABLE=" + JSON.stringify(BRACE_DMG_TABLE) + ";",
      "var BRACE_ADD_A_TABLE=" + JSON.stringify(BRACE_ADD_A_TABLE) + ";",
      "var BRACE_ADD_B_TABLE=" + JSON.stringify(BRACE_ADD_B_TABLE) + ";",
      "var CHAOS_GRADE_COLORS=" + JSON.stringify(CHAOS_GRADE_COLORS) + ";",
      "var CHAOS_GRID_BASES=" + JSON.stringify(CHAOS_GRID_BASES) + ";",
      "var CHAOS_GRADE_BY_ID_DIGIT=" + JSON.stringify(CHAOS_GRADE_BY_ID_DIGIT) + ";",
      "var LAST_LOADOUT_CANDIDATES=null;",
      "var LAST_ARK_GRID_CORES_RAW=null;",
      "var LAST_CHAOS_GRADE_DEBUG={};",
      "var LAST_ARK_GRID_MARKER_DUMP=null;",
      "var LAST_CRIT_STAT_DEBUG=null;",
    ].join("\n");
    var body = "(function(){" + tableSrc + "\n" + extractionSrc +
      "\nwindow.__buildBiblePayload=buildPayload;" +
      "\nwindow.__lastLoadoutCandidates=function(){return LAST_LOADOUT_CANDIDATES;};" +
      "\nwindow.__lastArkGridCoresRaw=function(){return LAST_ARK_GRID_CORES_RAW;};" +
      "\nwindow.__lastChaosGradeDebug=function(){return LAST_CHAOS_GRADE_DEBUG;};" +
      "\nwindow.__lastArkGridMarkerDump=function(){return LAST_ARK_GRID_MARKER_DUMP;};" +
      "\nwindow.__lastCritStatDebug=function(){return LAST_CRIT_STAT_DEBUG;};" +
      "\nwindow.__dumpArkGridMarkers=dumpArkGridMarkers;" +
      "\n(" + stripComments(bookmarkletBody.toString()) + ")(" + JSON.stringify(calculatorUrl) + ");})();";
    if (window.console) {
      try {
        new Function(body);
      } catch (e) {
        console.error("[bible-import] generated bookmarklet body failed to parse - it will not run on lostark.bible: " + e.message);
      }
      if (body.length > 55000) {
        console.warn("[bible-import] bookmarklet body is " + body.length + " chars - approaching the size that previously broke bookmarks-bar dragging (~66KB encoded). Consider trimming stripComments' output or the inlined function list.");
      }
    }
    return "javascript:" + encodeURIComponent(body);
  }
  var BIBLE_ORIGIN = "https://lostark.bible";
  var LOAD_REGIONS = ["NA", "CE"];
  var LOAD_TIMEOUT_MS = 20000;
  var MAX_SOURCE_CHARS = 6000000;
  var REGION_STORAGE_KEY = "bibleLoadRegion";
  var FETCHED_UNCONFIRMED_WARNING = "This character's last-used loadout on Bible may be Chaos Dungeon, so accessories, bracelet, gems, engravings and core names might not be from Raid. Switch to Raid Loadout on Bible and load again, or use the bookmarklet under \"Load not working?\".";
  function htmlToLines(html) {
    var VIEWPORT_WIDTH = 1280;
    var BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 };
    var BREAKPOINT_ORDER = ["sm", "md", "lg", "xl", "2xl"];
    var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, HEAD: 1, SVG: 1, TITLE: 1, META: 1, LINK: 1, IFRAME: 1, CANVAS: 1, TEXTAREA: 1 };
    var BLOCK_TAGS = { ADDRESS: 1, ARTICLE: 1, ASIDE: 1, BLOCKQUOTE: 1, DETAILS: 1, DIALOG: 1, DIV: 1, DL: 1, DT: 1, DD: 1, FIELDSET: 1, FIGCAPTION: 1, FIGURE: 1, FOOTER: 1, FORM: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, HEADER: 1, HGROUP: 1, HR: 1, LI: 1, MAIN: 1, NAV: 1, OL: 1, P: 1, PRE: 1, SECTION: 1, TABLE: 1, UL: 1, TR: 1, CAPTION: 1, THEAD: 1, TBODY: 1, TFOOT: 1, SUMMARY: 1 };
    var DISPLAY_UTILITY = /^(hidden|block|inline|inline-block|flex|inline-flex|grid|inline-grid|table|contents|list-item|flow-root)$/;
    var doc = new DOMParser().parseFromString(html, "text/html");
    var lines = [];
    var cur = "";
    function flush() {
      var t = cur.replace(/[ \t\r\n\f]+/g, " ").trim();
      if (t) lines.push(t);
      cur = "";
    }
    function displayOf(el) {
      var display = BLOCK_TAGS[el.tagName] ? "block" : "inline";
      var classes = (el.getAttribute("class") || "").split(/\s+/);
      var bestRank = -1;
      for (var i = 0; i < classes.length; i++) {
        var m = classes[i].match(/^(?:(sm|md|lg|xl|2xl):)?(.+)$/);
        if (!m || !DISPLAY_UTILITY.test(m[2])) continue;
        if (m[1] && VIEWPORT_WIDTH < BREAKPOINTS[m[1]]) continue;
        var rank = m[1] ? 1 + BREAKPOINT_ORDER.indexOf(m[1]) : 0;
        if (rank > bestRank) { bestRank = rank; display = m[2]; }
      }
      return display;
    }
    function startsLine(display) {
      return display === "block" || display === "flex" || display === "grid" || display === "table" || display === "list-item" || display === "flow-root";
    }
    function isHidden(el, display) {
      if (el.hasAttribute("hidden") || display === "hidden") return true;
      var style = el.getAttribute("style") || "";
      if (/(^|;)\s*(display\s*:\s*none|visibility\s*:\s*hidden)/i.test(style)) return true;
      return (" " + (el.getAttribute("class") || "") + " ").indexOf(" invisible ") !== -1;
    }
    function walk(parent, parentIsFlex) {
      for (var n = parent.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) {
          if (parentIsFlex) { flush(); cur = n.data; flush(); } else cur += n.data;
          continue;
        }
        if (n.nodeType !== 1 || SKIP_TAGS[n.tagName]) continue;
        var display = displayOf(n);
        if (isHidden(n, display)) continue;
        if (n.tagName === "BR") { flush(); continue; }
        if (display === "contents") { walk(n, parentIsFlex); continue; }
        var ownLine = startsLine(display) || parentIsFlex;
        if (ownLine) flush();
        walk(n, display === "flex" || display === "inline-flex" || display === "grid" || display === "inline-grid");
        if (ownLine) flush();
      }
    }
    walk(doc.body, false);
    flush();
    return lines;
  }
  function parseCharacterTarget(input, defaultRegion) {
    var raw = String(input || "").trim();
    if (!raw) return { error: "Enter a character name or a Bible character link." };
    var region = LOAD_REGIONS.indexOf(defaultRegion) !== -1 ? defaultRegion : LOAD_REGIONS[0];
    var name = raw;
    if (/^(https?:\/\/|(www\.)?lostark\.bible(\/|$))/i.test(raw)) {
      var url;
      try { url = new URL(/^https?:/i.test(raw) ? raw : "https://" + raw); }
      catch (e) { return { error: "That link isn't valid." }; }
      var host = url.hostname.toLowerCase();
      if (host !== "lostark.bible" && host !== "www.lostark.bible") return { error: "Only lostark.bible character links work here." };
      var m = url.pathname.match(/^\/character\/([A-Za-z]{2,4})\/([^/]+)/);
      if (!m) return { error: "That isn't a character page link (it should look like lostark.bible/character/NA/Name)." };
      region = m[1].toUpperCase();
      try { name = decodeURIComponent(m[2]); }
      catch (e2) { return { error: "That link's character name isn't valid." }; }
    }
    name = name.trim();
    if (/[\/\\?#%\u0000-\u001f\u007f]/.test(name)) return { error: "Enter just the character name, or paste the full Bible link." };
    if (!name || name.length > 40) return { error: "That doesn't look like a character name." };
    return { region: region, name: name };
  }
  function characterPageUrl(target) {
    return BIBLE_ORIGIN + "/character/" + target.region + "/" + encodeURIComponent(target.name);
  }
  function characterDataUrl(target) {
    return characterPageUrl(target) + "/__data.json?x-sveltekit-invalidated=011";
  }
  function loadError(kind, message) {
    var err = new Error(message);
    err.kind = kind;
    return err;
  }
  function fetchFailure(err, viaProxy) {
    if (err && err.name === "AbortError") return loadError("aborted", "");
    if (viaProxy) {
      return loadError("blocked", "Couldn't reach the relay that loads Bible pages: the request was blocked or you're offline. Try again in a moment, or use \"Load not working?\" below.");
    }
    return loadError("blocked", "Bible doesn't let other sites read its pages (it sends no CORS headers), so the browser blocked this request. Use \"Load not working?\" below.");
  }
  function fetchCharacterSource(target, proxyUrl, signal) {
    var url = proxyUrl
      ? proxyUrl + (proxyUrl.indexOf("?") === -1 ? "?" : "&") + "region=" + encodeURIComponent(target.region) + "&name=" + encodeURIComponent(target.name)
      : characterDataUrl(target);
    return fetch(url, { credentials: "omit", referrerPolicy: "no-referrer", signal: signal }).then(function (res) {
      if (res.status === 404) throw loadError("notfound", "Bible has no character called \"" + target.name + "\" in " + target.region + ". Check the spelling and region.");
      if (res.status === 429) throw loadError("ratelimit", "Bible is limiting requests right now. Wait a minute and try again.");
      if (res.status === 504) throw loadError("http", "Bible didn't answer in time. Try again in a moment, or use \"Load not working?\" below.");
      if (!res.ok) throw loadError("http", "Bible answered with an error (HTTP " + res.status + ").");
      return res.text().catch(function (err) { throw fetchFailure(err, !!proxyUrl); });
    }, function (err) {
      throw fetchFailure(err, !!proxyUrl);
    });
  }
  function payloadFromData(body, expectedName) {
    var decoded = window.BibleDecode ? window.BibleDecode.decode(body) : null;
    if (!decoded) return { error: "Couldn't read Bible's character data (the decoder did not load)." };
    if (decoded.notDeathblade) return { error: "This doesn't look like a Deathblade - Bible import only supports Deathblade." };
    if (!decoded.ok) {
      if (/^no (loadouts|raid loadout)/.test(decoded.reason)) {
        return { error: "Bible has no loadout data for this character (it may be hidden or not refreshed yet). Open the character on Bible once, then try again." };
      }
      return { error: "Couldn't read Bible's character data (" + decoded.reason + "). Nothing was imported. Try again later, or use the bookmarklet on the character's Bible page." };
    }
    var payload = buildPayload("", null, true, undefined, decoded);
    if (payload.error) return payload;
    if (expectedName) payload.characterName = expectedName;
    return payload;
  }
  function payloadFromSource(html, expectedName) {
    if (html.length > MAX_SOURCE_CHARS) return { error: "That's too large to be a Bible character page." };
    if (window.BibleDecode && window.BibleDecode.isDataJson(html)) return payloadFromData(html, expectedName);
    if (html.indexOf("loadouts:[") === -1) {
      return { error: "No character data in Bible (the character may be hidden or still loading on Bible, or Bible sent a verification page). Open the character on Bible once, then try again or paste its page source." };
    }
    var decoded = window.BibleDecode ? window.BibleDecode.decode(html) : null;
    if (decoded && decoded.notDeathblade) return { error: "This doesn't look like a Deathblade - Bible import only supports Deathblade." };
    var payload = decoded && decoded.ok
      ? buildPayload(html, htmlToLines(html), true, undefined, decoded)
      : buildPayload(html, htmlToLines(html), undefined, FETCHED_UNCONFIRMED_WARNING);
    if (payload.error) {
      if (/fully loaded/.test(payload.error)) return { error: "Couldn't read a character from Bible. Check the name and region, try again, or try an alternate import method." };
      return payload;
    }
    if (decoded && !decoded.ok && payload.warnings) {
      payload.warnings.push("Bible's loadout data could not be read (" + decoded.reason + "), so the visible page was read instead.");
    }
    if (expectedName && payload.characterName && payload.characterName.toLowerCase() !== expectedName.toLowerCase()) {
      return { error: "Bible returned \"" + payload.characterName + "\" instead of \"" + expectedName + "\". Nothing was imported." };
    }
    return payload;
  }
  var LAST_IMPORT_KEY = "ap-calc-deathblade-v1-last-import";
  var IMPORT_WARNING_LIMIT = 3;
  var applyingPayload = false;
  function readLastImports() {
    try {
      var parsed = JSON.parse(localStorage.getItem(LAST_IMPORT_KEY));
      if (parsed && typeof parsed === "object") return parsed;
    } catch (e) {
    }
    return {};
  }
  function writeLastImports(all) {
    try {
      localStorage.setItem(LAST_IMPORT_KEY, JSON.stringify(all));
    } catch (e) {
    }
  }
  function importConcerns(payload) {
    var reasons = [];
    var warnings = payload.warnings || [];
    var other = 0;
    var chaos = false, noSnapshot = false;
    warnings.forEach(function (w) {
      if (/may be Chaos Dungeon|Couldn't confirm this was scanned/.test(w)) chaos = true;
      else if (/^No raid loadout snapshot/.test(w)) noSnapshot = true;
      else other++;
    });
    if (chaos) reasons.push("likely a Chaos Dungeon or unconfirmed loadout");
    if (noSnapshot) reasons.push("no raid snapshot on Bible");
    if (payload.data && payload.data["ap-gear-gem-base-ap"] === "0") reasons.push("no gems found");
    if (other >= IMPORT_WARNING_LIMIT) reasons.push(other + " other field warnings");
    return reasons;
  }
  function activePresetOf(root) {
    var btn = root.querySelector(".ap-calc-preset-active");
    var id = btn ? parseInt(btn.dataset.preset, 10) : NaN;
    return id >= 1 ? id : 1;
  }
  function renderLastImport(root, presetId) {
    var chip = root.querySelector(".bible-last-import");
    if (!chip) return;
    var entry = readLastImports()[String(presetId)];
    if (!entry || !entry.name) { chip.hidden = true; return; }
    var nameEl = chip.querySelector(".bible-last-import-name");
    var reasons = Array.isArray(entry.reasons) ? entry.reasons : [];
    var when = "";
    if (entry.at) {
      var d = new Date(entry.at);
      if (!isNaN(d.getTime())) when = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
    var tip = entry.name + (entry.region ? " (" + entry.region + ")" : "") + (when ? ", imported " + when : "") + ".";
    if (reasons.length) tip += " Check this import: " + reasons.join("; ") + ".";
    nameEl.textContent = entry.name;
    nameEl.setAttribute("title", tip);
    chip.classList.toggle("bible-last-import--warn", reasons.length > 0);
    chip.hidden = false;
  }
  function recordLastImport(root, payload) {
    if (!payload.characterName) return;
    var all = readLastImports();
    all[String(activePresetOf(root))] = {
      name: payload.characterName,
      region: payload.region || "",
      at: new Date().toISOString(),
      reasons: importConcerns(payload)
    };
    writeLastImports(all);
    renderLastImport(root, activePresetOf(root));
  }
  function clearLastImport(root, presetId) {
    var all = readLastImports();
    delete all[String(presetId)];
    writeLastImports(all);
    renderLastImport(root, presetId);
  }
  function wireLastImport(root) {
    var chip = root.querySelector(".bible-last-import");
    if (!chip || chip.__wired) return;
    chip.__wired = true;
    root.addEventListener("ap-calc:preset-change", function (ev) {
      var detail = ev.detail || {};
      if (applyingPayload) return;
      if (detail.reason === "reset" || detail.reason === "import") clearLastImport(root, detail.preset);
      else renderLastImport(root, detail.preset);
    });
    chip.querySelector(".bible-last-import-clear").addEventListener("click", function () {
      clearLastImport(root, activePresetOf(root));
      var openBtn = root.querySelector(".bible-load-open");
      if (openBtn) openBtn.focus();
    });
    renderLastImport(root, activePresetOf(root));
  }
  function currentFieldData(root) {
    var exportBtn = root.querySelector(".ap-calc-export");
    var popover = root.querySelector('.ap-calc-popover[data-popover="export"]');
    if (!exportBtn || !popover) return null;
    var data = null;
    exportBtn.click();
    try { data = JSON.parse(popover.querySelector(".ap-calc-popover-textarea").value).data || null; } catch (e) { data = null; }
    var closeBtn = popover.querySelector(".ap-calc-popover-close");
    if (closeBtn) closeBtn.click();
    else popover.hidden = true;
    exportBtn.blur();
    return data;
  }
  function keepCurrentValues(root, payload) {
    if (!payload.keepKeys || !payload.keepKeys.length) return;
    var current = currentFieldData(root);
    if (!current) {
      payload.warnings = payload.warnings || [];
      payload.warnings.push("Couldn't read the calculator's current values, so the fields named above are at their defaults, not as they were.");
      return;
    }
    payload.keepKeys.forEach(function (key) {
      if (key in current) payload.data[key] = current[key];
    });
  }
  function applyPayload(root, payload) {
    var statusEl = root.querySelector(".bible-import-status");
    function setStatus(text, isError) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.classList.toggle("bible-import-status-error", !!isError);
    }
    if (payload.error) { setStatus(payload.error, true); return false; }
    var importBtn = root.querySelector(".ap-calc-import");
    var popover = root.querySelector('.ap-calc-popover[data-popover="import"]');
    if (!importBtn || !popover) { setStatus("Import control not found on this page.", true); return false; }
    keepCurrentValues(root, payload);
    applyingPayload = true;
    try {
      importBtn.click();
      var textarea = popover.querySelector(".ap-calc-popover-textarea");
      textarea.value = JSON.stringify(payload.data);
      var loadBtn = popover.querySelector(".ap-calc-popover-load");
      loadBtn.click();
    } finally {
      applyingPayload = false;
    }
    var popoverMsgEl = popover.querySelector(".ap-calc-popover-msg");
    if (popoverMsgEl && popoverMsgEl.classList.contains("ap-calc-popover-msg-error") && popoverMsgEl.textContent) {
      payload.warnings = payload.warnings || [];
      payload.warnings.push(popoverMsgEl.textContent);
    }
    var closeBtn = popover.querySelector(".ap-calc-popover-close");
    if (closeBtn) closeBtn.click();
    else popover.hidden = true;
    importBtn.blur();
    var msg = payload.characterName ? "Imported " + payload.characterName + " from Bible." : "Imported from Bible.";
    if (payload.warnings && payload.warnings.length) msg += " " + payload.warnings.length + " field(s) need a manual look - see below.";
    setStatus(msg, false);
    var warnList = root.querySelector(".bible-import-warnings");
    if (warnList) {
      warnList.innerHTML = "";
      (payload.warnings || []).forEach(function (w) {
        var li = window.SiteUtils.el("li", null, w);
        warnList.appendChild(li);
      });
      warnList.hidden = !(payload.warnings && payload.warnings.length);
    }
    recordLastImport(root, payload);
    return true;
  }
  function applyBibleImport(root) {
    var hash = location.hash;
    if (hash.indexOf("#bible-import=") !== 0) return;
    var statusEl = root.querySelector(".bible-import-status");
    try {
      var decoded = decodeURIComponent(escape(atob(hash.slice("#bible-import=".length))));
      var payload = JSON.parse(decoded);
      history.replaceState(null, "", location.pathname + location.search);
      applyPayload(root, payload);
    } catch (e) {
      if (statusEl) {
        statusEl.textContent = "Couldn't read that import link (" + e.message + ").";
        statusEl.classList.add("bible-import-status-error");
      }
    }
  }
  function wireCharacterLoader(root, control) {
    var openBtn = control.querySelector(".bible-load-open");
    var popover = root.querySelector('.ap-calc-popover[data-popover="bible"]');
    if (!openBtn || !popover) return;
    var input = popover.querySelector(".bible-load-input");
    var regionSel = popover.querySelector(".bible-load-region");
    var goBtn = popover.querySelector(".bible-load-go");
    var msgEl = popover.querySelector(".ap-calc-popover-msg");
    var manual = popover.querySelector(".bible-load-manual");
    var sourceBox = popover.querySelector(".bible-load-source");
    var pasteBtn = popover.querySelector(".bible-load-paste");
    var pageLink = popover.querySelector(".bible-load-page-link");
    var busy = false;
    var controller = null;
    try {
      var savedRegion = localStorage.getItem(REGION_STORAGE_KEY);
      if (savedRegion && LOAD_REGIONS.indexOf(savedRegion) !== -1) regionSel.value = savedRegion;
    } catch (e) {
    }
    function setMsg(text, isError) {
      msgEl.textContent = text;
      msgEl.classList.toggle("ap-calc-popover-msg-error", !!isError);
    }
    function setBusy(on) {
      busy = on;
      goBtn.disabled = on;
      pasteBtn.disabled = on;
      input.readOnly = on;
    }
    function showPageLink(target) {
      if (pageLink) pageLink.href = characterDataUrl(target);
    }
    function deliver(result, target) {
      if (result.error) { setMsg(result.error, true); return; }
      try {
        setMsg("", false);
        if (target) {
          try { localStorage.setItem(REGION_STORAGE_KEY, target.region); } catch (e) {
          }
        }
        if (target && target.region) result.region = target.region;
        applyPayload(root, result);
        if (target && LOAD_REGIONS.indexOf(target.region) !== -1) regionSel.value = target.region;
      } catch (e) {
        setMsg("Couldn't apply that character (" + e.message + ").", true);
      }
    }
    openBtn.addEventListener("click", function () {
      root.querySelectorAll(".ap-calc-popover").forEach(function (p) { p.hidden = true; });
      setMsg("", false);
      popover.hidden = false;
      popover.__triggerEl = openBtn;
      input.focus();
    });
    new MutationObserver(function () {
      if (popover.hidden && controller) controller.abort();
    }).observe(popover, { attributes: true, attributeFilter: ["hidden"] });
    function loadByName() {
      if (busy) return;
      var target = parseCharacterTarget(input.value, regionSel.value);
      if (target.error) { setMsg(target.error, true); return; }
      if (LOAD_REGIONS.indexOf(target.region) !== -1) regionSel.value = target.region;
      showPageLink(target);
      var proxyUrl = (control.getAttribute("data-proxy") || "").trim();
      if (proxyUrl && !/^https:\/\//i.test(proxyUrl)) proxyUrl = "";
      setMsg("Loading " + target.name + " from Bible...", false);
      setBusy(true);
      var ctl = new AbortController();
      controller = ctl;
      var timedOut = false;
      var timer = setTimeout(function () { timedOut = true; ctl.abort(); }, LOAD_TIMEOUT_MS);
      function finishRequest() {
        clearTimeout(timer);
        if (controller === ctl) controller = null;
        setBusy(false);
      }
      fetchCharacterSource(target, proxyUrl, ctl.signal).then(function (html) {
        finishRequest();
        deliver(payloadFromSource(html, target.name), target);
      }, function (err) {
        finishRequest();
        if (err.kind === "aborted") {
          if (timedOut) setMsg("Bible didn't answer in time. Try again in a moment.", true);
          return;
        }
        setMsg(err.message, true);
        if (err.kind === "blocked" && manual) manual.open = true;
      });
    }
    function loadFromSource() {
      if (busy) return;
      var text = sourceBox.value.trim();
      if (!text) { setMsg("Paste the character data above first.", true); return; }
      setMsg("", false);
      var result;
      try { result = payloadFromSource(text, null); }
      catch (e) { result = { error: "Couldn't read that (" + e.message + ")." }; }
      deliver(result, null);
    }
    goBtn.addEventListener("click", loadByName);
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); loadByName(); }
    });
    function syncPageLink() {
      var t = parseCharacterTarget(input.value, regionSel.value);
      if (!t.error) showPageLink(t);
    }
    input.addEventListener("input", syncPageLink);
    regionSel.addEventListener("change", syncPageLink);
    pasteBtn.addEventListener("click", loadFromSource);
  }
  function renderBibleControl(root) {
    var control = root.querySelector(".bible-import-control");
    if (!control || control.__bibleWired) return;
    control.__bibleWired = true;
    var calculatorUrl = location.origin + location.pathname;
    var bookmarklet = root.querySelector(".bible-import-bookmarklet");
    var popoverMsg = root.querySelector('.ap-calc-popover[data-popover="bible"] .ap-calc-popover-msg');
    if (bookmarklet) {
      bookmarklet.href = buildBookmarklet(calculatorUrl);
      bookmarklet.addEventListener("click", function (e) {
        e.preventDefault();
        if (popoverMsg) {
          popoverMsg.textContent = "Drag this link to your bookmarks bar, then click it on a Bible character page.";
          popoverMsg.classList.remove("ap-calc-popover-msg-error");
        }
      });
    }
    wireCharacterLoader(root, control);
    wireNoticeClear(root, control);
    wireLastImport(root);
    applyBibleImport(root);
  }
  function wireNoticeClear(root, control) {
    var clearBtn = root.querySelector(".bible-import-clear");
    if (!clearBtn) return;
    clearBtn.addEventListener("click", function () {
      var statusEl = root.querySelector(".bible-import-status");
      var warnList = root.querySelector(".bible-import-warnings");
      if (statusEl) {
        statusEl.textContent = "";
        statusEl.classList.remove("bible-import-status-error");
      }
      if (warnList) {
        warnList.innerHTML = "";
        warnList.hidden = true;
      }
      var openBtn = control.querySelector(".bible-load-open");
      if (openBtn) openBtn.focus();
    });
  }
  window.SiteUtils.registerRenderer(".ap-calc", renderBibleControl);
})();
