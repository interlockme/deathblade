(function () {
  var fmtPct = window.SiteUtils.formatPct;
  function buildShareMap(chart) {
    var values = (chart.getAttribute("data-values") || "")
      .split(",")
      .map(function (s) { return parseFloat(s.trim()); });
    var idsAttr = chart.getAttribute("data-ids");
    var ids = idsAttr
      ? idsAttr.split(",").map(function (s) { return s.trim(); })
      : null;
    var labels = window.SiteUtils.resolveChartLabels(chart, ids) || [];
    if (!values.length || values.length !== labels.length || values.some(isNaN)) {
      return null;
    }
    if (ids && ids.length !== values.length) ids = null;
    var byId = {};
    var byName = {};
    labels.forEach(function (label, i) {
      byName[label.toLowerCase()] = values[i];
      if (ids && ids[i]) byId[ids[i]] = values[i];
    });
    return { byId: byId, byName: byName };
  }
  function isExpandableSummary(el) {
    return el.tagName === "SUMMARY" && el.parentElement && el.parentElement.classList.contains("gem-item-expandable");
  }
  function wireCollapseOnOpen(summary) {
    var details = summary.parentElement;
    if (!details || details.__gemTipToggleWired) return;
    details.__gemTipToggleWired = true;
    details.addEventListener("toggle", function () {
      if (details.open) window.SkillTooltip.hide(summary);
    });
  }
  function attachOne(el, primary, extra) {
    var id = el.getAttribute("data-id");
    if (!id) return;
    var expandable = isExpandableSummary(el);
    var wired = window.SkillTooltip.attach(el, id, primary, {
      extra: extra,
      tapToggle: expandable ? false : undefined,
    });
    if (wired && expandable) wireCollapseOnOpen(el);
  }
  function applyDamageTooltips() {
    var charts = document.querySelectorAll(".dps-chart[data-values]");
    if (!charts.length) return;
    charts.forEach(function (chart) {
      var shareMap = buildShareMap(chart);
      if (!shareMap) return;
      var scope = chart.closest(".tabbed-block") || document;
      var dmgItems = scope.querySelectorAll(
        ".gem-col-dmg .gem-item:not(.gem-item-expandable), " +
        ".gem-col-dmg details.gem-item-expandable > summary"
      );
      dmgItems.forEach(function (el) {
        var nameEl = el.querySelector(".gem-item-name");
        if (!nameEl) return;
        var id = el.getAttribute("data-id");
        if (!id) return;
        var pct = id in shareMap.byId ? shareMap.byId[id] : undefined;
        if (pct === undefined) {
          var name = nameEl.textContent.trim().toLowerCase();
          pct = shareMap.byName[name];
        }
        attachOne(el, pct !== undefined ? fmtPct(pct) + " of total damage" : undefined, el.getAttribute("data-gem-tip") || undefined);
      });
    });
  }
  function applyCooldownTooltips() {
    var cdItems = document.querySelectorAll(
      ".gem-col-cd .gem-item:not(.gem-item-expandable), " +
      ".gem-col-cd details.gem-item-expandable > summary"
    );
    cdItems.forEach(function (el) {
      attachOne(el, undefined, el.getAttribute("data-gem-tip") || undefined);
    });
  }
  window.SiteUtils.registerRenderer(".gem-priority, .dps-chart", function () {
    applyDamageTooltips();
    applyCooldownTooltips();
  });
})();
