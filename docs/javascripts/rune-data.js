// FORK GUIDE: DATA, but mostly class-agnostic - the Skill Rune system
// itself (Galewind/Focus/Rage/Wealth/Bleed/Poison/Vision/Purify/etc.) is
// shared by every class in the game, same as the account-wide Ark Passive
// nodes in ap-node-names.js. The only thing to touch when forking is
// TIERS_USED below (whichever tiers YOUR build pages' rune chips actually
// reference) - add an entry for any tier this file doesn't cover yet if a
// build calls for it, same "extend as needed" rule as everywhere else.
//
// SINGLE SOURCE OF TRUTH for the hover/focus/tap tooltip rune-tooltip.js
// attaches to each .rune-chip skill-setup.js renders - a lookup miss (an
// untiered rune, or a rune not listed here at all) just means the chip
// renders with no tooltip, same fail-quietly rule as every other widget
// on this site.
//
// Keyed by rune name, lowercased, matching the same "lowercase, no
// punctuation" id convention as every other lookup here (skill-names.js,
// ap-node-names.js) even though a rune has no icon file of its own to
// tie that convention to. Each entry is a flat tier -> effect text map -
// unlike ap-node-effects.js's `levels` (an open-ended 1-5 investment
// count), a rune's "level" is just which of the 4 fixed rarities it
// dropped as, so a flat lookup by that same tier string skill-setup.js
// already stamps onto the chip (data-rune-tier) is simpler than reusing
// the array-of-levels shape.
//
// Tier keys are the actual Lost Ark item-rarity names - "uncommon" and
// "rare", NOT the chip's own display colors ("green"/"blue"). An earlier
// version of this file used the color names as the tier keys themselves,
// which was a real mistake, not just a display nit: it silently
// mislabeled the rarity everywhere that string surfaced (the tooltip's
// own tier line, prose data-rune-tier spans, this file's keys) rather
// than just picking an unconventional-but-consistent internal id. Fixed
// throughout - keys here, extra.css's .rune-chip/.rune-tip-tier class
// suffixes, skill-setup.js's own schema comment, and every markdown
// page's "rune": {"tier": ...} JSON and data-rune-tier prose span all
// use uncommon/rare/epic/legendary now, matching what rune-tooltip.js's
// buildTip displays verbatim (it just capitalizes the raw tier string -
// no separate display-name map to keep in sync, which is exactly the
// trap the old green/blue naming fell into). --dbc-green/--dbc-blue in
// extra.css keep their own (color, not rarity) names - they're also
// reused for unrelated tripod-chip tier coloring - only the rune-facing
// class suffixes that pair them to a rarity changed.
//
// Four possible rarities exist (Uncommon/Rare/Epic/Legendary), but not
// every rune drops in all four: Vision is Epic/Legendary only; Rage,
// Bleed and Poison are Rare/Epic/Legendary only, no Uncommon version;
// Purify is Uncommon/Epic/Legendary only, no Rare version - only include
// the tiers that are real, don't pad missing ones with a guessed number.
//
// SOURCING: text below in "Confirmed" entries is transcribed verbatim
// from in-game tooltip screenshots (Legendary Poison/Focus/Bleed/Rage/
// Purify, Epic+Legendary Vision, Uncommon+Epic Purify) - trust these
// over anything else in this file. Entries marked "Estimated" are
// reconstructed rather than screenshotted, two different ways:
//   - Pattern-matched AND cross-checked against Maxroll's Skill Rune
//     Collection Guide (maxroll.gg/lost-ark/resources/skill-rune-
//     collection-guide) - Focus's Uncommon/Rare (10%/20%, completing the
//     10/20/30/40 step already visible from the two Confirmed entries)
//     and Rage's Rare (8%, completing the 8/12/16 step) both land
//     exactly on the number Maxroll's own tables give, so these are
//     about as trustworthy as an Estimated entry gets.
//   - Pattern-matched WITHOUT a matching Maxroll number (Bleed's Rare/
//     Epic, and all of Poison's Rare/Epic/Legendary) - Maxroll's own
//     Skill Rune System Guide states outright that "Poison functions
//     identical to Bleed and does the same damage", so Poison's ladder
//     here is mirrored 1:1 off Bleed's rather than independently
//     sourced. Bleed's own Rare/Epic (4s/5s) come from Maxroll's
//     Collection Guide too, but that page was last updated Oct 2024 and
//     its Legendary number for Bleed doesn't match this file's own
//     screenshot-Confirmed Legendary text (6s, matches; but its listed
//     Poison duration is a stale 3s with no rarity breakdown at all) -
//     treat Bleed's Rare/Epic and ALL of Poison's tiers below as the
//     least trustworthy entries in this file, most likely to need
//     correcting against a live tooltip.
// Every Estimated entry should be swapped for the real tooltip text (or
// deleted if wrong) whenever a screenshot of that exact rune+tier is
// available, same "reconcile against real reference material" standard
// ap-node-effects.js holds itself to. None of this is patch-sensitive
// the way class skills are - runes are a universal system, not itemized
// in class balance patches - but double-checking against a current
// in-game tooltip still beats trusting a wiki/guide scrape.
(function () {
  window.DB_RUNE_EFFECTS = {
    // ---- Confirmed (verbatim from screenshots) ----
    // ---- + Estimated (see SOURCING above for which tier is which) ----
    poison: {
      // Rare/Epic: Estimated, mirrored off Bleed's own ladder below (no
      // independent Poison source at all - see SOURCING) - least
      // trustworthy entries in the file, verify first if verifying any.
      rare: 'On skill hit, inflicts "Poison" on your foe for 4s.',
      epic: 'On skill hit, inflicts "Poison" on your foe for 5s.',
      legendary: 'On skill hit, inflicts "Poison" on your foe for 6s.',
    },
    bleed: {
      // Rare/Epic: Estimated from Maxroll's Collection Guide (4s/5s) -
      // see SOURCING for why these rank below Focus/Rage's Estimated
      // tiers in trustworthiness.
      rare: 'On skill hit, inflicts "Bleeding" on your foe for 4s.',
      epic: 'On skill hit, inflicts "Bleeding" on your foe for 5s.',
      legendary: 'On skill hit, inflicts "Bleeding" on your foe for 6s.',
    },
    focus: {
      legendary: "MP Consumption -40%.",
      epic: "MP Consumption -30%.",
      // Estimated, but matches Maxroll's Collection Guide numbers exactly.
      rare: "MP Consumption -20%.",
      uncommon: "MP Consumption -10%.",
    },
    rage: {
      legendary: "Chance of Atk./Move Speed +16% for 6s when skill is used.",
      epic: "Chance of Atk./Move Speed +12% for 6s when skill is used.",
      // Estimated, but matches Maxroll's Collection Guide numbers exactly.
      // No Uncommon tier - Rage only drops Rare/Epic/Legendary.
      rare: "Chance of Atk./Move Speed +8% for 6s when skill is used.",
    },
    vision: {
      // Vision only drops as Epic or Legendary - no Uncommon/Rare version
      // exists, so there are only ever these two entries to have.
      legendary: "Skill Casting Speed +10%, on skill hit, Stagger Damage +20%.",
      epic: "Skill Casting Speed +8%, on skill hit, Stagger Damage +16%.",
    },
    purify: {
      // Confirmed (screenshots) at all three - Purify drops as Uncommon,
      // Epic or Legendary, no Rare version. (An earlier version of this
      // file had only Legendary and a comment claiming Purify was
      // single-rarity - that was wrong; fixed here.)
      legendary: "80% chance to remove a debuff when skill is used.",
      epic: "70% chance to remove a debuff when skill is used.",
      uncommon: "50% chance to remove a debuff when skill is used.",
    },

    wealth: {
      legendary: "On skill hit, Specialty Meter gain +40%.",
      epic: "On skill hit, Specialty Meter gain +30%.",
      rare: "On skill hit, Specialty Meter gain +20%.",
      uncommon: "On skill hit, Specialty Meter gain +10%.",
    },
    galewind: {
      legendary: "Skill Casting Speed +14%.",
      epic: "Skill Casting Speed +12%.",
      rare: "Skill Casting Speed +8%.",
      uncommon: "Skill Casting Speed +5%.",
    },
  };
})();
