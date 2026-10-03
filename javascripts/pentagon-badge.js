(function () {
  var fmt = window.SiteUtils.formatStat;
  var pointsToAttr = window.SiteUtils.pentagonPointsToAttr;
  var svgEl = window.SiteUtils.svgEl;
  var radar = window.SiteUtils.radar;
  function buildPentagonSvg(values, labels, accent, tooltipNote) {
    var angles = radar.angles(5);
    var svg = svgEl("svg", {
      viewBox: radar.VIEWBOX,
      class: "pentagon-svg",
      role: "img",
      "aria-label": labels
        .map(function (l, i) { return l + " " + values[i] + " out of 10"; })
        .join(", "),
    });
    var uid = "pentagon-" + Math.random().toString(36).slice(2, 9);
    var defs = svgEl("defs", {});
    var grad = svgEl("radialGradient", { id: "fill-" + uid, cx: "50%", cy: "45%", r: "65%" });
    grad.appendChild(svgEl("stop", { offset: "0%", "stop-color": accent, "stop-opacity": "0.55" }));
    grad.appendChild(svgEl("stop", { offset: "100%", "stop-color": accent, "stop-opacity": "0.18" }));
    defs.appendChild(grad);
    svg.appendChild(defs);
    radar.drawGrid(svg, angles);
    var dataPts = radar.dataPoints(angles, values);
    svg.appendChild(
      svgEl("polygon", {
        points: pointsToAttr(dataPts),
        fill: "url(#fill-" + uid + ")",
        stroke: accent,
        "stroke-width": "1.75",
        "stroke-linejoin": "round",
        class: "pentagon-data",
      })
    );
    dataPts.forEach(function (p) {
      svg.appendChild(svgEl("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: "2.6", class: "pentagon-dot" }));
    });
    radar.drawLabels(svg, angles, labels, function (text, i) {
      var title = svgEl("title", {});
      title.textContent = labels[i] + ": " + fmt(values[i]) + "/10" + (tooltipNote && i === 3 ? " - " + tooltipNote : "");
      text.appendChild(title);
    });
    return svg;
  }
  function resolveBadgeData(badge) {
    var buildId = badge.getAttribute("data-build");
    var familyId = badge.getAttribute("data-family");
    if (buildId && familyId) {
      var family = window.DB_BUILD_DATA && window.DB_BUILD_DATA[familyId];
      var build = family && family.builds.filter(function (b) { return b.id === buildId; })[0];
      if (!family || !build || !build.pentagon) {
        return null;
      }
      var caption = null;
      if (family.axisNote && typeof family.axisNoteIndex === "number") {
        caption = family.axisNote;
      }
      return {
        values: build.pentagon,
        labels: family.axisLabels,
        accent: build.accent || "#ee83ab",
        caption: caption,
      };
    }
    if (!badge.hasAttribute("data-values")) return null;
    var rawValues = (badge.getAttribute("data-values") || "").split(",").map(function (s) {
      return parseFloat(s.trim());
    });
    var rawLabels = (badge.getAttribute("data-labels") || "Difficulty,DPS,Mobility,Recovery,Speed")
      .split(",")
      .map(function (s) { return s.trim(); });
    if (rawValues.length !== 5 || rawLabels.length !== 5 || rawValues.some(isNaN)) {
      return null;
    }
    return {
      values: rawValues,
      labels: rawLabels,
      accent: badge.getAttribute("data-accent") || "#ee83ab",
      caption: badge.getAttribute("data-caption") || null,
    };
  }
  function renderBadge(badge) {
    var mount = badge.querySelector(".pentagon-svg-mount");
    if (!mount) return;
    var resolved = resolveBadgeData(badge);
    if (!resolved) return;
    mount.innerHTML = "";
    mount.appendChild(buildPentagonSvg(resolved.values, resolved.labels, resolved.accent, resolved.caption));
    if (resolved.caption && !badge.querySelector(".pentagon-badge-caption")) {
      var captionEl = document.createElement("div");
      captionEl.className = "pentagon-badge-caption";
      captionEl.textContent = resolved.caption;
      badge.appendChild(captionEl);
    }
  }
  window.SiteUtils.registerRenderer(".pentagon-badge[data-build], .pentagon-badge[data-values]", renderBadge);
})();
