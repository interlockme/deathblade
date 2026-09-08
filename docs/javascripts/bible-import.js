// FORK GUIDE: DEATHBLADE-SPECIFIC. Reads a lostark.bible character page and
// hands its data to ark-passive-calculator.js's own Import mechanism. If
// your fork's calculator has different field ids/tiers, the tables below
// (NECKLACE_TABLE, EARRING_WP_TABLE, etc.) are the only things you need to
// re-derive - the extraction logic itself is not class-specific.
//
// ARCHITECTURE
// The calculator never talks to lostark.bible, and lostark.bible never
// talks back to us. A bookmarklet runs entirely in the browser on the
// already-loaded, already-refreshed Bible page, builds a small JSON
// payload, and redirects to this calculator page with that payload
// base64'd into the URL fragment (#bible-import=...). A fragment never
// leaves the browser (it isn't sent to either server), so this adds zero
// load to Bible or to GitHub Pages. On load, this file checks the
// fragment, decodes it, and feeds it straight into the calculator's
// existing Import popover - the exact same code path a person pasting
// exported JSON would hit, so every bit of its validation (unknown/
// renamed option values are just skipped rather than corrupting a field)
// applies here too. This file does not write to calculator inputs itself.
//
// WHERE THE DATA COMES FROM
// Two sources on the Bible page, matched against a saved copy of a real
// character page - see the two functions below for specifics:
//   - extractLoadoutJSON(): a SvelteKit hydration payload embedded in a
//     <script> tag (present in the raw page source, not tooltip-gated) -
//     used for raw Weapon Power/Main Stat, weapon quality, karma, and
//     each Ark Grid core's exact point total.
//   - parseVisibleText(): the page's rendered text - used for accessory/
//     bracelet % rolls, astrogem levels, engraving node counts, and
//     ability stone levels. Bible renders each stat as ONE combined line
//     ("Additional Damage +1.6%"), confirmed against two real character
//     dumps - see parseVisibleText's own header comment for the details.
//
// KNOWN GAPS (deliberately left unfilled rather than guessed)
//   - Order Grid cores (skill-based, not a fixed universal type) aren't
//     imported - the calculator doesn't model them at all.
//   - Chaos Moon (Absorbing Strike, Smoldering Strike, and Crushing
//     Strike are the three Moon-slot cores; Crushing is the only one
//     modeled) is read out of the page but never written anywhere:
//     confirmed its "currently equipped" state isn't used by any live
//     calculation, only by the comparison-sandbox rows (which compute
//     every grade/point combo regardless of what's actually equipped),
//     so there's nothing to import it into.
//   - Chaos Grid core GRADE (Relic vs Ancient) isn't in the page's text or
//     hydration data anywhere - only encoded as an icon background-color
//     gradient (see findChaosGrade). The two gradients below were decoded
//     against one real character and cross-checked against this
//     calculator's own already-filled-in defaults (ap-gear-ap-chaos-star
//     was already "Relic|20P" - matches). Marker detection had a real bug
//     early on (a stray trailing "_" meant the marker never matched at
//     all - see findChaosGrade's own comment) which is now fixed and
//     confirmed working against two separate real characters. If Bible
//     ever ships a third grade or changes these colors, an unrecognized
//     gradient is left as null and that core's grade is simply not
//     imported (see CHAOS_GRADE_COLORS).
//   - Main Stat % (ap-gear-main-stat-pct - Stronghold Pet + Skins bonus,
//     see its label in resources.md) is never written by this file at
//     all, deliberately - it isn't shown anywhere on a Bible character
//     page (pet/skin cosmetics aren't gear data), so there's nothing to
//     read it from. Whatever value is already sitting in that field is
//     left untouched by an import, same as any other field this file
//     doesn't produce data for.

(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("bible-import.js");

  // ----- Tier tables (must match resources.md's <option> values exactly -
  //       these are read from the calculator's real markup, not guessed) -----
  var NECKLACE_TABLE = { None: 0, Low: 0.7, Mid: 1.6, High: 2.6 };
  var EARRING_WP_TABLE = { None: 0, Low: 0.8, Mid: 1.8, High: 3 };
  var EARRING_AP_TABLE = { None: 0, Low: 0.4, Mid: 0.95, High: 1.55 };
  var RING_RATE_TABLE = { None: 0, Low: 0.4, Mid: 0.95, High: 1.55 };
  var RING_DMG_TABLE = { None: 0, Low: 1.1, Mid: 2.4, High: 4 };
  var BRACE_RATE_TABLE = { None: 0, Low: 3.4, Mid: 4.2, High: 5 };
  var BRACE_DMG_TABLE = { None: 0, Low: 6.8, Mid: 8.4, High: 10 };
  var BRACE_ADD_A_TABLE = { None: 0, Low: 3, Mid: 3.5, High: 4 };
  var BRACE_ADD_B_TABLE = { None: 0, Low: 2.5, Mid: 3, High: 3.5 };
  // Accessory Flat AP has no lookup table here - ap-gear-flat-ap takes a
  // raw number (not a tiered select), so observed values are summed
  // directly in buildPayload instead of snapped to Low/Mid/High first.

  // Diagnostic side-channel, set by extractLoadoutJSON and read only by
  // bookmarkletBody's console.log - see the comment where it's assigned.
  var LAST_LOADOUT_CANDIDATES = null;
  var LAST_ARK_GRID_CORES_RAW = null;

  // Ark Grid core icon background-color -> grade. See "KNOWN GAPS" above.
  var CHAOS_GRADE_COLORS = {
    "#3d3325, #dcc999": "Ancient",
    "#341a09, #a24006": "Relic",
  };

  // base id -> slot, fixed by the game (not by which skill/effect is
  // socketed) - confirmed against a real character's hydration data.
  var GRID_BASE_TO_SLOT = {
    10001: "order_sun",
    10002: "order_moon",
    10003: "order_star",
    10004: "chaos_sun",
    10005: "chaos_moon",
    10006: "chaos_star",
  };

  function tierMatch(table, value) {
    if (value == null || isNaN(value)) return null;
    var best = null;
    var bestDiff = 0.06; // real rolls land exactly on a tier; this just absorbs float noise
    for (var key in table) {
      var diff = Math.abs(table[key] - value);
      if (diff < bestDiff) { bestDiff = diff; best = key; }
    }
    return best;
  }

  // Every *_TABLE select in the calculator's own HTML defaults to "High"
  // (its best-case preview state for a fresh visitor), NOT "None" - so a
  // field that tierMatch can't resolve must never be left unassigned in
  // `data`. Leaving it unassigned means applyFieldData never touches that
  // select, so it silently keeps showing "High"/4.00% as if it were real
  // equipped data, when it's actually just the page's own placeholder.
  // This covers two distinct cases the same way: value is null (the
  // substat genuinely isn't present on this item - no warning needed,
  // None is simply correct) and value is a real number that doesn't land
  // on any tier (quality-scaled roll below the lowest tier, OCR-ish
  // misread, etc - worth a warning so it can be picked manually).
  function tierMatchOrNone(table, value, label, warnings) {
    var match = tierMatch(table, value);
    if (match) return match;
    if (value != null && !isNaN(value)) {
      warnings.push(label + ": observed " + value + "% doesn't match any known tier - defaulted to None, pick it manually if this looks wrong.");
    }
    return "None";
  }

  // ----- Hydration JSON extraction -----
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

  // Finds the <script> holding the SvelteKit hydration payload and pulls
  // out the raid loadout's mainStat/weaponPower/weapon quality/karma/grid
  // core points. Returns null if the page doesn't look like a Bible
  // character page (so callers can fail loudly instead of half-importing).
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
    // Diagnostic only - never read by buildPayload's actual field logic,
    // only surfaced to the console (see bookmarkletBody) so a wrong-loadout
    // match can be root-caused from real console output instead of another
    // guess. Stashed on a side variable (rather than changing what this
    // function returns on the "no raid found" path) so existing behavior
    // for that error case is untouched. Records every loadout the page's
    // hydration data knows about, not just the one we matched.
    LAST_LOADOUT_CANDIDATES = loadoutObjs.map(function (o) {
      var clsM = o.match(/classification:"([^"]*)"/);
      return {
        classification: clsM ? clsM[1] : null,
        hasBattlePoint: o.indexOf("battlePoint:{") !== -1,
        hasGridCores: o.indexOf("arkGridCores:[") !== -1,
      };
    });

    // No "most_recent_raid" loadout snapshot exists for this character -
    // common for alts/inactive characters who've never entered that raid.
    // This is NOT the same failure as "couldn't find the hydration payload
    // at all" (the two return-null cases above, still hard fails): here the
    // page loaded fine and most of buildPayload's fields (accessories,
    // bracelet, gems, engravings) come from visible text and don't need
    // this object at all. Return an explicit sentinel with an empty-but-
    // present shape (gridSlots included) so buildPayload can degrade
    // gracefully - warn and continue - instead of hard-failing the whole
    // import over fields that were never going to be available anyway.
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
      } catch (e) { /* leave fields null - caller decides what to do with a partial result */ }
    }

    var agcIdx = raid.indexOf("arkGridCores:[");
    if (agcIdx !== -1) {
      var agcStart = agcIdx + "arkGridCores:".length;
      var agcEnd = findBalanced(raid, agcStart, "[", "]");
      try {
        var cores = JSON.parse(jsonish(raid.slice(agcStart, agcEnd)));
        // Diagnostic only, same idea as LAST_LOADOUT_CANDIDATES above - the
        // grade (Relic/Ancient) lookup below only has icon background-color
        // to go on (see findChaosGrade/CHAOS_GRADE_COLORS), which is why it
        // comes back null/unset for some cores. Grade is very likely just a
        // field on each of these raw core objects already (game data - not
        // guessing this, just haven't seen a real one to confirm the field
        // name), so this exposes the FULL untouched objects (every field,
        // not just base/id/points) to the console instead of only the
        // slot/id/points this function actually keeps - if grade's in
        // there, the field name should be visible directly instead of
        // requiring another guess.
        LAST_ARK_GRID_CORES_RAW = cores;
        result.gridSlots = {}; // slot name -> { id, points }
        cores.forEach(function (c) {
          var slot = GRID_BASE_TO_SLOT[c.base];
          if (slot) result.gridSlots[slot] = { id: c.id, points: result.gridPoints[c.id] };
        });
      } catch (e) { result.gridSlots = {}; }
    }

    var karmaM = raid.match(/karma:\{evolution:(\d+),enlightenment:(\d+),leap:(\d+)\}/);
    if (karmaM) result.karma = { evolution: +karmaM[1], enlightenment: +karmaM[2], leap: +karmaM[3] };

    // Top-level per-character stats array (sibling of items/battlePoint,
    // found right after items closes: "],stats:[...]"). Numeric type
    // codes aren't documented anywhere, but type 15 was verified against
    // a real character's Combat Stats panel (Crit 658/Specialization
    // 1830/Domination 79/Swiftness 77/Endurance 71/Expertise 75 all
    // matched types 15-20 in sequence) - only 15 (Crit) is used here.
    // A plain raid.indexOf("],stats:[") searches the WHOLE raid object,
    // including inside items - and each equipped item likely carries its
    // own per-item substat array in a similar shape, which could contain
    // the same "],stats:[" text (or even its own type:15 entry, giving a
    // plausible-looking but wrong crit number) earlier in the string than
    // the real character-level one. Anchoring the search to start only
    // after the top-level items array closes rules that out - the real
    // stats array is a sibling of items, so it can only appear at or
    // after that point.
    var itemsIdx = raid.indexOf("items:[");
    var statsSearchFrom = 0;
    if (itemsIdx !== -1) {
      var itemsStart = itemsIdx + "items:".length;
      var itemsEnd = findBalanced(raid, itemsStart, "[", "]");
      // findBalanced returns one PAST items' own closing "]" - the real
      // "],stats:[" match starts AT that "]", so back up by one or it (and
      // every decoy we're trying to skip) gets excluded together.
      if (itemsEnd !== -1) statsSearchFrom = itemsEnd - 1;
    }
    var statsIdx = raid.indexOf("],stats:[", statsSearchFrom);
    // Diagnostic only - crit stat has no visible-text cross-check anywhere
    // else on the page (unlike WP/main stat, which are also shown as plain
    // text, or grid points, which get compared against the page text in
    // buildPayload), so a wrong value here would go completely unnoticed
    // otherwise. Also note itemsIdx above is raid.indexOf's FIRST match -
    // if some earlier sibling field (e.g. battlePoint) ever turns out to
    // nest its own "items:[" substring, itemsEnd would anchor to that decoy
    // instead of the real top-level items array, silently reintroducing
    // the exact failure mode this anchoring was built to avoid. This dump
    // exposes enough (both index positions and the actual parsed array) to
    // tell a correct-but-surprising value apart from a genuinely wrong one
    // on the next real run, instead of guessing from the final number alone.
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
      } catch (e) { /* leave critStat unset */ }
    }

    return result;
  }

  // Diagnostic side-channel, same idea as LAST_ARK_GRID_CORES_RAW - the raw
  // arkGridCores hydration objects confirmed to have NO grade/tier/rarity
  // field at all (checked a real dump: each core is just {id, base, gems:
  // [...]}), so Relic/Ancient really can only come from this icon-color
  // decode, not from data. Kept for future debugging, not because this is
  // currently failing - records, per slot, whether the marker string was
  // even found, what gradient colors (if any) turned up in the 1000-char
  // window before it, and what CHAOS_GRADE_COLORS did with the last one,
  // so a future failure's exact point (marker not found vs. no gradient
  // in range vs. an unrecognized color) is visible instead of just the
  // pass/fail this function returns.
  var LAST_CHAOS_GRADE_DEBUG = {};
  function findChaosGrade(rawHtml, slot) {
    // Was "emoticon_arkgrid_" + slot + "_" (trailing underscore, expecting
    // something like emoticon_arkgrid_chaos_sun_relic.png). Confirmed via
    // dumpArkGridMarkers against a real page that the actual filename is
    // "emoticon_arkgrid_chaos_sun.png" - slot name goes straight into
    // ".png", no trailing underscore, no grade encoded in the filename
    // itself. That extra "_" was the whole markerFound:false bug seen
    // during the original investigation below - fixed here, and confirmed
    // resolving correctly (markerFound:true, gradient found, grade
    // resolved) against two separate real characters since.
    var idx = rawHtml.indexOf("emoticon_arkgrid_" + slot);
    if (idx === -1) { LAST_CHAOS_GRADE_DEBUG[slot] = { markerFound: false }; return null; }
    var windowStr = rawHtml.slice(Math.max(0, idx - 1000), idx);
    var matches = windowStr.match(/linear-gradient\(135deg, ([^)]+)\)/g);
    if (!matches || !matches.length) {
      // Hasn't recurred since the marker fix above, but if it does: capture
      // a slice of windowStr's tail (rather than just the empty-array
      // pass/fail) so the actual markup immediately before the marker is
      // visible in one shot instead of requiring another guess-and-recheck
      // round trip.
      LAST_CHAOS_GRADE_DEBUG[slot] = { markerFound: true, gradientsInWindow: [], windowTail: windowStr.slice(-300) };
      return null;
    }
    var lastColor = matches[matches.length - 1].match(/linear-gradient\(135deg, ([^)]+)\)/)[1];
    var grade = CHAOS_GRADE_COLORS[lastColor] || null;
    LAST_CHAOS_GRADE_DEBUG[slot] = { markerFound: true, gradientsInWindow: matches, lastColor: lastColor, resolvedGrade: grade };
    return grade;
  }

  // Diagnostic only, kept for future debugging - not a sign of an open
  // problem. This is the tool that found the original bug: an earlier
  // version of findChaosGrade's marker string had a trailing "_" that
  // never matched the real page, coming back markerFound:false for every
  // Chaos slot on a real character. Scanning the raw HTML
  // case-insensitively for the broader substring "arkgrid" (so it
  // survives a rename of the "emoticon_" prefix or the trailing "_")
  // and keeping a chunk of surrounding text around each of the first few
  // hits, so the CURRENT naming is visible directly in the console
  // instead of requiring another guess.
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

  // ----- Visible-text extraction -----
  // CONFIRMED against two real innerText dumps (280 lines / 243 lines) -
  // see bible-import.js's git history for the raw dumps if this ever needs
  // re-deriving. Bible renders each stat as ONE combined line, e.g.
  // "Additional Damage +1.6%" or "Atk. Power +80" (never a bare label line
  // followed by a separate value line - that was a wrong guess in an
  // earlier version of this file and silently broke every field below).
  // Each armor piece and its paired accessory render together as one row:
  // Head->Necklace, Shoulder/Chest->Earring x2, Pants/Gloves->Ring x2,
  // Weapon->Stone. Row shape is "<Slot> +N T4[ +refine]", quality number,
  // item level, then "<Accessory> T4", quality number, "+N" (rerolls),
  // then that accessory's substat lines until the next accessory header.
  function parseStatLine(line) {
    // "Additional Damage +1.6%" -> {label:"Additional Damage", value:1.6,
    // isPct:true}. Requires a label before the +/-, so bare quality/reroll
    // lines like "98" or "+13" (no label) correctly don't match.
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

  // Splits a bracelet effect-description line on ". " - a single rendered
  // line can carry more than one clause, e.g. "Crit Damage +6.8%. Crit Hit
  // Damage +1.5%." or "Additional Damage +2.5%. Bonus vs. Demon/Archdemon
  // +2.5%." (real addB wording, confirmed from a relic bracelet).
  //
  // Only clauses matching "<label> +N%" are extracted, and only 4 labels
  // are ever routed anywhere (Crit Rate/Crit Damage/Crit Hit Damage/
  // Additional Damage - see buildPayload's CHAOS_CORE_FIELDS-adjacent
  // bracelet block). This is deliberate, not a gap: legacy T3-only
  // effect lines like "Superiority: On successful hit against a foe,
  // Damage +2.5%. (Less effective against foes above Lv. 60)" or
  // "Circulate: ..." (confirmed from a real T3 bracelet) don't match
  // this label-then-percent shape at all - no "+N%" clause with a plain
  // label immediately before it - so they fall out of `parts.forEach`
  // silently. The calculator's bracelet model is T4-effect-only; T3
  // bracelets are scanned for their (tier-agnostic) flat Crit/rate/dmg/
  // addA/addB lines same as any other bracelet, but their T3-specific
  // named effects have no equivalent to import into and are correctly
  // left unparsed, not lost due to a bug.
  function parseBraceClauses(line) {
    var parts = (line || "").split(/\.\s+/).map(function (s) { return s.replace(/\.$/, "").trim(); }).filter(Boolean);
    var out = [];
    parts.forEach(function (p) {
      var m = p.match(/^(.+?) ([+-][\d.]+)%$/);
      if (m) out.push([m[1], parseFloat(m[2])]);
    });
    return out;
  }


  // Walks the whole visible page once and returns every field we know how
  // to read from rendered text. `lines` is document.body.innerText split
  // and trimmed - matches what a live page (not just a saved copy) gives.
  function parseVisibleText(lines) {
    var out = {};

    // "Current Loadout (Raid)" / "Current Loadout (Chaos Dungeon)" turned
    // out NOT to track which tab is currently rendered - confirmed wrong:
    // clicking the "Raid Loadout" button (auto or by hand) switches the
    // displayed equipment/gems/engravings data, but this header text keeps
    // showing whatever loadout is the ACCOUNT's stored default, forever,
    // regardless of which tab is actually on screen. Real consequence: for
    // any character whose default is Chaos Dungeon, this literal string
    // never appears even after successfully switching to Raid, so a check
    // built on it produces a false "couldn't confirm" warning on every
    // single run. Kept here as a diagnostic-only field (still logged to
    // console) - buildPayload's actual onRaidLoadout decision no longer
    // reads this; see bookmarkletBody, which instead checks whether the
    // "Raid Loadout" button itself is still present (that button's
    // presence/absence is what's actually confirmed reliable, since it's
    // the same signal findRaidLoadoutButton already uses to decide whether
    // to click at all). Also treats a bare "Estimated Raid Loadout" line as
    // a hit - Bible shows this label instead when the account is missing
    // gem data for the real raid loadout, and this diagnostic field is
    // meant to reflect "some form of raid loadout text is present," not
    // one exact literal string.
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

    // Accessory block boundaries: every "<Necklace|Earring|Ring|Stone|
    // Bracelet> T<n>" header, plus the first "Gems" header (which ends the
    // Bracelet block - there's no accessory header after it). A block runs
    // from its own header to the next boundary after it.
    // Tier digit is a wildcard (T\d), NOT hardcoded to T4 - confirmed real
    // gap: a character who upgraded gear/accessories to T4 can still be
    // carrying an old, never-replaced T3 bracelet or ability stone (the
    // "hasn't played in forever" case), which is common enough to hit, not
    // a rare edge case. With T4 hardcoded, "Bracelet T3"/"Stone T3" never
    // matched the header regex at all, so braceIdx/stoneIdx came back -1 -
    // not "no bracelet/stone equipped" (which is a real, already-handled
    // state) but "this entire block, including its real Crit/engraving
    // values, was never even looked at." Confirmed against a real
    // character: "Bracelet T3" with a real "Crit +90" line sitting right
    // after it was silently skipped, and "Stone T3" with a real "Keen
    // Blunt Weapon"/"Lv.2" pair was too - same root cause, two silent
    // misses. This can also legitimately happen on necklace/earring/ring
    // (upgraded unevenly), so all five slots use the wildcard, not just
    // the two that were actually caught in a real dump.
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

    // Weapon quality: the number right after the "Weapon +N T<n>[ +refine]"
    // row header (matches the same "<quality>, <item level>" shape every
    // other armor slot uses - confirmed 100 for a real +21 T4 weapon).
    // Same tier-wildcard fix as ACCESSORY_HEADER_RE above - a weapon can
    // equally be an unreplaced lower tier.
    var weaponIdx = idxOfRegex(/^Weapon \+\d+ T\d/);
    if (weaponIdx !== -1) {
      var wq = parseInt(lines[weaponIdx + 1], 10);
      if (!isNaN(wq)) out.weaponQuality = wq;
    }

    // Necklace
    var neckIdx = idxOfRegex(/^Necklace T\d/);
    var accessoryBlocks = [];
    if (neckIdx !== -1) {
      var neck = scanAccessoryBlock(lines, neckIdx + 1, blockEnd(neckIdx));
      out.necklaceAddDmg = firstPct(neck, "Additional Damage");
      accessoryBlocks.push(neck);
    }

    // Earrings (2 occurrences)
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

    // Rings (2 occurrences)
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

    // Accessory Flat AP: an occasional substat on any of the 5 above
    // (distinct from Earring's own "Atk. Power +X%" roll - this is a flat
    // number, no %). Confirmed against a real example: "Atk. Power +80"
    // as a bare integer line. Deliberately does NOT match a flat "Weapon
    // Power +N" line (also a real, separate substat, confirmed up to
    // +480) - the calculator has no equipped-state field for that at all,
    // only isolated manual what-if comparisons, so there's nothing to
    // import it into.
    out.flatApLines = [];
    accessoryBlocks.forEach(function (block) {
      block.flat.forEach(function (pair) {
        if (pair[0] === "Attack Power" || pair[0] === "Atk. Power") out.flatApLines.push(pair[1]);
      });
    });

    // Gems: a flat list of "Lv. N" lines after the first "Gems" header,
    // one per socketed gem (unaffected by the combined-line fix - this
    // block's format was never label+value). Summed via the calculator's
    // own Base AP% tooltip table. Levels 6-10 confirmed against the
    // calculator's own tooltip and cross-checked against a real loadout
    // (11x Lv.6 gems -> 4.95, matches). Levels 1-5 added from the same
    // tooltip (Lv.1: no bonus, Lv.2 +0.05%, Lv.3 +0.10%, Lv.4 +0.20%,
    // Lv.5 +0.30%) - previously missing, so any gem below Lv.6 silently
    // fell through the "|| 0" below and undercounted a character's real
    // (if small) AP bonus instead of being a genuine 0. Not a rare case:
    // same "low investment / hasn't played in a while" characters that
    // hit the karma/bracelet-tier gaps above can just as easily be
    // running low-level gems, not only missing ones entirely.
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


    // Ability Stone: right after "Stone T4" (no quality/reroll line first,
    // unlike the 5 accessories above), "<Engraving>" / "Lv.N" pairs - no
    // space after "Lv." here, unlike the Gems/astrogem "Lv. N" (with
    // space). This is the stone's own point contribution per engraving,
    // confirmed against the "9/7 stone = 3+2" rule from a real "Grudge"/
    // "Lv.3" + "Ambush Master"/"Lv.2" pair (sums to 5). Read directly from
    // here rather than the equipped-Engravings-list "+N" suffix below,
    // since a stone can boost an engraving that isn't in the current
    // equipped 5 (confirmed: one real character's stone boosted Grudge/
    // Ambush Master, neither of which was in their equipped list).
    var stoneIdx = idxOfRegex(/^Stone T\d/);
    out.engravingStonePoints = {};
    if (stoneIdx !== -1) {
      var stoneEnd = blockEnd(stoneIdx);
      for (var si = stoneIdx + 1; si + 1 < stoneEnd; si += 2) {
        var lvM = (lines[si + 1] || "").match(/^Lv\.(\d+)$/);
        if (lvM) out.engravingStonePoints[lines[si]] = +lvM[1];
      }
    }

    // Bracelet: "Bracelet T4", a reroll-count line ("No rolls remaining" /
    // "N+M rolls remaining"), then up to 3 lines that are each EITHER a
    // flat combat-stat line ("Crit +111", "Specialization +90", etc, no
    // description) OR an effect-description line (no preceding stat, e.g.
    // "Movement Skill/Stand Up cooldown -6%.") OR both back to back (stat
    // line immediately followed by its description line) - confirmed all
    // three shapes appear on real characters, so don't assume fixed
    // pairing; just classify each line independently.
    var braceIdx = idxOfRegex(/^Bracelet T\d/);
    if (braceIdx !== -1) {
      var braceEnd = blockEnd(braceIdx);
      var i0 = braceIdx + 1;
      if (/rolls remaining/i.test(lines[i0] || "")) i0++;
      var rateList = [], dmgList = [], addAList = [], addBList = [], dualCount = 0, critStat = null;
      for (var bi2 = i0; bi2 < braceEnd; bi2++) {
        // Regex matches all 6 flat combat-stat lines a bracelet can roll
        // (Crit/Specialization/Swiftness/Domination/Endurance/Expertise),
        // but only Crit is ever stored - confirmed intentional, not a
        // gap: the calculator has exactly one importable field for a
        // bracelet's flat stat (ap-brace-crit-stat-equipped, used to
        // remove the bracelet's Crit Stat from a no-bracelet baseline).
        // Its Specialization counterpart (ap-brace-spec-build) is a
        // build-type dropdown (RE 111/313/333, Surge 111/222/333), not a
        // raw-number field - there's nothing to import a flat "Specialization
        // +N" line into, so Swiftness/Domination/Endurance/Expertise are
        // matched here only so they fall through to `continue` instead of
        // being misread as an effect-description clause below.
        var statM = (lines[bi2] || "").match(/^(Crit|Specialization|Swiftness|Domination|Endurance|Expertise) \+(-?\d+)$/);
        if (statM) {
          if (statM[1] === "Crit") critStat = parseInt(statM[2], 10);
          continue;
        }
        var clauses = parseBraceClauses(lines[bi2]);
        for (var ci = 0; ci < clauses.length; ci++) {
          var label = clauses[ci][0], val = clauses[ci][1];
          if (label === "Crit Rate") rateList.push(val);
          else if (label === "Crit Damage") dmgList.push(val);
          else if (label === "Crit Hit Damage") dualCount++;
          else if (label === "Additional Damage") {
            // Bare "Additional Damage +X%" is addA; a following clause on
            // the SAME line naming Demon/Archdemon makes it addB instead -
            // confirmed exact wording "Bonus vs. Demon/Archdemon +Y%"
            // against a real relic bracelet.
            var nextClause = clauses[ci + 1];
            if (nextClause && /Demon\/Archdemon/i.test(nextClause[0])) addBList.push(val);
            else addAList.push(val);
          }
        }
      }
      out.braceCritStat = critStat;
      out.braceRateLines = rateList;
      out.braceDmgLines = dmgList;
      out.braceDualHitDmgCount = dualCount;
      out.braceAddA = addAList;
      out.braceAddB = addBList;
    }

    // Astrogem summary (the 6 "Lv.NN" + "<Stat> +X%" line pairs under Ark
    // Grid). Each stat line is combined ("Attack Power +1.68%"), so match
    // by prefix rather than the old exact "Attack Power" equality check.
    // NOTE: "Ark Grid" also appears a second time later, as a row label in
    // the score-breakdown section ("Ark Grid" / "+X.XX%") - that one
    // exists on every character, unlocked or not, so idxOf("Ark Grid")
    // alone can't tell "no Ark Grid" apart from "breakdown row only, no
    // equipment section". Distinguish by what follows: the real equipment
    // header is followed by a bare number (an Order core's skill number)
    // or a core name, never a "+X%" line - confirmed against real dumps
    // (280-line: "Ark Grid"/"3"/...; 243-line, no Ark Grid equipped: the
    // only "Ark Grid" line is the breakdown one, followed by "+0.00%").
    // A THIRD shape exists too: some no-Ark-Grid characters render an
    // explicit "This character has no Ark Grid cores equipped." message
    // right after the equipment-section "Ark Grid" header (confirmed on a
    // real 238-line dump) - that message doesn't end in "%" either, so the
    // old check above misread it as an equipped section and set hasArkGrid
    // true. Check for this message first and short-circuit to false before
    // falling back to the number/name heuristic.
    var NO_ARK_GRID_MSG = "This character has no Ark Grid cores equipped.";
    var agIdx = -1;
    if (idxOf(NO_ARK_GRID_MSG) === -1) {
      for (var agScan = 0; agScan < lines.length; agScan++) {
        if (lines[agScan] === "Ark Grid" && !/%$/.test(lines[agScan + 1] || "")) { agIdx = agScan; break; }
      }
    }
    out.hasArkGrid = agIdx !== -1; // false = character has no Ark Grid unlocked at all,
    // so astrogemApLv/astrogemAddDmgLv/chaosCores below are never populated
    // for it either. buildPayload defaults astrogem/chaos-core fields to
    // 0/None unconditionally (not gated on this flag) precisely because a
    // character CAN have hasArkGrid true with those same fields empty
    // (Order Grid unlocked, nothing socketed/Chaos-equipped yet) - see
    // buildPayload's own comment for the real case that caught this.
    var cardsIdx = idxOf("Cards", agIdx);
    for (var a = agIdx; a !== -1 && a < (cardsIdx === -1 ? lines.length : cardsIdx); a++) {
      var lvM2 = (lines[a] || "").match(/^Lv\. (\d+)$/);
      if (!lvM2) continue;
      var nextLine = lines[a + 1] || "";
      if (/^Attack Power \+/.test(nextLine)) out.astrogemApLv = +lvM2[1];
      if (/^Additional Damage \+/.test(nextLine)) out.astrogemAddDmgLv = +lvM2[1];
    }

    // Chaos Grid core names. Each Chaos slot (Sun/Moon/Star) can hold any
    // of 6 generic cores (see the "Chaos Cores (Generic)" reference table -
    // Sun: Flashy Attack/Stable Attack/Swift Attack/Faith Enhancement/
    // Flowing Magick/Fortitude Enhancement; Moon: Smoldering Strike/
    // Absorbing Strike/Crushing Strike/Echoing Brand/Echoing Death/Echoing
    // Steel; Star: Attack/Weapon/Speed/Defense/Life/Salvation) - which one
    // is actually equipped has to be read per-character, never assumed.
    // Rendered as "<name>\n<points>\n|\n<slot>" with no leading number
    // (Order slots have a leading skill-tripod-ish number Chaos slots
    // don't). This part was already confirmed correct against real data -
    // unchanged.
    out.chaosCores = {};
    ["Chaos Sun", "Chaos Moon", "Chaos Star"].forEach(function (slotLabel) {
      var slotIdx = idxOf(slotLabel, agIdx);
      if (slotIdx === -1 || lines[slotIdx - 1] !== "|") return;
      var ptM = (lines[slotIdx - 2] || "").match(/^(\d+)$/);
      var name = lines[slotIdx - 3];
      if (ptM && name) out.chaosCores[slotLabel] = { name: name, points: +ptM[1] };
    });

    // Engravings: the equipped-5 list, "Name" / "P/20" pairs (also
    // unaffected by the combined-line fix - this block's format was never
    // label+value). This walk doesn't skip ahead a fixed number of lines
    // per engraving, so it stays in sync even when an engraving has an
    // extra "+N" line after it (a stone-boost indicator that only appears
    // when the boosted engraving happens to be in this equipped-5 list -
    // engravingStonePoints above is the complete, unconditional source,
    // this "+N" is not used for that anymore).
    var engHeaderIdx = idxOfNth("Engravings", 1); // 2nd occurrence = the real section, 1st is a stat total
    out.engravings = {};
    if (engHeaderIdx !== -1) {
      for (var e = engHeaderIdx + 1; e < engHeaderIdx + 20 && e + 1 < lines.length; e++) {
        var ptM = (lines[e + 1] || "").match(/^(\d+)\/20$/);
        if (ptM) out.engravings[lines[e]] = +ptM[1];
      }
    }

    return out;
  }

  // ----- Payload assembly -----
  // Class check status for a Bible character page. Deliberately does NOT
  // maintain a list of every class name (Lost Ark keeps adding new ones,
  // e.g. Artist/Valkyrie already exist and more will keep shipping) - it
  // only ever needs to answer "is this specifically a Deathblade," so it
  // just looks for the literal line "Deathblade" in a window just above
  // the first "Combat Power" line (confirmed from a real dump: the class
  // name renders as its own standalone line, shortly before the character
  // name and "Combat Power," e.g. "Central Europe" / "Arcturus" /
  // "Deathblade" / "Bladea" / "Combat Power"). Returns:
  //   "not-loaded" - no "Combat Power" line found at all, meaning the page
  //     hasn't finished rendering - fails safe rather than trying to import
  //     from partial data.
  //   "wrong-class" - "Combat Power" was found (page did load) but
  //     "Deathblade" isn't in the window above it, so this is confirmed to
  //     be some other class - whichever one, current or future, without
  //     needing to know its name.
  //   "deathblade" - confirmed match.
  function checkDeathbladeClass(lines) {
    var cpIdx = -1;
    for (var i = 0; i < lines.length; i++) { if (lines[i] === "Combat Power") { cpIdx = i; break; } }
    if (cpIdx === -1) return "not-loaded";
    var windowStart = Math.max(0, cpIdx - 6);
    for (var j = cpIdx - 1; j >= windowStart; j--) {
      if (lines[j] === "Deathblade") return "deathblade";
    }
    return "wrong-class";
  }

  // Character name: the line directly after "Deathblade" (the class line
  // checkDeathbladeClass already located), NOT the line directly above
  // "Combat Power" - those are only the same line when the character has
  // no equipped title. When a title IS equipped, the layout is
  // "...Deathblade / <name> / <title> / Combat Power", so anchoring off
  // "Combat Power" grabs the title instead (confirmed from a real dump:
  // ".../Deathblade/ẞroselike/Monarch of the Bitter Cold/Combat Power"
  // was importing as "Monarch of the Bitter Cold"). Anchoring off
  // "Deathblade" instead works in both cases, since the name always comes
  // right after the class line whether or not a title follows it. Returns
  // null if "Combat Power" isn't present at all, or if "Deathblade" isn't
  // found in the window above it; checkDeathbladeClass already rejects
  // the latter as "wrong-class"/"not-loaded" separately before this runs,
  // this is just belt-and-suspenders.
  function extractCharacterName(lines) {
    var cpIdx = -1;
    for (var i = 0; i < lines.length; i++) { if (lines[i] === "Combat Power") { cpIdx = i; break; } }
    if (cpIdx <= 0) return null;
    var windowStart = Math.max(0, cpIdx - 6);
    for (var j = cpIdx - 1; j >= windowStart; j--) {
      if (lines[j] === "Deathblade") return lines[j + 1] || null;
    }
    return null;
  }

  function buildPayload(rawHtml, lines, onRaidLoadoutConfirmed) {
    var hydration = extractLoadoutJSON(rawHtml);
    if (!hydration) return { error: "Couldn't find character data on this page - make sure you're on a Bible character page and it's fully loaded." };

    // Class check: reject anything that isn't confirmed as a Deathblade,
    // rather than letting Deathblade-specific field parsing run against a
    // different class's page and silently produce half-matched garbage.
    // Confirmed real cases this needs to cover: a real non-Deathblade
    // (e.g. Berserker, Artist) character page, and a page that hasn't
    // fully loaded yet (no "Combat Power" line to anchor off at all) -
    // both get rejected, not just the clearly-wrong-class case.
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
      warnings.push("No raid loadout snapshot found for this character - Weapon Power, Main Stat, Crit Stat, Karma, and Chaos Grid core grades couldn't be auto-filled from that source. Accessories, bracelet, gems, engravings, and ability stone were still read from the page text below; fill in the rest manually.");
    }

    if (hydration.weaponPower != null) data["ap-gear-wp"] = String(hydration.weaponPower);
    if (hydration.mainStat != null) data["ap-gear-main-stat"] = String(hydration.mainStat);
    if (hydration.critStat != null) data["ap-crit-stat"] = String(hydration.critStat);
    // Weapon quality: default to "0" (nothing to report), then overwrite if
    // a weapon-slot quality reading was actually found. Same bug family as
    // astrogem/bracelet/Chaos-core above: the calculator's own HTML default
    // for this field is "100" (its best-case preview state), so a character
    // scanned with no weapon equipped - confirmed to genuinely happen (rare,
    // but real; they'd still have Weapon Power from other sources) - would
    // otherwise leave the field unwritten and looking like a perfect-quality
    // weapon, or silently keep whatever a previous import left there.
    data["ap-weapon-quality"] = "0";
    if (text.weaponQuality != null) data["ap-weapon-quality"] = String(text.weaponQuality);

    // Karma: default both fields to their explicit "not unlocked" values
    // first, then overwrite if the hydration payload actually has a karma
    // object. Same bug family again - confirmed common (not just a rare
    // edge case) for low-investment or long-inactive characters who haven't
    // cleared the unlock raid at all: hydration.karma is then simply absent
    // (the regex in extractLoadoutJSON never matches, so karmaM is null and
    // result.karma stays null), not present-with-zeros. The old code left
    // both fields completely unwritten in that case - and both of the
    // calculator's own HTML defaults are best-case ("30" for Enlightenment
    // Level, "6" selected for Leap Rank), so an un-unlocked character would
    // silently look maxed instead of unlocked-nothing.
    data["ap-gear-wp-karma-lv"] = "0";
    data["ap-evo-karma"] = "1";
    if (hydration.karma) {
      data["ap-gear-wp-karma-lv"] = String(hydration.karma.enlightenment);
      // Karmic Leap Rank breakpoints, confirmed: rank 1 is free (level 1),
      // then +4 levels per rank (1/5/9/13/17/21 for ranks 1-6) - i.e.
      // rank = floor((level-1)/4) + 1, capped at 6.
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

    // Bracelet fields all default to their explicit "nothing here" value
    // first (mirroring the astrogem/Chaos-core fix above), then get
    // overwritten by whatever's actually found. This has to cover TWO
    // separate gaps, not just one: (1) a character with literally no
    // bracelet equipped (braceIdx === -1 in parseVisibleText, so
    // braceCritStat/braceRateLines/etc. are all left undefined) leaves
    // every one of these fields unwritten with the old code; (2) even
    // WITH a bracelet equipped, ap-bracelet-addA/addB had NO fallback at
    // all (unlike -rate/-dmg's "|| None") - a relic bracelet very
    // commonly rolls only one of the two Additional Damage types, or
    // neither, which hit gap (2) on every run for a large fraction of
    // real bracelets.
    data["ap-brace-crit-stat-equipped"] = text.braceCritStat != null ? String(text.braceCritStat) : "0";
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
    // A dual-effect Crit Hit Damage line follows each Crit Rate/Crit Damage
    // line it's paired with - if we saw at least as many "Crit Hit Damage"
    // lines as bracelet lines that can carry one, both are dual.
    if (text.braceDualHitDmgCount != null) {
      data["ap-crit-rate-dual"] = text.braceDualHitDmgCount >= 1;
      data["ap-crit-dmg-dual"] = text.braceDualHitDmgCount >= 2;
    }
    if (text.braceAddA && text.braceAddA.length) data["ap-bracelet-addA"] = tierMatch(BRACE_ADD_A_TABLE, text.braceAddA[0]) || "None";
    if (text.braceAddB && text.braceAddB.length) data["ap-bracelet-addB"] = tierMatch(BRACE_ADD_B_TABLE, text.braceAddB[0]) || "None";

    // Astrogem levels: default to "0" (nothing socketed), then overwrite
    // if a real "Lv. N" line was found. This must NOT be gated on
    // text.hasArkGrid - Order Grid, Chaos Grid, and astrogems unlock
    // roughly in that order, so a character can easily have hasArkGrid
    // true (Order Sun/Star filled in) with zero astrogems socketed and
    // zero Chaos cores equipped. That's exactly hasArkGrid===true with
    // astrogemAddDmgLv/astrogemApLv both undefined - confirmed against a
    // real dump ("Bladel": Order Sun + Order Star only, no astrogem or
    // Chaos Sun/Moon/Star lines anywhere in the visible text). Gating this
    // on hasArkGrid left both fields completely absent from the payload in
    // that case, so applyFieldData never touched them and the calculator
    // kept whatever was left over from a PREVIOUS import/character - a
    // real "using previous settings" bug, not a display quirk.
    data["ap-astrogem-lv"] = text.astrogemAddDmgLv != null ? String(text.astrogemAddDmgLv) : "0";
    data["ap-gear-ap-astrogem-lv"] = text.astrogemApLv != null ? String(text.astrogemApLv) : "0";

    // Same reasoning applies to the Chaos core fields: default every one
    // of them to its explicit "nothing equipped" value up front (instead
    // of leaving the calculator's own HTML defaults - e.g.
    // ap-gear-ap-chaos-star's default is literally "Relic|20P" - sitting
    // there looking like real equipped data), then let the per-core loop
    // below overwrite whichever ones are actually equipped. Previously
    // these were only defaulted in the !hasArkGrid branch, so the same
    // "Order cores but no Chaos cores yet" character (hasArkGrid true,
    // text.chaosCores === {}) got none of these six fields set either.
    data["ap-flashy-atk"] = "None";
    data["ap-stable-atk"] = "None|0P";
    data["ap-swift-core"] = "None|0P";
    data["ap-crushing-core"] = "None|0P";
    data["ap-gear-ap-chaos-star"] = "None|0P";
    data["ap-gear-weapon-core"] = "None|0P";

    // Chaos Grid cores. Order cores are skill-based and unsupported (see
    // parseVisibleText's comment) - hydration.gridSlots.order_* is never
    // read here. For Chaos, slot position (Sun/Moon/Star) does NOT fix
    // which core is equipped - each slot picks from its own set of 6
    // generic cores, and only some of the 18 total are modeled as
    // "currently equipped" fields (the rest, like Absorbing Strike, only
    // have comparison-sandbox math - see ARK_ABSORBING_DMG_TABLE). Route
    // by the core's actual name, not by which slot it's in.
    var CHAOS_CORE_FIELDS = {
      "Flashy Attack": { field: "ap-flashy-atk", format: "space17" },
      "Stable Attack": { field: "ap-stable-atk", format: "pipe", mergedAt14: true },
      "Swift Attack": { field: "ap-swift-core", format: "pipe", mergedAt14: true },
      "Crushing Strike": { field: "ap-crushing-core", format: "pipe", mergedAt14: true },
      "Attack": { field: "ap-gear-ap-chaos-star", format: "pipe", mergedAt14: true, mergedAt10: true },
      "Weapon": { field: "ap-gear-weapon-core", format: "pipe", mergedAt14: true },
    };
    var CHAOS_SLOT_TO_KEY = { "Chaos Sun": "chaos_sun", "Chaos Moon": "chaos_moon", "Chaos Star": "chaos_star" };
    if (text.hasArkGrid && text.chaosCores) {
      Object.keys(text.chaosCores).forEach(function (slotLabel) {
        var core = text.chaosCores[slotLabel];
        var hydrationCore = hydration.gridSlots && hydration.gridSlots[CHAOS_SLOT_TO_KEY[slotLabel]];
        if (hydrationCore && hydrationCore.points != null && hydrationCore.points !== core.points) {
          warnings.push(slotLabel + ": page text says " + core.points + "P but the page's own data says " + hydrationCore.points + "P - used the page data (" + hydrationCore.points + "P), but this mismatch is worth a second look.");
          core.points = hydrationCore.points;
        }
        var target = CHAOS_CORE_FIELDS[core.name];
        if (!target) {
          // Not a bug and not actionable - the calculator only models
          // damage-relevant core types (see KNOWN GAPS at the top of this
          // file), so a core like Chaos Moon's "Absorbing Strike"/"Smoldering
          // Strike" is expected to hit this branch on every single import,
          // forever. A warning here was pure noise: it fired unconditionally
          // for anyone running an unmodeled core, telling them nothing they
          // could act on. Silently skip instead - console dump below still
          // shows chaosCores in full for anyone who wants to double check.
          return;
        }
        if (target.mergedAt14 && core.points === 14) {
          // Stable Attack's 14P tier is a single "Any|14P" option in
          // resources.md (Legend/Relic/Ancient all pay out identically at
          // 14P - see STABLE_ATK_TABLE) - write it directly and skip grade
          // detection entirely. This isn't just a shortcut: CHAOS_GRADE_
          // COLORS only has hex entries for Relic/Ancient, so a genuinely
          // Legendary core here would otherwise ALWAYS fail findChaosGrade
          // and hit the "couldn't read grade" warning below, even though
          // the value it needs to write never depended on grade at all.
          data[target.field] = "Any|14P";
          return;
        }
        if (target.mergedAt10 && core.points === 10) {
          // Chaos Core: Attack's 10P tier is also a single "Any|10P" option
          // in resources.md (grade doesn't affect the payout at 10P, only
          // 14P has a dedicated merged option elsewhere) - same shortcut as
          // the mergedAt14 branch above, and for the same reason: skip grade
          // detection entirely rather than risk a spurious "couldn't read
          // grade" warning for a value that never depended on grade.
          data[target.field] = "Any|10P";
          return;
        }
        if (target.format === "space17" && core.points < 17) {
          // ap-flashy-atk only tracks Crit Hit Dmg, confirmed to only move
          // at 10P/17P (nothing changes at 14P or 18-20P), and its options
          // (see resources.md) don't even offer a Relic/Ancient choice below
          // 17P - the only lower bucket selectable at all is "Epic-Leg 10P".
          // So below 17 points, write that bucket regardless of the core's
          // actual Relic/Ancient grade (mechanically identical to Epic/Leg
          // at that point total, and there's no more precise option to pick
          // anyway) - and skip grade detection entirely, since a genuinely
          // Legendary/Epic core here would otherwise always fail
          // findChaosGrade (CHAOS_GRADE_COLORS only has Relic/Ancient hexes)
          // and produce a spurious "couldn't read grade" warning for a value
          // that never depended on grade in the first place.
          data[target.field] = "Epic-Leg 10P";
          return;
        }
        var grade = findChaosGrade(rawHtml, CHAOS_SLOT_TO_KEY[slotLabel]);
        if (!grade) {
          warnings.push(slotLabel + " (" + core.name + ", " + core.points + "P): couldn't read its grade (Relic/Ancient) from the page - left unset, pick it manually.");
          return;
        }
        if (target.format === "space17") {
          // At this point core.points >= 17 (the <17 case returned above),
          // so write the real grade's "17P" option.
          data[target.field] = grade + " 17P";
        } else {
          data[target.field] = grade + "|" + core.points + "P"; // applyFieldData no-ops if this exact option doesn't exist
        }
      });
    }

    // Engravings - only Adrenaline/Keen Blunt Weapon have equipped-node
    // fields; everything else in your list (Grudge, Ambush Master, etc.)
    // isn't modeled by this calculator and is silently skipped. Default
    // both node-count fields (and their ability-stone counterparts below)
    // to "0" first - same reasoning as the astrogem/bracelet fixes above:
    // a character simply not running Adrenaline or Kbw at all is a normal,
    // common state (most builds only run one of the two, if either), and
    // the old code left the field completely unwritten in that case.
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

      // ap-gear-ability-stone-base-ap (the +1.5% Base AP checkbox): the
      // old "9/7 or 10/6" naming in the code comment and the "sum >= 5"
      // rule are the same threshold, just old vs current terminology
      // (9/7 = 3+2, 10/6 = 4+1, both sum to 5) - confirmed, so this is
      // now safe to set directly instead of just warning about it.
      var stoneSum = 0;
      for (var k in text.engravingStonePoints) stoneSum += text.engravingStonePoints[k];
      data["ap-gear-ability-stone-base-ap"] = stoneSum >= 5;
    }

    data["ap-gear-gem-base-ap"] = text.gemBaseApSum != null ? String(text.gemBaseApSum) : "0";

    // Accessory Flat AP: the field takes any raw number (not a tiered
    // select), so the individually-observed values are summed directly
    // rather than snapped to Low/Mid/High first. Defaults to "0" rather
    // than being left unset - same reasoning as everything above.
    var flatApSum = (text.flatApLines || []).reduce(function (a, b) { return a + b; }, 0);
    data["ap-gear-flat-ap"] = String(flatApSum);

    // KNOWN GAP: hydration.* fields (Weapon Power, Main Stat, Crit Stat,
    // karma, grid core points) always come from the raid loadout's embedded
    // JSON regardless of which tab is showing - but everything in `text`
    // (accessories, bracelet, gems, engravings, ability stone, astrogems,
    // chaos core names) is scraped from document.body.innerText, i.e.
    // whatever loadout tab is CURRENTLY RENDERED. bookmarkletBody auto-
    // clicks the "Raid Loadout" button when present and re-scans before
    // building this payload, then confirms the switch actually took by
    // checking whether that button is now gone (see its own comment) -
    // that confirmed result is passed in as onRaidLoadoutConfirmed rather
    // than trusted from text.onRaidLoadoutText, which does NOT reflect the
    // active tab (it's the account's stored default loadout label and
    // never changes on click - confirmed false-positive on every run for
    // any Chaos-Dungeon-default character, even after switching by hand).
    // When called without that DOM-verified signal (e.g. replaying a saved
    // dump with no live page to check), fall back to the old text check
    // rather than silently assuming success.
    var onRaidLoadout = onRaidLoadoutConfirmed != null ? onRaidLoadoutConfirmed : text.onRaidLoadoutText;
    if (!onRaidLoadout) {
      warnings.unshift("Couldn't confirm this was scanned from \"Raid Loadout\" (auto-switch may have failed or hadn't finished rendering yet). Weapon Power/Main Stat/karma/grid points are always read correctly either way, but accessories, bracelet, gems, engravings, and Ark Grid core names may reflect the wrong loadout tab - click \"Raid Loadout\" on the character page yourself and re-run if any of those look off.");
    }

    return { data: data, warnings: warnings, characterName: characterName };
  }

  // ----- Bookmarklet (runs on lostark.bible) -----
  // Kept as a plain function turned into a string at render time so its
  // source always matches this file - no separately-maintained copy to
  // drift out of sync.
  function bookmarkletBody(calculatorUrl) {
    // Confirmed root cause (2 real reports, both matching): navigating
    // between characters on lostark.bible client-side (its own in-page
    // links, e.g. search -> character, or character -> character) does
    // NOT necessarily replace the SSR-rendered <script> tag that
    // extractLoadoutJSON reads mainStat/weaponPower/critStat/karma/grid
    // points out of, even though document.body.innerText (everything in
    // `text`, incl. accessories AND the Chaos Grid core names/points read
    // from visible text) does update correctly. Second report caught this
    // directly: Chaos Sun/Moon/Star read 2P/3P/10P from the page's own
    // visible text (correct, matches this character) but the hydration
    // blob claimed 20P/20P/18P for the same three slots - numbers that
    // look like a different, more-invested character's grid, not a
    // parsing/indexing slip within one character's data. A real full
    // reload of the current URL always re-fetches and re-renders from the
    // server, which regenerates that script tag for whichever character
    // the URL actually points at - so force exactly one before the first
    // scan of any given character URL. sessionStorage is keyed by
    // location.href so re-running the bookmarklet again on the SAME
    // already-fresh page doesn't reload a second time.
    try {
      var RELOAD_KEY = "bibleImportReloadedFor";
      if (sessionStorage.getItem(RELOAD_KEY) !== location.href) {
        sessionStorage.setItem(RELOAD_KEY, location.href);
        alert("Bible import: refreshing this page first to make sure its data is current - click the bookmarklet again once it reloads.");
        location.reload();
        return;
      }
    } catch (e) {
      // sessionStorage blocked (private browsing, etc) - can't guard
      // against staleness this way, so just scan as before rather than
      // failing the whole import over it.
    }
    // Split into a scan step (run once immediately, and again after an
    // auto-click + re-render wait if the first pass wasn't on Raid
    // Loadout) so the click-and-wait path can share the exact same
    // finish/redirect logic as the no-click-needed path.
    function currentLines() {
      return document.body.innerText.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
    }
    function finish(lines, onRaidLoadoutConfirmed) {
      var html = document.documentElement.outerHTML;
      var payload = window.__buildBiblePayload(html, lines, onRaidLoadoutConfirmed);
      // Diagnostic dump - runs on every use, costs nothing, and means a
      // wrong-loadout or missing-field report can be root-caused from
      // real console output instead of a hand-copied screenshot. Open
      // devtools on this Bible page BEFORE clicking the bookmarklet to
      // catch it (the page navigates away right after).
      if (window.console && console.log) {
        // Logged first and separately from the rest: if hydration data ever
        // carries over from a previously-viewed character (suspected cause -
        // a client-side route change on lostark.bible may not replace the
        // SSR-rendered hydration <script> tag that extractLoadoutJSON reads,
        // even though document.body.innerText does update), this line plus
        // the mainStat/weaponPower/critStat values below are what prove it:
        // two different character URLs producing identical hydration
        // numbers is the smoking gun. Not yet confirmed against a real
        // repro - see the comment on the "carries over from a previous
        // character" report.
        console.log("[Bible import] page at scan time: " + location.href + " (title: " + document.title + ")");
        console.log("[Bible import] loadout candidates seen on this page:\n" + JSON.stringify(window.__lastLoadoutCandidates(), null, 2));
        // Full, untouched Ark Grid core objects for the raid loadout - see
        // where LAST_ARK_GRID_CORES_RAW is set for why (looking for a grade
        // field to replace the icon-color decode in findChaosGrade/
        // CHAOS_GRADE_COLORS, which is currently coming back null for some
        // cores).
        console.log("[Bible import] raw Ark Grid core objects (raid loadout):\n" + JSON.stringify(window.__lastArkGridCoresRaw(), null, 2));
        // Per-Chaos-slot breakdown of the icon-color grade decode - see
        // where LAST_CHAOS_GRADE_DEBUG is set for what each field means.
        console.log("[Bible import] Chaos Grid grade decode debug:\n" + JSON.stringify(window.__lastChaosGradeDebug(), null, 2));
        // One-shot broader scan for "arkgrid" (case-insensitive) - only
        // meaningful when the debug above shows markerFound:false for a
        // slot, meaning findChaosGrade's exact literal isn't in the page
        // at all anymore. See dumpArkGridMarkers for why this is broader
        // than that literal. Not a side effect of buildPayload (unlike the
        // other LAST_* diagnostics above) so it's called explicitly here.
        window.__dumpArkGridMarkers(html);
        console.log("[Bible import] raw \"arkgrid\" marker scan (case-insensitive, first 8 hits with context):\n" + JSON.stringify(window.__lastArkGridMarkerDump(), null, 2));
        // Crit stat has no visible-text cross-check anywhere else on the
        // page (unlike WP/main stat, or grid points, which do get one in
        // buildPayload) - see where LAST_CRIT_STAT_DEBUG is set for why
        // this exists and what a wrong statsArr match would look like.
        console.log("[Bible import] crit stat extraction debug:\n" + JSON.stringify(window.__lastCritStatDebug(), null, 2));
        console.log("[Bible import] final data sent to calculator:\n" + JSON.stringify(payload.data, null, 2));
        console.log("[Bible import] warnings:\n" + JSON.stringify(payload.warnings, null, 2));
        // Dumps exactly what parseVisibleText scans (document.body.innerText,
        // split/trimmed/filtered the same way) - this is what actually
        // decides whether Necklace/Earring/Ring/Bracelet/Ark Grid get
        // found, so seeing it directly beats guessing at page structure.
        console.log("[Bible import] raw visible text lines (" + lines.length + " total):\n" + JSON.stringify(lines, null, 2));
      }
      if (payload.error) { alert("Bible import: " + payload.error); return; }
      var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      location.href = calculatorUrl + "#bible-import=" + encoded;
    }
    // Finds the button that switches to the raid loadout by its visible
    // text rather than its id/aria-describedby (confirmed those are
    // machine-generated per page load, e.g. id="WiXNl_rmIb" - not a stable
    // selector). Only present at all when Chaos Dungeon (or some other
    // loadout) is the active tab; when Raid is already active there's no
    // such button to find, which is fine since no click is needed then.
    // This presence/absence is also the ONLY signal this file trusts for
    // "did the switch land" - the "Current Loadout (X)" header text looked
    // like it should track this too, but confirmed it doesn't: it's the
    // account's stored default loadout and never changes when you click
    // this button, by hand or via auto-click, so a Chaos-Dungeon-default
    // character warned on every single run even after a real, successful
    // switch. Switched to button-presence instead, on the theory that the
    // button itself disappears once its own switch has landed - but a real
    // report shows THIS still warns every single time on a Chaos-Dungeon-
    // default character too, which means that theory is also wrong: most
    // likely this button is a static tab (always present, whichever
    // loadout is active) rather than a one-shot "switch to X" action, same
    // underlying mistake as the header text. Rather than reach for a THIRD
    // guessed heuristic and risk the same failure again, this now dumps the
    // actual evidence needed to pick a real signal: the button's own
    // markup/attributes before and after the click, AND whether the page's
    // visible text changed at all - see the console dump in finish's caller
    // below for what each field means.
    function findRaidLoadoutButton() {
      var buttons = document.querySelectorAll("button");
      for (var i = 0; i < buttons.length; i++) {
        var t = (buttons[i].textContent || "").trim();
        // Bible shows "Estimated Raid Loadout" instead of "Raid Loadout"
        // when the account is missing gem data for the real raid loadout
        // and has to reconstruct an estimate - same switch action, just a
        // different label. Missing this match entirely would have meant:
        // button not found -> treated as "already confirmed on Raid" (see
        // below) on a character that's actually still showing Chaos
        // Dungeon data, silently importing the wrong loadout as if
        // confirmed. Not yet confirmed against a real dump whether the
        // exact string is "Estimated Raid Loadout" verbatim or something
        // close to it - if this still misses on a real gem-missing
        // character, the diagnostic dump below (before/after button
        // markup) will show the real button text directly.
        if (t === "Raid Loadout" || t === "Estimated Raid Loadout") return buttons[i];
      }
      return null;
    }
    // Diagnostic only: outerHTML/class/aria-* of the "Raid Loadout" button
    // (or null if not found), so its ACTUAL markup - not just whether the
    // exact text "Raid Loadout" is present somewhere - is visible. If this
    // button is a static tab, some attribute on it (aria-selected, a
    // "active"/"current" class, aria-current) almost certainly reflects
    // which loadout is really showing, and would be a better signal than
    // presence/absence of the button itself.
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
        // Give the tab switch a moment to re-render before re-scanning -
        // this whole function already runs synchronously right up to
        // this point, so there's nothing else to wait on here.
        setTimeout(function () {
          try {
            var linesAfter = currentLines();
            var btnAfter = findRaidLoadoutButton();
            var afterDescribe = describeRaidButton(btnAfter);
            // NOT button presence/absence - a real before/after dump showed
            // this button is a static tab that never disappears; clicking
            // it just adds "bg-neutral-800" to its own className (before:
            // "btn border border-neutral-800 ", after: "btn border
            // border-neutral-800 bg-neutral-800"). `!btnAfter` was
            // therefore ALWAYS false (the button is always found), so the
            // "couldn't confirm" warning fired unconditionally regardless
            // of whether the switch actually worked - this checks the
            // class the click itself was observed to add instead.
            var confirmed = !!(btnAfter && (" " + btnAfter.className + " ").indexOf(" bg-neutral-800 ") !== -1);
            if (window.console && console.log) {
              console.log("[Bible import] Raid Loadout button before click:\n" + JSON.stringify(beforeDescribe, null, 2));
              console.log("[Bible import] Raid Loadout button after click+wait:\n" + JSON.stringify(afterDescribe, null, 2));
              // If this is "false" (visible text is byte-identical before
              // and after the click), the click did nothing at all -
              // no re-render happened in that 400ms window, and `confirmed`
              // above will correctly be false too since the class never
              // changed. If "true" but confirmed is still false, the page
              // DID re-render but this button's class didn't flip to
              // "bg-neutral-800" the way it did in every dump seen so far -
              // worth a look at afterDescribe above to see what it shows
              // instead.
              console.log("[Bible import] visible text changed after click: " + (lines.join("\n") !== linesAfter.join("\n")));
            }
            finish(linesAfter, confirmed);
          }
          catch (e) { alert("Bible import failed: " + e.message); }
        }, 400);
        return;
      }
      // No "Raid Loadout" button at all - either already on Raid (the
      // common case, and correctly treated as confirmed) or the button
      // markup changed and it can't be found at all (rare, and this can't
      // tell the two apart) - unlike the old header-text check, there's no
      // known false-positive here, so this is treated as confirmed.
      finish(lines, true);
    } catch (e) {
      alert("Bible import failed: " + e.message);
    }
  }

  // Strips // line comments and /* */ block comments out of source text
  // before it's inlined into the bookmarklet, then drops now-empty lines.
  // This file's functions are heavily commented (that's deliberate - see
  // the top-of-file comment about why), but every one of those comments
  // still gets carried word-for-word into the javascript: URL otherwise,
  // and that URL is what has to survive being dragged to a bookmarks bar.
  // Confirmed the drag-to-save failure was exactly this: the encoded
  // bookmarklet was already close to 66KB before this file's last couple
  // of small additions pushed it over whatever limit the browser's
  // bookmarks-bar drag enforces (undocumented, but real - stripping
  // comments here fixed it). A simple state machine (not a regex) so it
  // can't misfire inside a string that happens to contain "//" - checked
  // there's no such string in any function actually inlined below, but a
  // state machine costs nothing extra and doesn't rely on that staying
  // true. Doesn't special-case regex literals, so this would be unsafe to
  // reuse on code containing a regex with "//" or "/*" inside it - none of
  // the inlined functions have one (also checked), but that's worth
  // re-checking before adding a new regex to any of them.
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
    // The bookmarklet can't load this file on lostark.bible's origin, so it
    // carries the extraction logic (as source text) plus the tiny runner
    // above, all inlined into one javascript: URL. Comments are stripped
    // (see stripComments) - they're worth keeping in this file for anyone
    // reading/maintaining it, but add nothing at runtime and were pushing
    // the encoded URL past a length where bookmark managers stop accepting
    // it (see stripComments' own comment for how that was confirmed).
    var extractionSrc = [
      findBalanced, jsonish, splitTopLevelObjects, extractLoadoutJSON,
      findChaosGrade, dumpArkGridMarkers, parseStatLine, scanAccessoryBlock, firstPct,
      parseBraceClauses, parseVisibleText, tierMatch, tierMatchOrNone, checkDeathbladeClass, extractCharacterName, buildPayload,
    ].map(function (fn) { return stripComments(fn.toString()); }).join("\n");
    var tableSrc = [
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
    return "javascript:" + encodeURIComponent(body);
  }

  // ----- Apply-on-load (runs on this calculator page) -----
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
      // applyImportText (ark-passive-calculator.js) runs synchronously off
      // that click and writes its own result - including a skipped-field
      // list when a pipe/space17 value doesn't match any current <option>
      // (stale point tier, future option rename, etc.) - into this popover's
      // own message element. Read it before closing the popover below: this
      // is the only place that particular failure mode surfaces, and it's a
      // different list from payload.warnings (which is bible-import.js's
      // own, computed before ever touching the DOM) - without this, a
      // failed field here fails completely silently, the same gap
      // skippedOut was built to close for manual pastes.
      var popoverMsgEl = popover.querySelector(".ap-calc-popover-msg");
      if (popoverMsgEl && popoverMsgEl.classList.contains("ap-calc-popover-msg-error") && popoverMsgEl.textContent) {
        payload.warnings = payload.warnings || [];
        payload.warnings.push(popoverMsgEl.textContent);
      }
      // The Import popover is only opened here to reuse its own Load
      // logic/validation - for a manual paste it's meant to stay open so
      // you can read its "Imported into Preset N" message, but for this
      // one-click flow that just leaves it sitting open until Cancel is
      // clicked, duplicating the .bible-import-status message below.
      // Dismiss it the same way the popover's own Close button would.
      var closeBtn = popover.querySelector(".ap-calc-popover-close");
      if (closeBtn) closeBtn.click();
      else popover.hidden = true;
      // closePopover (ark-passive-calculator.js) returns keyboard focus to
      // whatever triggered the popover - correct for a manual Export/Import
      // click, but this flow opens/closes the popover programmatically, so
      // without this the Import button is left focused and shows a
      // lingering highlight ring the user never actually clicked for.
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
      // Clicking (instead of dragging) this link would otherwise actually
      // run the bookmarklet against THIS page - which has no character
      // data - producing a confusing "couldn't find character data"
      // message that looks like a bug rather than "wrong page." Intercept
      // the click and say the actual next step instead of letting that
      // happen.
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
