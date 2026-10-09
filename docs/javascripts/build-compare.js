// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Build comparison card, sits under each family's "## Build Comparison"
// heading on essentials.md. One card: a row per build (the picker) and, under
// the rows, a radar overlay of the two picked builds with a "Key Differences"
// column for each.
//
// Picking: click (or Enter/Space on) a row to put it in a slot. Slots are A
// and B; a new pick replaces the older of the two and the other build keeps
// its letter, so its colour never swaps. Clicking a row that is already
// picked does nothing, because two builds are always compared.
//
// EASY EDIT GUIDE:
//   All build data lives in build-data.js (window.DB_BUILD_DATA), NOT in
//   this file - that's the single source of truth shared with
//   pentagon-badge.js, build-stats-badge.js and the home page rows. The
//   row's emoji, descriptor line, description and meters come from the same
//   fields the home page shows (build-stats-badge.js's window.BuildView), so
//   editing a build there updates both places. See build-data.js's own top
//   comment for the field-by-field writeup.
//
//   To add the widget to a page: <div class="build-compare"
//   data-family="re"></div> (or data-family="surge"). Nothing else
//   needed - the rows, defaults and radar are generated from whichever
//   family's build list is picked. data-build-a / data-build-b override the
//   default pair.
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

  // Links are built as absolute site URLs via SiteUtils.detectSiteRoot,
  // not markdown-relative paths like "333-ceiling.md" - a JS-inserted
  // <a href="333-ceiling.md"> resolves against the CURRENT page URL in
  // the browser, so from .../remaining-energy/essentials/ it lands on
  // .../remaining-energy/essentials/333-ceiling.md, which doesn't exist.
  // mkdocs rewrites markdown-native relative links at build time to
  // account for that extra directory segment; a raw href set at runtime
  // never goes through that rewrite, so it has to be built as an
  // absolute site URL instead.
  //
  // Captured once, synchronously, on first script execution - see
  // SiteUtils.detectSiteRoot's comment for why this can't be recomputed
  // lazily inside document$.subscribe (document.currentScript is only
  // valid during the initial synchronous run).
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("build-compare.js");

  function buildUrl(family, build) {
    return SITE_ROOT + FAMILY_FOLDER[family] + "/" + build.id + "/";
  }

  var pointsToAttr = window.SiteUtils.pentagonPointsToAttr;
  var svgEl = window.SiteUtils.svgEl;
  var fmt1 = window.SiteUtils.formatStat;
  var radar = window.SiteUtils.radar;
  var el = window.SiteUtils.el;
  var View = window.BuildView;

  // "#ec91b2" -> "236, 145, 178", for the rgba() tints a row builds from its accent.
  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return (n >> 16) + ", " + ((n >> 8) & 255) + ", " + (n & 255);
  }

  // Overlay pentagon: same grid/spoke/label shape as pentagon-badge.js,
  // but draws two translucent data polygons (one per selected build)
  // instead of one solid one, so their silhouettes can be compared at a
  // glance instead of read as two separate numbers.
  function buildOverlaySvg(axisLabels, buildA, buildB) {
    var angles = radar.angles(axisLabels.length);

    var svg = svgEl("svg", {
      viewBox: radar.VIEWBOX,
      class: "pentagon-svg build-compare-svg",
      role: "group",
      "aria-label":
        buildA.name +
        " vs " +
        buildB.name +
        ": " +
        axisLabels
          .map(function (l, i) { return l + " " + fmt1(buildA.pentagon[i]) + " vs " + fmt1(buildB.pentagon[i]); })
          .join(", "),
    });

    radar.drawGrid(svg, angles);

    [buildB, buildA].forEach(function (build) {
      // Draw B first, then A on top, so A reads as the "primary" shape
      // when the two overlap heavily.
      var dataPts = radar.dataPoints(angles, build.pentagon);
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
        svg.appendChild(svgEl("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: "2.4", fill: build.accent }));
      });
    });

    radar.drawLabels(svg, angles, axisLabels, function (text, i) {
      text.setAttribute(
        "data-radar-tip",
        axisLabels[i] + ": " + buildA.name + " " + fmt1(buildA.pentagon[i]) + " vs " + buildB.name + " " + fmt1(buildB.pentagon[i])
      );
    });

    return svg;
  }

  // "Key Differences" - for each axis where the two builds aren't
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
  function edgeLists(axisLabels, invert, buildA, buildB) {
    var listA = [];
    var listB = [];
    axisLabels.forEach(function (label, i) {
      var delta = buildA.pentagon[i] - buildB.pentagon[i];
      if (Math.abs(delta) < 0.05) return; // tied on this axis - no chip
      var favorsA = invert[i] ? delta < 0 : delta > 0;
      var sign = invert[i] ? "\u2212" : "+";
      (favorsA ? listA : listB).push(sign + fmt1(Math.abs(delta)) + " " + label);
    });
    return [listA, listB];
  }

  // One column of the Key Differences panel: the slot letter, the build's name
  // (a link to its page), and its chips.
  function buildEdgeColumn(family, slot, build, chips) {
    var col = el("div", "build-compare-edge-col");
    col.style.setProperty("--bc-rgb", hexToRgb(build.accent));

    var head = el("div", "build-compare-edge-head");
    head.appendChild(el("span", "build-compare-slot build-compare-slot--filled", slot));
    var link = el("a", "build-compare-edge-name", build.name);
    link.href = buildUrl(family, build);
    link.style.color = build.accent;
    head.appendChild(link);
    col.appendChild(head);

    col.appendChild(el("div", "build-compare-edge-label", "Edge"));

    var chipRow = el("div", "build-compare-diffcard-chips");
    if (chips.length === 0) {
      chipRow.appendChild(el("span", "build-compare-diffcard-none", "No clear edge"));
    } else {
      chips.forEach(function (text) {
        var chip = el("span", "build-compare-diffchip", text);
        chip.style.borderColor = build.accent + "4d"; // ~30% alpha hex suffix
        chip.style.color = build.accent;
        chipRow.appendChild(chip);
      });
    }
    col.appendChild(chipRow);
    return col;
  }

  function renderWidget(container, family) {
    var data = window.DB_BUILD_DATA && window.DB_BUILD_DATA[family];
    if (!data || !View) return;

    var builds = data.builds.filter(function (b) { return b.compareEnabled !== false; });
    function byId(id) { return builds.filter(function (b) { return b.id === id; })[0]; }

    var idA = container.getAttribute("data-build-a") || builds[data.defaultPair[0]].id;
    var idB = container.getAttribute("data-build-b") || builds[data.defaultPair[1]].id;
    if (!byId(idA) || !byId(idB) || idA === idB) {
      // Guard against an unknown id or both slots landing on the same build
      // (e.g. a manually-edited default) - fall back to the family default pair.
      idA = builds[data.defaultPair[0]].id;
      idB = builds[data.defaultPair[1]].id;
    }
    var picks = [idA, idB]; // slot A, slot B
    var nextSlot = 0; // the slot the next new pick replaces (the older pick)

    container.innerHTML = "";

    var rowsBox = el("div", "build-compare-rows");
    rowsBox.setAttribute("role", "group");
    rowsBox.setAttribute("aria-label", "Pick two builds to compare");
    container.appendChild(rowsBox);

    var panel = el("div", "build-compare-panel");
    container.appendChild(panel);

    var rowEls = {};
    builds.forEach(function (build) {
      var row = el("div", "build-compare-row");
      row.setAttribute("role", "button");
      row.tabIndex = 0;
      row.style.setProperty("--bc-rgb", hexToRgb(build.accent));
      if (build.viable === false) row.setAttribute("data-kind", "variant");

      row.appendChild(el("span", "build-compare-slot"));

      var main = el("div", "build-compare-name");
      var top = el("div", "build-compare-name-top");
      top.appendChild(el("span", "home-row-emoji", build.emoji));
      var parts = View.nameParts(build);
      var nm = el("span", "build-compare-nm", parts[0]);
      if (parts[1]) {
        nm.appendChild(document.createTextNode(" "));
        nm.appendChild(el("small", null, parts[1]));
      }
      top.appendChild(nm);
      main.appendChild(top);
      main.appendChild(View.wordsEl(build));
      row.appendChild(main);

      row.appendChild(el("div", "home-row-desc", build.desc));
      row.appendChild(View.fillMeters(el("div", "build-compare-meters"), build));

      function pick() {
        if (picks.indexOf(build.id) >= 0) return;
        picks[nextSlot] = build.id;
        nextSlot = 1 - nextSlot;
        draw();
      }
      row.addEventListener("click", pick);
      row.addEventListener("keydown", function (evt) {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          pick();
        }
      });

      rowEls[build.id] = row;
      rowsBox.appendChild(row);
    });

    function draw() {
      var buildA = byId(picks[0]);
      var buildB = byId(picks[1]);

      builds.forEach(function (build) {
        var row = rowEls[build.id];
        var slot = build.id === buildA.id ? "A" : build.id === buildB.id ? "B" : "";
        row.setAttribute("aria-pressed", slot ? "true" : "false");
        row.querySelector(".build-compare-slot").textContent = slot;
      });

      panel.innerHTML = "";
      var svgMount = el("div", "build-compare-svg-mount");
      var overlay = buildOverlaySvg(data.axisLabels, buildA, buildB);
      svgMount.appendChild(overlay);
      radar.wireLabelTips(overlay);
      panel.appendChild(svgMount);

      var lists = edgeLists(data.axisLabels, data.invert, buildA, buildB);
      var edgesBox = el("div", "build-compare-edges");
      edgesBox.appendChild(buildEdgeColumn(family, "A", buildA, lists[0]));
      edgesBox.appendChild(buildEdgeColumn(family, "B", buildB, lists[1]));
      panel.appendChild(edgesBox);
    }

    draw();
  }

  function renderContainer(container) {
    renderWidget(container, container.getAttribute("data-family"));
  }

  // renderWidget() is idempotent (container.innerHTML reset every call, fresh
  // rows each time so no listener ever double-attaches to a surviving node),
  // so the shared hard-load/instant-nav/mutation trigger set is safe. See
  // site-utils.js's registerRenderer doc comment.
  window.SiteUtils.registerRenderer(".build-compare[data-family]", renderContainer);
})();
