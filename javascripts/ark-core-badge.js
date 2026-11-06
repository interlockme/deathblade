(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("ark-core-badge.js");
  var BREAKPOINTS = ["10P", "14P", "17P"];
  var CORE_ART = { sun: "sun.png", moon: "moon.png", star: "star.png" };
  var el = window.SiteUtils.el;
  var TOKEN_RE = /\b(Destiny(?:: [A-Z][a-z]+(?: [A-Z][a-z]+)*)?)|([+-])(\d+(?:\.\d+)?[%s]?)|(\d+(?:\.\d+)?s)\b|(\d+)(?= times\b| time\(s\))/g;
  var LOWER_IS_BETTER_RE = /(?:cooldown|MP Cost)\s*$/i;
  function appendHighlighted(parent, text) {
    var lastIndex = 0;
    var match;
    TOKEN_RE.lastIndex = 0;
    while ((match = TOKEN_RE.exec(text))) {
      if (match.index > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      if (match[1]) {
        parent.appendChild(el("span", "ark-core-tip-kw", match[1]));
      } else if (match[2]) {
        var lowerIsBetter = LOWER_IS_BETTER_RE.test(text.slice(0, match.index));
        var good = (match[2] === "-") === lowerIsBetter;
        parent.appendChild(document.createTextNode(match[2]));
        parent.appendChild(el("span", good ? "ark-core-tip-good" : "ark-core-tip-bad", match[3]));
      } else {
        parent.appendChild(el("span", "ark-core-tip-num", match[4] || match[5]));
      }
      lastIndex = TOKEN_RE.lastIndex;
    }
    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }
  function buildTooltip(label, core) {
    var data = window.DB_CORE_OPTIONS && window.DB_CORE_OPTIONS[label];
    if (!data || !data.options || !data.options.length) return null;
    var tier = data.tier || "ancient";
    var tip = el("div", "ark-core-options-tip");
    tip.setAttribute("role", "tooltip");
    var header = el("div", "skill-tip-header");
    var icon = document.createElement("img");
    icon.className = "skill-tip-icon skill-tip-icon-rarity-" + tier;
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, CORE_ART[core] || "sun.png");
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon, "display");
    header.appendChild(icon);
    header.appendChild(el("div", "ark-core-tip-title", label));
    tip.appendChild(header);
    var list = el("div", "ark-core-tip-list");
    data.options.forEach(function (opt) {
      var line = el("div", "ark-core-tip-line");
      var bpLabel = el("span", "ark-core-tip-bp", "[" + opt.bp + "]");
      line.appendChild(bpLabel);
      var textEl = el("span", "ark-core-tip-text");
      window.SiteUtils.appendGradePairs(textEl, opt.text, appendHighlighted);
      line.appendChild(document.createTextNode(" "));
      line.appendChild(textEl);
      list.appendChild(line);
    });
    tip.appendChild(list);
    if (data.note) {
      tip.appendChild(el("div", "ark-core-tip-note", data.note));
    }
    return tip;
  }
  function buildItem(entry) {
    var item = el("div", "ark-core-item");
    var icon = document.createElement("img");
    icon.className = "ark-core-icon";
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, CORE_ART[entry.core] || "sun.png");
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon);
    item.appendChild(icon);
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
    var tip = buildTooltip(entry.label, entry.core);
    if (tip && window.SkillTooltip) {
      item.classList.add("ark-core-item-tip");
      window.SkillTooltip.wireCustom(item, tip, { panelHost: item });
    }
    return item;
  }
  function renderContainer(container) {
    var result = window.SiteUtils.readInlineJSON(container, "ark-core-badge.js");
    if (!result) return;
    var old = container.querySelector(".ark-core-row");
    if (old) old.remove();
    var row = el("div", "ark-core-row");
    result.data.forEach(function (entry) {
      row.appendChild(buildItem(entry));
    });
    container.appendChild(row);
  }
  window.SiteUtils.registerRenderer(".ark-cores", renderContainer);
})();
