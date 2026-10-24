// FORK GUIDE: ENGINE - reusable as-is for any class. Reads the page's own
// "## Gems" damage column and "## DPS Spread" chart; the only class-specific
// inputs are those two blocks, no code changes needed here.
//
// Adds a compact "damage gem upgrade" table under each DPS Spread chart: the
// DPS gained by raising a skill's damage gem from Lv 7 to 8, 8 to 9, 9 to 10
// and 7 to 10, one row per skill that runs a damage gem, plus one footer row
// for the Base Attack Power every gem adds on top.
//
// EASY EDIT GUIDE: there is nothing to edit per page except the optional
// attribute below. A row appears for every skill id that is BOTH in the
// chart's data-ids AND in the page's Damage gem column (gem-priority.js's
// col "dmg" rows, primary rows only, not alts). Skills in the Cooldown column
// get no row. The table is built from the chart's own numbers, so updating
// data-values after a balance pass updates the table too.
//
//   data-optional-gems="surpriseattack"  (on the .dps-chart, comma-separated
//     skill ids, optional)
//     Skills whose damage gem is a choice rather than the default. The chart
//     is recorded without a gem on them, so they get a row marked "Optional"
//     and their gain is computed from the chart share as the no-gem share.
//
// HOW THE GAINS ARE COMPUTED
//   A damage gem multiplies its skill's damage by (1 + d), with d = 32, 36, 40
//   and 44% at Lv 7, 8, 9 and 10. The chart is recorded with every default
//   gem at Lv 10, so a gem skill's share s is its Lv 10 share. Only that
//   skill's own share matters: with s0 = s / (1 + d10) its no-gem share and
//   rest = 1 - s + s0 the total at gem level L is rest + s0 * d(L), and a step
//   from level a to b gains (rest + s0 * d(b)) / (rest + s0 * d(a)) - 1.
//   Another skill's share never enters. An optional gem skill is not in the
//   chart's gems, so its s0 is the chart share and rest is 1.
//
//   Each gem also adds Base Attack Power (0.6, 0.8, 1.0, 1.2% at Lv 7 to 10).
//   That is a bonus to the whole character, so it is the same for every row
//   and shown once. Its worth depends on the viewer's gear, which a build
//   page does not know, so it is a range between two reference setups, both
//   from the Ark Passive calculator's own AP model and defaults (Weapon Power
//   and Main Stat as typed there, Support held fixed at 98% uptime):
//     low  - every gem Lv 7, no Ability Stone bonus, no Vambrace;
//     high - every gem Lv 10, 9/7 stone, Ancient +25 Vambrace.

(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("gem-upgrade-table.js");

  // Skill damage bonus of a damage gem by level.
  var GEM_SKILL_DMG = { 7: 0.32, 8: 0.36, 9: 0.4, 10: 0.44 };
  // Base Attack Power % one gem adds by level (same table as bible-decode.js).
  var GEM_BASE_AP = { 7: 0.6, 8: 0.8, 9: 1, 10: 1.2 };
  var STEPS = [[7, 8], [8, 9], [9, 10], [7, 10]];
  var TOTAL_STEP = "7-10";

  // Ark Passive calculator defaults and constants (ark-passive-calculator.js:
  // gear Weapon Power and Main Stat inputs, SUPPORT_AP_BUFF_COEFFICIENT,
  // the Support Uptime input, ABILITY_STONE_BASE_AP_BONUS, VAMBRACE_*).
  var WEAPON_POWER = 259216;
  var MAIN_STAT = 854918;
  var SUPPORT_COEFFICIENT = 0.4;
  var SUPPORT_UPTIME = 0.98;
  var STONE_BASE_AP = 1.5;
  var GEM_COUNT = 11;
  var VAMBRACE_ANCIENT_25 = { pct: 3, flat: 9050 };
  var CORE_AP = Math.sqrt((WEAPON_POWER * MAIN_STAT) / 6);

  // Relative Attack Power gained when the gem Base AP total rises by dPct,
  // from a character whose Base AP bonus is basePct (percent) and flat AP is
  // flat. Support is held at its value before the gain.
  function baseApGain(basePct, flat, dPct) {
    var before = 1 + basePct / 100;
    var support = CORE_AP * before * SUPPORT_COEFFICIENT * SUPPORT_UPTIME;
    var apBefore = CORE_AP * before + flat + support;
    return (CORE_AP * dPct) / 100 / apBefore;
  }

  // [low, high] gain, as fractions, of one gem going from level a to b.
  function baseApRange(a, b) {
    var d = GEM_BASE_AP[b] - GEM_BASE_AP[a];
    var low = baseApGain(GEM_COUNT * GEM_BASE_AP[7], 0, d);
    var highBefore = GEM_COUNT * GEM_BASE_AP[10] + STONE_BASE_AP + VAMBRACE_ANCIENT_25.pct - d;
    var high = baseApGain(highBefore, VAMBRACE_ANCIENT_25.flat, d);
    return [Math.min(low, high), Math.max(low, high)];
  }

  // Fractional DPS gain of raising one skill's damage gem from level a to b.
  function skillGain(sharePct, optional, a, b) {
    var share = sharePct / 100;
    var s0, rest;
    if (optional) {
      s0 = share;
      rest = 1;
    } else {
      s0 = share / (1 + GEM_SKILL_DMG[10]);
      rest = 1 - share + s0;
    }
    return (rest + s0 * GEM_SKILL_DMG[b]) / (rest + s0 * GEM_SKILL_DMG[a]) - 1;
  }

  function fmtGain(fraction) {
    return "+" + (fraction * 100).toFixed(2) + "%";
  }

  // "0.12\u20130.13%" for a range, one figure when both ends round alike.
  function fmtRange(lo, hi) {
    var a = (lo * 100).toFixed(2);
    var b = (hi * 100).toFixed(2);
    return (a === b ? a : a + "\u2013" + b) + "%";
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function stepKey(step) {
    return step[0] + "-" + step[1];
  }

  function stepLabel(step) {
    return step[0] + "\u2192" + step[1];
  }

  // Damage gem skill ids of the page (or tab) the chart sits in, from the
  // Damage column's primary rows. Same scope rule as gem-dps-tooltip.js.
  function damageGemIds(chart) {
    var scope = chart.closest(".tabbed-block") || document;
    var rows = scope.querySelectorAll(
      ".gem-col-dmg .gem-item:not(.gem-item-expandable), " +
      ".gem-col-dmg details.gem-item-expandable > summary"
    );
    var ids = {};
    rows.forEach(function (row) {
      var id = row.getAttribute("data-id");
      if (id) ids[id] = true;
    });
    return ids;
  }

  function optionalIds(chart) {
    var ids = {};
    (chart.getAttribute("data-optional-gems") || "").split(",").forEach(function (s) {
      s = s.trim();
      if (s) ids[s] = true;
    });
    return ids;
  }

  function collectRows(chart) {
    var data = window.SiteUtils.parseChartData(chart);
    if (!data || !data.ids) return [];
    var gemIds = damageGemIds(chart);
    var optIds = optionalIds(chart);
    var rows = [];
    data.ids.forEach(function (id, i) {
      var optional = !!optIds[id];
      if (!optional && !gemIds[id]) return;
      rows.push({ id: id, label: data.labels[i], share: data.values[i], optional: optional });
    });
    return rows;
  }

  function skillCell(row) {
    var td = el("td", "gem-upgrade-skill");
    var inner = el("span", "gem-upgrade-skill-in");
    if (row.id) {
      var icon = el("img", "gem-upgrade-icon");
      icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "icon-" + row.id + ".png");
      icon.alt = "";
      icon.loading = "lazy";
      window.SiteUtils.hideOnError(icon, "display");
      inner.appendChild(icon);
    }
    inner.appendChild(el("span", "gem-upgrade-name", row.label));
    if (row.optional) inner.appendChild(el("span", "ap-gear-optional-badge", "Optional"));
    td.appendChild(inner);
    return td;
  }

  function valueCell(text, step) {
    var td = el("td", "gem-upgrade-val" + (stepKey(step) === TOTAL_STEP ? " gem-upgrade-total" : ""), text);
    return td;
  }

  function buildTable(rows) {
    var wrap = el("div", "ap-acc-table-scroll gem-upgrade-scroll");
    var table = el("table", "ap-brace-compare-table gem-upgrade-table");
    table.setAttribute("aria-label", "DPS gain from raising each damage gem level");

    var colgroup = el("colgroup");
    ["skill", "step", "step", "step", "total"].forEach(function (kind) {
      colgroup.appendChild(el("col", "gem-upgrade-col-" + kind));
    });
    table.appendChild(colgroup);

    var thead = el("thead");
    var top = el("tr");
    top.appendChild(el("th", "ap-brace-th-label", "Damage Gem"));
    var group = el("th", "ap-arkgrid-th-group", "DPS Gain by Gem Level");
    group.setAttribute("colspan", String(STEPS.length));
    top.appendChild(group);
    thead.appendChild(top);

    var sub = el("tr");
    var blank = el("th", "ap-arkgrid-th-blank");
    blank.setAttribute("aria-hidden", "true");
    sub.appendChild(blank);
    STEPS.forEach(function (step) {
      sub.appendChild(el("th", "gem-upgrade-th-step" + (stepKey(step) === TOTAL_STEP ? " gem-upgrade-th-total" : ""), stepLabel(step)));
    });
    thead.appendChild(sub);
    table.appendChild(thead);

    var tbody = el("tbody");
    rows.forEach(function (row) {
      var tr = el("tr");
      tr.appendChild(skillCell(row));
      STEPS.forEach(function (step) {
        tr.appendChild(valueCell(fmtGain(skillGain(row.share, row.optional, step[0], step[1])), step));
      });
      tbody.appendChild(tr);
    });

    var foot = el("tr", "gem-upgrade-foot");
    foot.appendChild(skillCell({ id: "", label: "+ Base AP per gem", optional: false }));
    STEPS.forEach(function (step) {
      var range = baseApRange(step[0], step[1]);
      foot.appendChild(valueCell(fmtRange(range[0], range[1]), step));
    });
    tbody.appendChild(foot);
    table.appendChild(tbody);

    wrap.appendChild(table);
    return wrap;
  }

  function renderChartTable(chart) {
    var frame = chart.parentElement;
    if (!frame) return;
    var rows = collectRows(chart);
    var key = rows.map(function (r) { return r.id + ":" + r.share + ":" + r.optional; }).join("|");
    var existing = frame.querySelector(":scope > .gem-upgrade-scroll");
    if (!rows.length) {
      if (existing) existing.remove();
      return;
    }
    if (existing && existing.getAttribute("data-key") === key) return;
    if (existing) existing.remove();
    var wrap = buildTable(rows);
    wrap.setAttribute("data-key", key);
    chart.insertAdjacentElement("afterend", wrap);
  }

  // The Damage column is built by gem-priority.js and the chart by
  // dps-chart.js, so a render triggered by either re-checks every chart. A
  // table whose rows are unchanged is left alone, which keeps repeat
  // triggers cheap and stops the observer in registerRenderer from looping.
  window.SiteUtils.registerRenderer(".gem-priority, .dps-chart[data-values]", function () {
    document.querySelectorAll(".dps-chart[data-values]").forEach(renderChartTable);
  });
})();
