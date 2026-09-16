(function () {
  var el = window.SiteUtils.el;
  var tipByTrigger = new WeakMap();
  function buildTip(text) {
    var tip = el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");
    tip.appendChild(el("p", "skill-tip-note", text));
    return tip;
  }
  function attach(trigger) {
    var text = trigger.getAttribute("title");
    if (trigger.classList.contains("skill-tip-wired")) {
      if (text) {
        var tip = tipByTrigger.get(trigger);
        if (tip) tip.querySelector(".skill-tip-note").textContent = text;
        trigger.removeAttribute("title");
      }
      return;
    }
    if (!text) return;
    var tip = buildTip(text);
    tipByTrigger.set(trigger, tip);
    var wrapsControl = trigger.tagName === "LABEL" && !!trigger.querySelector("input, select, textarea");
    window.SkillTooltip.wireCustom(trigger, tip, wrapsControl ? { tapToggle: false, wrapsControl: true } : undefined);
    trigger.removeAttribute("title");
  }
  window.SiteUtils.registerRenderer(".ap-calc [title], .cpm-calc [title], .bid-calc [title]", attach);
  function watchTitleUpdates() {
    if (!window.MutationObserver) return;
    ["ap-calc", "cpm-calc", "bid-calc"].forEach(function (cls) {
      var root = document.querySelector("." + cls);
      if (!root) return;
      new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.attributeName === "title" && m.target.getAttribute("title")) {
            attach(m.target);
          }
        });
      }).observe(root, { attributes: true, attributeFilter: ["title"], subtree: true });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchTitleUpdates);
  } else {
    watchTitleUpdates();
  }
})();
