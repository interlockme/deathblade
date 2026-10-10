// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js/
// core-options-data.js; no code changes needed here, just point your
// build/essentials pages' JSON blocks (and core-options-data.js) at your
// own data.
//
// Renders the "## Ark Setup" section's 3 Order Cores (Sun/Moon/Star) as a
// small native widget instead of a static ordercores-*.png screenshot.
// Deliberately only covers the 3 ORDER cores (the red/orange-trimmed ones
// in-game), not the 3 Chaos cores - the screenshots showed all 6, but
// every build on this site only ever invests in the Order side, so the
// Chaos half was dead weight. Also intentionally does NOT try to
// reproduce the full Ark Grid evolution tree (that's argrid-tree.png,
// staying a screenshot) - just this one compact "which points are lit"
// readout.
//
// Each core shows its 3 point breakpoints (10P/14P/17P) as a dot with
// its point value underneath, always visible (not hover-only) - so a
// core that genuinely needs 0 points (some builds run a core at 0/3 on
// purpose) reads as "0 needed", not as missing/broken data.
//
// A card whose label has an entry in core-options-data.js (window.
// DB_CORE_OPTIONS, keyed by exact label text) also gets a hover/focus/
// tap tooltip reproducing that core's in-game option list
// (10P/14P/17P/18P/19P/20P), so a reader can check what a core actually
// does without leaving the page. The tooltip's header repeats the same
// sun/moon/star icon the card itself shows (see buildTooltip), on the
// Ancient grade's colour by default (an Order core's 17P line shows both
// grades, and the Ancient one is the end state), overridable per entry
// via an optional `tier` field.
// A label with no match (typo, or a core core-options-data.js hasn't
// been given yet) just renders without a tooltip - same "fail quietly"
// rule every other widget here follows. The panel is wired through
// skill-tooltip.js's SkillTooltip.wireCustom with opts.panelHost, so it stays
// inside its card; this file must load after skill-tooltip.js.
//
// EASY EDIT GUIDE:
//   <div class="ark-cores" data-family="re" markdown>
//   <script type="application/json">
//   [
//     { "core": "sun", "label": "Levin Slash", "points": 3 },
//     { "core": "moon", "label": "Deathblade Wave", "points": 3 },
//     { "core": "star", "label": "Death Sword Energy", "points": 3 }
//   ]
//   </script>
//   </div>
//
//   data-family - "re" or "surge". Cosmetic only right now (no per-family
//                 icon set to pick between), kept for consistency with
//                 skill-setup.js/essentials-table.js and in case that
//                 changes later.
//
//   Per entry:
//     core   - REQUIRED. "sun" | "moon" | "star" - picks the icon from
//              assets/shared/<core>.png.
//     label  - REQUIRED. The core's in-game name shown under the icon
//              (e.g. "Levin Slash" for Order Sun Core on a 333 build).
//     points - REQUIRED. 0-3, how many of the core's 3 point breakpoints
//              (10P/14P/17P) are invested. 0 = core is unlocked but
//              nothing extra spent on it (valid and common - shows as
//              "10 14 17" all muted, not an error), 3 = fully invested.
(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("ark-core-badge.js");

  var BREAKPOINTS = ["10P", "14P", "17P"];
  var CORE_ART = { sun: "sun.png", moon: "moon.png", star: "star.png" };

  var el = window.SiteUtils.el;

  // The in-game core tooltip colours four things in an option line, all
  // transcribed from its reference screenshots:
  //   - the keyword "Destiny", and a named Destiny effect as a whole
  //     ("Destiny: Slaughter Spectacle", "Destiny: Enhanced Sharpness";
  //     the colon after the name stays plain) -> purple
  //   - a signed figure's number and unit ("+2.5%", "-4.0s", "-50%"): the
  //     +/- sign itself stays plain. Green when the change helps the player,
  //     red when it hurts. That is not the same as the sign: a Cooldown or
  //     MP Cost figure is good when it goes DOWN ("cooldown -2.0s",
  //     "MP Cost -50%" are green, "Cooldown +6.0s" is red)
  //   - a duration ("30.0s") and a count ("1 time(s)", "up to 5 times"):
  //     the number is yellow, the word after it stays plain
  // One alternation, in this order, so a signed "-2.0s" is read as a signed
  // figure and never as a bare duration. Groups: 1 keyword, 2 sign,
  // 3 signed number and unit, 4 duration, 5 count.
  var TOKEN_RE = /\b(Destiny(?:: [A-Z][a-z]+(?: [A-Z][a-z]+)*)?)|([+-])(\d+(?:\.\d+)?[%s]?)|(\d+(?:\.\d+)?s)\b|(\d+)(?= times\b| time\(s\))/g;
  // A figure on these stats improves when it falls.
  var LOWER_IS_BETTER_RE = /(?:cooldown|MP Cost)\s*$/i;

  // Appends `text` to `parent` as plain text nodes, wrapping each coloured
  // piece (see TOKEN_RE) in its own span. DOM-built rather than innerHTML,
  // same as every other widget here. Relic/ancient pairs never reach this
  // function: SiteUtils.appendGradePairs renders them and only hands the text
  // between them here.
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

  // Builds the hover/focus/tap tooltip panel for one core, or null if
  // core-options-data.js has no entry for this label (fails quietly).
  // `core` ("sun"/"moon"/"star") picks the same CORE_ART icon buildItem
  // shows on the card itself. Reuses skill-tooltip.js/ark-passive-tooltip.js's
  // .skill-tip-header/.skill-tip-icon CSS rather than inventing
  // ark-core-specific classes, same "reuse the shared header row"
  // convention as rune-tooltip.js's own buildHeader.
  function buildTooltip(label, core) {
    var data = window.DB_CORE_OPTIONS && window.DB_CORE_OPTIONS[label];
    if (!data || !data.options || !data.options.length) return null;

    // The icon's fill is the Ancient colour unless the entry names another
    // grade in `tier` (the explicit escape hatch every DATA file on this
    // site allows over its fixed default).
    var tier = data.tier || "ancient";

    var tip = el("div", "ark-core-options-tip");
    tip.setAttribute("role", "tooltip");

    var header = el("div", "skill-tip-header");
    var icon = document.createElement("img");
    // skill-tip-icon-rarity-<tier>: same shared "fill a transparent
    // icon's background with its rarity color" treatment as
    // rune-tooltip.js's own buildHeader (see extra.css's
    // .skill-tip-icon-rarity-* comment) - sun.png/moon.png/star.png are
    // transparent cutouts same as a rune's icon.
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

    // Name + points live together in one column to the right of the icon
    // (matches the in-game core tooltip layout - icon left, name/points
    // stacked right of it) instead of each being centered independently
    // under the icon - that's what lets the name and the points row line
    // up under each other on a shared left edge.
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
      // The panel stays inside its card (panelHost) and SkillTooltip owns
      // hover, focus, tap-toggle, outside-click/Escape close, pruning and
      // clamping. The card is the trigger, so it gets tabindex, cursor and
      // aria-describedby from there. A label with no data, or a page without
      // skill-tooltip.js, renders a plain card (fails quietly).
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
