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
// Only one rotation-line is "active" (spacebar-listening) at a time -
// starting practice on a new line automatically exits the previous one.

(function () {
  var activeLine = null;

  function getSteps(line) {
    return line.querySelectorAll(".skill");
  }

  function toggleLabel(idx, total) {
    return (idx + 1) + " / " + total + " · Exit";
  }

  function updateHighlight(line) {
    var steps = getSteps(line);
    var idx = parseInt(line.dataset.practiceIndex || "0", 10);
    steps.forEach(function (step, i) {
      step.classList.toggle("practice-current", i === idx);
    });
    if (line._practiceToggle) {
      line._practiceToggle.textContent = toggleLabel(idx, steps.length);
    }
  }

  function enterPractice(line) {
    if (activeLine && activeLine !== line) exitPractice(activeLine);
    line.classList.add("practice-mode");
    line.dataset.practiceIndex = "0";
    activeLine = line;
    updateHighlight(line);
  }

  function exitPractice(line) {
    line.classList.remove("practice-mode");
    getSteps(line).forEach(function (step) {
      step.classList.remove("practice-current");
    });
    if (line._practiceToggle) line._practiceToggle.textContent = "▶ Practice";
    if (activeLine === line) activeLine = null;
  }

  function advance(line) {
    var steps = getSteps(line);
    if (!steps.length) return;
    var idx = parseInt(line.dataset.practiceIndex || "0", 10);
    idx = (idx + 1) % steps.length;
    line.dataset.practiceIndex = String(idx);
    updateHighlight(line);
  }

  function wireRotationLine(line) {
    if (line._practiceToggle) return; // already wired
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

  // Bound once at module scope, not per-render - this listener doesn't
  // depend on which .rotation-line container triggered a render, only on
  // whatever activeLine currently is, so there's nothing to gain from
  // rebinding it on every registerRenderer trigger (and every previous
  // guard here existed only to prevent exactly that rebinding).
  document.addEventListener("keydown", function (e) {
    if (!activeLine || !document.contains(activeLine)) return;
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
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
})();
