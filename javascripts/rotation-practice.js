(function () {
  var activeLine = null;
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
  function getSteps(unit) {
    return Array.prototype.slice
      .call(unit.querySelectorAll(".skill"))
      .filter(function (s) { return !isAltBranch(s); });
  }
  var PRACTICE_LABEL = "Practice this rotation step by step";
  function toggleLabel(idx, total) {
    return (idx + 1) + " / " + total;
  }
  function updateHighlight(unit) {
    var steps = getSteps(unit);
    var idx = parseInt(unit.dataset.practiceIndex || "0", 10);
    steps.forEach(function (step, i) {
      step.classList.toggle("practice-current", i === idx);
    });
    if (unit._practiceToggle) {
      unit._practiceToggle.textContent = toggleLabel(idx, steps.length);
      unit._practiceToggle.setAttribute("aria-label", "Exit practice, step " + (idx + 1) + " of " + steps.length);
      unit._practiceToggle.title = "Exit practice";
      unit._practiceToggle.classList.add("is-active");
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
    if (unit._practiceToggle) {
      unit._practiceToggle.textContent = "";
      unit._practiceToggle.setAttribute("aria-label", PRACTICE_LABEL);
      unit._practiceToggle.title = "Practice";
      unit._practiceToggle.classList.remove("is-active");
    }
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
    if (line._practiceToggle) return;
    if (line.closest(".cycle-card-multi")) return;
    var steps = getSteps(line);
    if (steps.length < 2) return;
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "rotation-practice-toggle";
    toggle.setAttribute("aria-label", PRACTICE_LABEL);
    toggle.title = "Practice";
    line._practiceToggle = toggle;
    var card = line.closest(".cycle-card");
    var header = card && card.querySelector(".cycle-card-header");
    if (header && !header.querySelector(".rotation-practice-toggle")) {
      header.appendChild(toggle);
    } else {
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
        releasePointerFocus(e, toggle);
      }
    });
    line.addEventListener("click", function () {
      if (!line.classList.contains("practice-mode")) return;
      advance(line);
    });
  }
  function wireMultiCard(card) {
    if (card._practiceToggle) return;
    var steps = getSteps(card);
    if (steps.length < 2) return;
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "rotation-practice-toggle";
    toggle.setAttribute("aria-label", PRACTICE_LABEL);
    toggle.title = "Practice";
    card._practiceToggle = toggle;
    var header = card.querySelector(".cycle-card-header");
    if (header) header.appendChild(toggle);
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (card.classList.contains("practice-mode")) {
        exitPractice(card);
      } else {
        enterPractice(card);
        releasePointerFocus(e, toggle);
      }
    });
    card.addEventListener("click", function () {
      if (!card.classList.contains("practice-mode")) return;
      advance(card);
    });
  }
  function releasePointerFocus(e, toggle) {
    if (e.detail > 0) toggle.blur();
  }
  document.addEventListener("keydown", function (e) {
    if (!activeLine || !document.contains(activeLine)) return;
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    var interactive = e.target.closest
      ? e.target.closest("button, a[href], select, summary, [contenteditable], [role=button]")
      : null;
    if (e.code === "Space" && interactive) return;
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
  if (window.document$) {
    document$.subscribe(function () {
      activeLine = null;
    });
  }
  window.SiteUtils.registerRenderer(".rotation-line", wireRotationLine);
  window.SiteUtils.registerRenderer(".cycle-card-multi", wireMultiCard);
})();
