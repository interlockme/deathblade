// FORK GUIDE: DATA - every entry here is a Deathblade skill's tags/notes.
// Replace per-skill entries with your class's own; the re/surge split is
// this site's two build families, rename/restructure to match yours.
//
// SINGLE SOURCE OF TRUTH for the tag pills + short "what it does" note
// shown inside a skill-card's expanded body on every build page's Skill
// Setup section (see skill-setup.js, the renderer that reads this).
//
// This text is intentionally the SAME as each family's own
// "## <Family> Skills" reference table on essentials.md - if you update a
// tag or note there, update the matching entry here too so both stay in
// sync. Build-specific reasoning (why THIS build picked THIS tripod)
// stays out of here and instead lives in each build's own "picks" array
// in its Skill Setup JSON, or in the prose sections already below it.
//
// Keyed by family ("re" / "surge") then skill id - the SAME id you use
// in a Skill Setup JSON entry's "id" field, matching the icon-<id>.png
// filename convention every icon in assets/shared/ already follows.
//
// tags: array of ["dmg"|"util"|"immune"|"warn", "LABEL TEXT"] pairs,
// rendered with the site's existing .tag/.tag-dmg/.tag-util/etc classes -
// same four categories as the tag-legend on essentials.md.
(function () {
  window.DB_SKILL_DATA = {
    re: {
      maelstrom: {
        tags: [["util", "SYNERGY"], ["util", "BUFF"], ["warn", "NO PARA IMMUNE"]],
        note: "Increases orb generation and Attack/Move Speed for 6 seconds, charges up to two stacks.",
      },
      voidstrike: {
        tags: [["util", "ORB GEN"]],
        note: "Main orb generator, use under Maelstrom's effect at a short distance from the boss.",
      },
      twinshadows: {
        tags: [["util", "ORB GEN"], ["util", "RECOVERY"], ["util", "MOBILITY"]],
        note: "Multi-purpose, charges up to two stacks.",
      },
      deathlyslash: {
        tags: [["dmg", "DAMAGE"], ["util", "ORB GEN"], ["util", "MOBILITY"]],
        note: "Strongest attack per cast, available every other cycle due to its long cooldown.",
      },
      turningslash: {
        tags: [["util", "SYNERGY"], ["util", "ORB GEN"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Applies +4% outgoing and +5% directional damage synergy on hit. Activates Destiny for 333.",
      },
      fatalwave: {
        tags: [["dmg", "DAMAGE"], ["util", "ORB GEN"], ["util", "DESTINY"]],
        note: "Resets its cooldown and becomes empowered when the Destiny effect is activated.",
      },
      surge: {
        tags: [["dmg", "DAMAGE"], ["util", "MOBILITY"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Consumes orbs to grant the RE buff, Mana Recovery, and skill CDR. Activates Destiny for 111/313.",
      },
      soulabsorber: {
        tags: [["util", "ORB GEN"], ["util", "WEAK POINT"]],
        note: "Main orb generator, charge under Maelstrom's effect. You can aim its second hit for mobility.",
      },
      blitzrush: {
        tags: [["util", "ORB GEN"], ["util", "RECOVERY"]],
        note: "Flexible ranged attack.",
      },
      headhunt: {
        tags: [["util", "COUNTER"], ["util", "RECOVERY"], ["warn", "NO PARA IMMUNE"]],
        note: "Most flexible utility/recovery tool.",
      },
      bladeassault: {
        tags: [["util", "AWAKENING"], ["dmg", "DAMAGE"], ["util", "ORB GEN"], ["immune", "PUSH IMMUNE"], ["immune", "STATUS IMMUNE"]],
        note: "Hold for damage and orb generation.",
      },
      earthcleaver: {
        tags: [["util", "COUNTER"], ["util", "MOBILITY"], ["util", "WEAK POINT"], ["warn", "NO PARA IMMUNE"]],
        note: "Slow and utility focused.",
      },
      spincutter: {
        tags: [["util", "MOBILITY"]],
        note: "Can be cast up to 2 times at Lv 4.",
      },
      deathsentence: {
        tags: [["dmg", "DAMAGE"], ["util", "STAGGER"], ["util", "MOBILITY"]],
        note: "Well-rounded addition to classic builds.",
      },
    },
    surge: {
      windcut: {
        tags: [["util", "STACKS"], ["warn", "NO PARA IMMUNE"]],
        note: "Core builder, often pre-cast before Death Trance.",
      },
      deathtrance: {
        tags: [["util", "BUFF"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Identity state that grants buffs and skill CDR. Activates Destiny for \uD83E\uDD81/\uD83D\uDC06.",
      },
      maelstrom: {
        tags: [["util", "SYNERGY"], ["util", "BUFF"], ["warn", "NO PARA IMMUNE"]],
        note: "Increases Attack/Move Speed for 6 seconds, charges up to two stacks.",
      },
      surpriseattack: {
        tags: [["util", "SYNERGY"], ["util", "MOBILITY"], ["util", "WEAK POINT"]],
        note: "Core builder, applies +4% outgoing and +5% directional damage synergy on hit.",
      },
      breakingmoon: {
        tags: [["dmg", "DAMAGE"], ["util", "STACKS"], ["util", "BUFF"]],
        note: "Grants 60 stacks on hit and empowers the next Surge with +60% Critical Damage.",
      },
      surge: {
        tags: [["dmg", "DAMAGE"], ["immune", "PUSH IMMUNE"]],
        note: "Consumes 60 stacks to deal maximum damage.",
      },
      bladedance: {
        tags: [["util", "STACKS"], ["dmg", "DAMAGE"]],
        note: "Core builder, you can stop holding it about 90% of the way and still generate full stacks.",
      },
      blitzrush: {
        tags: [["dmg", "DAMAGE"]],
        note: "Filler builder for \uD83E\uDD81. On Destiny activation, resets its cooldown and becomes empowered for \uD83D\uDC2F.",
      },
      headhunt: {
        tags: [["util", "COUNTER"], ["warn", "NO PARA IMMUNE"]],
        note: "Fast utility/backup with micro-mobility.",
      },
      earthcleaver: {
        tags: [["dmg", "DAMAGE"], ["util", "COUNTER"], ["util", "MOBILITY"], ["util", "WEAK POINT"], ["warn", "NO PARA IMMUNE"]],
        note: "Slow utility filler. Charges up to two stacks for \uD83E\uDD81.",
      },
      spincutter: {
        tags: [["util", "MOBILITY"], ["util", "STACKS"]],
        note: "Backup builder that can be cast up to 3 times.",
      },
      turningslash: {
        tags: [["util", "SYNERGY"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Applies +4% outgoing and +5% directional damage synergy on hit. Activates Destiny for \uD83D\uDC2F.",
      },
      bladeassault: {
        tags: [["util", "AWAKENING"], ["dmg", "DAMAGE"], ["immune", "PUSH IMMUNE"], ["immune", "STATUS IMMUNE"]],
        note: "Hold for damage and stack generation.",
      },
      deathlyslash: {
        tags: [["dmg", "DAMAGE"], ["util", "MOBILITY"]],
        note: "Becomes empowered upon Destiny activation and subsequent normal skill use for \uD83D\uDC06.",
      },
      darkaxel: {
        tags: [["util", "MOBILITY"], ["immune", "PUSH IMMUNE"]],
        note: "Jumps over bosses to facilitate a back attack.",
      },
      upperslash: {
        tags: [["immune", "PUSH IMMUNE"]],
        note: "Core builder and utility for \uD83D\uDC06.",
      },
      fallstar: {
        tags: [["immune", "PUSH IMMUNE"]],
        note: "Surely one day this will be the meta...",
      },
    },
  };

  // SINGLE SOURCE OF TRUTH for skill-tooltip.js's fallback lookup, for the
  // couple of .skill-inline prose mentions (see extra.css's "Inline skill
  // reference for prose" section) that aren't a real skill at all -
  // Atropine and Stimulant are consumable items, so they have no tripods/
  // rune/family split to speak of and don't belong in DB_SKILL_DATA above.
  // Flat id -> note (no tags array - a tag pill would misrepresent a
  // consumable's flat effect text as a skill trait like DAMAGE/SYNERGY).
  // Keyed the same way as everywhere else: matches icon-<id>.png in
  // assets/shared/. A lookup miss here (same as a miss in DB_SKILL_DATA)
  // just means no tooltip renders - fail quietly, see skill-tooltip.js.
  // Food/consumable entries below are the single source of truth for the
  // effect text shown in three places: essentials.md's Food Requirement
  // panel (.food-option divs), Surge's "Mana Food + Maelstrom Bleed" alt
  // line (bare .food-option-icon images), and both families' Engravings
  // section food mentions (bare .skill-icon images/.engraving-chip-food
  // /.engraving-loadout-note). All of that markup used to hand-carry this
  // same text in its own `title` attribute (native tooltip, no styling,
  // easy to drift out of sync across 3+ copies) - skill-tooltip.js now
  // reads it from here instead for all of them, matching icon-<id>.png
  // the same way every other lookup on this file does. Update the text
  // here and every surface picks it up; there's no other copy left to
  // remember to update.
  window.DB_SKILL_EXTRAS = {
    atropine: {
      note: "HP -25% but Atk. Power +30% and Move/Atk. Speed +20% for 10s.",
    },
    stimulant: {
      note: "Recovers Specialty Meter by 100%.",
    },
    striploin: {
      note: "Main Stat +12,000. Vitality +8,000. Combat Resource Natural Recovery +24%.",
    },
    steak: {
      note: "Main Stat +6,000. Vitality +4,500. Combat Resource Natural Recovery +24%.",
    },
    azena: {
      note: "Main Stat +6,000. HP +12,000. Combat Resource Natural Recovery +24%.",
    },
    feast: {
      note: "Weapon Power +1,600/1,800. Atk. Speed +5%. Move Speed +5%.",
    },
    vernesewine: {
      note: "Increases Move Speed by 3%.",
    },
    ealynsblessing: {
      note: "Increases Atk. Speed by 3%.",
    },
  };
})();
