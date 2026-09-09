// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Adds a rich hover tooltip (skill-tooltip.js's shared panel, via
// window.SkillTooltip.attach) to each Damage-column gem card, leading
// with that skill's damage share - reusing the numbers already authored
// for the "## Trixion DPS" chart further down the same page (see
// dps-chart.js) instead of hand-duplicating them onto the gem cards -
// with that skill's usual tags/note underneath (same DB_SKILL_DATA a
// Skill Setup card's expanded body already shows, see skill-tooltip.js),
// shown secondary to the damage-share line since that number is the
// reason someone's hovering a gem priority row in the first place.
// Formerly a bare native `title` with just the percentage and no
// tags/note - upgraded for visual consistency with every other tooltip
// trigger on the site now (.skill-inline, rotation chips, Ark Grid
// cores).
//
// Damage gems only - Cooldown-column gems aren't damage skills, so
// there's no meaningful "% of total damage" figure to show them.
//
// Must load after gem-priority.js (needs each row's data-id already in
// the DOM) and skill-tooltip.js (needs window.SkillTooltip.attach to
// exist) - see the extra_javascript order in mkdocs.yml.
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
  var fmtPct = window.SiteUtils.formatPct; // moved to site-utils.js - was identical to dps-chart.js's own copy

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

        // id is always present in practice (gem-priority.js stamps it on
        // every row), but the pct-matching fallback right above is
        // name-based specifically to tolerate an old chart with no
        // data-ids yet - guard here too rather than assume.
        if (!id) return;
        window.SkillTooltip.attach(el, id, fmtPct(pct) + " of total damage");
      });
    });
  }

  // Formerly a hand-rolled copy of the same three-trigger pattern
  // SiteUtils.registerRenderer() now centralizes (direct/hard load,
  // Material instant-nav via document$, and a MutationObserver belt-and-
  // suspenders) - see that helper's doc comment in site-utils.js.
  // applyTooltips() itself scans the whole document rather than a single
  // container, so renderContainer below ignores the specific container
  // registerRenderer hands it and just re-scans everything; it's already
  // idempotent (just (re)sets el.title), so calling it redundantly across
  // matches and triggers is harmless, same as every registerRenderer-based
  // widget. Selector kept identical to this file's old MutationObserver
  // matcher so it re-runs on the same set of DOM changes as before.
  window.SiteUtils.registerRenderer(".gem-priority, .dps-chart", function () {
    applyTooltips();
  });
})();
