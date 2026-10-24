// FORK GUIDE: ENGINE - reusable as-is for any class. Reads the page's own
// "## Gems" columns and "## DPS Spread" chart; the only class-specific inputs
// are those two blocks, no code changes needed here.
//
// Adds a compact "gem upgrade" table under each DPS Spread chart: the DPS
// gained by raising a gem from Lv 7 to 8, 8 to 9, 9 to 10 and 7 to 10. One
// row per skill that runs a damage gem, one row for a cooldown gem, and a
// Total row for every default gem raised together.
//
// EASY EDIT GUIDE: there is nothing to edit per page except the optional
// attribute below. A damage row appears for every skill id that is BOTH in
// the chart's data-ids AND in the page's Damage gem column (gem-priority.js
// col "dmg" rows, primary rows only, not alts). The cooldown row stands for
// every skill in the Cooldown column (col "cd" rows, same rule) and is drawn
// when there is at least one. The table is built from the chart's own
// numbers, so updating data-values after a balance pass updates it too.
//
//   data-optional-gems="surpriseattack"  (on the .dps-chart, comma-separated
//     skill ids, optional)
//     Skills whose damage gem is a choice rather than the default. The chart
//     is recorded without a gem on them, so they get a row marked "Optional"
//     and their gain is computed from the chart share as the no-gem share.
//     Optional rows are left out of the Total.
//
// HOW THE GAINS ARE COMPUTED
//   Skill part. A damage gem multiplies its skill's damage by (1 + d), with
//   d = 32, 36, 40 and 44% at Lv 7, 8, 9 and 10. The chart is recorded with
//   every default gem at Lv 10, so a gem skill's share s is its Lv 10 share.
//   Only that skill's own share matters: with s0 = s / (1 + d10) its no-gem
//   share and rest = 1 - s + s0 the total at gem level L is rest + s0 * d(L),
//   and a step from level a to b gains (rest + s0 * d(b)) / (rest + s0 *
//   d(a)) - 1. Another skill's share never enters. An optional gem skill is
//   not in the chart's gems, so its s0 is the chart share and rest is 1.
//
//   Base AP part. Every gem, damage or cooldown, also adds Base Attack Power
//   (0.6, 0.8, 1.0, 1.2% at Lv 7 to 10), a bonus to the whole character, so a
//   damage row is (1 + skill part) * (1 + Base AP part) - 1 and a cooldown
//   row is the Base AP part alone (the cooldown reduction itself is not
//   valued). Its worth depends on gear a build page cannot know, so it is
//   figured for a high-end setup, where a gem is worth the least: 9/7 Ability
//   Stone and Ancient +25 Vambrace, through the Ark Passive calculator's own
//   AP model and defaults (Weapon Power and Main Stat as typed there, Support
//   held fixed at 98% uptime). The other gems are taken to be at the level
//   the step starts from, so 7 to 8 has all 11 at Lv 7, 8 to 9 all 11 at Lv 8,
//   and 9 to 10 all 11 at Lv 9. The 7 to 10 column chains those three steps,
//   which is what levelling every gem together does.
//
//   Total row. Every default gem (Optional rows excluded) raised together: the
//   skills' damage as one total, T(L) = 1 - sum(s) + sum(s0 * (1 + d(L))),
//   times the Base AP gain of all the gems at once. It is drawn for two or
//   more gems.
//
// OPEN QUESTION (Vambrace flat Basic AP): the live calculator adds it outside
//   the Base AP % multiplier. A calculator branch multiplies it by Base AP %
//   instead; that is not confirmed. VAMBRACE_FLAT_INSIDE_BASE_AP below follows
//   whichever the calculator does. Change it only together with the
//   calculator, then update the figures quoted in project-context.md.

(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("gem-upgrade-table.js");

  // Skill damage bonus of a damage gem by level.
  var GEM_SKILL_DMG = { 7: 0.32, 8: 0.36, 9: 0.4, 10: 0.44 };
  // Base Attack Power % one gem adds by level (same table as bible-decode.js).
  var GEM_BASE_AP = { 7: 0.6, 8: 0.8, 9: 1, 10: 1.2 };
  var UNIT_STEPS = [[7, 8], [8, 9], [9, 10]];
  var STEPS = UNIT_STEPS.concat([[7, 10]]);
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
  var VAMBRACE_FLAT_INSIDE_BASE_AP = false;
  var CORE_AP = Math.sqrt((WEAPON_POWER * MAIN_STAT) / 6);

  // Relative Attack Power gained when `count` gems each go from level a to b,
  // from a character whose other gems all sit at level a. Gear is the
  // high-end setup above. Support is held at its value before the gain and is
  // built from the square root term alone.
  function baseApStepGain(a, b, count) {
    var basePct = GEM_COUNT * GEM_BASE_AP[a] + STONE_BASE_AP + VAMBRACE_ANCIENT_25.pct;
    var dPct = count * (GEM_BASE_AP[b] - GEM_BASE_AP[a]);
    var before = 1 + basePct / 100;
    var support = CORE_AP * before * SUPPORT_COEFFICIENT * SUPPORT_UPTIME;
    var scaled = CORE_AP + (VAMBRACE_FLAT_INSIDE_BASE_AP ? VAMBRACE_ANCIENT_25.flat : 0);
    var outside = VAMBRACE_FLAT_INSIDE_BASE_AP ? 0 : VAMBRACE_ANCIENT_25.flat;
    var apBefore = scaled * before + outside + support;
    var apAfter = scaled * (before + dPct / 100) + outside + support;
    return apAfter / apBefore - 1;
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

  // Fractional DPS gain of raising every default gem skill in `rows` from
  // level a to b together. Optional rows are not part of the default setup.
  function totalSkillGain(rows, a, b) {
    var shareSum = 0;
    var s0Sum = 0;
    rows.forEach(function (row) {
      if (row.optional) return;
      shareSum += row.share / 100;
      s0Sum += row.share / 100 / (1 + GEM_SKILL_DMG[10]);
    });
    var rest = 1 - shareSum;
    return (rest + s0Sum * (1 + GEM_SKILL_DMG[b])) / (rest + s0Sum * (1 + GEM_SKILL_DMG[a])) - 1;
  }

  // The 7 to 10 column chains the three single steps, since every gem levels
  // together; a single step is just itself.
  function chained(step, gainOfStep) {
    if (stepKey(step) !== TOTAL_STEP) return gainOfStep(step[0], step[1]);
    var factor = 1;
    UNIT_STEPS.forEach(function (unit) {
      factor *= 1 + gainOfStep(unit[0], unit[1]);
    });
    return factor - 1;
  }

  function fmtGain(fraction) {
    return "+" + (fraction * 100).toFixed(2) + "%";
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

  // Skill ids in one gem column ("dmg" or "cd") of the page (or tab) the
  // chart sits in. Same scope rule as gem-dps-tooltip.js.
  function columnIds(chart, col) {
    var scope = chart.closest(".tabbed-block") || document;
    var prefix = ".gem-col-" + col + " ";
    var rows = scope.querySelectorAll(
      prefix + ".gem-item:not(.gem-item-expandable), " + prefix + "details.gem-item-expandable > summary"
    );
    var ids = [];
    rows.forEach(function (row) {
      var id = row.getAttribute("data-id");
      if (id) ids.push(id);
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
    var gemIds = {};
    columnIds(chart, "dmg").forEach(function (id) { gemIds[id] = true; });
    var optIds = optionalIds(chart);
    var rows = [];
    data.ids.forEach(function (id, i) {
      var optional = !!optIds[id];
      if (!optional && !gemIds[id]) return;
      rows.push({ id: id, label: data.labels[i], share: data.values[i], optional: optional });
    });
    return rows;
  }

  // The small circled "i" the calculator uses, wired to the site's tooltip
  // panel (skill-tooltip.js) instead of a native title.
  function infoIcon(text) {
    var icon = el("span", "ap-brace-info-icon");
    icon.setAttribute("role", "img");
    icon.setAttribute("aria-label", text);
    if (window.SkillTooltip && window.SkillTooltip.wireCustom) {
      var tip = el("div", "skill-tip md-typeset");
      tip.setAttribute("role", "tooltip");
      tip.appendChild(el("p", "skill-tip-note", text));
      window.SkillTooltip.wireCustom(icon, tip);
    } else {
      icon.setAttribute("title", text);
    }
    return icon;
  }

  var HEADER_TIP =
    "Each figure includes an estimate of the Base Attack Power the gem adds, with your other gems at the level the step starts from, " +
    "a 9/7 Ability Stone and an Ancient +25 Vambrace. Weaker gear gains more.";
  var COOLDOWN_TIP =
    "Only the Base Attack Power each cooldown gem adds. The cooldown reduction itself is not counted, so the real gain is higher.";

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
    if (row.tip) inner.appendChild(infoIcon(row.tip));
    td.appendChild(inner);
    return td;
  }

  function valueCell(text, step) {
    return el("td", "gem-upgrade-val" + (stepKey(step) === TOTAL_STEP ? " gem-upgrade-total" : ""), text);
  }

  function buildTable(rows, cooldownCount) {
    var wrap = el("div", "ap-acc-table-scroll gem-upgrade-scroll");
    var table = el("table", "ap-brace-compare-table gem-upgrade-table");
    table.setAttribute("aria-label", "DPS gain from raising each gem level");

    var colgroup = el("colgroup");
    ["skill", "step", "step", "step", "total"].forEach(function (kind) {
      colgroup.appendChild(el("col", "gem-upgrade-col-" + kind));
    });
    table.appendChild(colgroup);

    var thead = el("thead");
    var top = el("tr");
    top.appendChild(el("th", "ap-brace-th-label", "Gem"));
    var group = el("th", "ap-arkgrid-th-group", "DPS Gain by Gem Level");
    group.appendChild(infoIcon(HEADER_TIP));
    group.setAttribute("colspan", String(STEPS.length));
    top.appendChild(group);
    thead.appendChild(top);

    var sub = el("tr");
    sub.appendChild(el("th", "gem-upgrade-th-kind", "Damage"));
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
        var gain = chained(step, function (a, b) {
          return (1 + skillGain(row.share, row.optional, a, b)) * (1 + baseApStepGain(a, b, 1)) - 1;
        });
        tr.appendChild(valueCell(fmtGain(gain), step));
      });
      tbody.appendChild(tr);
    });

    if (cooldownCount > 0) {
      var cd = el("tr", "gem-upgrade-cd");
      cd.appendChild(skillCell({ id: "", label: "Each cooldown gem", optional: false, tip: COOLDOWN_TIP }));
      STEPS.forEach(function (step) {
        cd.appendChild(valueCell(fmtGain(chained(step, function (a, b) { return baseApStepGain(a, b, 1); })), step));
      });
      tbody.appendChild(cd);
    }

    var damageCount = rows.filter(function (r) { return !r.optional; }).length;
    var gemCount = damageCount + cooldownCount;
    if (gemCount >= 2) {
      var sum = el("tr", "gem-upgrade-sum");
      sum.appendChild(skillCell({ id: "", label: "Total (" + gemCount + " gems)", optional: false }));
      STEPS.forEach(function (step) {
        var gain = chained(step, function (a, b) {
          return (1 + totalSkillGain(rows, a, b)) * (1 + baseApStepGain(a, b, gemCount)) - 1;
        });
        sum.appendChild(valueCell(fmtGain(gain), step));
      });
      tbody.appendChild(sum);
    }
    table.appendChild(tbody);

    wrap.appendChild(table);
    return wrap;
  }

  function renderChartTable(chart) {
    var frame = chart.parentElement;
    if (!frame) return;
    var rows = collectRows(chart);
    var cooldownCount = columnIds(chart, "cd").length;
    var key = rows.map(function (r) { return r.id + ":" + r.share + ":" + r.optional; }).join("|") + "#" + cooldownCount;
    var existing = frame.querySelector(":scope > .gem-upgrade-scroll");
    if (!rows.length) {
      if (existing) existing.remove();
      return;
    }
    if (existing && existing.getAttribute("data-key") === key) return;
    if (existing) existing.remove();
    var wrap = buildTable(rows, cooldownCount);
    wrap.setAttribute("data-key", key);
    chart.insertAdjacentElement("afterend", wrap);
  }

  // The gem columns are built by gem-priority.js and the chart by
  // dps-chart.js, so a render triggered by either re-checks every chart. A
  // table whose rows are unchanged is left alone, which keeps repeat
  // triggers cheap and stops the observer in registerRenderer from looping.
  window.SiteUtils.registerRenderer(".gem-priority, .dps-chart[data-values]", function () {
    document.querySelectorAll(".dps-chart[data-values]").forEach(renderChartTable);
  });
})();
