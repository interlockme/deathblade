// FORK GUIDE: DATA - Deathblade-site-specific term list, rewrite/trim for
// your own site.
//
// Flat id -> {term, def} map for plain-jargon prose mentions that AREN'T a
// skill, engraving, rune, or Ark Passive node - those already get their own
// tooltip (see skill-tooltip.js/rune-tooltip.js/ark-passive-tooltip.js and
// their own data files). This file is for the ordinary Lost Ark/site
// vocabulary a first-time reader might not know yet: Trixion, Ability
// Stone, Specialization-the-stat, and so on.
//
// `term` is only a display fallback for a mention with no name-bearing
// text of its own - nothing in this repo needs that today (every current
// mention already wraps real visible prose words), but it's kept for shape
// parity with DB_SKILL_EXTRAS' own {tags, note} entries, and so a future
// bare-icon-style trigger could use it without a data shape change here.
//
// `def` is one or two plain sentences, kept free of numbers that go stale
// on a balance patch (build-data.js/skill-data.js/etc. already carry
// those, and re-stating a number here is one more place to forget to
// update it) - EXCEPT backattack below, which is a deliberate exception;
// see that entry's own comment for why. Any other future entry needing a
// number should put it in the relevant build/essentials page's own prose
// instead of here, same as always.
//
// House style: no em-dashes (site-wide convention) - use " - " instead.
//
// EASY EDIT GUIDE: add an entry, then wrap the word/phrase anywhere in
// prose with:
//   <span class="skill-mention" data-glossary-id="id">Word</span>
// See glossary-tooltip.js for how this file gets read.
window.DB_GLOSSARY = {
  trixion: {
    term: "Trixion",
    def: "A practice sandbox room where you can freely test skills, stats, and builds against a training dummy without spending any resources.",
  },
  abilitystone: {
    term: "Ability Stone",
    def: "An equipment piece that grants Vitality and enhances the power of your equipped combat engravings.",
  },
  bracelet: {
    term: "Bracelet",
    def: "An accessory slot that rolls combat stats (Crit, Specialization, etc.) alongside special passive effects to boost your character's damage or utility.",
  },
  relicbook: {
    term: "Relic Book",
    def: "A collectible recipe that permanently boosts a specific combat engraving's power account-wide as you collect more copies.",
  },
  specializationstat: {
    term: "Specialization",
    def: "A primary combat stat that drives Deathblade's Death Orb generation rate, Surge damage, and the cooldown reduction gained from activating Death Trance.",
  },
  // Unlike every other entry here, this one keeps its numbers: back
  // attack's damage/crit bonus is a flat engine constant (not a per-skill
  // or per-build value that a balance patch tends to touch), so it's far
  // less likely to go stale than a skill coefficient or Ark Grid number
  // would be. If that ever changes, update the number here directly -
  // there's no separate "source of truth" file for it the way skill/Ark
  // Grid numbers have.
  backattack: {
    term: "Back Attack",
    def: "A positional damage (+5%) and crit (+10%) bonus gained by attacking from behind the boss.",
  },
  arkgrid: {
    term: "Ark Grid",
    def: "A late-game progression system of Order (Sun/Moon/Star) and Chaos Core slots activated by Astrogems - build names refer to the Order Core choices selected.",
  },
  arkpassive: {
    term: "Ark Passive",
    def: "A Tier 4 talent tree system (Evolution, Enlightenment, and Leap) that shape your build's behavior.",
  },
  dpsmeter: {
    term: "DPS Meter",
    def: "A third-party tool that parses local combat log data to display real-time damage, DPS, and skill performance statistics for you and your raid.",
  },
  cpm: {
    term: "CPM",
    def: "Casts Per Minute - how many times you activate your identity skill (Surge) in a minute, used to gauge rotation speed and uptime.",
  },
  tripod: {
    term: "Tripod",
    def: "A per-skill customization path (with 3 tiers of options) that alters a skill's behavior, damage, cooldown, or resource generation.",
  },
  rune: {
    term: "Rune",
    def: "A skill modifier equipped directly to an individual skill slot to grant utility effects like cast speed, stagger, or bonus meter generation.",
  },
  synergy: {
    term: "Synergy",
    def: "A party-wide buff or boss debuff applied by certain skills - identical synergies from the same class don't stack.",
  },
  counter: {
    term: "Counter",
    def: "A frontal skill hit landed while a boss glows blue, interrupting its attack pattern and stunning it.",
  },
  pushimmunity: {
    term: "Push Immunity",
    def: "Super armor that prevents knockbacks, knockups, and knockdowns - it doesn't protect against grabs, CC debuffs, or wipe mechanics.",
  },
  // BTB/FTF: each is a specific 3-skill combo (not a generic "recast
  // twice" pattern - see the build pages' own prose for how it's used in
  // a rotation), so kept as two separate entries with the exact sequence
  // rather than one shared "double cast" definition.
  btbcombo: {
    term: "BTB",
    def: "Short for the combo Blitz Rush → Turning Slash → Blitz Rush.",
  },
  ftfcombo: {
    term: "FTF",
    def: "Short for the combo Fatal Wave → Turning Slash → Fatal Wave.",
  },
};
