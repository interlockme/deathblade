(function () {
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function formatDate(iso) {
    var parts = (iso || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    var y = parts[0], m = parts[1], d = parts[2];
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return MONTHS[m - 1] + " " + d + ", " + y;
  }
  function renderCard(card) {
    var existing = card.querySelector(".last-updated-badge");
    if (existing) existing.remove();
    var formatted = formatDate(card.getAttribute("data-updated"));
    if (!formatted) return;
    var badge = document.createElement("span");
    badge.className = "last-updated-badge";
    badge.textContent = "Updated " + formatted;
    card.appendChild(badge);
  }
  window.SiteUtils.registerRenderer(".build-card[data-updated]", renderCard);
})();
