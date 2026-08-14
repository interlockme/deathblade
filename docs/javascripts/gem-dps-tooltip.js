// Adds a native hover tooltip to each Damage-column gem card showing
// that skill's damage share, reusing the numbers already authored for
// the "## Trixion DPS" chart further down the same page (see
// dps-chart.js) instead of hand-duplicating them onto the gem cards.
//
// Damage gems only - Cooldown-column gems aren't damage skills, so
// there's no meaningful "% of total damage" figure to show them.
//
// EASY EDIT GUIDE: there is nothing to edit here. Once a build page's
// <div class="dps-chart" data-labels="..." data-values="..."
// data-ids="..."> is correct, matching gem cards in its "## Gems" ->
// Damage column pick up the same numbers automatically by matching on
// skill id - a gem-priority.js row's data-id (e.g. "fatalwave") against
// the chart's data-ids at the same position. Falls back to comparing
// rendered name text (old behavior) only if the chart has no data-ids
// at all, for any chart that hasn't been given one yet. A gem with no
// id/name match in the chart (e.g. it's absent from that build's
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

    var idsAttr = chart.getAttribute("data-ids");
    var ids = idsAttr
      ? idsAttr.split(",").map(function (s) { return s.trim(); })
      : null;
    if (ids && ids.length !== values.length) ids = null; // malformed - ignore, name fallback still applies

    var byId = {};
    var byName = {};
    labels.forEach(function (label, i) {
      byName[label.toLowerCase()] = values[i];
      if (ids && ids[i]) byId[ids[i]] = values[i];
    });
    return { byId: byId, byName: byName };
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

        var id = el.getAttribute("data-id");
        var pct = id && id in shareMap.byId ? shareMap.byId[id] : undefined;
        if (pct === undefined) {
          var name = nameEl.textContent.trim().toLowerCase();
          pct = shareMap.byName[name];
        }
        if (pct === undefined) return;

        el.title = nameEl.textContent.trim() + ": " + fmtPct(pct) + " of total damage";
      });
    });
  }

  // Same three-trigger pattern SiteUtils.registerRenderer() documents
  // (direct/hard load, Material instant-nav via document$, and a
  // MutationObserver belt-and-suspenders) - this file predates that
  // helper and only had the document$ leg, which meant a plain page
  // load could race gem-priority.js's own render (or land in a gap
  // where document$ had already fired once before this subscription
  // was registered and never fires again on that load), leaving the
  // Damage column with no tooltips until an actual nav occurred.
  // applyTooltips() itself is already idempotent (just (re)sets
  // el.title), so calling it redundantly across all three triggers is
  // harmless, same as every registerRenderer-based widget.
  function run() {
    applyTooltips();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  if (window.document$) {
    document$.subscribe(run);
  }

  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && (node.matches(".gem-priority, .dps-chart") || node.querySelector(".gem-priority, .dps-chart"))) {
            run();
          }
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
