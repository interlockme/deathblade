// Renders the "## Ark Setup" section's Ark Passive tree (Evolution /
// Enlightenment / Leap) as a native widget instead of a static
// argrid-tree*.png screenshot of the full in-game grid.
//
// The screenshot shows every node in all three trees, including the
// dozens sitting at 0/x that a build never touches - this only renders
// nodes with points actually invested, grouped by column and tier, so a
// ~40-node screenshot becomes the ~15 real decisions.
//
// EASY EDIT GUIDE:
//   <div class="ark-passives" markdown>
//   <script type="application/json">
//   {
//     "columns": [
//       {
//         "id": "evolution",
//         "label": "Evolution",
//         "points": 140,
//         "tiers": [
//           {
//             "label": "Tier 1",
//             "nodes": [
//               { "name": "Node Name", "level": 30, "max": 30, "icon": "ap-icons/x.png" }
//             ]
//           }
//         ]
//       },
//       { "id": "enlightenment", "label": "Enlightenment", "points": 100, "tiers": [...] },
//       { "id": "leap", "label": "Leap", "points": 70, "tiers": [...] }
//     ]
//   }
//   </script>
//   </div>
//
//   columns[].id     - REQUIRED. "evolution" | "enlightenment" | "leap" -
//                       picks the column's accent color (see the
//                       [data-column] CSS rules) and its icon glow.
//   columns[].label  - REQUIRED. Header text shown above the tier list.
//   columns[].points - Optional. Total point budget shown next to the
//                       label (e.g. 140), matching the in-game screenshot's
//                       "Evolution (140)" header. Omit to hide.
//   tiers[].label    - REQUIRED. e.g. "Tier 1". Only rendered when the
//                       tier has at least one node (omit empty tiers from
//                       the JSON entirely rather than sending an empty
//                       nodes array).
//   nodes[].name     - REQUIRED. Node's in-game name.
//   nodes[].level    - REQUIRED. Current invested level.
//   nodes[].max      - REQUIRED. That node's max level (30 for a 1P
//                       Evolution keystone, 1-5 for most others) - used
//                       to render "level/max" and to decide the maxed
//                       (filled pill) treatment when level === max.
//   nodes[].icon     - REQUIRED. Path relative to this page's assets/
//                       folder (same convention as skill-setup.js).
(function () {
  function detectSiteRoot() {
    var scriptEl = document.currentScript || document.querySelector('script[src*="javascripts/ark-passive-tree.js"]');
    if (scriptEl && scriptEl.src) {
      return scriptEl.src.replace(/javascripts\/ark-passive-tree\.js(\?.*)?(#.*)?$/, "");
    }
    var linkEl = document.querySelector('link[href*="stylesheets/extra.css"]');
    if (linkEl && linkEl.href) {
      return linkEl.href.replace(/stylesheets\/extra\.css(\?.*)?(#.*)?$/, "");
    }
    return "";
  }
  var SITE_ROOT = detectSiteRoot();

  function el(tag, className) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  function buildNode(entry, family) {
    var row = el("div", "ark-passive-node");

    var icon = document.createElement("img");
    icon.className = "ark-passive-node-icon";
    icon.src = SITE_ROOT + "assets/" + family + "/" + entry.icon;
    icon.alt = "";
    icon.loading = "lazy";
    icon.addEventListener("error", function () {
      icon.style.visibility = "hidden";
    });
    row.appendChild(icon);

    row.appendChild(el("span", "ark-passive-node-name")).textContent = entry.name || "";

    var level = el("span", "ark-passive-node-level");
    var maxed = entry.max != null && entry.level === entry.max;
    level.setAttribute("data-maxed", maxed ? "true" : "false");
    level.textContent = entry.max != null ? entry.level + "/" + entry.max : String(entry.level);
    row.appendChild(level);

    return row;
  }

  function buildTier(tier, family) {
    var wrap = el("div", "ark-passive-tier");
    wrap.appendChild(el("div", "ark-passive-tier-label")).textContent = tier.label || "";
    (tier.nodes || []).forEach(function (n) {
      wrap.appendChild(buildNode(n, family));
    });
    return wrap;
  }

  function buildColumn(col, family) {
    var wrap = el("div", "ark-passive-col");
    wrap.setAttribute("data-column", col.id || "");

    var header = el("div", "ark-passive-col-header");
    header.appendChild(el("span", "ark-passive-col-title")).textContent = col.label || col.id;
    if (col.points != null) {
      header.appendChild(el("span", "ark-passive-col-points")).textContent = "(" + col.points + ")";
    }
    wrap.appendChild(header);

    (col.tiers || []).forEach(function (t) {
      if (t.nodes && t.nodes.length) {
        wrap.appendChild(buildTier(t, family));
      }
    });

    return wrap;
  }

  function renderContainer(container) {
    var script = container.querySelector("script");
    if (!script) return;

    var data;
    try {
      data = JSON.parse(script.textContent);
    } catch (e) {
      console.error("ark-passive-tree.js: invalid JSON in .ark-passives block", e);
      return;
    }

    container.querySelectorAll(".ark-passive-col").forEach(function (n) {
      n.remove();
    });

    var family = container.getAttribute("data-family") || "surge";
    (data.columns || []).forEach(function (col) {
      container.appendChild(buildColumn(col, family));
    });
  }

  function scanAndRender(root) {
    if (!root) return;
    if (root.matches && root.matches(".ark-passives")) {
      renderContainer(root);
    }
    if (root.querySelectorAll) {
      root.querySelectorAll(".ark-passives").forEach(renderContainer);
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
