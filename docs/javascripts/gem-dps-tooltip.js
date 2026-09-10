// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Adds a rich hover tooltip (skill-tooltip.js's shared panel, via
// window.SkillTooltip.attach) to every gem card in both the "## Gems"
// columns, in two flavors:
//
//   - Damage column: leads with that skill's damage share, reusing the
//     numbers already authored for the "## Trixion DPS" chart further
//     down the same page (see dps-chart.js) instead of hand-duplicating
//     them onto the gem cards. Formerly a bare native `title` with just
//     the percentage and no tags/note - upgraded for visual consistency
//     with every other tooltip trigger on the site now (.skill-inline,
//     rotation chips, Ark Grid cores).
//   - Cooldown column: Cooldown gems aren't damage skills, so there's no
//     meaningful "% of total damage" figure to lead with - these just
//     get the skill's usual tags/note (same DB_SKILL_DATA a Skill Setup
//     card's expanded body already shows), plus that row's own author-
//     supplied "tip" text underneath if one was given (gem-priority.js's
//     per-item "tip" field, e.g. "swap to the alt below when running
//     113") - see skill-tooltip.js's opts.extra.
//
// Both flavors also suppress skill-tooltip.js's own tap-to-toggle click
// behavior on an EXPANDABLE gem row's <summary> (opts.tapToggle: false),
// and register a toggle-safety listener that force-closes the tooltip
// the instant that row's <details> opens. Without either, tapping an
// expandable row on a touch device (no real hover to fall back on) would
// open the tooltip at the same time as the alts list beneath it, and the
// tooltip - appended to <body>, positioned right under the row - renders
// on top of the very content the tap was trying to reveal. Clicking still
// expands/collapses the row exactly as before either way; only the
// SEPARATE forced-open-until-tapped-elsewhere tooltip behavior is turned
// off for these rows. Hover/focus (a mouse user resting the pointer on a
// closed row) are unaffected, hence the toggle listener as a second
// safety net: hovering then clicking without moving the mouse away first
// would otherwise leave the tooltip visible via state.hover alone, with
// no click involved at all.
//
// Must load after gem-priority.js (needs each row's data-id/data-gem-tip
// already in the DOM) and skill-tooltip.js (needs window.SkillTooltip to
// exist) - see the extra_javascript order in mkdocs.yml.
//
// EASY EDIT GUIDE: there is nothing to edit here. Once a build page's
// <div class="dps-chart" data-labels="..." data-values="..."
// data-ids="..."> is correct, matching gem cards in its "## Gems" ->
// Damage column pick up the same numbers automatically by matching on
// skill id - a gem-priority.js row's data-id (e.g. "fatalwave") against
// the chart's data-ids at the same position. Falls back to comparing
// rendered name text (old behavior) only if the chart has no data-ids
// at all, for any chart that hasn't been given one yet. A Damage gem with
// no id/name match in the chart (e.g. it's absent from that build's
// recorded split) is just left without a tooltip. Cooldown gems need no
// chart at all - they're wired directly off the "cd" column's own rows.
// The only per-page authoring surface either flavor has is gem-priority.js's
// own "tip" field - see that file's EASY EDIT GUIDE.

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

  // True for the <summary> of an expandable gem row (gem-priority.js's
  // details.gem-item-expandable > summary) - shared by both column
  // flavors below to decide whether to suppress SkillTooltip's tap-
  // toggle and register the toggle-safety listener. A plain (non-
  // expandable) .gem-item is never a <summary> at all, so this is false
  // for those without needing a separate check.
  function isExpandableSummary(el) {
    return el.tagName === "SUMMARY" && el.parentElement && el.parentElement.classList.contains("gem-item-expandable");
  }

  // See the file-level comment above for why this exists. `details.__
  // gemTipToggleWired` guards against double-registering the same
  // listener across repeated renderer triggers (instant-nav re-render,
  // the MutationObserver belt-and-suspenders pass) the same way skill-
  // tooltip.js's own .skill-tip-wired class guards wire() itself.
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

        attachOne(el, fmtPct(pct) + " of total damage", el.getAttribute("data-gem-tip") || undefined);
      });
    });
  }

  // Cooldown gems have no chart data to look up at all - no per-chart
  // scoping needed the way Damage's shareMap lookup requires above, just
  // wire every Cooldown row on the page directly. No opts.primary (no
  // damage-share figure exists for these), just this row's own "tip"
  // text as opts.extra if one was authored - skill-tooltip.js's
  // buildTip() already renders plain tags/note fine with no primary at
  // all, same as a rotation chip or .skill-inline mention.
  function applyCooldownTooltips() {
    var cdItems = document.querySelectorAll(
      ".gem-col-cd .gem-item:not(.gem-item-expandable), " +
      ".gem-col-cd details.gem-item-expandable > summary"
    );
    cdItems.forEach(function (el) {
      attachOne(el, undefined, el.getAttribute("data-gem-tip") || undefined);
    });
  }

  // Formerly a hand-rolled copy of the same three-trigger pattern
  // SiteUtils.registerRenderer() now centralizes (direct/hard load,
  // Material instant-nav via document$, and a MutationObserver belt-and-
  // suspenders) - see that helper's doc comment in site-utils.js. Both
  // apply*Tooltips() functions scan the whole document rather than a
  // single container, so renderContainer below ignores the specific
  // container registerRenderer hands it and just re-scans everything;
  // they're already idempotent (SkillTooltip.attach's own .skill-tip-
  // wired guard), so calling them redundantly across matches and
  // triggers is harmless, same as every registerRenderer-based widget on
  // this site. Selector kept identical to this file's old MutationObserver
  // matcher so it re-runs on the same set of DOM changes as before.
  window.SiteUtils.registerRenderer(".gem-priority, .dps-chart", function () {
    applyDamageTooltips();
    applyCooldownTooltips();
  });
})();
