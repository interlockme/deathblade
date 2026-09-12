// FORK GUIDE: DATA, but read this first - some node ids below (crit,
// specialization, keensense, etc.) are account-wide nodes shared by every
// class in-game and can stay as-is; others (remainingenergy,
// surgeenhancement, orbcirculation, etc.) are Deathblade's own identity
// nodes and must be replaced with your class's.
//
// SINGLE SOURCE OF TRUTH for an Ark Passive node id's display name, icon,
// tier, and max level, used by ark-passive-tree.js so a build's "## Ark
// Setup" JSON can author a node as just its id + invested level (e.g.
// {"id": "keensense", "level": 2}) instead of repeating "Keen Sense",
// "ap-icons/keen-sense.png", which tier column it sits in, and its max
// level by hand on every node, on every build page - all four are fixed
// properties of the node itself (which tree/tier/cap it has never changes
// between builds), never something a build actually chooses. Same
// problem/fix as skill-names.js for skills.
//
// tier is the node's Tier NUMBER within its own column (Evolution/
// Enlightenment/Leap each restart at 1) - ark-passive-tree.js groups a
// build's invested nodes by this number and labels the group "Tier N".
// It is NOT split by column here for the same reason id isn't (see
// below): tier numbers can repeat across columns (e.g. every column has
// a Tier 1), but that's fine, since a node id already only ever appears
// in one column - grouping only ever mixes nodes that are also in the
// same column already, via the column id declared once per build page's
// column entry.
//
// Also home to DB_AP_COLUMNS - the matching per-column lookup (display
// label + total point budget, e.g. "Evolution (140)") keyed by column id
// ("evolution"/"enlightenment"/"leap"), since those are just as fixed
// and just as pointless to retype on every build page.
//
// Keyed flatly by id, NOT split by column - almost every node id is
// unique across all three trees, so one flat map avoids maintaining
// three copies of the lookup logic. The two exceptions are handled with
// distinct ids instead of a shared one:
//
//   - "Limit Break" is a real node in BOTH Evolution and Enlightenment,
//     with a DIFFERENT icon in each (limit-break-evo.png vs
//     limit-break-enl.png) - so id can't just be a name slug here, or
//     one column's icon would silently overwrite the other's. Use
//     "limitbreakevo" / "limitbreakenl" and pick the one matching
//     whichever column the node is actually in.
//   - "Crit" (a Tier 1 Evolution stat node, +50 per point) and
//     "Critical" (a separate Tier 3 Evolution keystone, alternative to
//     Master/Pulverize) are two different real nodes with two different
//     icons that happen to collide under the id.toLowerCase() convention
//     - kept as "crit" (icon crit.png) and "critical" (icon
//     critical.png) instead of colliding on one id.
//
// Id convention: name lowercased with spaces/hyphens stripped (matches
// the skill id convention already used in skill-names.js/skill-data.js),
// e.g. "Standing Striker" -> "standingstriker".
//
// Must load before ark-passive-tree.js - see the extra_javascript order
// in mkdocs.yml.
(function () {
  window.DB_AP_COLUMNS = {
    evolution: { label: "Evolution", points: 140 },
    enlightenment: { label: "Enlightenment", points: 100 },
    leap: { label: "Leap", points: 70 },
  };

  window.DB_AP_NODE_NAMES = {
    // Evolution
    crit: { name: "Crit", icon: "ap-icons/crit.png", tier: 1, max: 30 },
    specialization: { name: "Specialization", icon: "ap-icons/specialization.png", tier: 1, max: 30 },
    // Goddess of Blessings/Illicit Spell/Optimized Training: Tier 1
    // Evolution keystone alternatives to Crit/Specialization. Not used by
    // any current build - added for future builds/prose reference.
    goddessofblessings: { name: "Goddess of Blessings", icon: "ap-icons/goddess-of-blessings.png", tier: 1, max: 30 },
    illicitspell: { name: "Illicit Spell", icon: "ap-icons/illicit-spell.png", tier: 1, max: 30 },
    optimizedtraining: { name: "Optimized Training", icon: "ap-icons/optimized-training.png", tier: 1, max: 30 },
    keensense: { name: "Keen Sense", icon: "ap-icons/keen-sense.png", tier: 2, max: 2 },
    limitbreakevo: { name: "Limit Break", icon: "ap-icons/limit-break-evo.png", tier: 2, max: 3 },
    strike: { name: "Strike", icon: "ap-icons/strike.png", tier: 3, max: 2 },
    master: { name: "Master", icon: "ap-icons/master.png", tier: 4, max: 1 },
    pulverize: { name: "Pulverize", icon: "ap-icons/pulverize.png", tier: 4, max: 1 },
    // Critical: Tier 3 Evolution keystone alternative to Master/Pulverize.
    // Not used by any current build - added for future builds/prose
    // reference.
    critical: { name: "Critical", icon: "ap-icons/critical.png", tier: 3, max: 2 },
    standingstriker: { name: "Standing Striker", icon: "ap-icons/standing-striker.png", tier: 5, max: 2 },

    // Enlightenment
    swiftstrike: { name: "Swift Strike", icon: "ap-icons/swift-strike.png", tier: 1, max: 1 },
    remainingenergy: { name: "Remaining Energy", icon: "ap-icons/remaining-energy.png", tier: 2, max: 3 },
    firmwill: { name: "Firm Will", icon: "ap-icons/firm-will.png", tier: 3, max: 3 },
    surgeenhancement: { name: "Surge Enhancement", icon: "ap-icons/surge-enhancement.png", tier: 1, max: 1 },
    swordcraftenhancement: { name: "Swordcraft Enhancement", icon: "ap-icons/swordcraft-enhancement.png", tier: 3, max: 5 },
    extremebodymovement: { name: "Extreme Body Movement", icon: "ap-icons/extreme-body-movement.png", tier: 4, max: 3 },
    orbcirculation: { name: "Orb Circulation", icon: "ap-icons/orb-circulation.png", tier: 4, max: 5 },
    orbcompression: { name: "Orb Compression", icon: "ap-icons/orb-compression.png", tier: 2, max: 3 },
    orbcontrol: { name: "Orb Control", icon: "ap-icons/orb-control.png", tier: 3, max: 5 },
    limitbreakenl: { name: "Limit Break", icon: "ap-icons/limit-break-enl.png", tier: 3, max: 3 },
    chaosinfusion: { name: "Chaos Infusion", icon: "ap-icons/chaos-infusion.png", tier: 4, max: 5 },
    chaoticpower: { name: "Chaotic Power", icon: "ap-icons/chaotic-power.png", tier: 4, max: 3 },

    // Leap
    transcendentpower: { name: "Transcendent Power", icon: "ap-icons/transcendent-power.png", tier: 1, max: 5 },
    awakeningamplifier: { name: "Awakening Amplifier", icon: "ap-icons/awakening-amplifier.png", tier: 1, max: 3 },
    unleashedpower: { name: "Unleashed Power", icon: "ap-icons/unleashed-power.png", tier: 1, max: 5 },
    releasepotential: { name: "Release Potential", icon: "ap-icons/release-potential.png", tier: 1, max: 5 },
    instantspell: { name: "Instant Spell", icon: "ap-icons/instant-spell.png", tier: 1, max: 3 },
    danceofnightmares: { name: "Dance of Nightmares", icon: "ap-icons/dance-of-nightmares.png", tier: 2, max: 3 },
    danceofscreams: { name: "Dance of Screams", icon: "ap-icons/dance-of-screams.png", tier: 2, max: 3 },
    pathoftheblade: { name: "Path of the Blade", icon: "ap-icons/path-of-the-blade.png", tier: 2, max: 3 },
    // Flash Slash: Tier 1 Leap keystone alternative to Path of the
    // Blade/Dance of Nightmares/Dance of Screams. Not used by any current
    // build - added for future builds/prose reference.
    flashslash: { name: "Flash Slash", icon: "ap-icons/flash-slash.png", tier: 1, max: 3 },
  };
})();
