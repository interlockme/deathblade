(function () {
  var el = window.SiteUtils.el;
  function buildTip(data) {
    var tip = el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");
    tip.appendChild(el("div", "skill-tip-title", data.term));
    tip.appendChild(el("p", "skill-tip-note", data.def));
    return tip;
  }
  function attach(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    var id = trigger.getAttribute("data-glossary-id");
    var data = id && window.DB_GLOSSARY && window.DB_GLOSSARY[id];
    if (!data) return;
    window.SkillTooltip.wireCustom(trigger, buildTip(data));
  }
  window.SiteUtils.registerRenderer(".skill-mention[data-glossary-id]", attach);
})();
