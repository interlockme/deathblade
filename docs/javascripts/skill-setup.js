// Renders each build page's "## Skill Setup" section from a compact JSON
// blob instead of a static skillsetup-*.png screenshot. Tag pills + the
// short descriptive note in a card's expanded body come from skill-data.js
// (window.DB_SKILL_DATA) - the SAME text as each family's own
// "## <Family> Skills" table on essentials.md, so the two stay in sync
// (see that file's own comment on how to keep them matching).
//
// Must load after skill-data.js - see the extra_javascript order in
// mkdocs.yml.
//
// EASY EDIT GUIDE:
//   <div class="skill-setup" data-family="re" markdown>
//   <script type="application/json">
//   [
//     {
//       "id": "fatalwave",
//       "level": 14,
//       "tripods": [2, 3, 2],
//       "rune": { "tier": "epic", "name": "Wealth" },
//       "picks": ["Optional build-specific bullet, e.g. why this tripod"]
//     },
//     { "id": "surge", "name": "Deathblade Surge" },
//     { "id": "deathlyslash", "subtitle": "Technique" },
//     { "id": "bladeassault", "subtitle": "Awakening" }
//   ]
//   </script>
//   </div>
//
//   data-family     - "re" or "surge". Picks which half of
//                     skill-data.js to read tags/notes from.
//
//   Per skill entry:
//     id      - REQUIRED. Matches icon-<id>.png in assets/shared/ AND
//               the key in skill-data.js AND skill-names.js. Same
//               lowercase-no-punctuation slug convention as every
//               icon-*.png asset already uses (e.g. "Twin Shadows" ->
//               "twinshadows").
//     name    - OPTIONAL. Display name on the card. Omit to resolve from
//               DB_SKILL_NAMES[id] (skill-names.js) - every skill on
//               this site uses its skill-names.js name as-is here, so
//               that's the default. Only set this to override the
//               display text for a one-off case (e.g. this build's
//               screen genuinely calls it something else).
//     level   - Skill level, shown as "Lv. <level>". Omit for skills
//               without a normal level (pair with "subtitle" instead).
//     subtitle - Small label shown instead of a level, e.g. "Technique",
//               "Awakening". Omit for normal leveled skills.
//     tripods - Array of 1-3 numbers, the picked option (1-3) in each
//               tripod tier, left to right. Omit entirely for skills
//               without tripods (Surge itself, Technique, Awakening).
//     rune    - { "tier": "green"|"blue"|"epic"|"legendary", "name": "..." }
//               Omit for skills that don't take a rune.
//     picks   - OPTIONAL array of short strings appended as bullets below
//               the shared note - use this for build-specific "why this
//               tripod/rune here" reasoning that doesn't belong in the
//               shared essentials.md description.
//
//   No tripod icon art yet - tripod chips are flat colored placeholders
//   (blue/green/gold = tier 1/2/3) showing just the picked option number.
//   Swap in real icons later inside buildCard() below; no markdown changes
//   needed when that art exists.
//
//   Skills with neither tripods nor a rune (Identity/Technique/Awakening)
//   render as normal cards (just without a chips row) inline in the same
//   masonry grid as every other skill, in whatever order they appear in
//   the JSON - nothing to opt into, just omit both fields.
(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("skill-setup.js");

  var el = window.SiteUtils.el;

  function buildCard(entry, family) {
    var details = document.createElement("details");
    details.className = "skill-card";

    var summary = document.createElement("summary");

    var icon = document.createElement("img");
    icon.className = "skill-card-icon";
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "icon-" + entry.id + ".png");
    icon.alt = "";
    icon.loading = "lazy";
    // A missing icon just collapses away instead of showing a broken-
    // image glyph, same graceful-degradation as dps-chart.js icons.
    window.SiteUtils.hideOnError(icon);
    summary.appendChild(icon);

    // .skill-card-main stacks the name row above the chips row instead of
    // sharing one row with them - with everything on one row, the chip
    // cluster (fixed-width, flex-shrink: 0) claimed roughly half the
    // card's width and left the name only ~80px to work with, ellipsing
    // almost every skill name ("Soul Absorber" -> "S...") even on wide
    // masonry columns. Stacking gives the name the card's FULL width on
    // its own line, and the chips their own line below where they no
    // longer compete with it for space.
    var main = el("span", "skill-card-main");

    var meta = el("span", "skill-card-meta");
    if (entry.subtitle) {
      meta.appendChild(el("span", "skill-card-subtitle", entry.subtitle));
    } else if (entry.level != null) {
      meta.appendChild(el("span", "skill-card-level", "Lv. " + entry.level));
    }
    meta.appendChild(el("span", "skill-card-name", entry.name || (window.DB_SKILL_NAMES && window.DB_SKILL_NAMES[entry.id]) || entry.id));
    main.appendChild(meta);

    var chips = el("span", "skill-card-chips");
    // Always render exactly 3 tripod slots (blue/green/gold, left to
    // right) when this skill has ANY tripods at all - not just
    // entry.tripods.length of them. A skill that hasn't reached its 3rd
    // tripod tier yet (e.g. a level 7 skill with only tripods: [2, 2])
    // still gets a slot reserved for the tier it doesn't have; that slot
    // is rendered invisible (tripod-chip-empty) rather than just omitted.
    // Omitting it outright used to pull every chip after the gap one slot
    // to the right (they sit right before the rune chip, which is itself
    // pinned to the row's right edge via .skill-card-chips' margin-left:
    // auto) - so a 2-tripod card's tier1/tier2 chips landed under where
    // OTHER cards' tier2/tier3 chips sit, instead of lining up tier-for-
    // tier down the grid. A same-size invisible placeholder keeps that
    // slot's width without drawing anything into it, so every card's
    // tier1 chip is always in the same column as every other card's
    // tier1 chip, regardless of how many tiers each skill actually has.
    // (entry.tripods array is always filled from tier1 upward per the
    // EASY EDIT GUIDE above, so a short array always means the MISSING
    // tier is the last one, never the first - safe to pad at the end.)
    if (entry.tripods && entry.tripods.length) {
      for (var t = 0; t < 3; t++) {
        if (t < entry.tripods.length) {
          chips.appendChild(el("span", "tripod-chip tripod-t" + (t + 1), String(entry.tripods[t])));
        } else {
          var placeholder = el("span", "tripod-chip tripod-chip-empty");
          placeholder.setAttribute("aria-hidden", "true");
          chips.appendChild(placeholder);
        }
      }
    }
    if (entry.rune) {
      chips.appendChild(el("span", "rune-chip rune-" + entry.rune.tier, entry.rune.name));
    }
    // Identity/Technique/Awakening cards have neither tripods nor a
    // rune, so skip appending an empty chips row for them.
    if (chips.children.length) {
      main.appendChild(chips);
    }
    summary.appendChild(main);
    summary.appendChild(el("span", "skill-card-arrow"));
    details.appendChild(summary);

    var body = el("div", "skill-card-body");
    var data = (window.DB_SKILL_DATA && window.DB_SKILL_DATA[family] && window.DB_SKILL_DATA[family][entry.id]) || {};
    (data.tags || []).forEach(function (pair) {
      body.appendChild(el("span", "tag tag-" + pair[0], pair[1]));
    });
    if (data.note) {
      body.appendChild(el("p", "skill-card-note", data.note));
    }
    if (entry.picks && entry.picks.length) {
      var ul = el("ul", "skill-card-picks");
      entry.picks.forEach(function (p) {
        ul.appendChild(el("li", null, p));
      });
      body.appendChild(ul);
    }
    if (!data.note && !(data.tags && data.tags.length) && !(entry.picks && entry.picks.length)) {
      body.appendChild(el("p", "skill-card-note", "No additional notes."));
    }
    details.appendChild(body);

    return details;
  }

  // ---- Masonry layout -----------------------------------------------
  // CSS Grid shares one row track across every card in the same row, so
  // opening card A grows that whole row and card B next to it is left
  // sitting above a dead gap before the next row starts - "B expanded
  // and shows nothing". Masonry fixes this: place each card in whichever
  // column is currently shortest, absolutely positioned at its own (x,y)
  // - opening a card then only pushes down whatever comes after it in
  // ITS column, never the neighboring column. See extra.css's comment on
  // .skill-setup-grid for the CSS half of this (position: relative on
  // the grid, position: absolute + a transform/width transition on each
  // .skill-card).
  // Must clear the 380px threshold in .skill-card-main's @container
  // query (extra.css) - that's the point a card's own width gets too
  // tight to fit the chip cluster beside the name on one row, forcing
  // it onto its own stacked line and inflating the card's height.
  // Deliberately padded well above 380, not just past it: `grid.
  // clientWidth` is an integer (subpixel layout widths get rounded),
  // `.skill-card` is `box-sizing: border-box` (Material's sitewide
  // reset) so the 2px border eats into the content box a container
  // query actually measures against, and browser zoom/scrollbar width
  // can shift the measured containerWidth by a few px either way. Any
  // of those alone is only a couple px, but they can stack - a small
  // buffer (previously 10px) still left a narrow real-world range where
  // 2 columns get picked at a colWidth that renders just under 380.
  // 30px of headroom absorbs that with room to spare.
  var MASONRY_MIN_WIDTH = 410;
  var MASONRY_GAP = 11; // ~0.7em at the site's 16px root, matches the old CSS grid gap

  function layoutMasonry(grid) {
    var cards = cardsOf(grid);
    if (!cards.length) return;

    var containerWidth = grid.clientWidth;
    // Container not laid out yet (e.g. inside a display:none tab) - skip
    // for now, the ResizeObserver below re-fires once it actually has a
    // width to lay out against.
    if (!containerWidth) return;

    // Capped at 2: at wide container widths (article column with no
    // sidebar, or a wide viewport) this math alone would floor to 3 or
    // 4, packing skill cards tightly enough that the chip cluster
    // (runes/tripods) no longer fits beside the name on one row - see
    // .skill-card-main's @container rule above, which stacks name/chips
    // once a CARD itself drops below ~380px. Three or four columns
    // squeezes each card well under that width on anything but an
    // extremely wide screen, forcing the stacked layout everywhere and
    // making the grid look cramped. Two columns is the most this design
    // is meant to support; MASONRY_MIN_WIDTH still governs collapsing to
    // a single column on narrow screens.
    var cols = Math.max(1, Math.min(2, Math.floor((containerWidth + MASONRY_GAP) / (MASONRY_MIN_WIDTH + MASONRY_GAP))));
    // Floored to a whole pixel, not left fractional: the right-hand
    // column's translateX below is this value plus the gap, so a
    // fractional colWidth put every non-first column at a fractional x
    // offset. Chrome antialiases a fractionally-transformed subtree fine,
    // but Firefox rasterizes it at an offset that doesn't line up with
    // the pixel grid and the text inside comes out visibly soft - hence
    // "right column blurry, left column (always x=0, always whole)
    // fine, only on Firefox". Flooring (not rounding) means colWidth*cols
    // can undershoot containerWidth by up to a pixel; harmless since
    // these are absolutely positioned and don't need to fill it exactly.
    var colWidth = Math.floor((containerWidth - MASONRY_GAP * (cols - 1)) / cols);
    var colHeights = new Array(cols).fill(0);

    cards.forEach(function (card) {
      var shortest = 0;
      for (var i = 1; i < cols; i++) {
        if (colHeights[i] < colHeights[shortest]) shortest = i;
      }
      var x = shortest * (colWidth + MASONRY_GAP);
      var y = colHeights[shortest];
      card.style.width = colWidth + "px";
      card.style.transform = "translate(" + x + "px, " + y + "px)";
      colHeights[shortest] = y + card.offsetHeight + MASONRY_GAP;
    });

    grid.style.height = Math.max.apply(null, colHeights) - MASONRY_GAP + "px";
    grid.classList.add("masonry-ready");
  }

  function initMasonry(grid) {
    var schedule = window.SiteUtils.rafSchedule(function () {
      layoutMasonry(grid);
    });

    schedule();

    if (window.ResizeObserver) {
      // One observer watching the grid itself (container width changes -
      // window resize, sidebar toggle, etc) AND every card (height
      // changes - a toggle opening/closing, or us setting its own width
      // below, which resolves to a no-op re-layout once widths settle).
      var ro = new ResizeObserver(schedule);
      ro.observe(grid);
      cardsOf(grid).forEach(function (card) {
        ro.observe(card);
      });
      // Stashed on the grid so renderContainer can disconnect it before
      // this grid is torn down on the next instant-navigation re-render -
      // otherwise every revisit to the page leaves another ResizeObserver
      // behind, still watching now-detached elements forever.
      grid.__masonryObserver = ro;
    } else {
      // No ResizeObserver: still react to the interactions that actually
      // change layout, just without the fine-grained auto-detection.
      cardsOf(grid).forEach(function (card) {
        card.addEventListener("toggle", schedule);
      });
      window.addEventListener("resize", schedule);
    }
  }

  function cardsOf(grid) {
    return Array.prototype.filter.call(grid.children, function (c) {
      return c.classList && c.classList.contains("skill-card");
    });
  }

  function renderContainer(container) {
    var family = container.getAttribute("data-family") || "re";
    var result = window.SiteUtils.readInlineJSON(container, "skill-setup.js");
    if (!result) return;
    var entries = result.data;

    // Re-running on an instant-navigation page swap: drop any
    // previously-rendered grid before rebuilding, rather than appending
    // duplicates next to the (kept, invisible) <script> source. Also
    // makes it harmless for more than one of the three triggers below to
    // fire for the same container.
    var old = container.querySelector(".skill-setup-grid");
    if (old) {
      if (old.__masonryObserver) old.__masonryObserver.disconnect();
      old.remove();
    }
    // Legacy cleanup: an earlier version of this script rendered
    // Identity/Technique/Awakening cards into a separate .skill-special-row
    // container instead of the main grid. Nothing writes that element
    // anymore, but on an instant-navigation swap the DOM could still be
    // holding one from before this script last updated - drop it so it
    // doesn't linger as an orphaned duplicate.
    var oldSpecial = container.querySelector(".skill-special-row");
    if (oldSpecial) oldSpecial.remove();

    // All entries render as normal cards in one grid, in JSON order.
    // Skills with no tripods and no rune (Identity/Technique/Awakening -
    // Surge, Deathly Slash, Blade Assault) just get a card with no chips
    // row - they used to be pulled into a separate row/container below
    // the main grid, but that read as a visually distinct, lesser group
    // instead of a normal part of the skill set.
    var grid = el("div", "skill-setup-grid");
    entries.forEach(function (entry) {
      var card = buildCard(entry, family);
      var isSpecial = !((entry.tripods && entry.tripods.length) || entry.rune);
      if (isSpecial) card.classList.add("skill-card-special");
      grid.appendChild(card);
    });
    container.appendChild(grid);
    initMasonry(grid);
  }

  window.SiteUtils.registerRenderer(".skill-setup[data-family]", renderContainer);
})();
