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
// tap tooltip reproducing that core's full in-game "Core Option" list
// (10P/14P/17P/18P/19P/20P), so a reader can check what a core actually
// does without leaving the page. A label with no match (typo, or a core
// core-options-data.js hasn't been given yet) just renders without a
// tooltip - same "fail quietly" rule every other widget here follows.
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

  // "Destiny" is the one keyword the in-game tooltip itself colors (see
  // the reference screenshots this data was transcribed from) - matched
  // as a whole word so it also picks up the leading "Destiny" in a named
  // buff like "Destiny: Killing Feast" without matching unrelated text.
  var DESTINY_RE = /\bDestiny\b/g;

  // Appends `text` to `parent` as plain text nodes, splitting out any
  // "Destiny" occurrences into their own highlighted span. DOM-built
  // rather than innerHTML, same as every other widget here.
  function appendHighlighted(parent, text) {
    var lastIndex = 0;
    var match;
    DESTINY_RE.lastIndex = 0;
    while ((match = DESTINY_RE.exec(text))) {
      if (match.index > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      parent.appendChild(el("span", "ark-core-tip-kw", match[0]));
      lastIndex = DESTINY_RE.lastIndex;
    }
    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  // Builds the hover/focus/tap tooltip panel for one core, or null if
  // core-options-data.js has no entry for this label (fails quietly).
  function buildTooltip(label) {
    var data = window.DB_CORE_OPTIONS && window.DB_CORE_OPTIONS[label];
    if (!data || !data.options || !data.options.length) return null;

    var tip = el("div", "ark-core-options-tip");
    tip.setAttribute("role", "tooltip");

    tip.appendChild(el("div", "ark-core-tip-title", label));
    tip.appendChild(el("div", "ark-core-tip-subtitle", "Core Option"));

    var krSet = {};
    (data.krPatched || []).forEach(function (bp) { krSet[bp] = true; });

    var list = el("div", "ark-core-tip-list");
    data.options.forEach(function (opt) {
      var line = el("div", "ark-core-tip-line");
      var bpLabel = el("span", "ark-core-tip-bp", "[" + opt.bp + "]");
      line.appendChild(bpLabel);
      if (krSet[opt.bp]) {
        line.appendChild(el("span", "ark-core-tip-krtag", "KR"));
      }
      var textEl = el("span", "ark-core-tip-text");
      appendHighlighted(textEl, opt.text);
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

    var tip = buildTooltip(entry.label);
    if (tip) {
      item.classList.add("ark-core-item-tip");
      item.setAttribute("tabindex", "0");
      item.appendChild(tip);

      // CSS alone (:hover/:focus-within) covers mouse and keyboard; this
      // just adds a tap-to-toggle for touch, which triggers neither -
      // matching the ap-calc-popover open/close-on-outside-click pattern
      // elsewhere on the site rather than inventing a new one.
      item.addEventListener("click", function (evt) {
        if (item.classList.contains("ark-core-tip-open")) {
          item.classList.remove("ark-core-tip-open");
          return;
        }
        document.querySelectorAll(".ark-core-item.ark-core-tip-open").forEach(function (open) {
          open.classList.remove("ark-core-tip-open");
        });
        item.classList.add("ark-core-tip-open");
        evt.stopPropagation();
      });
    }

    return item;
  }

  // Tap-outside-to-close for the touch toggle above.
  document.addEventListener("click", function () {
    document.querySelectorAll(".ark-core-item.ark-core-tip-open").forEach(function (open) {
      open.classList.remove("ark-core-tip-open");
    });
  });
  document.addEventListener("keydown", function (evt) {
    if (evt.key === "Escape") {
      document.querySelectorAll(".ark-core-item.ark-core-tip-open").forEach(function (open) {
        open.classList.remove("ark-core-tip-open");
      });
    }
  });

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
