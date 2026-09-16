(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("dps-chart.js");
  var fmtPct = window.SiteUtils.formatPct;
  function iconSlug(label) {
    return label.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function buildChart(container, labels, values, ids, accent, showIcons) {
    var maxVal = Math.max.apply(null, values);
    var list = document.createElement("div");
    list.className = "dps-chart-list";
    list.setAttribute("role", "img");
    list.setAttribute(
      "aria-label",
      "Trixion DPS distribution: " +
        labels.map(function (l, i) { return l + " " + fmtPct(values[i]); }).join(", ")
    );
    labels.forEach(function (label, i) {
      var val = values[i];
      var lengthPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
      var row = document.createElement("div");
      row.className = "dps-chart-row" + (showIcons ? "" : " dps-chart-row-no-icon");
      row.style.setProperty("--dps-target", lengthPct.toFixed(1) + "%");
      row.style.setProperty("--dps-delay", (i * 55) + "ms");
      if (showIcons) {
        var icon = document.createElement("img");
        icon.className = "dps-chart-icon";
        var slug = (ids && ids[i]) ? ids[i] : iconSlug(label);
        icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "icon-" + slug + ".png");
        icon.alt = "";
        icon.loading = "lazy";
        window.SiteUtils.hideOnError(icon, "display");
        row.appendChild(icon);
      }
      var bar = document.createElement("div");
      bar.className = "dps-chart-bar";
      var fill = document.createElement("div");
      fill.className = "dps-chart-fill";
      if (accent) fill.style.setProperty("--dps-accent", accent);
      bar.appendChild(fill);
      var labelText = document.createElement("span");
      labelText.className = "dps-chart-label-text";
      labelText.textContent = label;
      bar.appendChild(labelText);
      var valueEl = document.createElement("span");
      valueEl.className = "dps-chart-value";
      valueEl.textContent = fmtPct(val);
      row.appendChild(bar);
      row.appendChild(valueEl);
      list.appendChild(row);
    });
    container.innerHTML = "";
    container.appendChild(list);
    return list;
  }
  var dpsObserver = null;
  function getObserver() {
    if (dpsObserver || !("IntersectionObserver" in window)) return dpsObserver;
    dpsObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("dps-chart-in-view");
            dpsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    return dpsObserver;
  }
  function renderChart(chart) {
    var values = (chart.getAttribute("data-values") || "")
      .split(",")
      .map(function (s) { return parseFloat(s.trim()); });
    var idsAttr = chart.getAttribute("data-ids");
    var ids = idsAttr
      ? idsAttr.split(",").map(function (s) { return s.trim(); })
      : null;
    var labels = window.SiteUtils.resolveChartLabels(chart, ids) || [];
    if (!values.length || values.length !== labels.length || values.some(isNaN)) {
      return;
    }
    if (ids && ids.length !== labels.length) ids = null;
    var accent = chart.getAttribute("data-accent") || null;
    var showIcons = chart.hasAttribute("data-show-icons");
    buildChart(chart, labels, values, ids, accent, showIcons);
    var observer = getObserver();
    if (observer) {
      observer.observe(chart);
    } else {
      chart.classList.add("dps-chart-in-view");
    }
  }
  window.SiteUtils.registerRenderer(".dps-chart[data-values]", renderChart);
})();
