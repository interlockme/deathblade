// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Renders each family's "## <Family> Skills" reference table on
// essentials.md from a compact per-row JSON blob (icon id, name, and any
// small italic value lines like "4201 meter"), joined at render time with
// the SAME tags/note text skill-setup.js's build-page cards read from
// skill-data.js (window.DB_SKILL_DATA). Update a tag or note ONCE there
// and both this table and every build page's Skill Setup card picks it
// up - no more editing the same text in two places.
//
// Must load after skill-data.js - see the extra_javascript order in
// mkdocs.yml.
//
// EASY EDIT GUIDE:
//   <div class="skills-table" data-family="re" markdown>
//   <script type="application/json">
//   [
//     { "id": "maelstrom", "name": "Maelstrom", "lines": ["4201 meter", "self buffed"] },
//     { "id": "voidstrike", "name": "Void Strike", "lines": ["6314 meter"] },
//     { "id": "surge", "name": "Surge", "lines": ["180/s OC2", "450/s OC5"] }
//   ]
//   </script>
//   </div>
//
//   data-family - "re" or "surge". Same meaning as skill-setup.js: picks
//                 which half of skill-data.js to read tags/notes from.
//
//   Per row:
//     id    - REQUIRED. Matches icon-<id>.png in assets/shared/ AND the
//             key in skill-data.js. Same slug every icon-*.png asset uses.
//     name  - REQUIRED. Bold skill name shown in the first text cell.
//     lines - OPTIONAL array of small italic lines under the name (a
//             meter/stack value, a cast-rate note, etc). Omit for skills
//             with nothing extra to show (e.g. Death Trance).
//
//   Tags + Notes columns are never authored here - they always come from
//   skill-data.js so this table and the matching build-page skill cards
//   can't drift out of sync.
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

    var nameTd = document.createElement("td");
    var strong = document.createElement("strong");
    strong.textContent = entry.name || entry.id;
    nameTd.appendChild(strong);
    (entry.lines || []).forEach(function (line) {
      nameTd.appendChild(document.createElement("br"));
      var em = document.createElement("em");
      em.textContent = line;
      nameTd.appendChild(em);
    });
    tr.appendChild(nameTd);

    var data = (window.DB_SKILL_DATA && window.DB_SKILL_DATA[family] && window.DB_SKILL_DATA[family][entry.id]) || {};

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

    // Drop any previously-rendered table before rebuilding, same
    // idempotency reasoning as skill-setup.js (re-runs on nav swap and
    // shouldn't stack duplicates next to the kept, invisible script tag).
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
