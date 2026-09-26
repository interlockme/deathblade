(function () {
  window.DB_SKILL_DATA = {
    re: {
      maelstrom: {
        tags: [["util", "SYNERGY"], ["util", "BUFF"], ["warn", "NO PARA IMMUNE"]],
        note: "Increases orb generation and Attack/Move Speed for 6 seconds, charges up to two stacks.",
        lines: ["4201 meter", "self buffed"],
      },
      voidstrike: {
        tags: [["util", "ORB GEN"]],
        note: "Main orb generator, use under Maelstrom's effect at a short distance from the boss.",
        lines: ["6314 meter"],
      },
      twinshadows: {
        tags: [["util", "ORB GEN"], ["util", "RECOVERY"], ["util", "MOBILITY"]],
        note: "Multi-purpose, charges up to two stacks.",
        lines: ["2227 meter"],
      },
      deathlyslash: {
        tags: [["dmg", "DAMAGE"], ["util", "ORB GEN"], ["util", "MOBILITY"]],
        note: "Strongest attack per cast, available every other cycle due to its long cooldown.",
        lines: ["2880 meter"],
      },
      turningslash: {
        tags: [["util", "SYNERGY"], ["util", "ORB GEN"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Applies +4% outgoing and +5% directional damage synergy on hit. Activates Destiny for 333.",
        lines: ["2228 meter"],
      },
      fatalwave: {
        tags: [["dmg", "DAMAGE"], ["util", "ORB GEN"], ["util", "DESTINY"]],
        note: "Resets its cooldown and becomes empowered when the Destiny effect is activated.",
        lines: ["2217 meter", "3879 for 313"],
      },
      surge: {
        tags: [["dmg", "DAMAGE"], ["util", "MOBILITY"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Consumes orbs to grant the RE buff, Mana Recovery, and skill CDR. Activates Destiny for 111/313.",
        lines: ["180/s OC2", "450/s OC5"],
      },
      soulabsorber: {
        tags: [["util", "ORB GEN"], ["util", "WEAK POINT"]],
        note: "Main orb generator, charge under Maelstrom's effect. You can aim its second hit for mobility.",
        lines: ["7418 meter"],
      },
      blitzrush: {
        tags: [["util", "ORB GEN"], ["util", "RECOVERY"]],
        note: "Flexible ranged attack.",
        lines: ["3156 meter"],
      },
      headhunt: {
        tags: [["util", "COUNTER"], ["util", "RECOVERY"], ["warn", "NO PARA IMMUNE"]],
        note: "Most flexible utility/recovery tool.",
        lines: ["2200 meter"],
      },
      bladeassault: {
        tags: [["util", "AWAKENING"], ["dmg", "DAMAGE"], ["util", "ORB GEN"], ["immune", "PUSH IMMUNE"], ["immune", "STATUS IMMUNE"]],
        note: "Hold for damage and orb generation.",
        lines: ["20467 meter"],
      },
      flashblink: {
        tags: [["util", "AWAKENING"], ["util", "ORB GEN"], ["immune", "PUSH IMMUNE"], ["immune", "STATUS IMMUNE"]],
        note: "Generates orbs quickly at the start of an encounter for players too cheap to use a Stimulant.",
        lines: ["20472 meter"],
      },
      earthcleaver: {
        tags: [["util", "COUNTER"], ["util", "MOBILITY"], ["util", "WEAK POINT"], ["warn", "NO PARA IMMUNE"]],
        note: "Slow and utility focused.",
        lines: ["2208 meter"],
      },
      spincutter: {
        tags: [["util", "MOBILITY"]],
        note: "Can be cast up to 2 times at Lv 4.",
        lines: ["592 meter", "per cast"],
      },
      deathsentence: {
        tags: [["dmg", "DAMAGE"], ["util", "STAGGER"], ["util", "MOBILITY"]],
        note: "Well-rounded addition to classic builds.",
        lines: ["1760 meter"],
      },
    },
    surge: {
      windcut: {
        tags: [["util", "STACKS"], ["warn", "NO PARA IMMUNE"]],
        note: "Core builder, often pre-cast before Death Trance.",
        lines: ["7-9 stacks"],
      },
      deathtrance: {
        tags: [["util", "BUFF"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Identity (Z) state that grants buffs and skill CDR. Activates Destiny for \uD83E\uDD81/\uD83D\uDC06.",
      },
      maelstrom: {
        tags: [["util", "SYNERGY"], ["util", "BUFF"], ["warn", "NO PARA IMMUNE"]],
        note: "Increases Attack/Move Speed for 6 seconds, charges up to two stacks.",
        lines: ["7 stacks"],
      },
      surpriseattack: {
        tags: [["util", "STACKS"], ["util", "SYNERGY"], ["util", "MOBILITY"], ["util", "WEAK POINT"]],
        note: "Core builder, applies +4% outgoing and +5% directional damage synergy on hit.",
        lines: ["7 stacks"],
      },
      breakingmoon: {
        tags: [["dmg", "DAMAGE"], ["util", "STACKS"], ["util", "BUFF"]],
        note: "Grants 60 stacks on hit and empowers the next Surge with +60% Critical Damage.",
        lines: ["60 stacks"],
      },
      surge: {
        tags: [["dmg", "DAMAGE"], ["immune", "PUSH IMMUNE"]],
        note: "Consumes 60 stacks to deal maximum damage.",
      },
      bladedance: {
        tags: [["util", "STACKS"], ["dmg", "DAMAGE"]],
        note: "Core builder, you can stop holding it about 90% of the way and still generate full stacks.",
        lines: ["9 stacks"],
      },
      blitzrush: {
        tags: [["dmg", "DAMAGE"]],
        note: "Filler builder for \uD83E\uDD81. On Destiny activation, resets its cooldown and becomes empowered for \uD83D\uDC2F.",
        lines: ["7 stacks", "1 for 333"],
      },
      headhunt: {
        tags: [["util", "COUNTER"], ["warn", "NO PARA IMMUNE"]],
        note: "Fast utility/backup with micro-mobility.",
        lines: ["2 stacks"],
      },
      earthcleaver: {
        tags: [["util", "COUNTER"], ["util", "MOBILITY"], ["util", "WEAK POINT"], ["warn", "NO PARA IMMUNE"]],
        note: "Slow utility filler. Charges up to two stacks for \uD83E\uDD81.",
        lines: ["2-3 stacks"],
      },
      spincutter: {
        tags: [["util", "MOBILITY"], ["util", "STACKS"]],
        note: "Backup builder that can be cast up to 3 times.",
        lines: ["2 stacks", "per cast"],
      },
      turningslash: {
        tags: [["util", "SYNERGY"], ["util", "DESTINY"], ["immune", "PUSH IMMUNE"]],
        note: "Applies +4% outgoing and +5% directional damage synergy on hit. Activates Destiny for \uD83D\uDC2F.",
        lines: ["5 stacks"],
      },
      bladeassault: {
        tags: [["util", "AWAKENING"], ["dmg", "DAMAGE"], ["immune", "PUSH IMMUNE"], ["immune", "STATUS IMMUNE"]],
        note: "Hold for damage and stack generation.",
        lines: ["20 stacks"],
      },
      flashblink: {
        tags: [["util", "AWAKENING"], ["util", "ORB GEN"], ["immune", "PUSH IMMUNE"], ["immune", "STATUS IMMUNE"]],
        note: "Generates orbs quickly at the start of an encounter for players too cheap to use a Stimulant.",
        lines: ["20472 meter", "3 stacks"],
      },
      deathlyslash: {
        tags: [["dmg", "DAMAGE"], ["util", "STACKS"], ["util", "MOBILITY"]],
        note: "Becomes empowered upon Destiny activation and subsequent normal skill use for \uD83D\uDC06.",
        lines: ["11-12 stacks"],
      },
      darkaxel: {
        tags: [["util", "MOBILITY"], ["immune", "PUSH IMMUNE"]],
        note: "Leap forward and directly over bosses to facilitate a back attack.",
        lines: ["2-3 stacks"],
      },
      upperslash: {
        tags: [["immune", "PUSH IMMUNE"]],
        note: "Core builder and utility for \uD83D\uDC06.",
        lines: ["5 stacks"],
      },
      fallstar: {
        tags: [["immune", "PUSH IMMUNE"]],
        note: "Surely one day this will be the meta...",
        lines: ["8 stacks"],
      },
    },
  };
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
    grudge: {
      note: "Damage +15-27% to Boss/Raid monsters. Incoming Damage +20%.",
    },
    ambushmaster: {
      note: "Outgoing Damage +4-13%. Back Attack Damage +12-15%.",
    },
    raidcaptain: {
      note: "Outgoing Damage +32-63% of Move Speed bonus percentage.",
    },
    adrenaline: {
      note: "Atk. Power +0.9-1.85% per stack (up to 6 stacks). Crit Rate +8-20% at max stacks.",
    },
    keenbluntweapon: {
      note: "Crit Damage +36-67%, but attacks have a chance to deal -20% Damage.",
    },
    curseddoll: {
      note: "Outgoing Damage +11-23%. Recovery -25%.",
    },
    massincrease: {
      note: "Atk. Speed -10%. Outgoing Damage +13-25%.",
    },
    maxmp: {
      note: "Max MP +24-40%.",
    },
    spiritabsorption: {
      note: "Atk. and Move Speed +10-22%.",
    },
  };
})();
