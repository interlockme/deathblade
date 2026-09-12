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
// A Skill Setup card's rune chip sits inside that card's own <summary>
// (skill-setup.js's chips row), so clicking it is ALSO how the browser
// natively expands/collapses the enclosing card - same nested-toggle
// problem gem-dps-tooltip.js has for an expandable gem row's <summary>,
// and the same fix: skip skill-tooltip.js's own tap-to-open click
// behavior for a rune chip specifically (wireCustom's opts.tapToggle:
// false below), so tapping/clicking one only ever expands the card, and
// hook the card's native `toggle` event to force-close the tooltip the
// instant it opens as a belt-and-suspenders safety net (a mouse user who
// hovers the chip then clicks without moving away first would otherwise
// still see it lingering over the card's freshly-revealed body). A bare
// `.skill-mention[data-rune-name]` prose mention is never inside a
// .skill-card at all, so it's unaffected either way - full normal tap-
// to-open behavior, same as any other skill-tooltip.js trigger.
//
// Must load after skill-setup.js (needs its rendered .rune-chip[data-
// rune-name] elements), rune-data.js, and skill-tooltip.js (needs
// window.SkillTooltip.wireCustom/.hide to exist) - see the extra_javascript
// order in mkdocs.yml. Same caveat as skill-tooltip.js's own note on
// rotation-line.js load order, though: that ordering is only for
// readability, since SiteUtils.registerRenderer's MutationObserver is
// what actually catches a chip whenever it's built, regardless of script
// load order.
(function () {
  var el = window.SiteUtils.el;
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("rune-tooltip.js");

  // EXPERIMENT: same icon+title header row as skill-tooltip.js's own
  // buildTip and ark-passive-tooltip.js's own buildHeader, reusing the
  // exact same .skill-tip-header/.skill-tip-icon CSS rather than
  // inventing rune-specific classes - a rune's icon lives under its own
  // assets/shared/rune-icons/<name>.png rather than the icon-<id>.png
  // convention everything else here follows, since a rune name can
  // collide with an unrelated icon-<id>.png that already exists for a
  // different purpose (e.g. "bleed" is also a DB_SKILL_NAMES id for the
  // Trixion DPS rune-proc row - see skill-names.js's own comment on
  // that collision - so reusing icon-bleed.png here would show the
  // wrong art). hideOnError still collapses the <img> to nothing if a
  // given rune's icon file is ever missing, same fail-quietly rule as
  // every other icon on the site.
  // `tier` (optional) fills the icon's background with that tier's own
  // rarity color (.skill-tip-icon-rarity-<tier> in extra.css, shared with
  // ark-core-badge.js's own tooltip icon - see that file's comment) so a
  // rune's real in-game rarity reads at a glance instead of the art
  // floating on the tooltip's own dark background - every rune-icons/*.png
  // is a transparent cutout with no rarity color baked in, unlike a skill
  // icon's own square frame art. buildTip below always has a single real
  // tier to pass; buildAllTiersTip's header describes every tier at once
  // (see its own comment on why those can't be merged into one), so
  // there's no single rarity to color it by - that call omits `tier`
  // entirely and gets the flat neutral fill instead, same "no single
  // answer, don't guess one" instinct as the rest of that fallback.
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
    tip.appendChild(buildHeader(name, tier));
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

    // See the file-level comment above for why a Skill Setup card's own
    // rune chip skips the tap-to-open behavior other skill-tooltip.js
    // triggers get - a bare prose mention (.skill-mention) has no
    // .skill-card ancestor, so `card` is null and it's unaffected.
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
