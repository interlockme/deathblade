// FORK GUIDE: DEATHBLADE-SPECIFIC - the BUILDS map below is Deathblade's
// own Trixion CPM/multiplier constants, derived from a Deathblade-specific
// spreadsheet, and the formulas assume Deathblade's orb/Surge identity
// mechanic. Delete this file (and its markdown usage + mkdocs.yml entry)
// unless your class also has a CPM-style identity meter worth modeling
// the same way.
//
// Personal CPM / back-attack multiplier calculator.
//
// Mirrors the "계산기" (Calculator) sheet from the CPM spreadsheet - a
// per-build personal converter, distinct from the "실전배율" sheet that
// generated the fixed-back-attack-rate reference tables published
// elsewhere on this page. This tool lets the reader plug in their OWN
// raid CPM and Combat Analyzer "Back Attack Percentage" reading per
// build, instead of reading off a table built for the build's assumed
// average.
//
// The single Back Attack % field is the raw Combat Analyzer ratio, not
// the actual back-attack rate the multiplier math needs - every input is
// run through the ratio->rate conversion below (the live "≈ N% rate"
// readout beside the field just surfaces that conversion, it's not a
// separate input).
//
// Formulas verified directly against the spreadsheet's cells, not
// re-derived from the published table's output:
//   1. Ratio -> Rate:
//      Rate% = Ratio / (Ratio + 1.35975 * (100 - Ratio)) * 100
//   2. Rate -> Adjusted Multiplier:
//      P = Rate% / 100
//      AdjustedMultiplier = BaseMultiplier * (P + (1-P) * (E_nonback/E_back))
//   3. Adjusted Multiplier -> Final Multiplier for a given Raid CPM:
//      FinalMultiplier = (RaidCPM / TrixionCPM) * AdjustedMultiplier

(function () {
  const BUILDS = {
    "333-re": { trixionCPM: 15, baseMultiplier: 1.2 },
    "111-surge": { trixionCPM: 10.952, baseMultiplier: 1.23 },
    "222-surge": { trixionCPM: 10.084, baseMultiplier: 1.25 },
  };

  const E_BACK = 3.5405624914;
  const E_NONBACK = 2.603831;
  const RATIO_TO_RATE_CONST = 1.35975;

  // Input guardrails. No real build's Raid CPM comes remotely close to 20
  // (the highest Trixion CPM among BUILDS above is 15, and real raid
  // CPM is always below the Trixion-parse ceiling per the Final Multiplier
  // comment below) - 20 is a generous ceiling that only catches fat-finger/
  // pasted-garbage entries, not a real reading. Base Multiplier is a
  // per-build constant that occasionally shifts with balance patches
  // (current values run 1.20-1.23), so 0.5-2 leaves plenty of headroom for
  // future patches while still catching typos like a stray extra digit.
  const RAID_CPM_MIN = 0;
  const RAID_CPM_MAX = 20;
  const BASE_MULT_MIN = 0.5;
  const BASE_MULT_MAX = 2;
  // Back-Attack % is a Combat Analyzer ratio reading, so 0-100 is a hard
  // ceiling (not just a sanity bound like the two above) - anything outside
  // it is already rejected by baValid in updateRow(), this just makes the
  // field itself snap back in line with that instead of sitting there
  // showing a number the calc was silently ignoring.
  const BACK_ATTACK_MIN = 0;
  const BACK_ATTACK_MAX = 100;

  function ratioToRate(ratioPercent) {
    return (
      (ratioPercent / (ratioPercent + RATIO_TO_RATE_CONST * (100 - ratioPercent))) *
      100
    );
  }

  function adjustedMultiplier(baseMultiplier, ratePercent) {
    const P = ratePercent / 100;
    return baseMultiplier * (P + (1 - P) * (E_NONBACK / E_BACK));
  }

  function finalMultiplier(raidCPM, trixionCPM, adjMult) {
    return (raidCPM / trixionCPM) * adjMult;
  }

  // Final Multiplier = (RaidCPM / TrixionCPM) * AdjustedMultiplier - since
  // real raid CPM is always below the Trixion-parse ceiling, this lands
  // roughly in 0.5-1.0 for realistic inputs, NOT the 1.0-1.3 range
  // .stat-bar-fill-teal elsewhere on the site was calibrated for (that
  // scale is for Adjusted Multiplier, a different number). Scaling
  // against that range here would floor almost every real result at 0%.
  function barWidthPercent(finalMult) {
    const pct = ((finalMult - 0.4) / (1.0 - 0.4)) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  // ----- Recent-inputs history (per build, localStorage) -----
  // Iterating on your numbers between pulls means retyping the same Raid
  // CPM/back-attack rate every visit - this remembers the last few distinct
  // combos per build and offers them back as clickable chips. Best-effort:
  // wrapped in try/catch since some browsers/private sessions block storage
  // entirely, and the calculator works fine without it either way.
  var HISTORY_KEY = "cpm-calc-history-deathblade-v2";
  var HISTORY_MAX = 4;

  function loadHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveHistory(all) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
    } catch (e) {
      /* storage unavailable - nothing to do */
    }
  }

  function recordHistory(buildKey, entry) {
    var all = loadHistory();
    var list = all[buildKey] || [];
    // Drop any existing entry that's essentially the same combo (rounded)
    // so re-saving the same numbers just bumps it to the front instead of
    // piling up near-duplicates.
    list = list.filter(function (e) {
      return !(
        e.cpm.toFixed(2) === entry.cpm.toFixed(2) &&
        e.ba.toFixed(1) === entry.ba.toFixed(1)
      );
    });
    list.unshift(entry);
    list = list.slice(0, HISTORY_MAX);
    all[buildKey] = list;
    saveHistory(all);
    return list;
  }

  function renderRecentChips(row, buildKey) {
    var wrap = row.querySelector(".cpm-calc-recent");
    if (!wrap) return;
    var list = loadHistory()[buildKey] || [];
    wrap.innerHTML = "";
    if (!list.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;

    var label = document.createElement("span");
    label.className = "cpm-calc-recent-label";
    label.textContent = "Recent";
    wrap.appendChild(label);

    list.forEach(function (entry) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "cpm-calc-recent-chip";
      chip.textContent = entry.cpm.toFixed(2) + " cpm · " + entry.ba.toFixed(1) + "%";
      chip.addEventListener("click", function () {
        var raidCPMInput = row.querySelector(".cpm-calc-raidcpm");
        var baInput = row.querySelector(".cpm-calc-ba-input");
        raidCPMInput.value = entry.cpm;
        baInput.value = entry.ba;
        updateRow(row);
      });
      wrap.appendChild(chip);
    });

    var clear = document.createElement("button");
    clear.type = "button";
    clear.className = "cpm-calc-recent-clear";
    clear.textContent = "Clear";
    clear.setAttribute("aria-label", "Clear recent inputs for this build");
    clear.addEventListener("click", function () {
      var all = loadHistory();
      delete all[buildKey];
      saveHistory(all);
      renderRecentChips(row, buildKey);
    });
    wrap.appendChild(clear);
  }

  function ensureRecentChipsContainer(row) {
    var existing = row.querySelector(".cpm-calc-recent");
    if (existing) return existing;
    var wrap = document.createElement("div");
    wrap.className = "cpm-calc-recent";
    wrap.hidden = true;
    var body = row.querySelector(".cpm-calc-body");
    if (body) {
      body.insertAdjacentElement("afterend", wrap);
    } else {
      row.appendChild(wrap);
    }
    return wrap;
  }

  function updateRow(row) {
    const buildKey = row.dataset.build;
    const build = BUILDS[buildKey];
    if (!build) return;

    const raidCPMInput = row.querySelector(".cpm-calc-raidcpm");
    const baInput = row.querySelector(".cpm-calc-ba-input");
    const baRateEl = row.querySelector(".cpm-calc-ba-rate");
    const baseMultInput = row.querySelector(".cpm-calc-basemult-input");
    const resultEl = row.querySelector(".cpm-calc-result-value");
    const adjEl = row.querySelector(".cpm-calc-adj-value");
    const barFill = row.querySelector(".cpm-calc-bar-fill");

    const raidCPM = parseFloat(raidCPMInput.value);
    // This is the raw Combat Analyzer "Back Attack Percentage" reading (a
    // ratio, not the actual back-attack rate) - always converted below,
    // there's no separate rate-entry mode anymore.
    const baValue = parseFloat(baInput.value);
    // Falls back to the known-correct constant if the reader clears the
    // field or types something invalid, rather than breaking the calc.
    // clampOnBlur() below is the primary guard against out-of-range values
    // actually sitting in the field, but this re-checks the bounds here
    // too (recent-chip clicks and other programmatic value.set calls don't
    // go through blur) so a stray out-of-range number can't silently
    // produce a result.
    const baseMultRaw = parseFloat(baseMultInput.value);
    const baseMult =
      isFinite(baseMultRaw) && baseMultRaw >= BASE_MULT_MIN && baseMultRaw <= BASE_MULT_MAX
        ? baseMultRaw
        : build.baseMultiplier;

    const baValid = isFinite(baValue) && baValue >= 0 && baValue <= 100;

    if (baRateEl) {
      baRateEl.textContent = baValid ? "≈ " + ratioToRate(baValue).toFixed(1) + "% rate" : "";
    }

    const raidCPMValid = isFinite(raidCPM) && raidCPM > RAID_CPM_MIN && raidCPM <= RAID_CPM_MAX;
    const validInputs = raidCPMValid && baValid;

    if (!validInputs) {
      resultEl.textContent = "—";
      adjEl.textContent = "—";
      resultEl.classList.add("cpm-calc-output-empty");
      adjEl.classList.add("cpm-calc-output-empty");
      barFill.style.width = "0%";
      delete row.dataset.finalMult;
      delete row.dataset.pendingCpm;
      delete row.dataset.pendingBa;
      highlightBest();
      return;
    }

    resultEl.classList.remove("cpm-calc-output-empty");
    adjEl.classList.remove("cpm-calc-output-empty");

    const ratePercent = ratioToRate(baValue);
    const adjMult = adjustedMultiplier(baseMult, ratePercent);
    const finalMult = finalMultiplier(raidCPM, build.trixionCPM, adjMult);

    adjEl.textContent = adjMult.toFixed(4);
    resultEl.textContent = finalMult.toFixed(3);
    barFill.style.width = barWidthPercent(finalMult) + "%";
    row.dataset.finalMult = String(finalMult);

    highlightBest();

    // Stash the values that produced this valid result - actually recorded
    // to history on blur (see init()), not here, since this fires on every
    // keystroke and would otherwise spam a new entry per digit typed.
    row.dataset.pendingCpm = String(raidCPM);
    row.dataset.pendingBa = String(baValue);
  }

  function highlightBest() {
    const rows = document.querySelectorAll(".cpm-calc-row");
    let best = null;
    let bestVal = -Infinity;
    let filledCount = 0;

    rows.forEach((row) => {
      row.classList.remove("cpm-calc-row-best");
      const val = parseFloat(row.dataset.finalMult);
      if (isFinite(val)) {
        filledCount++;
        if (val > bestVal) {
          bestVal = val;
          best = row;
        }
      }
    });

    // Only highlight once there's something to compare against - a
    // single filled-in row "winning" against nothing is meaningless.
    if (best && filledCount >= 2) {
      best.classList.add("cpm-calc-row-best");
    }
  }

  // Snaps a field back into [min, max] once the reader's done typing,
  // rather than fighting them mid-keystroke (clamping on "input" would
  // make it impossible to type e.g. "9.5" past an intermediate "9" that's
  // already >= a low max). :out-of-range styling (see extra.css) gives a
  // live visual cue before blur actually corrects the value.
  function clampOnBlur(input, min, max, decimals, row) {
    window.SiteUtils.clampOnBlur(input, min, max, () => updateRow(row), {
      format: (n) => n.toFixed(decimals),
    });
  }

  // ----- Surges/Min scratch-pad (top of the CPM Calculator card) -----
  // Folded in here rather than kept as its own script/file: it's a tiny
  // unit conversion (count over a clip -> a per-minute rate) the reader
  // does once and copies into Raid CPM below, not a persistent tool with
  // state of its own, so it doesn't earn a separate file. No
  // localStorage, no history - unlike the rows above this has nothing
  // worth remembering between visits.

  // Accepts, in order of priority:
  //   1. "1h 2m 3s" / "2m3s" / "90s" / "5m" - any subset of h/m/s tokens,
  //      space-optional, unit letters required.
  //   2. "hh:mm:ss" or "mm:ss" colon form.
  //   3. A bare number, treated as whole seconds (Combat Analyzer clip
  //      lengths are usually read off in seconds, so no unit means
  //      seconds, not minutes).
  const SPM_UNIT_RE = /(\d+(?:\.\d+)?)\s*(h|m|s)/gi;

  // Guardrails, same spirit as RAID_CPM_MAX etc. above: catch fat-finger/
  // pasted-garbage entries on blur rather than block typing mid-keystroke.
  // Count is a raw Combat Analyzer surge tally for one clip - three digits
  // (999) is already far beyond any real reading. Time is capped at
  // 120m 60s (7260s) - a two-hour-plus clip is well past any real pull
  // length, but the round "120m 60s" ceiling is easier for a reader to
  // reason about than an odd derived number.
  const SPM_COUNT_MIN = 0;
  const SPM_COUNT_MAX = 999;
  const SPM_TIME_MAX_SECONDS = 120 * 60 + 60;

  // Renders a clamped seconds value back into the same "Xm Ys" shape the
  // parser accepts, so a corrected field stays editable/consistent with
  // what a reader would type - not a raw second count they'd have to
  // re-parse in their head.
  function spmFormatSeconds(totalSeconds) {
    const s = Math.round(totalSeconds);
    const m = Math.floor(s / 60);
    const secs = s % 60;
    if (m > 0 && secs > 0) return `${m}m ${secs}s`;
    if (m > 0) return `${m}m`;
    return `${secs}s`;
  }

  function spmParseTimeToSeconds(raw) {
    if (raw == null) return NaN;
    const str = String(raw).trim().toLowerCase();
    if (!str) return NaN;

    // Bare number -> seconds.
    if (/^\d+(\.\d+)?$/.test(str)) {
      return parseFloat(str);
    }

    // Colon form: mm:ss or hh:mm:ss.
    if (/^\d+(:\d+){1,2}$/.test(str)) {
      const parts = str.split(":").map(Number);
      if (parts.some((n) => !isFinite(n))) return NaN;
      let seconds = 0;
      for (const part of parts) {
        seconds = seconds * 60 + part;
      }
      return seconds;
    }

    // Unit form: sum whatever h/m/s tokens are present. A token letter
    // used twice (e.g. "5m 3m") is deliberately allowed to just add up -
    // rejecting it isn't worth the extra code for a scratch-pad field.
    let seconds = 0;
    let matched = false;
    let consumed = "";
    let m;
    SPM_UNIT_RE.lastIndex = 0;
    while ((m = SPM_UNIT_RE.exec(str)) !== null) {
      matched = true;
      consumed += m[0];
      const value = parseFloat(m[1]);
      const unit = m[2];
      if (unit === "h") seconds += value * 3600;
      else if (unit === "m") seconds += value * 60;
      else seconds += value;
    }
    if (!matched) return NaN;
    // Reject leftover text the regex scan didn't account for - e.g.
    // "121m 55555" (a valid "121m" token followed by mashed digits with
    // no unit letter). Without this, unmatched characters are silently
    // dropped and a token found anywhere in the garbage still returns a
    // "valid" result. Compare lengths with whitespace stripped from both
    // sides so a space between number and unit ("121 m") doesn't trip it.
    if (str.replace(/\s+/g, "").length !== consumed.replace(/\s+/g, "").length) {
      return NaN;
    }
    return seconds;
  }

  function spmUpdate(widget) {
    const timeInput = widget.querySelector(".spm-calc-time");
    const countInput = widget.querySelector(".spm-calc-count");
    const resultEl = widget.querySelector(".spm-calc-result-value");
    if (!timeInput || !countInput || !resultEl) return;

    const seconds = spmParseTimeToSeconds(timeInput.value);
    const count = parseFloat(countInput.value);

    const timeValid = isFinite(seconds) && seconds > 0 && seconds <= SPM_TIME_MAX_SECONDS;
    const countValid = isFinite(count) && count >= 0;

    timeInput.classList.toggle(
      "spm-calc-input-invalid",
      timeInput.value.trim() !== "" && !timeValid
    );

    if (!timeValid || !countValid) {
      resultEl.textContent = "—";
      resultEl.classList.add("spm-calc-output-empty");
      return;
    }

    const perMinute = count * (60 / seconds);
    resultEl.textContent = perMinute.toFixed(2);
    resultEl.classList.remove("spm-calc-output-empty");
  }

  // Both initSpmWidget() and initCpmRow() attach listeners directly onto
  // each widget's own static markup instead of rebuilding it from scratch
  // each call - so, unlike the JSON-data-driven widgets registerRenderer
  // was originally written for, calling either of these twice on the same
  // element would double-attach every listener below rather than
  // harmlessly re-doing idempotent work. The dataset guard at the top of
  // each is what makes them safe to hand to registerRenderer, whose three
  // triggers can otherwise all fire for the same element on a single hard
  // load.

  function initSpmWidget(widget) {
    if (widget.dataset.spmCalcInit) return;
    widget.dataset.spmCalcInit = "1";

    const timeInput = widget.querySelector(".spm-calc-time");
    const countInput = widget.querySelector(".spm-calc-count");

    widget.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => spmUpdate(widget));
    });

    // Clamp on blur (not on input) for the same reason as clampOnBlur
    // above: correcting mid-keystroke would make it impossible to type
    // past an intermediate value that's already over the ceiling.
    if (timeInput) {
      timeInput.addEventListener("blur", () => {
        const seconds = spmParseTimeToSeconds(timeInput.value);
        if (!isFinite(seconds)) return; // empty/unparseable - leave as-is
        if (seconds > SPM_TIME_MAX_SECONDS) {
          timeInput.value = spmFormatSeconds(SPM_TIME_MAX_SECONDS);
          spmUpdate(widget);
        }
      });
    }
    if (countInput) {
      countInput.addEventListener("blur", () => {
        const raw = parseFloat(countInput.value);
        if (!isFinite(raw)) return;
        const clamped = Math.min(SPM_COUNT_MAX, Math.max(SPM_COUNT_MIN, raw));
        if (clamped !== raw) {
          countInput.value = clamped;
          spmUpdate(widget);
        }
      });
    }

    spmUpdate(widget);
  }

  function initCpmRow(row) {
    if (row.dataset.cpmCalcInit) return;
    row.dataset.cpmCalcInit = "1";

    const buildKey = row.dataset.build;
    const build = BUILDS[buildKey];
    const baseMultInput = row.querySelector(".cpm-calc-basemult-input");
    if (build && baseMultInput && !baseMultInput.value) {
      baseMultInput.value = build.baseMultiplier.toFixed(2);
    }

    row.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => updateRow(row));
    });
    updateRow(row);

    clampOnBlur(row.querySelector(".cpm-calc-raidcpm"), RAID_CPM_MIN, RAID_CPM_MAX, 2, row);
    clampOnBlur(baseMultInput, BASE_MULT_MIN, BASE_MULT_MAX, 2, row);
    clampOnBlur(row.querySelector(".cpm-calc-ba-input"), BACK_ATTACK_MIN, BACK_ATTACK_MAX, 2, row);

    ensureRecentChipsContainer(row);
    renderRecentChips(row, buildKey);

    // Record to history on blur rather than every keystroke - once the
    // reader has settled on a value and moved on, not mid-typing.
    const raidCPMInput = row.querySelector(".cpm-calc-raidcpm");
    const baInput = row.querySelector(".cpm-calc-ba-input");
    [raidCPMInput, baInput].forEach((el) => {
      if (!el) return;
      el.addEventListener("blur", () => {
        if (row.dataset.pendingCpm === undefined) return; // no valid result yet
        recordHistory(buildKey, {
          cpm: parseFloat(row.dataset.pendingCpm),
          ba: parseFloat(row.dataset.pendingBa),
        });
        renderRecentChips(row, buildKey);
      });
    });
  }

  // Was a hand-rolled document$-only subscription (see site-utils.js's
  // registerRenderer doc comment for why that's not safe to assume covers
  // every case on its own) - the dataset guards above are what make these
  // safe to hand to it directly.
  window.SiteUtils.registerRenderer(".spm-calc", initSpmWidget);
  window.SiteUtils.registerRenderer(".cpm-calc-row", initCpmRow);
})();
