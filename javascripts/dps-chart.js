// Live Trixion DPS distribution chart, replaces the old dpsdist-*.png
// screenshots inside .dps-showcase-frame.
//
// EASY EDIT GUIDE (read this before touching a build's numbers):
//   Each chart is just a <div class="dps-chart" data-labels="..."
//   data-values="..." data-icon-base="re"></div> - see a build page's
//   "## Trixion DPS" section for the exact markup shape. To update a
//   build's split after a balance pass, edit the two data- attributes;
//   nothing here needs to change, and there's no screenshot to retake.
//
//   data-labels / data-values are parallel comma-separated lists, same
//   convention as pentagon-badge.js's data-values/data-labels. Order
//   them highest % first - that's how every Trixion recording naturally
//   sorts them, and the chart draws top-to-bottom in list order rather
//   than re-sorting.
//
//   data-icon-base is just the asset subfolder name - "re" or "surge" -
//   not a relative path. Icon URLs are resolved against the site's own
//   root (detected from this script's own <script src> tag, which the
//   browser always reports as a fully-resolved absolute URL) rather than
//   a hardcoded "../assets/..." - a hardcoded relative path breaks as
//   soon as it's read from a data attribute at runtime instead of being
//   a real markdown image, since mkdocs's directory-style URLs
//   (/surge/111-classic/) add a path segment normal markdown images get
//   auto-corrected for at build time, but a JS-inserted <img> does not.
//
//   Each row's icon is derived from its label - "Twin Shadows" ->
//   icon-twinshadows.png - same lowercase-and-strip-spaces convention
//   every existing icon-*.png in this repo already follows. If a skill's
//   label doesn't have a matching icon-*.png in that folder yet, add one
//   (or copy it over from the sibling re/surge folder if the skill is
//   shared, like Death Trance) rather than special-casing the filename
//   here - a row with no matching file just quietly shows no icon.
//
//   data-accent is optional (defaults to the site's teal, matching the
//   Trixion DPS stat-bar-fill-teal color used elsewhere).

(function () {
  function detectSiteRoot() {
    var scriptEl = document.currentScript || document.querySelector('script[src*="javascripts/dps-chart.js"]');
    if (scriptEl && scriptEl.src) {
      return scriptEl.src.replace(/javascripts\/dps-chart\.js(\?.*)?(#.*)?$/, "");
    }
    // Fallback: derive from the site stylesheet link, in case this script
    // ever gets loaded in a way that clears document.currentScript.
    var linkEl = document.querySelector('link[href*="stylesheets/extra.css"]');
    if (linkEl && linkEl.href) {
      return linkEl.href.replace(/stylesheets\/extra\.css(\?.*)?(#.*)?$/, "");
    }
    return "";
  }

  // Captured once, synchronously, while this script first loads -
  // document.currentScript is only valid during that initial execution,
  // not later inside document$.subscribe (mkdocs-material's instant
  // navigation reuses this same script tag across page swaps, so one
  // capture up front covers every subsequent render).
  var SITE_ROOT = detectSiteRoot();

  function fmtPct(n) {
    // Trim to at most 1 decimal, but drop a trailing ".0" so whole
    // numbers read as "34%" instead of "34.0%".
    var r = Math.round(n * 10) / 10;
    return (r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)) + "%";
  }

  function iconSlug(label) {
    return label.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function buildChart(container, labels, values, accent, iconBase) {
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
      // Bar length is relative to this build's own top contributor, not a
      // fixed 0-100 scale - the top skill would otherwise always cap out
      // near the same length and the visual spread between builds (some
      // are far more top-heavy than others) would be lost.
      var lengthPct = maxVal > 0 ? (val / maxVal) * 100 : 0;

      var row = document.createElement("div");
      row.className = "dps-chart-row";
      row.style.setProperty("--dps-target", lengthPct.toFixed(1) + "%");
      row.style.setProperty("--dps-delay", (i * 55) + "ms");
      row.title = label + ": " + fmtPct(val) + " of total damage";

      var labelWrap = document.createElement("span");
      labelWrap.className = "dps-chart-label";
      if (iconBase) {
        var icon = document.createElement("img");
        icon.className = "dps-chart-icon";
        icon.src = SITE_ROOT + "assets/" + iconBase + "/icon-" + iconSlug(label) + ".png";
        icon.alt = "";
        icon.loading = "lazy";
        // A missing icon file (skill without an icon-*.png yet) just
        // collapses away instead of showing a broken-image glyph.
        icon.addEventListener("error", function () {
          icon.style.display = "none";
        });
        labelWrap.appendChild(icon);
      }
      var labelText = document.createElement("span");
      labelText.className = "dps-chart-label-text";
      labelText.textContent = label;
      labelWrap.appendChild(labelText);

      var track = document.createElement("div");
      track.className = "dps-chart-track";
      var fill = document.createElement("div");
      fill.className = "dps-chart-fill";
      if (accent) fill.style.setProperty("--dps-accent", accent);
      track.appendChild(fill);

      var valueEl = document.createElement("span");
      valueEl.className = "dps-chart-value";
      valueEl.textContent = fmtPct(val);

      row.appendChild(labelWrap);
      row.appendChild(track);
      row.appendChild(valueEl);
      list.appendChild(row);
    });

    container.innerHTML = "";
    container.appendChild(list);
    return list;
  }

  function renderDpsCharts() {
    var charts = document.querySelectorAll(".dps-chart[data-values]");
    if (!charts.length) return;

    var observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            function (entries) {
              entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                  entry.target.classList.add("dps-chart-in-view");
                  observer.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.35 }
          )
        : null;

    charts.forEach(function (chart) {
      var values = (chart.getAttribute("data-values") || "")
        .split(",")
        .map(function (s) { return parseFloat(s.trim()); });
      var labels = (chart.getAttribute("data-labels") || "")
        .split(",")
        .map(function (s) { return s.trim(); });
      if (!values.length || values.length !== labels.length || values.some(isNaN)) {
        return; // malformed data - fail quietly rather than draw a broken chart
      }

      var accent = chart.getAttribute("data-accent") || null;
      var iconBase = chart.getAttribute("data-icon-base") || null;
      buildChart(chart, labels, values, accent, iconBase);

      if (observer) {
        observer.observe(chart);
      } else {
        // No IntersectionObserver support - just show the bars filled in
        // rather than leaving them permanently collapsed at 0 width.
        chart.classList.add("dps-chart-in-view");
      }
    });
  }

  if (window.document$) {
    document$.subscribe(function () {
      renderDpsCharts();
    });
  }
})();

