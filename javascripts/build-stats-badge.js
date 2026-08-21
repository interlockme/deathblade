// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Renders the Difficulty/Trixion/Playstyle stat cards at the top of each
// build page from window.DB_BUILD_DATA - the SAME single source of truth
// pentagon-badge.js and build-compare.js already read. Before this file,
// these three numbers were hand-typed HTML on every build page (including
// a manually-computed bar width%), a second copy of data that already
// lived in build-data.js with nothing keeping the two in sync.
//
// EASY EDIT GUIDE: to change a build's Difficulty/Trixion/Playstyle,
// edit build-data.js ONLY - this file just turns those fields into the
// existing .stat markup/CSS (stylesheets/extra.css's ".build-stats"
// comment documents that markup shape; unchanged here).
//
//   difficulty bar width%  = difficulty / 10 * 100
//   trixion bar width%     = (trixion - 1.0) / 0.3 * 100, on the FIXED
//                             1.0-1.3 scale documented in extra.css next
//                             to .stat-bar-track-teal - NOT the build's
//                             own min/max. Don't rescale this per family.
//   trixion === null       -> "Not measured", no bar (e.g. Standard)
//   trixionConfirmed=false -> .stat-bar-fill-unconfirmed (diagonal stripe)
//                             instead of .stat-bar-fill-teal
//
// Markup: <div class="build-stats" data-build="111-head-hunt"
//   data-family="re"></div> - same data-build/data-family pair already
// used on that build's .pentagon-badge div right below it in the .md.
//
// Must load after build-data.js and site-utils.js - see the
// extra_javascript order in mkdocs.yml.
(function () {
  function fmtDifficulty(n) {
    // Trailing .0 looks wrong next to "8 / 10" - only keep the decimal
    // when the value actually has one (e.g. 8.5).
    return (Math.round(n * 10) / 10).toString();
  }

  function resolveStatsData(el) {
    var buildId = el.getAttribute("data-build");
    var familyId = el.getAttribute("data-family");
    if (!buildId || !familyId) return null;

    var family = window.DB_BUILD_DATA && window.DB_BUILD_DATA[familyId];
    var build = family && family.builds.filter(function (b) { return b.id === buildId; })[0];
    if (!family || !build) return null;

    return {
      difficulty: build.difficulty,
      trixion: build.trixion,
      trixionConfirmed: build.trixionConfirmed !== false,
      playstyle: build.playstyle,
    };
  }

  function buildStatEl(label, valueText, barHtml) {
    var stat = window.SiteUtils.el("div", "stat");
    stat.appendChild(window.SiteUtils.el("span", "stat-label", label));
    stat.appendChild(window.SiteUtils.el("span", "stat-value", valueText));
    if (barHtml) stat.appendChild(barHtml);
    return stat;
  }

  function barTrack(fillClass, trackClass, widthPct) {
    var track = window.SiteUtils.el("div", "stat-bar-track" + (trackClass ? " " + trackClass : ""));
    var fill = window.SiteUtils.el("div", "stat-bar-fill" + (fillClass ? " " + fillClass : ""));
    fill.style.width = widthPct + "%";
    track.appendChild(fill);
    return track;
  }

  function renderStats(el) {
    var data = resolveStatsData(el);
    if (!data) return;

    el.innerHTML = "";

    var diffPct = Math.max(0, Math.min(100, (data.difficulty / 10) * 100));
    el.appendChild(buildStatEl(
      "Difficulty",
      fmtDifficulty(data.difficulty) + " / 10",
      barTrack(null, null, diffPct)
    ));

    if (data.trixion == null) {
      el.appendChild(buildStatEl("Trixion DPS", "Not measured", null));
    } else {
      var trixPct = Math.max(0, Math.min(100, ((data.trixion - 1.0) / 0.3) * 100));
      var fillClass = data.trixionConfirmed ? "stat-bar-fill-teal" : "stat-bar-fill-unconfirmed";
      el.appendChild(buildStatEl(
        "Trixion DPS",
        data.trixion.toFixed(2) + " Multiplier",
        barTrack(fillClass, "stat-bar-track-teal", trixPct)
      ));
    }

    el.appendChild(buildStatEl("Playstyle", data.playstyle, null));
  }

  window.SiteUtils.registerRenderer(".build-stats[data-build]", renderStats);
})();
