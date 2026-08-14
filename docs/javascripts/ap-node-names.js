// SINGLE SOURCE OF TRUTH for an Ark Passive node id's display name and
// icon, used by ark-passive-tree.js so a build's "## Ark Setup" JSON can
// author nodes as a bare id (e.g. "keensense") instead of repeating
// "Keen Sense" and "ap-icons/keen-sense.png" by hand on every node, on
// every build page. Same problem/fix as skill-names.js for skills.
//
// Keyed flatly by id, NOT split by column (evolution/enlightenment/leap)
// - almost every node id is unique across all three trees, so one flat
// map avoids maintaining three copies of the lookup logic. The two
// exceptions are handled with distinct ids instead of a shared one:
//
//   - "Limit Break" is a real node in BOTH Evolution and Enlightenment,
//     with a DIFFERENT icon in each (limit-break-evo.png vs
//     limit-break-enl.png) - so id can't just be a name slug here, or
//     one column's icon would silently overwrite the other's. Use
//     "limitbreakevo" / "limitbreakenl" and pick the one matching
//     whichever column the node is actually in.
//   - "Crit" is a short display label whose icon file is critical.png,
//     not crit.png - name-slug-as-icon-filename doesn't hold for this
//     one node, which is exactly why this is a table and not a
//     name.toLowerCase().replace(/\s+/g, "") auto-lookup.
//
// Id convention: name lowercased with spaces/hyphens stripped (matches
// the skill id convention already used in skill-names.js/skill-data.js),
// e.g. "Standing Striker" -> "standingstriker".
//
// Must load before ark-passive-tree.js - see the extra_javascript order
// in mkdocs.yml.
(function () {
  window.DB_AP_NODE_NAMES = {
    // Evolution
    crit: { name: "Crit", icon: "ap-icons/critical.png" },
    specialization: { name: "Specialization", icon: "ap-icons/specialization.png" },
    keensense: { name: "Keen Sense", icon: "ap-icons/keen-sense.png" },
    limitbreakevo: { name: "Limit Break", icon: "ap-icons/limit-break-evo.png" },
    strike: { name: "Strike", icon: "ap-icons/strike.png" },
    master: { name: "Master", icon: "ap-icons/master.png" },
    pulverize: { name: "Pulverize", icon: "ap-icons/pulverize.png" },
    standingstriker: { name: "Standing Striker", icon: "ap-icons/standing-striker.png" },
    swiftstrike: { name: "Swift Strike", icon: "ap-icons/swift-strike.png" },
    remainingenergy: { name: "Remaining Energy", icon: "ap-icons/remaining-energy.png" },
    firmwill: { name: "Firm Will", icon: "ap-icons/firm-will.png" },
    surgeenhancement: { name: "Surge Enhancement", icon: "ap-icons/surge-enhancement.png" },
    swordcraftenhancement: { name: "Swordcraft Enhancement", icon: "ap-icons/swordcraft-enhancement.png" },

    // Enlightenment
    extremebodymovement: { name: "Extreme Body Movement", icon: "ap-icons/extreme-body-movement.png" },
    orbcirculation: { name: "Orb Circulation", icon: "ap-icons/orb-circulation.png" },
    orbcompression: { name: "Orb Compression", icon: "ap-icons/orb-compression.png" },
    orbcontrol: { name: "Orb Control", icon: "ap-icons/orb-control.png" },
    limitbreakenl: { name: "Limit Break", icon: "ap-icons/limit-break-enl.png" },
    chaosinfusion: { name: "Chaos Infusion", icon: "ap-icons/chaos-infusion.png" },
    chaoticpower: { name: "Chaotic Power", icon: "ap-icons/chaotic-power.png" },
    transcendentpower: { name: "Transcendent Power", icon: "ap-icons/transcendent-power.png" },

    // Leap
    awakeningamplifier: { name: "Awakening Amplifier", icon: "ap-icons/awakening-amplifier.png" },
    unleashedpower: { name: "Unleashed Power", icon: "ap-icons/unleashed-power.png" },
    releasepotential: { name: "Release Potential", icon: "ap-icons/release-potential.png" },
    instantspell: { name: "Instant Spell", icon: "ap-icons/instant-spell.png" },
    danceofnightmares: { name: "Dance of Nightmares", icon: "ap-icons/dance-of-nightmares.png" },
    danceofscreams: { name: "Dance of Screams", icon: "ap-icons/dance-of-screams.png" },
    pathoftheblade: { name: "Path of the Blade", icon: "ap-icons/path-of-the-blade.png" },
  };
})();
