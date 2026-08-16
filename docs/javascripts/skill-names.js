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
// surge, bladeassault, blitzrush, earthcleaver, spincutter) are shared
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
    headhunt: "Head Hunt",
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
    spincutter: "Spincutter",
  };
})();
