// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// rune-data.js (window.DB_RUNE_EFFECTS); no code changes needed here.
//
// Adds a hover/focus/tap tooltip to each Skill Setup card's rune chip,
// explaining what the equipped rune tier actually does - same instinct as
// ark-passive-tooltip.js for Ark Passive nodes, reusing skill-tooltip.js's
// body-fixed positioning/show-hide engine via window.SkillTooltip.wireCustom
// rather than building a second one. A rune chip used to be the one
// leftover spot on a Skill Setup card with no explanation at all (tags/
// note cover the skill itself, tripod chips show their own tier number
// plainly) - this closes that gap the same way ark-passive-tooltip.js
// closed it for Ark Passive nodes.
//
// Also attaches to bare prose mentions of a rune outside any Skill Setup
// card entirely (e.g. a Runes Quick Tip like "Use Legendary Purify on
// Head Hunt if needed") via `.skill-mention[data-rune-name]` - same
// markup/CSS as skill-tooltip.js's own `.skill-mention[data-skill-id]`
// and ark-passive-tooltip.js's `.skill-mention[data-ap-id]` bare-prose
// mentions (see those files and extra.css's "Bare prose mentions with no
// chip/icon at all" section), just keyed by data-rune-name/data-rune-tier
// instead so it never collides with either of those on the same span.
// `data-rune-tier` is optional now: when given, the tooltip shows just
// that tier same as a chip; when omitted (a mention whose tier genuinely
// varies, e.g. "the next best rune available"), it shows EVERY tier
// DB_RUNE_EFFECTS has for that rune instead of guessing one - see
// buildAllTiersTip below. Author a specific tier by hand when the prose
// states one, e.g. `<span class="skill-mention" data-rune-name="Purify"
// data-rune-tier="legendary">Legendary Purify</span>`; omit data-rune-tier
// entirely (just `data-rune-name="Galewind"`) when it doesn't.
//
// A chip whose tier has no DB_RUNE_EFFECTS entry (an untiered rune, or a
// rune not in that file at all) is left as a plain chip with no tooltip -
// fail quietly, same rule as every other widget here.
//
// Must load after skill-setup.js (needs its rendered .rune-chip[data-
// rune-name] elements), rune-data.js, and skill-tooltip.js (needs
// window.SkillTooltip.wireCustom to exist) - see the extra_javascript
// order in mkdocs.yml. Same caveat as skill-tooltip.js's own note on
// rotation-line.js load order, though: that ordering is only for
// readability, since SiteUtils.registerRenderer's MutationObserver is
// what actually catches a chip whenever it's built, regardless of script
// load order.
(function () {
  var el = window.SiteUtils.el;

  // Own "<tier>" label class rather than reusing ap-node-tooltip.js's
  // .ap-node-tip-level for the visually-similar muted-label-under-title
  // treatment - same layout idea (name, then a small label line, then
  // effect text, matching the in-game tooltip's own layout), but tinted
  // per-tier (rune-tip-tier-<tier>) to echo the chip's own green/blue/
  // epic/legendary coloring (see .rune-chip.rune-* in extra.css) rather
  // than the flat muted color a "just show the level" AP label needs.
  function buildTip(name, tier, text) {
    var tip = el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");
    tip.appendChild(el("div", "skill-tip-title", name));
    tip.appendChild(el("div", "rune-tip-tier rune-tip-tier-" + tier, tier.charAt(0).toUpperCase() + tier.slice(1)));
    tip.appendChild(el("p", "skill-tip-note", text));
    return tip;
  }

  // Canonical display order for a rune's tiers - matches the in-game
  // rarity ladder, not object key insertion order (a rune missing e.g.
  // Uncommon, like Rage, still lists Rare/Epic/Legendary in that order,
  // not whatever order rune-data.js happened to write the keys in).
  var TIER_ORDER = ["uncommon", "rare", "epic", "legendary"];

  // Fallback for a `.skill-mention[data-rune-name]` with no data-rune-tier -
  // a prose mention whose tier genuinely varies ("the next best Galewind
  // or Vision rune that's available") has no single tier to show, so this
  // lists every tier DB_RUNE_EFFECTS actually has for the rune instead of
  // guessing one. Each tier gets its own real, full-fidelity effect text
  // (not a merged/computed number) - unlike DB_SKILL_EXTRAS' hand-verified
  // engraving min-max ranges (each one cross-checked against a screenshot's
  // own summed total, see that file's own sourcing note), there's no safe
  // way to auto-merge two or three rune tiers' full sentences into one
  // number at render time when more than one number in the sentence
  // changes per tier (Focus's is a single "-10%/-20%/-30%/-40%" swap and
  // could merge cleanly, but Purify's wording doesn't change at all
  // between tiers except the leading percentage, while Vision changes TWO
  // numbers per tier) - showing each tier's real line is the only way to
  // stay accurate for all of them without special-casing which ones are
  // "safe" to squash.
  function buildAllTiersTip(name, entry) {
    var tip = el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");
    tip.appendChild(el("div", "skill-tip-title", name));
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

    if (tier) {
      var text = entry[tier];
      if (!text) return;
      window.SkillTooltip.wireCustom(trigger, buildTip(name, tier, text));
    } else {
      window.SkillTooltip.wireCustom(trigger, buildAllTiersTip(name, entry));
    }
  }

  window.SiteUtils.registerRenderer(".rune-chip[data-rune-name], .skill-mention[data-rune-name]", attachRune);
})();
