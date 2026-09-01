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
        note: "Increases orb generation and Attack/Move Speed, charges up to two stacks.",
      },
      voidstrike: {
        tags: [["util", "ORB GEN"]],
        note: "Main orb generator, use under Maelstrom's effect at a short distance from the boss.",
      },
      twinshadows: {
        tags: [["util", "ORB GEN"], ["util", "RECOVERY"], ["util", "MOBILITY"]],
        note: "Multi-purpose skill that charges up to two stacks.",
      },
      deathlyslash: {
        tags: [["dmg", "DAMAGE"], ["util", "ORB GEN"], ["util", "MOBILITY"]],
        note: "Strongest attack per cast, available every other cycle due to its long cooldown.",
      },
      turningslash: {
        tags: [["util", "SYNERGY"], ["util", "ORB GEN"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Applies +4% outgoing and +5% directional damage synergy on hit.",
      },
      fatalwave: {
        tags: [["dmg", "DAMAGE"], ["util", "ORB GEN"], ["util", "DESTINY"]],
        note: "Resets and becomes empowered when the Destiny effect is activated.",
      },
      surge: {
        tags: [["dmg", "DAMAGE"], ["util", "MOBILITY"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Consumes orbs to grant the RE buff, Mana Recovery, and skill CDR.",
      },
      soulabsorber: {
        tags: [["util", "ORB GEN"], ["util", "WEAK POINT"]],
        note: "Main orb generator, charge under Maelstrom's effect. You can aim its second hit for mobility.",
      },
      blitzrush: {
        tags: [["util", "ORB GEN"], ["util", "RECOVERY"]],
        note: "Flexible ranged skill.",
      },
      headhunt: {
        tags: [["util", "COUNTER"], ["util", "RECOVERY"], ["warn", "NO PARA IMMUNE"]],
        note: "Most flexible recovery skill.",
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
        note: "Can be cast up to 2 times at lv 4.",
      },
      deathsentence: {
        tags: [["dmg", "DAMAGE"], ["util", "STAGGER"], ["util", "MOBILITY"]],
        note: "Well-rounded addition to some builds.",
      },
    },
    surge: {
      windcut: {
        tags: [["util", "STACKS"], ["warn", "NO PARA IMMUNE"]],
        note: "Usually pre-cast before Death Trance.",
      },
      deathtrance: {
        tags: [["util", "BUFF"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Grants buffs and skill CDR.",
      },
      maelstrom: {
        tags: [["util", "SYNERGY"], ["util", "BUFF"], ["warn", "NO PARA IMMUNE"]],
        note: "Increases Attack/Move Speed, charges up to two stacks.",
      },
      surpriseattack: {
        tags: [["util", "SYNERGY"], ["util", "MOBILITY"], ["util", "WEAK POINT"]],
        note: "Applies +4% outgoing and +5% directional damage synergy on hit.",
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
        note: "You can stop holding it about 90% of the way and still generate full stacks.",
      },
      blitzrush: {
        tags: [["dmg", "DAMAGE"]],
        note: "Filler that's also a skill reset and core skill for \uD83D\uDC2F.",
      },
      headhunt: {
        tags: [["util", "COUNTER"], ["warn", "NO PARA IMMUNE"]],
        note: "Fast counter with micro-mobility.",
      },
      earthcleaver: {
        tags: [["dmg", "DAMAGE"], ["util", "COUNTER"], ["util", "MOBILITY"], ["util", "WEAK POINT"], ["warn", "NO PARA IMMUNE"]],
        note: "Charges up to two stacks for \uD83E\uDD81.",
      },
      spincutter: {
        tags: [["util", "MOBILITY"], ["util", "STACKS"]],
        note: "Can be cast up to 3 times, backup stack builder.",
      },
      turningslash: {
        tags: [["util", "SYNERGY"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Applies +4% outgoing and +5% directional damage synergy on hit, destiny activator for \uD83D\uDC2F.",
      },
      bladeassault: {
        tags: [["util", "AWAKENING"], ["dmg", "DAMAGE"], ["immune", "PUSH IMMUNE"], ["immune", "STATUS IMMUNE"]],
        note: "Hold for damage and stack generation.",
      },
      deathlyslash: {
        tags: [["dmg", "DAMAGE"], ["util", "MOBILITY"]],
        note: "Empowered core skill for \uD83D\uDC06.",
      },
      darkaxel: {
        tags: [["util", "MOBILITY"], ["immune", "PUSH IMMUNE"]],
        note: "Jumps over bosses to ensure a back attack.",
      },
      upperslash: {
        tags: [["immune", "PUSH IMMUNE"]],
        note: "Core utility skill for \uD83D\uDC06.",
      },
      fallstar: {
        tags: [["immune", "PUSH IMMUNE"]],
        note: "Surely one day this will be the meta...",
      },
    },
  };
})();
