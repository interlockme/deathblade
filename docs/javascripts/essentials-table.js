// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Renders each family's "## <Family> Skills" reference list (one card per skill) on
// essentials.md from a compact per-row JSON blob (just icon id + name,
// for row order and the bold name cell), joined at render time with the
// SAME tags/note/lines data skill-setup.js's build-page cards AND
// skill-tooltip.js's tooltips read from skill-data.js (window.
// DB_SKILL_DATA). Update a tag, note, or meter/stack line ONCE there and
// this table, every build page's Skill Setup card, and every tooltip
// that names the skill all pick it up - the same text is never edited
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
    var data = (window.DB_SKILL_DATA && window.DB_SKILL_DATA[family] && window.DB_SKILL_DATA[family][entry.id]) || {};

    var li = el("li", "skill-row");

    var icon = document.createElement("img");
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "icon-" + entry.id + ".png");
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon);
    li.appendChild(icon);

    var body = el("div", "skill-row-body");

    // Name, then the meter/stack lines as ONE pill joined with the same
    // middle dot skill-tooltip.js uses, so "2 stacks" and "per cast" read
    // as one value instead of two.
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

    // Drop any already-rendered list before rebuilding, same
    // idempotency reasoning as skill-setup.js (re-runs on nav swap and
    // shouldn't stack duplicates next to the kept, invisible script tag).
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
