(function () {
  window.DB_AP_NODE_EFFECTS = {
    crit: { perPoint: 50 },
    specialization: { perPoint: 50 },
    illicitspell: {
      levels: [
        {
          level: 1,
          text: "Evolution-Type Damage +5%. MP-consuming Skills' Evolution-Type Damage +5%. MP Cost -6%.",
        },
        {
          level: 2,
          text: "Evolution-Type Damage +10%. MP-consuming Skills' Evolution-Type Damage +10%. MP Cost -12%.",
        },
      ],
    },
    optimizedtraining: {
      levels: [
        {
          level: 1,
          text: "Skill Cooldowns (excluding Awakening, Movement, and Stand Up Skills) -4%. Evolution-Type Damage +5%.",
        },
        {
          level: 2,
          text: "Skill Cooldowns (excluding Awakening, Movement, and Stand Up Skills) -8%. Evolution-Type Damage +10%.",
        },
      ],
    },
    goddessofblessings: {
      perPoint: 3,
      template:
        "Apply Combat Blessing (duration 20s, refreshes every 1s) to all nearby party members during combat. " +
        "Combat Blessing: Atk. and Move Speed +{value}%.",
    },
    keensense: {
      levels: [
        { level: 1, text: "Crit Rate +4%. Evolution-Type Damage +5%." },
        { level: 2, text: "Crit Rate +8%. Evolution-Type Damage +10%." },
      ],
    },
    limitbreakevo: {
      levels: [
        { level: 1, text: "Evolution-Type Damage +10%." },
        { level: 2, text: "Evolution-Type Damage +20%." },
        { level: 3, text: "Evolution-Type Damage +30%." },
      ],
    },
    strike: {
      levels: [
        { level: 1, text: "Crit Rate +10%. Directional Attack Skills' Crit Damage +16%." },
        { level: 2, text: "Crit Rate +20%. Directional Attack Skills' Crit Damage +32%." },
      ],
    },
    master: {
      text:
        "Incoming Damage -4%. On skill use (excluding Movement Skills and Stand Up), gain the Master effect for 10s: " +
        "Crit Rate +1.4%, Additional Damage +1.7%, up to 5 stacks.",
    },
    pulverize: { text: "Evolution-Type Damage +20%. Incoming Damage -4%." },
    critical: { text: "On Crit Hit, Damage +12%. Incoming Damage -4%." },
    standingstriker: {
      levels: [
        {
          level: 1,
          text:
            "Evolution-Type Damage +6%. Brand Power +4%. After combat start, gain max (6) stacks of Standing Strike. " +
            "Lose 3 stacks when Pushed, regain 1 every 2s. Per stack: Evolution-Type Damage +0.75%, Brand Power +1%.",
        },
        {
          level: 2,
          text:
            "Evolution-Type Damage +12%. Brand Power +8%. After combat start, gain max (6) stacks of Standing Strike. " +
            "Lose 3 stacks when Pushed, regain 1 every 2s. Per stack: Evolution-Type Damage +1.5%, Brand Power +2%.",
        },
      ],
    },
    swiftstrike: {
      text:
        "Deathblade Surge skill Damage -30%. When Death Trance activates, Death Orbs are immediately consumed to " +
        "activate Deathblade Surge. Enhanced Surge activates if enough Death Orbs are consumed.",
      note: "Cannot be obtained together with Surge Enhancement.",
    },
    surgeenhancement: {
      text: "On using Deathblade Surge, the highest level of Death Surge activates regardless of the current number of Death Orbs.",
      note: "Cannot be obtained together with Swift Strike.",
    },
    remainingenergy: {
      levels: [
        { level: 1, text: "On using Deathblade Surge, Atk. Speed and Move Speed +6% for 30s." },
        { level: 2, text: "On using Deathblade Surge, Atk. Speed and Move Speed +9% for 30s." },
        { level: 3, text: "On using Deathblade Surge, Atk. Speed and Move Speed +12% for 30s." },
      ],
      note: "Requires Swift Strike Lv.1.",
    },
    firmwill: {
      levels: [
        { level: 1, text: "On using Deathblade Surge, Atk. Power +8%/16%/24% for 30s according to the number of Orbs consumed." },
        { level: 2, text: "On using Deathblade Surge, Atk. Power +11%/22%/33% for 30s according to the number of Orbs consumed." },
        { level: 3, text: "On using Deathblade Surge, Atk. Power +14%/28%/42% for 30s according to the number of Orbs consumed." },
      ],
      note: "Requires Remaining Energy Lv.3.",
    },
    swordcraftenhancement: {
      levels: [
        { level: 1, text: "Normal Skill Damage +1.2%." },
        { level: 2, text: "Normal Skill Damage +2.4%." },
        { level: 3, text: "Normal Skill Damage +3.6%." },
        { level: 4, text: "Normal Skill Damage +4.8%." },
        { level: 5, text: "Normal Skill Damage +6.0%." },
      ],
    },
    extremebodymovement: {
      levels: [
        {
          level: 1,
          text:
            "All Damage to foes +7%. Deathblade Surge changes to a slashing attack that moves to the target location. " +
            "All hits count as Back Attacks. Ignores collision with adventurers and Guardian Monsters while moving.",
        },
        {
          level: 2,
          text:
            "All Damage to foes +14%. Deathblade Surge changes to a slashing attack that moves to the target location. " +
            "All hits count as Back Attacks. Ignores collision with adventurers and Guardian Monsters while moving.",
        },
        {
          level: 3,
          text:
            "All Damage to foes +21%. Deathblade Surge changes to a slashing attack that moves to the target location. " +
            "All hits count as Back Attacks. Ignores collision with adventurers and Guardian Monsters while moving.",
        },
      ],
      note: "Requires Firm Will Lv.3.",
    },
    orbcompression: {
      levels: [
        {
          level: 1,
          text:
            "On entering Death Trance, Surge Enhancement stacks up to 60 times per skill hit (excluding Basic Attacks). " +
            "Surge Damage increases up to 25%, Surge Meter fills up to 100% according to stacks.",
        },
        {
          level: 2,
          text:
            "On entering Death Trance, Surge Enhancement stacks up to 60 times per skill hit (excluding Basic Attacks). " +
            "Surge Damage increases up to 50%, Surge Meter fills up to 100% according to stacks.",
        },
        {
          level: 3,
          text:
            "On entering Death Trance, Surge Enhancement stacks up to 60 times per skill hit (excluding Basic Attacks). " +
            "Surge Damage increases up to 80%, Surge Meter fills up to 100% according to stacks.",
        },
      ],
      note: "Requires Surge Enhancement Lv.1.",
    },
    orbcirculation: {
      levels: [
        {
          level: 1,
          text: "All Damage to foes +0.5%. After using Deathblade Surge, the Specialty Meter fills by 0.3% every 1s for 12s.",
        },
        {
          level: 2,
          text: "All Damage to foes +1.0%. After using Deathblade Surge, the Specialty Meter fills by 0.6% every 1s for 12s.",
        },
        {
          level: 3,
          text: "All Damage to foes +1.5%. After using Deathblade Surge, the Specialty Meter fills by 0.9% every 1s for 12s.",
        },
        {
          level: 4,
          text: "All Damage to foes +2.0%. After using Deathblade Surge, the Specialty Meter fills by 1.2% every 1s for 12s.",
        },
        {
          level: 5,
          text: "All Damage to foes +2.5%. After using Deathblade Surge, the Specialty Meter fills by 1.5% every 1s for 12s.",
        },
      ],
    },
    orbcontrol: {
      levels: [
        { level: 1, text: "While in Death Trance, Orb Meter is not consumed. Damage during Death Trance +1%." },
        { level: 2, text: "While in Death Trance, Orb Meter is not consumed. Damage during Death Trance +2%." },
        { level: 3, text: "While in Death Trance, Orb Meter is not consumed. Damage during Death Trance +3%." },
        { level: 4, text: "While in Death Trance, Orb Meter is not consumed. Damage during Death Trance +4%." },
        { level: 5, text: "While in Death Trance, Orb Meter is not consumed. Damage during Death Trance +5%." },
      ],
    },
    limitbreakenl: {
      levels: [
        { level: 1, text: "At 60 Surge Enhancement stacks, Deathblade Surge's Orb Compression effect Damage +70%." },
        { level: 2, text: "At 60 Surge Enhancement stacks, Deathblade Surge's Orb Compression effect Damage +95%." },
        { level: 3, text: "At 60 Surge Enhancement stacks, Deathblade Surge's Orb Compression effect Damage +120%." },
      ],
      note: "Requires Orb Compression Lv.3.",
    },
    chaosinfusion: {
      levels: [
        { level: 1, text: "When Deathblade Surge lands as a Back Attack, Outgoing Damage +2%." },
        { level: 2, text: "When Deathblade Surge lands as a Back Attack, Outgoing Damage +4%." },
        { level: 3, text: "When Deathblade Surge lands as a Back Attack, Outgoing Damage +6%." },
        { level: 4, text: "When Deathblade Surge lands as a Back Attack, Outgoing Damage +8%." },
        { level: 5, text: "When Deathblade Surge lands as a Back Attack, Outgoing Damage +10%." },
      ],
    },
    chaoticpower: {
      levels: [
        {
          level: 1,
          text:
            "Partially liberates restrained demonic energy to transform Deathblade Surge into a powerful attack " +
            "condensed with Chaos Strength, increasing Attack Range and Damage +6%. Surge Enhancement effect stacks " +
            "up to 80 times. When Death Trance ends, up to 60 Surge Enhancement stacks are consumed, while the Orb " +
            "Meter recovery effect and Surge Damage increase effect are maintained. Breaking Moon Cooldown +540s, " +
            "but hits while in Death Trance gain 60 additional Surge Enhancement stacks. Deathly Slash Cooldown " +
            "-40s, but Damage -25%.",
        },
        {
          level: 2,
          text:
            "Partially liberates restrained demonic energy to transform Deathblade Surge into a powerful attack " +
            "condensed with Chaos Strength, increasing Attack Range and Damage +23%. Surge Enhancement effect stacks " +
            "up to 80 times. When Death Trance ends, up to 60 Surge Enhancement stacks are consumed, while the Orb " +
            "Meter recovery effect and Surge Damage increase effect are maintained. Breaking Moon Cooldown +540s, " +
            "but hits while in Death Trance gain 60 additional Surge Enhancement stacks. Deathly Slash Cooldown " +
            "-40s, but Damage -25%.",
        },
        {
          level: 3,
          text:
            "Partially liberates restrained demonic energy to transform Deathblade Surge into a powerful attack " +
            "condensed with Chaos Strength, increasing Attack Range and Damage +40%. Surge Enhancement effect stacks " +
            "up to 80 times. When Death Trance ends, up to 60 Surge Enhancement stacks are consumed, while the Orb " +
            "Meter recovery effect and Surge Damage increase effect are maintained. Breaking Moon Cooldown +540s, " +
            "but hits while in Death Trance gain 60 additional Surge Enhancement stacks. Deathly Slash Cooldown " +
            "-40s, but Damage -25%.",
        },
      ],
      note: "Requires Limit Break (Enlightenment) Lv.3.",
    },
    transcendentpower: {
      levels: [
        { level: 1, text: "Hyper Awakening Skill Damage +10%." },
        { level: 2, text: "Hyper Awakening Skill Damage +20%." },
        { level: 3, text: "Hyper Awakening Skill Damage +30%." },
        { level: 4, text: "Hyper Awakening Skill Damage +40%." },
        { level: 5, text: "Hyper Awakening Skill Damage +50%." },
      ],
    },
    awakeningamplifier: {
      levels: [
        { level: 1, text: "Chance to use Awakening Skills +1." },
        { level: 2, text: "Chance to use Awakening Skills +2." },
        { level: 3, text: "Chance to use Awakening Skills +3." },
      ],
    },
    unleashedpower: {
      levels: [
        { level: 1, text: "Hyper Awakening Technique Damage +3%." },
        { level: 2, text: "Hyper Awakening Technique Damage +6%." },
        { level: 3, text: "Hyper Awakening Technique Damage +9%." },
        { level: 4, text: "Hyper Awakening Technique Damage +12%." },
        { level: 5, text: "Hyper Awakening Technique Damage +15%." },
      ],
    },
    releasepotential: {
      levels: [
        { level: 1, text: "Hyper Awakening Technique Cooldown -2%." },
        { level: 2, text: "Hyper Awakening Technique Cooldown -4%." },
        { level: 3, text: "Hyper Awakening Technique Cooldown -6%." },
        { level: 4, text: "Hyper Awakening Technique Cooldown -8%." },
        { level: 5, text: "Hyper Awakening Technique Cooldown -10%." },
      ],
    },
    instantspell: {
      levels: [
        { level: 1, text: "Hyper Awakening Technique Casting Speed +4%. MP Cost -30%." },
        { level: 2, text: "Hyper Awakening Technique Casting Speed +8%. MP Cost -60%." },
        { level: 3, text: "Hyper Awakening Technique Casting Speed +12%. MP Cost -90%." },
      ],
    },
    pathoftheblade: {
      levels: [
        {
          level: 1,
          text:
            "Breaking Moon changes to Normal Mode. After using the skill, Deathblade Surge Crit Damage +20% for 10s. " +
            "Effect is removed on using Deathblade Surge.",
        },
        {
          level: 2,
          text:
            "Breaking Moon changes to Normal Mode. After using the skill, Deathblade Surge Crit Damage +40% for 10s. " +
            "Effect is removed on using Deathblade Surge.",
        },
        {
          level: 3,
          text:
            "Breaking Moon changes to Normal Mode. After using the skill, Deathblade Surge Crit Damage +60% for 10s. " +
            "Effect is removed on using Deathblade Surge.",
        },
      ],
      note: "Cannot be obtained together with Flash Slash, Dance of Nightmares, or Dance of Screams.",
    },
    flashslash: {
      levels: [
        {
          level: 1,
          text: "Breaking Moon Damage +10%. While using the skill, Atk. Speed +10%. When overcharged, additional Damage to foes +10%.",
        },
        {
          level: 2,
          text: "Breaking Moon Damage +20%. While using the skill, Atk. Speed +10%. When overcharged, additional Damage to foes +20%.",
        },
        {
          level: 3,
          text: "Breaking Moon Damage +30%. While using the skill, Atk. Speed +10%. When overcharged, additional Damage to foes +30%.",
        },
      ],
      note: "Cannot be obtained together with Path of the Blade, Dance of Nightmares, or Dance of Screams.",
    },
    danceofnightmares: {
      levels: [
        {
          level: 1,
          text:
            "Deathly Slash Damage +25%. On skill use, dash forward and immediately execute a Finishing Blow, dealing a " +
            "total of 8 Flurry attacks.",
        },
        {
          level: 2,
          text:
            "Deathly Slash Damage +50%. On skill use, dash forward and immediately execute a Finishing Blow, dealing a " +
            "total of 8 Flurry attacks.",
        },
        {
          level: 3,
          text:
            "Deathly Slash Damage +75%. On skill use, dash forward and immediately execute a Finishing Blow, dealing a " +
            "total of 8 Flurry attacks.",
        },
      ],
      note: "Cannot be obtained together with Flash Slash, Path of the Blade, or Dance of Screams.",
    },
    danceofscreams: {
      levels: [
        {
          level: 1,
          text: "Deathly Slash's Flurry attack count +2 and Damage +20%. While in Death Trance, Damage +16%.",
        },
        {
          level: 2,
          text: "Deathly Slash's Flurry attack count +3 and Damage +30%. While in Death Trance, Damage +38%.",
        },
        {
          level: 3,
          text: "Deathly Slash's Flurry attack count +4 and Damage +40%. While in Death Trance, Damage +57%.",
        },
      ],
      note: "Cannot be obtained together with Flash Slash, Path of the Blade, or Dance of Nightmares.",
    },
  };
})();
