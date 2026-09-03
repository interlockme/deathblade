// FORK GUIDE: DEATHBLADE-SPECIFIC - hardcoded to Deathblade's own Ark
// Passive keystones/formulas (see deathbladeSpecMultiplier below, and this
// file's own "for Deathblade" header line). Don't try to reuse this via
// data edits: delete it (and its <div class="ap-calc"> usage + its
// mkdocs.yml extra_javascript entry) or rewrite the math from scratch for
// your class's own keystones.
//
// Ark Passive node comparison calculator for Deathblade.
//
// Grid compares the three Keystone PAIRS (Critical+Master / Critical+Pulverize
// / Master+Pulverize) across the three Limit Break/Keen Sense splits Deathblade
// can run (3 evolution points total). Each cell shows its Final Multiplier as
// a % of the grid's best cell (best = 100.00%) rather than a raw multiplier -
// see the CSS comment above .ap-calc for why.
//
// Formulas verified cell-for-cell against Ark_Passive_Calculator.xlsx's own
// computed output - see the reference block at the bottom of this file.
//
// REMOVED: the sheet's trailing "0.85 * (1 + 12%/18% Damage Synergy)" scalar
// (and the "6% Damage Synergy" checkbox that fed it) is gone. It's a constant
// multiplied onto every one of the 9 grid cells equally, so it can never
// change which cell is best or the %-of-best shown for any of them -
// confirmed by direct computation (toggling it left every cell's pctOfBest
// and the best-cell identity bit-for-bit identical) before removing it.
// Crit Syn 1/2 still do something real: their +10% Crit Rate feeds into
// effCrit, which genuinely interacts with the Master keystone's crit-rate
// cap, so they're kept as pure "+10% Crit Rate" toggles with nothing else
// attached.
//
// ONE OPEN ACCURACY QUESTION, not yet confirmed - flagged rather than
// silently trusted: "Crit Hit Damage Synergy 1" (ap-crit-hit-syn-1) is
// modeled as a flat +8% on-crit damage multiplier, originally attributed to
// Glaivier's party synergy. A pass over current sources describes
// Glaivier's actual party synergy ("Critical Spear") as a Crit Resistance
// debuff on the target instead - i.e. a Crit RATE-side effect, not an
// on-crit DAMAGE multiplier - so this may be modeling the wrong stat
// entirely. The label was genericized to avoid asserting a source that
// might be wrong; "Crit Hit Damage Synergy 2" mirrors the same +8%
// mechanism for a second, different source and carries the same caveat.
// Both default OFF; confirm the real figures/mechanics before relying on
// either checked.
//
// Also unconfirmed: whether a real Deathblade bracelet can actually roll
// two separate Crit Rate lines (or two Crit Dmg lines) at once - the
// "2nd line" bracelet fields assume yes. If a bracelet can only ever have
// one line of a given stat type, those two fields double-count and should
// be removed instead.
//
// The Bracelet Line Comparison's 5 Weapon Power / Attack Power rows
// (STR/DEX/INT, Weapon Power, and the 3 hybrid on-hit/periodic/HP-gated
// WP lines) are a separate calculation layer from the rest of this file -
// they don't touch the Ark Passive keystone grid at all, instead scaling
// straight off the new .ap-gear-* Gearing inputs (Weapon Power, Main
// Stat, Base AP%, Flat AP, Attack Power%). See the constants block below
// (SUPPORT_WP_BUMP onward) and computeBraceletComparison's own comment
// for the methodology, including the equally-geared-support
// approximation behind Support AP Buff Uptime.

(function () {
  "use strict";

  // ----- Lookup tables -----
  const NONE_LOW_MID_HIGH = (none, low, mid, high) => ({ None: none, Low: low, Mid: mid, High: high });
  const RING_RATE_TABLE = NONE_LOW_MID_HIGH(0, 0.004, 0.0095, 0.0155);
  const RING_DMG_TABLE = NONE_LOW_MID_HIGH(0, 0.012, 0.024, 0.04);
  const BRACELET_RATE_TABLE = NONE_LOW_MID_HIGH(0, 0.034, 0.042, 0.05);
  const BRACELET_DMG_TABLE = NONE_LOW_MID_HIGH(0, 0.068, 0.084, 0.1);
  const BRACELET_ADD_A_TABLE = NONE_LOW_MID_HIGH(0, 0.03, 0.035, 0.04);
  const BRACELET_ADD_B_TABLE = NONE_LOW_MID_HIGH(0, 0.025, 0.03, 0.035);
  const NECKLACE_ADD_TABLE = NONE_LOW_MID_HIGH(0, 0.006, 0.016, 0.026);
  const SH_PET_TABLE = NONE_LOW_MID_HIGH(0, 0.004, 0.007, 0.01);

  const ADRENALINE_TABLE = { "Not Used": 0, "0 Nodes": 0.14, "1 Nodes": 0.155, "2 Nodes": 0.17, "3 Nodes": 0.185, "4 Nodes": 0.2 };
  const KBW_TABLE = { "Not Used": 0, "0 Nodes": 0.44, "1 Nodes": 0.46, "2 Nodes": 0.48, "3 Nodes": 0.5, "4 Nodes": 0.52 };
  const KBW_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.075, "2 Lv.": 0.094, "3 Lv.": 0.132, "4 Lv.": 0.15 };

  const FLASHY_ATK_TABLE = { None: 0, "Epic-Leg 10P": 0.0055, "Relic 17P": 0.011, "Ancient 17P": 0.0165 };

  // Merged Stable Atk table: "Grade|Points" -> value
  const STABLE_ATK_TABLE = {
    "None|0P": 0,
    "Legend|14P": 0.007,
    "Relic|14P": 0.007,
    "Relic|17P": 0.021,
    "Relic|18P": 0.0233,
    "Relic|19P": 0.0256,
    "Relic|20P": 0.0279,
    "Ancient|14P": 0.007,
    "Ancient|17P": 0.035,
    "Ancient|18P": 0.0373,
    "Ancient|19P": 0.0396,
    "Ancient|20P": 0.0419,
  };
  function stableAtkValue(combined) {
    return STABLE_ATK_TABLE[combined] || 0;
  }

  const EVO_KARMA_MAP = { 1: 0.01, 2: 0.02, 3: 0.03, 4: 0.04, 5: 0.05, 6: 0.06 };

  // ----- Bracelet Line Comparison lookup tables -----
  // Low/Mid/High values sourced from Arsonistic's "Brace" sheet - see the
  // comment above computeBraceletComparison() for methodology. Reuses
  // BRACELET_RATE_TABLE / BRACELET_DMG_TABLE / BRACELET_ADD_A_TABLE /
  // BRACELET_ADD_B_TABLE above where the sheet's own Low/Mid/High figures
  // for a line happen to be identical to a table already defined for the
  // main gear inputs (Crit Rate, Crit Dmg, and both Additional Dmg lines) -
  // no need to duplicate those four.
  // The +2% Skill Cooldown tag has a real downside: less time spent waiting
  // on cooldown means a lower effective cast rate than the flat +4.5/5/5.5%
  // alone implies. Modeled as a flat CPM penalty - going from an uncapped
  // CPM to one that's 2% shorter cooldown but otherwise the same uptime
  // costs about 1.35% of your cast rate (e.g. a 15 CPM skill lands at ~14.8,
  // and 15/14.8 - 1 ≈ 1.35%) - then folded into the flat Damage % via
  // (1 + rawDamage) / (1 + 0.0135) - 1, rather than the flat 4.5/5/5.5%
  // taken at face value.
  const SKILL_CD_PENALTY = 0.0135;
  const DAMAGE_CD_RAW_TABLE = { Low: 0.045, Mid: 0.05, High: 0.055 };
  const DAMAGE_CD_TABLE = {
    Low: (1 + DAMAGE_CD_RAW_TABLE.Low) / (1 + SKILL_CD_PENALTY) - 1,
    Mid: (1 + DAMAGE_CD_RAW_TABLE.Mid) / (1 + SKILL_CD_PENALTY) - 1,
    High: (1 + DAMAGE_CD_RAW_TABLE.High) / (1 + SKILL_CD_PENALTY) - 1,
  };
  // Surge-only temporary override for the above: Surge Deathblade's actual
  // in-game cast-rate loss from the +2% Cooldown downside doesn't match the
  // SKILL_CD_PENALTY model RE was tuned against, so until a game balance
  // patch reconciles the two classes, Surge instead takes a flat -1 off the
  // raw 4.5/5/5.5% (i.e. 3.5/4/4.5%) rather than the divided-by-penalty
  // figure above. RE is untouched. Remove this table (and the branch in the
  // Damage+CD row below that picks it) once that patch lands.
  const DAMAGE_CD_SURGE_TABLE = {
    Low: DAMAGE_CD_RAW_TABLE.Low - 0.01,
    Mid: DAMAGE_CD_RAW_TABLE.Mid - 0.01,
    High: DAMAGE_CD_RAW_TABLE.High - 0.01,
  };
  // Crit stat delta candidates for the raw "Crit +80/100/120" bracelet line
  // (a base-stat roll, distinct from the Crit Rate % Line below) - added
  // straight onto critStat the same way the sheet adds it onto UCrit.
  const CRIT_STAT_TABLE = { Low: 80, Mid: 100, High: 120 };
  const OUTGOING_DMG_TABLE = { Low: 0.02, Mid: 0.025, High: 0.03 };
  const STAGGER_DMG_TABLE = { Low: 0.04, Mid: 0.045, High: 0.05 };
  const STAGGER_DPS_SHARE = 0.05; // assumed % of a fight's DPS that happens during Stagger - matches the sheet's own default
  const BACK_DMG_TABLE = { Low: 0.025, Mid: 0.03, High: 0.035 };
  const BACK_ATTACK_DPS_SHARE = 0.97; // assumed % of DPS that lands as a Back Attack
  const DEMON_DMG_ADD = 0.025; // the "& Dmg vs Demon/Archdemon +2.5%" tag's fixed Additional Dmg component

  // ----- Accessory Line Comparison lookup tables -----
  // Sourced from Arsonistic's "Acc" sheet (Acc!C2:E10), same methodology
  // as the Bracelet tables above - each a fresh candidate line valued in
  // isolation, not a live per-piece tracker. Necklace/Rings reuse the
  // same normalization approach as their Bracelet counterparts (Add Dmg
  // divided by addDmgBaseline; Crit Rate/Dmg run through critLikeGain);
  // Earrings reuse the shared Gearing inputs' gearApTotal machinery, same
  // as the Bracelet section's 5 WP/AP rows. Deliberately its own tables
  // rather than reusing NECKLACE_ADD_TABLE/RING_DMG_TABLE above where
  // values are close but not identical (those two track this site's
  // "your actual equipped piece" baseline figures, tuned separately) -
  // RING_RATE_TABLE is the one exception, its Acc!C6:E6 values are an
  // exact match, so that one IS reused as-is below.
  const ACC_NECKLACE_ADD_TABLE = { Low: 0.007, Mid: 0.016, High: 0.026 };
  const ACC_NECKLACE_OUT_TABLE = { Low: 0.0055, Mid: 0.012, High: 0.02 };
  const ACC_EARRING_AP_TABLE = { Low: 0.004, Mid: 0.0095, High: 0.0155 };
  const ACC_EARRING_WP_TABLE = { Low: 0.008, Mid: 0.018, High: 0.03 };
  const ACC_FLAT_AP_TABLE = { Low: 80, Mid: 195, High: 390 };
  const ACC_FLAT_WP_TABLE = { Low: 195, Mid: 480, High: 960 };
  const ACC_QUALITY_MAIN_STAT_TABLE = { Low: 1935, Mid: 2083, High: 2679 };
  // Ring Crit Damage's own magnitude (Acc!O7:Q7) - close to but not
  // identical to RING_DMG_TABLE above (that one's tuned for this site's
  // "your actual equipped ring" tracked baseline elsewhere; this is the
  // sheet's own stated Bonus figure for the comparison candidate). Ring
  // Crit Rate has no equivalent new table - RING_RATE_TABLE above is an
  // exact match to Acc!O6:Q6, so that one's reused as-is.
  const ACC_RING_DMG_TABLE = { Low: 0.011, Mid: 0.024, High: 0.04 };

  // ----- Gearing (Weapon Power / Attack Power) constants -----
  // Sourced from Arsonistic's "Brace"/"Acc" sheets. Attack Power there is:
  //   AP = FLOOR(SQRT(WP * MainStat / 6) * BaseAP + FlatAP + SupAPBuff) * PercentAP
  // WP, MainStat, BaseAP%, FlatAP, and Attack Power% (PercentAP) are all
  // read from the .ap-gear-* inputs (see resources.md) - real personalized
  // stats/sums the player reads off their own character panel, same as
  // the sheet's own Calc tab expects. Main Stat % (below) used to be
  // hardcoded here as STAT_GRANT_QUALITY_BONUS on the mistaken read that
  // Brace!Q6/Acc!M10 carried no source-list documentation, unlike Weapon
  // Power% - they do (Legendary Pet Ranch +1%, Legendary Skins +2%
  // each up to 4, Epic Skins +1% each up to 4), it's just recorded as a
  // cell NOTE rather than a visible cell value, easy to miss reading the
  // sheet's raw cell contents. Exposed as its own input now, same
  // treatment as Weapon Power % - see .ap-gear-main-stat-pct.

  // On-hit Weapon Power stacking line (Brace row 8, "max 6x"): fixed
  // assumption of 5 of a possible 6 stacks on average, matching the
  // sheet's own default (Brace!Q8) - same "fixed default instead of a
  // live input" simplification already used for STAGGER_DPS_SHARE /
  // BACK_ATTACK_DPS_SHARE above. The line's own Atk/Move Speed component
  // is dropped entirely: it only pays off below the 140% AS/MS cap, and
  // the existing "Attack & Move Speed +4/5/6%" bracelet line above is
  // already left out of this table for the same at-cap reason.
  const ONHIT_WP_STACK_ASSUMPTION = 5;

  // Periodic Weapon Power line (Brace row 9, "30s CD, max 30x"): fixed
  // fight-length assumption (sheet's own default, Brace!Q9) used to
  // average the cooldown-gated stacks over a fight - see Brace!P9's
  // comment on the accumulation math this mirrors.
  const PERIODIC_WP_FIGHT_MINUTES = 10;
  function periodicWpAvgBonus(fightMinutes, perStackValue) {
    const capped = Math.min(14.5, fightMinutes);
    return ((capped * (capped + 0.5)) + Math.max(0, fightMinutes - 14.5) * 30) / fightMinutes * perStackValue;
  }

  // HP-gated Weapon Power line (Brace row 10, ">50% HP"): fixed buff
  // uptime assumption (sheet's own default, Brace!Q10).
  const HP_GATED_WP_UPTIME = 0.99;

  // Equally-geared support's Attack Power buff (SupAPBuff in Arsonistic's
  // "SupCalc" sheet) - approximated rather than modeling a second full
  // character's engravings/ArkGrid/Brand/Identity kit, since none of the
  // Brace/Acc/ArkGrid formulas reach for anything from the support's kit
  // except this one number. Assumes a support geared to the SAME
  // investment tier as your own Gearing inputs below - not a fixed
  // "well-geared"/BiS assumption, an EQUALLY-geared one that scales with
  // whatever you enter - carrying:
  //   - the same Main Stat as you
  //   - SUPPORT_WP_BUMP more Weapon Power (supports itemize WP harder -
  //     e.g. always taking 3% WP earrings over substats you might skip)
  //   - the same Base AP% multiplier as you
  //   - a fixed AP-buff-tier coefficient, calibrated against Arsonistic's
  //     own reference support profile (Awakening engraving + ArkGrid AP
  //     nodes) - this is the one piece that can't scale off your own
  //     inputs, since it depends on the support's engraving/ArkGrid
  //     choices rather than WP/MainStat
  const SUPPORT_WP_BUMP = 0.05;
  const SUPPORT_AP_BUFF_COEFFICIENT = 0.352;

  function gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult, supApBuff) {
    // FLOOR wraps the *entire* bracket, including the final *PercentAP
    // multiply (confirmed against Brace!C6's exact formula) - not just the
    // sqrt/FlatAP/SupAPBuff sum before it. Doesn't change these rows' %
    // gain in any way you'd actually see (PercentAP is a common scalar on
    // both sides of the ratio either way, so it washes out almost
    // entirely regardless of where FLOOR sits - see the comment on
    // percentApMult below), but it's the actual formula, and getting the
    // order right matters for anything built on this helper later that
    // needs a real AP total rather than just a ratio.
    return Math.floor((Math.sqrt((wp * mainStat) / 6) * baseApMult + flatAp + supApBuff) * percentApMult);
  }

  function supportApBuff(inputs, wp, mainStat, baseApMult) {
    if (!inputs.gearSupport) return 0;
    const supWp = wp * (1 + SUPPORT_WP_BUMP);
    return Math.sqrt((supWp * mainStat) / 6) * baseApMult * SUPPORT_AP_BUFF_COEFFICIENT * (inputs.gearSupportUptime / 100);
  }

  // Adrenaline engraving's own Attack Power component - separate from the
  // Crit Rate component already modeled above via ADRENALINE_TABLE/
  // adrenalineUptime. Fixed at 0.9% AP per stack regardless of node
  // count, assuming the full 6 stacks (see adrenalineApFraction below for
  // why this is NOT time-weighted by Adrenaline Uptime); the Ability
  // Stone adds its own per-stack bonus on top (source: the stone's own
  // tooltip, Lv.1-4). Goes to 0 whenever Adrenaline is set to "Not Used" -
  // matching the in-game reality that skipping the engraving loses both
  // halves together. Deliberately kept OUT of the manual "Attack Power %"
  // field (and its tooltip's source list) so the two can never be
  // double-counted; this is added on top of gearAttackPowerPercentTotal
  // instead, same as Atropine.
  const ADRENALINE_AP_PER_STACK = 0.009;
  const ADRENALINE_STACKS = 6;
  const ADRENALINE_STONE_AP_TABLE = { "0 Lv.": 0, "1 Lv.": 0.0048, "2 Lv.": 0.006, "3 Lv.": 0.0083, "4 Lv.": 0.0095 };

  // Attack Power isn't gated the same way the Crit Rate side is (full 6
  // stacks or nothing) - every stack from 1-6 contributes its own share,
  // and there's no way to directly observe average stack count in-game.
  // A first pass tried deriving an estimated average stack count from the
  // Crit Rate side's Adrenaline Uptime slider (linear from half stacks at
  // 0% up to full stacks at 100%), but that's not a real relationship -
  // 0% Crit uptime means near-0% actual uptime on the buff, not "half
  // stacks on average", so it overstated Attack Power at low uptime
  // rather than approximating it. Simplest correct fix: don't link the
  // two at all. This always assumes full 6 stacks whenever Adrenaline is
  // used, same as the sheet's own reference build; Adrenaline Uptime only
  // affects the Crit Rate side above.
  function adrenalineApFraction(inputs) {
    if (inputs.adrenaline === "Not Used") return 0;
    const stoneAp = ADRENALINE_STONE_AP_TABLE[inputs.adrenalineStone] || 0;
    return ADRENALINE_STACKS * (ADRENALINE_AP_PER_STACK + stoneAp);
  }

  // Attack Power %'s individual sources (see Calc!P7's own source-list
  // comment on the reference sheet, which this mirrors term for term).
  // Astrogem doesn't get its own input: it reuses the existing Astrogem
  // Level field from the Ark Passive section above (same investment,
  // same 0-100 scale) rather than asking for the same number twice,
  // scaled linearly up to the reference sheet's "up to 4.4%" ceiling -
  // the sheet doesn't give a separate per-level formula for this half
  // of Astrogem's payout, so this treats it as proportional to the
  // Damage% half it does give a formula for.
  // Earrings: two independent slots (you equip two at once), same
  // "pair of dropdowns" pattern as the Rings/Bracelet groups above -
  // see GEAR_AP_EARRING_TABLE's own two lookups in
  // gearAttackPowerPercentTotal below. No live-value span needed on
  // either, same reasoning as those pairs' own CSS comment: the option
  // text already shows the exact percentage.
  const GEAR_AP_EARRING_TABLE = { "None": 0, "Low": 0.4, "Mid": 0.95, "High": 1.55 };
  // Weapon Power's own earring table, same "None/Low/Mid/High" shape and
  // percentage-point units as GEAR_AP_EARRING_TABLE above - see
  // .ap-gear-wp-earring1/2's own comment in resources.md for why Weapon
  // Power Earrings is a paired dropdown row now instead of a freeform
  // number, matching Attack Power's own Earrings row exactly.
  const GEAR_WP_EARRING_TABLE = { "None": 0, "Low": 0.8, "Mid": 1.8, "High": 3 };
  // Karmic Enlightenment elixir effect: +0.1% Weapon Power per level, up
  // to Lv.30 (+3% at max) - same "Level input -> live computed %" pattern
  // as gearAstrogemApPercent below.
  const GEAR_WP_KARMA_PER_LEVEL = 0.1;
  const GEAR_AP_KAZEROS = 2;
  const GEAR_AP_GUARDIAN = 3;
  // Chaos Core: Attack, keyed the same "Grade|Points" way as
  // STABLE_ATK_TABLE above, and sourced the same way (Arsonistic's
  // sheet + the item's own in-game tooltip at each investment tier -
  // see the two Chaos Star Core: Attack tooltip screenshots this table
  // was built from). Each entry carries BOTH of the core's payouts -
  // pct (Atk. Power %) and flat (Flat AP) - since a single dropdown
  // selection determines both at once; gearFlatAp (the manual Flat AP
  // input) now covers ONLY accessories, with this core's own flat
  // contribution added in automatically wherever flatAp is computed
  // (see the two gearApTotal call sites below) rather than asking the
  // reader to hand-add it into that field themselves.
  // "Any|10P" covers the flat-only stage (10 Points, both grades give
  // the same +900 with no % yet, so grade doesn't matter until 14P).
  // 14P/17P+ values are cumulative totals at each tier, matching how
  // the core's own tooltip lists each breakpoint as additive. Ancient
  // 20P's pct (2.68%) and flat (3600) both match this table's own
  // prior single fixed constant/default exactly, which is what this
  // table replaces.
  const GEAR_AP_CHAOS_STAR_TABLE = {
    "None|0P": { pct: 0, flat: 0 },
    "Any|10P": { pct: 0, flat: 900 },
    "Relic|14P": { pct: 0.55, flat: 900 },
    "Relic|17P": { pct: 1.65, flat: 2700 },
    "Relic|18P": { pct: 1.81, flat: 2700 },
    "Relic|19P": { pct: 1.97, flat: 2700 },
    "Relic|20P": { pct: 2.13, flat: 2700 },
    "Ancient|14P": { pct: 0.55, flat: 900 },
    "Ancient|17P": { pct: 2.2, flat: 3600 },
    "Ancient|18P": { pct: 2.36, flat: 3600 },
    "Ancient|19P": { pct: 2.52, flat: 3600 },
    "Ancient|20P": { pct: 2.68, flat: 3600 },
  };
  function gearChaosStarPct(combined) {
    return (GEAR_AP_CHAOS_STAR_TABLE[combined] || {}).pct || 0;
  }
  function gearChaosStarFlat(combined) {
    return (GEAR_AP_CHAOS_STAR_TABLE[combined] || {}).flat || 0;
  }
  const GEAR_AP_ASTROGEM_MAX = 4.4;

  // Astrogem Atk. Power Level is its OWN field (.ap-gear-ap-astrogem-lv),
  // separate from the Additional Damage group's Astrogem Level
  // (.ap-astrogem-lv) above - same source item, but Astrogem's Damage%
  // and Atk. Power% payouts are independently levelable, not two views
  // of one number. Used to reuse the Additional Damage field directly,
  // which silently forced the two to always match.
  function gearAstrogemApPercent(inputs) {
    return (inputs.gearAstrogemLv / 100) * GEAR_AP_ASTROGEM_MAX;
  }

  // Atropine's own AP contribution (time-averaged, see
  // GEAR_AP_ATROPINE_FULL/gearAtropineUptime below) and Adrenaline's own
  // AP contribution (adrenalineApFraction, see that function's own
  // comment) both fold straight into this total now - they're genuine
  // Attack Power % sources like everything else here, only ever kept as
  // separate terms for implementation convenience (each has its own
  // toggle/table elsewhere), not because they're conceptually different
  // from Kazeros/Guardian/etc. Support is NOT included here despite
  // living in the same visual box below - it buffs Attack Power through
  // a completely different mechanism (a flat AP amount folded into
  // supportApBuff, pre-multiplied by percentApMult rather than being
  // part of it - see supportApBuff's own comment), so there's no
  // single "% value" for it to contribute to this sum.
  const GEAR_AP_ATROPINE_FULL = 30;

  // Support's Drops of Ether engraving drops two different orbs - Strength
  // Orb (Attack Power, folded in here) and Flash Orb (Crit Rate, folded
  // into critRateTotal instead) - both scaled by the SAME "Ether
  // effectiveness" bonus, which is why that bonus is a single shared
  // constant rather than two separate ones. Sourced from the engraving's
  // own tooltip: Relic grade at max level gives +16.00% Ether
  // effectiveness, and a Lv.2 Ability Stone adds another +15.00% - the
  // tooltip's own "Final Applied Effect" line confirms these ADD (16+15 =
  // 31.00% enhanced), not multiply. Like SUPPORT_AP_BUFF_COEFFICIENT
  // above, this is calibrated to one assumed reference support engraving/
  // stone combo rather than derived from the reader's own inputs, since
  // it depends on the SUPPORT's build, not theirs.
  const SUPPORT_ETHER_EFFECTIVENESS = 0.31;
  // Base orb values before the Ether effectiveness bonus above - Strength
  // Orb's +10% Attack Power, Flash Orb's +15% Crit Rate (both per the
  // engraving's Base Effect tooltip, Relic grade).
  const STRENGTH_ORB_BASE_AP = 10;
  const FLASH_ORB_BASE_CRIT_RATE = 0.15;
  const STRENGTH_ORB_FULL_AP = STRENGTH_ORB_BASE_AP * (1 + SUPPORT_ETHER_EFFECTIVENESS);
  const FLASH_ORB_FULL_CRIT_RATE = FLASH_ORB_BASE_CRIT_RATE * (1 + SUPPORT_ETHER_EFFECTIVENESS);

  function gearAttackPowerPercentTotal(inputs) {
    return (
      (GEAR_AP_EARRING_TABLE[inputs.gearApEarring1] || 0) +
      (GEAR_AP_EARRING_TABLE[inputs.gearApEarring2] || 0) +
      (inputs.gearApKazeros ? GEAR_AP_KAZEROS : 0) +
      (inputs.gearApGuardian ? GEAR_AP_GUARDIAN : 0) +
      gearChaosStarPct(inputs.gearApChaosStar) +
      gearAstrogemApPercent(inputs) +
      inputs.gearApOther +
      (inputs.gearAtropineUptime / 100) * GEAR_AP_ATROPINE_FULL +
      (inputs.gearStrengthOrbUptime / 100) * STRENGTH_ORB_FULL_AP +
      adrenalineApFraction(inputs) * 100
    );
  }

  // ----- Base AP % (Gearing) -----
  // Gem Base AP % is the SUM across every gem you have socketed, not
  // one gem's level - e.g. eleven Lv.10 gems (+1.2% each) is 13.2%, not
  // 1.2%. Free-typed rather than a dropdown for exactly that reason:
  // the number of gems you have varies by how much gear you've
  // socketed, so there's no fixed enumerable set of totals to offer as
  // options the way there is for a single gem's own level. The Ability
  // Stone's +1.5% (from a 9/7, 10/6, or better roll) stays a separate
  // checkbox since it's genuinely binary - you either have that roll or
  // you don't.
  const ABILITY_STONE_BASE_AP_BONUS = 1.5;

  function gearBaseApPercentTotal(inputs) {
    return inputs.gearGemBaseAp + (inputs.gearAbilityStoneBaseAp ? ABILITY_STONE_BASE_AP_BONUS : 0);
  }

  // ----- Weapon Power % (Gearing) -----
  // Split into its two sources (Karmic Enlightenment, Earrings) for the
  // same reason Attack Power % above is split into individual fields -
  // see .ap-gear-wp-earring1/2's own tooltip/comment in resources.md.
  // The Bracelet panel's 5 WP/AP rows want the FULL total (your real
  // current gear, same as every other Gearing field); the Accessory
  // panel's Earrings candidate line wants just the Karmic Enlightenment
  // portion, with the Earrings portion zeroed out first so the candidate
  // isn't added on top of the 2 earrings' WP% already counted in the
  // baseline - see that panel's own comment for the matching treatment
  // already applied to gearApEarring1/2.
  function gearWpKarmaPercent(inputs) {
    return inputs.gearWpKarmaLv * GEAR_WP_KARMA_PER_LEVEL;
  }
  function gearWpEarringPercent(inputs) {
    return (GEAR_WP_EARRING_TABLE[inputs.gearWpEarring1] || 0) + (GEAR_WP_EARRING_TABLE[inputs.gearWpEarring2] || 0);
  }
  function gearWpPercentTotal(inputs) {
    return gearWpKarmaPercent(inputs) + gearWpEarringPercent(inputs);
  }

  // ----- Spec +80/100/120 (Deathblade only) -----
  // Ported from the sheet's per-class Spec DPS-multiplier model
  // (Calc!AY:BJ, rows for "RE Deathblade" and "Surge Deathblade"), with
  // the RE-only CDR term (the sheet's separate Trance-reset-via-Spec
  // mechanic) dropped - RE and Surge now use one shared formula,
  // parameterized on:
  //   - share: the % of your total DPS that comes from the skill Spec
  //     scales (RE's Trance-triggering skill / Surge's namesake skill)
  //   - awakeningShare: your Awakening skill's share of total DPS - the
  //     sheet's own row comment on RE (Calc!BJ2) confirms the secondary
  //     term is "AwkScaling", i.e. the Awakening skill also scales off
  //     Spec a little. The sheet uses 1% for both classes; RE is set to
  //     1.5% here per build feedback (Surge stays at 1%).
  //   - coefficient: that skill's own Spec-scaling coefficient
  // AWAKENING_COEFFICIENT (0.1528) is the Awakening skill's own
  // Spec-scaling coefficient - fixed the same across every class in the
  // sheet (Reaper, Gunslinger, Artillerist rows all use 0.1528 too), so
  // it isn't something a Deathblade build changes.
  // Then the DPS multiplier at a given Spec stat is:
  //   1 + (coefficient*shareRatio + AWAKENING_COEFFICIENT*awakeningRatio)/699*Spec
  // where shareRatio/awakeningRatio normalize share/awakeningShare against
  // SPEC_REF (1855) - a reference Spec value the share percentages are
  // considered accurate at, kept deliberately separate from SPEC_BASE
  // (1735, the Spec value the +80/100/120 tiers are actually calculated
  // against) so the two can be tuned independently. 699 is the sheet's
  // universal Spec-stat-to-%DPS divisor, used identically across every
  // class's row in that table - not a crit-rate constant, and not
  // something specific to this line.
  //
  // Every other tiered bracelet line in this table is linear in its tier
  // value (Mid = Low * 1.25, High = Low * 1.5) because the sheet's own
  // simplified (non-"Advanced Skill Setup") formula for Spec is too: the
  // DPS gain from adding N Spec is (multiplier(SPEC_BASE) - 1)
  // / (SPEC_BASE * multiplier(SPEC_BASE)) * N - a single constant times
  // the tier value. SPEC_BASE is fixed at 1735 rather than tied to any
  // input - the sheet's own Spec cell is "your current profile's Spec,"
  // which this crit-focused calculator doesn't track or want to expose as
  // a live input.
  const SPEC_BASE = 1735;
  const SPEC_REF = 1855; // reference Spec the share percentages are anchored to
  const SPEC_SKILL_COEFFICIENT = 0.86;
  const AWAKENING_COEFFICIENT = 0.1528;
  // `builds` replaces the old single altShare/altLabel pair with one entry
  // per named build variant, each rendered as its own small hover tag on
  // the Spec row (see renderBraceletComparison) instead of one shared "i"
  // icon - so 111 and 313 (RE) / 222 and 333 (Surge) are each independently
  // hoverable rather than lumped into one combined note.
  const RE_DEATHBLADE_SPEC = {
    share: 0.17,
    awakeningShare: 0.015,
    builds: [
      { tag: "111", share: 0.20 },
      { tag: "313", share: 0.20 },
    ],
  };
  const SURGE_DEATHBLADE_SPEC = {
    share: 0.75,
    awakeningShare: 0.01,
    builds: [
      { tag: "222", share: 0.50 },
      { tag: "333", share: 0.45 },
    ],
  };

  // RE and Surge use the identical formula now that the CDR-driven term
  // (Trance getting reset more often as Spec goes up) has been dropped -
  // only the damage share and Awakening share differ between the two
  // builds.
  function deathbladeSpecMultiplier(spec, share, awakeningShare) {
    const denom = 1 - share - awakeningShare
      + share / (1 + SPEC_SKILL_COEFFICIENT / 699 * SPEC_REF)
      + awakeningShare / (1 + AWAKENING_COEFFICIENT / 699 * SPEC_REF);
    const shareRatio = (share / (1 + SPEC_SKILL_COEFFICIENT / 699 * SPEC_REF)) / denom;
    const awakeningRatio = (awakeningShare / (1 + AWAKENING_COEFFICIENT / 699 * SPEC_REF)) / denom;
    return 1 + (SPEC_SKILL_COEFFICIENT * shareRatio + AWAKENING_COEFFICIENT * awakeningRatio) / 699 * spec;
  }

  // Collapses a DPS multiplier at SPEC_BASE into the single "gain per point
  // of Spec" constant that every tier value below is just multiplied by.
  function specGainPerPoint(multiplierFn, share, awakeningShare) {
    const az = multiplierFn(SPEC_BASE, share, awakeningShare);
    return (az - 1) / (SPEC_BASE * az);
  }

  const STRIKE_CRIT_RATE = 0.2;
  const STRIKE_CRIT_DMG = 0.32;
  const STANDING_STRIKER_EVO_DMG = 0.21;
  const CRIT_DMG_BASE = 2.0;

  const EVOLUTION_SPLITS = [
    { key: "lb3ks0", limitBreak: 3, keenSense: 0, label: "LB3" },
    { key: "lb2ks1", limitBreak: 2, keenSense: 1, label: "LB2/KS1" },
    { key: "lb1ks2", limitBreak: 1, keenSense: 2, label: "LB1/KS2" },
  ];
  const LIMIT_BREAK_EVO_DMG = [0, 0.1, 0.2, 0.3];
  const KEEN_SENSE_EVO_DMG = [0, 0.05, 0.1];
  const KEEN_SENSE_CRIT_RATE = [0, 0.04, 0.08];

  const COMBINED_KEYSTONES = ["crit+master", "crit+pulv", "master+pulv"];
  const KEYSTONE_LABELS = {
    "crit+master": "Critical + Master",
    "crit+pulv": "Critical + Pulverize",
    "master+pulv": "Master + Pulverize",
  };

  // Party & Positioning's synergy/support toggles (Crit Rate Synergy 1/2,
  // Crit Hit Damage Synergy 1/2, and the Passionate Dance support toggle) -
  // realistically only 3 of these 5 are ever active on the same pull, so at
  // most 3 may be checked at once (see enforcePartyCheckboxLimit below).
  // Gearing's Support AP Buff Uptime field isn't a checkbox at all (it's a
  // number input, gated by enforceGearSupportUptimeGate off .ap-yearning
  // directly), so it doesn't need its own entry here.
  const PARTY_CHECKBOX_LIMIT_SELECTORS = [
    ".ap-crit-syn1",
    ".ap-crit-syn2",
    ".ap-crit-hit-syn-1",
    ".ap-crit-hit-syn-2",
    ".ap-yearning",
  ];
  const PARTY_CHECKBOX_LIMIT = 3;

  // ----- Safe DOM helpers -----
  function getNumber(root, selector, fallback) {
    const el = root.querySelector(selector);
    if (!el) return fallback;
    const v = parseFloat(el.value);
    return isFinite(v) ? v : fallback;
  }

  function getSelect(root, selector, fallback) {
    const el = root.querySelector(selector);
    if (!el) return fallback;
    return el.value !== undefined ? el.value : fallback;
  }

  function getCheckbox(root, selector, fallback) {
    const el = root.querySelector(selector);
    if (!el) return fallback;
    return !!el.checked;
  }

  function readInputs(root) {
    return {
      critStat: Math.max(0, Math.min(750, getNumber(root, ".ap-crit-stat", 658))),
      weaponQuality: Math.max(0, Math.min(100, getNumber(root, ".ap-weapon-quality", 100))),
      astrogemLv: Math.max(0, Math.min(100, getNumber(root, ".ap-astrogem-lv", 56))),

      ring1Rate: getSelect(root, ".ap-ring1-rate", "Mid"),
      ring1Dmg: getSelect(root, ".ap-ring1-dmg", "High"),
      ring2Rate: getSelect(root, ".ap-ring2-rate", "Mid"),
      ring2Dmg: getSelect(root, ".ap-ring2-dmg", "High"),

      braceletRate: getSelect(root, ".ap-bracelet-rate", "Mid"),
      braceletDmg: getSelect(root, ".ap-bracelet-dmg", "Low"),
      braceletRate2: getSelect(root, ".ap-bracelet-rate-2", "None"),
      braceletDmg2: getSelect(root, ".ap-bracelet-dmg-2", "None"),
      braceletAddA: getSelect(root, ".ap-bracelet-addA", "None"),
      braceletAddB: getSelect(root, ".ap-bracelet-addB", "None"),

      necklace: getSelect(root, ".ap-necklace", "Mid"),
      shPet: getSelect(root, ".ap-sh-pet", "High"),

      adrenaline: getSelect(root, ".ap-adrenaline", "4 Nodes"),
      adrenalineUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-adrenaline-uptime", 100))),
      adrenalineStone: getSelect(root, ".ap-adrenaline-stone", "0 Lv."),
      kbw: getSelect(root, ".ap-kbw", "4 Nodes"),
      kbwStone: getSelect(root, ".ap-kbw-stone", "0 Lv."),

      critRateDual: getCheckbox(root, ".ap-crit-rate-dual", true),
      critDmgDual: getCheckbox(root, ".ap-crit-dmg-dual", true),

      flashyAtk: getSelect(root, ".ap-flashy-atk", "Ancient 17P"),
      stableAtk: getSelect(root, ".ap-stable-atk", "None|0P"),

      critSyn1: getCheckbox(root, ".ap-crit-syn1", false),
      critSyn2: getCheckbox(root, ".ap-crit-syn2", false),
      critHitSyn1: getCheckbox(root, ".ap-crit-hit-syn-1", false),
      critHitSyn2: getCheckbox(root, ".ap-crit-hit-syn-2", false),
      backAttackRate: Math.max(0, Math.min(100, getNumber(root, ".ap-back-attack-rate", 90))),

      yearning: getCheckbox(root, ".ap-yearning", true),
      // Support's Flash Orb (Drops of Ether) - same "% of the fight it's
      // up" pattern as Adrenaline/Back-Attack Rate above, see
      // FLASH_ORB_FULL_CRIT_RATE's own comment for the assumed
      // engraving/stone combo baked into the full-uptime value. Only
      // meaningful while a Support is actually in the party - gated off
      // .ap-yearning the same way Support AP Buff Uptime already is (see
      // enforceGearSupportUptimeGate). Defaults to 0 (not used).
      flashOrbUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-flash-orb-uptime", 0))),
      evoKarmaRank: parseInt(getSelect(root, ".ap-evo-karma", "6"), 10) || 6,

      demonDmgPct: Math.max(0, Math.min(15, getNumber(root, ".ap-brace-demon-dmg", 7))),
      braceCritStatEquipped: Math.max(60, Math.min(120, getNumber(root, ".ap-brace-crit-stat-equipped", 60))),
      braceSurgeSpec: getCheckbox(root, ".ap-brace-spec-surge", false),

      // Gearing (Weapon Power / Attack Power) - feeds only the 5
      // WP/AP bracelet lines below, entirely separate from the Ark
      // Passive grid above. See the constants block above this function.
      // Upper bounds (1M WP, 2M Main Stat, 6K Flat AP) are sanity caps,
      // not real game limits - just enough headroom to keep a stray typo
      // from producing an absurd on-page number.
      gearWp: Math.max(0, Math.min(1000000, getNumber(root, ".ap-gear-wp", 259216))),
      // Weapon Power % used to be one freeform field baking Karma/
      // Enlightenment together with both earrings' WP% with nothing to
      // zero out - see gearWpPercentTotal above for why it's now split
      // into these two sources instead. Karmic Enlightenment is a Level
      // input (1-30, +0.1%/level) same as Astrogem's Level fields below;
      // the two Earring dropdowns match Attack Power's own Earrings row
      // exactly (gearApEarring1/2 below).
      gearWpKarmaLv: Math.max(0, Math.min(30, getNumber(root, ".ap-gear-wp-karma-lv", 30))),
      gearWpEarring1: getSelect(root, ".ap-gear-wp-earring1", "Mid"),
      gearWpEarring2: getSelect(root, ".ap-gear-wp-earring2", "Mid"),
      gearMainStat: Math.max(0, Math.min(2000000, getNumber(root, ".ap-gear-main-stat", 828668))),
      // % bonus to Main Stat GRANTED by Bracelet/Accessory "STR/DEX/INT"
      // candidate lines only, not to the stat entered above - same role
      // as Weapon Power % below, just for Main Stat. Sourced from
      // Legendary Pet Ranch (+1%) and costume set bonuses (Legendary
      // Skins +2% each up to 4, Epic Skins +1% each up to 4) - see the
      // constants block near the top of this file for where this used to
      // be a hardcoded constant. Default (9%) matches that constant's old
      // value: Pet Ranch + 4 Legendary Skins.
      gearMainStatPercent: Math.max(0, Math.min(15, getNumber(root, ".ap-gear-main-stat-pct", 9))),
      // Base AP % - split into its two separate sources (Gem total,
      // Ability Stone bonus) - see gearBaseApPercentTotal above for how
      // they're combined. Gem Base AP % is a free-typed SUM across all
      // your gems, not one gem's level (see that function's own
      // comment) - sanity-capped at 50 (well above any real total) to
      // catch a stray typo without pretending there's a real game-side
      // ceiling here.
      gearGemBaseAp: Math.max(0, Math.min(50, getNumber(root, ".ap-gear-gem-base-ap", 13.2))),
      gearAbilityStoneBaseAp: getCheckbox(root, ".ap-gear-ability-stone-base-ap", true),
      // Flat AP now covers accessories ONLY - Chaos Core: Attack's own
      // flat contribution is looked up automatically from the dropdown
      // below (gearChaosStarFlat) and added in wherever flatAp is used,
      // instead of being hand-added into this field. Default (390)
      // reflects a High-tier accessory roll rather than the old
      // default's Chaos Core figure.
      gearFlatAp: Math.max(0, Math.min(2000, getNumber(root, ".ap-gear-flat-ap", 390))),
      // Attack Power % used to be one hand-summed field (mirroring the
      // reference sheet's own Calc!N7, itself a hand-typed sum its
      // author computed once and pasted in). Split into its individual
      // sources instead - see gearAttackPowerPercentTotal below for how
      // they're combined - so nobody has to add these up by hand anymore.
      gearApEarring1: getSelect(root, ".ap-gear-ap-earring1", "High"),
      gearApEarring2: getSelect(root, ".ap-gear-ap-earring2", "High"),
      gearApKazeros: getCheckbox(root, ".ap-gear-ap-kazeros", false),
      gearApGuardian: getCheckbox(root, ".ap-gear-ap-guardian", false),
      gearApChaosStar: getSelect(root, ".ap-gear-ap-chaos-star", "None|0P"),
      // Astrogem Atk. Power Level - independent of the Additional
      // Damage group's Astrogem Level field above, see
      // gearAstrogemApPercent's own comment.
      gearAstrogemLv: Math.max(0, Math.min(100, getNumber(root, ".ap-gear-ap-astrogem-lv", 56))),
      // Catch-all for anything not individually listed (the reference
      // sheet's own comment ends its source list with "some in-raid
      // buffs", too variable/situational to enumerate) - defaults to 0
      // rather than baking in an assumed value nobody can see. Ceiling
      // raised 10 -> 50.
      gearApOther: Math.max(0, Math.min(50, getNumber(root, ".ap-gear-ap-other", 0))),
      // % of the fight Atropine is actually active, not a plain on/off -
      // see gearAttackPowerPercentTotal's own comment for how this
      // averages into the running Attack Power % total. Defaults to 0
      // (not used), same as the old checkbox's unchecked default.
      gearAtropineUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-gear-atropine-uptime", 0))),
      // Support's Strength Orb (Drops of Ether) - same "% of the fight
      // it's up" pattern as Atropine Uptime just above, see
      // STRENGTH_ORB_FULL_AP's own comment for the assumed engraving/
      // stone combo baked into the full-uptime value. Only meaningful
      // while a Support is actually in the party - see
      // enforceGearSupportUptimeGate, which gates this the same way it
      // already gates Support AP Buff Uptime off .ap-yearning. Defaults
      // to 0 (not used).
      gearStrengthOrbUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-gear-strength-orb-uptime", 0))),
      // No longer its own checkbox - whether Support's AP buff applies at
      // all is decided entirely by the Party & Positioning group's
      // "Support: Passionate Dance" toggle (.ap-yearning); reading that
      // directly means there's only one real checkbox for this fact
      // instead of two kept in sync.
      gearSupport: getCheckbox(root, ".ap-yearning", true),
      // Only matters while gearSupport is true (the field itself is
      // disabled in the UI otherwise, see enforceGearSupportUptimeGate).
      // Scales the SIZE of the buff, not whether it applies.
      gearSupportUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-gear-support-uptime", 98))),
    };
  }

  function roundDown(x, n) {
    const f = Math.pow(10, n);
    return Math.floor(x * f) / f;
  }

  // ----- Core computations -----
  function computeShared(inputs) {
    const critDmgTotal =
      CRIT_DMG_BASE +
      (RING_DMG_TABLE[inputs.ring1Dmg] || 0) +
      (RING_DMG_TABLE[inputs.ring2Dmg] || 0) +
      (BRACELET_DMG_TABLE[inputs.braceletDmg] || 0) +
      (BRACELET_DMG_TABLE[inputs.braceletDmg2] || 0) +
      (KBW_TABLE[inputs.kbw] || 0) +
      (KBW_STONE_TABLE[inputs.kbwStone] || 0) +
      STRIKE_CRIT_DMG;

    // Base on-crit damage - each Crit Hit Damage Synergy toggle adds 8%
    // multiplicatively, same mechanism, independent sources (e.g. party
    // buffs that increase on-crit damage rather than crit rate).
    let onCritDmgBase =
      (1 + (inputs.critRateDual ? 0.015 : 0)) *
        (1 + (inputs.critDmgDual ? 0.015 : 0)) *
        (1 + (FLASHY_ATK_TABLE[inputs.flashyAtk] || 0)) -
      1;
    if (inputs.critHitSyn1) {
      onCritDmgBase = (1 + onCritDmgBase) * 1.08 - 1;
    }
    if (inputs.critHitSyn2) {
      onCritDmgBase = (1 + onCritDmgBase) * 1.08 - 1;
    }
    const onCritDmgCritical = (1 + onCritDmgBase) * 1.12 - 1;

    const weaponQualityDmg = 0.1 + 0.00002 * inputs.weaponQuality * inputs.weaponQuality;
    const astrogemDmg = roundDown(inputs.astrogemLv * 8.0834, 0) / 10000;
    const addDmgBase =
      (SH_PET_TABLE[inputs.shPet] || 0) +
      weaponQualityDmg +
      (NECKLACE_ADD_TABLE[inputs.necklace] || 0) +
      (BRACELET_ADD_A_TABLE[inputs.braceletAddA] || 0) +
      (BRACELET_ADD_B_TABLE[inputs.braceletAddB] || 0) +
      stableAtkValue(inputs.stableAtk) +
      astrogemDmg;
    const addDmgMaster = addDmgBase + 0.085;

    const yearningEvo = inputs.yearning ? 0.14 : 0;
    const evoKarmaEvo = EVO_KARMA_MAP[inputs.evoKarmaRank] || 0;

    return {
      critDmgTotal,
      onCritDmgBase,
      onCritDmgCritical,
      addDmgBase,
      addDmgMaster,
      yearningEvo,
      evoKarmaEvo,
    };
  }

  // Isolated DPS gain from one flat Crit Dmg contributor (e.g. Keen Blunt
  // Weapon's engraving bonus or its Ability Stone), expressed as "% damage
  // you'd lose if this one line were removed and everything else (Crit
  // Rate, on-crit multipliers, Evo Dmg, Add Dmg) stayed exactly as-is".
  //
  // This works as a clean closed-form instead of a full counterfactual
  // recompute because the final multiplier is *linear* in critDmgTotal -
  // effCrit/onCrit/evo/add never depend on kbw or kbwStone, so:
  //   mult = [(1 - effCrit) + effCrit * (1 + onCrit) * critDmgTotal] * (1 + evo) * (1 + add)
  // is an affine function of critDmgTotal alone. The (1+evo)*(1+add) factor
  // is common to "with" and "without" and cancels out of the ratio, so it's
  // dropped entirely below - only the crit-dmg-bearing term matters.
  function marginalCritDmgGainPct(effCrit, onCrit, critDmgTotal, value) {
    if (!value) return 0;
    const withTerm = (1 - effCrit) + effCrit * (1 + onCrit) * critDmgTotal;
    const contribution = effCrit * (1 + onCrit) * value;
    const withoutTerm = withTerm - contribution;
    if (withoutTerm <= 0) return 0;
    return (contribution / withoutTerm) * 100;
  }

  // Keen Blunt Weapon's actual in-game downside: attacks have a 10% chance
  // to deal -20% damage, i.e. an expected-value multiplier of
  // 1 - 0.10*0.20 = 0.98 on every hit, independent of the Crit Dmg bonus
  // it grants. That EV hit applies to the WHOLE post-KBW damage total, not
  // just KBW's own slice of it, so it can't be folded into
  // marginalCritDmgGainPct's generic contribution/withoutTerm shape - the
  // malus has to land on withTerm before taking the ratio. The KBW Ability
  // Stone carries no such downside of its own, so it keeps using the plain
  // marginalCritDmgGainPct above.
  const KBW_EV_MALUS = 0.98;
  function kbwEngravingGainPct(effCrit, onCrit, critDmgTotal, kbwValue) {
    if (!kbwValue) return 0;
    const contribution = effCrit * (1 + onCrit) * kbwValue;
    const withoutTerm = (1 - effCrit) + effCrit * (1 + onCrit) * (critDmgTotal - kbwValue);
    const withTermAdjusted = (withoutTerm + contribution) * KBW_EV_MALUS;
    if (withoutTerm <= 0) return 0;
    return (withTermAdjusted / withoutTerm - 1) * 100;
  }

  function critRateTotal(inputs, keenSenseLv) {
    const c = roundDown((inputs.critStat * 0.03579099) / 100, 4);
    const d = RING_RATE_TABLE[inputs.ring1Rate] || 0;
    const e = RING_RATE_TABLE[inputs.ring2Rate] || 0;
    const f = BRACELET_RATE_TABLE[inputs.braceletRate] || 0;
    const g = BRACELET_RATE_TABLE[inputs.braceletRate2] || 0;
    const h = (ADRENALINE_TABLE[inputs.adrenaline] || 0) * (inputs.adrenalineUptime / 100);
    const i = KEEN_SENSE_CRIT_RATE[keenSenseLv] || 0;
    const k = STRIKE_CRIT_RATE;
    const n = inputs.critSyn1 ? 0.1 : 0;
    const o = inputs.critSyn2 ? 0.1 : 0;
    const p = (inputs.backAttackRate / 100) * 0.1;
    // Support's Flash Orb (Drops of Ether) - see FLASH_ORB_FULL_CRIT_RATE's
    // own comment for the Ether-effectiveness assumption baked into it.
    const q = (inputs.flashOrbUptime / 100) * FLASH_ORB_FULL_CRIT_RATE;
    return c + d + e + f + g + h + i + k + n + o + p + q;
  }

  function evoDmgTotal(keenSenseLv, limitBreakLv, shared) {
    return (
      shared.yearningEvo +
      shared.evoKarmaEvo +
      (KEEN_SENSE_EVO_DMG[keenSenseLv] || 0) +
      (LIMIT_BREAK_EVO_DMG[limitBreakLv] || 0) +
      STANDING_STRIKER_EVO_DMG
    );
  }

  function getKeystoneComponents(inputs, shared, keenSenseLv, limitBreakLv, keystone) {
    const S4 = critRateTotal(inputs, keenSenseLv);
    const T4 = S4 + 0.07;
    const S5 = Math.min(S4, 1);
    const T5 = Math.min(T4, 1);
    const S19 = evoDmgTotal(keenSenseLv, limitBreakLv, shared);
    const T19 = S19 + 0.2;

    let effCrit = S5;
    let onCrit = shared.onCritDmgBase;
    let evo = S19;
    let add = shared.addDmgBase;

    if (keystone === "critical") {
      onCrit = shared.onCritDmgCritical;
    } else if (keystone === "master") {
      effCrit = T5;
      add = shared.addDmgMaster;
    } else if (keystone === "pulverize") {
      evo = T19;
    }
    return { effCrit, onCrit, evo, add, rawCrit: keystone === "master" ? T4 : S4 };
  }

  function combinedMultiplier(inputs, shared, keenSenseLv, limitBreakLv, keystonePair) {
    let effCrit, onCrit, evo, add;
    if (keystonePair === "crit+master") {
      const comps = {
        master: getKeystoneComponents(inputs, shared, keenSenseLv, limitBreakLv, "master"),
        critical: getKeystoneComponents(inputs, shared, keenSenseLv, limitBreakLv, "critical"),
      };
      effCrit = comps.master.effCrit;
      onCrit = comps.critical.onCrit;
      evo = comps.master.evo;
      add = comps.master.add;
    } else if (keystonePair === "crit+pulv") {
      const comps = {
        critical: getKeystoneComponents(inputs, shared, keenSenseLv, limitBreakLv, "critical"),
        pulverize: getKeystoneComponents(inputs, shared, keenSenseLv, limitBreakLv, "pulverize"),
      };
      effCrit = comps.critical.effCrit;
      onCrit = comps.critical.onCrit;
      evo = comps.pulverize.evo;
      add = comps.critical.add;
    } else if (keystonePair === "master+pulv") {
      const comps = {
        master: getKeystoneComponents(inputs, shared, keenSenseLv, limitBreakLv, "master"),
        pulverize: getKeystoneComponents(inputs, shared, keenSenseLv, limitBreakLv, "pulverize"),
      };
      effCrit = comps.master.effCrit;
      onCrit = shared.onCritDmgBase;
      evo = comps.pulverize.evo;
      add = comps.master.add;
    }

    // No trailing party-synergy scalar here (there was one - 0.85 * a
    // 12%/18% "Damage Synergy" term swung by Crit Syn 1/2) - removed
    // because it's a constant multiplied onto every one of the 9 cells
    // equally, so it can never change which cell is best or the %-of-best
    // shown for any of them. Confirmed by direct computation before
    // removing: toggling it left every cell's pctOfBest and the best-cell
    // identity bit-for-bit identical. Crit Syn 1/2 below still do
    // something real - their +10% Crit Rate feeds into effCrit, which
    // genuinely interacts with the Master keystone's crit-rate cap.
    return ((1 - effCrit) + effCrit * shared.critDmgTotal * (1 + onCrit)) * (1 + evo) * (1 + add);
  }

  function computeGridAndSummary(inputs) {
    const shared = computeShared(inputs);
    const cells = [];
    let best = null;

    EVOLUTION_SPLITS.forEach((split) => {
      COMBINED_KEYSTONES.forEach((pair) => {
        const mult = combinedMultiplier(inputs, shared, split.keenSense, split.limitBreak, pair);
        let effCrit, rawCrit;
        if (pair === "crit+master") {
          const comp = getKeystoneComponents(inputs, shared, split.keenSense, split.limitBreak, "master");
          effCrit = comp.effCrit;
          rawCrit = comp.rawCrit;
        } else if (pair === "crit+pulv") {
          const comp = getKeystoneComponents(inputs, shared, split.keenSense, split.limitBreak, "critical");
          effCrit = comp.effCrit;
          rawCrit = comp.rawCrit;
        } else if (pair === "master+pulv") {
          const comp = getKeystoneComponents(inputs, shared, split.keenSense, split.limitBreak, "master");
          effCrit = comp.effCrit;
          rawCrit = comp.rawCrit;
        }
        const cell = { split, keystone: pair, mult, effCrit, rawCrit };
        cells.push(cell);
        if (!best || mult > best.mult) best = cell;
      });
    });

    const maxMult = best ? best.mult : 1;
    cells.forEach(c => c.pctOfBest = (c.mult / maxMult) * 100);

    // Keen Blunt Weapon's engraving bonus and its Ability Stone are both
    // flat adds into critDmgTotal (see computeShared) - pull their two
    // values back out here so each can be shown as its own isolated %
    // damage gain rather than only ever appearing baked into the combined
    // Crit Dmg stat.
    const kbwValue = KBW_TABLE[inputs.kbw] || 0;
    const kbwStoneValue = KBW_STONE_TABLE[inputs.kbwStone] || 0;
    const kbwUsed = inputs.kbw !== "Not Used" && kbwValue > 0;
    const kbwStoneUsed = kbwStoneValue > 0;

    // Base stats for verification - effCrit/onCrit here match the "no
    // keystone selected" values baseStats already reports above (S5, the
    // capped raw Crit Rate; onCritDmgBase, the pre-Critical-keystone on-crit
    // multiplier), so the gain % is consistent with the rest of the card.
    const baseEffCrit = Math.min(critRateTotal(inputs, 0), 1);
    const baseStats = {
      critRate: critRateTotal(inputs, 0) * 100,
      critDmg: shared.critDmgTotal,
      onCritDmg: shared.onCritDmgBase * 100,
      evoDmg: (shared.yearningEvo + shared.evoKarmaEvo + STANDING_STRIKER_EVO_DMG) * 100,
      addDmg: shared.addDmgBase * 100,
      kbwUsed,
      kbwStoneUsed,
      kbwGain: kbwEngravingGainPct(baseEffCrit, shared.onCritDmgBase, shared.critDmgTotal, kbwValue),
      kbwStoneGain: marginalCritDmgGainPct(baseEffCrit, shared.onCritDmgBase, shared.critDmgTotal, kbwStoneValue),
    };

    // Best Setup stats (only things affected by nodes)
    let bestStats = null;
    if (best) {
      const splitLabel = best.split.label;
      const keystoneLabels = KEYSTONE_LABELS;
      const { keenSense, limitBreak } = best.split;
      let comps;
      if (best.keystone === "crit+master") {
        comps = {
          critical: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "critical"),
          master: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "master"),
        };
        bestStats = {
          label: splitLabel + " + " + keystoneLabels[best.keystone],
          rawCrit: comps.master.rawCrit * 100,
          onCritDmg: comps.critical.onCrit * 100,
          evoDmg: comps.master.evo * 100,
          addDmg: comps.master.add * 100,
        };
      } else if (best.keystone === "crit+pulv") {
        comps = {
          critical: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "critical"),
          pulverize: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "pulverize"),
        };
        bestStats = {
          label: splitLabel + " + " + keystoneLabels[best.keystone],
          rawCrit: comps.critical.rawCrit * 100,
          onCritDmg: comps.critical.onCrit * 100,
          evoDmg: comps.pulverize.evo * 100,
          addDmg: comps.critical.add * 100,
        };
      } else if (best.keystone === "master+pulv") {
        comps = {
          master: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "master"),
          pulverize: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "pulverize"),
        };
        bestStats = {
          label: splitLabel + " + " + keystoneLabels[best.keystone],
          rawCrit: comps.master.rawCrit * 100,
          onCritDmg: shared.onCritDmgBase * 100,
          evoDmg: comps.pulverize.evo * 100,
          addDmg: comps.master.add * 100,
        };
      }

      // Same marginal-gain calc as the Base card, just using the winning
      // cell's own effCrit (best.effCrit) and on-crit multiplier
      // (bestStats.onCritDmg, already resolved per-branch above) instead of
      // the no-keystone baseline ones.
      bestStats.kbwUsed = kbwUsed;
      bestStats.kbwStoneUsed = kbwStoneUsed;
      bestStats.kbwGain = kbwEngravingGainPct(best.effCrit, bestStats.onCritDmg / 100, shared.critDmgTotal, kbwValue);
      bestStats.kbwStoneGain = marginalCritDmgGainPct(best.effCrit, bestStats.onCritDmg / 100, shared.critDmgTotal, kbwStoneValue);
    }

    return { cells, best, baseStats, bestStats };
  }

  // ----- Bracelet Line Comparison -----
  //
  // Answers a different question than the grid above: not "what's my best
  // Ark Passive setup", but "of the bracelet lines I have data for, which
  // is worth the most DPS". Each candidate line's % is computed against
  // your current Best Setup (whichever split+keystone pair the grid above
  // picked) but with your OWN bracelet's Crit Rate/Crit Dmg/Additional Dmg
  // contributions temporarily zeroed out first - so a candidate line's %
  // reflects that line's value in isolation, as if it were the only line
  // on your bracelet, not stacked on top of whatever you already have.
  // That's the only way to compare candidates against each other on equal
  // footing (you can't actually run two bracelets at once).
  //
  // Formulas verified against Arsonistic's "Brace" sheet (Brace!C2:E22),
  // cross-checked against the sheet's own cached values where available,
  // with the following deliberate simplifications - each is a real gap
  // from the sheet's more complete model, not just an approximation of
  // implementation detail:
  //   - Damage +4.5/5/5.5% & Cooldown +2%: the flat Damage % discounted by
  //     a flat 1.35% assumed cast-rate cost of the +2% Cooldown downside
  //     (see SKILL_CD_PENALTY above) - a fixed estimate, not a live
  //     Swiftness/CDR calculation, so it'll drift if your own cast rate
  //     loss from the downside is far from that assumption.
  //   - Outgoing Dmg + Damage to Staggered: sheet takes a live "% of DPS
  //     during Stagger" input; fixed at 5% here (the sheet's own default).
  //   - Back Attack Damage: sheet derives this from a per-skill Front/Back DPS
  //     breakdown specific to your class's skill build; fixed at 97% of
  //     DPS coming from a Back Attack skil instead. Front Damage and
  //     Non-positional Dmg need that same per-skill breakdown with no
  //     comparable fixed-% stand-in, so they're left out entirely rather
  //     than guessed at.
  //   - Additional Damage vs Demon/Archdemon: the sheet's own Demon Dmg %
  //     value is exposed as a direct input here (.ap-brace-demon-dmg)
  //     instead of being derived.
  //   - Spec +80/100/120: the sheet ties this to your own profile's live
  //     Spec stat; fixed at SPEC_BASE (1735) here instead, since this
  //     calculator doesn't otherwise track Spec as a build stat. RE vs
  //     Surge Deathblade use structurally different formulas (see
  //     SPEC_BASE and friends above) picked by the radio pair living
  //     alongside Demon Dmg % / Crit Stat in .ap-brace-compare-inputs.
  function computeBraceletComparison(inputs) {
    const gridResult = computeGridAndSummary(inputs);
    const best = gridResult.best;
    if (!best) return [];
    const { keenSense, limitBreak } = best.split;
    const pair = best.keystone;

    // Baseline: your actual Best Setup, but with every bracelet-sourced
    // Crit Rate/Crit Dmg/Additional Dmg field reset to None first -
    // including critRateDual/critDmgDual, since those two checkboxes ARE
    // the bracelet Crit Rate/Crit Dmg lines' own +1.5% Crit Hit Dmg
    // synergy (see the "Crit Hit Damage -> Bracelet" checkboxes in the
    // HTML) - leaving them at the user's real state here would silently
    // keep crediting a bonus this baseline is supposed to be excluding.
    // Also strips the crit stat your CURRENT bracelet's own substat roll
    // contributes to the 658-style Crit Stat total (see .ap-brace-crit-stat-
    // equipped) - without this, the Crit Stat +80/100/120 candidate below
    // would silently double-count whatever your equipped bracelet already
    // grants, the same double-counting bug the dual checkboxes had before.
    const inputsNB = Object.assign({}, inputs, {
      braceletRate: "None",
      braceletDmg: "None",
      braceletRate2: "None",
      braceletDmg2: "None",
      braceletAddA: "None",
      braceletAddB: "None",
      critRateDual: false,
      critDmgDual: false,
      critStat: Math.max(0, inputs.critStat - inputs.braceCritStatEquipped),
    });
    const sharedNB = computeShared(inputsNB);
    const baselineMult = combinedMultiplier(inputsNB, sharedNB, keenSense, limitBreak, pair);
    // The Additional Damage candidates' denominator has to match whatever
    // "add" combinedMultiplier actually used for the winning pair - Master
    // keystones add a flat +8.5% Add Dmg on top of addDmgBase (addDmgMaster),
    // non-Master pairs (crit+pulv) don't. Using addDmgBase unconditionally
    // here was the bug that made these two rows disagree with the sheet
    // whenever Master won the grid - confirmed against the sheet's cached
    // Brace!C19:E19 (2.06/2.40/2.75%) vs the old 2.19/2.55/2.92%.
    const addDmgBaseline = pair.indexOf("master") !== -1 ? sharedNB.addDmgMaster : sharedNB.addDmgBase;

    // Best-combo "flip" check: a candidate can only ever change which of the
    // 9 split+keystone cells wins if it feeds into effCrit/onCrit/evo/add -
    // i.e. Crit Rate, Crit Dmg, Crit Stat, and Additional Damage. The flat
    // standalone lines (Damage+CD, Outgoing, Stagger, Back Dmg) are applied
    // as a uniform multiplier outside the 9-cell grid entirely, so they
    // structurally can't change the argmax - no flip check needed for those.
    const currentBestKey = pair + "|" + best.split.key;
    function bestPairFor(candidateInputs) {
      const candShared = computeShared(candidateInputs);
      let bestKey = null;
      let bestM = -Infinity;
      EVOLUTION_SPLITS.forEach((split) => {
        COMBINED_KEYSTONES.forEach((kp) => {
          const m = combinedMultiplier(candidateInputs, candShared, split.keenSense, split.limitBreak, kp);
          if (m > bestM) {
            bestM = m;
            bestKey = kp + "|" + split.key;
          }
        });
      });
      return bestKey;
    }
    // Checked at Mid tier only - this is meant as a light heads-up, not a
    // precise per-tier verdict, and moot anyway once you're running more
    // than one line at a time.
    function checkFlip(mutateFn) {
      const cloned = Object.assign({}, inputsNB);
      mutateFn(cloned);
      return bestPairFor(cloned) !== currentBestKey;
    }

    // Crit Rate/Crit Dmg candidates reuse the exact same computeShared +
    // critRateTotal + combinedMultiplier machinery as the grid above -
    // just with one bracelet field swapped from "None" to the candidate
    // tier, and (for the two lines that carry it) the matching dual
    // checkbox flipped on - the same computeShared formula the checkboxes
    // themselves drive, rather than a second hand-rolled copy of it.
    function critLikeGain(field, tier, dualFlag) {
      const cloned = Object.assign({}, inputsNB);
      cloned[field] = tier;
      if (dualFlag) cloned[dualFlag] = true;
      const shared = computeShared(cloned);
      const mult = combinedMultiplier(cloned, shared, keenSense, limitBreak, pair);
      return mult / baselineMult - 1;
    }

    function tiers(fn) {
      return { low: fn("Low"), mid: fn("Mid"), high: fn("High") };
    }

    // Raw Crit Stat delta candidate (the sheet's "Crit +80/100/120" row) -
    // mechanically identical to the Crit Rate % Line above once converted,
    // just fed in as a stat delta rather than a direct rate %, and using
    // the exact tier values (no Low/Mid/High table lookup needed).
    function critStatGain(statDelta) {
      const cloned = Object.assign({}, inputsNB);
      cloned.critStat = inputsNB.critStat + statDelta;
      const mult = combinedMultiplier(cloned, sharedNB, keenSense, limitBreak, pair);
      return mult / baselineMult - 1;
    }

    const demonDmgPct = inputs.demonDmgPct / 100;

    // Builds the Low/Mid/High portion of a label as plain strings mixed
    // with colored-token objects, so renderBraceletComparison can color
    // just the numbers that vary by tier (matching the reference
    // tooltip's per-line coloring) without regex-parsing label text back
    // apart to find them.
    function trip(low, mid, high) {
      return [
        { tier: "low", text: low },
        "/",
        { tier: "mid", text: mid },
        "/",
        { tier: "high", text: high },
      ];
    }

    const rows = [
      {
        label: ["Crit Rate +", ...trip("3.4", "4.2", "5"), "% & Crit Hit Damage +", { tier: "fixed", text: "1.5" }, "%"],
        ...tiers((t) => critLikeGain("braceletRate", t, "critRateDual")),
        flipsBest: checkFlip((c) => { c.braceletRate = "Mid"; c.critRateDual = true; }),
      },
      {
        label: ["Crit Damage +", ...trip("6.8", "8.4", "10"), "% & Crit Hit Damage +", { tier: "fixed", text: "1.5" }, "%"],
        ...tiers((t) => critLikeGain("braceletDmg", t, "critDmgDual")),
        flipsBest: checkFlip((c) => { c.braceletDmg = "Mid"; c.critDmgDual = true; }),
      },
      {
        label: ["Crit Rate +", ...trip("3.4", "4.2", "5"), "%"],
        ...tiers((t) => critLikeGain("braceletRate", t, null)),
        flipsBest: checkFlip((c) => { c.braceletRate = "Mid"; }),
      },
      {
        label: ["Crit Damage +", ...trip("6.8", "8.4", "10"), "%"],
        ...tiers((t) => critLikeGain("braceletDmg", t, null)),
        flipsBest: checkFlip((c) => { c.braceletDmg = "Mid"; }),
      },
      {
        label: ["Crit Stat +", ...trip("80", "100", "120")],
        note: "Set your current bracelet so this isn't double-counted.",
        low: critStatGain(CRIT_STAT_TABLE.Low),
        mid: critStatGain(CRIT_STAT_TABLE.Mid),
        high: critStatGain(CRIT_STAT_TABLE.High),
        flipsBest: checkFlip((c) => { c.critStat = inputsNB.critStat + CRIT_STAT_TABLE.Mid; }),
      },
      {
        label: ["Outgoing Damage +", ...trip("4.5", "5", "5.5"), "% & Skill Cooldown +", { downside: true, text: "2" }, "%"],
        note: "Estimated damage accounts for +CDR% penalty.",
        // Surge uses the temporary flat -1 override (see
        // DAMAGE_CD_SURGE_TABLE above) instead of the divided-by-penalty
        // figures RE still uses.
        low: inputs.braceSurgeSpec ? DAMAGE_CD_SURGE_TABLE.Low : DAMAGE_CD_TABLE.Low,
        mid: inputs.braceSurgeSpec ? DAMAGE_CD_SURGE_TABLE.Mid : DAMAGE_CD_TABLE.Mid,
        high: inputs.braceSurgeSpec ? DAMAGE_CD_SURGE_TABLE.High : DAMAGE_CD_TABLE.High,
      },
      {
        label: ["Outgoing Damage +", ...trip("2", "2.5", "3"), "% & Damage to Staggered +", ...trip("4", "4.5", "5"), "%"],
        note: "Assumes " + (STAGGER_DPS_SHARE * 100).toFixed(0) + "% of DPS happens during stagger.",
        low: OUTGOING_DMG_TABLE.Low + STAGGER_DMG_TABLE.Low * STAGGER_DPS_SHARE,
        mid: OUTGOING_DMG_TABLE.Mid + STAGGER_DMG_TABLE.Mid * STAGGER_DPS_SHARE,
        high: OUTGOING_DMG_TABLE.High + STAGGER_DMG_TABLE.High * STAGGER_DPS_SHARE,
      },
      {
        label: ["Outgoing Damage +", ...trip("2", "2.5", "3"), "%"],
        low: OUTGOING_DMG_TABLE.Low,
        mid: OUTGOING_DMG_TABLE.Mid,
        high: OUTGOING_DMG_TABLE.High,
      },
      {
        id: "addB",
        label: ["Additional Damage +", ...trip("2.5", "3", "3.5"), "% & Dmg vs Demon/Archdemon +", { tier: "fixed", text: "2.5" }, "%"],
        note: "Compare to Additional Damage line for value vs regular foes.",
        low: (BRACELET_ADD_B_TABLE.Low / (1 + addDmgBaseline) + 1) * (DEMON_DMG_ADD / (1 + demonDmgPct) + 1) - 1,
        mid: (BRACELET_ADD_B_TABLE.Mid / (1 + addDmgBaseline) + 1) * (DEMON_DMG_ADD / (1 + demonDmgPct) + 1) - 1,
        high: (BRACELET_ADD_B_TABLE.High / (1 + addDmgBaseline) + 1) * (DEMON_DMG_ADD / (1 + demonDmgPct) + 1) - 1,
        flipsBest: checkFlip((c) => { c.braceletAddB = "Mid"; }),
      },
      {
        id: "addA",
        label: ["Additional Damage +", ...trip("3", "3.5", "4"), "%"],
        low: BRACELET_ADD_A_TABLE.Low / (1 + addDmgBaseline),
        mid: BRACELET_ADD_A_TABLE.Mid / (1 + addDmgBaseline),
        high: BRACELET_ADD_A_TABLE.High / (1 + addDmgBaseline),
        flipsBest: checkFlip((c) => { c.braceletAddA = "Mid"; }),
      },
      {
        label: ["Back Attack Damage +", ...trip("2.5", "3", "3.5"), "%"],
        note: "Assumes " + (BACK_ATTACK_DPS_SHARE * 100).toFixed(0) + "% of DPS comes from back attack skills.",
        low: BACK_DMG_TABLE.Low * BACK_ATTACK_DPS_SHARE,
        mid: BACK_DMG_TABLE.Mid * BACK_ATTACK_DPS_SHARE,
        high: BACK_DMG_TABLE.High * BACK_ATTACK_DPS_SHARE,
      },
    ];

    // Spec +80/100/120: RE and Surge Deathblade share the same formula
    // (see the constants/helper above), differing by damage share and
    // Awakening share - picked by the little radio pair sharing the
    // Demon Dmg % / Crit Stat inputs row rather than mixed into the rest
    // of the crit-focused inputs.
    {
      const isSurge = !!inputs.braceSurgeSpec;
      const cfg = isSurge ? SURGE_DEATHBLADE_SPEC : RE_DEATHBLADE_SPEC;
      const k = specGainPerPoint(deathbladeSpecMultiplier, cfg.share, cfg.awakeningShare);
      // One small hover tag per named build variant (111/313 for RE,
      // 222/333 for Surge), each independently showing that build's own
      // tier values on hover rather than one shared note/icon for all of
      // them.
      const buildTags = cfg.builds.map((b) => {
        const bk = specGainPerPoint(deathbladeSpecMultiplier, b.share, cfg.awakeningShare);
        const tiers = [80, 100, 120].map((v) => formatPctBare(bk * v)).join("/");
        return { tag: b.tag, tooltip: b.tag + " build (" + (b.share * 100).toFixed(0) + "% share): " + tiers };
      });
      rows.push({
        id: "spec",
        label: ["Spec +", ...trip("80", "100", "120")],
        low: k * 80,
        mid: k * 100,
        high: k * 120,
        buildTags,
        // Both RE and Surge are now pure damage-share models (the CDR
        // term is gone entirely, not just for RE) - so this line only
        // reflects each build's direct damage share and misses whatever
        // Spec does outside raw DPS (e.g. cooldown/meter effects) for
        // either class. Shown as a small always-visible tag with the
        // explanation in its hover tooltip rather than a permanent note
        // block under the table.
        specDmgOnly: true,
        specDmgOnlyNote: "This line only reflects direct damage share from Spec - it doesn't capture any non-damage effects Spec offers.",
      });
    }

    // ----- Weapon Power / Attack Power lines (Brace!C6:E10) -----
    // Structurally different from every row above: those all feed into
    // effCrit/onCrit/evo/add and get compared against baselineMult (the
    // Ark Passive grid's own multiplier). These 5 instead scale a
    // completely separate multiplicative layer - Attack Power - computed
    // straight from the Gearing inputs (see the constants block near the
    // top of this file), independent of which keystone/split wins the
    // grid above. No flip check needed for the same reason Back Attack
    // Damage above doesn't have one: this layer can't touch effCrit/
    // onCrit/evo/add at all.
    {
      const wp = inputs.gearWp;
      const mainStat = inputs.gearMainStat;
      const baseApMult = 1 + gearBaseApPercentTotal(inputs) / 100;
      // Flat AP = accessories (the manual field) + Chaos Core: Attack's
      // own flat contribution, looked up from its dropdown - see that
      // table's own comment.
      const flatAp = inputs.gearFlatAp + gearChaosStarFlat(inputs.gearApChaosStar);
      // Atropine and Adrenaline's own AP contribution are folded into
      // gearAttackPowerPercentTotal itself now - see that function's
      // own comment for why.
      const percentApMult = 1 + gearAttackPowerPercentTotal(inputs) / 100;
      const wpPercentMult = 1 + gearWpPercentTotal(inputs) / 100;
      const mainStatPercentMult = 1 + inputs.gearMainStatPercent / 100;
      const supApBuff = supportApBuff(inputs, wp, mainStat, baseApMult);
      const baselineAp = gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult, supApBuff);

      // Require real WP and Main Stat values, not just a nonzero
      // baseline - Flat AP alone can make baselineAp > 0 even while one
      // of them is blank/0 (e.g. mid-edit), which would otherwise let
      // these 5 rows render off a nonsensical partial state.
      if (wp > 0 && mainStat > 0 && baselineAp > 0) {
        const statGain = (delta) =>
          gearApTotal(wp, mainStat + delta * mainStatPercentMult, baseApMult, flatAp, percentApMult, supApBuff) /
            baselineAp -
          1;
        const wpGain = (deltaWp) =>
          gearApTotal(wp + deltaWp * wpPercentMult, mainStat, baseApMult, flatAp, percentApMult, supApBuff) / baselineAp - 1;

        rows.push({
          label: ["STR/DEX/INT +", ...trip("12000", "14000", "16000")],
          low: statGain(12000),
          mid: statGain(14000),
          high: statGain(16000),
        });
        rows.push({
          label: ["Weapon Power +", ...trip("7200", "8100", "9000")],
          low: wpGain(7200),
          mid: wpGain(8100),
          high: wpGain(9000),
        });
        rows.push({
          label: [
            "On hit, Weapon Power +",
            ...trip("1160", "1320", "1480"),
            ", Atk/Move Speed +",
            { tier: "fixed", text: "1" },
            "% for 10s (max 6x)",
          ],
          note:
            "Assumes " +
            ONHIT_WP_STACK_ASSUMPTION +
            " of 6 max stacks on average. Atk/Move Speed part is ignored.",
          low: wpGain(1160 * ONHIT_WP_STACK_ASSUMPTION),
          mid: wpGain(1320 * ONHIT_WP_STACK_ASSUMPTION),
          high: wpGain(1480 * ONHIT_WP_STACK_ASSUMPTION),
        });
        rows.push({
          label: [
            "Weapon Power +",
            ...trip("6900", "7800", "8700"),
            " & on hit, +",
            ...trip("130", "140", "150"),
            " (30s CD, max 30x)",
          ],
          note: "Assumes a " + PERIODIC_WP_FIGHT_MINUTES + "-minute fight duration.",
          low: wpGain(6900 + periodicWpAvgBonus(PERIODIC_WP_FIGHT_MINUTES, 130)),
          mid: wpGain(7800 + periodicWpAvgBonus(PERIODIC_WP_FIGHT_MINUTES, 140)),
          high: wpGain(8700 + periodicWpAvgBonus(PERIODIC_WP_FIGHT_MINUTES, 150)),
        });
        rows.push({
          label: [
            "Weapon Power +",
            ...trip("7200", "8100", "9000"),
            " & >50% HP: on hit, +",
            ...trip("2000", "2200", "2400"),
            " for 5s",
          ],
          note: "Assumes " + (HP_GATED_WP_UPTIME * 100).toFixed(0) + "% buff uptime.",
          low: wpGain(7200 + 2000 * HP_GATED_WP_UPTIME),
          mid: wpGain(8100 + 2200 * HP_GATED_WP_UPTIME),
          high: wpGain(9000 + 2400 * HP_GATED_WP_UPTIME),
        });
      }
    }

    rows.sort((a, b) => b.mid - a.mid);

    // The Archdemon line's displayed Mid value already assumes you're
    // fighting a Demon/Archdemon target, which most boss fights aren't -
    // so a pure numeric sort tends to rank it above the plain Additional
    // Damage line it's really just a variant of, plus a demon-only bonus
    // that often doesn't apply. Force it to always sort directly below
    // that line instead, every time, so it doesn't read as a strictly
    // better pick by default.
    const addBIdx = rows.findIndex((r) => r.id === "addB");
    const addAIdx = rows.findIndex((r) => r.id === "addA");
    if (addBIdx !== -1 && addAIdx !== -1) {
      const [addBRow] = rows.splice(addBIdx, 1);
      const insertAt = rows.findIndex((r) => r.id === "addA") + 1;
      rows.splice(insertAt, 0, addBRow);
    }

    return rows;
  }

  // ----- Accessory Line Comparison -----
  // Same idea as computeBraceletComparison above ("of the lines I have
  // data for, which is worth the most"), split into 3 slot-shaped panels
  // (Necklace / Earrings / Rings) plus a 4th "Any Accessory Slot" group
  // for the sheet's 3 universal lines.
  //
  // Matches the Bracelet panel's own methodology exactly (a previous pass
  // deliberately diverged from this - "valued as an addition on top of
  // your full actual current gear" - which double-counts whatever your
  // real currently-equipped necklace/rings already contribute, silently
  // undervaluing every candidate through the same diminishing-returns
  // math a stacked calculation always hits; reverted to the Bracelet
  // precedent below): Necklace and Rings each get baselined against your
  // Best Setup with THAT slot's own tracked field(s) zeroed first
  // (.ap-necklace / .ap-ring1-rate+dmg/.ap-ring2-rate+dmg - the same
  // fields that feed the overall DPS calc elsewhere in this file), then
  // a candidate tier is valued as if it were that slot's only line,
  // exactly like every Bracelet row's critLikeGain. Only that one slot's
  // fields get zeroed per panel - Necklace's baseline keeps your actual
  // current rings, and vice versa, since those are unrelated real stats.
  //
  // Earrings and "Any Accessory Slot" need none of this: they run off
  // the Gearing inputs (Weapon Power/Main Stat/Attack Power% etc.)
  // directly, which are meant to be your true totals already - there's
  // no separate "current earring" tracked field to double-count, same as
  // the Bracelet panel's own 5 WP/AP rows.
  //
  // Combo columns (LL/ML/MM/HL/HM/HH) reproduce the sheet's own
  // asymmetric 6-column layout for a slot's 2 possible lines rolled
  // together on the same piece (or, for Rings, your pair of pieces) -
  // see comboSix() below for the exact derivation. "Any Accessory Slot"
  // intentionally has none, same as the sheet's own note: those 3 lines
  // can land on any of 5 pieces, so a full combo set would be enormous
  // without being any more decision-relevant.
  function computeAccessoryComparison(inputs) {
    const gridResult = computeGridAndSummary(inputs);
    const best = gridResult.best;
    if (!best) return { necklace: [], earrings: [], rings: [], universal: [] };
    const { keenSense, limitBreak } = best.split;
    const pair = best.keystone;

    function trip(low, mid, high) {
      return [
        { tier: "low", text: low },
        "/",
        { tier: "mid", text: mid },
        "/",
        { tier: "high", text: high },
      ];
    }

    // Sheet's own asymmetric 6-column combo layout (Acc!F:K) for 2 lines
    // (a, b) rolled on the same piece/pair. LL/MM/HH are symmetric - the
    // same value regardless of which line's tier is named first - so the
    // sheet computes them once and shows them only under the FIRST line's
    // row; ML/HL/HM aren't symmetric (a Low + b Mid != a Mid + b Low), so
    // each line gets its own version and the first line's row keeps the
    // "this line's own tier is the bigger one" reading (M/H) while the
    // second's row keeps the "this line's own tier is the smaller one"
    // reading (L) - matching Acc!G2 vs Acc!G3's own differing formulas.
    // {a,b} are each {low,mid,high} candidate fraction triples.
    function comboSix(a, b) {
      return {
        first: {
          LL: (1 + a.low) * (1 + b.low) - 1,
          ML: (1 + b.low) * (1 + a.mid) - 1,
          MM: (1 + a.mid) * (1 + b.mid) - 1,
          HL: (1 + b.low) * (1 + a.high) - 1,
          HM: (1 + b.mid) * (1 + a.high) - 1,
          HH: (1 + a.high) * (1 + b.high) - 1,
        },
        second: {
          ML: (1 + a.low) * (1 + b.mid) - 1,
          HL: (1 + a.low) * (1 + b.high) - 1,
          HM: (1 + a.mid) * (1 + b.high) - 1,
        },
      };
    }

    // ----- Necklace: zero out ONLY .ap-necklace's own tracked tier -----
    const necklaceNB = Object.assign({}, inputs, { necklace: "None" });
    const sharedNecklaceNB = computeShared(necklaceNB);
    const addDmgBaselineNecklaceNB =
      pair.indexOf("master") !== -1 ? sharedNecklaceNB.addDmgMaster : sharedNecklaceNB.addDmgBase;
    const necklaceAdd = {
      low: ACC_NECKLACE_ADD_TABLE.Low / (1 + addDmgBaselineNecklaceNB),
      mid: ACC_NECKLACE_ADD_TABLE.Mid / (1 + addDmgBaselineNecklaceNB),
      high: ACC_NECKLACE_ADD_TABLE.High / (1 + addDmgBaselineNecklaceNB),
    };
    // Outgoing Damage isn't tracked as a current-gear field anywhere in
    // this file (no ".ap-necklace-out" input exists to zero) - a pure
    // standalone multiplier with nothing to double-count, same treatment
    // as the Bracelet panel's own standalone Outgoing Damage line.
    const necklaceOut = { low: ACC_NECKLACE_OUT_TABLE.Low, mid: ACC_NECKLACE_OUT_TABLE.Mid, high: ACC_NECKLACE_OUT_TABLE.High };
    const necklaceCombos = comboSix(necklaceAdd, necklaceOut);
    const necklace = [
      {
        label: ["Additional Damage +", ...trip("0.7", "1.6", "2.6"), "%"],
        ...necklaceAdd,
        combos: necklaceCombos.first,
      },
      {
        label: ["Outgoing Damage +", ...trip("0.55", "1.2", "2"), "%"],
        ...necklaceOut,
        combos: necklaceCombos.second,
      },
    ];

    // ----- Rings: zero BOTH ring slots for the baseline (mirrors the
    // Bracelet panel zeroing braceletRate + braceletRate2 together) -----
    const ringsNB = Object.assign({}, inputs, {
      ring1Rate: "None",
      ring1Dmg: "None",
      ring2Rate: "None",
      ring2Dmg: "None",
    });
    const sharedRingsNB = computeShared(ringsNB);
    const baselineMultRingsNB = combinedMultiplier(ringsNB, sharedRingsNB, keenSense, limitBreak, pair);
    // Crit Rate: RING_RATE_TABLE is an exact match to the sheet's own
    // candidate figures (see that table's comment above), so this can
    // swap ring1Rate straight to a tier name - identical shape to the
    // Bracelet panel's critLikeGain.
    function ringRateGain(tier) {
      const cloned = Object.assign({}, ringsNB, { ring1Rate: tier });
      const shared = computeShared(cloned);
      const mult = combinedMultiplier(cloned, shared, keenSense, limitBreak, pair);
      return mult / baselineMultRingsNB - 1;
    }
    // Crit Damage: ACC_RING_DMG_TABLE's candidate figures differ slightly
    // from what a real equipped ring contributes via RING_DMG_TABLE (see
    // ACC_RING_DMG_TABLE's own comment) - swapping ring1Dmg to a tier
    // name would silently pull the wrong table, so this adds the
    // candidate's own magnitude as a manual critDmgTotal delta on top of
    // the already-stripped baseline instead.
    function ringDmgGain(dmgPct) {
      if (!dmgPct) return 0;
      const shared = Object.assign({}, sharedRingsNB, { critDmgTotal: sharedRingsNB.critDmgTotal + dmgPct });
      const mult = combinedMultiplier(ringsNB, shared, keenSense, limitBreak, pair);
      return mult / baselineMultRingsNB - 1;
    }
    const ringRate = {
      low: ringRateGain("Low"),
      mid: ringRateGain("Mid"),
      high: ringRateGain("High"),
    };
    const ringDmg = {
      low: ringDmgGain(ACC_RING_DMG_TABLE.Low),
      mid: ringDmgGain(ACC_RING_DMG_TABLE.Mid),
      high: ringDmgGain(ACC_RING_DMG_TABLE.High),
    };
    const ringCombos = comboSix(ringRate, ringDmg);
    const rings = [
      {
        label: ["Crit Rate +", ...trip("0.4", "0.95", "1.55"), "%"],
        ...ringRate,
        combos: ringCombos.first,
      },
      {
        label: ["Crit Damage +", ...trip("1.1", "2.4", "4"), "%"],
        ...ringDmg,
        combos: ringCombos.second,
      },
    ];

    // ----- Earrings + Any Accessory Slot: share the same Gearing-derived
    // baseline as the Bracelet panel's 5 WP/AP rows (see that section's
    // own comment for the gearApTotal/supportApBuff explanation), but -
    // same as Necklace/Rings above - strip the Gearing section's OWN
    // earring inputs from the baseline first: gearApEarring1/2 (Attack
    // Power%) AND gearWpEarring1/2 (Weapon Power%, a paired dropdown row
    // now too - see gearWpPercentTotal's own comment). Without this, the
    // candidate Earring AP%/WP% lines below (Low/Mid/High, "valued as if
    // each were the only line on that slot") would be added ON TOP of
    // the 2 earrings' AP%/WP% you already entered in Gearing, double-
    // counting real equipped earrings instead of evaluating the slot
    // independently. Karmic Enlightenment is left in the baseline
    // untouched here, same as it isn't a per-slot field to begin with.
    let earrings = [];
    let universal = [];
    {
      const earringsNB = Object.assign({}, inputs, {
        gearApEarring1: "None",
        gearApEarring2: "None",
        gearWpEarring1: "None",
        gearWpEarring2: "None",
      });
      const wp = earringsNB.gearWp;
      const mainStat = earringsNB.gearMainStat;
      const baseApMult = 1 + gearBaseApPercentTotal(earringsNB) / 100;
      // Flat AP = accessories (the manual field) + Chaos Core: Attack's
      // own flat contribution, same as the Bracelet panel's own WP/AP
      // rows above.
      const flatAp = earringsNB.gearFlatAp + gearChaosStarFlat(earringsNB.gearApChaosStar);
      // Atropine and Adrenaline's own AP contribution are folded into
      // gearAttackPowerPercentTotal itself now - see that function's
      // own comment for why (this used to double-add both manually on
      // top of the total here, from before that fold-in existed).
      const percentApMult = 1 + gearAttackPowerPercentTotal(earringsNB) / 100;
      const wpPercentMult = 1 + gearWpPercentTotal(earringsNB) / 100;
      const mainStatPercentMult = 1 + earringsNB.gearMainStatPercent / 100;
      const supApBuff = supportApBuff(earringsNB, wp, mainStat, baseApMult);
      const baselineAp = gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult, supApBuff);

      if (wp > 0 && mainStat > 0 && baselineAp > 0) {
        // Attack Power% is a straight scalar on the whole AP total (see
        // Acc!C4's own formula, "=O4/PercentAP") - adding percentApMult
        // by the candidate's own % and re-running gearApTotal captures
        // that exactly, same pattern as the Bracelet panel's statGain/
        // wpGain closures.
        const apPctGain = (deltaPct) =>
          gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult + deltaPct, supApBuff) / baselineAp - 1;
        // Weapon Power% raises the WP feeding the sqrt term directly
        // (Acc!C5), on top of whatever Weapon Power% you've already
        // entered above - so a delta of X% adds X%/(1+existing WP%) to
        // your CURRENT (already-%'d) Weapon Power figure, not X% of it
        // flat, matching the sheet's WP*(1+$M9+delta)/WP*(1+$M9) ratio.
        const wpPctGain = (deltaPct) =>
          gearApTotal(wp * (1 + deltaPct / wpPercentMult), mainStat, baseApMult, flatAp, percentApMult, supApBuff) /
            baselineAp -
          1;
        const apDeltaGain = (delta) =>
          gearApTotal(wp, mainStat, baseApMult, flatAp + delta, percentApMult, supApBuff) / baselineAp - 1;
        const wpDeltaGain = (delta) =>
          gearApTotal(wp + delta * wpPercentMult, mainStat, baseApMult, flatAp, percentApMult, supApBuff) / baselineAp - 1;
        const statDeltaGain = (delta) =>
          gearApTotal(wp, mainStat + delta * mainStatPercentMult, baseApMult, flatAp, percentApMult, supApBuff) /
            baselineAp -
          1;

        const earringAp = {
          low: apPctGain(ACC_EARRING_AP_TABLE.Low),
          mid: apPctGain(ACC_EARRING_AP_TABLE.Mid),
          high: apPctGain(ACC_EARRING_AP_TABLE.High),
        };
        const earringWp = {
          low: wpPctGain(ACC_EARRING_WP_TABLE.Low),
          mid: wpPctGain(ACC_EARRING_WP_TABLE.Mid),
          high: wpPctGain(ACC_EARRING_WP_TABLE.High),
        };
        const earringCombos = comboSix(earringAp, earringWp);
        earrings = [
          {
            label: ["Attack Power +", ...trip("0.4", "0.95", "1.55"), "%"],
            ...earringAp,
            combos: earringCombos.first,
          },
          {
            label: ["Weapon Power +", ...trip("0.8", "1.8", "3"), "%"],
            ...earringWp,
            combos: earringCombos.second,
          },
        ];
        // Universal accessory lines are evaluated on the full current
        // Gearing state. Unlike the Earring rows above, these lines are
        // added alongside the equipped earrings rather than replacing them.
        // This matters for flat WP: existing Earring WP% must multiply the
        // candidate flat WP, just as Karmic Enlightenment does.
        const universalWp = inputs.gearWp;
        const universalMainStat = inputs.gearMainStat;
        const universalBaseApMult = 1 + gearBaseApPercentTotal(inputs) / 100;
        const universalFlatAp =
          inputs.gearFlatAp + gearChaosStarFlat(inputs.gearApChaosStar);
        const universalPercentApMult =
          1 + gearAttackPowerPercentTotal(inputs) / 100;
        const universalWpPercentMult =
          1 + gearWpPercentTotal(inputs) / 100;
        const universalMainStatPercentMult =
          1 + inputs.gearMainStatPercent / 100;
        const universalSupApBuff = supportApBuff(
          inputs,
          universalWp,
          universalMainStat,
          universalBaseApMult
        );
        const universalBaselineAp = gearApTotal(
          universalWp,
          universalMainStat,
          universalBaseApMult,
          universalFlatAp,
          universalPercentApMult,
          universalSupApBuff
        );

        if (universalWp > 0 && universalMainStat > 0 && universalBaselineAp > 0) {
          const universalApDeltaGain = (delta) =>
            gearApTotal(
              universalWp,
              universalMainStat,
              universalBaseApMult,
              universalFlatAp + delta,
              universalPercentApMult,
              universalSupApBuff
            ) /
              universalBaselineAp -
            1;
          const universalWpDeltaGain = (delta) =>
            gearApTotal(
              universalWp + delta * universalWpPercentMult,
              universalMainStat,
              universalBaseApMult,
              universalFlatAp,
              universalPercentApMult,
              universalSupApBuff
            ) /
              universalBaselineAp -
            1;
          const universalStatDeltaGain = (delta) =>
            gearApTotal(
              universalWp,
              universalMainStat + delta * universalMainStatPercentMult,
              universalBaseApMult,
              universalFlatAp,
              universalPercentApMult,
              universalSupApBuff
            ) /
              universalBaselineAp -
            1;

          universal = [
            {
              label: ["Attack Power +", ...trip("80", "195", "390")],
              low: universalApDeltaGain(ACC_FLAT_AP_TABLE.Low),
              mid: universalApDeltaGain(ACC_FLAT_AP_TABLE.Mid),
              high: universalApDeltaGain(ACC_FLAT_AP_TABLE.High),
            },
            {
              label: ["Weapon Power +", ...trip("195", "480", "960")],
              low: universalWpDeltaGain(ACC_FLAT_WP_TABLE.Low),
              mid: universalWpDeltaGain(ACC_FLAT_WP_TABLE.Mid),
              high: universalWpDeltaGain(ACC_FLAT_WP_TABLE.High),
            },
            {
              label: ["Quality STR/DEX/INT (Max − Min): ", ...trip("1935", "2083", "2679")],
              low: universalStatDeltaGain(ACC_QUALITY_MAIN_STAT_TABLE.Low),
              mid: universalStatDeltaGain(ACC_QUALITY_MAIN_STAT_TABLE.Mid),
              high: universalStatDeltaGain(ACC_QUALITY_MAIN_STAT_TABLE.High),
              note: "Maximum Main Stat difference between a minimum-quality and maximum-quality accessory: Ring +1,935, Earring +2,083, Necklace +2,679.",
            },
          ];
        }
      }
    }

    return { necklace, earrings, rings, universal };
  }

  // ----- Format helper -----
  // Always 2 decimals - consistent across every field tag rather than
  // switching precision based on magnitude.
  function formatPct(val) {
    if (!val) return "(0%)";
    return "(" + (val * 100).toFixed(2) + "%)";
  }

  // Same rounding as formatPct but bare (no parens) - used for the
  // Bracelet Line Comparison's tier values, which stand alone rather than
  // trailing an input control.
  function formatPctBare(val) {
    return ((val || 0) * 100).toFixed(2) + "%";
  }

  // ----- Render value displays -----
  // Each control's live value is shown by a `.ap-value-display[data-for]`
  // span whose data-for matches that control's id - NOT "the first
  // .ap-value-display in this row", so multiple controls can safely share
  // one field-row without one's display overwriting another's.
  //
  // The Rings/Bracelet paired selects (Crit Rate, Crit Dmg, Additional Dmg)
  // and the Crit Hit Dmg checkboxes don't use this mechanism at all - their
  // option text/checkbox label already shows the exact percentage each
  // choice is worth (see the HTML), so there's no separate value-display
  // for those fields to keep in sync here.
  function updateInputDisplays(root, inputs) {
    const setDisplay = (selector, value, format = "pct") => {
      const id = selector.replace(/^[#.]/, "");
      const span = root.querySelector('.ap-value-display[data-for="' + id + '"]');
      if (!span) return;
      if (value === 0 || value === undefined || value === null) {
        span.textContent = "";
      } else if (format === "pct") {
        span.textContent = formatPct(value);
      } else if (format === "number") {
        span.textContent = "(" + value.toFixed(2) + ")";
      }
    };

    // Crit Stat
    const critRateFromStat = roundDown((inputs.critStat * 0.03579099) / 100, 4);
    const spanCrit = root.querySelector('.ap-value-display[data-for="ap-crit-stat"]');
    if (spanCrit) {
      const pct = critRateFromStat * 100;
      spanCrit.textContent = "(" + pct.toFixed(2) + "%)";
    }

    // Weapon Quality
    const weaponDmg = 0.1 + 0.00002 * inputs.weaponQuality * inputs.weaponQuality;
    const spanWep = root.querySelector('.ap-value-display[data-for="ap-weapon-quality"]');
    if (spanWep) {
      const pct = weaponDmg * 100;
      spanWep.textContent = "(" + pct.toFixed(2) + "%)";
    }

    // Astrogem (Additional Damage)
    const astrogemDmg = roundDown(inputs.astrogemLv * 8.0834, 0) / 10000;
    const spanAstro = root.querySelector('.ap-value-display[data-for="ap-astrogem-lv"]');
    if (spanAstro) {
      spanAstro.textContent = formatPct(astrogemDmg);
    }

    // Astrogem (Gearing's own Atk. Power Level - independent field, see
    // gearAstrogemApPercent's comment)
    const spanGearAstro = root.querySelector('.ap-value-display[data-for="ap-gear-ap-astrogem-lv"]');
    if (spanGearAstro) {
      spanGearAstro.textContent = formatPct(gearAstrogemApPercent(inputs) / 100);
    }

    // Karmic Enlightenment (Weapon Power %'s own Level field, same
    // pattern as Astrogem above - see gearWpKarmaPercent's comment)
    const spanGearWpKarma = root.querySelector('.ap-value-display[data-for="ap-gear-wp-karma-lv"]');
    if (spanGearWpKarma) {
      spanGearWpKarma.textContent = formatPct(gearWpKarmaPercent(inputs) / 100);
    }

    // Other displays
    setDisplay("#ap-necklace", NECKLACE_ADD_TABLE[inputs.necklace] || 0);
    setDisplay("#ap-sh-pet", SH_PET_TABLE[inputs.shPet] || 0);
    setDisplay("#ap-evo-karma", EVO_KARMA_MAP[inputs.evoKarmaRank] || 0);

    setDisplay("#ap-yearning", inputs.yearning ? 0.14 : 0);

    // Rings/Bracelet pairs (Crit Rate, Crit Dmg, Additional Dmg) and the
    // Crit Hit Dmg checkboxes have no live value-display: their option
    // text/label already shows the exact percentage each choice is worth
    // (see the option labels in the HTML), so there's nothing separate to
    // keep in sync here.

    setDisplay("#ap-flashy-atk", FLASHY_ATK_TABLE[inputs.flashyAtk] || 0);
    setDisplay("#ap-stable-atk", stableAtkValue(inputs.stableAtk));
    const chaosAttackSpan = root.querySelector('.ap-value-display[data-for="ap-gear-ap-chaos-star"]');
    if (chaosAttackSpan) {
      const chaosAttack = GEAR_AP_CHAOS_STAR_TABLE[inputs.gearApChaosStar] || { pct: 0, flat: 0 };
      if (chaosAttack.pct || chaosAttack.flat) {
        const pctText = chaosAttack.pct ? chaosAttack.pct.toFixed(2) + "%" : "0%";
        const flatText = chaosAttack.flat ? chaosAttack.flat.toLocaleString() + " AP" : "0 AP";
        chaosAttackSpan.textContent = "(" + pctText + " + " + flatText + ")";
      } else {
        chaosAttackSpan.textContent = "";
      }
    }

    setDisplay("#ap-adrenaline", (ADRENALINE_TABLE[inputs.adrenaline] || 0) * (inputs.adrenalineUptime / 100));
    setDisplay("#ap-adrenaline-stone", adrenalineApFraction(inputs));
    setDisplay("#ap-kbw", KBW_TABLE[inputs.kbw] || 0);
    setDisplay("#ap-kbw-stone", KBW_STONE_TABLE[inputs.kbwStone] || 0);

    // Attack Power % sources (all defined in percentage-POINT units, so
    // divided by 100 here for setDisplay's fraction-expecting formatPct -
    // gearAttackPowerPercentTotal keeps them in point units since that's
    // what percentApMult itself divides by 100, same as the old single
    // field did).
    // Earrings (paired, like Rings/Bracelet above) have no live-value
    // span - their option text already shows the exact percentage, same
    // as those pairs.
    setDisplay("#ap-gear-ap-kazeros", inputs.gearApKazeros ? GEAR_AP_KAZEROS / 100 : 0);
    setDisplay("#ap-gear-ap-guardian", inputs.gearApGuardian ? GEAR_AP_GUARDIAN / 100 : 0);
    // Atropine Uptime's readout shows the time-averaged effective %
    // (uptime * the full 30% while active), not the uptime number itself -
    // e.g. 20% uptime reads as "(6.00%)", matching the field's own tooltip.
    setDisplay("#ap-gear-atropine-uptime", ((inputs.gearAtropineUptime / 100) * GEAR_AP_ATROPINE_FULL) / 100);
    setDisplay("#ap-gear-strength-orb-uptime", ((inputs.gearStrengthOrbUptime / 100) * STRENGTH_ORB_FULL_AP) / 100);
    setDisplay("#ap-flash-orb-uptime", (inputs.flashOrbUptime / 100) * FLASH_ORB_FULL_CRIT_RATE);
    // Running total, shown even at 0% (unlike the other displays above,
    // which stay blank at 0) so it always reads as "here's your current
    // total" rather than looking broken/empty with nothing selected yet.
    const gearApTotalSpan = root.querySelector('.ap-value-display[data-for="ap-gear-ap-total"]');
    if (gearApTotalSpan) {
      gearApTotalSpan.textContent = "(" + gearAttackPowerPercentTotal(inputs).toFixed(2) + "%)";
    }

    setDisplay("#ap-crit-syn1", inputs.critSyn1 ? 0.1 : 0);
    setDisplay("#ap-crit-syn2", inputs.critSyn2 ? 0.1 : 0);
    setDisplay("#ap-crit-hit-syn-1", inputs.critHitSyn1 ? 0.08 : 0);
    setDisplay("#ap-crit-hit-syn-2", inputs.critHitSyn2 ? 0.08 : 0);
  }

  // ----- Rendering -----
  function renderGrid(root, result) {
    // Top 3 combinations, ranked by % of the grid's best cell. Pure
    // rendering: pctOfBest was already computed in computeGridAndSummary,
    // this only sorts and displays it - no math happens here.
    const list = root.querySelector(".ap-calc-results");
    if (!list) return;

    const ranked = result.cells.slice().sort((a, b) => b.pctOfBest - a.pctOfBest).slice(0, 3);
    ranked.forEach((cell, i) => {
      const rank = i + 1;
      const rowEl = list.querySelector('.ap-calc-result-row[data-rank="' + rank + '"]');
      if (!rowEl) return;

      const comboEl = rowEl.querySelector(".ap-result-combo");
      const pctEl = rowEl.querySelector(".ap-result-pct");
      const deltaEl = rowEl.querySelector(".ap-result-delta");

      if (comboEl) {
        comboEl.textContent = cell.split.label + " \u00B7 " + (KEYSTONE_LABELS[cell.keystone] || cell.keystone);
      }
      if (pctEl) pctEl.textContent = cell.pctOfBest.toFixed(2) + "%";
      if (deltaEl) {
        deltaEl.textContent = rank === 1 ? "Best" : (cell.pctOfBest - ranked[0].pctOfBest).toFixed(2) + "% vs best";
      }
      rowEl.classList.toggle("ap-calc-result-row-best", rank === 1);
    });

    // Verification panel
    const base = result.baseStats;
    if (base) {
      const rateEl = root.querySelector(".ap-summary-base-critrate");
      const dmgEl = root.querySelector(".ap-summary-base-critdmg");
      const onCritEl = root.querySelector(".ap-summary-base-oncrit");
      const evoEl = root.querySelector(".ap-summary-base-evodmg");
      const addEl = root.querySelector(".ap-summary-base-adddmg");

      if (rateEl) {
        const rate = base.critRate;
        rateEl.textContent = rate.toFixed(2) + "%";
        rateEl.classList.toggle("ap-summary-value-warn", rate > 100);
      }
      if (dmgEl) dmgEl.textContent = (base.critDmg * 100).toFixed(2) + "%";
      if (onCritEl) onCritEl.textContent = base.onCritDmg.toFixed(2) + "%";
      if (evoEl) evoEl.textContent = base.evoDmg.toFixed(2) + "%";
      if (addEl) addEl.textContent = base.addDmg.toFixed(2) + "%";

      const kbwRow = root.querySelector(".ap-stat-card-row--kbw-base");
      const kbwEl = root.querySelector(".ap-summary-base-kbw");
      if (kbwRow) kbwRow.classList.toggle("ap-stat-card-row--hidden", !base.kbwUsed);
      if (kbwEl) kbwEl.textContent = "+" + base.kbwGain.toFixed(2) + "%";

      const kbwStoneRow = root.querySelector(".ap-stat-card-row--kbwstone-base");
      const kbwStoneEl = root.querySelector(".ap-summary-base-kbwstone");
      if (kbwStoneRow) kbwStoneRow.classList.toggle("ap-stat-card-row--hidden", !base.kbwStoneUsed);
      if (kbwStoneEl) kbwStoneEl.textContent = "+" + base.kbwStoneGain.toFixed(2) + "%";
    }

    // Best Setup line (no Crit Dmg)
    const best = result.bestStats;
    if (best) {
      const labelEl = root.querySelector(".ap-summary-best-label");
      const critEl = root.querySelector(".ap-summary-best-crit");
      const onCritEl = root.querySelector(".ap-summary-best-oncrit");
      const evoEl = root.querySelector(".ap-summary-best-evodmg");
      const addEl = root.querySelector(".ap-summary-best-adddmg");

      if (labelEl) labelEl.textContent = best.label;

      if (critEl) {
        const raw = best.rawCrit;
        critEl.textContent = raw.toFixed(2) + "%";
        critEl.classList.toggle("ap-summary-value-warn", raw > 100);
      }
      if (onCritEl) onCritEl.textContent = best.onCritDmg.toFixed(2) + "%";
      if (evoEl) evoEl.textContent = best.evoDmg.toFixed(2) + "%";
      if (addEl) addEl.textContent = best.addDmg.toFixed(2) + "%";

      const kbwRow = root.querySelector(".ap-stat-card-row--kbw-best");
      const kbwEl = root.querySelector(".ap-summary-best-kbw");
      if (kbwRow) kbwRow.classList.toggle("ap-stat-card-row--hidden", !best.kbwUsed);
      if (kbwEl) kbwEl.textContent = "+" + best.kbwGain.toFixed(2) + "%";

      const kbwStoneRow = root.querySelector(".ap-stat-card-row--kbwstone-best");
      const kbwStoneEl = root.querySelector(".ap-summary-best-kbwstone");
      if (kbwStoneRow) kbwStoneRow.classList.toggle("ap-stat-card-row--hidden", !best.kbwStoneUsed);
      if (kbwStoneEl) kbwStoneEl.textContent = "+" + best.kbwStoneGain.toFixed(2) + "%";
    }
  }

  // ----- Comparison table rendering (shared by Bracelet + Accessories) -----
  // Renders `rows` into a <tbody> as a compact table (Line | Low | Mid |
  // High) - one <tr> per line, full-width. Originally Bracelet-only; kept
  // generic (takes elements directly rather than querying `.ap-brace-*`
  // itself) so the Accessory panels below can reuse it for their own,
  // smaller <tbody>s without a flip-footnote of their own.
  function renderComparisonRows(container, footnote, rows) {
    if (!container) return;

    container.innerHTML = "";
    let anyFlip = false;

    rows.forEach((row) => {
      const tr = document.createElement("tr");
      if (row.flipsBest) anyFlip = true;

      const labelTd = document.createElement("td");
      labelTd.className = "ap-brace-row-label";
      // row.label is an array of plain strings and colored-token objects
      // (see trip() above) rather than one flat string, so the Low/Mid/
      // High figures embedded in the label itself can be colored - the
      // reference tooltip colors its own per-line numbers this way,
      // rather than the flat percentages in the table columns.
      row.label.forEach((part) => {
        if (typeof part === "string") {
          labelTd.appendChild(document.createTextNode(part));
          return;
        }
        const span = document.createElement("span");
        span.className = part.downside ? "ap-brace-label-downside" : "ap-brace-label-" + part.tier;
        span.textContent = part.text;
        labelTd.appendChild(span);
      });
      if (row.flipsBest) {
        labelTd.appendChild(document.createTextNode(" \u2020"));
      }
      if (row.specDmgOnly) {
        // Small always-visible tag (not a permanent note block) so the
        // row stays one line tall - the explanation lives in this badge's
        // own hover tooltip instead of a paragraph under the table.
        const badge = document.createElement("span");
        badge.className = "ap-brace-label-caveat";
        badge.textContent = "dmg only";
        badge.title = row.specDmgOnlyNote;
        badge.setAttribute("role", "img");
        badge.setAttribute("aria-label", row.specDmgOnlyNote);
        labelTd.appendChild(badge);
      }
      if (row.buildTags) {
        // One compact hover tag per named build variant (111/313 for RE,
        // 222/333 for Surge) - each shows that specific build's own
        // tier values in its tooltip.
        row.buildTags.forEach((b) => {
          const tag = document.createElement("span");
          tag.className = "ap-brace-build-tag";
          tag.textContent = b.tag;
          tag.title = b.tooltip;
          tag.setAttribute("role", "img");
          tag.setAttribute("aria-label", b.tooltip);
          labelTd.appendChild(tag);
        });
      }
      if (row.note) {
        // Caveat text moves into a hover tooltip (native `title`) instead
        // of a permanent line under the label - keeps every row to one
        // line instead of the label wrapping vertically for a caveat most
        // readers only need once. The little "i" badge is what tells a
        // reader there's something to hover in the first place.
        const infoEl = document.createElement("span");
        infoEl.className = "ap-brace-info-icon";
        infoEl.textContent = "i";
        infoEl.title = row.note;
        infoEl.setAttribute("role", "img");
        infoEl.setAttribute("aria-label", row.note);
        labelTd.appendChild(infoEl);
      }
      tr.appendChild(labelTd);

      ["low", "mid", "high"].forEach((tier) => {
        const td = document.createElement("td");
        td.className = "ap-brace-tier-val";
        td.textContent = formatPctBare(row[tier]);
        tr.appendChild(td);
      });

      // Combo columns (LL/ML/MM/HL/HM/HH) - only present on Accessory
      // rows that pair with a sibling line on the same piece (see
      // comboSix() in computeAccessoryComparison). A key can be present
      // in the LOOKUP but still undefined for this particular row (the
      // second line of a pair has no LL/MM/HH of its own - see that
      // function's comment) - rendered as a plain dash rather than 0%,
      // since "0% gain" and "not shown for this row" mean different
      // things here.
      if (row.combos) {
        ["LL", "ML", "MM", "HL", "HM", "HH"].forEach((key) => {
          const td = document.createElement("td");
          td.className = "ap-brace-tier-val ap-acc-combo-val";
          const val = row.combos[key];
          td.textContent = val === undefined ? "\u2013" : formatPctBare(val);
          tr.appendChild(td);
        });
      }

      // The Archdemon line's displayed values only pay off against a
      // Demon/Archdemon target - greyed out here so they read as
      // situational rather than a plain, always-on gain like every other
      // row's numbers.
      if (row.id === "addB") tr.classList.add("ap-brace-row-situational");

      container.appendChild(tr);
    });

    if (footnote) {
      footnote.style.display = anyFlip ? "" : "none";
    }
  }

  function renderBraceletComparison(root, rows) {
    renderComparisonRows(root.querySelector(".ap-brace-compare-rows"), root.querySelector(".ap-brace-compare-flip-note"), rows);
  }

  // ----- Accessory Line Comparison rendering -----
  // One call per panel (Necklace/Earrings/Rings/Universal) into that
  // panel's own <tbody> - no flip-footnote, since none of these rows can
  // change the grid's best split/keystone (same reasoning as the Bracelet
  // panel's own WP/AP rows). A panel with 0 rows (Earrings/Universal
  // before Weapon Power and Main Stat are filled in) hides its own
  // wrapping .ap-acc-panel entirely rather than showing an empty table.
  function renderAccessoryComparison(root, groups) {
    [
      ["necklace", ".ap-acc-necklace-rows", ".ap-acc-necklace-panel"],
      ["earrings", ".ap-acc-earrings-rows", ".ap-acc-earrings-panel"],
      ["rings", ".ap-acc-rings-rows", ".ap-acc-rings-panel"],
      ["universal", ".ap-acc-universal-rows", ".ap-acc-universal-panel"],
    ].forEach(([key, rowsSelector, panelSelector]) => {
      const rows = groups[key] || [];
      const panel = root.querySelector(panelSelector);
      if (panel) panel.style.display = rows.length ? "" : "none";
      renderComparisonRows(root.querySelector(rowsSelector), null, rows);
    });
  }

  // ----- Local storage persistence -----
  // Saves every field's current value under one key so a reader filling
  // this out doesn't have to redo it on every reload. Best-effort: some
  // browsers/private-mode sessions block storage entirely, so every call
  // is wrapped and failures are silently ignored - the calculator still
  // works perfectly without persistence, it just won't remember next time.
  //
  // Presets: 3 independent storage slots rather than 1. Slot 1 reuses the
  // original STORAGE_KEY unchanged, so anyone with data saved before this
  // feature existed keeps it - it just becomes "Preset 1" instead of the
  // only slot. Slots 2/3 are new, empty until the reader saves into them.
  // Which slot is "active" (currently loaded into the form) is itself
  // saved separately, so a reader who was on Preset 2 last visit comes
  // back to Preset 2, not always Preset 1.
  const STORAGE_KEY = "ap-calc-deathblade-v1";
  const PRESET_COUNT = 3;
  const PRESET_KEYS = [STORAGE_KEY, STORAGE_KEY + "-preset2", STORAGE_KEY + "-preset3"];
  const ACTIVE_PRESET_KEY = STORAGE_KEY + "-active-preset";

  function presetStorageKey(presetId) {
    return PRESET_KEYS[presetId - 1] || PRESET_KEYS[0];
  }

  function getActivePresetId() {
    try {
      const raw = localStorage.getItem(ACTIVE_PRESET_KEY);
      const id = parseInt(raw, 10);
      if (id >= 1 && id <= PRESET_COUNT) return id;
    } catch (e) {
      /* storage unavailable */
    }
    return 1;
  }

  function setActivePresetId(id) {
    try {
      localStorage.setItem(ACTIVE_PRESET_KEY, String(id));
    } catch (e) {
      /* storage unavailable - the switch still works for this page view,
         it just won't be remembered on the next visit */
    }
  }

  // Reads every field on the widget into a plain {id: value} object - the
  // shared shape used by localStorage persistence, Export, and Import
  // alike, so all three always agree on what a "full setup" looks like.
  function collectFieldData(root) {
    const data = {};
    root.querySelectorAll("input, select").forEach((el) => {
      if (!el.id) return;
      data[el.id] = (el.type === "checkbox" || el.type === "radio") ? el.checked : el.value;
    });
    return data;
  }

  // Applies a {id: value} object (from storage, or a pasted/uploaded
  // Import) onto the widget's fields. Missing keys are left untouched
  // rather than guessed at - callers that want a full reset to authored
  // defaults first should call resetFieldsToDefaults(root) before this.
  function applyFieldData(root, data) {
    if (!data || typeof data !== "object") return;
    root.querySelectorAll("input, select").forEach((el) => {
      if (!el.id || !(el.id in data)) return;
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = !!data[el.id];
      } else if (el.tagName === "SELECT") {
        // Only restore if the stored value still matches a real option -
        // if a future edit ever renames/removes an option's value, a
        // stale stored value would otherwise leave the select showing no
        // selection at all (selectedIndex -1) instead of falling back to
        // the authored default.
        const stillValid = Array.from(el.options).some((opt) => opt.value === data[el.id]);
        if (stillValid) el.value = data[el.id];
      } else {
        el.value = data[el.id];
      }
    });
  }

  function saveInputs(root, presetId) {
    try {
      const data = collectFieldData(root);
      localStorage.setItem(presetStorageKey(presetId), JSON.stringify(data));
    } catch (e) {
      /* storage unavailable - nothing to do */
    }
  }

  function loadInputs(root, presetId) {
    try {
      const raw = localStorage.getItem(presetStorageKey(presetId));
      if (!raw) return;
      applyFieldData(root, JSON.parse(raw));
    } catch (e) {
      /* corrupted or blocked storage - fall back to authored defaults */
    }
  }

  // Restores every field to its authored HTML default WITHOUT touching
  // storage - the shared step both "switch to an empty/different preset"
  // and "Reset to defaults" need before layering their own data on top
  // (or, for Reset, instead of any data at all).
  function resetFieldsToDefaults(root) {
    root.querySelectorAll("input, select").forEach((el) => {
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = el.defaultChecked;
      } else if (el.tagName === "SELECT") {
        const defaultOpt = Array.from(el.options).find((opt) => opt.defaultSelected) || el.options[0];
        if (defaultOpt) el.value = defaultOpt.value;
      } else {
        el.value = el.defaultValue;
      }
    });
  }

  function resetInputs(root) {
    const activeId = getActivePresetId();
    try {
      localStorage.removeItem(presetStorageKey(activeId));
    } catch (e) {
      /* storage unavailable - nothing to clear */
    }
    resetFieldsToDefaults(root);
    // Instantly re-calculate calculations and refresh value/range displays
    update(root);
  }

  // Swaps which of the 3 slots is loaded into the form. The slot being
  // left behind already has its latest edits saved (every field change
  // calls saveInputs for the active preset - see the input/change
  // listeners in initApCalcRoot()), so nothing is lost by switching away
  // from it.
  function switchPreset(root, newId) {
    if (newId === getActivePresetId()) return;
    resetFieldsToDefaults(root);
    loadInputs(root, newId);
    setActivePresetId(newId);
    normalizeChaosCoreExclusivity(root);
    updatePresetButtonStates(root);
    update(root);
  }

  function updatePresetButtonStates(root) {
    const activeId = getActivePresetId();
    root.querySelectorAll(".ap-calc-preset").forEach((btn) => {
      const isActive = parseInt(btn.dataset.preset, 10) === activeId;
      btn.classList.toggle("ap-calc-preset-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    root.querySelectorAll(".ap-calc-popover-preset-num").forEach((el) => {
      el.textContent = activeId;
    });
  }

  // ----- Export / Import -----
  // Export wraps the raw field data with a small envelope (format marker
  // + version) rather than handing back the bare {id: value} object - so
  // a reader who pastes something unrelated into Import gets a clear
  // "that's not an export from this calculator" instead of it silently
  // half-applying whatever keys happen to match by coincidence. Import
  // still accepts a bare {id: value} object too (no envelope) for anyone
  // hand-editing or scripting against the format directly.
  const EXPORT_FORMAT_MARKER = "deathblade-ap-calc";
  const EXPORT_FORMAT_VERSION = 1;

  function buildExportPayload(root) {
    return {
      format: EXPORT_FORMAT_MARKER,
      version: EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      data: collectFieldData(root),
    };
  }

  // Returns the {id: value} data object from a parsed import payload, or
  // null if the shape is unrecognized. Accepts the envelope Export
  // produces, OR a bare data object (envelope-less).
  function extractImportData(parsed) {
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.data && typeof parsed.data === "object") return parsed.data;
    // No "data" key - treat the whole object as bare field data as long
    // as it isn't obviously something else entirely (has at least one
    // key, none of which are itself an object/array - a real field value
    // is always a string or boolean).
    const values = Object.values(parsed);
    if (values.length && values.every((v) => typeof v === "string" || typeof v === "boolean")) {
      return parsed;
    }
    return null;
  }

  function showPopoverMessage(popoverEl, text, isError) {
    const msgEl = popoverEl.querySelector(".ap-calc-popover-msg");
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.classList.toggle("ap-calc-popover-msg-error", !!isError);
  }

  function openPopover(root, kind, triggerEl) {
    root.querySelectorAll(".ap-calc-popover").forEach((p) => { p.hidden = true; });
    const popoverEl = root.querySelector('.ap-calc-popover[data-popover="' + kind + '"]');
    if (!popoverEl) return;
    showPopoverMessage(popoverEl, "", false);
    updatePresetButtonStates(root);
    if (kind === "export") {
      const payload = buildExportPayload(root);
      popoverEl.querySelector(".ap-calc-popover-textarea").value = JSON.stringify(payload, null, 2);
    } else if (kind === "import") {
      const textarea = popoverEl.querySelector(".ap-calc-popover-textarea");
      textarea.value = "";
      const fileInput = popoverEl.querySelector(".ap-calc-popover-file");
      if (fileInput) fileInput.value = "";
    }
    popoverEl.hidden = false;
    const focusEl = popoverEl.querySelector("textarea");
    if (focusEl) focusEl.focus();
    popoverEl.__triggerEl = triggerEl || null;
  }

  function closePopover(popoverEl) {
    popoverEl.hidden = true;
    if (popoverEl.__triggerEl && typeof popoverEl.__triggerEl.focus === "function") {
      popoverEl.__triggerEl.focus();
    }
  }

  function downloadJson(filename, text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke on next tick - some browsers need the click to fully process
    // first before the object URL can be safely released.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function applyImportText(root, popoverEl, text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      showPopoverMessage(popoverEl, "That's not valid JSON - check for a truncated paste.", true);
      return;
    }
    const data = extractImportData(parsed);
    if (!data) {
      showPopoverMessage(popoverEl, "Doesn't look like a Deathblade Ark Passive Calculator export.", true);
      return;
    }
    const activeId = getActivePresetId();
    resetFieldsToDefaults(root);
    applyFieldData(root, data);
    normalizeChaosCoreExclusivity(root);
    saveInputs(root, activeId);
    update(root);
    showPopoverMessage(popoverEl, "Imported into Preset " + activeId + ".", false);
  }



  // Once 3 of the 5 Party & Positioning toggles are checked, the rest are
  // disabled (not force-unchecked) so it's obvious at a glance why they
  // can't be clicked, rather than a checkbox that mysteriously won't stay
  // checked. Re-enabled the moment the count drops back under the limit.
  function enforcePartyCheckboxLimit(root) {
    const boxes = PARTY_CHECKBOX_LIMIT_SELECTORS.map((sel) => root.querySelector(sel)).filter(Boolean);
    const checkedCount = boxes.filter((b) => b.checked).length;
    boxes.forEach((b) => {
      b.disabled = !b.checked && checkedCount >= PARTY_CHECKBOX_LIMIT;
    });
  }

  // Support AP Buff Uptime, Strength Orb Uptime, and Flash Orb Uptime all
  // only mean anything while Support is actually part of the setup -
  // gated on .ap-yearning ("Support: Passionate Dance" up in Party &
  // Positioning) being CHECKED, not on whether it's disabled. Being
  // disabled-but-checked (hit the 3-synergy limit above while already on)
  // still means Support is active, so these fields should stay enabled
  // in that case - only an unchecked .ap-yearning turns them off. Strength
  // Orb and Flash Orb are both Support's Drops of Ether engraving, same
  // "no Support, no orb" dependency as the AP buff.
  function enforceGearSupportUptimeGate(root) {
    const yearningEl = root.querySelector(".ap-yearning");
    if (!yearningEl) return;
    [".ap-gear-support-uptime", ".ap-gear-strength-orb-uptime", ".ap-flash-orb-uptime"].forEach((selector) => {
      const el = root.querySelector(selector);
      if (el) el.disabled = !yearningEl.checked;
    });
  }

  function update(root) {
    enforcePartyCheckboxLimit(root);
    enforceKbwStoneDependency(root);
    enforceGearSupportUptimeGate(root);
    const inputs = readInputs(root);
    const result = computeGridAndSummary(inputs);
    renderGrid(root, result);
    updateInputDisplays(root, inputs);
    renderBraceletComparison(root, computeBraceletComparison(inputs));
    renderAccessoryComparison(root, computeAccessoryComparison(inputs));

    // Every range slider (Back-Attack Rate, Adrenaline Uptime, ...) shows
    // its live value as "N%" next to it - handled generically here so
    // adding another slider later doesn't need a new hardcoded lookup.
    root.querySelectorAll(".ap-calc-range-line").forEach((line) => {
      const rangeEl = line.querySelector('input[type="range"]');
      const valueEl = line.querySelector(".ap-calc-range-value");
      if (rangeEl && valueEl) valueEl.textContent = rangeEl.value + "%";
    });
  }

  // Chaos Core: Flashy Attack and Chaos Core: Stable Attack are both the
  // same Chaos Core equipment slot, so only one can ever actually be
  // equipped - picking a real option in one resets the other back to
  // "None" rather than letting both count as active at once.
  function normalizeChaosCoreExclusivity(root) {
    const flashyEl = root.querySelector(".ap-flashy-atk");
    const stableEl = root.querySelector(".ap-stable-atk");
    if (!flashyEl || !stableEl) return;
    if (flashyEl.value !== "None" && stableEl.value !== "None|0P") {
      flashyEl.value = "None";
    }
  }

  // Kazeros Raid Contribution and Guardian Raid Contribution are both
  // "which raid am I in" buffs - you're only ever in one raid at a time,
  // so only one of these two can actually be active. Checking one un-
  // checks the other rather than letting both count as active at once,
  // same idea as normalizeChaosCoreExclusivity above (checkboxes instead
  // of selects, so there's no "None" value to reset to - just uncheck
  // the OTHER box directly).
  function normalizeRaidContributionExclusivity(root) {
    const kazerosEl = root.querySelector(".ap-gear-ap-kazeros");
    const guardianEl = root.querySelector(".ap-gear-ap-guardian");
    if (!kazerosEl || !guardianEl) return;
    if (kazerosEl.checked && guardianEl.checked) {
      guardianEl.checked = false;
    }
  }

  // The Keen Blunt Weapon Ability Stone only does anything while Keen
  // Blunt Weapon itself is actually equipped - if KBW is "Not Used", its
  // stone is locked to "0 Lv." and disabled (dimmed via the CSS rule
  // alongside the Party & Positioning one) so it's obvious why, rather
  // than letting a stale stone level look active but silently do nothing.
  function enforceKbwStoneDependency(root) {
    const kbwEl = root.querySelector(".ap-kbw");
    const stoneEl = root.querySelector(".ap-kbw-stone");
    if (!kbwEl || !stoneEl) return;
    const kbwUnused = kbwEl.value === "Not Used";
    if (kbwUnused) stoneEl.value = "0 Lv.";
    stoneEl.disabled = kbwUnused;
  }

  // ----- Initialisation -----
  // initApCalcRoot() attaches listeners directly onto the calculator's own
  // static markup instead of rebuilding it from scratch each call - so,
  // unlike the JSON-data-driven widgets registerRenderer was originally
  // written for, calling this twice on the same root would double-attach
  // every listener below (duplicate localStorage writes, duplicate reset
  // confirms, duplicate popover opens, ...) rather than harmlessly re-doing
  // idempotent work. This guard is what makes it safe to hand to
  // registerRenderer, whose three triggers can otherwise all fire for the
  // same root on a single hard load.
  function initApCalcRoot(root) {
    if (root.dataset.apCalcInit) return;
    root.dataset.apCalcInit = "1";

    {
      const activeId = getActivePresetId();
      loadInputs(root, activeId);
      normalizeChaosCoreExclusivity(root);
      normalizeRaidContributionExclusivity(root);
      updatePresetButtonStates(root);

      const flashyEl = root.querySelector(".ap-flashy-atk");
      const stableEl = root.querySelector(".ap-stable-atk");
      if (flashyEl && stableEl) {
        // Attached before the generic input/select loop below, so the
        // opposing select is already reset by the time that loop's own
        // "change" listener runs update()/saveInputs() for this element.
        flashyEl.addEventListener("change", () => {
          if (flashyEl.value !== "None") stableEl.value = "None|0P";
        });
        stableEl.addEventListener("change", () => {
          if (stableEl.value !== "None|0P") flashyEl.value = "None";
        });
      }

      const kazerosEl = root.querySelector(".ap-gear-ap-kazeros");
      const guardianEl = root.querySelector(".ap-gear-ap-guardian");
      if (kazerosEl && guardianEl) {
        // Same "attached before the generic loop" timing as flashy/
        // stable above, so the opposing checkbox is already unchecked
        // by the time that loop's own "change" listener runs update()/
        // saveInputs() for this element.
        kazerosEl.addEventListener("change", () => {
          if (kazerosEl.checked) guardianEl.checked = false;
        });
        guardianEl.addEventListener("change", () => {
          if (guardianEl.checked) kazerosEl.checked = false;
        });
      }

      // Coalesced to at most one recompute+render+save per animation
      // frame, shared across every field in this root. Range sliders fire
      // "input" continuously while dragging (the number/select fields
      // mostly fire once per keystroke or selection), and update() does a
      // full grid + bracelet-comparison re-render while saveInputs() does
      // a synchronous JSON.stringify + localStorage.setItem - uncoalesced,
      // a single slider drag could run that whole chain dozens of times a
      // second. rafSchedule() only delays *when* the latest DOM values get
      // read and saved (by at most one frame), never *which* values -
      // input fields already hold their final value synchronously by the
      // time any event fires, so this can't drop or reorder data.
      const scheduleUpdate = window.SiteUtils.rafSchedule(() => {
        update(root);
        saveInputs(root, getActivePresetId());
      });

      root.querySelectorAll("input, select").forEach((el) => {
        // Weapon Power / Main Stat / Flat AP get typed digit-by-digit as
        // large numbers - recalculating on every keystroke means the
        // brief intermediate values (e.g. "2", then "25", then "259" on
        // the way to "259216") flash wildly wrong % gains before the
        // reader finishes typing. These three wait for "change" (blur,
        // or Enter) instead - everything else still updates live.
        if (!el.matches(".ap-gear-wp, .ap-gear-main-stat, .ap-gear-flat-ap")) {
          el.addEventListener("input", scheduleUpdate);
        }
        el.addEventListener("change", scheduleUpdate);
      });
      // readInputs() already clamps every number field to its min/max when
      // computing (Crit Stat, Weapon Quality, Astrogem Level, Demon
      // Damage %, Bracelet Crit Stat Equipped, and the Gearing fields),
      // but that only guards the math - it left the field itself still
      // showing whatever the reader typed, so a stray extra digit could
      // sit there looking accepted. SiteUtils.clampOnBlur (site-utils.js)
      // snaps the displayed value back into range on blur too, generic
      // over every number input here rather than listing each field,
      // since they all already carry min/max attrs in the markup - same
      // helper the CPM/bid calculators use for their own fields. This
      // additionally passes emptyValue (opt-in on that shared helper,
      // added for this file specifically): unlike a CPM/price field,
      // where blank correctly means "not entered yet, show '—'", every
      // field here feeds an always-on live grid that has to show SOME
      // number, so blank/unparseable snaps back to the field's authored
      // default instead of being left broken.
      root.querySelectorAll('input[type="number"]').forEach((el) => {
        const min = el.min !== "" ? parseFloat(el.min) : -Infinity;
        const max = el.max !== "" ? parseFloat(el.max) : Infinity;
        window.SiteUtils.clampOnBlur(el, min, max, scheduleUpdate, {
          emptyValue: () => el.defaultValue,
        });
      });
      const resetEl = root.querySelector(".ap-calc-reset");
      // A real <button>, not an <a href="#"> - this site has Material's
      // navigation.instant enabled, which intercepts <a> clicks globally
      // for SPA-style navigation and was racing with (and beating) a click
      // listener attached directly to the link, so the reset never
      // actually ran. A <button> isn't part of that interception at all.
      // Confirmed via native confirm() rather than a popover - this is a
      // destructive, one-shot action (unlike Export/Import's popovers,
      // which stay open for review), so a blocking native dialog is more
      // appropriate than a dismissable custom UI. Message calls out that
      // only the active preset is cleared, since resetInputs() only ever
      // touches presetStorageKey(activeId) - the other two slots are
      // untouched and this is easy to misread as a full wipe.
      if (resetEl) {
        resetEl.addEventListener("click", () => {
          const activeId = getActivePresetId();
          const confirmed = window.confirm(
            "Reset Preset " + activeId + " to defaults? This clears Preset " +
            activeId + " only - your other presets aren't affected."
          );
          if (confirmed) resetInputs(root);
        });
      }

      // Preset switcher: 3 small number buttons, matching the reset
      // link's own subtle text-link treatment (see the CSS) rather than
      // boxed tabs - this is a footnote-level control, not a new section
      // of the widget, so it shouldn't visually compete with the actual
      // gear/results panels above it.
      root.querySelectorAll(".ap-calc-preset").forEach((btn) => {
        btn.addEventListener("click", () => {
          switchPreset(root, parseInt(btn.dataset.preset, 10));
        });
      });

      // Export / Import: open as an absolutely-positioned popover anchored
      // to the footnote, so opening one never shifts the reset link, the
      // preset buttons, or anything above them - it just floats above the
      // page and closes again.
      const exportBtn = root.querySelector(".ap-calc-export");
      const importBtn = root.querySelector(".ap-calc-import");
      if (exportBtn) {
        exportBtn.addEventListener("click", () => openPopover(root, "export", exportBtn));
      }
      if (importBtn) {
        importBtn.addEventListener("click", () => openPopover(root, "import", importBtn));
      }

      root.querySelectorAll(".ap-calc-popover").forEach((popoverEl) => {
        const closeBtn = popoverEl.querySelector(".ap-calc-popover-close");
        if (closeBtn) closeBtn.addEventListener("click", () => closePopover(popoverEl));

        const copyBtn = popoverEl.querySelector(".ap-calc-popover-copy");
        if (copyBtn) {
          copyBtn.addEventListener("click", () => {
            const text = popoverEl.querySelector(".ap-calc-popover-textarea").value;
            window.SiteUtils.copyToClipboard(text)
              .then(() => showPopoverMessage(popoverEl, "Copied to clipboard.", false))
              .catch(() => showPopoverMessage(popoverEl, "Couldn't access the clipboard - select the text above and copy manually.", true));
          });
        }

        const downloadBtn = popoverEl.querySelector(".ap-calc-popover-download");
        if (downloadBtn) {
          downloadBtn.addEventListener("click", () => {
            const text = popoverEl.querySelector(".ap-calc-popover-textarea").value;
            downloadJson("deathblade-ap-calc-preset-" + getActivePresetId() + ".json", text);
          });
        }

        const loadBtn = popoverEl.querySelector(".ap-calc-popover-load");
        if (loadBtn) {
          loadBtn.addEventListener("click", () => {
            const text = popoverEl.querySelector(".ap-calc-popover-textarea").value.trim();
            if (!text) {
              showPopoverMessage(popoverEl, "Paste your exported JSON above, or choose a file below.", true);
              return;
            }
            applyImportText(root, popoverEl, text);
          });
        }

        const fileInput = popoverEl.querySelector(".ap-calc-popover-file");
        if (fileInput) {
          fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            file.text().then((text) => {
              popoverEl.querySelector(".ap-calc-popover-textarea").value = text;
              applyImportText(root, popoverEl, text);
            });
          });
        }
      });

      update(root);
    }
  }

  // Click outside any open popover, or Escape, closes it - same dismissal
  // pattern as any lightweight menu/tooltip on the site. Bound ONCE at
  // module scope (not inside initApCalcRoot()) and scoped to `document`
  // for the lookup itself - initApCalcRoot() re-runs per root across
  // every registerRenderer trigger (hard load, instant nav, mutation),
  // and binding these two listeners inside that per-root logic meant
  // every revisit left another pair of permanent document-level listeners
  // behind, each closing over that load's now-stale `root` and never
  // cleaned up. There's normally just one .ap-calc per page, so querying
  // from `document` instead of a specific `root` costs nothing in
  // practice.
  document.addEventListener("click", (ev) => {
    document.querySelectorAll(".ap-calc-popover").forEach((popoverEl) => {
      if (popoverEl.hidden) return;
      if (popoverEl.contains(ev.target) || ev.target === popoverEl.__triggerEl) return;
      closePopover(popoverEl);
    });
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    document.querySelectorAll(".ap-calc-popover").forEach((popoverEl) => {
      if (!popoverEl.hidden) closePopover(popoverEl);
    });
  });

  // Was a hand-rolled document$-only subscription (see site-utils.js's
  // registerRenderer doc comment for why that's not safe to assume covers
  // every case on its own) - the dataset guard on initApCalcRoot() is what
  // makes it safe to hand to registerRenderer directly instead of going
  // through init()'s own querySelectorAll first.
  window.SiteUtils.registerRenderer(".ap-calc", initApCalcRoot);

  window.__arkPassiveCalc = {
    computeGridAndSummary,
    computeBraceletComparison,
    computeAccessoryComparison,
    EVOLUTION_SPLITS,
    COMBINED_KEYSTONES,
  };
})();

// ---------------------------------------------------------------------
// Reference check (not executed on the page - run manually with node after
// any edit to this file). Using the sheet's own example inputs (Crit Stat
// 658, Ring/Bracelet Mid+High, Adrenaline/KBW maxed, Crit Rate+Dmg Dual on,
// Ancient 17P Flashy Atk, Yearning on, Evo Karma 6, no Stable Atk/Crit Hit
// Dmg Synergies, Back-Attack Rate 100%) at the LB1/KS2 split, the three
// combined-keystone cells must equal (sheet's S35/S36/S37, divided by the
// removed 0.85*1.12 scalar to account for that factor no longer being
// part of the formula - see the note at the top of this file):
//   Critical+Master    -> 7.902313487
//   Critical+Pulverize -> 7.930274126
//   Master+Pulverize   -> 7.947222029
// ---------------------------------------------------------------------
