(function () {
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function formatDate(iso) {
    var parts = (iso || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    var y = parts[0], m = parts[1], d = parts[2];
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return MONTHS[m - 1] + " " + d + ", " + y;
  }
  function buildTip(note) {
    var tip = window.SiteUtils.el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");
    tip.appendChild(window.SiteUtils.el("div", "skill-tip-title", "Latest change"));
    tip.appendChild(window.SiteUtils.el("p", "skill-tip-note", note));
    return tip;
  }
  function renderCard(card) {
    var formatted = formatDate(card.getAttribute("data-updated"));
    var note = (card.getAttribute("data-update-note") || "").trim();
    var key = formatted ? formatted + "|" + note : "";
    var existing = card.querySelector(".last-updated-badge");
    if (existing && existing.getAttribute("data-key") === key) return;
    if (existing) {
      var oldTip = document.getElementById(existing.getAttribute("aria-describedby") || "");
      if (oldTip) oldTip.remove();
      existing.remove();
    }
    if (!formatted) return;
    var badge = document.createElement("span");
    badge.className = "last-updated-badge";
    badge.setAttribute("data-key", key);
    badge.textContent = "Updated " + formatted;
    card.appendChild(badge);
    if (note && window.SkillTooltip && window.SkillTooltip.wireCustom) {
      badge.classList.add("has-note");
      window.SkillTooltip.wireCustom(badge, buildTip(note));
    }
  }
  window.SiteUtils.registerRenderer(".build-card[data-updated]", renderCard);
})();
