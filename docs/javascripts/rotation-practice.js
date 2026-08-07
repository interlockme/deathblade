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
  var keydownBound = false;

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

  function initRotationPractice() {
    activeLine = null; // stale reference after an instant-loading page swap
    document.querySelectorAll(".rotation-line").forEach(wireRotationLine);

    if (!keydownBound) {
      keydownBound = true;
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
    }
  }

  if (window.document$) {
    document$.subscribe(function () {
      initRotationPractice();
    });
  }
})();
