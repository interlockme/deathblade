(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("gem-priority.js");
  var DEFAULT_COL_LABELS = { dmg: "Damage", cd: "Cooldown" };
  var el = window.SiteUtils.el;
  var iconSrc = window.SiteUtils.iconSrc;
  var hideOnError = window.SiteUtils.hideOnError;
  var appendInlineBold = window.SiteUtils.appendInlineBold;
  function normalize(item) {
    return typeof item === "string" ? { id: item } : item;
  }
  function displayName(entry) {
    return entry.name || window.DB_SKILL_NAMES[entry.id] || entry.id;
  }
  function buildIcon(id, className) {
    var img = document.createElement("img");
    img.className = className;
    img.src = iconSrc(SITE_ROOT, "icon-" + id + ".png");
    img.alt = "";
    img.loading = "lazy";
    hideOnError(img);
    return img;
  }
  function appendRowContent(parent, rank, entry) {
    parent.setAttribute("data-id", entry.id);
    if (entry.tip) parent.setAttribute("data-gem-tip", entry.tip);
    parent.appendChild(el("span", "gem-item-rank", String(rank)));
    parent.appendChild(buildIcon(entry.id, "gem-item-icon"));
    parent.appendChild(el("span", "gem-item-name", displayName(entry)));
  }
  function buildAlt(alt) {
    var row = el("div", "gem-alt");
    row.appendChild(buildIcon(alt.id, "gem-alt-icon"));
    row.appendChild(el("strong", null, displayName(alt)));
    if (alt.note) {
      row.appendChild(document.createTextNode(" \u2014 "));
      appendInlineBold(row, alt.note);
    }
    return row;
  }
  function buildRow(item, rank) {
    var entry = normalize(item);
    if (entry.alts && entry.alts.length) {
      var details = document.createElement("details");
      details.className = "gem-item gem-item-expandable";
      details.setAttribute("data-rank", String(rank));
      var summary = document.createElement("summary");
      appendRowContent(summary, rank, entry);
      summary.appendChild(el("span", "gem-item-arrow"));
      details.appendChild(summary);
      var alts = el("div", "gem-item-alts");
      entry.alts.forEach(function (alt) {
        alts.appendChild(buildAlt(alt));
      });
      details.appendChild(alts);
      return details;
    }
    var row = el("div", "gem-item");
    row.setAttribute("data-rank", String(rank));
    appendRowContent(row, rank, entry);
    return row;
  }
  function buildColumn(col) {
    var wrap = el("div", "gem-col gem-col-" + (col.col || "dmg"));
    var header = el("div", "gem-col-header");
    header.appendChild(el("span", "gem-col-title", col.label || DEFAULT_COL_LABELS[col.col] || col.col));
    wrap.appendChild(header);
    var list = el("div", "gem-list");
    (col.items || []).forEach(function (item, i) {
      list.appendChild(buildRow(item, i + 1));
    });
    wrap.appendChild(list);
    return wrap;
  }
  function renderContainer(container) {
    var result = window.SiteUtils.readInlineJSON(container, "gem-priority.js");
    if (!result) return;
    container.querySelectorAll(".gem-col").forEach(function (n) {
      n.remove();
    });
    result.data.forEach(function (col) {
      container.appendChild(buildColumn(col));
    });
  }
  window.SiteUtils.registerRenderer(".gem-priority", renderContainer);
})();
