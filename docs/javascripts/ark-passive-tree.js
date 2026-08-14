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
//   [
//     {
//       "id": "evolution",
//       "label": "Evolution",
//       "points": 140,
//       "tiers": [
//         {
//           "label": "Tier 1",
//           "nodes": [
//             { "id": "keensense", "level": 2, "max": 2 }
//           ]
//         }
//       ]
//     },
//     { "id": "enlightenment", "label": "Enlightenment", "points": 100, "tiers": [...] },
//     { "id": "leap", "label": "Leap", "points": 70, "tiers": [...] }
//   ]
//   </script>
//   </div>
//
//   NOTE: the root is a bare array of columns (not {"columns": [...]}).
//   A top-level JSON object breaks after an in-app nav - see
//   rotation-line.js's EASY EDIT GUIDE comment for why (mkdocs-material's
//   instant-nav script re-execution drops the script's type attribute, so
//   a bare { at the start of the payload gets parsed as a JS block
//   statement instead of JSON). Keeping the root an array sidesteps it.
//
//   NOTE: columns[].id ("evolution"/"enlightenment"/"leap") and
//   nodes[].id (e.g. "keensense") are two different id namespaces - the
//   first picks a column's accent color, the second looks up a node's
//   name/icon in ap-node-names.js. Don't confuse them.
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
//   nodes[].id       - REQUIRED (unless name+icon given, see below). Key
//                       into DB_AP_NODE_NAMES (ap-node-names.js), which
//                       supplies the node's display name and icon. Both
//                       "Limit Break" nodes need the column-specific id
//                       ("limitbreakevo" in Evolution, "limitbreakenl" in
//                       Enlightenment) - see that file's header comment.
//   nodes[].level    - REQUIRED. Current invested level.
//   nodes[].max      - REQUIRED. That node's max level (30 for a 1P
//                       Evolution keystone, 1-5 for most others) - used
//                       to render "level/max" and to decide the maxed
//                       (filled pill) treatment when level === max.
//   nodes[].name     - Optional override/fallback. Only needed for a
//                       one-off node not worth adding to
//                       ap-node-names.js, or to force different display
//                       text than the table. Ignored when nodes[].id
//                       resolves.
//   nodes[].icon     - Optional override/fallback, paired with name
//                       above. Path relative to this page's assets/
//                       folder (same convention as skill-setup.js).
(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("ark-passive-tree.js");

  var el = window.SiteUtils.el;

  function buildNode(entry) {
    var row = el("div", "ark-passive-node");

    // Prefer the shared id -> {name, icon} lookup (ap-node-names.js) so
    // authored JSON only carries level/max, which is genuinely
    // build-specific. entry.name/entry.icon still win when present, as
    // an escape hatch for a one-off node not worth adding to the table.
    var known = entry.id ? window.DB_AP_NODE_NAMES[entry.id] : null;
    var name = entry.name || (known && known.name) || "";
    var iconPath = entry.icon || (known && known.icon);

    var icon = document.createElement("img");
    icon.className = "ark-passive-node-icon";
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, iconPath);
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon);
    row.appendChild(icon);

    row.appendChild(el("span", "ark-passive-node-name")).textContent = name;

    var level = el("span", "ark-passive-node-level");
    var maxed = entry.max != null && entry.level === entry.max;
    level.setAttribute("data-maxed", maxed ? "true" : "false");
    level.textContent = entry.max != null ? entry.level + "/" + entry.max : String(entry.level);
    row.appendChild(level);

    return row;
  }

  function buildTier(tier) {
    var wrap = el("div", "ark-passive-tier");
    wrap.appendChild(el("div", "ark-passive-tier-label")).textContent = tier.label || "";
    (tier.nodes || []).forEach(function (n) {
      wrap.appendChild(buildNode(n));
    });
    return wrap;
  }

  function buildColumn(col) {
    var wrap = el("div", "ark-passive-col");
    wrap.setAttribute("data-column", col.id || "");

    var header = el("div", "ark-passive-col-header");
    header.appendChild(el("span", "ark-passive-col-title")).textContent = col.label || col.id;
    if (col.points != null) {
      header.appendChild(el("span", "ark-passive-col-points")).textContent = "(" + col.points + ")";
    }
    wrap.appendChild(header);

    var row = el("div", "ark-passive-tier-row");
    (col.tiers || []).forEach(function (t) {
      if (t.nodes && t.nodes.length) {
        row.appendChild(buildTier(t));
      }
    });
    wrap.appendChild(row);
    watchRowWraps(row);

    return wrap;
  }

  // ---- Wrap-aware tier dividers ---------------------------------------
  // .ark-passive-tier-row lays its tiers out with flex-wrap: wrap (see
  // extra.css) - once the row runs out of width, a tier drops to its own
  // new line. Each tier's divider/left-indent in the CSS is keyed off
  // :first-child / :not(:first-child), which only tracks DOM order, not
  // which line a tier actually rendered on: a tier that wraps to a new
  // row is still not the DOM's first child, so it keeps the divider AND
  // the left padding meant to separate it from a PREVIOUS tier that's no
  // longer next to it - visually, that tier sits indented relative to
  // the tier above it that legitimately IS first in its own row. CSS has
  // no selector for "first in a wrapped flex line", so this measures it
  // directly: any tier whose offsetTop differs from the previous tier's
  // is starting a new visual row, and gets a class that zeroes its
  // padding-left and hides its divider - same treatment the true
  // DOM-first tier already gets from the plain CSS rule.
  function markRowStarts(row) {
    var tiers = Array.prototype.filter.call(row.children, function (c) {
      return c.classList && c.classList.contains("ark-passive-tier");
    });
    var prevTop = null;
    tiers.forEach(function (tier) {
      var top = tier.offsetTop;
      var isRowStart = prevTop === null || top !== prevTop;
      tier.classList.toggle("ark-passive-tier-row-start", isRowStart);
      prevTop = top;
    });
  }

  function watchRowWraps(row) {
    var schedule = window.SiteUtils.rafSchedule(function () {
      markRowStarts(row);
    });

    schedule();

    // Re-measure whenever the row's own width changes (viewport resize,
    // sidebar toggle, etc) - the same condition that changes how many
    // tiers fit on one line.
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(schedule);
      ro.observe(row);
      // Stashed on the row so renderContainer can disconnect it before
      // this row is torn down on the next instant-navigation re-render -
      // otherwise every revisit to the page leaves another ResizeObserver
      // behind, still watching a now-detached row forever.
      row.__wrapObserver = ro;
    } else {
      window.addEventListener("resize", schedule);
    }
  }

  function renderContainer(container) {
    var result = window.SiteUtils.readInlineJSON(container, "ark-passive-tree.js");
    if (!result) return;

    container.querySelectorAll(".ark-passive-col").forEach(function (n) {
      var row = n.querySelector(".ark-passive-tier-row");
      if (row && row.__wrapObserver) row.__wrapObserver.disconnect();
      n.remove();
    });

    result.data.forEach(function (col) {
      container.appendChild(buildColumn(col));
    });
  }

  window.SiteUtils.registerRenderer(".ark-passives", renderContainer);
})();
