(function () {
  const TRIXION_CPM = {
    "333-ceiling": 15,
    "111-classic": 10.952,
    "222-speedy": 10.084,
  };
  const FAMILY_LABELS = { re: "Remaining Energy", surge: "Surge" };
  function findBuildMeta(id) {
    const db = window.DB_BUILD_DATA;
    if (!db) return null;
    for (const familyKey in db) {
      const builds = db[familyKey].builds || [];
      for (let i = 0; i < builds.length; i++) {
        if (builds[i].id === id) {
          return {
            baseMultiplier: builds[i].trixion,
            familyLabel: FAMILY_LABELS[familyKey] || familyKey,
          };
        }
      }
    }
    return null;
  }
  function getBuild(id) {
    const trixionCPM = TRIXION_CPM[id];
    if (trixionCPM == null) {
      if (window.console) console.warn('[cpm-calculator] no TRIXION_CPM entry for data-build="' + id + '" - known keys: ' + Object.keys(TRIXION_CPM).join(", "));
      return null;
    }
    const meta = findBuildMeta(id);
    if (!meta || meta.baseMultiplier == null) {
      if (window.console) console.warn('[cpm-calculator] data-build="' + id + '" has no matching (or no trixion) entry in DB_BUILD_DATA');
      return null;
    }
    return { trixionCPM: trixionCPM, baseMultiplier: meta.baseMultiplier, familyLabel: meta.familyLabel };
  }
  const E_BACK = 3.5405624914;
  const E_NONBACK = 2.603831;
  const RATIO_TO_RATE_CONST = 1.35975;
  const RAID_CPM_MIN = 0;
  const RAID_CPM_MAX = 20;
  const BASE_MULT_MIN = 0.5;
  const BASE_MULT_MAX = 2;
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
  function barWidthPercent(finalMult) {
    const pct = ((finalMult - 0.4) / (1.0 - 0.4)) * 100;
    return Math.max(0, Math.min(100, pct));
  }
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
    }
  }
  function recordHistory(buildKey, entry) {
    var all = loadHistory();
    var list = all[buildKey] || [];
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
    const build = getBuild(buildKey);
    if (!build) return;
    const raidCPMInput = row.querySelector(".cpm-calc-raidcpm");
    const baInput = row.querySelector(".cpm-calc-ba-input");
    const baRateEl = row.querySelector(".cpm-calc-ba-rate");
    const baseMultInput = row.querySelector(".cpm-calc-basemult-input");
    const resultEl = row.querySelector(".cpm-calc-result-value");
    const adjEl = row.querySelector(".cpm-calc-adj-value");
    const barFill = row.querySelector(".cpm-calc-bar-fill");
    const raidCPM = parseFloat(raidCPMInput.value);
    const baValue = parseFloat(baInput.value);
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
    if (best && filledCount >= 2) {
      best.classList.add("cpm-calc-row-best");
    }
  }
  function clampOnBlur(input, min, max, decimals, row) {
    window.SiteUtils.clampOnBlur(input, min, max, () => updateRow(row), {
      format: (n) => n.toFixed(decimals),
    });
  }
  const CPM_RATE_UNIT_RE = /(\d+(?:\.\d+)?)\s*(h|m|s)/gi;
  const CPM_RATE_COUNT_MIN = 0;
  const CPM_RATE_COUNT_MAX = 999;
  const CPM_RATE_TIME_MAX_SECONDS = 120 * 60 + 60;
  function cpmRateFormatSeconds(totalSeconds) {
    const s = Math.round(totalSeconds);
    const m = Math.floor(s / 60);
    const secs = s % 60;
    if (m > 0 && secs > 0) return `${m}m ${secs}s`;
    if (m > 0) return `${m}m`;
    return `${secs}s`;
  }
  function cpmRateParseTimeToSeconds(raw) {
    if (raw == null) return NaN;
    const str = String(raw).trim().toLowerCase();
    if (!str) return NaN;
    if (/^\d+(\.\d+)?$/.test(str)) {
      return parseFloat(str);
    }
    if (/^\d+(:\d+){1,2}$/.test(str)) {
      const parts = str.split(":").map(Number);
      if (parts.some((n) => !isFinite(n))) return NaN;
      let seconds = 0;
      for (const part of parts) {
        seconds = seconds * 60 + part;
      }
      return seconds;
    }
    let seconds = 0;
    let matched = false;
    let consumed = "";
    let m;
    CPM_RATE_UNIT_RE.lastIndex = 0;
    while ((m = CPM_RATE_UNIT_RE.exec(str)) !== null) {
      matched = true;
      consumed += m[0];
      const value = parseFloat(m[1]);
      const unit = m[2];
      if (unit === "h") seconds += value * 3600;
      else if (unit === "m") seconds += value * 60;
      else seconds += value;
    }
    if (!matched) return NaN;
    if (str.replace(/\s+/g, "").length !== consumed.replace(/\s+/g, "").length) {
      return NaN;
    }
    return seconds;
  }
  function cpmRateUpdate(widget) {
    const timeInput = widget.querySelector(".cpm-rate-calc-time");
    const countInput = widget.querySelector(".cpm-rate-calc-count");
    const resultEl = widget.querySelector(".cpm-rate-calc-result-value");
    if (!timeInput || !countInput || !resultEl) return;
    const seconds = cpmRateParseTimeToSeconds(timeInput.value);
    const count = parseFloat(countInput.value);
    const timeValid = isFinite(seconds) && seconds > 0 && seconds <= CPM_RATE_TIME_MAX_SECONDS;
    const countValid = isFinite(count) && count >= 0;
    timeInput.classList.toggle(
      "cpm-rate-calc-input-invalid",
      timeInput.value.trim() !== "" && !timeValid
    );
    if (!timeValid || !countValid) {
      resultEl.textContent = "—";
      resultEl.classList.add("cpm-rate-calc-output-empty");
      return;
    }
    const perMinute = count * (60 / seconds);
    resultEl.textContent = perMinute.toFixed(2);
    resultEl.classList.remove("cpm-rate-calc-output-empty");
  }
  function initCpmRateWidget(widget) {
    if (widget.dataset.cpmRateCalcInit) return;
    widget.dataset.cpmRateCalcInit = "1";
    const timeInput = widget.querySelector(".cpm-rate-calc-time");
    const countInput = widget.querySelector(".cpm-rate-calc-count");
    widget.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => cpmRateUpdate(widget));
    });
    if (timeInput) {
      timeInput.addEventListener("blur", () => {
        const seconds = cpmRateParseTimeToSeconds(timeInput.value);
        if (!isFinite(seconds)) return;
        if (seconds > CPM_RATE_TIME_MAX_SECONDS) {
          timeInput.value = cpmRateFormatSeconds(CPM_RATE_TIME_MAX_SECONDS);
          cpmRateUpdate(widget);
        }
      });
    }
    if (countInput) {
      countInput.addEventListener("blur", () => {
        const raw = parseFloat(countInput.value);
        if (!isFinite(raw)) return;
        const clamped = Math.min(CPM_RATE_COUNT_MAX, Math.max(CPM_RATE_COUNT_MIN, raw));
        if (clamped !== raw) {
          countInput.value = clamped;
          cpmRateUpdate(widget);
        }
      });
    }
    cpmRateUpdate(widget);
  }
  function initCpmRow(row) {
    if (row.dataset.cpmCalcInit) return;
    row.dataset.cpmCalcInit = "1";
    const buildKey = row.dataset.build;
    const build = getBuild(buildKey);
    const baseMultInput = row.querySelector(".cpm-calc-basemult-input");
    if (build && baseMultInput && !baseMultInput.value) {
      baseMultInput.value = build.baseMultiplier.toFixed(2);
    }
    const metaEl = row.querySelector(".cpm-calc-row-meta");
    if (build && metaEl) {
      metaEl.textContent = "Trixion CPM " + build.trixionCPM + " \u00b7 " + build.familyLabel;
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
    const raidCPMInput = row.querySelector(".cpm-calc-raidcpm");
    const baInput = row.querySelector(".cpm-calc-ba-input");
    [raidCPMInput, baInput].forEach((el) => {
      if (!el) return;
      el.addEventListener("blur", () => {
        if (row.dataset.pendingCpm === undefined) return;
        recordHistory(buildKey, {
          cpm: parseFloat(row.dataset.pendingCpm),
          ba: parseFloat(row.dataset.pendingBa),
        });
        renderRecentChips(row, buildKey);
      });
    });
  }
  window.SiteUtils.registerRenderer(".cpm-rate-calc", initCpmRateWidget);
  window.SiteUtils.registerRenderer(".cpm-calc-row", initCpmRow);
})();
