(function () {
  var TAU = Math.PI * 2;
  var toPoint = window.SiteUtils.pentagonPoint;
  var fmt = window.SiteUtils.formatStat;
  var pointsToAttr = window.SiteUtils.pentagonPointsToAttr;
  var svgEl = window.SiteUtils.svgEl;
  function buildPentagonSvg(values, labels, accent, tooltipNote) {
    var cx = 100, cy = 98, rMax = 60;
    var angles = [0, 72, 144, 216, 288];
    var svg = svgEl("svg", {
      viewBox: "0 0 200 190",
      class: "pentagon-svg",
      role: "img",
      "aria-label": labels
        .map(function (l, i) { return l + " " + values[i] + " out of 10"; })
        .join(", "),
    });
    var uid = "pentagon-" + Math.random().toString(36).slice(2, 9);
    var defs = svgEl("defs", {});
    var grad = svgEl("radialGradient", { id: "fill-" + uid, cx: "50%", cy: "45%", r: "65%" });
    var stop1 = svgEl("stop", { offset: "0%", "stop-color": accent, "stop-opacity": "0.55" });
    var stop2 = svgEl("stop", { offset: "100%", "stop-color": accent, "stop-opacity": "0.18" });
    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);
    [0.33, 0.66, 1.0].forEach(function (frac, i) {
      var pts = angles.map(function (a) { return toPoint(cx, cy, a, rMax * frac); });
      svg.appendChild(
        svgEl("polygon", {
          points: pointsToAttr(pts),
          class: "pentagon-ring" + (i === 2 ? " pentagon-ring-outer" : ""),
        })
      );
    });
    angles.forEach(function (a) {
      var p = toPoint(cx, cy, a, rMax);
      svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: p[0].toFixed(1), y2: p[1].toFixed(1), class: "pentagon-spoke" }));
    });
    var dataPts = angles.map(function (a, i) {
      var v = Math.max(0, Math.min(10, values[i]));
      return toPoint(cx, cy, a, rMax * (v / 10));
    });
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
    var labelR = rMax + 15;
    angles.forEach(function (a, i) {
      var p = toPoint(cx, cy, a, labelR);
      var x = p[0], y = p[1];
      var anchor = "middle";
      if (Math.abs(x - cx) >= 3) anchor = x < cx ? "end" : "start";
      var dy = 0;
      if (a === 0) dy = -2;
      else if (a === 180 || (a >= 126 && a <= 234)) dy = 4;
      var text = svgEl("text", {
        x: x.toFixed(1),
        y: (y + dy).toFixed(1),
        "text-anchor": anchor,
        class: "pentagon-label",
      });
      text.textContent = labels[i];
      if (tooltipNote && i === 3) {
        var title = svgEl("title", {});
        title.textContent = labels[i] + ": " + fmt(values[i]) + "/10 \u2014 " + tooltipNote;
        text.appendChild(title);
      } else {
        var title2 = svgEl("title", {});
        title2.textContent = labels[i] + ": " + fmt(values[i]) + "/10";
        text.appendChild(title2);
      }
      svg.appendChild(text);
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
