// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Renders each build page's "## Gems" section (the ranked Damage/
// Cooldown priority lists) from a compact JSON blob instead of requiring
// the rank+icon+name markup (and any expandable-alternative markup) to
// be handwritten in full for every row. Same instinct as skill-setup.js/
// rotation-line.js: author the data, not the DOM. Names and icons come
// from DB_SKILL_NAMES (skill-names.js), same id convention as a
// rotation-line.js step or a Skill Setup entry - a gem row is always
// some skill's gem, so there's no separate "gem name" vocabulary to
// maintain.
//
// Output is byte-for-byte the same DOM shape the old handwritten markup
// produced (.gem-col > .gem-col-header + .gem-list > .gem-item /
// details.gem-item-expandable > summary + .gem-item-alts > .gem-alt),
// so extra.css's gem-* rules keep working completely unchanged. Each
// row also carries a data-id attribute (see appendRowContent below) -
// gem-dps-tooltip.js reads that to match a row against a dps-chart's
// data-ids by id rather than comparing rendered name text.
//
// Must load after site-utils.js and skill-names.js, and BEFORE
// gem-dps-tooltip.js - see the extra_javascript order in mkdocs.yml.
// gem-dps-tooltip.js only reads whatever .gem-item/.gem-item-name
// elements already exist in the DOM when it runs, so this has to build
// them first.
//
// EASY EDIT GUIDE:
//   <div class="gem-priority" markdown>
//   <script type="application/json">
//   [
//     { "col": "dmg", "items": [
//       "surge",
//       "deathsentence",
//       { "id": "soulabsorber", "alts": [
//         { "id": "blitzrush", "note": "Faster recovery from smaller mistakes, pairs with Twin Shadows or Fatal Wave below." }
//       ] },
//       "turningslash"
//     ] },
//     { "col": "cd", "items": [
//       "maelstrom",
//       "blitzrush",
//       "headhunt"
//     ] }
//   ]
//   </script>
//   </div>
//
//   Root is always exactly 2 entries, one per column, in whatever order
//   you want them to appear (Damage then Cooldown is the site
//   convention so far, but nothing enforces it).
//
//   Per column:
//     col   - REQUIRED. "dmg" | "cd" - picks the rose/teal accent
//             styling (.gem-col-dmg / .gem-col-cd in extra.css), which
//             flavor of tooltip gem-dps-tooltip.js attaches (a Damage
//             row leads with its damage-share figure from the page's
//             "## Trixion DPS" chart, a Cooldown row doesn't), AND the
//             default header text ("dmg" -> "Damage", "cd" -> "Cooldown").
//     label - OPTIONAL override of the "dmg"/"cd" default header text
//             above. Every column on this site uses the default as-is.
//     items - REQUIRED array of gem entries, ROW ORDER IS RANK - the
//             first entry is rank 1 (gets the gold treatment), the
//             next rank 2, everything after that shares the quiet
//             "floor" rank styling. There's no separate rank number to
//             keep in sync with array order - reordering the array IS
//             reordering the ranks.
//
//   Per item, the common case is just a bare skill id string - same id
//   you'd use in a Skill Setup entry or a rotation-line.js step (matches
//   icon-<id>.png in assets/shared/, looked up in DB_SKILL_NAMES for the
//   display name). Use the object form for the less common cases:
//     { "id": "fatalwave", "name": "FTF" }
//       - override the display name (icon still comes from id).
//     { "id": "soulabsorber", "alts": [ { "id": "blitzrush", "note": "..." } ] }
//       - turns the row into an expandable (arrow, click to open) with
//         one or more suggested alternative gems listed below it. Each
//         alt needs "id" (its own icon+name, same lookup as above,
//         "name" override optional same as the parent) and "note" (why
//         you'd swap to it - shown after the alt's name). "**word**"
//         inside a note bolds that word.
//     { "id": "voidstrike", "tip": "Swap to the alt below when running 113." }
//       - OPTIONAL freeform recommendation shown as an extra line in
//         THIS row's own hover tooltip (gem-dps-tooltip.js), below its
//         usual tags/note - not the same thing as an alt's "note" above,
//         which only shows once that alt's row is expanded. Mainly for
//         Cooldown gems: they have no damage-share figure to justify a
//         swap the way a Damage gem's tooltip can point at, so this is
//         the place to spell out build-specific context on the base gem
//         itself (e.g. "replace with the alternate skill when using
//         113") without requiring the reader to expand it first. Combine
//         freely with "alts" - the tip talks about the base gem's OWN
//         row, the alts list is still what the reader actually swaps to.
//
//   No "situational" concept here (unlike rotation-line.js) - a gem
//   either makes a build's priority list at some rank, or it's an alt
//   under one. If a build genuinely needs a free-text callout that
//   doesn't fit either shape, use the existing "## Gems" ->
//   .setup-notes markdown block below the .gem-priority div (see
//   .setup-panel's existing convention) rather than adding a new field
//   here.
(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("gem-priority.js");

  // Every column on this site uses its "col" value's own obvious header
  // text ("dmg" -> "Damage", "cd" -> "Cooldown") - col.label only needs
  // authoring for a genuine one-off different header.
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

  // Rank badge + icon + name, shared between the plain-row and the
  // <summary> variant so both stay pixel-identical - only the wrapping
  // element and the trailing arrow differ (see buildRow below).
  function appendRowContent(parent, rank, entry) {
    // data-id on the exact element gem-dps-tooltip.js already selects
    // (this row itself for a plain .gem-item, or the <summary> for an
    // expandable one) - lets it match against a dps-chart's data-ids by
    // id instead of comparing rendered name text.
    parent.setAttribute("data-id", entry.id);
    // Same "stamp on the exact rendered trigger element" pattern as
    // data-id above, for gem-dps-tooltip.js's opts.extra line - kept as
    // its own attribute (not folded into data-id) so a row with no "tip"
    // authored simply has no attribute at all, rather than one holding
    // an empty string.
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
