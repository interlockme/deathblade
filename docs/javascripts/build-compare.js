// Unified build comparison card, sits under each family's "## Build
// Comparison" heading on essentials.md. Replaces what used to be a static
// markdown table PLUS a separate pick-two-and-overlay widget below it with
// one card: a real <table> up top (the table content, unchanged) and the
// two-build picker underneath (pentagon overlay + a "Key Differences"
// panel), so there's one visual unit instead of two that repeat the same
// numbers and duplicate the same links.
//
// EASY EDIT GUIDE:
//   All build data lives in BUILD_FAMILIES below, one entry per build:
//   the same 5 pentagon values/labels used on that build's own page (see
//   pentagon-badge.js's top comment for the axis scale writeup), plus the
//   difficulty/trixion/playstyle/bestFor fields the old markdown table
//   used to carry. Keep this in sync by hand when a build page's own
//   pentagon-badge or build-card stats change - there's no single source
//   of truth shared between the two.
//
//   - recommended: true adds the small star next to the name (matches the
//     old table's "star" suffix).
//   - trixion: null (not a number) renders as "-" with no bar, for builds
//     that don't have a Trixion parse yet (e.g. Standard).
//   - trixionConfirmed: false switches the Trixion bar to the same
//     diagonal-stripe "unconfirmed" fill used on 333 (Blitz)'s own page.
//   - compareEnabled: false keeps a build in the table (it still gets a
//     row + a link out) but out of the two-build picker below, for
//     builds without full pentagon data (Standard has no pentagon).
//
//   To add the widget to a page: <div class="build-compare"
//   data-family="re"></div> (or data-family="surge"). Nothing else
//   needed - the table rows, dropdowns, and defaults are all generated
//   from whichever family's build list is picked.
//
//   RE and Surge builds are never compared against each other here, same
//   reasoning as pentagon-badge.js: RE's fifth axis is Recovery (higher
//   is better) and Surge's is Exposure (lower is better), and DPS is
//   ranked within each family on its own 0-10 scale - overlaying the two
//   would silently mix incompatible axes.

(function () {
  // Maps a data-family value to its actual docs/ subfolder, so links can
  // be built as real site URLs instead of markdown-relative paths - see
  // detectSiteRoot()'s comment below for why that distinction matters.
  var FAMILY_FOLDER = { re: "remaining-energy", surge: "surge" };

  var BUILD_FAMILIES = {
    re: {
      axisLabels: ["Difficulty", "DPS", "Mobility", "Recovery", "Speed"],
      // true = lower is better on this axis. All RE axes are higher-is-better.
      invert: [false, false, false, false, false],
      defaultPair: [0, 1], // 333 (Ceiling) vs 313 (High Floor)
      builds: [
        {
          id: "333-ceiling",
          name: "333 (Ceiling)",
          accent: "#ee83ab",
          pentagon: [8.5, 9, 5, 8.5, 8.5],
          difficulty: 8.5,
          trixion: 1.2,
          trixionConfirmed: true,
          playstyle: "Skill Reset",
          bestFor: "\u2728 Well-rounded damage ceiling",
          recommended: true,
          compareEnabled: true,
        },
        {
          id: "313-high-floor",
          name: "313 (High Floor)",
          accent: "#b39ddb",
          pentagon: [8, 8, 5, 9, 10],
          difficulty: 8,
          trixion: 1.17,
          trixionConfirmed: true,
          playstyle: "Fast & Comfy",
          bestFor: "\uD83D\uDC9C Comfort and recovery",
          recommended: false,
          compareEnabled: true,
        },
        {
          id: "111-head-hunt",
          name: "111 (Head Hunt)",
          accent: "#4db6ac",
          pentagon: [9, 8.5, 5, 6, 10],
          difficulty: 9,
          trixion: 1.18,
          trixionConfirmed: true,
          playstyle: "Fast & Punishing",
          bestFor: "\uD83D\uDD2A Skill expression and stagger",
          recommended: false,
          compareEnabled: true,
        },
        {
          id: "standard",
          name: "Standard",
          accent: "#8d8b93",
          pentagon: null,
          difficulty: 7,
          trixion: null,
          trixionConfirmed: true,
          playstyle: "AFK Simulator",
          bestFor: "\uD83C\uDF31 Pre-Ark Grid beginner build",
          recommended: false,
          compareEnabled: false,
        },
      ],
    },
    surge: {
      axisLabels: ["Difficulty", "DPS", "Mobility", "Exposure", "Speed"],
      // Exposure is back-attack/positional risk - lower is better, unlike
      // every other axis (matches the data-caption on each build's own
      // pentagon-badge).
      invert: [false, false, false, true, false],
      defaultPair: [0, 1], // 111 (Classic) vs 222 (Speedy)
      builds: [
        {
          id: "111-classic",
          name: "111 (Classic)",
          accent: "#ee83ab",
          pentagon: [7.5, 9, 8, 6.5, 7],
          difficulty: 7.5,
          trixion: 1.23,
          trixionConfirmed: true,
          playstyle: "Burst Combo",
          bestFor: "\uD83E\uDD81 Classic Surge gameplay",
          recommended: true,
          compareEnabled: true,
        },
        {
          id: "222-speedy",
          name: "222 (Speedy)",
          accent: "#4db6ac",
          pentagon: [7, 8.5, 10, 7.5, 8],
          difficulty: 7,
          trixion: 1.22,
          trixionConfirmed: true,
          playstyle: "Max Mobility",
          bestFor: "\uD83D\uDC06 Simple uptime focus",
          recommended: false,
          compareEnabled: true,
        },
        {
          id: "333-blitz",
          name: "333 (Blitz)",
          accent: "#b39ddb",
          pentagon: [8, 8, 8.5, 9, 6],
          difficulty: 8,
          trixion: 1.2,
          trixionConfirmed: false,
          playstyle: "Skill Reset",
          bestFor: "\uD83D\uDC2F Waiting for buffs",
          recommended: false,
          compareEnabled: true,
        },
      ],
    },
  };

  function detectSiteRoot() {
    // Same trick dps-chart.js uses: read this script's own fully-resolved
    // <script src>, which the browser always reports as an absolute URL
    // regardless of how deep the current page's own directory-style URL
    // is (e.g. /remaining-energy/essentials/). Building links this way -
    // instead of a markdown-relative "333-ceiling.md" - is what actually
    // fixes the 404: a JS-inserted <a href="333-ceiling.md"> resolves
    // against the CURRENT page URL in the browser, so from
    // .../remaining-energy/essentials/ it lands on
    // .../remaining-energy/essentials/333-ceiling.md, which doesn't
    // exist. mkdocs rewrites markdown-native relative links at build
    // time to account for that extra directory segment; a raw href set
    // at runtime never goes through that rewrite, so it has to be built
    // as an absolute site URL instead.
    var scriptEl = document.currentScript || document.querySelector('script[src*="javascripts/build-compare.js"]');
    if (scriptEl && scriptEl.src) {
      return scriptEl.src.replace(/javascripts\/build-compare\.js(\?.*)?(#.*)?$/, "");
    }
    var linkEl = document.querySelector('link[href*="stylesheets/extra.css"]');
    if (linkEl && linkEl.href) {
      return linkEl.href.replace(/stylesheets\/extra\.css(\?.*)?(#.*)?$/, "");
    }
    return "";
  }

  // Captured once, synchronously, on first script execution - see
  // dps-chart.js's identical comment for why this can't be recomputed
  // lazily inside document$.subscribe (document.currentScript is only
  // valid during the initial synchronous run).
  var SITE_ROOT = detectSiteRoot();

  function buildUrl(family, build) {
    return SITE_ROOT + FAMILY_FOLDER[family] + "/" + build.id + "/";
  }

  function toPoint(cx, cy, angleDeg, r) {
    var a = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  }
  function pointsToAttr(pts) {
    return pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
  }
  function svgEl(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) el.setAttribute(key, attrs[key]);
    }
    return el;
  }
  function fmt1(n) {
    var r = Math.round(n * 10) / 10;
    return r % 1 === 0 ? r.toFixed(0) : r.toFixed(1);
  }

  // ---------- Overview table (this IS the old markdown table, just
  // generated from the same data array the picker below reads instead
  // of being hand-typed a second time). Deliberately a real <table>
  // with NO class attribute so it inherits the sitewide
  // `table:not([class])` styling every other table on the site gets -
  // see the CSS comment above .build-compare table for why. ----------
  function buildOverviewTable(family, data) {
    var table = document.createElement("table");

    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    ["Build", "Difficulty", "Trixion DPS", "Playstyle", "Best For"].forEach(function (label) {
      var th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    data.builds.forEach(function (build) {
      var row = document.createElement("tr");

      var nameCell = document.createElement("td");
      var nameLink = document.createElement("a");
      nameLink.href = buildUrl(family, build);
      nameLink.className = "build-compare-name";
      var dot = document.createElement("span");
      dot.className = "build-compare-dot";
      dot.style.backgroundColor = build.accent;
      nameLink.appendChild(dot);
      nameLink.appendChild(document.createTextNode(build.name));
      nameCell.appendChild(nameLink);
      if (build.recommended) {
        // Plain unicode star, matching how "★" appears elsewhere on the
        // site (e.g. the tab labels on each build's own page) - not part
        // of the link, and no color/size override, so it's just the
        // default white text character rather than a styled badge.
        nameCell.appendChild(document.createTextNode(" \u2605"));
      }
      row.appendChild(nameCell);

      var diffCell = document.createElement("td");
      diffCell.innerHTML =
        '<div class="table-bar-cell">' + fmt1(build.difficulty) + " / 10" +
        '<div class="stat-bar-track"><div class="stat-bar-fill" style="width:' + (build.difficulty / 10) * 100 + '%"></div></div></div>';
      row.appendChild(diffCell);

      var trixCell = document.createElement("td");
      if (build.trixion == null) {
        trixCell.textContent = "\u2014";
      } else {
        // Same fixed 1.0-1.3 scale as the per-build stat card - see
        // extra.css's comment on .stat-bar-track-teal for why this isn't
        // scaled to the data's own min/max.
        var trixPct = Math.max(0, Math.min(1, (build.trixion - 1.0) / 0.3)) * 100;
        var fillClass = "stat-bar-fill stat-bar-fill-teal" + (build.trixionConfirmed === false ? " stat-bar-fill-unconfirmed" : "");
        trixCell.innerHTML =
          '<div class="table-bar-cell">' + build.trixion.toFixed(2) + "x" +
          '<div class="stat-bar-track stat-bar-track-teal"><div class="' + fillClass + '" style="width:' + trixPct + '%"></div></div></div>';
      }
      row.appendChild(trixCell);

      var styleCell = document.createElement("td");
      styleCell.textContent = build.playstyle;
      row.appendChild(styleCell);

      var bestForCell = document.createElement("td");
      bestForCell.textContent = build.bestFor;
      row.appendChild(bestForCell);

      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    return table;
  }

  // Overlay pentagon: same grid/spoke/label shape as pentagon-badge.js,
  // but draws two translucent data polygons (one per selected build)
  // instead of one solid one, so their silhouettes can be compared at a
  // glance instead of read as two separate numbers.
  function buildOverlaySvg(axisLabels, buildA, buildB) {
    var cx = 100, cy = 98, rMax = 60;
    var angles = axisLabels.map(function (_, i) { return (360 / axisLabels.length) * i; });

    var svg = svgEl("svg", {
      viewBox: "0 0 200 190",
      class: "pentagon-svg build-compare-svg",
      role: "img",
      "aria-label":
        buildA.name +
        " vs " +
        buildB.name +
        ": " +
        axisLabels
          .map(function (l, i) { return l + " " + fmt1(buildA.pentagon[i]) + " vs " + fmt1(buildB.pentagon[i]); })
          .join(", "),
    });

    [0.33, 0.66, 1.0].forEach(function (frac, i) {
      var pts = angles.map(function (a) { return toPoint(cx, cy, a, rMax * frac); });
      svg.appendChild(
        svgEl("polygon", { points: pointsToAttr(pts), class: "pentagon-ring" + (i === 2 ? " pentagon-ring-outer" : "") })
      );
    });
    angles.forEach(function (a) {
      var p = toPoint(cx, cy, a, rMax);
      svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: p[0].toFixed(1), y2: p[1].toFixed(1), class: "pentagon-spoke" }));
    });

    [buildB, buildA].forEach(function (build) {
      // Draw B first, then A on top, so A (the left/first dropdown) reads
      // as the "primary" shape when the two overlap heavily.
      var dataPts = angles.map(function (a, i) {
        var v = Math.max(0, Math.min(10, build.pentagon[i]));
        return toPoint(cx, cy, a, rMax * (v / 10));
      });
      svg.appendChild(
        svgEl("polygon", {
          points: pointsToAttr(dataPts),
          fill: build.accent,
          "fill-opacity": "0.16",
          stroke: build.accent,
          "stroke-width": "1.75",
          "stroke-linejoin": "round",
          class: "build-compare-poly",
        })
      );
      dataPts.forEach(function (p) {
        svg.appendChild(svgEl("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: "2.4", fill: build.accent, class: "build-compare-dot" }));
      });
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

      var text = svgEl("text", { x: x.toFixed(1), y: (y + dy).toFixed(1), "text-anchor": anchor, class: "pentagon-label" });
      text.textContent = axisLabels[i];
      svg.appendChild(text);
    });

    return svg;
  }

  function buildSelect(builds, selectedId) {
    var select = document.createElement("select");
    select.className = "build-compare-select";
    builds.forEach(function (b) {
      var opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.name;
      if (b.id === selectedId) opt.selected = true;
      select.appendChild(opt);
    });
    return select;
  }

  // "Key Differences" panel - for each axis where the two builds aren't
  // essentially tied, a small pill goes under whichever build comes out
  // ahead on it, labeled with the axis and the size of the gap. Chosen
  // over any kind of bar: bars scaled to a 0-10 (or even a per-pair
  // delta-scaled) range still ask the reader to compare two lengths by
  // eye, and Difficulty/DPS/Recovery all sitting in an 8-10 range meant
  // the bars barely moved. A short list of "+1 DPS" / "-0.5 Exposure"
  // pills says the same thing as plainly as it can be said, with nothing
  // left to eyeball. Exposure (Surge's 5th axis) is a risk stat, not a
  // power stat, so a build reduces it rather than gains it - it gets a
  // "-" prefix instead of "+" so it doesn't read as "more" of something
  // bad being an advantage.
  function buildKeyDifferences(axisLabels, invert, buildA, buildB) {
    var card = document.createElement("div");
    card.className = "build-compare-diffcard";

    var title = document.createElement("div");
    title.className = "build-compare-diffcard-title";
    title.textContent = "Key Differences";
    card.appendChild(title);

    var chipsA = [];
    var chipsB = [];
    axisLabels.forEach(function (label, i) {
      var delta = buildA.pentagon[i] - buildB.pentagon[i];
      if (Math.abs(delta) < 0.05) return; // tied on this axis - no chip
      var favorsA = invert[i] ? delta < 0 : delta > 0;
      var sign = invert[i] ? "\u2212" : "+";
      var text = sign + fmt1(Math.abs(delta)) + " " + label;
      (favorsA ? chipsA : chipsB).push(text);
    });

    var body = document.createElement("div");
    body.className = "build-compare-diffcard-body";

    if (chipsA.length === 0 && chipsB.length === 0) {
      var same = document.createElement("div");
      same.className = "build-compare-diffcard-empty";
      same.textContent = "These builds are nearly identical across every axis.";
      body.appendChild(same);
    } else {
      [
        [buildA, chipsA],
        [buildB, chipsB],
      ].forEach(function (pair) {
        var build = pair[0];
        var chips = pair[1];
        var col = document.createElement("div");
        col.className = "build-compare-diffcard-col";

        var name = document.createElement("div");
        name.className = "build-compare-diffcard-name";
        name.style.color = build.accent;
        name.textContent = build.name;
        col.appendChild(name);

        var chipRow = document.createElement("div");
        chipRow.className = "build-compare-diffcard-chips";
        if (chips.length === 0) {
          var none = document.createElement("span");
          none.className = "build-compare-diffcard-none";
          none.textContent = "No clear edge";
          chipRow.appendChild(none);
        } else {
          chips.forEach(function (text) {
            var chip = document.createElement("span");
            chip.className = "build-compare-diffchip";
            chip.style.borderColor = build.accent + "4d"; // ~30% alpha hex suffix - softer than the old 50%
            chip.style.color = build.accent;
            chip.textContent = text;
            chipRow.appendChild(chip);
          });
        }
        col.appendChild(chipRow);
        body.appendChild(col);
      });
    }

    card.appendChild(body);
    return card;
  }

  function renderWidget(container, family) {
    var data = BUILD_FAMILIES[family];
    if (!data) return;

    var compareBuilds = data.builds.filter(function (b) { return b.compareEnabled !== false; });

    var idA = container.getAttribute("data-build-a") || compareBuilds[data.defaultPair[0]].id;
    var idB = container.getAttribute("data-build-b") || compareBuilds[data.defaultPair[1]].id;
    if (idA === idB) {
      // Guard against both dropdowns landing on the same build (e.g. via
      // a manually-edited default) - fall back to the family default pair.
      idA = compareBuilds[data.defaultPair[0]].id;
      idB = compareBuilds[data.defaultPair[1]].id;
    }
    var buildA = compareBuilds.filter(function (b) { return b.id === idA; })[0] || compareBuilds[0];
    var buildB = compareBuilds.filter(function (b) { return b.id === idB; })[0] || compareBuilds[1];

    container.innerHTML = "";
    container.appendChild(buildOverviewTable(family, data));

    var sectionLabel = document.createElement("div");
    sectionLabel.className = "build-compare-section-label";
    sectionLabel.textContent = "Compare Builds";
    container.appendChild(sectionLabel);

    // Each select gets its own small color dot (kept in sync on change)
    // instead of a separate link-legend row - the table above already
    // links out to every build, repeating that here was redundant.
    var controls = document.createElement("div");
    controls.className = "build-compare-controls";

    var wrapA = document.createElement("span");
    wrapA.className = "build-compare-select-wrap";
    var dotA = document.createElement("span");
    dotA.className = "build-compare-select-dot";
    var selectA = buildSelect(compareBuilds, buildA.id);
    wrapA.appendChild(dotA);
    wrapA.appendChild(selectA);

    var vs = document.createElement("span");
    vs.className = "build-compare-vs";
    vs.textContent = "vs";

    var wrapB = document.createElement("span");
    wrapB.className = "build-compare-select-wrap";
    var dotB = document.createElement("span");
    dotB.className = "build-compare-select-dot";
    var selectB = buildSelect(compareBuilds, buildB.id);
    wrapB.appendChild(dotB);
    wrapB.appendChild(selectB);

    controls.appendChild(wrapA);
    controls.appendChild(vs);
    controls.appendChild(wrapB);
    container.appendChild(controls);

    var body = document.createElement("div");
    body.className = "build-compare-body";
    container.appendChild(body);

    function renderBody() {
      body.innerHTML = "";
      dotA.style.backgroundColor = buildA.accent;
      dotB.style.backgroundColor = buildB.accent;

      var svgMount = document.createElement("div");
      svgMount.className = "build-compare-svg-mount";
      svgMount.appendChild(buildOverlaySvg(data.axisLabels, buildA, buildB));
      body.appendChild(svgMount);

      body.appendChild(buildKeyDifferences(data.axisLabels, data.invert, buildA, buildB));
    }

    renderBody();

    selectA.addEventListener("change", function () {
      if (selectA.value === selectB.value) {
        // Keep the two picks distinct - snap B to whatever A just gave up.
        selectB.value = buildA.id;
      }
      buildA = compareBuilds.filter(function (b) { return b.id === selectA.value; })[0];
      buildB = compareBuilds.filter(function (b) { return b.id === selectB.value; })[0];
      renderBody();
    });
    selectB.addEventListener("change", function () {
      if (selectB.value === selectA.value) {
        selectA.value = buildB.id;
      }
      buildA = compareBuilds.filter(function (b) { return b.id === selectA.value; })[0];
      buildB = compareBuilds.filter(function (b) { return b.id === selectB.value; })[0];
      renderBody();
    });
  }

  function renderAll() {
    document.querySelectorAll(".build-compare[data-family]").forEach(function (container) {
      renderWidget(container, container.getAttribute("data-family"));
    });
  }

  if (window.document$) {
    document$.subscribe(function () {
      renderAll();
    });
  }
})();
