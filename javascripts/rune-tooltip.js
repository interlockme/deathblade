(function () {
  var el = window.SiteUtils.el;
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("rune-tooltip.js");
  function buildHeader(name, tier) {
    var header = el("div", "skill-tip-header");
    var icon = document.createElement("img");
    icon.className = "skill-tip-icon skill-tip-icon-rarity-" + (tier || "neutral");
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "rune-icons/" + name.toLowerCase() + ".png");
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon, "display");
    header.appendChild(icon);
    header.appendChild(el("div", "skill-tip-title", name));
    return header;
  }
  function buildTip(name, tier, text) {
    var tip = el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");
    tip.appendChild(buildHeader(name, tier));
    tip.appendChild(el("div", "rune-tip-tier rune-tip-tier-" + tier, tier.charAt(0).toUpperCase() + tier.slice(1)));
    tip.appendChild(el("p", "skill-tip-note", text));
    return tip;
  }
  var TIER_ORDER = ["uncommon", "rare", "epic", "legendary"];
  function buildAllTiersTip(name, entry) {
    var tip = el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");
    tip.appendChild(buildHeader(name));
    TIER_ORDER.forEach(function (tier) {
      var text = entry[tier];
      if (!text) return;
      var row = el("div", "skill-tip-all-row");
      row.appendChild(el("div", "rune-tip-tier rune-tip-tier-" + tier, tier.charAt(0).toUpperCase() + tier.slice(1)));
      row.appendChild(el("p", "skill-tip-note", text));
      tip.appendChild(row);
    });
    return tip;
  }
  function attachRune(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    var name = trigger.getAttribute("data-rune-name");
    if (!name) return;
    var tier = trigger.getAttribute("data-rune-tier");
    var entry = window.DB_RUNE_EFFECTS && window.DB_RUNE_EFFECTS[name.toLowerCase()];
    if (!entry) return;
    var tip;
    if (tier) {
      var text = entry[tier];
      if (!text) return;
      tip = buildTip(name, tier, text);
    } else {
      tip = buildAllTiersTip(name, entry);
    }
    var card = trigger.closest(".skill-card");
    var wired = window.SkillTooltip.wireCustom(trigger, tip, card ? { tapToggle: false } : undefined);
    if (wired && card && !card.__runeTipToggleWired) {
      card.__runeTipToggleWired = true;
      card.addEventListener("toggle", function () {
        if (card.open) window.SkillTooltip.hide(trigger);
      });
    }
  }
  window.SiteUtils.registerRenderer(".rune-chip[data-rune-name], .skill-mention[data-rune-name]", attachRune);
})();
