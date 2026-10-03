(function () {
  var el = window.SiteUtils.el;
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("ark-passive-tooltip.js");
  function buildHeader(name, iconRelPath) {
    var header = el("div", "skill-tip-header");
    if (iconRelPath) {
      var icon = document.createElement("img");
      icon.className = "skill-tip-icon";
      icon.src = window.SiteUtils.iconSrc(SITE_ROOT, iconRelPath);
      icon.alt = "";
      icon.loading = "lazy";
      window.SiteUtils.hideOnError(icon, "display");
      header.appendChild(icon);
    }
    header.appendChild(el("div", "skill-tip-title", name));
    return header;
  }
  function currentLevelText(levels, currentLevel) {
    var exact = levels.filter(function (lvl) {
      return String(lvl.level) === String(currentLevel);
    })[0];
    if (exact) return exact.text;
    var numLevel = parseInt(currentLevel, 10);
    if (!isNaN(numLevel)) {
      var atOrBelow = levels
        .filter(function (lvl) {
          return lvl.level <= numLevel;
        })
        .sort(function (a, b) {
          return b.level - a.level;
        })[0];
      if (atOrBelow) return atOrBelow.text;
    }
    return levels[levels.length - 1].text;
  }
  function buildTip(id, entry, currentLevel) {
    var tip = el("div", "skill-tip md-typeset ap-node-tip");
    tip.setAttribute("role", "tooltip");
    var known = window.DB_AP_NODE_NAMES && window.DB_AP_NODE_NAMES[id];
    tip.appendChild(buildHeader((known && known.name) || id, known && known.icon));
    if (currentLevel != null) {
      tip.appendChild(el("div", "ap-node-tip-level", "Ark Passive Lv. " + currentLevel));
    }
    var text = entry.text;
    if (!text && entry.perPoint != null && currentLevel != null) {
      var numLevel = parseInt(currentLevel, 10);
      if (!isNaN(numLevel)) {
        var value = entry.perPoint * numLevel;
        text = entry.template ? entry.template.replace("{value}", value) : ((known && known.name) || id) + " +" + value + ".";
      }
    }
    if (!text && entry.levels && entry.levels.length) {
      text = currentLevelText(entry.levels, currentLevel);
    }
    if (text) tip.appendChild(el("p", "skill-tip-note ap-node-tip-text", text));
    if (entry.note) {
      tip.appendChild(el("p", "skill-tip-note ap-node-tip-caveat", entry.note));
    }
    return tip;
  }
  function buildAllLevelsTip(id, entry) {
    var tip = el("div", "skill-tip md-typeset ap-node-tip");
    tip.setAttribute("role", "tooltip");
    var known = window.DB_AP_NODE_NAMES && window.DB_AP_NODE_NAMES[id];
    tip.appendChild(buildHeader((known && known.name) || id, known && known.icon));
    entry.levels.forEach(function (lvl) {
      var row = el("div", "skill-tip-all-row");
      row.appendChild(el("div", "ap-node-tip-level", "Ark Passive Lv. " + lvl.level));
      row.appendChild(el("p", "skill-tip-note ap-node-tip-text", lvl.text));
      tip.appendChild(row);
    });
    if (entry.note) {
      tip.appendChild(el("p", "skill-tip-note ap-node-tip-caveat", entry.note));
    }
    return tip;
  }
  function attachNode(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    var id = trigger.getAttribute("data-ap-id");
    if (!id) return;
    var entry = window.DB_AP_NODE_EFFECTS && window.DB_AP_NODE_EFFECTS[id];
    if (!entry) return;
    var currentLevel = trigger.getAttribute("data-level");
    if (currentLevel == null && entry.levels && entry.levels.length) {
      window.SkillTooltip.wireCustom(trigger, buildAllLevelsTip(id, entry));
      return;
    }
    window.SkillTooltip.wireCustom(trigger, buildTip(id, entry, currentLevel));
  }
  window.SiteUtils.registerRenderer(".ark-passive-node[data-ap-id], .skill-mention[data-ap-id]", attachNode);
})();
