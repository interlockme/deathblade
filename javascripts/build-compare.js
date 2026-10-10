(function () {
  var FAMILY_FOLDER = { re: "remaining-energy", surge: "surge" };
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
  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return (n >> 16) + ", " + ((n >> 8) & 255) + ", " + (n & 255);
  }
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
  function edgeLists(axisLabels, invert, buildA, buildB) {
    var listA = [];
    var listB = [];
    axisLabels.forEach(function (label, i) {
      var delta = buildA.pentagon[i] - buildB.pentagon[i];
      if (Math.abs(delta) < 0.05) return;
      var favorsA = invert[i] ? delta < 0 : delta > 0;
      var sign = invert[i] ? "\u2212" : "+";
      (favorsA ? listA : listB).push(sign + fmt1(Math.abs(delta)) + " " + label);
    });
    return [listA, listB];
  }
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
        chip.style.borderColor = build.accent + "4d";
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
      idA = builds[data.defaultPair[0]].id;
      idB = builds[data.defaultPair[1]].id;
    }
    var picks = [idA, idB];
    var nextSlot = 0;
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
  window.SiteUtils.registerRenderer(".build-compare[data-family]", renderContainer);
})();
