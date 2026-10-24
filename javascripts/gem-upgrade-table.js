(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("gem-upgrade-table.js");
  var GEM_SKILL_DMG = { 7: 0.32, 8: 0.36, 9: 0.4, 10: 0.44 };
  var GEM_BASE_AP = { 7: 0.6, 8: 0.8, 9: 1, 10: 1.2 };
  var STEPS = [[7, 8], [8, 9], [9, 10], [7, 10]];
  var TOTAL_STEP = "7-10";
  var WEAPON_POWER = 259216;
  var MAIN_STAT = 854918;
  var SUPPORT_COEFFICIENT = 0.4;
  var SUPPORT_UPTIME = 0.98;
  var STONE_BASE_AP = 1.5;
  var GEM_COUNT = 11;
  var VAMBRACE_ANCIENT_25 = { pct: 3, flat: 9050 };
  var CORE_AP = Math.sqrt((WEAPON_POWER * MAIN_STAT) / 6);
  function baseApGain(basePct, flat, dPct) {
    var before = 1 + basePct / 100;
    var support = CORE_AP * before * SUPPORT_COEFFICIENT * SUPPORT_UPTIME;
    var apBefore = CORE_AP * before + flat + support;
    return (CORE_AP * dPct) / 100 / apBefore;
  }
  function baseApRange(a, b) {
    var d = GEM_BASE_AP[b] - GEM_BASE_AP[a];
    var low = baseApGain(GEM_COUNT * GEM_BASE_AP[7], 0, d);
    var highBefore = GEM_COUNT * GEM_BASE_AP[10] + STONE_BASE_AP + VAMBRACE_ANCIENT_25.pct - d;
    var high = baseApGain(highBefore, VAMBRACE_ANCIENT_25.flat, d);
    return [Math.min(low, high), Math.max(low, high)];
  }
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
  window.SiteUtils.registerRenderer(".gem-priority, .dps-chart[data-values]", function () {
    document.querySelectorAll(".dps-chart[data-values]").forEach(renderChartTable);
  });
})();
