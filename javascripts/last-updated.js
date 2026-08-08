// Subtle "last updated" corner tag on each build page's .build-card.
//
// MANUAL EDIT GUIDE:
//   Add (or bump) a data-updated="YYYY-MM-DD" attribute on that build's
//   .build-card div - e.g. <div class="build-card" data-updated="2026-08-07"
//   markdown>. That's the only thing to touch; this script formats it
//   ("Updated Aug 7, 2026") and positions it in the card's bottom-right
//   corner. No date attribute = no badge, so pages without one (or a
//   typo'd one) just quietly show nothing instead of breaking.
//
//   Deliberately manual, not derived from a plugin/git date: a build
//   page's real "last updated" is when its BUILD changed (rotation,
//   gems, codes), not every time a typo or a link got fixed - that's a
//   judgment call only you can make when you edit a page, not something
//   git history can infer on its own.

(function () {
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatDate(iso) {
    var parts = (iso || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    var y = parts[0], m = parts[1], d = parts[2];
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return MONTHS[m - 1] + " " + d + ", " + y;
  }

  function render() {
    document.querySelectorAll(".build-card[data-updated]").forEach(function (card) {
      var existing = card.querySelector(".last-updated-badge");
      if (existing) existing.remove(); // instant-nav re-render: rebuild rather than trust stale text

      var formatted = formatDate(card.getAttribute("data-updated"));
      if (!formatted) return; // malformed date - fail quietly, no badge

      var badge = document.createElement("span");
      badge.className = "last-updated-badge";
      badge.textContent = "Updated " + formatted;
      card.appendChild(badge);
    });
  }

  if (window.document$) {
    document$.subscribe(render);
  }
})();
