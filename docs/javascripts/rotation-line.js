// Renders every ".rotation-line" from a compact JSON step list instead
// of requiring the icon+span+arrow markup to be handwritten in full on
// every single line. Same instinct as skill-setup.js/essentials-table.js:
// author the data, not the DOM.
//
// Output is byte-for-byte the same DOM shape the old handwritten markup
// produced (.rotation-line > .skill/.arrow, with img + text inside
// .skill), so extra.css's rotation-line rules and rotation-practice.js's
// click-to-advance drill both keep working completely unchanged.
//
// Must load after site-utils.js and skill-names.js, and BEFORE
// rotation-practice.js - see the extra_javascript order in mkdocs.yml.
// rotation-practice.js only wires up whatever .skill/.arrow elements
// already exist in the DOM when it runs, so this has to build them first.
//
// EASY EDIT GUIDE:
//   <div class="rotation-line" markdown>
//   <script type="application/json">
//   ["maelstrom", "voidstrike", "twinshadows", "headhunt", "deathlyslash",
//    "deathsentence", "turningslash", "surge"]
//   </script>
//   </div>
//
//   The common case is just an array of skill ids in order - the name
//   ("Turning Slash") and icon (icon-turningslash.png) are both looked
//   up automatically from DB_SKILL_NAMES (skill-names.js), same id you'd
//   use in a Skill Setup JSON entry or essentials-table.js row.
//
//   A step can also be an object for the less common cases:
//     { "id": "fatalwave", "name": "FTF" }
//       - override the display name (icon still comes from id).
//     { "id": "headhunt", "situational": true }
//       - de-emphasized/optional step (dashed border, "situational" tag
//         under the name). Same visual meaning as before.
//     { "id": "deathlyslash", "situational": "every other rotation" }
//       - situational with custom tag text instead of "situational".
//         "**word**" inside the tag text bolds that word, same as
//         before.
//     { "icons": ["turningslash", "surpriseattack"], "situational": true,
//       "situational": "synergy/adrenaline" }
//       - two icons joined by "or" or, with no name text - for a step
//         that's really "pick whichever of these is up".
//     { "cycleRef": 2, "title": "Soul Absorber + Blitz Rush Cycle" }
//       - a pseudo-step pointing at a Cycle card above instead of a
//         real skill (no icon). Renders the same cycle-num/cycle-title
//         pill the Cycle card's own header uses.
//
//   The root must always be a bare array (never a top-level object - see
//   the note on mkdocs-material's instant-navigation below for why). For
//   trailing text after the last arrow (the RE Opener rotations use this
//   for the "-> Cycle 2 -> Cycle 1 -> etc." loop-back), add one more
//   entry at the very end: { "suffix": "etc." }
(function () {
  function detectSiteRoot() {
    var scriptEl = document.currentScript || document.querySelector('script[src*="javascripts/rotation-line.js"]');
    if (scriptEl && scriptEl.src) {
      return scriptEl.src.replace(/javascripts\/rotation-line\.js(\?.*)?(#.*)?$/, "");
    }
    // Fallback, same trick as skill-setup.js/essentials-table.js/dps-chart.js.
    var linkEl = document.querySelector('link[href*="stylesheets/extra.css"]');
    if (linkEl && linkEl.href) {
      return linkEl.href.replace(/stylesheets\/extra\.css(\?.*)?(#.*)?$/, "");
    }
    return "";
  }
  var SITE_ROOT = detectSiteRoot();

  var el = window.SiteUtils.el;
  var iconSrc = window.SiteUtils.iconSrc;
  var hideOnError = window.SiteUtils.hideOnError;

  // Just enough Markdown to matter for a situational tag - "**word**"
  // becomes <strong>word</strong>, everything else is plain text. Not a
  // general Markdown parser, this data never reaches pymdownx since it's
  // built client-side after the page's own Markdown pass already ran.
  function appendInlineBold(parent, text) {
    var parts = text.split(/\*\*(.+?)\*\*/g);
    parts.forEach(function (part, i) {
      if (!part) return;
      parent.appendChild(i % 2 === 1 ? el("strong", null, part) : document.createTextNode(part));
    });
  }

  function buildIcon(id) {
    var img = document.createElement("img");
    img.src = iconSrc(SITE_ROOT, "icon-" + id + ".png");
    img.alt = "";
    hideOnError(img, "visibility");
    return img;
  }

  function buildStep(step) {
    if (typeof step === "string") step = { id: step };

    var span = el("span", "skill");
    if (step.situational) span.classList.add("skill-situational");

    if (step.cycleRef != null) {
      span.appendChild(el("span", "cycle-num", String(step.cycleRef)));
      span.appendChild(el("span", "cycle-title", step.title || ""));
    } else if (step.icons && step.icons.length) {
      step.icons.forEach(function (id, i) {
        if (i > 0) span.appendChild(document.createTextNode(" or "));
        span.appendChild(buildIcon(id));
      });
    } else {
      span.appendChild(buildIcon(step.id));
      var name = step.name || window.DB_SKILL_NAMES[step.id] || step.id;
      span.appendChild(document.createTextNode(name));
    }

    if (step.situational) {
      var tag = el("span", "skill-situational-tag");
      appendInlineBold(tag, typeof step.situational === "string" ? step.situational : "situational");
      span.appendChild(tag);
    }

    return span;
  }

  function buildArrow() {
    var span = el("span", "arrow");
    span.textContent = " \u2192 ";
    return span;
  }

  function renderLine(line) {
    // mkdocs-material's instant-navigation content swap recreates every
    // <script> element found in newly-inserted page content so that real
    // JS assets actually re-execute (a <script> inserted via innerHTML/
    // DOM-diffing doesn't run on its own). For a <script src="...">, it
    // copies every attribute across; for an inline script like ours (no
    // src), it only copies the text content - our type="application/json"
    // attribute gets silently dropped in that process. So this line is
    // guaranteed by the EASY EDIT GUIDE above to hold exactly one
    // <script>, matched on the bare tag rather than its type - matching
    // on type only works on a hard page load, not after clicking a nav
    // link (see skill-setup.js's renderContainer for the same fix and a
    // longer explanation). The recreated tag becomes a plain, harmless-
    // to-run script since our JSON payload is required to be array-rooted
    // (see EASY EDIT GUIDE), which also happens to be valid as a JS
    // expression statement - it's evaluated and discarded, textContent is
    // untouched. A top-level *object* payload is NOT safe here: as a JS
    // statement `{` opens a block, and a string key immediately followed
    // by `:` is a syntax error the recreated script throws for real,
    // which is exactly the bug that used to make rotation lines stay
    // empty after a regular nav click (worked fine on reload/direct load,
    // where the browser's normal parser respects the original type and
    // never executes it at all).
    var scriptEl = line.querySelector("script");
    if (!scriptEl) return; // handwritten/legacy markup, or no data to render - leave it alone

    // document$ can (and does, even on a plain page load with zero
    // navigation - verified via instrumentation) emit several times in
    // quick succession, and the MutationObserver layer piles on top of
    // that. Without this guard every extra emission means a pointless
    // full teardown-and-rebuild of every rotation-line on the page -
    // wasteful, and a window (however brief) where the line has no
    // .skill/.arrow children at all. Skip straight to a no-op when the
    // underlying data hasn't actually changed.
    var raw = scriptEl.textContent;
    if (line._rotationRawData === raw) return;

    var data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("rotation-line: invalid JSON, leaving line unrendered", err, line);
      return;
    }

    if (!Array.isArray(data)) {
      console.error("rotation-line: root must be an array, leaving line unrendered", line);
      return;
    }

    // A trailing `{ "suffix": "..." }` marker (an object with ONLY a
    // "suffix" key - real steps always have id/icons/cycleRef) carries
    // text after the last arrow instead of being a step. See EASY EDIT
    // GUIDE above for why this can't just be a top-level {steps, suffix}
    // object instead.
    var steps = data.slice();
    var suffix = null;
    var last = steps[steps.length - 1];
    if (
      last && typeof last === "object" && !Array.isArray(last) &&
      "suffix" in last && !("id" in last) && !("icons" in last) && !("cycleRef" in last)
    ) {
      suffix = last.suffix;
      steps.pop();
    }

    // Idempotent rebuild (safe to call again on the same line, matching
    // skill-setup.js's convention) - only ever remove nodes THIS function
    // built, never the <script> the data lives in.
    Array.prototype.slice.call(line.children).forEach(function (child) {
      if (child !== scriptEl) child.remove();
    });

    var frag = document.createDocumentFragment();
    steps.forEach(function (step, i) {
      if (i > 0) frag.appendChild(buildArrow());
      frag.appendChild(buildStep(step));
    });
    if (suffix) {
      frag.appendChild(buildArrow());
      frag.appendChild(document.createTextNode("\u00A0" + suffix));
    }
    line.appendChild(frag);
    line._rotationRawData = raw;
  }

  function renderAll() {
    document.querySelectorAll(".rotation-line").forEach(renderLine);
  }

  // Three independent, overlapping triggers, same reasoning and same
  // pattern as skill-setup.js (see its comment for the full rationale):
  // document$ alone reliably re-fires on Material's instant-navigation
  // page swaps, but is NOT guaranteed to fire before a true first/direct
  // page load's DOM is actually ready - which is why rotation lines were
  // staying empty until something else (a nav, a reload) triggered a
  // document$ emission. renderLine()/renderAll() are idempotent, so it's
  // safe to just fire from all three rather than get the timing "right".

  // 1) Normal/direct page load.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAll);
  } else {
    renderAll();
  }

  // 2) navigation.instant page swaps.
  if (window.document$) {
    document$.subscribe(renderAll);
  }

  // 3) Belt-and-suspenders: render any .rotation-line the moment it's
  // inserted, regardless of which mechanism put it there.
  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(".rotation-line")) renderLine(node);
          if (node.querySelectorAll) node.querySelectorAll(".rotation-line").forEach(renderLine);
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
