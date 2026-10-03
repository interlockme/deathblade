(function () {
  function fmtDifficulty(n) {
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
