// Adds a native hover tooltip to each Damage-column gem card showing
// that skill's damage share, reusing the numbers already authored for
// the "## Trixion DPS" chart further down the same page (see
// dps-chart.js) instead of hand-duplicating them onto the gem cards.
//
// Damage gems only - Cooldown-column gems aren't damage skills, so
// there's no meaningful "% of total damage" figure to show them.
//
// EASY EDIT GUIDE: there is nothing to edit here. Once a build page's
// <div class="dps-chart" data-labels="..." data-values="..."> is
// correct, matching gem cards in its "## Gems" -> Damage column pick
// up the same numbers automatically by matching on the skill name -
// "Fatal Wave" gem card <-> "Fatal Wave" chart label. A gem whose name
// has no matching chart label (e.g. it's absent from that build's
// recorded split) is just left without a tooltip.

(function () {
  function fmtPct(n) {
    // Same rounding as dps-chart.js's fmtPct - trims to at most 1
    // decimal, drops a trailing ".0" so whole numbers read as "34%".
    var r = Math.round(n * 10) / 10;
    return (r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)) + "%";
  }

  function buildShareMap(chart) {
    var values = (chart.getAttribute("data-values") || "")
      .split(",")
      .map(function (s) { return parseFloat(s.trim()); });
    var labels = (chart.getAttribute("data-labels") || "")
      .split(",")
      .map(function (s) { return s.trim(); });
    if (!values.length || values.length !== labels.length || values.some(isNaN)) {
      return null; // malformed data - same "fail quietly" rule dps-chart.js follows
    }
    var map = {};
    labels.forEach(function (label, i) {
      map[label.toLowerCase()] = values[i];
    });
    return map;
  }

  function applyTooltips() {
    var charts = document.querySelectorAll(".dps-chart[data-values]");
    if (!charts.length) return;

    charts.forEach(function (chart) {
      var shareMap = buildShareMap(chart);
      if (!shareMap) return;

      // The chart can sit anywhere on the page relative to the gem
      // cards, so scope the lookup to the nearest ancestor that also
      // contains a "## Gems" panel rather than assuming document-wide
      // (a page could in theory embed more than one build/chart pair
      // inside tabs). Fall back to the whole document if no shared
      // ancestor is found, which still matches today's one-chart pages.
      var scope = chart.closest(".tabbed-block") || document;

      var dmgItems = scope.querySelectorAll(
        ".gem-col-dmg .gem-item:not(.gem-item-expandable), " +
        ".gem-col-dmg details.gem-item-expandable > summary"
      );

      dmgItems.forEach(function (el) {
        var nameEl = el.querySelector(".gem-item-name");
        if (!nameEl) return;
        var name = nameEl.textContent.trim().toLowerCase();
        if (!(name in shareMap)) return;

        var pct = shareMap[name];
        el.title = nameEl.textContent.trim() + ": " + fmtPct(pct) + " of total damage";
      });
    });
  }

  if (window.document$) {
    document$.subscribe(function () {
      applyTooltips();
    });
  }
})();
