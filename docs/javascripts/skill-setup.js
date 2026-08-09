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
//       "name": "Fatal Wave",
//       "level": 14,
//       "tripods": [2, 3, 2],
//       "rune": { "tier": "epic", "name": "Wealth" },
//       "picks": ["Optional build-specific bullet, e.g. why this tripod"]
//     },
//     { "id": "surge", "name": "Deathblade Surge" },
//     { "id": "deathlyslash", "name": "Deathly Slash", "subtitle": "Technique" },
//     { "id": "bladeassault", "name": "Blade Assault", "subtitle": "Awakening" }
//   ]
//   </script>
//   </div>
//
//   data-family     - "re" or "surge". Picks both the icon folder
//                     (assets/<family>/icon-<id>.png) and which half of
//                     skill-data.js to read tags/notes from.
//
//   Per skill entry:
//     id      - REQUIRED. Matches icon-<id>.png in assets/<family>/ AND
//               the key in skill-data.js. Same lowercase-no-punctuation
//               slug convention as every icon-*.png asset already uses
//               (e.g. "Twin Shadows" -> "twinshadows").
//     name    - REQUIRED. Display name on the card (can differ from the
//               essentials.md name if this build's screen calls it
//               something slightly different, e.g. "Deathblade Surge").
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
(function () {
  function detectSiteRoot() {
    var scriptEl = document.currentScript || document.querySelector('script[src*="javascripts/skill-setup.js"]');
    if (scriptEl && scriptEl.src) {
      return scriptEl.src.replace(/javascripts\/skill-setup\.js(\?.*)?(#.*)?$/, "");
    }
    // Fallback: derive from the site stylesheet link, same trick as
    // dps-chart.js/build-compare.js use for the same reason - a JS
    // inserted <img> needs an absolute URL, not a relative one, since
    // mkdocs's directory-style page URLs add a path segment a real
    // markdown image gets auto-corrected for at build time but a
    // runtime-inserted one does not.
    var linkEl = document.querySelector('link[href*="stylesheets/extra.css"]');
    if (linkEl && linkEl.href) {
      return linkEl.href.replace(/stylesheets\/extra\.css(\?.*)?(#.*)?$/, "");
    }
    return "";
  }
  var SITE_ROOT = detectSiteRoot();

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildCard(entry, family) {
    var details = document.createElement("details");
    details.className = "skill-card";

    var summary = document.createElement("summary");

    var icon = document.createElement("img");
    icon.className = "skill-card-icon";
    icon.src = SITE_ROOT + "assets/" + family + "/icon-" + entry.id + ".png";
    icon.alt = "";
    icon.loading = "lazy";
    // A missing icon just collapses away instead of showing a broken-
    // image glyph, same graceful-degradation as dps-chart.js icons.
    icon.addEventListener("error", function () {
      icon.style.visibility = "hidden";
    });
    summary.appendChild(icon);

    var meta = el("span", "skill-card-meta");
    if (entry.subtitle) {
      meta.appendChild(el("span", "skill-card-subtitle", entry.subtitle));
    } else if (entry.level != null) {
      meta.appendChild(el("span", "skill-card-level", "Lv. " + entry.level));
    }
    meta.appendChild(el("span", "skill-card-name", entry.name || entry.id));
    summary.appendChild(meta);

    var chips = el("span", "skill-card-chips");
    (entry.tripods || []).forEach(function (pick, i) {
      chips.appendChild(el("span", "tripod-chip tripod-t" + (i + 1), String(pick)));
    });
    if (entry.rune) {
      chips.appendChild(el("span", "rune-chip rune-" + entry.rune.tier, entry.rune.name));
    }
    summary.appendChild(chips);
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
  var MASONRY_MIN_WIDTH = 320; // keep in sync with the old grid-template-columns minmax()
  var MASONRY_GAP = 11; // ~0.7em at the site's 16px root, matches the old CSS grid gap

  function layoutMasonry(grid) {
    var cards = Array.prototype.filter.call(grid.children, function (c) {
      return c.classList && c.classList.contains("skill-card");
    });
    if (!cards.length) return;

    var containerWidth = grid.clientWidth;
    // Container not laid out yet (e.g. inside a display:none tab) - skip
    // for now, the ResizeObserver below re-fires once it actually has a
    // width to lay out against.
    if (!containerWidth) return;

    var cols = Math.max(1, Math.floor((containerWidth + MASONRY_GAP) / (MASONRY_MIN_WIDTH + MASONRY_GAP)));
    var colWidth = (containerWidth - MASONRY_GAP * (cols - 1)) / cols;
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
    var scheduled = false;
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        layoutMasonry(grid);
      });
    }

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
    // mkdocs-material's instant-navigation content swap recreates every
    // <script> element found in newly-inserted page content so that real
    // JS assets actually re-execute (a <script> inserted via innerHTML/
    // DOM-diffing doesn't run on its own). For a <script src="...">, it
    // copies every attribute across; for an inline script like ours (no
    // src), it only copies the text content - our type="application/json"
    // attribute gets silently dropped in that process. So this container
    // is guaranteed by the EASY EDIT GUIDE above to hold exactly one
    // <script>, matched on the bare tag rather than its type - matching
    // on type only works on a hard page load, not after clicking a nav
    // link. (The recreated tag becomes a plain, harmless-to-run script
    // since our JSON payload also happens to be valid as a JS expression
    // statement - it's evaluated and discarded, textContent is untouched.)
    var script = container.querySelector("script");
    if (!script) return;

    var entries;
    try {
      entries = JSON.parse(script.textContent);
    } catch (e) {
      console.error("skill-setup.js: invalid JSON in .skill-setup block", e);
      return;
    }

    // Re-running on an instant-navigation page swap: drop any
    // previously-rendered grid before rebuilding, rather than appending
    // duplicates next to the (kept, invisible) <script> source. Also
    // makes it harmless for more than one of the three triggers below to
    // fire for the same container.
    var old = container.querySelector(".skill-setup-grid");
    if (old) old.remove();

    var grid = el("div", "skill-setup-grid");
    entries.forEach(function (entry) {
      grid.appendChild(buildCard(entry, family));
    });
    container.appendChild(grid);
    initMasonry(grid);
  }

  function scanAndRender(root) {
    if (!root) return;
    if (root.matches && root.matches(".skill-setup[data-family]")) {
      renderContainer(root);
    }
    if (root.querySelectorAll) {
      root.querySelectorAll(".skill-setup[data-family]").forEach(renderContainer);
    }
  }

  function renderAll() {
    scanAndRender(document);
  }

  // Three independent, overlapping triggers - deliberately redundant
  // (renderContainer above is a safe no-op-then-rebuild if called twice
  // for the same container) rather than picking a single "correct" one,
  // since a wrong assumption about mkdocs-material's instant-navigation
  // timing here means the whole Skill Setup section silently fails to
  // render until a manual reload with no visible error.
  //
  // 1) A normal/direct page load. This script can run either before or
  //    after the HTML parser reaches DOMContentLoaded depending on where
  //    mkdocs places extra_javascript, so check readyState instead of
  //    assuming: run immediately if the DOM is already parsed, otherwise
  //    wait for the event.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAll);
  } else {
    renderAll();
  }

  // 2) navigation.instant page swaps. document$ is Material's own hook
  //    that re-emits on every page view, including the very first one -
  //    see dps-chart.js/build-compare.js/pentagon-badge.js for the same
  //    pattern elsewhere in this project.
  if (window.document$) {
    document$.subscribe(renderAll);
  }

  // 3) Belt-and-suspenders: watch the page body directly and render any
  //    Skill Setup container the moment it's inserted, regardless of
  //    which mechanism put it there. Cheap per mutation (a class check
  //    on added element nodes), so safe to leave running for the page's
  //    whole lifetime alongside the calculators' own frequent DOM updates.
  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) scanAndRender(node);
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
