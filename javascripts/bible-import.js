(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("bible-import.js");
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
  var GRID_BASE_TO_SLOT = {
    10001: "order_sun",
    10002: "order_moon",
    10003: "order_star",
    10004: "chaos_star",
  };
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
    if (!raid) return { noRaidLoadout: true, mainStat: null, weaponPower: null, weaponQuality: null, karma: null, gridPoints: {}, gridSlots: {} };
    var result = { mainStat: null, weaponPower: null, weaponQuality: null, karma: null, gridPoints: {} };
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
        result.gridSlots = {};
        cores.forEach(function (c) {
          var slot = GRID_BASE_TO_SLOT[c.base];
          if (slot) result.gridSlots[slot] = { id: c.id, points: result.gridPoints[c.id] };
        });
      } catch (e) { result.gridSlots = {}; }
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
  function buildPayload(rawHtml, lines, onRaidLoadoutConfirmed) {
    var hydration = extractLoadoutJSON(rawHtml);
    if (!hydration) return { error: "Couldn't find character data on this page - make sure you're on a Bible character page and it's fully loaded." };
    var classCheck = checkDeathbladeClass(lines);
    if (classCheck === "not-loaded") {
      return { error: "Couldn't confirm this is a Deathblade character page - make sure it's fully loaded and try again." };
    }
    if (classCheck === "wrong-class") {
      return { error: "This doesn't look like a Deathblade character - Bible import only supports Deathblade." };
    }
    var characterName = extractCharacterName(lines);
    var text = parseVisibleText(lines);
    var data = {};
    var warnings = [];
    if (hydration.noRaidLoadout) {
      warnings.push("No raid loadout snapshot found for this character - Weapon Power, Main Stat, Crit Stat, and Karma couldn't be auto-filled from that source. Chaos Grid core grades are read independently from the page HTML, so they're unaffected. Accessories, bracelet, gems, engravings, and ability stone were still read from the page text below; fill in the rest manually.");
    }
    if (hydration.weaponPower != null) data["ap-gear-wp"] = String(hydration.weaponPower);
    if (hydration.mainStat != null) data["ap-gear-main-stat"] = String(hydration.mainStat);
    if (hydration.critStat != null) data["ap-crit-stat"] = String(hydration.critStat);
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
    if (text.hasArkGrid && text.chaosCores) {
      Object.keys(text.chaosCores).forEach(function (slotLabel) {
        var core = text.chaosCores[slotLabel];
        var target = CHAOS_CORE_FIELDS[core.name];
        if (!target) {
          return;
        }
        var hydrationCore = hydration.gridSlots && hydration.gridSlots[CHAOS_SLOT_TO_KEY[slotLabel]];
        if (hydrationCore && hydrationCore.points != null && hydrationCore.points !== core.points) {
          warnings.push(slotLabel + ": page text says " + core.points + "P but the page's own data (most-recent-raid snapshot) says " + hydrationCore.points + "P - kept the page text's " + core.points + "P since that reflects what's currently equipped; the snapshot can be stale. Worth a second look if this doesn't match what you expect.");
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
        var grade = findChaosGrade(rawHtml, gradeKey);
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
    } else {
      warnings.push("Couldn't find Order Sun/Moon cores on this page (Order Grid not equipped, or a read failure) - Build wasn't auto-set, verify it matches your actual build manually.");
    }
    if (text.hasArkGrid && hydration.gridSlots) {
      Object.keys(CHAOS_SLOT_TO_KEY).forEach(function (slotLabel) {
        var hydrationCore = hydration.gridSlots[CHAOS_SLOT_TO_KEY[slotLabel]];
        if (hydrationCore && hydrationCore.points > 0 && !text.chaosCores[slotLabel]) {
          warnings.push(slotLabel + ": the page's own data shows " + hydrationCore.points + "P invested here, but this file couldn't read a core name for it from the page text - left unset, pick it manually.");
        }
      });
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
    var onRaidLoadout = onRaidLoadoutConfirmed != null ? onRaidLoadoutConfirmed : text.onRaidLoadoutText;
    if (!onRaidLoadout) {
      warnings.unshift("Couldn't confirm this was scanned from \"Raid Loadout\" (auto-switch may have failed or hadn't finished rendering yet). Weapon Power/Main Stat/karma/grid points are always read correctly either way, but accessories, bracelet, gems, engravings, and Ark Grid core names may reflect the wrong loadout tab - click \"Raid Loadout\" on the character page yourself and re-run if any of those look off.");
    }
    return { data: data, warnings: warnings, characterName: characterName };
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
      findChaosGrade, dumpArkGridMarkers, parseStatLine, scanAccessoryBlock, firstPct,
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
      "var GRID_BASE_TO_SLOT=" + JSON.stringify(GRID_BASE_TO_SLOT) + ";",
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
  function applyBibleImport(root) {
    var hash = location.hash;
    if (hash.indexOf("#bible-import=") !== 0) return;
    var statusEl = root.querySelector(".bible-import-status");
    function setStatus(text, isError) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.classList.toggle("bible-import-status-error", !!isError);
    }
    try {
      var decoded = decodeURIComponent(escape(atob(hash.slice("#bible-import=".length))));
      var payload = JSON.parse(decoded);
      history.replaceState(null, "", location.pathname + location.search);
      if (payload.error) { setStatus(payload.error, true); return; }
      var importBtn = root.querySelector(".ap-calc-import");
      var popover = root.querySelector('.ap-calc-popover[data-popover="import"]');
      if (!importBtn || !popover) { setStatus("Import control not found on this page.", true); return; }
      importBtn.click();
      var textarea = popover.querySelector(".ap-calc-popover-textarea");
      textarea.value = JSON.stringify(payload.data);
      var loadBtn = popover.querySelector(".ap-calc-popover-load");
      loadBtn.click();
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
    } catch (e) {
      setStatus("Couldn't read that import link (" + e.message + ").", true);
    }
  }
  function renderBibleControl(root) {
    var control = root.querySelector(".bible-import-control");
    if (!control || control.__bibleWired) return;
    control.__bibleWired = true;
    var calculatorUrl = location.origin + location.pathname;
    var bookmarklet = control.querySelector(".bible-import-bookmarklet");
    var statusEl = control.querySelector(".bible-import-status");
    if (bookmarklet) {
      bookmarklet.href = buildBookmarklet(calculatorUrl);
      bookmarklet.addEventListener("click", function (e) {
        e.preventDefault();
        if (statusEl) {
          statusEl.textContent = "Drag this to your bookmarks bar, then click it on a Bible character page.";
          statusEl.classList.remove("bible-import-status-error");
        }
      });
    }
    applyBibleImport(root);
  }
  window.SiteUtils.registerRenderer(".ap-calc", renderBibleControl);
})();
