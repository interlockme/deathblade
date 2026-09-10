// FORK GUIDE: DATA - every entry here is a Deathblade skill name/id. Replace
// the whole map with your class's own skills; nothing else in this file
// needs to change.
//
// SINGLE SOURCE OF TRUTH for a skill id's display name, used by
// rotation-line.js so rotation sequences can be authored as a bare list
// of ids (e.g. "turningslash") instead of repeating "Turning Slash" and
// its icon markup by hand on every single rotation line.
//
// Keyed flatly by id, NOT split into re/surge like DB_SKILL_DATA in
// skill-data.js - several ids (turningslash, maelstrom, deathlyslash,
// surge, bladeassault, blitzrush, earthcleaver, spincutter, headhunt) are shared
// skills that mean the exact same name/icon in both families, so one
// flat map avoids maintaining two copies of the same string. Same id
// convention as everywhere else: matches icon-<id>.png in
// assets/shared/ AND the key used in skill-data.js/skill-setup JSON.
//
// Must load before rotation-line.js - see the extra_javascript order in
// mkdocs.yml.
(function () {
  window.DB_SKILL_NAMES = {
    // Remaining Energy
    voidstrike: "Void Strike",
    twinshadows: "Twin Shadows",
    soulabsorber: "Soul Absorber",
    deathsentence: "Death Sentence",
    fatalwave: "Fatal Wave",

    // Surge
    windcut: "Wind Cut",
    deathtrance: "Death Trance",
    surpriseattack: "Surprise Attack",
    breakingmoon: "Breaking Moon",
    bladedance: "Blade Dance",
    darkaxel: "Dark Axel",
    upperslash: "Upper Slash",
    fallstar: "Fallstar",

    // Shared between both families
    maelstrom: "Maelstrom",
    turningslash: "Turning Slash",
    deathlyslash: "Deathly Slash",
    surge: "Surge",
    bladeassault: "Blade Assault",
    blitzrush: "Blitz Rush",
    earthcleaver: "Earth Cleaver",
    headhunt: "Head Hunt",
    spincutter: "Spincutter",

    // Not skills (consumables - see skill-data.js's DB_SKILL_EXTRAS for
    // their tooltip text), but still shown by name wherever a
    // .skill-inline mention or skill-tooltip.js resolves them by id.
    atropine: "Atropine",
    stimulant: "Stimulant",

    // Also not skills (food items - same DB_SKILL_EXTRAS pattern as
    // above), shown by name wherever a Food Requirement pill, a bare
    // food icon, or an Engravings section food mention resolves one of
    // these by id (see skill-tooltip.js's attachFoodOption/attachBareIcon).
    striploin: "Striploin Steak Meal",
    steak: "Herb Steak Meal",
    azena: "Azena's Blessing",
    feast: "Atk/Move Speed Feast",
    vernesewine: "Vernese Wine",
    ealynsblessing: "Ealyn's Blessing",

    // Also not skills (engravings - same DB_SKILL_EXTRAS pattern again),
    // shown by name wherever an .engraving-chip/.engraving-card-name or a
    // bare .skill-mention prose reference resolves one of these by id.
    grudge: "Grudge",
    ambushmaster: "Ambush Master",
    raidcaptain: "Raid Captain",
    adrenaline: "Adrenaline",
    keenbluntweapon: "Keen Blunt Weapon",
    curseddoll: "Cursed Doll",
    massincrease: "Mass Increase",
    maxmp: "Max MP Increase",
    spiritabsorption: "Spirit Absorption",
  };
})();
