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
  var el = window.SiteUtils.el;
  var ARK_LABEL = { none: "No Ark Grid", little: "Some Ark Grid", full: "Full Ark Grid" };
  function findBuild(familyId, buildId) {
    var family = window.DB_BUILD_DATA && window.DB_BUILD_DATA[familyId];
    return (family && family.builds.filter(function (b) { return b.id === buildId; })[0]) || null;
  }
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
