// FORK GUIDE: ENGINE - reusable as-is for any class/site. Renders whatever's
// in glossary-data.js (window.DB_GLOSSARY); no code changes needed here,
// just point that at your own term list.
//
// Adds the same hover/focus/tap tooltip skill-tooltip.js already gives a
// `.skill-mention[data-skill-id]` prose mention, to a separate kind of
// mention: a plain word or two that isn't a skill/engraving/rune/Ark
// Passive node at all, just ordinary Lost Ark or site jargon a first-time
// reader might not know ("Trixion", "Ability Stone", "CPM", ...). Reuses
// skill-tooltip.js's body-fixed positioning/show-hide engine via
// window.SkillTooltip.wireCustom (same panel visual language as every
// other .skill-tip caller) rather than duplicating that hover/focus/tap-
// toggle/viewport-clamping logic a third time - see ark-passive-tooltip.js
// and rune-tooltip.js for the same reuse against the same engine.
//
// Deliberately its own data attribute (data-glossary-id) rather than
// overloading data-skill-id/data-ap-id/data-rune-name - a glossary id here
// never actually collides with a real skill/node/rune id in practice, but
// keeping the attribute separate means it never COULD, even by accident,
// shadow a real lookup the way sharing one attribute namespace would risk.
// Shares the exact same `.skill-mention` class as those other prose
// mentions, though (not a new one) - same deliberately-plain-until-hovered
// visual treatment (see extra.css's own comment on that class), and
// skill-tooltip.js's own registerRenderer for `.skill-mention[data-skill-id]`
// simply never matches a span that only carries data-glossary-id, so the
// two lookups can't double-wire the same span either.
//
// EASY EDIT GUIDE: to flag a new term anywhere in prose, wrap it as
//   <span class="skill-mention" data-glossary-id="id">Word</span>
// and add an `id: { term, def }` entry to glossary-data.js. A mention
// whose id has no entry there renders as a plain word with no tooltip,
// same "fail quietly" rule as every widget on this site - so it's safe to
// mark up a word before its glossary entry exists yet.
//
// Must load after skill-tooltip.js (needs window.SkillTooltip.wireCustom
// to exist) and glossary-data.js - see the extra_javascript order in
// mkdocs.yml.
(function () {
  var el = window.SiteUtils.el;

  // Same shape as skill-tooltip.js's own buildTip (title + note, "skill-tip
  // md-typeset" wrapper so the reused .skill-tip-title/.skill-tip-note
  // rules in extra.css apply here too) - just no tags/meter/primary/extra
  // rows, since a glossary entry is only ever a term + a plain-English
  // definition, nothing structured to show alongside it.
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
