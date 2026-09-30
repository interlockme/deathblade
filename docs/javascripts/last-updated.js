// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
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
//
// OPTIONAL CHANGE NOTE:
//   Add data-update-note="Short sentence about the latest change" next to
//   data-updated and the badge becomes a tooltip trigger (same panel,
//   hover/focus/tap behavior as every other tooltip, via
//   SkillTooltip.wireCustom). Manual for the same reason as the date:
//   commit messages are written for you, and one commit that touches
//   several pages would put the same message on all of them. No note =
//   a plain badge with no tooltip. A note with no valid date renders
//   nothing (there is no badge to hang it on); scripts/check_content.py
//   flags that. Only the latest change is kept: overwrite the note when
//   the date is bumped.
//
// Must load after skill-tooltip.js (needs window.SkillTooltip.wireCustom);
// without it the badge still renders, just without the tooltip.

(function () {
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatDate(iso) {
    var parts = (iso || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    var y = parts[0], m = parts[1], d = parts[2];
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return MONTHS[m - 1] + " " + d + ", " + y;
  }

  // Same shape as glossary-tooltip.js's buildTip, so the shared
  // .skill-tip-title/.skill-tip-note rules in extra.css apply.
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
    // Idempotent: registerRenderer re-runs this on every nav/mutation, and a
    // wired badge owns a tooltip panel appended to <body>, so rebuilding an
    // unchanged badge would leave a duplicate panel behind each time.
    if (existing && existing.getAttribute("data-key") === key) return;
    if (existing) {
      var oldTip = document.getElementById(existing.getAttribute("aria-describedby") || "");
      if (oldTip) oldTip.remove();
      existing.remove(); // attributes changed: rebuild rather than trust stale text
    }

    if (!formatted) return; // malformed date - fail quietly, no badge

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

  // Was a lone document$ subscription - see site-utils.js's registerRenderer
  // doc comment for why that's not safe to assume covers every case on its
  // own. renderCard() was already idempotent (tears down its own badge
  // before rebuilding), so this is a drop-in swap.
  window.SiteUtils.registerRenderer(".build-card[data-updated]", renderCard);
})();
