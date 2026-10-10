(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("essentials-table.js");
  var el = window.SiteUtils.el;
  function buildRow(entry, family) {
    var data = (window.DB_SKILL_DATA && window.DB_SKILL_DATA[family] && window.DB_SKILL_DATA[family][entry.id]) || {};
    var li = el("li", "skill-row");
    var icon = document.createElement("img");
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "icon-" + entry.id + ".png");
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon);
    li.appendChild(icon);
    var body = el("div", "skill-row-body");
    var top = el("div", "skill-row-top");
    var strong = el("strong", "skill-row-name");
    strong.textContent = entry.name || (window.DB_SKILL_NAMES && window.DB_SKILL_NAMES[entry.id]) || entry.id;
    top.appendChild(strong);
    if (data.lines && data.lines.length) {
      top.appendChild(el("span", "skill-row-meter", data.lines.join(" \u00B7 ")));
    }
    body.appendChild(top);
    if (data.tags && data.tags.length) {
      var tags = el("div", "skill-row-tags");
      data.tags.forEach(function (pair) {
        var tag = el("span", "tag tag-" + pair[0]);
        tag.textContent = pair[1];
        tags.appendChild(tag);
      });
      body.appendChild(tags);
    }
    body.appendChild(el("div", "skill-row-note", data.note || "\u2014"));
    li.appendChild(body);
    return li;
  }
  function renderContainer(container) {
    var family = container.getAttribute("data-family") || "re";
    var result = window.SiteUtils.readInlineJSON(container, "essentials-table.js");
    if (!result) return;
    var entries = result.data;
    var old = container.querySelector(".skill-rows");
    if (old) old.remove();
    var list = el("ul", "skill-rows");
    entries.forEach(function (entry) {
      list.appendChild(buildRow(entry, family));
    });
    container.appendChild(list);
  }
  window.SiteUtils.registerRenderer(".skills-table[data-family]", renderContainer);
})();
