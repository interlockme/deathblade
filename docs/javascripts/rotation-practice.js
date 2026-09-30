// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Click-to-advance "practice mode" for rotation sequences.
//
// Turns any .rotation-line (including the ones nested inside .cycle-card)
// into a step-through drill: a small "Practice" toggle appears
// automatically on any rotation-line with 2+ .skill steps, no markup
// changes needed on any page. Once active:
//   - click anywhere on the line (or press spacebar) to advance a step
//   - the sequence loops back to the start after the last step
//   - Escape, or clicking the toggle again, exits practice mode
//
// The toggle never reserves layout space:
//   - standalone rotation-line -> absolutely-positioned pill floating
//     over the box's own top-right corner, inside a plain zero-margin
//     wrapper (so the box's own overflow:hidden doesn't clip it)
//   - rotation-line nested in a .cycle-card -> joins the existing
//     .cycle-card-header row instead (margin-left: auto), since that
//     row already has room rather than floating a second badge
//
// A .cycle-card-multi (a Cycle whose follow-up continues directly from
// it, authored as two .rotation-line children, each starting with its own
// leading stageLabel pseudo-step instead of two separate cycle-card-header/
// Practice pairs) gets ONE shared toggle for the whole card instead: getSteps() below already
// walks every .skill under whatever element it's given regardless of how
// many .rotation-line children sit under it, so the only real new code is
// wireMultiCard()/getLines() further down - enter/exit/advance/highlight
// all work unchanged, just called with the card as the "unit" instead of
// a single line.
//
// Only one drill unit (a rotation-line, or a whole cycle-card-multi) is
// "active" (spacebar-listening) at a time - starting practice on a new
// one automatically exits the previous one.

(function () {
  var activeLine = null;

  // A "unit" is whatever enterPractice/exitPractice/advance operate on -
  // a single .rotation-line normally, or a .cycle-card-multi wrapping
  // several. getLines() is only needed for adding/removing the
  // .practice-mode class on the actual .rotation-line(s) so the existing
  // dimming/border CSS (which targets .rotation-line.practice-mode) keeps
  // working unchanged either way.
  // A .cycle-alt-branch is an optional VARIANT of the card's last stage,
  // not a continuation of it (see extra.css's .cycle-alt-branch comment -
  // e.g. Surge 111's "Alt: Awakening Follow-Up" sitting inside the
  // Breaking Moon Cycle + Follow-Up card). querySelectorAll(".rotation-line")
  // below walks ALL descendants regardless of nesting depth, so without
  // this filter its line would silently get swept into the same combined
  // walk as the real Cycle -> Follow-up sequence, making Practice mode
  // drill through an alternative path as if it directly followed the
  // real one. Filtering by .closest() here keeps the alt line out of both
  // the shared step list AND the practice-mode dimming class below -
  // it stays a plain static reference, same as it would be if it weren't
  // nested inside a .cycle-card-multi at all.
  function isAltBranch(line) {
    return !!line.closest(".cycle-alt-branch");
  }

  function getLines(unit) {
    if (unit.classList.contains("cycle-card-multi")) {
      return Array.prototype.slice
        .call(unit.querySelectorAll(".rotation-line"))
        .filter(function (l) { return !isAltBranch(l); });
    }
    return [unit];
  }

  // querySelectorAll walks ALL descendants regardless of nesting depth,
  // so this already returns the combined, in-DOM-order step list across
  // every .rotation-line child when unit is a .cycle-card-multi - only
  // special-casing needed is excluding a .cycle-alt-branch's own steps
  // (see isAltBranch above).
  function getSteps(unit) {
    return Array.prototype.slice
      .call(unit.querySelectorAll(".skill"))
      .filter(function (s) { return !isAltBranch(s); });
  }

  function toggleLabel(idx, total) {
    return (idx + 1) + " / " + total + " · Exit";
  }

  function updateHighlight(unit) {
    var steps = getSteps(unit);
    var idx = parseInt(unit.dataset.practiceIndex || "0", 10);
    steps.forEach(function (step, i) {
      step.classList.toggle("practice-current", i === idx);
    });
    if (unit._practiceToggle) {
      unit._practiceToggle.textContent = toggleLabel(idx, steps.length);
    }
  }

  function enterPractice(unit) {
    if (activeLine && activeLine !== unit) exitPractice(activeLine);
    unit.classList.add("practice-mode");
    getLines(unit).forEach(function (l) { l.classList.add("practice-mode"); });
    unit.dataset.practiceIndex = "0";
    activeLine = unit;
    updateHighlight(unit);
  }

  function exitPractice(unit) {
    unit.classList.remove("practice-mode");
    getLines(unit).forEach(function (l) { l.classList.remove("practice-mode"); });
    getSteps(unit).forEach(function (step) {
      step.classList.remove("practice-current");
    });
    if (unit._practiceToggle) unit._practiceToggle.textContent = "▶ Practice";
    if (activeLine === unit) activeLine = null;
  }

  function advance(unit) {
    var steps = getSteps(unit);
    if (!steps.length) return;
    var idx = parseInt(unit.dataset.practiceIndex || "0", 10);
    idx = (idx + 1) % steps.length;
    unit.dataset.practiceIndex = String(idx);
    updateHighlight(unit);
  }

  function wireRotationLine(line) {
    if (line._practiceToggle) return; // already wired
    // A line inside a .cycle-card-multi is wired as part of the shared
    // card-level toggle instead (see wireMultiCard below) - it must NOT
    // also get its own individual toggle, or the pair would show two
    // "Practice" buttons for what's really one combined drill.
    if (line.closest(".cycle-card-multi")) return;
    var steps = getSteps(line);
    if (steps.length < 2) return;

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "rotation-practice-toggle";
    toggle.textContent = "▶ Practice";
    toggle.setAttribute("aria-label", "Practice this rotation step by step");
    line._practiceToggle = toggle;

    var card = line.closest(".cycle-card");
    var header = card && card.querySelector(".cycle-card-header");
    if (header && !header.querySelector(".rotation-practice-toggle")) {
      // Nested in a cycle-card: join the header row, no floating badge.
      header.appendChild(toggle);
    } else {
      // Standalone: float the toggle over the box's own corner via a
      // zero-margin wrapper, so it costs no layout space anywhere.
      var wrap = document.createElement("div");
      wrap.className = "rotation-practice-float";
      line.parentNode.insertBefore(wrap, line);
      wrap.appendChild(line);
      wrap.appendChild(toggle);
    }

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (line.classList.contains("practice-mode")) {
        exitPractice(line);
      } else {
        enterPractice(line);
      }
    });

    line.addEventListener("click", function () {
      if (!line.classList.contains("practice-mode")) return;
      advance(line);
    });
  }

  // One shared toggle for a whole .cycle-card-multi (see the file-top
  // comment). Structurally the same as wireRotationLine's toggle setup,
  // just always joining the card's .cycle-card-header (a multi-stage card
  // is never "standalone" the way a bare rotation-line can be) and
  // listening for clicks on the whole card - the two stages are separate
  // .rotation-line elements, but a click on either one should advance the
  // same combined drill rather than needing two independent listeners
  // kept in sync.
  function wireMultiCard(card) {
    if (card._practiceToggle) return; // already wired
    var steps = getSteps(card);
    if (steps.length < 2) return;

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "rotation-practice-toggle";
    toggle.textContent = "▶ Practice";
    toggle.setAttribute("aria-label", "Practice this rotation step by step");
    card._practiceToggle = toggle;

    var header = card.querySelector(".cycle-card-header");
    if (header) header.appendChild(toggle);

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (card.classList.contains("practice-mode")) {
        exitPractice(card);
      } else {
        enterPractice(card);
      }
    });

    card.addEventListener("click", function () {
      if (!card.classList.contains("practice-mode")) return;
      advance(card);
    });
  }

  // Bound once at module scope, not per-render - this listener doesn't
  // depend on which .rotation-line container triggered a render, only on
  // whatever activeLine currently is, so there's nothing to gain from
  // rebinding it on every registerRenderer trigger (and every previous
  // guard here existed only to prevent exactly that rebinding).
  document.addEventListener("keydown", function (e) {
    if (!activeLine || !document.contains(activeLine)) return;
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    // Space/Escape belong to whatever interactive control has focus: Space
    // was being swallowed on the focused "Exit" toggle (it advanced a step
    // instead of exiting, so a keyboard user could only leave with Enter),
    // and on any other focused button, select, link or summary on the page.
    // A non-interactive target (body, a skill chip) still advances.
    var interactive = e.target.closest
      ? e.target.closest("button, a[href], select, summary, [contenteditable], [role=button]")
      : null;
    if (e.code === "Space" && interactive) return;
    // Practice only makes sense while the rotation is on screen. Scrolled
    // far away, Space went on advancing an invisible step and the page could
    // not be paged down until the user found the Exit button again.
    if (e.code === "Space") {
      var rect = activeLine.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      advance(activeLine);
    } else if (e.code === "Escape") {
      exitPractice(activeLine);
    }
  });

  // A real navigation (not a same-page DOM mutation) is what should
  // invalidate activeLine - registerRenderer's MutationObserver leg fires
  // on incidental page-local changes too, which aren't a navigation, so
  // this stays a plain document$ subscription rather than folding into
  // the registerRenderer call below.
  if (window.document$) {
    document$.subscribe(function () {
      activeLine = null; // stale reference after an instant-loading page swap
    });
  }

  // wireRotationLine() already guards itself against re-wiring a line it's
  // already wired (line._practiceToggle check), so it's a drop-in
  // renderContainer for the shared hard-load/instant-nav/mutation trigger
  // set - see site-utils.js's registerRenderer doc comment.
  window.SiteUtils.registerRenderer(".rotation-line", wireRotationLine);
  window.SiteUtils.registerRenderer(".cycle-card-multi", wireMultiCard);
})();
