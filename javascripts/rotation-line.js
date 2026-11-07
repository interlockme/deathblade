(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("rotation-line.js");
  var el = window.SiteUtils.el;
  var iconSrc = window.SiteUtils.iconSrc;
  var hideOnError = window.SiteUtils.hideOnError;
  var WRAP_ARROW_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>';
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
      span.appendChild(el("span", "cycle-num cycle-num-" + step.cycleRef, String(step.cycleRef)));
      span.appendChild(el("span", "cycle-title", step.title || ""));
    } else if (step.skills && step.skills.length) {
      span.classList.add("skill-multi");
      step.skills.forEach(function (id, i) {
        if (i > 0) span.appendChild(el("span", "skill-join", step.join || "or"));
        var part = el("span", "skill-part");
        part.setAttribute("data-skill-id", id);
        part.appendChild(buildIcon(id));
        part.appendChild(document.createTextNode(window.DB_SKILL_NAMES[id] || id));
        span.appendChild(part);
      });
    } else {
      span.appendChild(buildIcon(step.id));
      var name = step.name || window.DB_SKILL_NAMES[step.id] || step.id;
      span.appendChild(document.createTextNode(name));
      span.setAttribute("data-skill-id", step.id);
    }
    if (step.situational) {
      var tag = el("span", "skill-situational-tag");
      tag.setAttribute("aria-hidden", "true");
      span.appendChild(tag);
      var reason = typeof step.situational === "string"
        ? step.situational.replace(/\*\*(.+?)\*\*/g, "$1")
        : "Situational";
      if (step.cycleRef != null) {
        tag.title = reason;
        tag.setAttribute("aria-label", reason);
      } else {
        var prefixedReason = reason === "Situational" ? reason : "Situational - " + reason;
        if (step.skills && step.skills.length) {
          span.querySelectorAll(".skill-part").forEach(function (part) {
            part.setAttribute("data-situational-reason", prefixedReason);
          });
          tag.removeAttribute("aria-hidden");
          tag.setAttribute("data-standalone-tip", prefixedReason);
        } else {
          span.setAttribute("data-situational-reason", prefixedReason);
        }
      }
    }
    return span;
  }
  function buildArrow(swap) {
    var span = el("span", swap ? "arrow arrow-swap" : "arrow");
    span.textContent = " \u2192 ";
    if (swap) span.setAttribute("data-standalone-tip", "Order interchangeable");
    return span;
  }
  function measureWrapArrows(line) {
    var results = [];
    var kids = Array.prototype.filter.call(line.children, function (child) {
      return child.tagName !== "SCRIPT";
    });
    if (kids.length < 2) return results;
    var TOLERANCE = 2;
    for (var i = 0; i < kids.length; i++) {
      var kid = kids[i];
      if (!kid.classList.contains("arrow") || kid.classList.contains("arrow-swap")) continue;
      var next = kids[i + 1];
      results.push({
        arrow: kid,
        wraps: !!next && next.offsetTop > kid.offsetTop + TOLERANCE
      });
    }
    return results;
  }
  function applyWrapArrows(results) {
    results.forEach(function (r) {
      var kid = r.arrow;
      kid.classList.toggle("arrow-wrap", r.wraps);
      if (r.wraps) {
        kid.title = "Continues below";
        if (!kid.querySelector(".arrow-wrap-icon")) {
          var icon = el("span", "arrow-wrap-icon");
          icon.innerHTML = WRAP_ARROW_ICON;
          kid.appendChild(icon);
        }
      } else {
        if (kid.title === "Continues below") kid.removeAttribute("title");
        var existingIcon = kid.querySelector(".arrow-wrap-icon");
        if (existingIcon) existingIcon.remove();
      }
    });
  }
  function updateWrapArrows(lines) {
    var measured = Array.prototype.map.call(lines, measureWrapArrows);
    measured.forEach(applyWrapArrows);
  }
  var wrapObserver = window.ResizeObserver
    ? new ResizeObserver(function (entries) {
        updateWrapArrows(entries.map(function (entry) { return entry.target; }));
      })
    : null;
  if (wrapObserver && window.document$) {
    document$.subscribe(function () {
      wrapObserver.disconnect();
    });
  }
  if (window.document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      updateWrapArrows(document.querySelectorAll(".rotation-line"));
    });
  }
  function buildStageTag(text) {
    var span = el("span", "stage-tag", text);
    return span;
  }
  function renderLine(line) {
    var peekScript = line.querySelector("script");
    if (peekScript && line._rotationRawData === peekScript.textContent) return;
    var result = window.SiteUtils.readInlineJSON(line, "rotation-line.js");
    if (!result) return;
    var scriptEl = result.script;
    var raw = result.raw;
    var data = result.data;
    var steps = data.slice();
    var stageLabel = null;
    var first = steps[0];
    if (
      first && typeof first === "object" && !Array.isArray(first) &&
      "stageLabel" in first && !("id" in first) && !("skills" in first) && !("cycleRef" in first)
    ) {
      stageLabel = first.stageLabel;
      steps.shift();
    }
    var suffix = null;
    var last = steps[steps.length - 1];
    if (
      last && typeof last === "object" && !Array.isArray(last) &&
      "suffix" in last && !("id" in last) && !("skills" in last) && !("cycleRef" in last)
    ) {
      suffix = last.suffix;
      steps.pop();
    }
    Array.prototype.slice.call(line.children).forEach(function (child) {
      if (child !== scriptEl) child.remove();
    });
    var frag = document.createDocumentFragment();
    if (stageLabel) frag.appendChild(buildStageTag(stageLabel));
    steps.forEach(function (step, i) {
      if (i > 0) {
        var prev = steps[i - 1];
        var swap = prev && typeof prev === "object" && prev.swapNext === true;
        frag.appendChild(buildArrow(swap));
      }
      frag.appendChild(buildStep(step));
    });
    if (suffix) {
      frag.appendChild(buildArrow());
      var suffixSpan = el("span", "rotation-suffix");
      suffixSpan.textContent = suffix;
      frag.appendChild(suffixSpan);
    }
    line.appendChild(frag);
    line._rotationRawData = raw;
    if (wrapObserver) {
      wrapObserver.unobserve(line);
      wrapObserver.observe(line);
    } else {
      updateWrapArrows([line]);
    }
  }
  window.SiteUtils.registerRenderer(".rotation-line", renderLine);
})();
