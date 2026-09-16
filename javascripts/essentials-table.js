(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("essentials-table.js");
  var el = window.SiteUtils.el;
  function buildRow(entry, family) {
    var tr = document.createElement("tr");
    var iconTd = document.createElement("td");
    var icon = document.createElement("img");
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "icon-" + entry.id + ".png");
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon);
    iconTd.appendChild(icon);
    tr.appendChild(iconTd);
    var data = (window.DB_SKILL_DATA && window.DB_SKILL_DATA[family] && window.DB_SKILL_DATA[family][entry.id]) || {};
    var nameTd = document.createElement("td");
    var strong = document.createElement("strong");
    strong.textContent = entry.name || (window.DB_SKILL_NAMES && window.DB_SKILL_NAMES[entry.id]) || entry.id;
    nameTd.appendChild(strong);
    (data.lines || []).forEach(function (line) {
      nameTd.appendChild(document.createElement("br"));
      var em = document.createElement("em");
      em.textContent = line;
      nameTd.appendChild(em);
    });
    tr.appendChild(nameTd);
    var tagsTd = document.createElement("td");
    (data.tags || []).forEach(function (pair) {
      var tag = el("span", "tag tag-" + pair[0]);
      tag.textContent = pair[1];
      tagsTd.appendChild(tag);
    });
    tr.appendChild(tagsTd);
    var noteTd = document.createElement("td");
    noteTd.textContent = data.note || "\u2014";
    tr.appendChild(noteTd);
    return tr;
  }
  function renderContainer(container) {
    var family = container.getAttribute("data-family") || "re";
    var result = window.SiteUtils.readInlineJSON(container, "essentials-table.js");
    if (!result) return;
    var entries = result.data;
    var old = container.querySelector("table");
    if (old) old.remove();
    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    ["", "Skill", "Tags", "Notes"].forEach(function (label) {
      var th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    entries.forEach(function (entry) {
      tbody.appendChild(buildRow(entry, family));
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }
  window.SiteUtils.registerRenderer(".skills-table[data-family]", renderContainer);
})();
