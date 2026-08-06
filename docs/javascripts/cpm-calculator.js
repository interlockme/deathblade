// Personal CPM / back-attack multiplier calculator.
//
// Mirrors the "계산기" (Calculator) sheet from the CPM spreadsheet - a
// per-build personal converter, distinct from the "실전배율" sheet that
// generated the fixed-back-attack-rate reference tables published
// elsewhere on this page. This tool lets the reader plug in their OWN
// raid CPM and back-attack rate (or raw ratio) per build, instead of
// reading off a table built for the build's assumed average.
//
// Formulas verified directly against the spreadsheet's cells, not
// re-derived from the published table's output:
//   1. Ratio -> Rate (only used if the reader has a raw meter ratio):
//      Rate% = Ratio / (Ratio + 1.35975 * (100 - Ratio)) * 100
//   2. Rate -> Adjusted Multiplier:
//      P = Rate% / 100
//      AdjustedMultiplier = BaseMultiplier * (P + (1-P) * (E_nonback/E_back))
//   3. Adjusted Multiplier -> Final Multiplier for a given Raid CPM:
//      FinalMultiplier = (RaidCPM / TrixionCPM) * AdjustedMultiplier

(function () {
  const BUILDS = {
    "333-re": { trixionCPM: 15.122, baseMultiplier: 1.2 },
    "111-surge": { trixionCPM: 10.952, baseMultiplier: 1.23 },
    "222-surge": { trixionCPM: 9.756, baseMultiplier: 1.22 },
  };

  const E_BACK = 3.5405624914;
  const E_NONBACK = 2.603831;
  const RATIO_TO_RATE_CONST = 1.35975;

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
  var HISTORY_KEY = "cpm-calc-history-deathblade-v1";
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
        e.ba.toFixed(1) === entry.ba.toFixed(1) &&
        e.mode === entry.mode
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
      var suffix = entry.mode === "ratio" ? " ratio" : "%";
      chip.textContent = entry.cpm.toFixed(2) + " cpm · " + entry.ba.toFixed(1) + suffix;
      chip.addEventListener("click", function () {
        var raidCPMInput = row.querySelector(".cpm-calc-raidcpm");
        var baInput = row.querySelector(".cpm-calc-ba-input");
        var modeInputs = row.querySelectorAll(
          'input[name="cpm-calc-ba-mode-' + buildKey + '"]'
        );
        raidCPMInput.value = entry.cpm;
        baInput.value = entry.ba;
        modeInputs.forEach(function (input) {
          input.checked = input.value === entry.mode;
        });
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
    var inputs = row.querySelector(".cpm-calc-inputs");
    if (inputs) {
      inputs.insertAdjacentElement("afterend", wrap);
    } else {
      row.appendChild(wrap);
    }
    return wrap;
  }

  function getBaMode(row, buildKey) {
    const inputs = row.querySelectorAll(
      'input[name="cpm-calc-ba-mode-' + buildKey + '"]'
    );
    let mode = "rate";
    inputs.forEach((input) => {
      if (input.checked) mode = input.value;
    });
    return mode;
  }

  function updateRow(row) {
    const buildKey = row.dataset.build;
    const build = BUILDS[buildKey];
    if (!build) return;

    const raidCPMInput = row.querySelector(".cpm-calc-raidcpm");
    const baInput = row.querySelector(".cpm-calc-ba-input");
    const baseMultInput = row.querySelector(".cpm-calc-basemult-input");
    const resultEl = row.querySelector(".cpm-calc-result-value");
    const adjEl = row.querySelector(".cpm-calc-adj-value");
    const barFill = row.querySelector(".cpm-calc-bar-fill");

    const raidCPM = parseFloat(raidCPMInput.value);
    const baValue = parseFloat(baInput.value);
    // Falls back to the known-correct constant if the reader clears the
    // field or types something invalid, rather than breaking the calc.
    const baseMultRaw = parseFloat(baseMultInput.value);
    const baseMult = isFinite(baseMultRaw) && baseMultRaw > 0 ? baseMultRaw : build.baseMultiplier;

    const validInputs =
      isFinite(raidCPM) &&
      raidCPM > 0 &&
      isFinite(baValue) &&
      baValue >= 0 &&
      baValue <= 100;

    if (!validInputs) {
      resultEl.textContent = "—";
      adjEl.textContent = "—";
      barFill.style.width = "0%";
      delete row.dataset.finalMult;
      delete row.dataset.pendingCpm;
      delete row.dataset.pendingBa;
      delete row.dataset.pendingMode;
      highlightBest();
      return;
    }

    const mode = getBaMode(row, buildKey);
    const ratePercent = mode === "ratio" ? ratioToRate(baValue) : baValue;
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
    row.dataset.pendingMode = mode;
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

  function init() {
    document.querySelectorAll(".cpm-calc-row").forEach((row) => {
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
            mode: row.dataset.pendingMode,
          });
          renderRecentChips(row, buildKey);
        });
      });
    });
  }

  // navigation.instant swaps page content via AJAX, so DOMContentLoaded
  // only fires once. document$ re-emits on every page load, including
  // instant navigations.
  if (typeof document$ !== "undefined") {
    document$.subscribe(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
