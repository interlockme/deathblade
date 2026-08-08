// Unified build comparison card, sits under each family's "## Build
// Comparison" heading on essentials.md. Replaces what used to be a static
// markdown table PLUS a separate pick-two-and-overlay widget below it with
// one card: a real <table> up top (the table content, unchanged) and the
// two-build picker underneath (pentagon overlay + a "Key Differences"
// panel), so there's one visual unit instead of two that repeat the same
// numbers and duplicate the same links.
//
// EASY EDIT GUIDE:
//   All build data lives in build-data.js (window.DB_BUILD_DATA), NOT in
//   this file - that's the single source of truth shared with
//   pentagon-badge.js, so editing a build's numbers there updates both
//   the build's own pentagon badge and this comparison card. See
//   build-data.js's own top comment for the field-by-field writeup
//   (recommended/trixion/trixionConfirmed/compareEnabled, etc).
//
//   To add the widget to a page: <div class="build-compare"
//   data-family="re"></div> (or data-family="surge"). Nothing else
//   needed - the table rows, dropdowns, and defaults are all generated
//   from whichever family's build list is picked.
//
//   Shareable links: once a reader picks a pair, the URL updates to
//   ?a=<build-id>&b=<build-id> (no address-bar change on a plain page
//   load, only after an actual selection) and a "Copy link" button sits
//   under the dropdowns for grabbing it without touching the address
//   bar. Opening a link with those params pre-selects that exact pair on
//   load, overriding data-build-a/data-build-b if both are present.
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

  // ----- Shareable compare links -----
  // Reads/writes ?a=<build-id>&b=<build-id> so a specific matchup (e.g.
  // essentials.md?a=333-ceiling&b=313-high-floor) can be linked directly
  // instead of "go to essentials, then pick these two from the
  // dropdowns." Scoped to exactly one compare widget per page (true for
  // every essentials.md today), so plain "a"/"b" params are unambiguous
  // and stay short/shareable rather than namespaced per-family.
  function getUrlPair(compareBuilds) {
    var params = new URLSearchParams(window.location.search);
    var a = params.get("a");
    var b = params.get("b");
    if (!a || !b || a === b) return null;
    var buildA = compareBuilds.filter(function (build) { return build.id === a; })[0];
    var buildB = compareBuilds.filter(function (build) { return build.id === b; })[0];
    if (!buildA || !buildB) return null; // unknown/stale id - ignore, fall through to normal default
    return [buildA.id, buildB.id];
  }

  function shareUrlFor(idA, idB) {
    var params = new URLSearchParams(window.location.search);
    params.set("a", idA);
    params.set("b", idB);
    return window.location.pathname + "?" + params.toString() + window.location.hash;
  }

  // Only touches the address bar once the reader actually picks a pair -
  // an untouched page load stays on its plain URL rather than getting
  // ?a=...&b=... appended for every visitor by default.
  function updateUrl(idA, idB) {
    if (!window.history || !window.history.replaceState) return;
    window.history.replaceState(null, "", shareUrlFor(idA, idB));
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for browsers/contexts without the async Clipboard API.
    var temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      // Nothing more we can do - the button's own catch handles user feedback.
    }
    document.body.removeChild(temp);
    return Promise.resolve();
  }

  function renderWidget(container, family) {
    var data = window.DB_BUILD_DATA && window.DB_BUILD_DATA[family];
    if (!data) return;

    var compareBuilds = data.builds.filter(function (b) { return b.compareEnabled !== false; });

    var urlPair = getUrlPair(compareBuilds);
    var idA = (urlPair && urlPair[0]) || container.getAttribute("data-build-a") || compareBuilds[data.defaultPair[0]].id;
    var idB = (urlPair && urlPair[1]) || container.getAttribute("data-build-b") || compareBuilds[data.defaultPair[1]].id;
    if (idA === idB) {
      // Guard against both dropdowns landing on the same build (e.g. via
      // a manually-edited default) - fall back to the family default pair.
      idA = compareBuilds[data.defaultPair[0]].id;
      idB = compareBuilds[data.defaultPair[1]].id;
    }
    var buildA = compareBuilds.filter(function (b) { return b.id === idA; })[0] || compareBuilds[0];
    var buildB = compareBuilds.filter(function (b) { return b.id === idB; })[0] || compareBuilds[1];

    container.innerHTML = "";
    // Wrapper exists purely so mobile can get horizontal scroll on just
    // this table without touching its own layout - see the CSS comment
    // on .build-compare-table-scroll for why the table itself couldn't
    // just handle this alone. No-op on desktop (plain block wrapper).
    var tableScroll = document.createElement("div");
    tableScroll.className = "build-compare-table-scroll";
    tableScroll.appendChild(buildOverviewTable(family, data));
    container.appendChild(tableScroll);

    // Dropdowns and the share action share one row - no text label above
    // them anymore, the picker + "vs" already reads as compare controls
    // on its own. Just the divider/spacing that used to sit on the label.
    var headerRow = document.createElement("div");
    headerRow.className = "build-compare-header-row";

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
    headerRow.appendChild(controls);

    // Icon-only copy button - shares the row with the picker instead of
    // getting its own line, since sharing a comparison is a nice-to-have,
    // not an action that needs a spelled-out label.
    var COPY_ICON =
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    var CHECK_ICON =
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    var shareBtn = document.createElement("button");
    shareBtn.type = "button";
    shareBtn.className = "build-compare-share-btn";
    shareBtn.innerHTML = COPY_ICON;
    shareBtn.setAttribute("aria-label", "Copy link to this comparison");
    shareBtn.setAttribute("data-tooltip", "Copy link to this comparison");
    headerRow.appendChild(shareBtn);

    container.appendChild(headerRow);

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

    var shareResetTimer = null;
    function resetShareBtn() {
      shareBtn.innerHTML = COPY_ICON;
      shareBtn.setAttribute("data-tooltip", "Copy link to this comparison");
      shareBtn.setAttribute("aria-label", "Copy link to this comparison");
    }
    shareBtn.addEventListener("click", function () {
      copyToClipboard(window.location.origin + shareUrlFor(buildA.id, buildB.id))
        .then(function () {
          clearTimeout(shareResetTimer);
          shareBtn.innerHTML = CHECK_ICON;
          shareBtn.setAttribute("data-tooltip", "Link copied");
          shareBtn.setAttribute("aria-label", "Link copied");
          shareResetTimer = setTimeout(resetShareBtn, 1800);
        })
        .catch(function () {
          clearTimeout(shareResetTimer);
          shareBtn.setAttribute("data-tooltip", "Couldn't copy - copy from address bar");
          shareBtn.setAttribute("aria-label", "Couldn't copy - copy from address bar");
          shareResetTimer = setTimeout(resetShareBtn, 2400);
        });
    });

    selectA.addEventListener("change", function () {
      if (selectA.value === selectB.value) {
        // Keep the two picks distinct - snap B to whatever A just gave up.
        selectB.value = buildA.id;
      }
      buildA = compareBuilds.filter(function (b) { return b.id === selectA.value; })[0];
      buildB = compareBuilds.filter(function (b) { return b.id === selectB.value; })[0];
      updateUrl(buildA.id, buildB.id);
      renderBody();
    });
    selectB.addEventListener("change", function () {
      if (selectB.value === selectA.value) {
        selectA.value = buildB.id;
      }
      buildA = compareBuilds.filter(function (b) { return b.id === selectA.value; })[0];
      buildB = compareBuilds.filter(function (b) { return b.id === selectB.value; })[0];
      updateUrl(buildA.id, buildB.id);
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
