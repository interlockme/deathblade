// FORK GUIDE: DATA - every entry here is one Order Core's full in-game
// "Core Option" tooltip text (10P/14P/17P/18P/19P/20P), Relic-grade values.
// Replace with your own class's cores if forking; keyed by the exact
// core `label` string used in a build page's ark-cores JSON (see
// ark-core-badge.js) - NOT by the "sun"/"moon"/"star" slot, since a
// label is unique across the whole site (every core has its own in-game
// name) and the same label can appear in more than one build's JSON.
//
// SINGLE SOURCE OF TRUTH for the hover tooltip ark-core-badge.js attaches
// to each Ark Grid core card - a lookup miss just means the card renders
// with no tooltip (fails quietly, same rule as every other widget here).
//
// Relic only, matching the in-game reference screenshots this was
// transcribed from - Ancient-grade values run higher on every
// percentage line but aren't tracked here.
//
// Optional per-entry fields:
//   note - short caveat shown at the bottom of the tooltip, e.g.
//          flagging a placeholder core for a not-yet-released
//          replacement.
//   tier - rarity grade for the tooltip's icon fill + "Core Options"
//          label color (skill-tip-icon-rarity-<tier> / ark-core-tip-
//          subtitle-<tier> in extra.css). Defaults to "relic" when
//          omitted (every entry below is Relic-grade), so this only
//          needs setting for a future non-Relic core.
//
// All option text below is the Global (NA) tooltip text, written as-is
// with no region tags.
(function () {
  window.DB_CORE_OPTIONS = {
    "Levin Slash": {
      options: [
        { bp: "10P", text: "Normal Skill Damage +2.0%." },
        { bp: "14P", text: "On Destiny activation, next Fatal Wave Damage +40.0% for 1 time(s)." },
        { bp: "17P", text: "Activating Destiny resets the cooldown of Fatal Wave." },
        { bp: "18P", text: "Normal Skill Damage +0.2%." },
        { bp: "19P", text: "Normal Skill Damage +0.2%." },
        { bp: "20P", text: "Normal Skill Damage +0.2%." },
      ],
    },
    "Deathblade Wave": {
      options: [
        { bp: "10P", text: "Normal Skill Damage +2.0%." },
        { bp: "14P", text: "Using Turning Slash activates Destiny." },
        { bp: "17P", text: "Fatal Wave cooldown -4.0s. Damage +16.0%. MP Cost -50%." },
        { bp: "18P", text: "Normal Skill Damage +0.2%." },
        { bp: "19P", text: "Normal Skill Damage +0.2%." },
        { bp: "20P", text: "Normal Skill Damage +0.2%." },
      ],
    },
    "Death Sword Energy": {
      options: [
        { bp: "10P", text: "Fatal Wave Damage +8.0%. During Fatal Wave use, gain Paralysis Immunity." },
        { bp: "14P", text: "Fatal Wave Casting Speed +30.0%. Damage +14.0%." },
        { bp: "17P", text: "With Death Wave, Fatal Wave Damage +20.0%." },
        { bp: "18P", text: "Fatal Wave Damage +0.6%." },
        { bp: "19P", text: "Fatal Wave Damage +0.6%." },
        { bp: "20P", text: "Fatal Wave Damage +0.6%." },
      ],
    },
    "Arts Core": {
      options: [
        { bp: "10P", text: "Damage to foes +1.5%." },
        { bp: "14P", text: "Using Deathblade Surge activates Destiny." },
        { bp: "17P", text: "Casting Speed of Twin Shadows, Turning Slash, and Death Sentence +15.0%. Normal Skill Damage +5.0%." },
        { bp: "18P", text: "Damage to foes +0.15%." },
        { bp: "19P", text: "Damage to foes +0.15%." },
        { bp: "20P", text: "Damage to foes +0.15%." },
      ],
    },
    "Art Master": {
      options: [
        { bp: "10P", text: "Damage to foes +1.5%." },
        { bp: "14P", text: "On Destiny activation, Damage to foes +5.0% for 15.0s." },
        { bp: "17P", text: "On Destiny activation, Damage of next Twin Shadows, Turning Slash, and Death Sentence +16.0% for 3 time(s)." },
        { bp: "18P", text: "Damage to foes +0.15%." },
        { bp: "19P", text: "Damage to foes +0.15%." },
        { bp: "20P", text: "Damage to foes +0.15%." },
      ],
    },
    "Basics": {
      options: [
        { bp: "10P", text: "Damage to foes +1.0%." },
        { bp: "14P", text: "Death Sentence Damage +15.0%." },
        { bp: "17P", text: "Turning Slash Damage +20.0%." },
        { bp: "18P", text: "Damage to foes +0.15%." },
        { bp: "19P", text: "Damage to foes +0.15%." },
        { bp: "20P", text: "Damage to foes +0.15%." },
      ],
    },
    "Deathblade Surge": {
      options: [
        { bp: "10P", text: "Deathblade Surge Damage +2.5%." },
        { bp: "14P", text: "On Destiny activation, Damage to foes +5.0% for 30.0s." },
        { bp: "17P", text: "On Destiny activation, next Deathblade Surge Damage +6.0% for 1 time(s)." },
        { bp: "18P", text: "Deathblade Surge Damage +0.25%." },
        { bp: "19P", text: "Deathblade Surge Damage +0.25%." },
        { bp: "20P", text: "Deathblade Surge Damage +0.25%." },
      ],
    },
    "Surge Core": {
      options: [
        { bp: "10P", text: "Deathblade Surge Damage +2.5%." },
        { bp: "14P", text: "Using Death Trance activates Destiny." },
        { bp: "17P", text: "Damage to foes +4.0%. Earth Cleaver becomes stackable up to 2 times." },
        { bp: "18P", text: "Deathblade Surge Damage +0.25%." },
        { bp: "19P", text: "Deathblade Surge Damage +0.25%." },
        { bp: "20P", text: "Deathblade Surge Damage +0.25%." },
      ],
    },
    "Strike": {
      options: [
        { bp: "10P", text: "Deathblade Surge Damage +1.5%." },
        { bp: "14P", text: "Breaking Moon Damage +30.0%." },
        { bp: "17P", text: "Damage to foes +1.0%. Deathblade Surge Damage +2.0%." },
        { bp: "18P", text: "Deathblade Surge Damage +0.25%." },
        { bp: "19P", text: "Deathblade Surge Damage +0.25%." },
        { bp: "20P", text: "Deathblade Surge Damage +0.25%." },
      ],
    },
    "Swift Resolution": {
      options: [
        { bp: "10P", text: "Deathly Slash cooldown -2.0s." },
        { bp: "14P", text: "With Quick Prep, Blade Dance Damage +90.0%. Cooldown +6.0s." },
        { bp: "17P", text: "Deathly Slash Damage +15.0%." },
        { bp: "18P", text: "Normal Skill Damage +0.3%." },
        { bp: "19P", text: "Normal Skill Damage +0.3%." },
        { bp: "20P", text: "Normal Skill Damage +0.3%." },
      ],
    },
    "Deathblade Rush": {
      options: [
        { bp: "10P", text: "Damage to foes +1.5%." },
        { bp: "14P", text: "Activating Destiny resets the cooldown of Blitz Rush." },
        { bp: "17P", text: "On Destiny activation, next Blitz Rush Damage +26.0% for 1 time(s)." },
        { bp: "18P", text: "Blitz Rush Damage +0.6%." },
        { bp: "19P", text: "Blitz Rush Damage +0.6%." },
        { bp: "20P", text: "Blitz Rush Damage +0.6%." },
      ],
    },
    "Death Blitz": {
      options: [
        { bp: "10P", text: "Damage to foes +1.5%." },
        { bp: "14P", text: "Using Turning Slash activates Destiny." },
        { bp: "17P", text: "Blitz Rush Casting Speed +20.0%. Damage +16.0%. MP Cost -50%." },
        { bp: "18P", text: "Blitz Rush Damage +0.6%." },
        { bp: "19P", text: "Blitz Rush Damage +0.6%." },
        { bp: "20P", text: "Blitz Rush Damage +0.6%." },
      ],
    },
    "Frostfire Blade": {
      options: [
        { bp: "10P", text: "Damage to foes +1.0%." },
        { bp: "14P", text: "Blitz Rush Damage +7.0%." },
        { bp: "17P", text: "With All-round, Blitz Rush Damage +100.0%." },
        { bp: "18P", text: "Blitz Rush Damage +0.6%." },
        { bp: "19P", text: "Blitz Rush Damage +0.6%." },
        { bp: "20P", text: "Blitz Rush Damage +0.6%." },
      ],
    },
    "Slaughter Spectacle": {
      options: [
        { bp: "10P", text: "Normal Skill Damage +3.0%." },
        { bp: "14P", text: "On Destiny activation, gain the Destiny: Slaughter Spectacle effect. Destiny: Slaughter Spectacle: On Deathly Slash use, consume the Destiny: Slaughter Spectacle effect. Damage +30.0%." },
        { bp: "17P", text: "While Destiny: Slaughter Spectacle is active, using a Normal Skill other than Deathly Slash grants the Destiny: Enhanced Sharpness effect, stackable up to 5 times. Destiny: Enhanced Sharpness: On Deathly Slash use, consume the Destiny: Enhanced Sharpness effect. Damage +4.0% per stack." },
        { bp: "18P", text: "Normal Skill Damage +0.3%." },
        { bp: "19P", text: "Normal Skill Damage +0.3%." },
        { bp: "20P", text: "Normal Skill Damage +0.3%." },
      ],
    },
    "Twin Swords Dance": {
      options: [
        { bp: "10P", text: "Normal Skill Damage +3.0%." },
        { bp: "14P", text: "Using Death Trance activates Destiny." },
        { bp: "17P", text: "Casting Speed of Blade Dance and Deathly Slash +10.0%. Damage +12.0%." },
        { bp: "18P", text: "Normal Skill Damage +0.3%." },
        { bp: "19P", text: "Normal Skill Damage +0.3%." },
        { bp: "20P", text: "Normal Skill Damage +0.3%." },
      ],
    },
  };
})();
