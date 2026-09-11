// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
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
//     { "id": "evolution", "nodes": [
//       { "id": "keensense", "level": 2 }
//     ] },
//     { "id": "enlightenment", "nodes": [...] },
//     { "id": "leap", "nodes": [...] }
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
//   first picks a column's accent color AND looks up that column's
//   label/point budget in DB_AP_COLUMNS, the second looks up a node's
//   name/icon/tier/max in DB_AP_NODE_NAMES (both in ap-node-names.js).
//   Don't confuse them.
//
//   columns[].id     - REQUIRED. "evolution" | "enlightenment" | "leap" -
//                       picks the column's accent color (see the
//                       [data-column] CSS rules), its icon glow, and its
//                       header label + point budget from DB_AP_COLUMNS.
//   columns[].label  - Optional override of DB_AP_COLUMNS[id].label. Only
//                       needed for a genuine one-off; every column on
//                       this site uses the table value as-is.
//   columns[].points - Optional override of DB_AP_COLUMNS[id].points
//                       (the "(140)" etc. next to the label). Same
//                       override-only rule as label above.
//   columns[].nodes  - REQUIRED. Flat list of this build's invested
//                       nodes in this column, ANY order - grouped into
//                       "Tier N" tiers automatically (see nodes[] below),
//                       sorted by tier number, and only tiers that
//                       actually have a node in them render (there's
//                       nothing to omit by hand, an untouched tier just
//                       never gets a node listed here).
//   nodes[].id       - REQUIRED (unless name+icon+tier+max all given, see
//                       below). Key into DB_AP_NODE_NAMES
//                       (ap-node-names.js), which supplies the node's
//                       display name, icon, tier number, and max level -
//                       all fixed per node, never build-specific, so
//                       there's nothing to author beyond level. Both
//                       "Limit Break" nodes need the column-specific id
//                       ("limitbreakevo" in Evolution, "limitbreakenl" in
//                       Enlightenment) - see that file's header comment.
//   nodes[].level    - REQUIRED. Current invested level.
//   nodes[].max      - Optional override of DB_AP_NODE_NAMES[id].max.
//                       Only needed for a one-off node not in the table
//                       (paired with name/icon/tier below) or a genuine
//                       override; every node id currently on this site
//                       uses the table value as-is.
//   nodes[].tier     - Optional override of DB_AP_NODE_NAMES[id].tier
//                       (the tier NUMBER within this column, e.g. 1 for
//                       "Tier 1" - not split by column in the table since
//                       a node id only ever lives in one column already).
//                       Same one-off/override-only rule as max above.
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

  // Merges an authored node entry with its DB_AP_NODE_NAMES lookup (when
  // entry.id resolves) into the flat set of fields buildNode/tiersFor
  // actually need to render - entry.* always wins when present, so any
  // field can be overridden per-node for a genuine one-off without
  // touching the shared table.
  function resolveNode(entry) {
    var known = entry.id ? window.DB_AP_NODE_NAMES[entry.id] : null;
    return {
      id: entry.id,
      level: entry.level,
      max: entry.max != null ? entry.max : known && known.max,
      tier: entry.tier != null ? entry.tier : known && known.tier,
      name: entry.name || (known && known.name) || "",
      icon: entry.icon || (known && known.icon),
    };
  }

  function buildNode(node) {
    var row = el("div", "ark-passive-node");

    // Stamped only when node.id is present - ark-passive-tooltip.js looks
    // nodes up in DB_AP_NODE_EFFECTS by this same id, and a node authored
    // via the name/icon escape hatch (no id) has no effect-text entry to
    // find anyway, so it's left without either attribute and just renders
    // with no tooltip (same fail-quietly rule as everywhere else here).
    // data-level is separate from the visible "n/max" badge text below -
    // it's what lets the tooltip highlight this build's own current pick.
    if (node.id) {
      row.setAttribute("data-ap-id", node.id);
      if (node.level != null) row.setAttribute("data-level", node.level);
    }

    var icon = document.createElement("img");
    icon.className = "ark-passive-node-icon";
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, node.icon);
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon);
    row.appendChild(icon);

    row.appendChild(el("span", "ark-passive-node-name")).textContent = node.name;

    var level = el("span", "ark-passive-node-level");
    var maxed = node.max != null && node.level === node.max;
    level.setAttribute("data-maxed", maxed ? "true" : "false");
    level.textContent = node.max != null ? node.level + "/" + node.max : String(node.level);
    row.appendChild(level);

    return row;
  }

  function buildTier(tier) {
    var wrap = el("div", "ark-passive-tier");
    wrap.appendChild(el("div", "ark-passive-tier-label")).textContent = tier.label || "";
    tier.nodes.forEach(function (n) {
      wrap.appendChild(buildNode(n));
    });
    return wrap;
  }

  // Groups a column's flat, any-order nodes[] into "Tier N" buckets by
  // each node's own (resolved) tier number, then sorts the buckets
  // ascending - this is what lets the authored JSON skip tier structure
  // entirely and still render tiers in the right order, with only the
  // tiers that actually have an invested node in them. A node whose tier
  // can't be resolved (no id match and no explicit tier override) is a
  // one-off authoring mistake - it's bucketed under "Tier ?" rather than
  // dropped, so it's still visible (if oddly labeled) instead of quietly
  // disappearing.
  function tiersFor(col) {
    var byTier = {};
    (col.nodes || []).forEach(function (entry) {
      var node = resolveNode(entry);
      var key = node.tier != null ? node.tier : "unknown";
      (byTier[key] || (byTier[key] = [])).push(node);
    });
    return Object.keys(byTier)
      .sort(function (a, b) {
        if (a === "unknown") return 1;
        if (b === "unknown") return -1;
        return Number(a) - Number(b);
      })
      .map(function (key) {
        return { label: key === "unknown" ? "Tier ?" : "Tier " + key, nodes: byTier[key] };
      });
  }

  function buildColumn(col) {
    var wrap = el("div", "ark-passive-col");
    wrap.setAttribute("data-column", col.id || "");

    var known = col.id ? window.DB_AP_COLUMNS[col.id] : null;
    var header = el("div", "ark-passive-col-header");
    header.appendChild(el("span", "ark-passive-col-title")).textContent =
      col.label || (known && known.label) || col.id;
    var points = col.points != null ? col.points : known && known.points;
    if (points != null) {
      header.appendChild(el("span", "ark-passive-col-points")).textContent = "(" + points + ")";
    }
    wrap.appendChild(header);

    // Tiers stack vertically, one per line, in reading order - no
    // width-dependent wrapping, so no JS is needed to track which tier
    // starts a visual row (see extra.css for the plain :first-child /
    // :not(:first-child) divider rules this simplicity enables).
    var row = el("div", "ark-passive-tier-row");
    tiersFor(col).forEach(function (t) {
      row.appendChild(buildTier(t));
    });
    wrap.appendChild(row);

    return wrap;
  }

  function renderContainer(container) {
    var result = window.SiteUtils.readInlineJSON(container, "ark-passive-tree.js");
    if (!result) return;

    container.querySelectorAll(".ark-passive-col").forEach(function (n) {
      n.remove();
    });

    result.data.forEach(function (col) {
      container.appendChild(buildColumn(col));
    });
  }

  window.SiteUtils.registerRenderer(".ark-passives", renderContainer);
})();
