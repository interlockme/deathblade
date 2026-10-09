// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Also renders the home page rows and exports the shared build pitch pieces
// (window.BuildView) that build-compare.js reuses; see "Shared build pitch" below.
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

  // ---- Shared build pitch: home rows and compare rows -------------------
  // Both show the same one-line pitch for a build (emoji, name, descriptor line,
  // description, Difficulty and Trixion meters), all read from build-data.js, so
  // editing a build there updates the home page and the essentials comparison
  // together. The pieces are exported as window.BuildView for build-compare.js
  // (which loads after this file). The meter bars use the same scales as
  // renderStats above; an unconfirmed Trixion value keeps its "?" and striped
  // fill, and a build with no Trixion figure (Standard) shows an empty meter
  // with a dash so the rows line up.
  var el = window.SiteUtils.el;
  var ARK_LABEL = { none: "No Ark Grid", little: "Some Ark Grid", full: "Full Ark Grid" };

  function findBuild(familyId, buildId) {
    var family = window.DB_BUILD_DATA && window.DB_BUILD_DATA[familyId];
    return (family && family.builds.filter(function (b) { return b.id === buildId; })[0]) || null;
  }

  // "333 (Ceiling)" -> ["333", "Ceiling"]; a name with no brackets has no label.
  function nameParts(build) {
    var m = /^(\S+)\s*\((.*)\)$/.exec(build.name);
    return m ? [m[1], m[2]] : [build.name, ""];
  }

  function meter(kind, label, valueText, pct, unconfirmed) {
    var m = el("div", "home-meter home-meter--" + kind + (unconfirmed ? " home-meter--unconfirmed" : ""));
    var top = el("div", "home-meter-top");
    top.appendChild(el("span", "home-meter-label", label));
    top.appendChild(el("span", "home-meter-value", valueText));
    m.appendChild(top);
    var track = el("div", "home-meter-track");
    var fill = el("div", "home-meter-fill");
    fill.style.width = pct + "%";
    track.appendChild(fill);
    m.appendChild(track);
    return m;
  }

  // Fills `box` with the Difficulty and Trixion meters of `build`.
  function fillMeters(box, build) {
    box.innerHTML = "";
    var diffPct = Math.max(0, Math.min(100, (build.difficulty / 10) * 100));
    box.appendChild(meter("difficulty", "Difficulty", fmtDifficulty(build.difficulty) + " / 10", diffPct, false));
    if (build.trixion == null) {
      box.appendChild(meter("trixion", "Trixion DPS", "\u2014", 0, false));
      return box;
    }
    var confirmed = build.trixionConfirmed !== false;
    var trixPct = Math.max(0, Math.min(100, ((build.trixion - 1.0) / 0.3) * 100));
    box.appendChild(meter("trixion", "Trixion DPS", build.trixion.toFixed(2) + "x" + (confirmed ? "" : " ?"), trixPct, !confirmed));
    return box;
  }

  // The descriptor line: the build's words, then the coloured flag
  // (recommended or not viable).
  function wordsEl(build) {
    var line = el("div", "home-row-words", build.words);
    var flag = null;
    if (build.viable === false) flag = el("span", "home-words-flag", "\u26A0\uFE0E not viable");
    else if (build.recommended) flag = el("span", "home-words-flag", "\u2605 recommended");
    if (flag) {
      flag.setAttribute("data-kind", build.viable === false ? "warn" : "star");
      line.appendChild(document.createTextNode(" "));
      line.appendChild(flag);
    }
    return line;
  }

  window.BuildView = {
    ARK_LABEL: ARK_LABEL,
    findBuild: findBuild,
    nameParts: nameParts,
    fillMeters: fillMeters,
    wordsEl: wordsEl,
  };

  // Home page rows: <div class="home-row" data-family="re" data-build="333-ceiling">
  // holds only the link (the name, a real markdown link) and, on a build row, an
  // empty .home-meters that reserves its height. This fills in the emoji, the
  // descriptor line, the description, the Ark Grid pill and the meters, and marks
  // a build that is not viable. Generated nodes carry data-gen so a re-render
  // replaces them instead of adding a second set.
  function renderHomeRow(row) {
    var build = findBuild(row.getAttribute("data-family"), row.getAttribute("data-build"));
    if (!build) return;
    row.querySelectorAll("[data-gen]").forEach(function (n) { n.remove(); });
    var head = row.querySelector(".home-row-head");
    var main = row.querySelector(".home-row-main");
    var side = row.querySelector(".home-row-side");
    if (!head || !main || !side) return;

    if (build.viable === false) row.setAttribute("data-kind", "variant");

    var emoji = el("span", "home-row-emoji", build.emoji);
    emoji.setAttribute("data-gen", "");
    head.insertBefore(emoji, head.firstChild);

    var words = wordsEl(build);
    words.setAttribute("data-gen", "");
    main.appendChild(words);
    var desc = el("div", "home-row-desc", build.desc);
    desc.setAttribute("data-gen", "");
    main.appendChild(desc);

    var pill = el("span", "home-pill", ARK_LABEL[build.ark]);
    pill.setAttribute("data-kind", build.ark);
    pill.setAttribute("data-gen", "");
    side.insertBefore(pill, side.firstChild);

    var meters = row.querySelector(".home-meters");
    if (meters) fillMeters(meters, build);
  }

  window.SiteUtils.registerRenderer(".build-stats[data-build]", renderStats);
  window.SiteUtils.registerRenderer(".home-row[data-build]", renderHomeRow);
})();
