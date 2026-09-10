// FORK GUIDE: DATA - every entry here is one Ark Passive node's in-game
// tooltip effect text, transcribed from reference screenshots (KR client,
// reconciled against the two most recent KR balance patches - see notes
// below on nodes that changed). Replace with your own class's Evolution/
// Enlightenment/Leap nodes if forking.
//
// SINGLE SOURCE OF TRUTH for the hover/focus/tap tooltip
// ark-passive-tooltip.js attaches to each node rendered by
// ark-passive-tree.js - a lookup miss just means the node renders with no
// tooltip (fails quietly, same rule as every other widget here).
//
// Keyed by the SAME flat node id ap-node-names.js uses (e.g. "keensense"),
// NOT split by column - see that file's own header comment for why.
//
// Per-entry shape is one of:
//   { text: "..." }          - flat effect text that doesn't change with
//                               the node's level (a single-tier keystone
//                               like Master/Pulverize, or a node whose
//                               only "level" is unlock/no-unlock).
//   { levels: [ { level: 1, text: "..." }, { level: 2, text: "..." } ] }
//                             - discrete per-level effect text, for any
//                               node whose in-game tooltip shows bracketed
//                               "+[x%/y%/z%]"-style tiers. ark-passive-
//                               tooltip.js looks up ONLY the entry whose
//                               level matches the node's own invested
//                               level (from the build's own JSON) and
//                               shows just that one line - matching the
//                               real in-game tooltip, which never lists
//                               every level either, just the current one
//                               (plus a "next level" preview this site
//                               doesn't replicate). The rest of the array
//                               still needs to exist as a real, correct
//                               lookup table even though only one entry
//                               renders per hover - see that file's
//                               currentLevelText() for the (should-never-
//                               trigger-in-practice) fallback if a node's
//                               own level ever doesn't land on an exact
//                               entry.
// Both shapes accept an optional `note` - a short caveat line shown below
// the effect text, currently only used for keystone mutual-exclusivity
// (e.g. Swift Strike / Surge Enhancement can't both be taken).
//
// A third shape, { perPoint: N }, is for a node that scales linearly with
// no discrete tiers to enumerate - Crit/Specialization (+50 per point, a
// raw stat value not a %, matching how base stats like Crit/
// Specialization/Swiftness/Domination work everywhere else in-game) and
// Goddess of Blessings (+3% Atk./Move Speed per point). ark-passive-
// tooltip.js computes the real number from the node's own invested level
// - "Crit +500" at Lv.10 - rather than this being a 30-entry levels list
// or a generic "+50 per point" rate description. Default output is
// "{node name} +{value}."; an optional `template` string overrides that
// for a node whose number sits inside a longer sentence rather than
// standing alone - use a literal "{value}" token wherever the computed
// number goes (see goddessofblessings below).
//
// Reconciled against two KR balance patches (older, then a newer one that
// overrides it where they overlap) not yet on Global - current values
// below are POST-both-patches. Where that changed a node from what an
// older reference screenshot showed, the old value is noted in a comment
// for context, not carried into the actual tooltip text:
//   - Orb Control: "Orb Consumption Speed -15%" -> "Orb Gauge doesn't
//     decrease"; damage +[0.8/1.6/2.4/3.2/4%] -> +[1/2/3/4/5%]
//   - Limit Break (Enlightenment): trigger changed from reaching MAX Surge
//     stacks to reaching exactly 60 (values unchanged: +[70/95/120%])
//   - "Locked In" renamed "Chaos Infusion": was a 12s on-hit buff
//     +[2/4/6/8/10%], now a flat Back Attack conditional at the same %s
//   - "Sword Spirit Compression" renamed "Chaotic Power": completely
//     rewritten mechanic (see chaoticpower below), damage settled at
//     +[6/23/40%] and Deathly Slash Damage penalty settled at -25%
//   - Path of the Blade: Crit Damage buff duration 5s -> 10s; the old
//     "Breaking Moon Damage +[10/20/30%]" line isn't mentioned by the
//     patch note at all, treated as dropped in favor of "Breaking Moon
//     changed to Normal operation"
//   - Dance of Screams: old flat "Deathly Slash Damage +[4/15/25%]" line
//     isn't mentioned by the patch note either, treated as superseded by
//     the new normal/Death-Trance damage split below
//
// Must load after ap-node-names.js (shares its id namespace) and before
// ark-passive-tooltip.js - see the extra_javascript order in mkdocs.yml.
(function () {
  window.DB_AP_NODE_EFFECTS = {
    // ---- Evolution ----
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

    // ---- Enlightenment ----
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
      // In-game tooltip groups these per-orb-consumed (3 values) then per
      // level (3 more) - regrouped level-major below so each entry is the
      // node's own level, same as every other node here.
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
        { level: 1, text: "While in Death Trance, Orb Gauge doesn't decrease. Damage to foes during Death Trance +1%." },
        { level: 2, text: "While in Death Trance, Orb Gauge doesn't decrease. Damage to foes during Death Trance +2%." },
        { level: 3, text: "While in Death Trance, Orb Gauge doesn't decrease. Damage to foes during Death Trance +3%." },
        { level: 4, text: "While in Death Trance, Orb Gauge doesn't decrease. Damage to foes during Death Trance +4%." },
        { level: 5, text: "While in Death Trance, Orb Gauge doesn't decrease. Damage to foes during Death Trance +5%." },
      ],
    },
    limitbreakenl: {
      levels: [
        { level: 1, text: "On reaching 60 Surge stacks, Deathblade Surge's Orb Compression effect Damage +70%." },
        { level: 2, text: "On reaching 60 Surge stacks, Deathblade Surge's Orb Compression effect Damage +95%." },
        { level: 3, text: "On reaching 60 Surge stacks, Deathblade Surge's Orb Compression effect Damage +120%." },
      ],
      note: "Requires Orb Compression Lv.3.",
    },
    chaosinfusion: {
      levels: [
        { level: 1, text: "When hitting Deathblade Surge as a Back Attack, damage to foes +2%." },
        { level: 2, text: "When hitting Deathblade Surge as a Back Attack, damage to foes +4%." },
        { level: 3, text: "When hitting Deathblade Surge as a Back Attack, damage to foes +6%." },
        { level: 4, text: "When hitting Deathblade Surge as a Back Attack, damage to foes +8%." },
        { level: 5, text: "When hitting Deathblade Surge as a Back Attack, damage to foes +10%." },
      ],
    },
    chaoticpower: {
      levels: [
        {
          level: 1,
          text:
            "Unleashes part of your demonic power to transform Deathblade Surge into a powerful attack, increasing attack " +
            "range and damage by 6%. Surge Stacks accumulate up to 80 times. On Death Trance end, up to 60 Surge stacks " +
            "are consumed; the Orb Gauge recovery effect and Surge damage effects remain as before. Breaking Moon " +
            "cooldown +540s, but grants 60 Surge stacks on hit. Deathly Slash cooldown -40s, but damage -25%.",
        },
        {
          level: 2,
          text:
            "Unleashes part of your demonic power to transform Deathblade Surge into a powerful attack, increasing attack " +
            "range and damage by 23%. Surge Stacks accumulate up to 80 times. On Death Trance end, up to 60 Surge stacks " +
            "are consumed; the Orb Gauge recovery effect and Surge damage effects remain as before. Breaking Moon " +
            "cooldown +540s, but grants 60 Surge stacks on hit. Deathly Slash cooldown -40s, but damage -25%.",
        },
        {
          level: 3,
          text:
            "Unleashes part of your demonic power to transform Deathblade Surge into a powerful attack, increasing attack " +
            "range and damage by 40%. Surge Stacks accumulate up to 80 times. On Death Trance end, up to 60 Surge stacks " +
            "are consumed; the Orb Gauge recovery effect and Surge damage effects remain as before. Breaking Moon " +
            "cooldown +540s, but grants 60 Surge stacks on hit. Deathly Slash cooldown -40s, but damage -25%.",
        },
      ],
      note: "Requires Limit Break (Enlightenment) Lv.3.",
    },

    // ---- Leap ----
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
            "Breaking Moon changes to Normal operation. After using the skill, Deathblade Surge's Crit Damage +20% for 10s. " +
            "This effect is removed after Deathblade Surge is used.",
        },
        {
          level: 2,
          text:
            "Breaking Moon changes to Normal operation. After using the skill, Deathblade Surge's Crit Damage +40% for 10s. " +
            "This effect is removed after Deathblade Surge is used.",
        },
        {
          level: 3,
          text:
            "Breaking Moon changes to Normal operation. After using the skill, Deathblade Surge's Crit Damage +60% for 10s. " +
            "This effect is removed after Deathblade Surge is used.",
        },
      ],
      note: "Cannot be obtained together with Flash Slash, Dance of Nightmares, or Dance of Screams.",
    },
    // Flash Slash: the fourth Tier 1 Leap keystone alongside Path of the
    // Blade/Dance of Nightmares/Dance of Screams above - not used by any
    // current build, kept in sync with their mutual-exclusivity note
    // anyway since it's a real option in that same exclusive group.
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
        { level: 1, text: "Number of Deathly Slash Flurry attacks +2, damage +20%, or +16% during Death Trance." },
        { level: 2, text: "Number of Deathly Slash Flurry attacks +3, damage +30%, or +38% during Death Trance." },
        { level: 3, text: "Number of Deathly Slash Flurry attacks +4, damage +40%, or +57% during Death Trance." },
      ],
      note: "Cannot be obtained together with Flash Slash, Path of the Blade, or Dance of Nightmares.",
    },
  };
})();
