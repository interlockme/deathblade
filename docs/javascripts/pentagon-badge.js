// Build-profile pentagon badge, drawn next to .build-card on build pages.
//
// EASY EDIT GUIDE (read this before touching a build's numbers):
//   Each badge is just a <div class="pentagon-badge" data-values="...">
//   in the build's markdown page - see stylesheets/extra.css's comment
//   above ".build-card-row" for the exact markup shape. To change a
//   build's stats, edit the data-values list there; nothing here needs
//   to change. This file only turns those 5 numbers into the SVG shape.
//
//   Axis order is always: Difficulty, DPS, Mobility, Recovery/Exposure,
//   Speed - all on a 0-10 scale, matched 1:1 with data-labels.
//
//   DPS is NOT the raw Trixion multiplier from the stat-bar above the
//   badge. Trixion multipliers are comparable across every class in the
//   game, so they cluster tightly (1.17-1.23) and look nearly flat on a
//   0-10 axis. Instead, DPS here is ranked WITHIN each build family
//   (Remaining Energy vs Surge) on its own 0-10 scale, roughly:
//     highest DPS build in the family = 9
//     next highest = 8.5
//     next = 8
//   ...as a relative "how does this build's DPS compare to this class's
//   other builds" read, not an absolute/cross-class number. RE and
//   Surge are scaled independently since raid-practical DPS between the
//   two playstyles isn't directly comparable even though both report a
//   Trixion multiplier.
//
//   Recovery vs Exposure: Remaining Energy builds use "Recovery" (higher
//   is better - more self-sustain). Surge builds don't really have a
//   Recovery stat, so that axis is repurposed as "Exposure" (back-attack
//   / positional risk) where HIGHER IS WORSE. If you add a data-caption
//   on a Surge badge, make sure it still says lower-is-safer so the
//   inverted axis doesn't read as "bigger = stronger" like the other
//   four do.
//
//   To add a badge to a new build page: copy an existing page's
//   .pentagon-badge block, swap the data-values/data-labels, and (for a
//   Surge build) keep the data-caption attribute; drop it for RE builds.

(function () {
  var TAU = Math.PI * 2;

  function toPoint(cx, cy, angleDeg, r) {
    var a = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  }

  function fmt(n) {
    return Math.round(n * 10) / 10;
  }

  function pointsToAttr(pts) {
    return pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        el.setAttribute(key, attrs[key]);
      }
    }
    return el;
  }

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

    // Grid rings (33%, 66%, 100%) + spokes
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

    // Data shape
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

    // Labels
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

  function renderPentagonBadges() {
    document.querySelectorAll(".pentagon-badge[data-values]").forEach(function (badge) {
      var mount = badge.querySelector(".pentagon-svg-mount");
      if (!mount) return;

      var rawValues = (badge.getAttribute("data-values") || "").split(",").map(function (s) {
        return parseFloat(s.trim());
      });
      var rawLabels = (badge.getAttribute("data-labels") || "Difficulty,DPS,Mobility,Recovery,Speed")
        .split(",")
        .map(function (s) { return s.trim(); });
      if (rawValues.length !== 5 || rawLabels.length !== 5 || rawValues.some(isNaN)) {
        return; // malformed data - fail quietly rather than draw a broken shape
      }

      var accent = badge.getAttribute("data-accent") || "#ee83ab";
      var tooltipNote = badge.getAttribute("data-caption") || null;

      mount.innerHTML = "";
      mount.appendChild(buildPentagonSvg(rawValues, rawLabels, accent, tooltipNote));

      var caption = badge.getAttribute("data-caption");
      if (caption && !badge.querySelector(".pentagon-badge-caption")) {
        var captionEl = document.createElement("div");
        captionEl.className = "pentagon-badge-caption";
        captionEl.textContent = caption;
        badge.appendChild(captionEl);
      }
    });
  }

  if (window.document$) {
    document$.subscribe(function () {
      renderPentagonBadges();
    });
  }
})();
