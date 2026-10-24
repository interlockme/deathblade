(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("ark-passive-tree.js");
  var el = window.SiteUtils.el;
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
