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
    if (line._practiceToggle) return;
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
      }
    });
    line.addEventListener("click", function () {
      if (!line.classList.contains("practice-mode")) return;
      advance(line);
    });
  }
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
  if (window.document$) {
    document$.subscribe(function () {
      activeLine = null;
    });
  }
  window.SiteUtils.registerRenderer(".rotation-line", wireRotationLine);
})();
