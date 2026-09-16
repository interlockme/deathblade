(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("rotation-line.js");
  var el = window.SiteUtils.el;
  var iconSrc = window.SiteUtils.iconSrc;
  var hideOnError = window.SiteUtils.hideOnError;
  var appendInlineBold = window.SiteUtils.appendInlineBold;
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
    } else if (step.icons && step.icons.length) {
      step.icons.forEach(function (id, i) {
        if (i > 0) span.appendChild(document.createTextNode(" or "));
        var icon = buildIcon(id);
        icon.setAttribute("data-skill-id", id);
        span.appendChild(icon);
      });
    } else {
      span.appendChild(buildIcon(step.id));
      var name = step.name || window.DB_SKILL_NAMES[step.id] || step.id;
      span.appendChild(document.createTextNode(name));
      span.setAttribute("data-skill-id", step.id);
    }
    if (step.situational) {
      var tag = el("span", "skill-situational-tag");
      appendInlineBold(tag, typeof step.situational === "string" ? step.situational : "situational");
      span.appendChild(tag);
    }
    return span;
  }
  function buildArrow(swap) {
    var span = el("span", swap ? "arrow arrow-swap" : "arrow");
    span.textContent = " \u2192 ";
    if (swap) span.title = "Order interchangeable";
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
    var suffix = null;
    var last = steps[steps.length - 1];
    if (
      last && typeof last === "object" && !Array.isArray(last) &&
      "suffix" in last && !("id" in last) && !("icons" in last) && !("cycleRef" in last)
    ) {
      suffix = last.suffix;
      steps.pop();
    }
    Array.prototype.slice.call(line.children).forEach(function (child) {
      if (child !== scriptEl) child.remove();
    });
    var frag = document.createDocumentFragment();
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
  }
  window.SiteUtils.registerRenderer(".rotation-line", renderLine);
})();
