// Renders the "## Ark Setup" section's 3 Order Cores (Sun/Moon/Star) as a
// small native widget instead of a static ordercores-*.png screenshot.
// Deliberately only covers the 3 ORDER cores (the red/orange-trimmed ones
// in-game), not the 3 Chaos cores - the screenshots showed all 6, but
// every build on this site only ever invests in the Order side, so the
// Chaos half was dead weight. Also intentionally does NOT try to
// reproduce the full Ark Grid evolution tree (that's argrid-tree.png,
// staying a screenshot) - just this one compact "which points are lit"
// readout.
//
// Each core shows its 3 point breakpoints (10P/14P/17P) as a dot with
// its point value underneath, always visible (not hover-only) - so a
// core that genuinely needs 0 points (some builds run a core at 0/3 on
// purpose) reads as "0 needed", not as missing/broken data.
//
// EASY EDIT GUIDE:
//   <div class="ark-cores" data-family="re" markdown>
//   <script type="application/json">
//   [
//     { "core": "sun", "label": "Levin Slash", "points": 3 },
//     { "core": "moon", "label": "Deathblade Wave", "points": 3 },
//     { "core": "star", "label": "Death Sword Energy", "points": 3 }
//   ]
//   </script>
//   </div>
//
//   data-family - "re" or "surge". Cosmetic only right now (no per-family
//                 icon set to pick between), kept for consistency with
//                 skill-setup.js/essentials-table.js and in case that
//                 changes later.
//
//   Per entry:
//     core   - REQUIRED. "sun" | "moon" | "star" - picks the icon from
//              assets/shared/<core>.png.
//     label  - REQUIRED. The core's in-game name shown under the icon
//              (e.g. "Levin Slash" for Order Sun Core on a 333 build).
//     points - REQUIRED. 0-3, how many of the core's 3 point breakpoints
//              (10P/14P/17P) are invested. 0 = core is unlocked but
//              nothing extra spent on it (valid and common - shows as
//              "10 14 17" all muted, not an error), 3 = fully invested.
(function () {
  function detectSiteRoot() {
    var scriptEl = document.currentScript || document.querySelector('script[src*="javascripts/ark-core-badge.js"]');
    if (scriptEl && scriptEl.src) {
      return scriptEl.src.replace(/javascripts\/ark-core-badge\.js(\?.*)?(#.*)?$/, "");
    }
    var linkEl = document.querySelector('link[href*="stylesheets/extra.css"]');
    if (linkEl && linkEl.href) {
      return linkEl.href.replace(/stylesheets\/extra\.css(\?.*)?(#.*)?$/, "");
    }
    return "";
  }
  var SITE_ROOT = detectSiteRoot();

  var BREAKPOINTS = ["10P", "14P", "17P"];
  var CORE_ART = { sun: "sun.png", moon: "moon.png", star: "star.png" };

  var el = window.SiteUtils.el;

  function buildItem(entry) {
    var item = el("div", "ark-core-item");

    var icon = document.createElement("img");
    icon.className = "ark-core-icon";
    icon.src = SITE_ROOT + "assets/shared/" + (CORE_ART[entry.core] || "sun.png");
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon);
    item.appendChild(icon);

    // Name + points live together in one column to the right of the icon
    // (matches the in-game core tooltip layout - icon left, name/points
    // stacked right of it) instead of each being centered independently
    // under the icon - that's what lets the name and the points row line
    // up under each other on a shared left edge.
    var info = el("div", "ark-core-info");

    info.appendChild(el("span", "ark-core-name")).textContent = entry.label || entry.core;

    var dots = el("div", "ark-core-dots");
    var points = Math.max(0, Math.min(3, entry.points || 0));
    BREAKPOINTS.forEach(function (bp, i) {
      var active = i < points;
      var point = el("span", "ark-core-point" + (active ? " ark-core-point-on" : ""));
      var dot = el("span", "ark-core-dot" + (active ? " ark-core-dot-on" : ""));
      point.appendChild(dot);
      var num = el("span", "ark-core-point-label");
      num.textContent = bp.replace("P", "");
      point.appendChild(num);
      dots.appendChild(point);
    });
    info.appendChild(dots);

    item.appendChild(info);

    return item;
  }

  function renderContainer(container) {
    var script = container.querySelector("script");
    if (!script) return;

    var entries;
    try {
      entries = JSON.parse(script.textContent);
    } catch (e) {
      console.error("ark-core-badge.js: invalid JSON in .ark-cores block", e);
      return;
    }

    var old = container.querySelector(".ark-core-row");
    if (old) old.remove();

    var row = el("div", "ark-core-row");
    entries.forEach(function (entry) {
      row.appendChild(buildItem(entry));
    });
    container.appendChild(row);
  }

  function scanAndRender(root) {
    if (!root) return;
    if (root.matches && root.matches(".ark-cores")) {
      renderContainer(root);
    }
    if (root.querySelectorAll) {
      root.querySelectorAll(".ark-cores").forEach(renderContainer);
    }
  }

  function renderAll() {
    scanAndRender(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAll);
  } else {
    renderAll();
  }

  if (window.document$) {
    document$.subscribe(renderAll);
  }

  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) scanAndRender(node);
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
