// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Renders each family's "## <Family> Skills" reference table on
// essentials.md from a compact per-row JSON blob (just icon id + name,
// for row order and the bold name cell), joined at render time with the
// SAME tags/note/lines data skill-setup.js's build-page cards AND
// skill-tooltip.js's tooltips read from skill-data.js (window.
// DB_SKILL_DATA). Update a tag, note, or meter/stack line ONCE there and
// this table, every build page's Skill Setup card, and every tooltip
// that names the skill all pick it up - no more editing the same text
// in multiple places.
//
// Must load after skill-data.js - see the extra_javascript order in
// mkdocs.yml.
//
// EASY EDIT GUIDE:
//   <div class="skills-table" data-family="re" markdown>
//   <script type="application/json">
//   [
//     { "id": "maelstrom" },
//     { "id": "voidstrike" },
//     { "id": "surge" }
//   ]
//   </script>
//   </div>
//
//   data-family - "re" or "surge". Same meaning as skill-setup.js: picks
//                 which half of skill-data.js to read tags/notes/lines from.
//
//   Per row:
//     id    - REQUIRED. Matches icon-<id>.png in assets/shared/ AND the
//             key in skill-data.js. Same slug every icon-*.png asset uses.
//     name  - OPTIONAL. Bold skill name shown in the first text cell.
//             Omit to resolve from DB_SKILL_NAMES[id] (skill-names.js) -
//             every row on this site uses its skill-names.js name as-is,
//             same default-and-override convention as skill-setup.js's
//             "name" field. Only set this to override the display text
//             for a genuine one-off case.
//
//   Tags, Notes, and the small italic value lines under the name (a
//   meter/stack value, a cast-rate note, etc) are never authored here -
//   they always come from skill-data.js's "lines" field so this table,
//   the matching build-page skill cards, and every tooltip can't drift
//   out of sync. Omitted there entirely for skills with nothing extra
//   to show (e.g. Death Trance).
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
