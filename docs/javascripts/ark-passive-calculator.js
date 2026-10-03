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
// NOT MODELED: the sheet's trailing "0.85 * (1 + 12%/18% Damage Synergy)"
// scalar (and the "6% Damage Synergy" checkbox that fed it). It's a constant
// multiplied onto every one of the 9 grid cells equally, so it can never
// change which cell is best or the %-of-best shown for any of them -
// confirmed by direct computation (toggling it left every cell's pctOfBest
// and the best-cell identity bit-for-bit identical).
// Crit Syn 1/2 still do something real: their +10% Crit Rate feeds into
// effCrit, which genuinely interacts with the Master keystone's crit-rate
// cap, so they're kept as pure "+10% Crit Rate" toggles with nothing else
// attached.
//
// ONE OPEN ACCURACY QUESTION, not yet confirmed - flagged rather than
// silently trusted: "Crit Hit Damage Synergy 1" (ap-crit-hit-syn-1) is
// modeled as a flat +8% on-crit damage multiplier, first attributed to
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
// be dropped instead.
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

  var SITE_ROOT = window.SiteUtils.detectSiteRoot("ark-passive-calculator.js");

  // ----- Lookup tables -----
  const NONE_LOW_MID_HIGH = (none, low, mid, high) => ({ None: none, Low: low, Mid: mid, High: high });
  const RING_RATE_TABLE = NONE_LOW_MID_HIGH(0, 0.004, 0.0095, 0.0155);
  const RING_DMG_TABLE = NONE_LOW_MID_HIGH(0, 0.011, 0.024, 0.04);
  const BRACELET_RATE_TABLE = NONE_LOW_MID_HIGH(0, 0.034, 0.042, 0.05);
  const BRACELET_DMG_TABLE = NONE_LOW_MID_HIGH(0, 0.068, 0.084, 0.1);
  const BRACELET_ADD_A_TABLE = NONE_LOW_MID_HIGH(0, 0.03, 0.035, 0.04);
  const BRACELET_ADD_B_TABLE = NONE_LOW_MID_HIGH(0, 0.025, 0.03, 0.035);
  const NECKLACE_ADD_TABLE = NONE_LOW_MID_HIGH(0, 0.006, 0.016, 0.026);
  const SH_PET_TABLE = NONE_LOW_MID_HIGH(0, 0.004, 0.007, 0.01);
  // Support's own Crit Rate/Crit Dmg bracelet lines (Arsonistic's SupBrace
  // sheet, "On hit, party Crit Rate/Crit Dmg +.../8s, assumes 100% debuff
  // uptime") - flat additive party buffs, same shape as the character's own
  // RING_RATE_TABLE/RING_DMG_TABLE above, not a swingy uptime-scaled term
  // like Flash Orb. Party & Positioning's ".ap-support-crit-rate-bracelet"/
  // ".ap-support-crit-dmg-bracelet" selects; disabled in the UI off
  // .ap-yearning (see enforceGearSupportUptimeGate) AND zeroed at the code
  // level in readInputs whenever Support isn't checked, same as Flash
  // Orb/Strength Orb - see readInputs' own comment on why the UI-disable
  // alone isn't sufficient. Each SupBrace line also
  // carries an "Ally Atk. Power Enhancement +2/2.5/3%" component -
  // deliberately not modeled (see the HTML comment above these two selects
  // in resources.md for why folding it into SUPPORT_AP_BUFF_COEFFICIENT
  // would misrepresent what that coefficient is calibrated against).
  const SUPPORT_CRIT_RATE_BRACELET_TABLE = NONE_LOW_MID_HIGH(0, 0.018, 0.021, 0.025);
  const SUPPORT_CRIT_DMG_BRACELET_TABLE = NONE_LOW_MID_HIGH(0, 0.036, 0.042, 0.048);

  const ADRENALINE_TABLE = { "Not Used": 0, "0 Nodes": 0.14, "1 Nodes": 0.155, "2 Nodes": 0.17, "3 Nodes": 0.185, "4 Nodes": 0.2 };
  const KBW_TABLE = { "Not Used": 0, "0 Nodes": 0.44, "1 Nodes": 0.46, "2 Nodes": 0.48, "3 Nodes": 0.5, "4 Nodes": 0.52 };
  const KBW_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.075, "2 Lv.": 0.094, "3 Lv.": 0.132, "4 Lv.": 0.15 };

  const FLASHY_ATK_TABLE = { None: 0, "Epic-Leg 10P": 0.0055, "Relic 17P": 0.011, "Ancient 17P": 0.0165 };

  // Merged Stable Atk table: "Grade|Points" -> value
  // 14P is a single "Any|14P" bucket, not split by grade - Legend/Relic/
  // Ancient all pay out the identical 0.007 at 14P (confirmed: grade only
  // starts affecting the value at 17P+). Matches the resources.md dropdown,
  // which merges those three options into one "14 Points" choice for the
  // same reason "Any|10P" is merged on the Chaos Star Attack core below.
  const STABLE_ATK_TABLE = {
    "None|0P": 0,
    "Any|14P": 0.007,
    "Relic|14P": 0.007, // alias of Any|14P - computeArkGridComparison's points6() always looks up "Relic"+"14P" for its merged column, never the "Any|"-prefixed key
    "Relic|17P": 0.021,
    "Relic|18P": 0.0233,
    "Relic|19P": 0.0256,
    "Relic|20P": 0.0279,
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
  const BACK_ATTACK_DPS_SHARE = 0.95; // assumed % of DPS that lands as a Back Attack
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
  // Absolute Main Stat endpoints each slot's quality roll (0-100%) can
  // land on - the actual min/max a real accessory's tooltip shows, not
  // just the max-minus-min spread ACC_QUALITY_MAIN_STAT_TABLE above
  // captures. Feeds Accessory vs. Accessory's Main Stat inputs below
  // (clamps + documents the range), which take a candidate's own typed
  // Main Stat directly rather than a Low/Mid/High quality-tier lookup.
  const ACC_MAIN_STAT_RANGE = {
    ring: { min: 10962, max: 12897 },
    earring: { min: 11806, max: 13889 },
    necklace: { min: 15178, max: 17857 },
  };
  // Ring Crit Damage's own magnitude (Acc!O7:Q7). An exact match to
  // RING_DMG_TABLE above at every tier (Low is 0.011 in both), confirmed
  // against a real character's Ring Crit Damage (+1.1%, i.e. Low). Kept
  // as a separate table anyway (see ringDmgGain
  // and otherCritDmgDelta below, which intentionally avoid reusing
  // RING_DMG_TABLE) since nothing depends on merging them and a second
  // confirmed source is good to keep around. Ring Crit Rate has no
  // equivalent new table - RING_RATE_TABLE above is an exact match to
  // Acc!O6:Q6, so that one's reused as-is.
  const ACC_RING_DMG_TABLE = { Low: 0.011, Mid: 0.024, High: 0.04 };

  // ----- Gearing (Weapon Power / Attack Power) constants -----
  // Sourced from Arsonistic's "Brace"/"Acc" sheets. Attack Power there is:
  //   AP = FLOOR(SQRT(WP * MainStat / 6) * BaseAP + FlatAP + SupAPBuff) * PercentAP
  // WP, MainStat, BaseAP%, FlatAP, and Attack Power% (PercentAP) are all
  // read from the .ap-gear-* inputs (see resources.md) - real personalized
  // stats/sums the player reads off their own character panel, same as
  // the sheet's own Calc tab expects. Main Stat % (below) is its own input,
  // same treatment as Weapon Power % - see .ap-gear-main-stat-pct. Its
  // source list (Brace!Q6/Acc!M10: Legendary Pet Ranch +1%, Legendary
  // Skins +2% each up to 4, Epic Skins +1% each up to 4) is recorded in
  // the sheet as a cell NOTE rather than a visible cell value, easy to
  // miss reading the sheet's raw cell contents.

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
  // fight-length assumption (sheet's own default, Brace!Q9) that
  // averages the cooldown-gated stacks over a fight - see Brace!P9's
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
  //   - the same Weapon Power as you (no assumed WP bump over your own
  //     entered value - assuming supports itemize WP harder than you
  //     would be unfounded)
  //   - the same Base AP% multiplier as you
  //   - a fixed AP-buff-tier coefficient, calibrated against Arsonistic's
  //     own reference support profile (Awakening engraving + ArkGrid AP
  //     nodes) - this is the one piece that can't scale off your own
  //     inputs, since it depends on the support's engraving/ArkGrid
  //     choices rather than WP/MainStat
  const SUPPORT_AP_BUFF_COEFFICIENT = 0.4;

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
    return Math.sqrt((wp * mainStat) / 6) * baseApMult * SUPPORT_AP_BUFF_COEFFICIENT * (inputs.gearSupportUptime / 100);
  }

  // Adrenaline engraving's own Attack Power component - separate from the
  // Crit Rate component already modeled above via ADRENALINE_TABLE/
  // adrenalineUptime. 0.9% AP per stack regardless of node count, assuming
  // the full 6 stacks; the Ability Stone adds its own per-stack bonus on
  // top (source: the stone's own tooltip, Lv.1-4). Goes to 0 whenever
  // Adrenaline is set to "Not Used" - matching the in-game reality that
  // skipping the engraving loses both halves together. Deliberately kept
  // OUT of the manual "Attack Power %" field (and its tooltip's source
  // list) so the two can never be double-counted; this is added on top of
  // gearAttackPowerPercentTotal instead, same as Atropine.
  //
  // Scaled by the same Adrenaline Uptime % slider as the Crit Rate side.
  // It always assumes full 6 stacks and does NOT derive an average stack
  // count from uptime (that would be wrong: 0% Crit uptime means near-0%
  // actual uptime on the buff, not "half stacks on average"). What it
  // does is a plain linear scale of the full-stacks total by Uptime %:
  // the simple assumption that the AP component is only live as often as
  // the buff itself is, same as every other uptime-gated source on this
  // page (Atropine, Strength Orb, Maelstrom, etc.).
  const ADRENALINE_AP_PER_STACK = 0.009;
  const ADRENALINE_STACKS = 6;
  const ADRENALINE_STONE_AP_TABLE = { "0 Lv.": 0, "1 Lv.": 0.0048, "2 Lv.": 0.006, "3 Lv.": 0.0083, "4 Lv.": 0.0095 };

  function adrenalineApFraction(inputs) {
    if (inputs.adrenaline === "Not Used") return 0;
    const stoneAp = ADRENALINE_STONE_AP_TABLE[inputs.adrenalineStone] || 0;
    return ADRENALINE_STACKS * (ADRENALINE_AP_PER_STACK + stoneAp) * (inputs.adrenalineUptime / 100);
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
  // input) covers ONLY accessories, with this core's own flat
  // contribution added in automatically wherever flatAp is computed
  // (see the two gearApTotal call sites below) rather than asking the
  // reader to hand-add it into that field themselves.
  // "Any|10P" covers the flat-only stage (10 Points, both grades give
  // the same +900 with no % yet), and "Any|14P" merges the 14P tier the
  // same way - grade doesn't actually diverge until 17P (Relic|14P and
  // Ancient|14P are bit-identical, 0.55%/900; see the
  // Ark Grid Core Comparison table's own header note in resources.md,
  // which already merged the same tier for the same reason). 17P+ values
  // are cumulative totals at each tier, matching how the core's own
  // tooltip lists each breakpoint as additive.
  const GEAR_AP_CHAOS_STAR_TABLE = {
    "None|0P": { pct: 0, flat: 0 },
    "Any|10P": { pct: 0, flat: 900 },
    "Any|14P": { pct: 0.55, flat: 900 },
    "Relic|14P": { pct: 0.55, flat: 900 }, // alias of Any|14P - computeArkGridComparison's points6() always looks up "Relic"+"14P" for its merged column, never the "Any|"-prefixed key
    "Relic|17P": { pct: 1.65, flat: 2700 },
    "Relic|18P": { pct: 1.81, flat: 2700 },
    "Relic|19P": { pct: 1.97, flat: 2700 },
    "Relic|20P": { pct: 2.13, flat: 2700 },
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

  // ----- ArkGrid (Chaos Core) Line Comparison lookup tables -----
  // Every Chaos Core effect type unlocks progressively as its own Points
  // investment (10/14/17/18/19/20) increases - a stat at 14p, a bigger
  // version (or a second stat) at 17p, then three more small increments
  // at 18/19/20p. Ancient roughly doubles Relic's 17p+ numbers; both
  // grades agree below that. Every table below is cumulative TOTALS at
  // each Points level (not per-tier deltas), same shape as
  // GEAR_AP_CHAOS_STAR_TABLE/STABLE_ATK_TABLE above - verified this
  // cumulative model reproduces those two tables' own values exactly
  // before building the rest of these the same way. Source: ArkGrid!Z:AI
  // on the reference sheet (each type's own row, Relic/Ancient columns).
  //
  // Chaos Core: Speed is excluded entirely (Attack/Move Speed only helps
  // below a cap this build assumes is already met, same precedent as the
  // Bracelet panel's own on-hit Atk/Move Speed line). Each other type's
  // non-damage half (Stable's DR, Swift's Attack Speed, Crushing's
  // Weapon Power Cooldown reduction, Absorbing's Healing) is excluded
  // the same way - defensive/utility, not DPS - leaving just the damage-
  // relevant half of each modeled below.
  const ARK_SWIFT_CDMG_TABLE = {
    "None|0P": 0,
    "Any|14P": 0.014,
    "Relic|14P": 0.014, // alias of Any|14P - see GEAR_AP_CHAOS_STAR_TABLE's own comment on why points6() needs this key too
    "Relic|17P": 0.042,
    "Relic|18P": 0.0465,
    "Relic|19P": 0.051,
    "Relic|20P": 0.0555,
    "Ancient|17P": 0.07,
    "Ancient|18P": 0.0745,
    "Ancient|19P": 0.079,
    "Ancient|20P": 0.0835,
  };
  const ARK_CRUSHING_CRATE_TABLE = {
    "None|0P": 0,
    "Any|14P": 0.0065,
    "Relic|14P": 0.0065, // alias of Any|14P - see GEAR_AP_CHAOS_STAR_TABLE's own comment on why points6() needs this key too
    "Relic|17P": 0.0195,
    "Relic|18P": 0.0216,
    "Relic|19P": 0.0237,
    "Relic|20P": 0.0258,
    "Ancient|17P": 0.0325,
    "Ancient|18P": 0.0346,
    "Ancient|19P": 0.0367,
    "Ancient|20P": 0.0388,
  };
  // Flashy's Dmg% half - separate from FLASHY_ATK_TABLE above, which
  // only covers its Crit Hit Damage half (see that table's own comment).
  // No "Ancient|14P" key: computeArkGridComparison's points6() always
  // reads the merged 14P column as gainFn("Relic", "14P") - it never
  // constructs an "Ancient"+"14P" lookup for any table - and this table
  // has no live select of its own to serve, unlike the merged Any|14P
  // tables above, so there's nothing else that would ever read that key.
  const ARK_FLASHY_DMG_TABLE = {
    "Relic|14P": 0.005,
    "Relic|17P": 0.015,
    "Relic|18P": 0.0166,
    "Relic|19P": 0.0182,
    "Relic|20P": 0.0198,
    "Ancient|17P": 0.02,
    "Ancient|18P": 0.0216,
    "Ancient|19P": 0.0232,
    "Ancient|20P": 0.0248,
  };
  // No "Ancient|14P" key - see ARK_FLASHY_DMG_TABLE's own comment above.
  const ARK_SMOLDERING_BOSSDMG_TABLE = {
    "Relic|14P": 0.005,
    "Relic|17P": 0.015,
    "Relic|18P": 0.0166,
    "Relic|19P": 0.0182,
    "Relic|20P": 0.0198,
    "Ancient|17P": 0.025,
    "Ancient|18P": 0.0266,
    "Ancient|19P": 0.0282,
    "Ancient|20P": 0.0298,
  };
  // Smoldering's Burn tick damage, unlike its Boss Damage half above,
  // isn't Points-gated on the reference sheet (it scales off weapon
  // damage, not Core investment) - and its own formula there is relative
  // to Bleed uptime rather than a direct %DPS figure, which doesn't
  // translate cleanly into this calculator's own methodology. Modeled
  // instead as a flat, grade-only %DPS estimate.
  const ARK_SMOLDERING_BURN_TABLE = { Relic: 0.005, Ancient: 0.0075 };
  // No "Ancient|14P" key - see ARK_FLASHY_DMG_TABLE's own comment above.
  const ARK_ABSORBING_DMG_TABLE = {
    "Relic|14P": 0.005,
    "Relic|17P": 0.015,
    "Relic|18P": 0.0166,
    "Relic|19P": 0.0182,
    "Relic|20P": 0.0198,
    "Ancient|17P": 0.025,
    "Ancient|18P": 0.0266,
    "Ancient|19P": 0.0282,
    "Ancient|20P": 0.0298,
  };
  // Chaos Core: Weapon - Weapon Power's own counterpart to
  // GEAR_AP_CHAOS_STAR_TABLE (Chaos Core: Attack) above, same shape and
  // same source (the core's own in-game tooltip at each investment
  // tier). Attack and Weapon are the SAME Chaos Core slot in-game
  // (mutually exclusive - equipping one means you don't have the
  // other), tracked via its own .ap-gear-weapon-core field (see
  // readInputs' gearWeaponCore) with the same mutual-reset wiring
  // flashyAtk/stableAtk get. "None|0P" (0/0) added on top of the raw
  // tooltip data so a reader with neither core equipped has a real
  // option to select, matching GEAR_AP_CHAOS_STAR_TABLE's own "None|0P"
  // entry. "Any|10P" (confirmed from the core's own in-game tooltip:
  // [10P] Weapon Power +1300, flat-only, no % yet) mirrors Chaos Core:
  // Attack's own 10P shape exactly - flat is set at 10P and stays fixed
  // through 14P (Attack: 900 at both 10P and 14P; Weapon: 1300 at both),
  // only stepping again at 17P. Same merged-regardless-of-grade reasoning
  // as GEAR_AP_CHAOS_STAR_TABLE's "Any|10P": the tooltip's 10P line has no
  // grade-dependent split.
  const ARK_WEAPON_CORE_TABLE = {
    "None|0P": { pct: 0, flat: 0 },
    "Any|10P": { pct: 0, flat: 1300 },
    "Any|14P": { pct: 0.75, flat: 1300 },
    "Relic|14P": { pct: 0.75, flat: 1300 }, // alias of Any|14P - see GEAR_AP_CHAOS_STAR_TABLE's own comment on why points6() needs this key too
    "Relic|17P": { pct: 2.25, flat: 3900 },
    "Relic|18P": { pct: 2.48, flat: 3900 },
    "Relic|19P": { pct: 2.71, flat: 3900 },
    "Relic|20P": { pct: 2.94, flat: 3900 },
    "Ancient|17P": { pct: 3.0, flat: 5200 },
    "Ancient|18P": { pct: 3.23, flat: 5200 },
    "Ancient|19P": { pct: 3.46, flat: 5200 },
    "Ancient|20P": { pct: 3.69, flat: 5200 },
  };
  const GEAR_AP_ASTROGEM_MAX = 4.4;
  // Ark Grid side-node levels (what this field actually tracks) cap at
  // 120, not 100 - confirmed against 1.1%/2.2%/3.3%/4.4% checkpoints at
  // 30/60/90/120 (a flat 0.03667%/level), which only land on whole
  // numbers at a 120 denominator. The OTHER Astrogem field's 0-100 scale
  // below does not apply here, and the reference sheet's own "up to 4.4%"
  // note never states a level cap, so the 120 comes from the outside
  // checkpoints above.
  const GEAR_AP_ASTROGEM_MAX_LEVEL = 120;

  // Astrogem Atk. Power Level is its OWN field (.ap-gear-ap-astrogem-lv),
  // separate from the Additional Damage group's Astrogem Level
  // (.ap-astrogem-lv) above - same source item, but Astrogem's Damage%
  // and Atk. Power% payouts are independently levelable, not two views
  // of one number. Reusing the Additional Damage field here would
  // silently force the two to always match.
  function gearAstrogemApPercent(inputs) {
    // Floored to 2 decimals, matching the in-game tile's own display
    // (confirmed against Lv.1-5/35/38 screenshots: Lv.1's raw 0.03667%
    // shows in-game as "+0.03%", not "+0.04%" - a FLOOR, not a round).
    // Carrying the raw unrounded value into the AP total instead of this
    // floored one causes a consistent ~5-7 point drift between this
    // calculator's Attack Power readout and the real character sheet
    // whenever Astrogem Atk. Power Level lands off a 30/60/90/120
    // checkpoint (e.g. Lv.35, Lv.38) - reproduced exactly (236,012 with
    // the raw value vs 236,005 real -> 0 diff once floored).
    return roundDown((inputs.gearAstrogemLv / GEAR_AP_ASTROGEM_MAX_LEVEL) * GEAR_AP_ASTROGEM_MAX, 2);
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

  // Support's Drops of Ether engraving's Strength Orb (Attack Power,
  // folded in here). Sourced from the engraving's own tooltip: Relic
  // grade at max level gives +16.00% Ether effectiveness, and a Lv.2
  // Ability Stone adds another +15.00% - the tooltip's own "Final Applied
  // Effect" line confirms these ADD (16+15 = 31.00% enhanced), not
  // multiply. Like SUPPORT_AP_BUFF_COEFFICIENT above, this is calibrated
  // to one assumed reference support engraving/stone combo rather than
  // derived from the reader's own inputs, since it depends on the
  // SUPPORT's build, not theirs.
  const SUPPORT_ETHER_EFFECTIVENESS = 0.31;
  // Base orb value before the Ether effectiveness bonus above - Strength
  // Orb's +10% Attack Power (per the engraving's Base Effect tooltip,
  // Relic grade).
  const STRENGTH_ORB_BASE_AP = 10;
  const STRENGTH_ORB_FULL_AP = STRENGTH_ORB_BASE_AP * (1 + SUPPORT_ETHER_EFFECTIVENESS);
  // Same Drops of Ether engraving's OTHER orb - Flash Orb (Crit Rate,
  // folded into critRateTotal/effectiveCritRate below instead of the AP
  // total above). Scaled by the same SUPPORT_ETHER_EFFECTIVENESS bonus
  // just above - it's a single shared "Ether effectiveness" stat that
  // scales both orbs together, not two separate ones (see that
  // constant's own comment). Base value before the Ether effectiveness
  // bonus - Flash Orb's +15% Crit Rate (per the engraving's Base Effect
  // tooltip, Relic grade).
  const FLASH_ORB_BASE_CRIT_RATE = 0.15;
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

  // ----- Attack Power readout (base -> Adrenaline -> Support, each stage
  // cumulative) -----
  // A plain restatement of the exact same gearApTotal() layer the
  // Bracelet Comparison's 5 WP/AP rows already use below (see that
  // section's own comment) - not a second formula, just that one run
  // three times with Adrenaline's percentApMult contribution and the
  // Support additive term (supApBuff) toggled on one at a time, so this
  // can never drift out of sync with the real Brace!C6 formula those
  // rows use. Only Adrenaline and Support are staged in one at a time,
  // since those are the two buffs this readout is specifically about:
  //   - base: neither Adrenaline nor Support
  //   - afterAdrenaline: Adrenaline included, Support still excluded
  //   - final: both included (your real total) - this is what every
  //     other reader on the page (Bracelet Comparison, etc.) already
  //     calls "after"
  // Unlike every other AP-based reader on this page, base and
  // afterAdrenaline additionally EXCLUDE AP% Other, Atropine, and
  // Strength Orb (excludedPct below) - those three are all
  // situational/raid buffs the Character Profile itself doesn't show
  // baked into its own number the way it does Kazeros/Guardian/Chaos
  // Core/gems, so keeping them in base/afterAdrenaline would make this
  // readout diverge from what the profile actually displays. final
  // keeps them (via percentApTotal, untouched) alongside Support, same
  // as the real total everywhere else on the page.
  // adrenalineUsed mirrors the dropdown itself (inputs.adrenaline !==
  // "Not Used"), not just whether its % happens to be nonzero, so the
  // middle stage still shows (as an equal-to-base stepping stone) at
  // e.g. 0% Adrenaline Uptime rather than silently vanishing.
  function gearApBeforeAfter(inputs) {
    const wp = inputs.gearWp;
    const mainStat = inputs.gearMainStat;
    const baseApMult = 1 + gearBaseApPercentTotal(inputs) / 100;
    const flatAp = inputs.gearFlatAp + gearChaosStarFlat(inputs.gearApChaosStar);
    const percentApTotal = gearAttackPowerPercentTotal(inputs);
    const adrenalinePct = adrenalineApFraction(inputs) * 100;
    const excludedPct =
      inputs.gearApOther +
      (inputs.gearAtropineUptime / 100) * GEAR_AP_ATROPINE_FULL +
      (inputs.gearStrengthOrbUptime / 100) * STRENGTH_ORB_FULL_AP;
    const percentApMultAfter = 1 + percentApTotal / 100;
    const percentApMultAfterExcludingOther = 1 + (percentApTotal - excludedPct) / 100;
    const percentApMultBeforeAdrenalineExcludingOther = 1 + (percentApTotal - excludedPct - adrenalinePct) / 100;
    const supApBuff = supportApBuff(inputs, wp, mainStat, baseApMult);
    return {
      base: gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMultBeforeAdrenalineExcludingOther, 0),
      afterAdrenaline: gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMultAfterExcludingOther, 0),
      final: gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMultAfter, supApBuff),
      adrenalineUsed: inputs.adrenaline !== "Not Used",
    };
  }

  // ----- Weapon Power % (Gearing) -----
  // Split into its three sources (Karmic Enlightenment, Earrings, Chaos
  // Core: Weapon) for the same reason Attack Power % above is split into
  // individual fields - see .ap-gear-wp-earring1/2's own tooltip/comment
  // in resources.md. The Bracelet panel's 5 WP/AP rows want the FULL
  // total (your real current gear, same as every other Gearing field);
  // the Accessory panel's Earrings candidate line wants just the Karmic
  // Enlightenment + Chaos Core: Weapon portion, with the Earrings portion
  // zeroed out first so the candidate isn't added on top of the 2
  // earrings' WP% already counted in the baseline - see that panel's own
  // comment for the matching treatment already applied to gearApEarring1/2.
  function gearWpKarmaPercent(inputs) {
    return inputs.gearWpKarmaLv * GEAR_WP_KARMA_PER_LEVEL;
  }
  function gearWpEarringPercent(inputs) {
    return (GEAR_WP_EARRING_TABLE[inputs.gearWpEarring1] || 0) + (GEAR_WP_EARRING_TABLE[inputs.gearWpEarring2] || 0);
  }
  // Chaos Core: Weapon's WP% half - folded into the running WP% total
  // alongside Karma/Earrings, same treatment as any other %-based WP
  // source, so a candidate flat-WP line/bonus correctly compounds with it
  // the same way it already compounds with Karma/Earrings. Its FLAT half
  // stays OUT of this total on purpose: unlike this %, which needs to be
  // known on its own to correctly scale a NEW delta, the flat amount is
  // already sitting inside whatever real Weapon Power you typed (same as
  // any other flat WP source on your gear - nothing to separately add).
  // The only place the flat half is needed on its own is
  // computeArkGridComparison's reverse-derivation of a coreless baseline,
  // which reads ARK_WEAPON_CORE_TABLE directly rather than through here.
  function gearWeaponCorePercent(inputs) {
    return (ARK_WEAPON_CORE_TABLE[inputs.gearWeaponCore] || {}).pct || 0;
  }
  function gearWpPercentTotal(inputs) {
    return gearWpKarmaPercent(inputs) + gearWpEarringPercent(inputs) + gearWeaponCorePercent(inputs);
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
  // CRIT_BASE (576): same fixed-reference treatment as SPEC_BASE right
  // above, applied to Crit Stat instead - a flat constant, NOT derived
  // from the reader's live .ap-crit-stat (see zeroedBraceletInputs'
  // comment on this, it's a subtle enough distinction that an earlier
  // draft of this got the direction backwards). Built from lv 10 Crit
  // Ark Passive (500) + roster/card bonuses (76): the non-bracelet
  // portion of a typical 658 Crit Stat total (658 - 82 current-bracelet
  // Crit = 576). Used ONLY as the Bracelet Comparison "no bracelet"
  // baseline (see zeroedBraceletInputs below), replacing the old second
  // "current bracelet's Crit Stat" input entirely. Like SPEC_BASE, this
  // isn't exact for every reader (roster/card totals vary a little, and
  // future balance passes may shift them) - readers whose non-bracelet
  // Crit differs from 576 will see a correspondingly off no-bracelet
  // baseline here, the same approximation SPEC_BASE already carries for
  // Spec.
  const CRIT_BASE = 576;
  // awakeningShare is per-CLASS, not per-build: it's the Awakening skill's
  // own share of total DPS (see the big comment above
  // deathbladeSpecMultiplier), which doesn't vary between e.g. RE 111 and
  // RE 313 the way the namesake skill's own share does.
  const RE_AWAKENING_SHARE = 0.015;
  const SURGE_AWAKENING_SHARE = 0.01;
  // One entry per selectable build - the master Build toggle at the top
  // of the calculator (and its ap-brace-spec-build select) picks one of
  // these five directly (RE 111 and RE 313 merged into one "re-111"
  // entry - see normalizeBraceSpecBuild), and its own `share` drives the
  // Spec +80/100/120 row (and the Bracelet vs. Bracelet Spec input)
  // straight from that selection. Every build is directly selectable, so
  // every build's share lives here on equal footing.
  const BRACE_SPEC_BUILDS = {
    "re-111": { label: "RE 111/313", isSurge: false, share: 0.20, awakeningShare: RE_AWAKENING_SHARE },
    "re-333": { label: "RE 333", isSurge: false, share: 0.17, awakeningShare: RE_AWAKENING_SHARE },
    "surge-111": { label: "Surge 111", isSurge: true, share: 0.75, awakeningShare: SURGE_AWAKENING_SHARE },
    "surge-222": { label: "Surge 222", isSurge: true, share: 0.50, awakeningShare: SURGE_AWAKENING_SHARE },
    "surge-333": { label: "Surge 333", isSurge: true, share: 0.45, awakeningShare: SURGE_AWAKENING_SHARE },
  };
  // "re-313" is retired as its own entry: every formula that reads
  // BRACE_SPEC_BUILDS was traced and RE 111/RE 313 turned out to be
  // 100% computationally identical (same share, same awakeningShare,
  // nothing anywhere else branches on which of the two is selected) -
  // see the Family/Variant Build toggle redesign. "re-111" is now the
  // one canonical id for both; this normalizes any lingering "re-313"
  // (an old Export string, a pre-redesign localStorage blob, or a Bible
  // import) to it. The hidden select's own <option value="re-313"> is
  // deliberately kept (see resources.md) so an old saved value still
  // resolves to a real option instead of silently clearing - this is
  // the only place that needs to know "re-313" ever existed.
  function normalizeBraceSpecBuild(id) {
    return id === "re-313" ? "re-111" : id;
  }
  function braceSpecConfig(inputs) {
    return BRACE_SPEC_BUILDS[inputs.braceSpecBuild] || BRACE_SPEC_BUILDS["re-333"];
  }

  // Single source of truth for turning the reader's Back Attack Rate %
  // input into the actual fraction of DPS that lands as a Back Attack.
  // Combat Analyzer's own Overview "Back Attack Rate" stat (NOT its
  // "Back Attack Percentage" - that one is damage-weighted and answers a
  // different question) was verified against two real logs' Attack
  // Information tabs to already be a Damage-Share-weighted average
  // restricted to Back-Attack-capable skills, and for RE builds it reads
  // as if Deathblade Surge is excluded from that average - RE's Surge
  // always lands as a Back Attack regardless of positioning, so folding
  // it into a "how good is your positioning" stat would just water the
  // number down with a skill that has no failure state. That means the
  // reader's rate is already "the rate among the non-guaranteed pool"
  // for RE, and it should NOT also be gated by a flat
  // BACK_ATTACK_DPS_SHARE multiply on top of a separate guaranteed-share
  // add-on - the two would double-count Surge's contribution.
  // Surge-spec builds have no equivalent carve-out: Surge's own namesake
  // skill is NOT a guaranteed Back Attack (it actually has to land as
  // one), so the whole BACK_ATTACK_DPS_SHARE pool is gated by the rate.
  function effectiveBackAttackShare(inputs) {
    const rate = Math.max(0, Math.min(1, inputs.backAttackRate / 100));
    const cfg = braceSpecConfig(inputs);
    if (cfg.isSurge) {
      return BACK_ATTACK_DPS_SHARE * rate;
    }
    const alwaysBack = Math.min(cfg.share, BACK_ATTACK_DPS_SHARE);
    const variablePool = BACK_ATTACK_DPS_SHARE - alwaysBack;
    return alwaysBack + variablePool * rate;
  }

  // Reads the master Build toggle's real state (the ap-brace-spec-build
  // select - see its own comment in resources.md) straight from the DOM,
  // for call sites that need the build's config (isSurge, share) before a
  // full readInputs() has happened yet - Engraving Comparison's derived
  // Playstyle and the Mana Food default listener both go through this
  // one lookup so they can never disagree about which build is actually
  // selected.
  function currentBraceSpecBuildId(root) {
    return normalizeBraceSpecBuild(getSelect(root, ".ap-brace-spec-build", "re-333"));
  }
  function currentBuildConfig(root) {
    return BRACE_SPEC_BUILDS[currentBraceSpecBuildId(root)] || BRACE_SPEC_BUILDS["re-333"];
  }
  function isSurgeBuild(root) {
    return !!currentBuildConfig(root).isSurge;
  }
  // 222's own gearing more easily clears the Bleed rune's stat threshold
  // without Mana Food's help (see MANAFOOD_TIP_222_SUFFIX below), so 222
  // is the one Surge build whose Mana Food is treated as Main-Stat-only,
  // same as RE - see manaFoodBleedApplies, the actual gate this feeds.
  function is222Build(root) {
    return currentBraceSpecBuildId(root) === "surge-222";
  }
  // The "Mana Food (Main Stat only)" choice (food without the Bleed rune on
  // Maelstrom) is offered on the Surge builds where the regular Mana Food
  // box means Bleed: 111 and 333. On 222 and RE the single Mana Food box
  // already is the Main Stat only food, so there is nothing to choose
  // there. This gates both the row and whether a ticked box is allowed to
  // count (see readEngravingInputs).
  function isSurgeBleedFoodBuild(root) {
    const id = currentBraceSpecBuildId(root);
    return id === "surge-111" || id === "surge-333";
  }

  // Maelstrom Uptime's own sensible default varies by build: RE and
  // Surge 111/333 share a rotation shape close enough that one number
  // fits both, but Surge 222's own faster-paced rotation clears more of
  // its casts, so a flatly shared default would undersell 222 (if set to
  // the RE/111/333 number) or oversell RE/111/333 (if set to 222's own
  // number). Grouped the same way Mana Food's own RE<->Surge default
  // crossing listener is below, just with 3 groups instead of 2 - see
  // that listener's own comment for why this only re-applies on an
  // actual GROUP crossing, not every build switch (RE 111 -> RE 313, or
  // Surge 111 -> Surge 333, must NOT stomp a mid-session manual
  // Maelstrom Uptime edit).
  const MAELSTROM_UPTIME_DEFAULT_RE = 85;
  const MAELSTROM_UPTIME_DEFAULT_SURGE = 80;
  const MAELSTROM_UPTIME_DEFAULT_SURGE_222 = 90;
  function maelstromUptimeDefaultGroup(root) {
    if (!isSurgeBuild(root)) return "re";
    return is222Build(root) ? "surge-222" : "surge";
  }
  function maelstromUptimeDefaultForGroup(group) {
    if (group === "surge-222") return MAELSTROM_UPTIME_DEFAULT_SURGE_222;
    if (group === "surge") return MAELSTROM_UPTIME_DEFAULT_SURGE;
    return MAELSTROM_UPTIME_DEFAULT_RE;
  }

  // Fallback default for the Family chips (RE / Surge) in the two-tier
  // Build toggle, used only when the target family has no remembered
  // variant yet this session (see initApCalcRoot's familyVariantMemory,
  // which takes priority - crossing families normally returns you to
  // whichever variant you were last on within the target family, not
  // always this fixed default). RE only has 2 variant slots (111/313
  // merged, 333) against Surge's 3 (111, 222, 333), so this is a fixed
  // lookup rather than a positional swap: 111<->111 keeps its obvious
  // counterpart, and RE 333 pairs with Surge 222 (not 333) since 222 is
  // Surge's own default/most common variant - Surge 333 has no distinct
  // RE counterpart and is only ever reached by picking its own Variant
  // chip directly, never by a Family crossing's default. Kept symmetric:
  // RE 333 <-> Surge 222 works both directions, and Surge 333 -> RE
  // still lands somewhere sane (RE 333) rather than falling through to
  // the merged 111/313 chip.
  const FAMILY_CROSSING_MAP = {
    "re-111": "surge-111",
    "re-333": "surge-222",
    "surge-111": "re-111",
    "surge-222": "re-333",
    "surge-333": "re-333",
  };

  // Keeps the docked Build toggle's chip row visually in sync with the
  // real ap-brace-spec-build select's current value - called at the top
  // of update() so every path that can change the select (a chip click,
  // Import/Export, a preset load/switch/reset, or initial page load)
  // re-applies the "one vivid, rest muted" look without each of those
  // call sites needing to know about chips at all. Also self-heals a
  // lingering "re-313" select value (see normalizeBraceSpecBuild) back
  // onto the real select the first time this runs, so a legacy saved
  // value converges to the canonical id going forward instead of
  // silently mismatching every chip's data-build on every call.
  function syncBuildToggleUI(root) {
    const select = root.querySelector(".ap-brace-spec-build");
    if (!select) return;
    const normalized = normalizeBraceSpecBuild(select.value);
    if (normalized !== select.value) select.value = normalized;
    const active = normalized;
    const family = isSurgeBuild(root) ? "surge" : "re";
    root.querySelectorAll(".ap-build-family-chip").forEach((chip) => {
      const isActive = chip.dataset.family === family;
      chip.classList.toggle("ap-build-chip-active", isActive);
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    let activeVariantLabel = "";
    root.querySelectorAll(".ap-build-variant-chip").forEach((chip) => {
      const isActive = chip.dataset.build === active;
      chip.classList.toggle("ap-build-chip-active", isActive);
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
      if (isActive) activeVariantLabel = chip.textContent;
    });
    // Only one Variant tier (RE's 2 chips or Surge's 3) is ever shown at
    // once - the other family's tier is hidden rather than dropped, same
    // hidden-unless-active convention as the Breaking Moon summary row.
    root.querySelectorAll(".ap-build-toggle-tier--variant").forEach((tier) => {
      const tierFamily = tier.classList.contains("ap-build-toggle-tier--variant-surge") ? "surge" : "re";
      tier.classList.toggle("ap-build-toggle-tier--hidden", tierFamily !== family);
    });
    // Mobile's collapsed trigger pill has no chip row of its own to read
    // at a glance, so it carries the resolved build as its own label
    // (e.g. "RE 111/313") - built straight from the currently-active
    // variant chip's own text rather than a second hardcoded label map,
    // so it can't drift out of sync with what the chips actually say.
    const triggerLabel = root.querySelector(".ap-build-dock-trigger-label");
    if (triggerLabel && activeVariantLabel) {
      triggerLabel.textContent = (family === "surge" ? "Surge " : "RE ") + activeVariantLabel;
    }
  }

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
  // Optimized Training Lv 1 (the .ap-ot1 checkbox) takes one of the same 3
  // keystone levels Limit Break/Keen Sense share, so with it on only 2 are
  // left to split between them. Only its fixed +5% Evo Dmg is modeled - its
  // cooldown reduction deliberately isn't (see OPTIMIZED_TRAINING_EVO_DMG).
  // Keys are distinct from EVOLUTION_SPLITS' own so a Top Combinations pin
  // made in one mode can never be mistaken for a combo in the other (see
  // update()'s pin check).
  const EVOLUTION_SPLITS_OT1 = [
    { key: "ot1-lb2ks0", limitBreak: 2, keenSense: 0, label: "OT1/LB2" },
    { key: "ot1-lb1ks1", limitBreak: 1, keenSense: 1, label: "OT1/LB1/KS1" },
    { key: "ot1-lb0ks2", limitBreak: 0, keenSense: 2, label: "OT1/KS2" },
  ];
  const OPTIMIZED_TRAINING_EVO_DMG = 0.05;
  // The one place that decides which split set is in play - every loop
  // that needs the splits goes through this rather than reading
  // EVOLUTION_SPLITS directly.
  function splitsFor(ot1Active) {
    return ot1Active ? EVOLUTION_SPLITS_OT1 : EVOLUTION_SPLITS;
  }
  const LIMIT_BREAK_EVO_DMG = [0, 0.1, 0.2, 0.3];
  const KEEN_SENSE_EVO_DMG = [0, 0.05, 0.1];
  const KEEN_SENSE_CRIT_RATE = [0, 0.04, 0.08];

  const COMBINED_KEYSTONES = ["crit+master", "crit+pulv", "master+pulv"];
  const KEYSTONE_LABELS = {
    "crit+master": "Critical + Master",
    "crit+pulv": "Critical + Pulverize",
    "master+pulv": "Master + Pulverize",
  };

  // Top Combinations: per-root UI-only state for previewing a non-best
  // cell's stats in the Best Setup card (previewRank), and for PINNING
  // one of the 2nd-5th-best cells as the combo every bestComboFor()
  // search on the page should resolve to instead of re-searching all 9
  // (pinnedCombo - see bestComboFor's own comment). Both are deliberately
  // NOT persisted (not in readInputs' localStorage round-trip, not part
  // of export/import) - a reader's "let me look at/base everything on
  // something other than the true best" choice, not a build choice, so
  // both reset to "auto" (rank 1, unpinned) on reload same as any other
  // transient UI state. previewRank alone never affects any calculation
  // (see renderGrid's own comment); pinnedCombo does, deliberately, for
  // every panel below the grid - that's the whole point of pinning.
  // pinnedCombo is stored as { splitKey, pair } (matching EVOLUTION_
  // SPLITS' own .key and COMBINED_KEYSTONES strings) rather than a rank
  // number, since which rank a given combo occupies can change as the
  // reader edits other inputs - identity has to survive a re-sort.
  const apCalcSelection = new WeakMap();
  function getApCalcSelection(root) {
    let state = apCalcSelection.get(root);
    if (!state) {
      state = { previewRank: 1, pinnedCombo: null };
      apCalcSelection.set(root, state);
    }
    return state;
  }

  // Resolves a stored { splitKey, pair } pin back into the real
  // { split, pair } shape bestComboFor's search loop uses (split is one
  // of the actual EVOLUTION_SPLITS objects, looked up by its .key -
  // pinnedCombo itself only stores the key, not the object, so this is
  // the one place that ever has to know EVOLUTION_SPLITS' shape for it).
  // Returns null for a null/unresolvable pin (e.g. a stale key) rather
  // than throwing, so a bad pin just quietly falls back to normal
  // re-search instead of breaking the calculator.
  function resolvePinnedCombo(pinnedCombo, ot1Active) {
    if (!pinnedCombo) return null;
    const split = splitsFor(ot1Active).find((s) => s.key === pinnedCombo.splitKey);
    if (!split) return null;
    return { split, pair: pinnedCombo.pair };
  }

  // Active pin for bestComboFor's search below, for the duration of one
  // update(root) call only. Module-level scratch rather than a
  // bestComboFor(...) parameter so none of its ~30 existing call sites
  // (scattered across every compute*Comparison function, several calls
  // deep inside update()) need touching. Safe because update() is fully
  // synchronous top to bottom (no awaits anywhere in its call chain) and
  // .ap-calc roots are always processed one at a time by registerRenderer
  // - so this can never be read for the wrong root or leak between two
  // roots' updates. Set right before the compute*/render* chain in
  // update(root) and cleared in a finally right after, so a mid-update
  // throw can't leave a stale pin active for whatever runs next.
  let activePinnedCombo = null;

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

  // Reads one side (A or B) of the Bracelet vs. Bracelet inputs into the
  // { spec, critStat, lines, demons, cdEstimate } shape computeSingleBracelet
  // expects. Each line carries both `tier` (Low/Mid/High, used by every line
  // type except STR/DEX/INT) and `mainStat` (a direct 10000-16000 amount,
  // used only when type is "stat_main") - see enforceBvbLineControls for why
  // STR/DEX/INT gets a free-typed number instead of a tier dropdown, and
  // computeSingleBracelet for where mainStat actually gets consumed.
  // `demons`/`cdEstimate` are per-SIDE, not per-line, since only one of a
  // side's 3 free lines can ever be add_b (or damage_cd) at once - see
  // enforceBvbLineExclusivity - so one checkbox each covers the whole side.
  // See braceletFlatLineGain's own comment for what each toggles.
  function readBvbSide(root, prefix) {
    const base = ".ap-bvb-" + prefix + "-";
    return {
      spec: Math.max(60, Math.min(120, getNumber(root, base + "spec", 80))),
      critStat: Math.max(60, Math.min(120, getNumber(root, base + "crit", 80))),
      // Basic Effect 2's own type (crit/main/none) - see the markup's own
      // comment above ap-bvb-cards for why this exists. Both the Crit
      // Stat and Main Stat values are read unconditionally (whichever
      // input is currently hidden just keeps whatever it last held)
      // rather than zeroed here, so toggling the type back and forth
      // doesn't lose a typed value - computeSingleBracelet is what
      // actually decides which one (if either) counts.
      effect2Type: getSelect(root, base + "effect2-type", "crit"),
      effect2MainStat: Math.max(10000, Math.min(16000, getNumber(root, base + "effect2-mainstat", 14000))),
      lines: [1, 2, 3].map((n) => ({
        type: getSelect(root, base + "line" + n + "-type", "none"),
        tier: getSelect(root, base + "line" + n + "-tier", "Mid"),
        mainStat: Math.max(10000, Math.min(16000, getNumber(root, base + "line" + n + "-mainstat", 14000))),
      })),
      demons: getCheckbox(root, base + "demons", false),
      cdEstimate: getCheckbox(root, base + "cdest", true),
    };
  }

  // Reads one side (A or B) of the Accessory vs. Accessory candidate for
  // whichever slot is currently selected (see AVB_SLOT_LABELS/
  // enforceAvbSlotUI). Main Stat is a real, typed absolute value clamped
  // to that slot's real min/max range (see ACC_MAIN_STAT_RANGE) rather
  // than a quality-tier lookup. Line 1/2 are always that slot's own 2
  // guaranteed lines - only which of THIS calculator's tracked effects
  // (if any) landed on them varies, so no type <select> is needed, only
  // a tier (Low/Mid/High, or None for "this accessory's real roll isn't
  // one of the 2 tracked effects" - see computeAccessoryVsAccessory for
  // how None resolves to 0 the same way it does everywhere else on this
  // page) - unlike Bracelet vs. Bracelet's free-typed line rows. Only
  // Line 3 (the one optional universal line) needs a type <select>.
  function readAvbSide(root, slot, prefix) {
    const base = ".ap-avb-" + prefix + "-";
    const range = ACC_MAIN_STAT_RANGE[slot];
    return {
      mainStat: Math.max(range.min, Math.min(range.max, getNumber(root, base + "mainstat", range.max))),
      line1Tier: getSelect(root, base + "line1-tier", "High"),
      line2Tier: getSelect(root, base + "line2-tier", "High"),
      line3Type: getSelect(root, base + "line3-type", "none"),
      line3Tier: getSelect(root, base + "line3-tier", "Mid"),
    };
  }

  function readInputs(root) {
    const inputs = {
      critStat: Math.max(0, Math.min(900, getNumber(root, ".ap-crit-stat", 658))),
      weaponQuality: Math.max(0, Math.min(100, getNumber(root, ".ap-weapon-quality", 100))),
      astrogemLv: Math.max(0, Math.min(120, getNumber(root, ".ap-astrogem-lv", 59))),

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

      necklace: getSelect(root, ".ap-necklace", "High"),
      shPet: getSelect(root, ".ap-sh-pet", "High"),

      adrenaline: getSelect(root, ".ap-adrenaline", "4 Nodes"),
      adrenalineUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-adrenaline-uptime", 97))),
      adrenalineStone: getSelect(root, ".ap-adrenaline-stone", "0 Lv."),
      kbw: getSelect(root, ".ap-kbw", "4 Nodes"),
      kbwStone: getSelect(root, ".ap-kbw-stone", "0 Lv."),

      critRateDual: getCheckbox(root, ".ap-crit-rate-dual", true),
      critDmgDual: getCheckbox(root, ".ap-crit-dmg-dual", true),

      flashyAtk: getSelect(root, ".ap-flashy-atk", "Ancient 17P"),
      stableAtk: getSelect(root, ".ap-stable-atk", "None|0P"),
      // Chaos Core: Swift - Crit Dmg only (see ARK_SWIFT_CDMG_TABLE's own
      // comment for why only that half is modeled). Same "current gear"
      // tracked-field treatment as Flashy/Stable just above, and the same
      // equipment-slot exclusivity with them - Flashy, Stable, and Swift
      // are three options for the SAME Chaos Core slot, so only one can
      // ever be a real tier at once (see EXCLUSIVE_GROUPS).
      swiftCore: getSelect(root, ".ap-swift-core", "None|0P"),

      critSyn1: getCheckbox(root, ".ap-crit-syn1", false),
      critSyn2: getCheckbox(root, ".ap-crit-syn2", false),
      critHitSyn1: getCheckbox(root, ".ap-crit-hit-syn-1", false),
      critHitSyn2: getCheckbox(root, ".ap-crit-hit-syn-2", false),
      // Support's Crit Rate/Crit Dmg bracelet lines - see
      // SUPPORT_CRIT_RATE_BRACELET_TABLE/SUPPORT_CRIT_DMG_BRACELET_TABLE's
      // own comment above. Read here unconditionally (whatever's sitting in
      // the select); zeroed back to "None" below if Support isn't checked -
      // see the code-level gate at the end of this function.
      supportCritRateBracelet: getSelect(root, ".ap-support-crit-rate-bracelet", "None"),
      supportCritDmgBracelet: getSelect(root, ".ap-support-crit-dmg-bracelet", "None"),
      backAttackRate: Math.max(0, Math.min(100, getNumber(root, ".ap-back-attack-rate", 85))),
      // Support's Flash Orb (Drops of Ether) - same "% of the fight it's
      // up" pattern as Adrenaline Uptime/Back Attack Rate above, see
      // FLASH_ORB_FULL_CRIT_RATE's own comment for the assumed
      // engraving/stone combo baked into the full-uptime value. Only
      // meaningful while a Support is actually in the party - UI-disabled
      // off .ap-yearning the same way Strength Orb Uptime already is (see
      // enforceGearSupportUptimeGate) AND zeroed at the code level below if
      // unchecked (see the gate at the end of this function). Defaults to 0
      // (not used).
      flashOrbUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-flash-orb-uptime", 0))),

      yearning: getCheckbox(root, ".ap-yearning", true),
      // Optimized Training Lv 1 - see EVOLUTION_SPLITS_OT1. Defaults off.
      optimizedTraining: getCheckbox(root, ".ap-ot1", false),
      evoKarmaRank: parseInt(getSelect(root, ".ap-evo-karma", "6"), 10) || 6,

      // Card Demon Dmg % is hardcoded to the universal 7% value rather
      // than an input: it basically never varies, so a field would be
      // pure clutter.
      demonDmgPct: 7,
      braceSpecBuild: normalizeBraceSpecBuild(getSelect(root, ".ap-brace-spec-build", "re-333")),

      // Bracelet vs. Bracelet: two full 5-line candidate bracelets, read
      // separately - see readBvbSide/computeBraceletVsBracelet above.
      bvbA: readBvbSide(root, "a"),
      bvbB: readBvbSide(root, "b"),

      // Accessory vs. Accessory: one "Comparing" selector picks which
      // slot's line pool is in play (see AVB_SLOT_LABELS). Accessory A is
      // always treated as your real currently-equipped piece - its own
      // typed Main Stat, and Line 3 Flat AP/WP if set, get subtracted
      // from Gearing's totals to build the "no accessory" baseline, so
      // the comparison doesn't double-count them. There is no
      // "Slot Currently Empty" option to treat Accessory A as a second
      // hypothetical (nothing backed out): this tool's only real use is
      // "should I replace what I have equipped", which always means A
      // really is equipped; the
      // reference table above already covers "value one line in
      // isolation" for anyone who doesn't have a real current piece to
      // compare against. See computeAccessoryVsAccessory for how this
      // resolves.
      avbSlot: getSelect(root, ".ap-avb-slot", "necklace"),
      avbA: readAvbSide(root, getSelect(root, ".ap-avb-slot", "necklace"), "a"),
      avbB: readAvbSide(root, getSelect(root, ".ap-avb-slot", "necklace"), "b"),
      // Rings and Earrings come in pairs, but this tool only lets you
      // shop for ONE of the two at a time (see AVB_SLOT_LABELS' own
      // comment on why there's no ring1/earring1-vs-ring2/earring2
      // selector). The OTHER slot's real Crit Rate/Dmg (Ring) or AP%/WP%
      // (Earring) can NOT be read off ring2Rate/Dmg or gearApEarring2/
      // WpEarring2 in the Gearing panel above - those are just "however
      // you happened to enter your two real pieces" (Earring 1 vs 2 with
      // no defined mapping), and Accessory A (the piece actually being
      // swapped here) could just as easily be sitting in Gearing's slot
      // 2 as slot 1. Reading ring2Rate/gearApEarring2 directly would then
      // silently zero out the wrong slot and read Accessory A's own
      // stats back in as "the other one" - a real misattribution/double-
      // count, not a hypothetical - and there's no signal on the page
      // that tells the tool which is which. So these two get their own
      // isolated fields instead, entered once here, independent of
      // Gearing entirely. They're mandatory rather than checkbox-gated
      // (no opt-in "Other Ring/Earring Equipped" toggle defaulting to an
      // assumed-empty state) because a second ring/earring always
      // physically exists - "assumed empty" can never be true for a real
      // character. Main Stat and Flat AP/Flat WP don't need this same
      // treatment: those're whole-character totals (gearMainStat/gearWp/
      // gearFlatAp) that already have the other piece's share baked in
      // with no way to subtract it back out - see equippedMainStat/
      // equippedFlatApDelta/equippedWpDelta below, which only ever back
      // out Accessory A's own known share, leaving whatever the other
      // piece contributes untouched in the total the whole time.
      avbOtherLine1Tier: getSelect(root, ".ap-avb-other-line1-tier", (AVB_SLOT_LABELS[getSelect(root, ".ap-avb-slot", "necklace")] || AVB_SLOT_LABELS.necklace).otherLine1Default),
      avbOtherLine2Tier: getSelect(root, ".ap-avb-other-line2-tier", (AVB_SLOT_LABELS[getSelect(root, ".ap-avb-slot", "necklace")] || AVB_SLOT_LABELS.necklace).otherLine2Default),

      // Gearing (Weapon Power / Attack Power) - feeds only the 5
      // WP/AP bracelet lines below, entirely separate from the Ark
      // Passive grid above. See the constants block above this function.
      // Upper bounds (1M WP, 2M Main Stat, 6K Flat AP) are sanity caps,
      // not real game limits - just enough headroom to keep a stray typo
      // from producing an absurd on-page number.
      gearWp: Math.max(0, Math.min(1000000, getNumber(root, ".ap-gear-wp", 259216))),
      // Weapon Power % is split into separate sources (Karma/Enlightenment
      // and both earrings' WP%) so each can be zeroed out - see
      // gearWpPercentTotal above. Karmic Enlightenment is a Level
      // input (1-30, +0.1%/level) same as Astrogem's Level fields below;
      // the two Earring dropdowns match Attack Power's own Earrings row
      // exactly (gearApEarring1/2 below).
      gearWpKarmaLv: Math.max(0, Math.min(30, getNumber(root, ".ap-gear-wp-karma-lv", 30))),
      gearWpEarring1: getSelect(root, ".ap-gear-wp-earring1", "Mid"),
      gearWpEarring2: getSelect(root, ".ap-gear-wp-earring2", "Mid"),
      gearMainStat: Math.max(0, Math.min(2000000, getNumber(root, ".ap-gear-main-stat", 854918))),
      // % bonus to Main Stat GRANTED by Bracelet/Accessory "STR/DEX/INT"
      // candidate lines only, not to the stat entered above - same role
      // as Weapon Power % below, just for Main Stat. Sourced from
      // Legendary Pet Ranch (+1%) and costume set bonuses (Legendary
      // Skins +2% each up to 4, Epic Skins +1% each up to 4) - see the
      // constants block near the top of this file. Default (9%): Pet
      // Ranch + 4 Legendary Skins.
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
      gearFlatAp: Math.max(0, Math.min(2000, getNumber(root, ".ap-gear-flat-ap", 0))),
      // Attack Power % is split into its individual sources (the
      // reference sheet's own Calc!N7 is a single hand-typed sum) - see
      // gearAttackPowerPercentTotal below for how they're combined, so
      // nobody has to add these up by hand.
      gearApEarring1: getSelect(root, ".ap-gear-ap-earring1", "High"),
      gearApEarring2: getSelect(root, ".ap-gear-ap-earring2", "High"),
      gearApKazeros: getCheckbox(root, ".ap-gear-ap-kazeros", false),
      gearApGuardian: getCheckbox(root, ".ap-gear-ap-guardian", false),
      gearApChaosStar: getSelect(root, ".ap-gear-ap-chaos-star", "Relic|20P"),
      // Chaos Core: Weapon - the same physical Chaos Core slot as
      // gearApChaosStar above (mutually exclusive, see that field's own
      // comment and ARK_WEAPON_CORE_TABLE's). Defaults to "None|0P"
      // rather than mirroring gearApChaosStar's real-tier default,
      // since both defaulting to a real tier at once would contradict
      // the exclusivity this field exists to enforce.
      gearWeaponCore: getSelect(root, ".ap-gear-weapon-core", "None|0P"),
      // Astrogem Atk. Power Level - independent of the Additional
      // Damage group's Astrogem Level field above, see
      // gearAstrogemApPercent's own comment.
      gearAstrogemLv: Math.max(0, Math.min(120, getNumber(root, ".ap-gear-ap-astrogem-lv", 35))),
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
      // enforceGearSupportUptimeGate, which UI-disables this the same way
      // it already disables Support AP Buff Uptime off .ap-yearning, AND
      // the code-level gate at the end of this function, which zeroes it
      // if unchecked (unlike gearSupportUptime, this isn't already gated
      // inside supportApBuff, since it feeds gearAttackPowerPercentTotal
      // instead). Defaults to 0 (not used).
      gearStrengthOrbUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-gear-strength-orb-uptime", 0))),
      // Not its own checkbox - whether Support's AP buff applies at all
      // is decided entirely by the Party & Positioning group's "Support:
      // Passionate Dance" toggle (.ap-yearning); reading that directly
      // keeps one real checkbox for this fact instead of two kept in sync.
      gearSupport: getCheckbox(root, ".ap-yearning", true),
      // Only matters while gearSupport is true (the field itself is
      // disabled in the UI otherwise, see enforceGearSupportUptimeGate).
      // Scales the SIZE of the buff, not whether it applies.
      gearSupportUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-gear-support-uptime", 98))),
      // Chaos Core: Crushing - Crit Rate only (see ARK_CRUSHING_CRATE_TABLE's
      // own comment). A DIFFERENT Chaos Core slot from Flashy/Stable/Swift
      // above, so no exclusivity wiring against those. In-game it's
      // actually mutually exclusive with Absorbing/Smoldering instead, but
      // neither of those has a tracked "current gear" field of its own to
      // enforce that against (see computeArkGridComparison's own comment
      // on that pair) - nothing to wire until one does.
      crushingCore: getSelect(root, ".ap-crushing-core", "None|0P"),
    };

    // Code-level Support gate, in addition to enforceGearSupportUptimeGate's
    // UI-only disable. Flash Orb Uptime, Strength Orb Uptime, and the two
    // Support bracelet selects are all only claimable while a Support is
    // actually in the party (.ap-yearning / gearSupport checked) - the same
    // dependency supportApBuff already enforces at the code level via its
    // own `if (!inputs.gearSupport) return 0;` guard. Without this, a value
    // picked while Support was checked stays sitting in the (now merely UI-
    // disabled) DOM control and every downstream consumer -
    // gearAttackPowerPercentTotal, critRateTotal, computeShared's
    // critDmgTotal, and anything else that reads these fields - would keep
    // counting it even after Support is unchecked (real bug, caught by
    // reader report: None+Support-off and High+Support-off produced
    // different effective Crit Rate, when they must be identical since
    // neither state has a Support). Normalizing once here, at the single
    // point every formula reads inputs from, means no individual consumer
    // needs its own repeated `if (!inputs.gearSupport)` check - and no
    // future consumer can forget one. gearSupportUptime itself doesn't need
    // the same treatment: supportApBuff already code-gates it directly.
    if (!inputs.gearSupport) {
      inputs.flashOrbUptime = 0;
      inputs.gearStrengthOrbUptime = 0;
      inputs.supportCritRateBracelet = "None";
      inputs.supportCritDmgBracelet = "None";
    }

    return inputs;
  }

  function roundDown(x, n) {
    const f = Math.pow(10, n);
    return Math.floor(x * f) / f;
  }

  // Breaking Moon (Surge 111 only): every 4th Surge cast (1st, 5th, 9th...)
  // gets +60% Crit Damage - a 25% empowered-cast rate. Surge 111's own
  // `share` in BRACE_SPEC_BUILDS (0.75) already bakes in this elevated-
  // cast-rate swing (confirmed real data, not re-derived here), so the
  // average per-cast Crit Dmg contribution is just
  // share * 0.25 (empowered-cast rate) * 0.60 (Breaking Moon's own bonus)
  // - about +11.25 percentage points for Surge 111. Additive into
  // critDmgTotal exactly like every other Crit Dmg source below, so it
  // automatically flows through the keystone grid (getKeystoneComponents/
  // combinedMultiplier), KBW/Adrenaline math, and Spec math with no
  // separate keystone-specific branching - and because it shifts
  // critDmgTotal, it can genuinely change which keystone pair comes out
  // on top for Surge 111, so it's surfaced as its own labeled line (see
  // renderGrid's Breaking Moon row) rather than silently folded into the
  // combined Crit Dmg stat.
  function breakingMoonContribution(inputs) {
    const active = inputs.braceSpecBuild === "surge-111";
    const spec = BRACE_SPEC_BUILDS["surge-111"];
    return { active, add: active ? spec.share * 0.25 * 0.6 : 0 };
  }

  // ----- Core computations -----
  function computeShared(inputs) {
    const breakingMoon = breakingMoonContribution(inputs);
    const critDmgTotal =
      CRIT_DMG_BASE +
      (RING_DMG_TABLE[inputs.ring1Dmg] || 0) +
      (RING_DMG_TABLE[inputs.ring2Dmg] || 0) +
      (BRACELET_DMG_TABLE[inputs.braceletDmg] || 0) +
      (BRACELET_DMG_TABLE[inputs.braceletDmg2] || 0) +
      (KBW_TABLE[inputs.kbw] || 0) +
      (KBW_STONE_TABLE[inputs.kbwStone] || 0) +
      STRIKE_CRIT_DMG +
      (ARK_SWIFT_CDMG_TABLE[inputs.swiftCore] || 0) +
      (SUPPORT_CRIT_DMG_BRACELET_TABLE[inputs.supportCritDmgBracelet] || 0) +
      breakingMoon.add;

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
    const optimizedTrainingEvo = inputs.optimizedTraining ? OPTIMIZED_TRAINING_EVO_DMG : 0;

    return {
      critDmgTotal,
      breakingMoonActive: breakingMoon.active,
      breakingMoonAdd: breakingMoon.add,
      onCritDmgBase,
      onCritDmgCritical,
      addDmgBase,
      addDmgMaster,
      yearningEvo,
      evoKarmaEvo,
      optimizedTrainingEvo,
    };
  }

  // Isolated DPS gain from one flat Crit Dmg contributor (e.g. Keen Blunt
  // Weapon's engraving bonus/Ability Stone, or Breaking Moon's average
  // per-cast add - see breakingMoonContribution), expressed as "% damage
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
  // it grants. Applied once, flat, on top of the whole post-KBW damage
  // total whenever KBW is actually equipped - see combinedMultiplier's own
  // kbwActive gate below for where this actually lands.
  const KBW_EV_MALUS = 0.98;

  // Keen Blunt Weapon's realized DPS gain: a real re-optimized with/without
  // comparison, not a closed-form ratio - KBW's Crit Dmg value feeds
  // straight into shared.critDmgTotal (see computeShared), which is part
  // of the grid formula itself, so removing it can genuinely flip which of
  // the 9 keystone+split cells bestComboFor picks (e.g. Master's higher
  // effCrit stops being worth it once Critical's on-crit multiplier no
  // longer has KBW's larger Crit Dmg to amplify) - confirmed live: a
  // default-settings run had KBW's own best cell at Master+Pulverize/LB1-KS2
  // while the true no-KBW baseline actually preferred Critical+Pulverize/
  // LB1-KS2, a difference a fixed-cell formula has no way to see. Reuses
  // Setup A/B's own vsNeither approach instead (bestComboFor re-searches
  // all 9 cells for both the "with" and "without" candidate), at the cost
  // of a second real grid search rather than an O(1) formula. Engraving +
  // Ability Stone are zeroed together below, not as two separate
  // marginals - see kbwContributionGain's own comment for why the combined
  // removal is the correct joint counterfactual.
  function kbwRealizedGainPct(candidateInputs) {
    const kbwValue = KBW_TABLE[candidateInputs.kbw] || 0;
    const kbwStoneValue = KBW_STONE_TABLE[candidateInputs.kbwStone] || 0;
    if (!kbwValue && !kbwStoneValue) return 0;
    const withBest = bestComboFor(candidateInputs);
    if (!withBest || withBest.mult <= 0) return 0;
    const withoutInputs = Object.assign({}, candidateInputs, { kbw: "Not Used", kbwStone: "0 Lv." });
    const withoutBest = bestComboFor(withoutInputs);
    if (!withoutBest || withoutBest.mult <= 0) return 0;
    return (withBest.mult / withoutBest.mult - 1) * 100;
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
    const p = effectiveBackAttackShare(inputs) * 0.1;
    // Support's Flash Orb (Drops of Ether) - see FLASH_ORB_FULL_CRIT_RATE's
    // own comment for the Ether-effectiveness assumption baked into it.
    const q = (inputs.flashOrbUptime / 100) * FLASH_ORB_FULL_CRIT_RATE;
    const r = SUPPORT_CRIT_RATE_BRACELET_TABLE[inputs.supportCritRateBracelet] || 0;
    return c + d + e + f + g + h + i + k + n + o + p + q + r + (ARK_CRUSHING_CRATE_TABLE[inputs.crushingCore] || 0);
  }

  function evoDmgTotal(keenSenseLv, limitBreakLv, shared) {
    return (
      shared.yearningEvo +
      shared.evoKarmaEvo +
      shared.optimizedTrainingEvo +
      (KEEN_SENSE_EVO_DMG[keenSenseLv] || 0) +
      (LIMIT_BREAK_EVO_DMG[limitBreakLv] || 0) +
      STANDING_STRIKER_EVO_DMG
    );
  }

  // General correct replacement for "Math.min(critRateTotal(...), 1)".
  // critRateTotal bakes in THREE independent "sometimes on, sometimes
  // off" crit-rate contributors as plain averaged terms - Adrenaline
  // (`h` = bonus * uptime%: a buff that's up some fraction of the fight),
  // Back Attack Rate (`p` = 0.1 * effectiveBackAttackShare(inputs): a
  // per-hit chance a given hit both belongs to the Back-Attack-eligible
  // DPS pool AND actually lands from behind - see that function's own
  // comment for why it isn't just the raw rate% input), and Support's
  // Flash Orb (`q` = FLASH_ORB_FULL_
  // CRIT_RATE * uptime%: same "up some fraction of the fight" shape as
  // Adrenaline) - all three are expectations over a Bernoulli variable,
  // so all three hit the exact same concavity problem: min() is concave,
  // so capping an already-averaged sum ONCE systematically overstates the
  // true time/hit-weighted crit rate whenever a buffed/back-attack/orb
  // state would cross the cap while the baseline doesn't. Confirmed
  // against project chat log: at 75% baseline with Adrenaline (+20% @
  // 97% uptime) AND Back Attack (+10% @ 90% rate) together, the naive
  // averaged-sum formula reads a flat 100.00% where the true
  // joint-weighted value is 99.035% - a bigger gap than either source
  // produces alone, since independent swingy terms compound. Flash Orb
  // is folded into the same treatment below on the same reasoning
  // (assumed independent of Adrenaline uptime/Back Attack rate, the same
  // simplifying assumption already made between those two).
  //
  // blendCritTerms takes `base` (the fixed, non-swingy part of crit rate,
  // already including Master keystone's own flat +7% `extra` - that has
  // to be inside `base` before any branch, since it shares the same cap)
  // plus a list of independent {bonus, p} terms, and computes the TRUE
  // expected capped value by enumerating every on/off combination and
  // weighting by joint probability (assumes independence between terms -
  // e.g. Adrenaline uptime not correlating with which hits land as back
  // attacks - the same simplifying assumption already implicit everywhere
  // else in this calculator, not a new weakness this introduces).
  // Recursing one term at a time is mathematically identical to that full
  // enumeration (tower rule: E[f(X,Y)] = E_X[E_Y[f(X,Y)|X]]), and means
  // adding a future similar source (a new buff/proc with its own uptime
  // or proc-rate feeding crit rate) is just adding another {bonus, p}
  // entry below - no bespoke branch code needed per source.
  function blendCritTerms(base, terms) {
    if (!terms.length) return Math.min(base, 1);
    const [{ bonus, p }, ...rest] = terms;
    return p * blendCritTerms(base + bonus, rest) + (1 - p) * blendCritTerms(base, rest);
  }

  // The fixed, non-"sometimes on, sometimes off" portion of crit rate -
  // critRateTotal's full sum minus the three swingy terms (Adrenaline,
  // Back Attack, Flash Orb - see blendCritTerms' own comment for why
  // they're treated specially). Computed by SUBTRACTING those three back
  // out of critRateTotal's own sum, rather than re-listing every other
  // term here, so this can never drift out of sync with critRateTotal's
  // own term list. Shared by effectiveCritRate (time/joint-probability-
  // weighted expected value) and peakCritRate (full-value ceiling) below
  // so both stay consistent about which terms count as "swingy".
  function nonSwingyCritRate(inputs, keenSenseLv) {
    const adrenalineBonus = ADRENALINE_TABLE[inputs.adrenaline] || 0;
    const adrenalineUptime = inputs.adrenalineUptime / 100;
    const backAttackBonus = 0.1;
    const backAttackRate = effectiveBackAttackShare(inputs);
    const flashOrbBonus = FLASH_ORB_FULL_CRIT_RATE;
    const flashOrbUptime = inputs.flashOrbUptime / 100;
    return (
      critRateTotal(inputs, keenSenseLv) -
      adrenalineBonus * adrenalineUptime -
      backAttackBonus * backAttackRate -
      flashOrbBonus * flashOrbUptime
    );
  }

  // Downstream (combinedMultiplier's mult, marginalCritDmgGainPct) all
  // take effCrit as an already-fixed scalar
  // and are affine in it / in critDmgTotal with effCrit held constant, so
  // fixing the value at this one computation point is sufficient -
  // E[mult] = mult(E[effCrit]) exactly, no need to re-derive those
  // formulas or touch combinedMultiplier/bestComboFor themselves.
  function effectiveCritRate(inputs, keenSenseLv, extra) {
    const adrenalineBonus = ADRENALINE_TABLE[inputs.adrenaline] || 0;
    const adrenalineUptime = inputs.adrenalineUptime / 100;
    const backAttackBonus = 0.1;
    const backAttackRate = effectiveBackAttackShare(inputs);
    const flashOrbBonus = FLASH_ORB_FULL_CRIT_RATE;
    const flashOrbUptime = inputs.flashOrbUptime / 100;
    const restOfCrit = nonSwingyCritRate(inputs, keenSenseLv);
    return blendCritTerms(restOfCrit + extra, [
      { bonus: adrenalineBonus, p: adrenalineUptime },
      { bonus: backAttackBonus, p: backAttackRate },
      { bonus: flashOrbBonus, p: flashOrbUptime },
    ]);
  }

  // Peak Crit Rate: the crit-rate ceiling for the moment every temporal
  // swingy source lines up at its best, uncapped (so overshoot past the
  // 100% cap stays visible - this is what a reader's stat allocation is
  // actually tested against during their real burst windows, not a
  // mathematically-averaged value that never occurs during actual play).
  // Adrenaline and Back Attack are taken at FULL value here instead of
  // their own uptime/rate-weighted share - Adrenaline because it's
  // near-universal to the class (97% uptime default, so "peak" is close
  // to "most of the fight" anyway), Back Attack because its "uptime"
  // isn't a temporal window at all, it's a per-hit DPS-share split (see
  // effectiveBackAttackShare) - "peak" there just means "my crit rate on
  // the hits that land as back attacks", a real and common subset, not
  // an edge case. Flash Orb is deliberately left uptime-scaled, NOT
  // promoted to full value: its uptime input is really an on/off gate
  // for whether the reader even has a Drops of Ether support in their
  // party at all (defaults to 0%), and even when present it's genuinely
  // situational and usually low-uptime - showing its full value
  // regardless would put an unachievable number on the card for anyone
  // who hasn't set a nonzero Flash Orb uptime, and an overstated one for
  // most who have.
  function peakCritRate(inputs, keenSenseLv, extra) {
    const adrenalineBonus = ADRENALINE_TABLE[inputs.adrenaline] || 0;
    const backAttackBonus = 0.1;
    const flashOrbBonus = FLASH_ORB_FULL_CRIT_RATE;
    const flashOrbUptime = inputs.flashOrbUptime / 100;
    return (
      nonSwingyCritRate(inputs, keenSenseLv) +
      extra +
      adrenalineBonus +
      backAttackBonus +
      flashOrbBonus * flashOrbUptime
    );
  }

  function getKeystoneComponents(inputs, shared, keenSenseLv, limitBreakLv, keystone) {
    const S5 = effectiveCritRate(inputs, keenSenseLv, 0);
    const T5 = effectiveCritRate(inputs, keenSenseLv, 0.07);
    const S6 = peakCritRate(inputs, keenSenseLv, 0);
    const T6 = peakCritRate(inputs, keenSenseLv, 0.07);
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
    return { effCrit, onCrit, evo, add, peakCrit: keystone === "master" ? T6 : S6 };
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

    // No trailing party-synergy scalar here (the sheet has 0.85 * a
    // 12%/18% "Damage Synergy" term swung by Crit Syn 1/2): it's a
    // constant multiplied onto every one of the 9 cells equally, so it
    // can never change which cell is best or the %-of-best shown for any
    // of them. Confirmed by direct computation: toggling it left every
    // cell's pctOfBest and the best-cell identity bit-for-bit identical.
    // Crit Syn 1/2 below still do
    // something real - their +10% Crit Rate feeds into effCrit, which
    // genuinely interacts with the Master keystone's crit-rate cap.
    let mult = ((1 - effCrit) + effCrit * shared.critDmgTotal * (1 + onCrit)) * (1 + evo) * (1 + add);

    // Keen Blunt Weapon's -2% EV malus (10% chance / -20% damage downside,
    // see KBW_EV_MALUS's own comment above) lives here, applied ONCE, at
    // the root, to every caller of combinedMultiplier - the main grid,
    // Bracelet/Accessory/Chaos Core Comparison, and the Engraving
    // Comparison candidate search all call this function, so this is the
    // single place that guarantees the malus is never missing wherever
    // KBW's Crit Dmg bonus (folded into shared.critDmgTotal by
    // computeShared, as a plain malus-free add) is in play. Gated on
    // inputs.kbw being active rather than a flag, since this function
    // has no flags parameter and every caller already threads live KBW
    // state through inputs.kbw (same active-check shape used elsewhere,
    // e.g. kbwRealizedGainPct above). Do NOT also apply this in
    // engravingCandidateMultiplier - that would double it.
    const kbwActive = inputs.kbw && inputs.kbw !== "Not Used" && (KBW_TABLE[inputs.kbw] || 0) > 0;
    if (kbwActive) mult *= KBW_EV_MALUS;

    return mult;
  }

  // Full stat card (Crit Dmg/Rate/onCrit/Evo/Add + Breaking Moon) for ONE
  // specific cell - factored out of computeGridAndSummary so it can run
  // for any cell, not just the true best. Two callers need this: the true
  // best's own bestStats (below), and
  // Top Combinations' per-row preview (renderGrid reads cell.stats for
  // whichever of the 3 visible rows the reader clicked, even when that
  // row isn't the true best). Takes any cell, not only the best one.
  function computeCellStats(inputs, shared, cell) {
    const { keenSense, limitBreak } = cell.split;
    // critRate/critRatePeak below reuse cell.effCrit/cell.peakCrit
    // directly - the grid loop already worked these out for this exact
    // cell (same getKeystoneComponents call the comps lookups below
    // would just be repeating), so there's no need to recompute them per
    // branch. Same effective-vs-peak split as baseStats: critRate is
    // what the DPS math in mult actually uses, critRatePeak is the
    // uncapped full-value-burst-window ceiling shown as a secondary row.
    let comps, stats;
    if (cell.keystone === "crit+master") {
      comps = {
        critical: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "critical"),
        master: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "master"),
      };
      stats = {
        critDmg: shared.critDmgTotal,
        critRate: cell.effCrit * 100,
        critRatePeak: cell.peakCrit * 100,
        onCritDmg: comps.critical.onCrit * 100,
        evoDmg: comps.master.evo * 100,
        addDmg: comps.master.add * 100,
      };
    } else if (cell.keystone === "crit+pulv") {
      comps = {
        critical: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "critical"),
        pulverize: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "pulverize"),
      };
      stats = {
        critDmg: shared.critDmgTotal,
        critRate: cell.effCrit * 100,
        critRatePeak: cell.peakCrit * 100,
        onCritDmg: comps.critical.onCrit * 100,
        evoDmg: comps.pulverize.evo * 100,
        addDmg: comps.critical.add * 100,
      };
    } else if (cell.keystone === "master+pulv") {
      comps = {
        master: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "master"),
        pulverize: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "pulverize"),
      };
      stats = {
        critDmg: shared.critDmgTotal,
        critRate: cell.effCrit * 100,
        critRatePeak: cell.peakCrit * 100,
        onCritDmg: shared.onCritDmgBase * 100,
        evoDmg: comps.pulverize.evo * 100,
        addDmg: comps.master.add * 100,
      };
    }

    // Breaking Moon's flat average per-cast Crit Dmg add, straight from
    // shared - same value every cell shows (it doesn't depend on which
    // keystone pairing this cell is). (KBW's isolated Dmg contribution
    // lives in the Engraving Comparison section's reference table below,
    // not on this card - see kbwRealizedGainPct's own comment for why it
    // needs a real re-optimized with/without search rather than a closed
    // form.)
    stats.breakingMoonActive = shared.breakingMoonActive;
    stats.breakingMoonAdd = shared.breakingMoonAdd;
    return stats;
  }

  // What Optimized Training 1 costs in the model: the best setup with it
  // on vs. the best setup with it off, same everything else, as a % change
  // (negative = OT1 loses DPS). Uses each side's TRUE best cell, never a
  // pinned one - computeGridAndSummary itself ignores pins. Only called
  // from update() while .ap-ot1 is checked (it runs a second full grid, so
  // it isn't folded into computeGridAndSummary, which the comparison
  // panels call many times). Cooldown reduction isn't modeled, so this is
  // strictly the Evo Dmg/keystone-level trade.
  function computeOt1CostPct(inputs, result) {
    const without = computeGridAndSummary(Object.assign({}, inputs, { optimizedTraining: false }));
    if (!without.best || !result.best || without.best.mult <= 0) return null;
    return (result.best.mult / without.best.mult - 1) * 100;
  }

  function computeGridAndSummary(inputs) {
    const shared = computeShared(inputs);
    const cells = [];
    let best = null;

    splitsFor(inputs.optimizedTraining).forEach((split) => {
      COMBINED_KEYSTONES.forEach((pair) => {
        const mult = combinedMultiplier(inputs, shared, split.keenSense, split.limitBreak, pair);
        let effCrit, peakCrit;
        if (pair === "crit+master") {
          const comp = getKeystoneComponents(inputs, shared, split.keenSense, split.limitBreak, "master");
          effCrit = comp.effCrit;
          peakCrit = comp.peakCrit;
        } else if (pair === "crit+pulv") {
          const comp = getKeystoneComponents(inputs, shared, split.keenSense, split.limitBreak, "critical");
          effCrit = comp.effCrit;
          peakCrit = comp.peakCrit;
        } else if (pair === "master+pulv") {
          const comp = getKeystoneComponents(inputs, shared, split.keenSense, split.limitBreak, "master");
          effCrit = comp.effCrit;
          peakCrit = comp.peakCrit;
        }
        const cell = { split, keystone: pair, mult, effCrit, peakCrit };
        cells.push(cell);
        if (!best || mult > best.mult) best = cell;
      });
    });

    const maxMult = best ? best.mult : 1;
    cells.forEach(c => c.pctOfBest = (c.mult / maxMult) * 100);
    // Precompute every cell's own stat card up front (cheap - 9 cells,
    // same getKeystoneComponents calls the single-cell version already
    // did) so Top Combinations can preview rank 2/3's real numbers
    // on click without a second grid pass - see renderGrid.
    cells.forEach(c => { c.stats = computeCellStats(inputs, shared, c); });

    // Base stats for verification - effCrit/onCrit here match the "no
    // keystone selected" values baseStats already reports above (S5, the
    // capped effective Crit Rate; onCritDmgBase, the pre-Critical-keystone
    // on-crit multiplier), so the gain % is consistent with the rest of
    // the card.
    // (KBW's isolated Dmg contribution isn't a row on this card - the
    // Engraving Comparison section's reference table below covers it via
    // kbwContributionGain.)
    const baseEffCrit = effectiveCritRate(inputs, 0, 0);
    const baseStats = {
      // critRate is the capped, uptime-weighted value DPS math actually
      // uses (effectiveCritRate) - this is what the card's primary "Crit
      // Rate" row should show. critRatePeak is the full-value burst-window
      // ceiling (see peakCritRate's own comment): Adrenaline and Back
      // Attack taken at full value instead of uptime/rate-weighted,
      // uncapped, so it can read over 100% even when the real crit
      // chance is capped at 100%. Kept as a secondary row rather than
      // dropped, since it's still useful to see how much headroom is
      // being "wasted" above the cap during a reader's actual burst
      // windows.
      critRate: baseEffCrit * 100,
      critRatePeak: peakCritRate(inputs, 0, 0) * 100,
      critDmg: shared.critDmgTotal,
      onCritDmg: shared.onCritDmgBase * 100,
      evoDmg: (shared.yearningEvo + shared.evoKarmaEvo + shared.optimizedTrainingEvo + STANDING_STRIKER_EVO_DMG) * 100,
      addDmg: shared.addDmgBase * 100,
      // Breaking Moon's average per-cast Crit Dmg add itself (see
      // breakingMoonContribution) - a flat value from shared, so Base and
      // Best Setup show the same number (it doesn't depend on which
      // keystone pairing is selected).
      breakingMoonActive: shared.breakingMoonActive,
      breakingMoonAdd: shared.breakingMoonAdd,
    };

    const bestStats = best ? best.stats : null;

    return { cells, best, baseStats, bestStats, ot1: !!inputs.optimizedTraining };
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
  //     breakdown specific to your class's skill build; fixed at 95% of
  //     DPS coming from a Back Attack skil instead. Front Damage and
  //     Non-positional Dmg need that same per-skill breakdown with no
  //     comparable fixed-% stand-in, so they're left out entirely rather
  //     than guessed at.
  //   - Additional Damage vs Demon/Archdemon: the sheet's own Demon Dmg %
  //     value is hardcoded to 7% (see readInputs's demonDmgPct comment)
  //     instead of being derived or left as a direct input.
  //   - Spec +80/100/120: the sheet ties this to your own profile's live
  //     Spec stat; fixed at SPEC_BASE (1735) here instead, since this
  //     calculator doesn't otherwise track Spec as a build stat. RE vs
  //     Surge Deathblade use structurally different formulas (see
  //     SPEC_BASE and friends above) picked by the master Build toggle
  //     (see BRACE_SPEC_BUILDS) living in .ap-brace-compare-inputs.
  //     Crit Stat +80/100/120 below takes the same approach via
  //     CRIT_BASE (576) - no live "current bracelet's Crit Stat" input
  //     either, just the reader's own full .ap-crit-stat minus the fixed
  //     CRIT_BASE.
  // Baseline: your actual Best Setup, but with every bracelet-sourced
  // Crit Rate/Crit Dmg/Additional Dmg field reset to None first -
  // including critRateDual/critDmgDual, since those two checkboxes ARE
  // the bracelet Crit Rate/Crit Dmg lines' own +1.5% Crit Hit Dmg
  // synergy (see the "Crit Hit Damage -> Bracelet" checkboxes in the
  // HTML) - leaving them at the user's real state here would silently
  // keep crediting a bonus this baseline is supposed to be excluding.
  // Also strips the crit stat your CURRENT bracelet's own substat roll
  // contributes to the 658-style Crit Stat total, via CRIT_BASE (see its
  // own comment above) rather than a second "current bracelet's Crit
  // Stat" input - without this, the Crit Stat +80/100/120 candidate below
  // would silently double-count whatever your equipped bracelet already
  // grants, the same double-counting the dual checkboxes would cause.
  // Shared by computeBraceletComparison (one line at a time, against the
  // page's real Best Setup) and computeBraceletVsBracelet below (a whole
  // bracelet at a time, against each bracelet's OWN best keystone).
  function zeroedBraceletInputs(inputs) {
    const inputsNB = Object.assign({}, inputs, {
      braceletRate: "None",
      braceletDmg: "None",
      braceletRate2: "None",
      braceletDmg2: "None",
      braceletAddA: "None",
      braceletAddB: "None",
      critRateDual: false,
      critDmgDual: false,
      // The no-bracelet baseline IS CRIT_BASE - a fixed constant, same
      // as SPEC_BASE just above, not derived from the reader's live
      // .ap-crit-stat. (Earlier draft of this line computed
      // inputs.critStat - CRIT_BASE, which backwards-computes the
      // bracelet's OWN contribution, not what's left without it - wrong
      // direction entirely, caught via before/after screenshot diffing
      // per the verify workflow.)
      critStat: CRIT_BASE,
    });
    return { inputsNB, sharedNB: computeShared(inputsNB) };
  }

  // Searches all 9 split+keystone grid cells for candidateInputs and
  // returns the winning cell's full descriptor (multiplier + which pair/
  // split won it) - the same search computeGridAndSummary's own best-
  // setup logic does, factored out so computeBraceletVsBracelet can run it
  // per-candidate-bracelet instead of assuming every bracelet shares the
  // reader's real Best Setup keystone (two bracelets with different Crit
  // Rate/Dmg/Stat lines can genuinely prefer different keystones).
  // sharedOverride lets a caller hand in a `shared` object it already
  // built by hand instead of a plain computeShared(candidateInputs) - the
  // only current use is ringDmgGain/ringDmgLikeGain-style candidates below,
  // whose magnitude is tracked as a manual critDmgTotal delta rather than
  // a real inputs field (see ACC_RING_DMG_TABLE's own comment on why that
  // table stays uncoupled from candidateInputs). Omitted (undefined) by
  // every other caller, which then gets a plain computeShared(candidateInputs).
  function bestComboFor(candidateInputs, sharedOverride) {
    const shared = sharedOverride || computeShared(candidateInputs);
    // Top Combinations pin (see activePinnedCombo's own comment): when a
    // reader has pinned a 2nd-5th-best combo, every caller of
    // bestComboFor - which is every "what's actually best for this
    // candidate" search on the page - resolves to that fixed combo
    // instead of re-searching all 9 cells. Deliberately still runs the
    // candidate through the real combinedMultiplier for the pinned
    // split/pair (not just echoing a stored number), so a pinned combo's
    // reported gains stay numerically honest for whatever candidate is
    // actually being evaluated. computeGridAndSummary's own 9-cell grid/
    // ranking is NOT affected - it never calls bestComboFor (see its own
    // comment) - so the Top Combinations list's underlying RANKING always
    // reflects the true ranking, pin or no pin. (renderGrid can still
    // force the pinned combo into the visible 5th row - with its own
    // true rank number shown instead of a fake "5th Best" - if it's
    // drifted below true 5th place; see renderGrid's own comment. That's
    // a display-only substitution and doesn't change what's computed
    // here.)
    if (activePinnedCombo) {
      const { split, pair } = activePinnedCombo;
      const mult = combinedMultiplier(candidateInputs, shared, split.keenSense, split.limitBreak, pair);
      return { mult, pair, split };
    }
    let best = null;
    splitsFor(candidateInputs.optimizedTraining).forEach((split) => {
      COMBINED_KEYSTONES.forEach((pair) => {
        const mult = combinedMultiplier(candidateInputs, shared, split.keenSense, split.limitBreak, pair);
        if (!best || mult > best.mult) best = { mult, pair, split };
      });
    });
    return best;
  }

  // Finds the pinned combo's OWN cell (with its real effCrit/.stats, not
  // just mult/pair/split like bestComboFor returns) inside an already-
  // computed grid, for the few spots that need a cell's full stat
  // breakdown rather than just its multiplier - currently only KBW's
  // stone-level preview sweep below. computeGridAndSummary itself
  // deliberately never calls bestComboFor (see that function's own
  // comment - the Top Combinations RANKING has to stay pin-independent),
  // so any caller that grabs a grid's `.best`/`.bestStats` directly - the
  // way this function's own isolatedBest/isolatedBestStats would -
  // silently reads the TRUE best cell even while a different combo is
  // pinned. Falls back to fallbackCell (normally the grid's own `.best`)
  // when nothing's pinned, the pin doesn't resolve, or - defensively -
  // the pinned combo somehow isn't one of this specific grid's 9 cells.
  function pinnedCellFrom(grid, fallbackCell) {
    if (!activePinnedCombo || !grid || !grid.cells) return fallbackCell;
    const { split, pair } = activePinnedCombo;
    const match = grid.cells.find((c) => c.split.key === split.key && c.keystone === pair);
    return match || fallbackCell;
  }

  function computeBraceletComparison(inputs) {
    const gridResult = computeGridAndSummary(inputs);
    const best = gridResult.best;
    if (!best) return [];
    // best.split/best.keystone (the reader's live Best Setup keenSense/
    // limitBreak/pair) are deliberately NOT destructured here -
    // every row below re-derives its own winning cell per candidate
    // via bestComboFor instead of assuming the reader's fixed pair still
    // wins (see baselineBest's own comment just below), so nothing in
    // this function needs them. `best` itself is kept only for the
    // `if (!best) return []` guard above.

    const { inputsNB, sharedNB } = zeroedBraceletInputs(inputs);
    // Re-optimized baseline, not a fixed-pair eval: Crit Rate/Dmg/Stat and
    // Additional Damage all feed effCrit/critDmgTotal/add (the grid formula
    // itself), so which of the 9 cells is best can genuinely differ once a
    // candidate line is added on top of the reader's real setup - confirmed
    // by direct computation (candidates like a High Crit Rate or High
    // Additional Damage line can flip the winning pair in a non-trivial
    // slice of realistic gear profiles, the same failure mode
    // kbwRealizedGainPct/adrenalineGridRatio were already fixed for above).
    // Every candidate below re-derives its OWN best cell via bestComboFor
    // instead of assuming the reader's fixed Best Setup pair still wins -
    // matching Bracelet vs. Bracelet's own per-candidate search exactly.
    const baselineBest = bestComboFor(inputsNB, sharedNB);
    const baselineMult = baselineBest.mult;

    // Crit Rate/Crit Dmg candidates reuse the exact same computeShared +
    // critRateTotal + combinedMultiplier machinery as the grid above -
    // just with one bracelet field swapped from "None" to the candidate
    // tier, and (for the two lines that carry it) the matching dual
    // checkbox flipped on - the same computeShared formula the checkboxes
    // themselves drive, rather than a second hand-rolled copy of it. Goes
    // through bestComboFor (full 9-cell re-search) rather than the fixed
    // baselineBest.pair/split - see baselineBest's own comment above.
    function critLikeGain(field, tier, dualFlag) {
      const cloned = Object.assign({}, inputsNB);
      cloned[field] = tier;
      if (dualFlag) cloned[dualFlag] = true;
      const withBest = bestComboFor(cloned);
      return withBest.mult / baselineMult - 1;
    }

    function tiers(fn) {
      return { low: fn("Low"), mid: fn("Mid"), high: fn("High") };
    }

    // Raw Crit Stat delta candidate (the sheet's "Crit +80/100/120" row) -
    // mechanically identical to the Crit Rate % Line above once converted,
    // just fed in as a stat delta rather than a direct rate %, and using
    // the exact tier values (no Low/Mid/High table lookup needed). Also
    // goes through bestComboFor now, for the same reason critLikeGain does.
    function critStatGain(statDelta) {
      const cloned = Object.assign({}, inputsNB);
      cloned.critStat = inputsNB.critStat + statDelta;
      const withBest = bestComboFor(cloned);
      return withBest.mult / baselineMult - 1;
    }

    // Additional Damage candidates (braceletAddA/braceletAddB) feed `add`
    // (addDmgBase/addDmgMaster) exactly like Crit Rate/Dmg feed
    // effCrit/critDmgTotal, so they get the same bestComboFor treatment -
    // confirmed by direct computation that a High Additional Damage line
    // can also flip the winning pair, not just Crit Rate/Dmg. Replaces the
    // old `value / (1 + addDmgBaseline)` closed form, which silently
    // assumed the baseline's fixed pair stayed optimal with the candidate
    // line added too.
    function addDmgGain(field, tier) {
      const cloned = Object.assign({}, inputsNB);
      cloned[field] = tier;
      const withBest = bestComboFor(cloned);
      return withBest.mult / baselineMult - 1;
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
      },
      {
        label: ["Crit Damage +", ...trip("6.8", "8.4", "10"), "% & Crit Hit Damage +", { tier: "fixed", text: "1.5" }, "%"],
        ...tiers((t) => critLikeGain("braceletDmg", t, "critDmgDual")),
      },
      {
        label: ["Crit Rate +", ...trip("3.4", "4.2", "5"), "%"],
        ...tiers((t) => critLikeGain("braceletRate", t, null)),
      },
      {
        label: ["Crit Damage +", ...trip("6.8", "8.4", "10"), "%"],
        ...tiers((t) => critLikeGain("braceletDmg", t, null)),
      },
      {
        label: ["Crit Stat +", ...trip("80", "100", "120")],
        note: "Set your current bracelet's Crit Stat so this isn't double-counted.",
        low: critStatGain(CRIT_STAT_TABLE.Low),
        mid: critStatGain(CRIT_STAT_TABLE.Mid),
        high: critStatGain(CRIT_STAT_TABLE.High),
      },
      {
        label: ["Outgoing Damage +", ...trip("4.5", "5", "5.5"), "% & Skill Cooldown +", { downside: true, text: "2" }, "%"],
        note: "Estimated damage accounts for +CDR% penalty.",
        // Surge uses the temporary flat -1 override (see
        // DAMAGE_CD_SURGE_TABLE above) instead of the divided-by-penalty
        // figures RE still uses. isSurge comes from the selected build's
        // CLASS (any Surge 111/222/333 pick), not the specific build.
        low: braceSpecConfig(inputs).isSurge ? DAMAGE_CD_SURGE_TABLE.Low : DAMAGE_CD_TABLE.Low,
        mid: braceSpecConfig(inputs).isSurge ? DAMAGE_CD_SURGE_TABLE.Mid : DAMAGE_CD_TABLE.Mid,
        high: braceSpecConfig(inputs).isSurge ? DAMAGE_CD_SURGE_TABLE.High : DAMAGE_CD_TABLE.High,
      },
      {
        label: ["Outgoing Damage +", ...trip("2", "2.5", "3"), "% & Damage to Staggered +", ...trip("4", "4.5", "5"), "%"],
        note: "Assumes " + (STAGGER_DPS_SHARE * 100).toFixed(0) + "% of all DPS happens during stagger windows.",
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
        note:
          "Displayed value assumes a Demon/Archdemon target. Additional Damage portion alone: " +
          formatPctBare(addDmgGain("braceletAddB", "Low")) + "/" +
          formatPctBare(addDmgGain("braceletAddB", "Mid")) + "/" +
          formatPctBare(addDmgGain("braceletAddB", "High")) + ".",
        low: (addDmgGain("braceletAddB", "Low") + 1) * (DEMON_DMG_ADD / (1 + demonDmgPct) + 1) - 1,
        mid: (addDmgGain("braceletAddB", "Mid") + 1) * (DEMON_DMG_ADD / (1 + demonDmgPct) + 1) - 1,
        high: (addDmgGain("braceletAddB", "High") + 1) * (DEMON_DMG_ADD / (1 + demonDmgPct) + 1) - 1,
        // Sorts by its Additional-Damage-only portion (ignoring the
        // situational vs Demon/Archdemon bonus above), not by the full
        // displayed High value the rest of this sort otherwise uses - see
        // the sort call below. Keeps it from reading as a strictly better
        // pick than the plain Additional Damage line by default, without
        // the old hard-coded "always sort directly below addA" special case.
        sortKey: addDmgGain("braceletAddB", "High"),
      },
      {
        id: "addA",
        label: ["Additional Damage +", ...trip("3", "3.5", "4"), "%"],
        low: addDmgGain("braceletAddA", "Low"),
        mid: addDmgGain("braceletAddA", "Mid"),
        high: addDmgGain("braceletAddA", "High"),
      },
      {
        label: ["Back Attack Damage +", ...trip("2.5", "3", "3.5"), "%"],
        note: "Assumes " + (BACK_ATTACK_DPS_SHARE * 100).toFixed(0) + "% of all DPS comes from skills that are labeled as a back attack.",
        low: BACK_DMG_TABLE.Low * BACK_ATTACK_DPS_SHARE,
        mid: BACK_DMG_TABLE.Mid * BACK_ATTACK_DPS_SHARE,
        high: BACK_DMG_TABLE.High * BACK_ATTACK_DPS_SHARE,
      },
    ];

    // Spec +80/100/120: RE and Surge Deathblade share the same formula
    // (see the constants/helper above), differing by damage share and
    // Awakening share - both picked directly by the master Build toggle
    // (one of the 6 named builds in BRACE_SPEC_BUILDS) rather than mixed
    // into the rest of the crit-focused inputs.
    {
      const cfg = braceSpecConfig(inputs);
      const k = specGainPerPoint(deathbladeSpecMultiplier, cfg.share, cfg.awakeningShare);
      rows.push({
        id: "spec",
        label: ["Spec Stat +", ...trip("80", "100", "120")],
        low: k * 80,
        mid: k * 100,
        high: k * 120,
        // Both RE and Surge are now pure damage-share models (the CDR
        // term is gone entirely, not just for RE) - so this line only
        // reflects the selected build's direct damage share and misses
        // whatever Spec does outside raw DPS (e.g. cooldown/meter
        // effects) for either class. Shown as a small always-visible tag
        // with the explanation in its hover tooltip rather than a
        // permanent note block under the table.
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

    // Sorts by each row's own sortKey when it has one (currently only
    // addB - see that row's comment), falling back to the displayed High
    // value otherwise. Lets addB rank by its guaranteed Additional Damage
    // portion instead of the situational Demon/Archdemon-inflated number
    // actually shown, without a hard-coded "always sort directly below
    // addA" special case.
    rows.sort((a, b) => (b.sortKey !== undefined ? b.sortKey : b.high) - (a.sortKey !== undefined ? a.sortKey : a.high));

    return rows;
  }

  // ----- Bracelet vs. Bracelet -----
  //
  // A different question again from computeBraceletComparison above: not
  // "which single candidate line is worth the most", but "if I actually
  // equipped this WHOLE bracelet (5 real lines), what's my total DPS, and
  // which keystone should I even be running with it". A real Deathblade
  // bracelet's first two lines are always the flat Specialization and
  // Critical substats (60-120 each); the other three are free picks from
  // the same affix pool computeBraceletComparison already values one at a
  // time - BRACELET_LINE_TYPES below reuses that exact catalog, minus
  // Spec/Crit Stat themselves since those are the two guaranteed lines
  // here instead of free picks.
  //
  // Combining multiple lines at once isn't just "multiply together the
  // isolated % gains computeBraceletComparison reports for each line" -
  // that would double-count wherever two lines interact. Instead, each of
  // the 4 layers below is combined the way it actually behaves:
  //   - Crit Rate % / Crit Dmg % (with or without their Crit Hit Dmg dual
  //     variant) and the raw Crit Stat line are all applied together onto
  //     one cloned inputs object, then run through the exact 9-cell search
  //     computeGridAndSummary itself uses (bestComboFor) - so the reported
  //     "Best Keystone" for a bracelet is genuinely re-derived for that
  //     bracelet's own stats, not assumed to match the reader's real gear
  //     or the OTHER bracelet being compared against it.
  //   - Spec is its own damage-share layer (see computeBraceletComparison's
  //     Spec row above) that never touches the grid at all, so it's simply
  //     multiplied in afterward using the same specGainPerPoint machinery.
  //   - Outgoing/Stagger/Damage+CD/Back Attack/Additional Damage lines are
  //     already flat, grid-independent fractions in computeBraceletComparison
  //     (see that function's own comment) - multiplied together here the
  //     same way, just with as many as were actually picked instead of one
  //     at a time. Additional Damage's denominator (addDmgBaseline) is
  //     recomputed against THIS bracelet's own winning keystone, not the
  //     reader's real Best Setup, since Master keystones change it.
  //   - The 5 Weapon Power/Attack Power lines scale the same separate
  //     gearApTotal() layer computeBraceletComparison's own WP rows use,
  //     entirely independent of the keystone grid - their deltas are just
  //     summed before computing one ratio.
  // All four layers are then multiplied together for that bracelet's total
  // DPS gain vs running no bracelet at all - and each bracelet gets its own
  // independently-searched "no bracelet" reference point - they're
  // both compared against the SAME no-bracelet baseline (also its own
  // bestComboFor search, since even that may not match the reader's real
  // Best Setup once the current bracelet's own lines are stripped out).
  const BRACELET_LINE_TYPES = {
    crit_rate_dual: { kind: "grid", field: "braceletRate", dual: "critRateDual" },
    crit_rate: { kind: "grid", field: "braceletRate", dual: null },
    crit_dmg_dual: { kind: "grid", field: "braceletDmg", dual: "critDmgDual" },
    crit_dmg: { kind: "grid", field: "braceletDmg", dual: null },
    damage_cd: { kind: "flat" },
    outgoing_stagger: { kind: "flat" },
    outgoing: { kind: "flat" },
    add_a: { kind: "flat" },
    add_b: { kind: "flat" },
    back_attack: { kind: "flat" },
    stat_main: { kind: "wp" },
    wp_flat: { kind: "wp" },
    wp_onhit: { kind: "wp" },
    wp_periodic: { kind: "wp" },
    wp_hpgated: { kind: "wp" },
  };

  // Values one flat, grid-independent line at the given tier - mirrors the
  // matching row's formula in computeBraceletComparison above exactly (see
  // that function for the full derivation of each), except for two spots
  // where Bracelet vs. Bracelet's own per-side checkboxes (ctx.cdEstimate,
  // ctx.demons) let the reader opt out of an assumption computeBraceletComparison
  // always applies:
  //   - damage_cd: ctx.cdEstimate defaults to true (checked) and picks the
  //     usual CDR-penalty-adjusted table; unchecked skips the penalty
  //     entirely and uses the tag's raw stated 4.5/5/5.5% instead
  //     (DAMAGE_CD_RAW_TABLE - class-independent, since it's just the
  //     line's literal value with no estimate layered on).
  //   - add_b: ctx.demons defaults to false (unchecked) and values ONLY
  //     the Additional Damage half, same treatment computeBraceletComparison's
  //     own addB row always uses (see that row's comment); checked adds
  //     the vs Demon/Archdemon half back in via the same compounding.
  function braceletFlatLineGain(typeId, tier, ctx) {
    switch (typeId) {
      case "damage_cd":
        if (ctx.cdEstimate === false) return DAMAGE_CD_RAW_TABLE[tier] || 0;
        return (ctx.surge ? DAMAGE_CD_SURGE_TABLE : DAMAGE_CD_TABLE)[tier] || 0;
      case "outgoing_stagger":
        return (OUTGOING_DMG_TABLE[tier] || 0) + (STAGGER_DMG_TABLE[tier] || 0) * STAGGER_DPS_SHARE;
      case "outgoing":
        return OUTGOING_DMG_TABLE[tier] || 0;
      case "add_a":
        return (BRACELET_ADD_A_TABLE[tier] || 0) / (1 + ctx.addDmgBaseline);
      case "add_b":
        if (ctx.demons) {
          return ((BRACELET_ADD_B_TABLE[tier] || 0) / (1 + ctx.addDmgBaseline) + 1) * (DEMON_DMG_ADD / (1 + ctx.demonDmgPct) + 1) - 1;
        }
        return (BRACELET_ADD_B_TABLE[tier] || 0) / (1 + ctx.addDmgBaseline);
      case "back_attack":
        return (BACK_DMG_TABLE[tier] || 0) * BACK_ATTACK_DPS_SHARE;
      default:
        return 0;
    }
  }

  // Returns { wp, mainStat } deltas for one of the 5 WP/AP lines at the
  // given tier - same source tables/assumptions as computeBraceletComparison's
  // own WP block above. STR/DEX/INT ("stat_main") is handled separately in
  // computeSingleBracelet instead of here, since unlike the other four it's
  // a direct free-typed amount (10000-16000) rather than a Low/Mid/High
  // tier - real bracelet rolls land on values Low/Mid/High can't represent
  // exactly, so that line gets its own number input (see enforceBvbLineControls).
  function braceletWpLineDelta(typeId, tier) {
    if (typeId === "wp_flat") return { wp: { Low: 7200, Mid: 8100, High: 9000 }[tier] || 0, mainStat: 0 };
    if (typeId === "wp_onhit") {
      return { wp: ({ Low: 1160, Mid: 1320, High: 1480 }[tier] || 0) * ONHIT_WP_STACK_ASSUMPTION, mainStat: 0 };
    }
    if (typeId === "wp_periodic") {
      const base = { Low: 6900, Mid: 7800, High: 8700 }[tier] || 0;
      const perStack = { Low: 130, Mid: 140, High: 150 }[tier] || 0;
      return { wp: base + periodicWpAvgBonus(PERIODIC_WP_FIGHT_MINUTES, perStack), mainStat: 0 };
    }
    if (typeId === "wp_hpgated") {
      const base = { Low: 7200, Mid: 8100, High: 9000 }[tier] || 0;
      const onHit = { Low: 2000, Mid: 2200, High: 2400 }[tier] || 0;
      return { wp: base + onHit * HP_GATED_WP_UPTIME, mainStat: 0 };
    }
    return { wp: 0, mainStat: 0 };
  }

  // Computes one full bracelet's total DPS multiplier vs running no
  // bracelet at all - see the methodology comment above BRACELET_LINE_TYPES.
  // `side` is { spec, critStat, lines: [{type, tier}, ...] } as read from
  // the Bracelet vs. Bracelet inputs (readBvbSide below).
  function computeSingleBracelet(inputsNB, sharedNB, noBraceletMult, inputs, side) {
    const cloned = Object.assign({}, inputsNB);
    // Basic Effect 2 isn't guaranteed to be Crit Stat - see readBvbSide's
    // own comment - so Crit Stat here only counts while that's actually
    // what this side's Basic Effect 2 is set to.
    const effect2Type = side.effect2Type || "crit";
    cloned.critStat = inputsNB.critStat + (effect2Type === "crit" ? Math.max(0, side.critStat || 0) : 0);

    let rateSlot = 0;
    let dmgSlot = 0;
    let critRateDualFlag = false;
    let critDmgDualFlag = false;
    const flatLines = [];
    let wpDeltaTotal = 0;
    let mainStatDeltaTotal = 0;
    let hasWpLine = false;

    (side.lines || []).forEach((line) => {
      const def = line && BRACELET_LINE_TYPES[line.type];
      if (!def) return;
      const tier = line.tier === "Low" || line.tier === "High" ? line.tier : "Mid";
      if (def.kind === "grid") {
        if (def.field === "braceletRate") {
          if (rateSlot === 0) { cloned.braceletRate = tier; rateSlot = 1; } else { cloned.braceletRate2 = tier; }
          if (def.dual) critRateDualFlag = true;
        } else {
          if (dmgSlot === 0) { cloned.braceletDmg = tier; dmgSlot = 1; } else { cloned.braceletDmg2 = tier; }
          if (def.dual) critDmgDualFlag = true;
        }
      } else if (def.kind === "flat") {
        flatLines.push({ type: line.type, tier });
      } else if (def.kind === "wp") {
        hasWpLine = true;
        if (line.type === "stat_main") {
          // Direct free-typed amount, not a tier lookup - see
          // braceletWpLineDelta's comment for why.
          mainStatDeltaTotal += Math.max(10000, Math.min(16000, line.mainStat || 14000));
        } else {
          const delta = braceletWpLineDelta(line.type, tier);
          wpDeltaTotal += delta.wp;
          mainStatDeltaTotal += delta.mainStat;
        }
      }
    });
    // Basic Effect 2 = Main Stat folds into this exact same
    // mainStatDeltaTotal/hasWpLine path, just from a 4th, fixed-position
    // source instead of one of the 3 free lines above - see this side's
    // own effect2Type comment. The UI-level exclusivity (disabling
    // "STR/DEX/INT" in the 3 free dropdowns, resetting a stale one back
    // to None) lives in enforceBvbLineExclusivity, so by the time this
    // runs the two sources can't both be real at once.
    if (effect2Type === "main") {
      hasWpLine = true;
      mainStatDeltaTotal += Math.max(10000, Math.min(16000, side.effect2MainStat || 14000));
    }
    cloned.critRateDual = critRateDualFlag;
    cloned.critDmgDual = critDmgDualFlag;

    const combo = bestComboFor(cloned);
    const gridRatio = combo.mult / noBraceletMult;

    const specCfg = braceSpecConfig(inputs);
    const isSurge = specCfg.isSurge;
    const specK = specGainPerPoint(deathbladeSpecMultiplier, specCfg.share, specCfg.awakeningShare);
    const specGain = specK * Math.max(0, side.spec || 0);

    const addDmgBaseline = combo.pair.indexOf("master") !== -1 ? sharedNB.addDmgMaster : sharedNB.addDmgBase;
    const demonDmgPct = inputs.demonDmgPct / 100;
    let flatMult = 1;
    flatLines.forEach((sel) => {
      flatMult *= 1 + braceletFlatLineGain(sel.type, sel.tier, {
        surge: isSurge,
        addDmgBaseline,
        demonDmgPct,
        demons: side.demons,
        cdEstimate: side.cdEstimate,
      });
    });

    // Same "separate multiplicative layer off the Gearing inputs" approach
    // as computeBraceletComparison's own WP rows - see that block's comment
    // for gearApTotal()'s methodology. Left at 1 (no-op) whenever no WP/AP
    // line was picked, or the Character Data inputs aren't filled in yet.
    let wpRatio = 1;
    if (hasWpLine) {
      const wp = inputs.gearWp;
      const mainStat = inputs.gearMainStat;
      const baseApMult = 1 + gearBaseApPercentTotal(inputs) / 100;
      const flatAp = inputs.gearFlatAp + gearChaosStarFlat(inputs.gearApChaosStar);
      const percentApMult = 1 + gearAttackPowerPercentTotal(inputs) / 100;
      const wpPercentMult = 1 + gearWpPercentTotal(inputs) / 100;
      const mainStatPercentMult = 1 + inputs.gearMainStatPercent / 100;
      const supApBuff = supportApBuff(inputs, wp, mainStat, baseApMult);
      const baselineAp = gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult, supApBuff);
      if (wp > 0 && mainStat > 0 && baselineAp > 0) {
        const newAp = gearApTotal(
          wp + wpDeltaTotal * wpPercentMult,
          mainStat + mainStatDeltaTotal * mainStatPercentMult,
          baseApMult, flatAp, percentApMult, supApBuff
        );
        wpRatio = newAp / baselineAp;
      }
    }

    return {
      totalMult: gridRatio * (1 + specGain) * flatMult * wpRatio,
      gridRatio,
      specGain,
      flatMult,
      wpRatio,
      keystoneLabel: KEYSTONE_LABELS[combo.pair],
      splitLabel: combo.split.label,
      comboKey: combo.pair + "|" + combo.split.key,
    };
  }

  function computeBraceletVsBracelet(inputs) {
    const { inputsNB, sharedNB } = zeroedBraceletInputs(inputs);
    const noBraceletBest = bestComboFor(inputsNB);
    const a = computeSingleBracelet(inputsNB, sharedNB, noBraceletBest.mult, inputs, inputs.bvbA || {});
    const b = computeSingleBracelet(inputsNB, sharedNB, noBraceletBest.mult, inputs, inputs.bvbB || {});
    return {
      noBracelet: { keystoneLabel: KEYSTONE_LABELS[noBraceletBest.pair], splitLabel: noBraceletBest.split.label },
      a,
      b,
      aVsB: a.totalMult / b.totalMult - 1,
      keystonesDiffer: a.comboKey !== b.comboKey,
    };
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
    // best.split/best.keystone not destructured here - every row that
    // needs the grid (Ring Crit Rate/Dmg, Necklace Additional Damage)
    // re-derives its own winning cell per candidate via bestComboFor
    // instead (see baselineRingsBest/baselineNecklaceBest below); `best`
    // itself is kept only for the `if (!best)` guard above.

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
    // Re-optimized baseline, not a fixed-pair eval - Additional Damage
    // feeds addDmgBase/addDmgMaster (the grid formula itself), so the
    // winning pair can genuinely differ once a candidate line is added,
    // same failure mode already fixed for Bracelet's addA/addB above -
    // confirmed to actually flip on this exact line (Necklace Additional
    // Damage: 1,067 flips out of ~180k synthetic gear profiles tested).
    const baselineNecklaceBest = bestComboFor(necklaceNB, sharedNecklaceNB);
    const baselineMultNecklaceNB = baselineNecklaceBest.mult;
    // ACC_NECKLACE_ADD_TABLE is deliberately NOT the same table as the
    // live .ap-necklace field's NECKLACE_ADD_TABLE (see that table's own
    // comment above - close but not identical, tuned separately), so this
    // can't just clone necklaceNB with a swapped `necklace` tier the way
    // ringRateGain below swaps ring1Rate - that would silently pull the
    // WRONG table's values back in through computeShared. Instead this
    // hands bestComboFor a manually-built `shared` override (the same
    // sharedOverride parameter ringDmgGain below uses, for the same
    // reason) with the candidate's own addDmgBase/addDmgMaster bumped
    // directly, keeping ACC_NECKLACE_ADD_TABLE's own tuned figures intact
    // while still letting the pair search see the change.
    function necklaceAddGain(tier) {
      const value = ACC_NECKLACE_ADD_TABLE[tier] || 0;
      if (!value) return 0;
      const shared = Object.assign({}, sharedNecklaceNB, {
        addDmgBase: sharedNecklaceNB.addDmgBase + value,
        addDmgMaster: sharedNecklaceNB.addDmgMaster + value,
      });
      const withBest = bestComboFor(necklaceNB, shared);
      return withBest.mult / baselineMultNecklaceNB - 1;
    }
    const necklaceAdd = {
      low: necklaceAddGain("Low"),
      mid: necklaceAddGain("Mid"),
      high: necklaceAddGain("High"),
    };
    // Outgoing Damage isn't tracked as a current-gear field anywhere in
    // this file (no ".ap-necklace-out" input exists to zero) - a pure
    // standalone multiplier with nothing to double-count, same treatment
    // as the Bracelet panel's own standalone Outgoing Damage line.
    const necklaceOut = { low: ACC_NECKLACE_OUT_TABLE.Low, mid: ACC_NECKLACE_OUT_TABLE.Mid, high: ACC_NECKLACE_OUT_TABLE.High };
    // Outgoing Damage is the generally-preferred line, so it's the top
    // row here (and gets comboSix's "first" argument - the full 6-column
    // LL/ML/MM/HL/HM/HH set) while Additional Damage sits second (the
    // partial ML/HL/HM set) - see comboSix's own comment for what
    // "first" vs "second" actually means column-wise.
    const necklaceCombos = comboSix(necklaceOut, necklaceAdd);
    const necklace = [
      {
        label: ["Outgoing Damage +", ...trip("0.55", "1.2", "2"), "%"],
        ...necklaceOut,
        combos: necklaceCombos.first,
      },
      {
        label: ["Additional Damage +", ...trip("0.7", "1.6", "2.6"), "%"],
        ...necklaceAdd,
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
    // Re-optimized baseline, not a fixed-pair eval - same reasoning as
    // Bracelet/Necklace above: Ring Crit Rate/Dmg feed effCrit/
    // critDmgTotal directly, so the winning pair can genuinely differ
    // once a candidate ring line is added - confirmed to actually flip
    // (Ring Crit Rate: 1,003 flips, Ring Crit Dmg: 202 flips out of
    // ~180k synthetic gear profiles tested).
    const baselineRingsBest = bestComboFor(ringsNB, sharedRingsNB);
    const baselineMultRingsNB = baselineRingsBest.mult;
    // Crit Rate: RING_RATE_TABLE is an exact match to the sheet's own
    // candidate figures (see that table's comment above), so this can
    // swap ring1Rate straight to a tier name - identical shape to the
    // Bracelet panel's critLikeGain. Goes through bestComboFor (full
    // 9-cell re-search) rather than the fixed pair/split, per the
    // baseline comment just above.
    function ringRateGain(tier) {
      const cloned = Object.assign({}, ringsNB, { ring1Rate: tier });
      const withBest = bestComboFor(cloned);
      return withBest.mult / baselineMultRingsNB - 1;
    }
    // Crit Damage: ACC_RING_DMG_TABLE and RING_DMG_TABLE are now confirmed
    // identical at every tier (see ACC_RING_DMG_TABLE's own comment), but
    // this still adds the candidate's own magnitude as a manual
    // critDmgTotal delta rather than swapping ring1Dmg to a tier name -
    // no functional difference today, just avoids re-coupling two tables
    // that were tracked separately on purpose. Uses bestComboFor's
    // sharedOverride parameter to hand in that manually-built `shared`
    // directly (see bestComboFor's own comment on the parameter) rather
    // than a fixed combinedMultiplier call.
    function ringDmgGain(dmgPct) {
      if (!dmgPct) return 0;
      const shared = Object.assign({}, sharedRingsNB, { critDmgTotal: sharedRingsNB.critDmgTotal + dmgPct });
      const withBest = bestComboFor(ringsNB, shared);
      return withBest.mult / baselineMultRingsNB - 1;
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
    // Crit Damage is the generally-preferred line, so it's the top row
    // here (comboSix's "first" argument, full 6-column set) while Crit
    // Rate sits second (the partial ML/HL/HM set) - same swap as
    // Necklace above.
    const ringCombos = comboSix(ringDmg, ringRate);
    const rings = [
      {
        label: ["Crit Damage +", ...trip("1.1", "2.4", "4"), "%"],
        ...ringDmg,
        combos: ringCombos.first,
      },
      {
        label: ["Crit Rate +", ...trip("0.4", "0.95", "1.55"), "%"],
        ...ringRate,
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
      // gearAttackPowerPercentTotal itself - see that function's own
      // comment for why (adding both manually on top of the total here
      // would double-count them).
      const percentApMult = 1 + gearAttackPowerPercentTotal(earringsNB) / 100;
      const wpPercentMult = 1 + gearWpPercentTotal(earringsNB) / 100;
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
              label: ["Weapon Power +", ...trip("195", "480", "960")],
              low: universalWpDeltaGain(ACC_FLAT_WP_TABLE.Low),
              mid: universalWpDeltaGain(ACC_FLAT_WP_TABLE.Mid),
              high: universalWpDeltaGain(ACC_FLAT_WP_TABLE.High),
            },
            {
              label: ["Attack Power +", ...trip("80", "195", "390")],
              low: universalApDeltaGain(ACC_FLAT_AP_TABLE.Low),
              mid: universalApDeltaGain(ACC_FLAT_AP_TABLE.Mid),
              high: universalApDeltaGain(ACC_FLAT_AP_TABLE.High),
            },
            {
              label: ["Quality STR/DEX/INT (Max − Min): ", ...trip("1935", "2083", "2679")],
              low: universalStatDeltaGain(ACC_QUALITY_MAIN_STAT_TABLE.Low),
              mid: universalStatDeltaGain(ACC_QUALITY_MAIN_STAT_TABLE.Mid),
              high: universalStatDeltaGain(ACC_QUALITY_MAIN_STAT_TABLE.High),
              note: "Maximum difference between a minimum-quality and maximum-quality accessory: Ring +1,935, Earring +2,083, Necklace +2,679.",
            },
          ];
        }
      }
    }

    return { necklace, earrings, rings, universal };
  }

  // ----- Accessory vs. Accessory -----
  // Same relationship to Accessory Line Comparison above as Bracelet vs.
  // Bracelet has to Bracelet Line Comparison: a full-piece swap (Main
  // Stat + all 3 real lines at once) instead of one line valued in
  // isolation. ONE tool with a "Comparing" selector (Necklace/Ring/
  // Earring), not three separate panels - the 3 slot types share the
  // exact same shape (Main Stat + 2 guaranteed lines + 1 optional
  // universal line), so swapping which slot's line pool is shown beats
  // duplicating the whole card pair 3 times over for something the user
  // only ever compares one of at a time. See enforceAvbSlotUI for the
  // label/range swap this selector drives on the static markup.
  //
  // Rings and Earrings each have TWO independently-tracked real slots
  // (ring1Rate/Dmg vs ring2Rate/Dmg, gearApEarring1/WpEarring1 vs
  // gearApEarring2/WpEarring2). Which of your two real rings/earrings is
  // "Ring 1" vs "Ring 2" isn't something this calculator surfaces
  // anywhere, so there's no "which slot am I replacing" selector -
  // instead the candidate always writes into the ring1/earring1 fields,
  // and the OTHER piece's real Crit Rate/Dmg (Ring) or AP%/WP% (Earring)
  // comes from its own isolated avbOtherLine1Tier/avbOtherLine2Tier
  // fields (mandatory, not checkbox-gated) rather than from ring2Rate/
  // gearApEarring2 in Gearing - see readInputs' own comment on why those
  // Gearing fields can't be trusted here (no defined mapping between
  // "Earring 1/2 in Gearing" and "the one being replaced here", so
  // reading them risks folding Accessory A's own stats back in as if
  // they belonged to the other piece). Ignored entirely for Necklace,
  // which has no second slot to fold in (see hasOther below). Folding
  // this in for real (rather than assuming empty) matters because Ring's
  // Crit Rate/Dmg interact non-linearly with the grid, so treating a
  // real second ring as empty skews the swap's true gain, not just its
  // absolute total.
  //
  // Main Stat is the one piece of real state this tool needs beyond what
  // the Line Comparison table tracks - Gearing's Main Stat field is one
  // aggregate total across all gear, so exactly like the Bracelet panel's
  // "Current Bracelet's Crit Stat" field, SOME Main Stat has to come back
  // out of that aggregate to build the "slot empty" baseline before a
  // candidate's own typed Main Stat gets added on top. Unlike Bracelet's
  // field, this doesn't need its own separate input - Accessory A always
  // IS the real current piece (unless avbSlotEmpty is checked), and its
  // own typed Main Stat (a real absolute value off its tooltip, not a
  // quality-tier lookup) is what's subtracted, so there's nothing for
  // the reader to keep in sync by hand. Line 3's Flat
  // AP/Flat WP stay simple additive deltas with no such baseline
  // subtraction - same simplification the Universal Flat AP/WP rows in
  // Accessory Line Comparison above already make.
  //
  // Ring/Necklace's grid-integrated lines (Crit Rate/Dmg, Additional
  // Damage) are valued against the FIXED best split/keystone from the
  // overall Best Setup above, same as Accessory Line Comparison's own
  // necklace/ring rows - not re-derived per candidate the way Bracelet
  // vs. Bracelet's bestComboFor() call is, so there's no flip-footnote
  // here either, matching that table's own reasoning for omitting one.
  // gridLabel intentionally carries no "(Grid)" suffix - matches Bracelet
  // vs. Bracelet's own analogous row ("Keystone/Crit Lines", see its
  // markup above), which names what the line IS rather than how it's
  // computed. The row still only shows for slots with hasGrid: true.
  // line1Table/line2Table let enforceAvbSlotUI stamp each Low/Mid/High
  // <option>'s real value onto its label - same "show the value, not
  // just the tier name" convention Main Stat's own field already uses
  // (a real typed number, not a Low/Mid/High lookup). Necklace/Ring
  // deliberately point at the SAME ACC_ tables computeAccessoryVsAccessory
  // itself reads from (RING_RATE_TABLE is the one exception, reused
  // as-is - see its own comment), so the label can never drift out of
  // sync with the number actually being calculated.
  // hasOther: false for Necklace (only one exists, nothing to fold in),
  // true for Ring/Earring (see the "OTHER piece's real Crit Rate/Dmg"
  // comment above) - drives whether the isolated "Other Ring"/"Other
  // Earring" fields are shown at all in enforceAvbSlotUI.
  // hasWpRow: whether "Main Stat / Line 3" is worth showing as ITS OWN
  // row, separate from "vs No X" just above it. True for all three slots
  // now - see evalSide's mainStatLine3Ratio/lineRatio for how Earring
  // gets a real, exact value here despite Line 1/2 (Attack Power %/
  // Weapon Power %) sharing apTotalFor's own formula with Main Stat/
  // Line 3, unlike Ring/Necklace where Line 1/2 (Crit Rate/Dmg,
  // Additional/Outgoing Damage) live entirely inside gridMultFor and
  // never touch apTotalFor at all.
  //
  // For Necklace/Ring, that separation means gridRatio/flatMult (Line
  // 1/2) and wpRatio (Main Stat + Line 3's Flat AP/WP) are two totally
  // independent function calls sharing no variables, so wpRatio is a
  // single well-defined number no matter what Line 1/2 is set to, and
  // totalMult = gridRatio * flatMult * wpRatio is an exact product with
  // zero cross-term.
  //
  // Earring's Line 1 (Attack Power %) becomes percentApMult, a pure
  // outer multiplier over apTotalFor's whole bracket - structurally the
  // same category as gridRatio/flatMult, genuinely separable. Line 2
  // (Weapon Power %) is the one that can't be pulled out the same way:
  // it scales wp, which sits inside sqrt(wp * mainStat) alongside Main
  // Stat, and that sqrt term is then summed ADDITIVELY with flatAp (Line
  // 3) and supApBuff before percentApMult multiplies the total. Because
  // of that additive combination, "how much did Weapon Power % add" is
  // not a fixed number independent of what Line 3 is - it's an
  // interaction effect (a naive product of two ratios computed against
  // the same baseline in parallel does NOT reconstruct the true total
  // when this interaction is nonzero, i.e. whenever Line 3 isn't None).
  //
  // The fix: compute the two pieces SEQUENTIALLY (a waterfall) instead
  // of in parallel, crediting the interaction term to whichever step
  // comes second. mainStatLine3Ratio holds this side's own Line 1/2 at
  // "None" (apTotalFor(zeroed, ...) - zeroed already has this candidate's
  // own gearApEarring1/gearWpEarring1 zeroed, only the OTHER earring's
  // real Line 1/2 folded in) while Main Stat/Line 3 vary; lineRatio then
  // measures the marginal jump from turning this side's own Line 1/2 on
  // (apTotalFor(cloned, ...) / apOnlyMainStat). mainStatLine3Ratio *
  // lineRatio === wpRatio EXACTLY, for every input, because it's the
  // same total factored at a different point rather than two independent
  // measurements multiplied together. For Ring/Necklace this collapses
  // to lineRatio === 1 automatically (cloned's slot-specific mutations
  // never touch gearWp/gearApEarring1/gearFlatAp), so mainStatLine3Ratio
  // === wpRatio there, unchanged from before.
  //
  // hasLineRatioRow: whether the *separate* "Attack Power % / Weapon
  // Power %" row is worth showing underneath Main Stat/Line 3. Earring
  // only - for Ring/Necklace that row would just show +0.00% forever
  // (lineRatio ≡ 1), since their own Line 1/2 already has its own
  // dedicated Grid/Flat row above.
  // otherLine1Default/otherLine2Default: this slot's own first-visit
  // starting tier for the "Other Ring/Earring's Lines" pair (see that
  // field's own comment above enforceAvbSlotUI). Each slot with
  // hasOther gets its own pair here specifically so Ring and Earring
  // don't have to share one hardcoded fallback the way an earlier
  // version did (that version's switch-listener fallback was just the
  // literal strings "Mid"/"High" regardless of slot, so Earring's
  // "Other" always started on Ring's own default order the first time
  // you ever visited it - these per-slot defaults are what the "Comparing"
  // switch listener and readInputs' getSelect fallback both read from
  // instead of a bare string now). Necklace has no "Other" row
  // (hasOther: false) so its pair here is never actually used - kept
  // only so every slot has the same shape.
  const AVB_SLOT_LABELS = {
    necklace: {
      name: "Necklace", line1: "Additional Damage", line2: "Outgoing Damage", gridLabel: "Additional Dmg",
      hasGrid: true, hasFlat: true, hasOther: false, hasWpRow: true, hasLineRatioRow: false, line1Table: ACC_NECKLACE_ADD_TABLE, line2Table: ACC_NECKLACE_OUT_TABLE,
      otherLine1Default: "Mid", otherLine2Default: "High",
    },
    ring: {
      name: "Ring", line1: "Crit Rate", line2: "Crit Damage", gridLabel: "Crit Rate/Dmg",
      hasGrid: true, hasFlat: false, hasOther: true, hasWpRow: true, hasLineRatioRow: false, line1Table: RING_RATE_TABLE, line2Table: ACC_RING_DMG_TABLE,
      otherLine1Default: "Mid", otherLine2Default: "High",
    },
    earring: {
      name: "Earring", line1: "Attack Power %", line2: "Weapon Power %", gridLabel: "",
      hasGrid: false, hasFlat: false, hasOther: true, hasWpRow: true, hasLineRatioRow: true, line1Table: ACC_EARRING_AP_TABLE, line2Table: ACC_EARRING_WP_TABLE,
      otherLine1Default: "High", otherLine2Default: "Mid",
    },
  };

  // Shared by enforceAvbSlotUI (Line 1/2) and enforceAvbLineControls
  // (Line 3) - stamps each Low/Mid/High <option>'s real value onto its
  // label, e.g. "Low" -> "0.70%", same "show the value, not the tier
  // name" convention every OTHER Low/Mid/High select on this page
  // already uses (Bracelet Line Comparison's top selects, the Gearing
  // panel's Ring/Earring rows, etc. - none of them prefix the number
  // with the tier name either). The <option>'s value attribute still
  // carries the tier name for lookups; only the visible label changes.
  // Leaves "None"/other values alone since None is always 0 and
  // self-explanatory as-is.
  function setTierOptionValues(selectEl, table, formatValue) {
    if (!selectEl || !table) return;
    ["Low", "Mid", "High"].forEach((tier) => {
      const opt = selectEl.querySelector('option[value="' + tier + '"]');
      if (opt && table[tier] != null) {
        opt.textContent = formatValue(table[tier]);
      }
    });
  }
  function formatTierPct(value) {
    return (value * 100).toFixed(2) + "%";
  }

  function computeAccessoryVsAccessory(inputs) {
    const gridResult = computeGridAndSummary(inputs);
    const best = gridResult.best;
    if (!best) return null;
    const slot = inputs.avbSlot;
    // Earring's own candidate lines are the one case in this tool where
    // the slot's own Line 2 feeds Weapon Power% (gearWpEarring1/2 - see
    // AVB_SLOT_LABELS.earring.line2) rather than a grid/flat multiplier
    // like the other two slots - see apTotalFor's own comment for why
    // that needs gearWp itself reverse-derived out of the REAL current
    // % (captured here, before `zeroed` below touches gearWpEarring1/2)
    // rather than left as-is the way Ring/Necklace's untouched gearWp
    // can be.
    const fullWpPercentMult = 1 + gearWpPercentTotal(inputs) / 100;

    // Accessory A is always treated as your real currently-equipped piece
    // (see equippedMainStat/noSlotMainStat below), so if ITS OWN Line 3 is
    // Flat AP/Flat WP, that amount is already baked into gearFlatAp/gearWp
    // (or, for Earring, into gearWp via fullWpPercentMult's own real %) and
    // has to be backed out of the shared baseline the same way Main Stat
    // is - computed up here, before `zeroed`/apTotalFor exist, since both
    // need it. strippedGearWp is Earring-only (its own wpBase below reverse-
    // derives off a %, not a plain total - see apTotalFor's own comment),
    // Ring/Necklace instead get zeroed.gearWp mutated directly further down.
    const equippedSide = inputs.avbA;
    const equippedFlatApDelta = equippedSide.line3Type === "ap_flat" ? (ACC_FLAT_AP_TABLE[equippedSide.line3Tier] || 0) : 0;
    const equippedWpDelta = equippedSide.line3Type === "wp_flat" ? (ACC_FLAT_WP_TABLE[equippedSide.line3Tier] || 0) : 0;
    const strippedGearWp = Math.max(0, inputs.gearWp - equippedWpDelta * fullWpPercentMult);

    // addDmgDelta/critDmgDelta let a candidate's Necklace Additional Damage
    // or Ring Crit Damage line inject the Accessory Line Comparison panel's
    // OWN candidate figures (ACC_NECKLACE_ADD_TABLE/ACC_RING_DMG_TABLE)
    // directly onto shared's running totals, instead of writing a tier
    // name into cloned.necklace/cloned.ring1Dmg and letting computeShared
    // re-derive it through NECKLACE_ADD_TABLE/RING_DMG_TABLE - those two
    // are this site's "your actual equipped piece" tracked tables. Add
    // Dmg's pair still differs at Low (0.006 vs 0.007 - see
    // ACC_NECKLACE_ADD_TABLE's own comment); Ring Crit Dmg's pair is now
    // confirmed an exact match at every tier (see ACC_RING_DMG_TABLE's own
    // comment - RING_DMG_TABLE's old 0.012 Low was a mistranscription),
    // but this still routes through the same manual-delta path rather
    // than writing ring1Dmg's tier name directly, for consistency with
    // Add Dmg and to avoid re-coupling two tables that were tracked
    // separately on purpose. Writing the tier name into the real field
    // silently pulled the wrong table for Add Dmg's Low roll, so this
    // tool's numbers didn't always match the reference panel above for
    // the exact same tier. Same fix computeAccessoryComparison's own
    // ringDmgGain already applies.
    //
    // Re-optimized (bestComboFor), not a fixed-pair eval, for the exact
    // same reason Bracelet/Accessory Line Comparison/Chaos Core were
    // fixed - addDmgDelta/critDmgDelta feed addDmgBase/addDmgMaster/
    // critDmgTotal directly (the grid formula itself), so the winning
    // pair can genuinely differ between the "no accessory" baseline and
    // each candidate. This call site was NOT included in that earlier
    // pass - it was incorrectly assumed to already re-optimize (it
    // didn't; it reused one fixed keenSense/limitBreak/pair from the
    // reader's live Best Setup for every zeroedGridMult/evalSide call)
    // - fixed the same way here. Called once for the "no accessory"
    // baseline (zeroedGridMult below) and once per candidate side inside
    // evalSide, so both ends of the gridRatio now re-search independently,
    // same shape as every other Line Comparison gain function.
    function gridMultFor(clonedInputs, addDmgDelta, critDmgDelta) {
      const shared = computeShared(clonedInputs);
      if (addDmgDelta) {
        shared.addDmgBase += addDmgDelta;
        shared.addDmgMaster += addDmgDelta;
      }
      if (critDmgDelta) {
        shared.critDmgTotal += critDmgDelta;
      }
      return bestComboFor(clonedInputs, shared).mult;
    }

    // Shared AP-total helper: wp/flatAp/percentApMult/wpPercentMult are
    // all read fresh off `cloned`, so only Main Stat and Line 3's Flat
    // AP/WP delta need passing in explicitly.
    function apTotalFor(cloned, mainStat, flatApDelta, wpDelta) {
      const wpPercentMult = 1 + gearWpPercentTotal(cloned) / 100;
      // Ring/Necklace never touch gearWpEarring1/2, so gearWpPercentTotal
      // is the same for `cloned` as it is for the real `inputs` no matter
      // what those slots' own candidate lines are set to - cloned.gearWp
      // is already the correct figure there (a real character-panel
      // total that already has its existing WP% sources baked in, same
      // assumption gearApTotal's own wp param relies on everywhere else
      // in this file - see e.g. line 1928, 2159) and must NOT be
      // multiplied by wpPercentMult again, only wpDelta (a fresh flat
      // WP addition from Line 3, which - like any new flat source added
      // on top of an already-%'d stat - does need scaling by the full %
      // to land correctly) should be.
      //
      // Earring is different: its own Line 2 (AP%/WP% swap the same
      // gearWpEarring1/2 fields the Gearing panel's real earrings use)
      // makes wpPercentMult(cloned) genuinely differ from
      // wpPercentMult(inputs) - the whole point of this comparison. But
      // cloned.gearWp is still the REAL panel total with the REAL
      // earrings' % baked in - zeroing gearWpEarring1/2 above only
      // dropped their share from gearWpPercentTotal's SUM, it can't
      // un-bake a % that's already multiplied into the raw number - so
      // using it as-is here would silently ignore every candidate's own
      // Line 2 entirely (the bug this comment is fixing: WP% did
      // nothing, since only wpDelta - always 0 for Earring - was ever
      // scaled by wpPercentMult). Divide the real total back out by the
      // REAL full % (fullWpPercentMult, captured before zeroing) to
      // recover the underlying raw figure, then re-multiply by whatever
      // % this side actually represents - same reverse-derivation Chaos
      // Core: Weapon uses above for its own flat+pct term (see
      // arkNB.gearWp).
      const wpBase = slot === "earring" ? (strippedGearWp / fullWpPercentMult) * wpPercentMult : cloned.gearWp;
      const wp = wpBase + wpDelta * wpPercentMult;
      const baseApMult = 1 + gearBaseApPercentTotal(cloned) / 100;
      const flatAp = cloned.gearFlatAp + flatApDelta + gearChaosStarFlat(cloned.gearApChaosStar);
      const percentApMult = 1 + gearAttackPowerPercentTotal(cloned) / 100;
      // Support AP Buff models an EQUALLY-GEARED support - same WP/Main
      // Stat/Base AP as you (see supportApBuff's own comment) - but "you"
      // there means your real, currently-entered Gearing panel, not
      // whatever hypothetical this candidate line is testing. Swapping
      // your own earring's WP% doesn't change the support's actual gear,
      // so this must be computed off the real `inputs` (frozen for the
      // whole ratio), never off this function's own `wp`/`mainStat`/
      // `baseApMult` params - those already reflect the candidate under
      // test. Every other supportApBuff call site in this file (Bracelet
      // panel's WP/AP rows, Bracelet vs. Bracelet, Ark Grid's Chaos Core:
      // Weapon row, Mana Food) already does this; this one didn't, which
      // is what let a candidate's own WP% silently inflate the modeled
      // support buff right along with it - confirmed against Arsonistic's
      // own Acc!C5/E5 formulas, which reuse one frozen SupAPBuff cell in
      // both the numerator and denominator of every ratio on the sheet.
      const supApBuff = supportApBuff(inputs, inputs.gearWp, inputs.gearMainStat, 1 + gearBaseApPercentTotal(inputs) / 100);
      return gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult, supApBuff);
    }

    // zeroed starts as a full copy of inputs. Only ring1Rate/Dmg or
    // gearApEarring1/WpEarring1 (Accessory A's own slot, the one actually
    // being swapped) get zeroed out below, since that's the slot getting
    // replaced by a candidate. The OTHER ring/earring's real Crit Rate/
    // Dmg or AP%/WP% is folded in from the isolated avbOtherLine1Tier/
    // avbOtherLine2Tier fields (see readInputs' own comment on why those,
    // not ring2Rate/gearApEarring2 off the Gearing panel, are the only
    // trustworthy source here) - for every slot with hasOther: true, i.e.
    // Ring and Earring, never Necklace.
    // otherCritDmgDelta folds Ring's "Other Ring" Crit Damage into the
    // baseline as an additive delta rather than writing it into
    // zeroed.ring2Dmg - RING_DMG_TABLE and ACC_RING_DMG_TABLE are now
    // confirmed an exact match at every tier (see ACC_RING_DMG_TABLE's
    // own comment), so a direct write would be equally correct today, but
    // this keeps the same delta approach used elsewhere on this page for
    // the candidate lines themselves rather than re-coupling two tables
    // that are tracked separately on purpose. Crit Rate has no such
    // history (RING_RATE_TABLE IS the ACC table, reused as-is), so it's
    // safe to write straight into zeroed.ring2Rate below. Earring's Attack
    // Power%/Weapon Power% have no such mismatch either (GEAR_AP_EARRING_
    // TABLE/GEAR_WP_EARRING_TABLE are exact matches to their ACC_
    // counterparts), so both of Earring's "Other Earring" lines are safe
    // to write directly.
    const otherCritDmgDelta =
      slot === "ring" ? (ACC_RING_DMG_TABLE[inputs.avbOtherLine2Tier] || 0) : 0;

    const zeroed = Object.assign({}, inputs);
    if (slot === "necklace") {
      zeroed.necklace = "None";
    } else if (slot === "ring") {
      zeroed.ring1Rate = "None"; zeroed.ring1Dmg = "None";
      zeroed.ring2Rate = inputs.avbOtherLine1Tier;
      zeroed.ring2Dmg = "None"; // otherCritDmgDelta carries Other Ring's Crit Dmg instead
    } else if (slot === "earring") {
      zeroed.gearApEarring1 = "None"; zeroed.gearWpEarring1 = "None";
      zeroed.gearApEarring2 = inputs.avbOtherLine1Tier;
      zeroed.gearWpEarring2 = inputs.avbOtherLine2Tier;
    }
    // Earrings never touch the crit/spec grid, so there's no grid
    // baseline to compute for them at all (gridRatio is fixed at 1
    // in evalSide below) - only Necklace/Ring need one here.
    const zeroedGridMult = slot === "earring" ? 1 : gridMultFor(zeroed, 0, otherCritDmgDelta);
    // "No accessory" baseline: Accessory A is always treated as your real
    // currently-equipped piece, so its own typed Main Stat gets
    // subtracted out of Gearing's total, so this comparison doesn't
    // double-count it. Reads avbA directly rather than a separate typed
    // field, so there's nothing for the reader to keep in sync by hand -
    // it always matches exactly whatever's currently typed into
    // Accessory A's own Main Stat field, even as they tweak it.
    const equippedMainStat = equippedSide.mainStat;
    const noSlotMainStat = Math.max(0, zeroed.gearMainStat - equippedMainStat);
    // Line 3's Flat AP/Flat WP need the exact same "back it out of the
    // baseline first" treatment as Main Stat just above - gearFlatAp/gearWp
    // are whole-character totals read off the real panel, so if the
    // equipped side's own Line 3 is Flat AP/WP, that value is ALREADY
    // inside them. This mutates zeroed itself (not just a one-off delta
    // passed to THIS call) because evalSide's own apTotalFor call below
    // reads cloned.gearFlatAp/cloned.gearWp too (cloned is a copy of
    // zeroed) - leaving zeroed's own totals un-stripped and only ever
    // negating the delta for this one noAccessoryAp call meant
    // evalSide(equippedSide) added Accessory A's own Line 3 back ON TOP
    // of a baseline that still silently contained it, a real double-count
    // (confirmed via Playwright: a Necklace's "Main Stat / Line 3" row
    // jumped from +1.05% to +1.45% off a 960 Weapon Power Line 3 on
    // Accessory A itself - a +0.40pp move for a source the Bracelet Line
    // Comparison panel's own identical 960 WP figure, computed the
    // ordinary undoubled way off the same real Gearing inputs, values at
    // only +0.14%). Earring's own Weapon Power reverse-derivation doesn't
    // read zeroed.gearWp at all (see apTotalFor's wpBase, strippedGearWp
    // above) so it needs no equivalent mutation here.
    zeroed.gearFlatAp = Math.max(0, zeroed.gearFlatAp - equippedFlatApDelta);
    if (slot !== "earring") {
      zeroed.gearWp = Math.max(0, zeroed.gearWp - equippedWpDelta);
    }
    const noAccessoryAp = apTotalFor(zeroed, noSlotMainStat, 0, 0);

    function evalSide(side) {
      const cloned = Object.assign({}, zeroed);
      let flatMult = 1;
      let addDmgDelta = 0;
      let critDmgDelta = 0;
      if (slot === "necklace") {
        // cloned.necklace stays "None" (already zeroed above) - Additional
        // Damage's candidate magnitude goes in as addDmgDelta instead (see
        // gridMultFor's comment for why). Outgoing Damage has no real
        // tracked field anywhere in this file (see the Line Comparison
        // necklaceOut comment above) so it's applied as a standalone
        // multiplier instead, same treatment as there.
        addDmgDelta = ACC_NECKLACE_ADD_TABLE[side.line1Tier] || 0;
        flatMult *= 1 + (ACC_NECKLACE_OUT_TABLE[side.line2Tier] || 0);
      } else if (slot === "ring") {
        // Crit Rate's RING_RATE_TABLE is an exact match to the ACC_
        // candidate figures (see that table's own comment), so it's safe
        // to write straight into cloned.ring1Rate. Crit Damage isn't - see
        // gridMultFor's comment - so cloned.ring1Dmg stays "None" and
        // critDmgDelta carries the candidate's real magnitude instead.
        cloned.ring1Rate = side.line1Tier;
        critDmgDelta = ACC_RING_DMG_TABLE[side.line2Tier] || 0;
      } else if (slot === "earring") {
        cloned.gearApEarring1 = side.line1Tier;
        cloned.gearWpEarring1 = side.line2Tier;
      }
      const gridRatio =
        slot === "earring" ? 1 : gridMultFor(cloned, addDmgDelta, critDmgDelta + otherCritDmgDelta) / zeroedGridMult;

      const flatApDelta = side.line3Type === "ap_flat" ? (ACC_FLAT_AP_TABLE[side.line3Tier] || 0) : 0;
      const wpDelta = side.line3Type === "wp_flat" ? (ACC_FLAT_WP_TABLE[side.line3Tier] || 0) : 0;

      // Sequential (waterfall), not parallel, decomposition - see
      // AVB_SLOT_LABELS' own comment above for why this is the only
      // version that reconstructs wpRatio exactly. `zeroed` still has
      // THIS side's own gearApEarring1/gearWpEarring1 forced to "None"
      // (the earring branch above only mutates `cloned`, a separate
      // copy, never `zeroed` itself) - for Ring/Necklace, cloned's own
      // slot-specific mutations (ring1Rate, etc.) never touch
      // gearWp/gearApEarring1/gearFlatAp at all, so apTotalFor(zeroed,...)
      // and apTotalFor(cloned,...) are identical there and this whole
      // decomposition collapses to lineRatio === 1 for them - the exact
      // same numbers those two slots already produced, just computed via
      // one extra no-op call.
      let mainStatLine3Ratio = 1;
      let lineRatio = 1;
      let wpRatio = 1;
      if (cloned.gearWp > 0 && noAccessoryAp > 0) {
        const apOnlyMainStat = apTotalFor(zeroed, noSlotMainStat + side.mainStat, flatApDelta, wpDelta);
        const apWithOwnLines = apTotalFor(cloned, noSlotMainStat + side.mainStat, flatApDelta, wpDelta);
        mainStatLine3Ratio = apOnlyMainStat / noAccessoryAp;
        lineRatio = apWithOwnLines / apOnlyMainStat;
        wpRatio = apWithOwnLines / noAccessoryAp;
      }

      return { totalMult: gridRatio * flatMult * wpRatio, gridRatio, flatMult, wpRatio, mainStatLine3Ratio, lineRatio };
    }

    const a = evalSide(inputs.avbA);
    const b = evalSide(inputs.avbB);
    return { slot, a, b, aVsB: a.totalMult / b.totalMult - 1 };
  }

  // ----- ArkGrid (Chaos Core) Comparison -----
  // Same "of the Cores I have data for, which is worth the most DPS"
  // question as Bracelet/Accessory above, but needs no inputs of its
  // own: 6 of its 9 effect types (Chaos Core: Flashy/Stable/Swift/
  // Attack/Weapon/Crushing) already have "current gear" tracking
  // elsewhere on this page - flashyAtk/stableAtk/swiftCore feed the
  // main grid directly, gearApChaosStar/gearWeaponCore/crushingCore
  // feed the Gearing section and main grid respectively - so their
  // candidates are valued by zeroing those SAME existing fields first,
  // exactly like Bracelet zeroes its own tracked fields before valuing
  // a candidate. The other 2 included types (Smoldering/Absorbing) have
  // no existing field to double-count against, so their candidates are
  // valued as a straight addition on top of your current totals - the
  // same treatment the Bracelet panel's own 5 WP/AP rows already give
  // any source that isn't separately tracked as "current gear". Chaos
  // Core: Speed is excluded (see the lookup tables' own comment above
  // computeShared for why, alongside every type's non-damage half).
  //
  // One row per Core TYPE (not one per type+grade) - Relic and Ancient
  // are columns within that row, not separate rows, so the table stays
  // at 8 rows instead of 16 and Points (14/17/20, this panel's actual
  // comparison axis) reads as the table's real structure instead of
  // being relabeled Low/Mid/High the way Bracelet/Accessory's tier
  // lookups are. See renderArkGridComparison for the two-level header
  // that keeps Relic vs Ancient unambiguous without doubling every row.
  function computeArkGridComparison(inputs) {
    const gridResult = computeGridAndSummary(inputs);
    const best = gridResult.best;
    if (!best) return [];
    // best.split/best.keystone not destructured here - Flashy/Swift/
    // Crushing/Stable all re-derive their own winning cell per candidate
    // via bestComboFor instead (see baselineArkBest's own comment below);
    // `best` itself is kept only for the `if (!best)` guard above.

    // Zeroes ONLY the 3 ArkGrid-tracked current-state fields - every
    // other field (bracelet, rings, Gearing, etc.) stays at its real
    // current value, since those aren't part of what this panel
    // isolates. Safe to reuse as the shared base for every row below
    // (including Weapon/Swift/Crushing/Smoldering/Absorbing, which
    // don't touch any of these 3 fields at all).
    const arkNB = Object.assign({}, inputs, {
      flashyAtk: "None",
      stableAtk: "None|0P",
      swiftCore: "None|0P",
      gearApChaosStar: "None|0P",
      gearWeaponCore: "None|0P",
      crushingCore: "None|0P",
    });
    // Chaos Core: Attack's own AP/flat-AP contribution zeroes cleanly
    // above (it's a separate term added on top of raw stats - see
    // gearApTotal's flatAp/percentApMult params). A currently-equipped
    // Chaos Core: WEAPON is different: its WP/WP% is baked directly
    // into whatever the reader typed into Weapon Power, so there's no
    // separate term to zero - it has to be reverse-derived out of
    // gearWp instead, using the exact inverse of the fold-in formula
    // the Chaos Core: Weapon row below uses to add a NEW candidate core
    // (newWp = wp*(1+pct/wpPercentMult) + flat*wpPercentMult):
    //   coreless_wp = (wp - flat*wpPercentMult) / (1 + pct/100/wpPercentMult)
    // Without this, a reader who actually runs Weapon Core today would
    // see an inflated "switch to Chaos Core: Attack" gain, since the
    // baseline would still silently include the Weapon Core WP they'd
    // actually be giving up. Clamped at 0 in case of an inconsistent
    // manual edit (e.g. a Weapon Core tier picked with too little
    // Weapon Power entered to have plausibly included it).
    const currentWeaponCore = ARK_WEAPON_CORE_TABLE[inputs.gearWeaponCore] || { pct: 0, flat: 0 };
    if (currentWeaponCore.pct || currentWeaponCore.flat) {
      const wpPercentMultNB = 1 + gearWpPercentTotal(arkNB) / 100;
      arkNB.gearWp = Math.max(
        0,
        (arkNB.gearWp - currentWeaponCore.flat * wpPercentMultNB) / (1 + currentWeaponCore.pct / 100 / wpPercentMultNB)
      );
    }
    const sharedNB = computeShared(arkNB);
    // Re-optimized baseline, not a fixed-pair eval - Flashy/Swift/
    // Crushing feed effCrit/critDmgTotal directly (the grid formula
    // itself), so the winning pair can genuinely differ once a candidate
    // is added, same failure mode Bracelet/Ring/
    // Necklace above already guard against - confirmed to actually flip on Flashy specifically
    // (Chaos Core: Flashy, Crit Hit Dmg: 228 flips out of ~180k synthetic
    // gear profiles tested); Swift/Crushing run through this exact same
    // critLikeGain-shaped code (same formula, so a fixed-pair call would
    // fail the same way), so there's no reason to think they're exempt.
    const baselineArkBest = bestComboFor(arkNB, sharedNB);
    const baselineMult = baselineArkBest.mult;
    // Stable's Additional Dmg row feeds addDmgBase/addDmgMaster the same
    // way Bracelet's addA/addB and Accessory's Necklace Additional Damage
    // do above, and was left on the old fixed-pair `/ (1 + addDmgBaseline)`
    // shortcut when those two were fixed - same latent bug, just not
    // caught in the original scoping pass. Fixed the same way here:
    // bestComboFor's sharedOverride with addDmgBase/addDmgMaster bumped
    // by the candidate's own STABLE_ATK_TABLE value, keeping the table
    // itself untouched.
    function stableAddGain(value) {
      if (!value) return 0;
      const shared = Object.assign({}, sharedNB, {
        addDmgBase: sharedNB.addDmgBase + value,
        addDmgMaster: sharedNB.addDmgMaster + value,
      });
      const withBest = bestComboFor(arkNB, shared);
      return withBest.mult / baselineMult - 1;
    }

    // Crit Hit Dmg (Flashy)/Crit Dmg (Swift)/Crit Rate (Crushing) all
    // interact with the grid non-linearly (crit rate's cap, Master's
    // +7% headroom, etc.), so - same as every Bracelet Crit Rate/Crit
    // Dmg row - these go through a full bestComboFor recompute (full
    // 9-cell re-search) rather than a fixed-pair combinedMultiplier call.
    // Swift/Crushing each have their own tracked field now (swiftCore/
    // crushingCore, zeroed in arkNB above), same as Flashy/Stable.
    function critLikeGain(mutateFn) {
      const cloned = Object.assign({}, arkNB);
      mutateFn(cloned);
      const withBest = bestComboFor(cloned);
      return withBest.mult / baselineMult - 1;
    }

    // Builds one row's 5 cells from a single per-grade gain function:
    // one merged 14 Points cell (Relic/Ancient are the same core
    // investment before 17p unlocks any grade difference in every table
    // above except Smoldering's flat-by-grade Burn estimate - see that
    // table's own comment - so a single Relic-grade value stands in for
    // both there too, rather than the table carrying two columns that
    // read as duplicates for 7 of its 8 rows), then the real Relic/
    // Ancient pair at 17p and 20p where the grades actually diverge.
    function points6(gainFn) {
      return {
        p14: gainFn("Relic", "14P"),
        relic17: gainFn("Relic", "17P"),
        ancient17: gainFn("Ancient", "17P"),
        relic20: gainFn("Relic", "20P"),
        ancient20: gainFn("Ancient", "20P"),
      };
    }

    const rows = [];

    // Chaos Core: Flashy - Crit Hit Dmg (own tracked field, zeroed
    // above) combined with Dmg% (untracked elsewhere, a flat addition -
    // see ARK_FLASHY_DMG_TABLE's own comment). Crit Hit Dmg only moves
    // at 10p and 17p (nothing changes at 14p or 18-20p), so the 14p
    // columns reuse the 10p figure and 20p reuses 17p's.
    rows.push({
      label: "Chaos Core: Flashy - Crit Hit Dmg & Dmg%",
      ...points6((grade, pts) => {
        const chitKey = pts === "14P" ? "Epic-Leg 10P" : grade + " 17P";
        const chit = critLikeGain((c) => { c.flashyAtk = chitKey; });
        const dmg = ARK_FLASHY_DMG_TABLE[grade + "|" + pts];
        return (1 + chit) * (1 + dmg) - 1;
      }),
    });

    // Chaos Core: Stable - Additional Dmg only (DR excluded). Reuses
    // STABLE_ATK_TABLE directly (already the exact cumulative totals
    // this needs, since it's the same field the main grid already
    // tracks), run through stableAddGain's re-optimized with/without
    // search - see that function's own comment above.
    rows.push({
      label: "Chaos Core: Stable - Additional Dmg",
      ...points6((grade, pts) => stableAddGain(STABLE_ATK_TABLE[grade + "|" + pts])),
    });

    // Chaos Core: Swift - Crit Dmg only (Attack Speed excluded). Own
    // tracked field (zeroed in arkNB above), same treatment as Flashy.
    rows.push({
      label: "Chaos Core: Swift - Crit Dmg",
      ...points6((grade, pts) => critLikeGain((c) => { c.swiftCore = grade + "|" + pts; })),
    });

    // Chaos Core: Crushing - Crit Rate only (Weapon Power Cooldown
    // reduction excluded). Own tracked field (zeroed in arkNB above).
    rows.push({
      label: "Chaos Core: Crushing - Crit Rate",
      ...points6((grade, pts) => critLikeGain((c) => { c.crushingCore = grade + "|" + pts; })),
    });

    // Chaos Core: Smoldering - Boss Dmg (untracked elsewhere, a flat
    // addition) combined with Burn (see ARK_SMOLDERING_BURN_TABLE's own
    // comment for why that half is a fixed grade-only estimate rather
    // than Points-scaled).
    rows.push({
      label: "Chaos Core: Smoldering - Boss Dmg & Burn",
      ...points6((grade, pts) => {
        const bossDmg = ARK_SMOLDERING_BOSSDMG_TABLE[grade + "|" + pts];
        const burn = ARK_SMOLDERING_BURN_TABLE[grade];
        return (1 + bossDmg) * (1 + burn) - 1;
      }),
    });

    // Chaos Core: Absorbing - Dmg only (Healing excluded). Untracked
    // elsewhere, so a flat addition same as Smoldering's Boss Dmg half.
    rows.push({
      label: "Chaos Core: Absorbing - Dmg",
      ...points6((grade, pts) => ARK_ABSORBING_DMG_TABLE[grade + "|" + pts]),
    });

    // ----- Chaos Core: Attack / Weapon - reuse the same gearApTotal
    // machinery as the Bracelet panel's own 5 WP/AP rows, computed once
    // from arkNB (which already excludes both your current Chaos Core:
    // Attack, via the zeroed gearApChaosStar, and your current Chaos
    // Core: Weapon, via the reverse-derived gearWp above - see that
    // block's own comment). Requires real Weapon Power/Main Stat, same
    // guard the Bracelet panel's own WP/AP rows use. -----
    {
      const wp = arkNB.gearWp;
      const mainStat = arkNB.gearMainStat;
      const baseApMult = 1 + gearBaseApPercentTotal(arkNB) / 100;
      const flatAp = arkNB.gearFlatAp + gearChaosStarFlat(arkNB.gearApChaosStar);
      const percentApMult = 1 + gearAttackPowerPercentTotal(arkNB) / 100;
      const wpPercentMult = 1 + gearWpPercentTotal(arkNB) / 100;
      const supApBuff = supportApBuff(arkNB, wp, mainStat, baseApMult);
      const baselineAp = gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult, supApBuff);

      if (wp > 0 && mainStat > 0 && baselineAp > 0) {
        // Chaos Core: Attack grants flat AP and AP% simultaneously -
        // gearApTotal takes both directly as parameters, no folding
        // trick needed (unlike Weapon below).
        rows.push({
          label: "Chaos Core: Attack - Flat AP & AP%",
          ...points6((grade, pts) => {
            const t = GEAR_AP_CHAOS_STAR_TABLE[grade + "|" + pts] || { pct: 0, flat: 0 };
            return (
              gearApTotal(wp, mainStat, baseApMult, flatAp + t.flat, percentApMult + t.pct / 100, supApBuff) /
                baselineAp -
              1
            );
          }),
        });

        // Chaos Core: Weapon grants flat WP and WP% simultaneously -
        // WP% isn't a gearApTotal parameter (it's folded into wp itself
        // before this function ever sees it), so both halves use the
        // same two folding tricks the Accessory panel's own Earring WP%
        // and the Bracelet panel's own flat-WP rows each use
        // individually, combined: the existing wp scales up by the new
        // %, and the new flat amount scales up by the existing % (both
        // get the same treatment a real equipped Weapon Core's payout
        // would).
        rows.push({
          label: "Chaos Core: Weapon - Flat WP & WP%",
          ...points6((grade, pts) => {
            const t = ARK_WEAPON_CORE_TABLE[grade + "|" + pts] || { pct: 0, flat: 0 };
            const newWp = wp * (1 + t.pct / 100 / wpPercentMult) + t.flat * wpPercentMult;
            return gearApTotal(newWp, mainStat, baseApMult, flatAp, percentApMult, supApBuff) / baselineAp - 1;
          }),
        });
      }
    }

    // Sorted by Ancient 20p - the best-case grade/points combo, same role
    // High played in the Bracelet/Accessory panels' own sort (this used
    // to rank by Ancient 17p, the "typical serious investment" reference
    // point that played Mid's role - moved to match once those panels
    // switched from Mid to High).
    rows.sort((a, b) => b.ancient20 - a.ancient20);
    return rows;
  }

  // ----- Format helper -----
  // Always 2 decimals - consistent across every field tag rather than
  // switching precision based on magnitude.
  // ----- Engraving Comparison -----
  //
  // The Ark Passive keystone grid above already accounts for Adrenaline and
  // Keen Blunt Weapon (both live inside computeShared via inputs.adrenaline/
  // adrenalineStone/kbw/kbwStone) - this section adds the 5 remaining
  // Deathblade-relevant engravings the grid doesn't track at all (Grudge,
  // Ambush Master, Cursed Doll, Mass Increase, Raid Captain), then searches
  // for Deathblade's actual competing-slot decision: RE only ever swaps ONE
  // slot (Keen Blunt Weapon vs Cursed Doll) - Raid Captain is assumed to
  // always fill RE's other flex slot, since RE reliably reaches the Move
  // Speed cap and doesn't realistically trade it away. Surge has no such
  // fixed slot, so it searches every 2-of-N combination of the whole
  // competing pool instead (Mass Increase opt-in, see below). Every
  // candidate is run back through bestComboFor() - the same per-candidate
  // keystone/split search Bracelet vs. Bracelet already uses - since a
  // different competing pool can genuinely change which keystone/split wins.
  //
  // Sourced from Arsonistic's "Engr+Stone" sheet, matching the reference
  // screenshot cell-for-cell (see the constants below for the couple of
  // rows needing an actual mechanic instead of a straight lookup). Level
  // labels reuse the "0 Nodes".."4 Nodes" scheme Adrenaline/Keen Blunt
  // Weapon already use above - the sheet's own L4/R1-R4 columns are the
  // same 5 tiers, just labeled for book grade instead of node count. 0
  // Nodes = L4 (Legendary-only), 4 Nodes = R4 (maxed) - same "start
  // maxed" default as Adrenaline/KBW.
  const ENGRAVING_STONE_OPTIONS = ["1 Lv.", "2 Lv.", "3 Lv.", "4 Lv."];

  const GRUDGE_TABLE = { "0 Nodes": 0.18, "1 Nodes": 0.1875, "2 Nodes": 0.195, "3 Nodes": 0.2025, "4 Nodes": 0.21 };
  const GRUDGE_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.03, "2 Lv.": 0.0375, "3 Lv.": 0.0525, "4 Lv.": 0.06 };
  const CURSED_DOLL_TABLE = { "0 Nodes": 0.14, "1 Nodes": 0.1475, "2 Nodes": 0.155, "3 Nodes": 0.1625, "4 Nodes": 0.17 };
  const CURSED_DOLL_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.03, "2 Lv.": 0.0375, "3 Lv.": 0.0525, "4 Lv.": 0.06 };
  const MASS_INCREASE_TABLE = { "0 Nodes": 0.16, "1 Nodes": 0.1675, "2 Nodes": 0.175, "3 Nodes": 0.1825, "4 Nodes": 0.19 };
  const MASS_INCREASE_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.03, "2 Lv.": 0.0375, "3 Lv.": 0.0525, "4 Lv.": 0.06 };

  // Ambush Master: the flat Back Attack Damage half is +15% regardless of
  // book investment (the sheet's L4-R4 columns for this row are all
  // identical, 0.15) - gated by BOTH how much of your DPS comes from a
  // back-attack-classified skill (BACK_ATTACK_DPS_SHARE, the same 95%
  // constant the Bracelet panel's own Back Attack Damage row already
  // uses) AND the Ark Passive section's own Back Attack Rate input (the %
  // chance a back-attack skill actually lands from behind) - Ambush
  // Master's tooltip requires the hit to actually connect as a back
  // attack, not merely come from a back-attack-capable skill, so unlike
  // the Bracelet row both factors apply here. The secondary Type2 "Dmg"
  // column scales with book investment like a mini Grudge and applies
  // regardless of position (a generic Dmg%, not BackDmg) - confirmed by
  // its distinct "Dmg" type tag in the sheet.
  const AMBUSH_MASTER_BACK_DMG = 0.15;
  const AMBUSH_MASTER_SECONDARY_TABLE = { "0 Nodes": 0.048, "1 Nodes": 0.055, "2 Nodes": 0.062, "3 Nodes": 0.069, "4 Nodes": 0.076 };
  const AMBUSH_MASTER_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.027, "2 Lv.": 0.034, "3 Lv.": 0.047, "4 Lv.": 0.054 };

  // Raid Captain: the sheet's MSpdDmg values are the bonus AT the 140%
  // Move Speed cap. Scales linearly with Move Speed from 0% bonus at
  // exactly 100% up to the full tabled value at 140%+ (clamped) - e.g.
  // 48% table value * (140-100)/100 = 19.2% at the cap. The Ability
  // Stone shares the same MSpdDmg type as the base engraving, so it's
  // assumed to scale the same way rather than apply as a flat add.
  const RAID_CAPTAIN_TABLE = { "0 Nodes": 0.40, "1 Nodes": 0.42, "2 Nodes": 0.44, "3 Nodes": 0.46, "4 Nodes": 0.48 };
  const RAID_CAPTAIN_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.075, "2 Lv.": 0.094, "3 Lv.": 0.132, "4 Lv.": 0.15 };
  const RAID_CAPTAIN_BASE_MOVE_SPEED = 106.32;
  const RAID_CAPTAIN_CLASS_MOVE_SPEED = { re: 12, surge: 10 };
  // Passionate Dance (support), the Maelstrom debuff/uptime, and Rage Rune
  // on Surprise Attack each grant the SAME numeric bonus to both Move
  // Speed and Attack Speed at once - not two separate effects that happen
  // to share a name. Named generically (not "_MOVE_SPEED") and reused by
  // raidCaptainMoveSpeed (below) so both stats stay tied to one number.
  const SUPPORT_SPEED_BONUS = 9; // Passionate Dance - reused live from .ap-yearning above.
  const MAELSTROM_SPEED_BONUS = 12.8;
  const RAID_CAPTAIN_WINE_MOVE_SPEED = 3; // Vernese Wine - Surge only, Move Speed only (no Attack Speed counterpart).
  // Support: Artist/Valkyrie - a party-wide Move Speed buff, not a personal
  // consumable choice, so unlike Wine/Mana Food it isn't part of their
  // 2-way mutually-exclusive set (see that listener's own comment below)
  // and applies on both RE and Surge alike, same as Rage Rune just above. Modeled as a flat add at its full value - "100%
  // uptime" is the assumption baked into the flat number itself, not a
  // tracked uptime input like Maelstrom's. Only ever a real source while a
  // Support is actually in the party though (gated on `yearning`, same
  // "Support: Passionate Dance" checkbox as supportApBuff/gearSupportUptime
  // above and enforced disabled the same way via
  // enforceGearSupportUptimeGate), unlike Rage Rune which is a Deathblade-
  // only source with no such dependency.
  const SUPPORT_AV_MOVE_SPEED = 8;
  // Support: Paladin - another party-wide Move Speed source from a
  // Support, same exclusivity idea as Wine/Mana Food's "only one thing is
  // actually being eaten" but for "only one Support's kit is actually in
  // the raid": Artist/Valkyrie and Paladin can never both be true at once
  // (enforced by the supportMoveSpeed group in EXCLUSIVE_GROUPS, same as
  // Wine/Mana Food's own), so at most one of
  // engrInputs.supportAv/supportPaladin is ever true here.
  // Unlike Artist/Valkyrie's near-permanent Identity uptime though,
  // Paladin's Move Speed comes from low-uptime skills (per the checkbox's
  // own tooltip) - modeling it as a flat 100%-uptime add the way
  // SUPPORT_AV_MOVE_SPEED is would overstate it, so this is instead
  // treated as a genuine partial-uptime source, time-weighted the same
  // way Maelstrom (and Rage Rune) are - see raidCaptainMoveSpeed and
  // expectedCappedMoveSpeed below, which expand every active source into
  // its joint on/off combinations and cap EACH combination before
  // averaging, not the other way around, for the same concavity reason
  // Maelstrom's own comment explains: capping an already-summed EV
  // overstates the real value whenever the baseline sits near the 140%
  // cap).
  const SUPPORT_PALADIN_MOVE_SPEED = 24.6;
  // Fixed assumption baked into the checkbox itself, not a reader-facing
  // slider like Maelstrom Uptime % - Paladin's Move Speed comes from a
  // mix of skills with genuinely low, hard-to-pin-down uptime, so this is
  // one representative number rather than something worth exposing as
  // its own input.
  const SUPPORT_PALADIN_MOVE_SPEED_UPTIME = 35;
  // Rage Rune on Surprise Attack (Surge only): grants +16% Move Speed AND
  // +16% Attack Speed for 6s on proc. Modeled as a flat, independent
  // uptime source - same treatment as Paladin's Move Speed above - rather
  // than trying to correlate its proc timing with Maelstrom's own uptime;
  // 20% is a simple, representative average uptime across a rotation.
  // Toggled on by default since the rune itself is assumed taken.
  const RAGE_RUNE_SPEED_BONUS = 16;
  const RAGE_RUNE_MOVE_SPEED_UPTIME = 20;
  const RAID_CAPTAIN_MOVE_SPEED_CAP = 140;
  // Mana Food's flat Dmg from unlocking the Bleed rune on Maelstrom - not
  // gated on Raid Captain or any other engraving (any loadout running
  // Mana Food gets it), so it's its own row in the contribution table
  // (see manaFoodContributionGain/computeEngravingComparison) rather than
  // folded into raidCaptainGain. Stacks
  // multiplicatively on top of Mana Food's own Main Stat AP ratio below,
  // same "AP ratio x flat Dmg layer" shape adrenalineContributionGain
  // already uses.
  const MANA_FOOD_BLEED_DMG = 0.0075;

  // Expected Move Speed for `base` plus a set of independent, on/off
  // bonus sources, each capped at `cap`. Averages the CAPPED outcome of
  // every joint on/off combination rather than capping an already-summed
  // EV - min() is concave, so capping first then averaging systematically
  // overstates the real value whenever the uncapped sum sits near/over
  // the cap, which is the common case here since Raid Captain's baseline
  // already sits close to the 140% cap on its own. This is the "proper,
  // overcap-aware" formula every Move Speed source above should go
  // through - Maelstrom, Rage Rune, and Paladin are each independent
  // sources plugged into this the same way, rather than each needing its
  // own bespoke overlap model.
  function expectedCappedMoveSpeed(base, cap, sources) {
    let total = 0;
    for (let mask = 0; mask < 1 << sources.length; mask++) {
      let value = base;
      let prob = 1;
      for (let i = 0; i < sources.length; i++) {
        const on = (mask >> i) & 1;
        prob *= on ? sources[i].uptime : 1 - sources[i].uptime;
        if (on) value += sources[i].bonus;
      }
      total += prob * Math.min(value, cap);
    }
    return total;
  }

  function raidCaptainMoveSpeed(engrInputs, yearning) {
    let restOfMs = RAID_CAPTAIN_BASE_MOVE_SPEED + (RAID_CAPTAIN_CLASS_MOVE_SPEED[engrInputs.spec] || 0);
    if (yearning) restOfMs += SUPPORT_SPEED_BONUS;
    if (engrInputs.supportAv && yearning) restOfMs += SUPPORT_AV_MOVE_SPEED;
    if (engrInputs.spec === "surge" && engrInputs.wine && !engrInputs.manaFood) restOfMs += RAID_CAPTAIN_WINE_MOVE_SPEED;

    // Maelstrom, Rage Rune, and Paladin are all modeled as independent
    // uptime sources - no known correlation between any of their timings
    // - so each just gets added to the list when it applies and
    // expectedCappedMoveSpeed expands the full joint on/off combination
    // space itself.
    const sources = [{ bonus: MAELSTROM_SPEED_BONUS, uptime: engrInputs.maelstromUptime / 100 }];
    if (engrInputs.spec === "surge" && engrInputs.rageRune) {
      sources.push({ bonus: RAGE_RUNE_SPEED_BONUS, uptime: RAGE_RUNE_MOVE_SPEED_UPTIME / 100 });
    }
    if (engrInputs.supportPaladin && yearning) {
      sources.push({ bonus: SUPPORT_PALADIN_MOVE_SPEED, uptime: SUPPORT_PALADIN_MOVE_SPEED_UPTIME / 100 });
    }
    return expectedCappedMoveSpeed(restOfMs, RAID_CAPTAIN_MOVE_SPEED_CAP, sources);
  }

  function raidCaptainMoveSpeedFraction(engrInputs, yearning) {
    const ms = raidCaptainMoveSpeed(engrInputs, yearning);
    return Math.max(0, Math.min(RAID_CAPTAIN_MOVE_SPEED_CAP, ms) - 100) / 100;
  }

  // Isolated Main Stat AP ratio for Mana Food - mainStatAmount is whichever
  // of the two Mana Food tiers (6000 or 12000, see engrInputs.manaFoodAmount)
  // the reader picked - reusing the exact same gearApTotal inputs/shape as
  // the Gearing section's own "STR/DEX/INT +12000/14000/16000" Bracelet
  // line (see that row above) - requires real Weapon Power/Main Stat like
  // every other AP-based row on the page, else it's a silent no-op (ratio
  // 1) rather than a nonsensical partial-state number. The Bleed rune's
  // flat +0.75% Dmg rides on top multiplicatively, not gated on any of
  // that, EXCEPT for RE: RE has no Bleed-rune-on-Maelstrom interaction at
  // all (that's a Surge Identity/Maelstrom-specific tech), so its Mana
  // Food is Main-Stat-only - includeBleed lets manaFoodContributionGain
  // pass that in per spec instead of duplicating this whole function.
  function manaFoodGain(inputs, mainStatAmount, includeBleed) {
    const wp = inputs.gearWp;
    const mainStat = inputs.gearMainStat;
    let statRatio = 1;
    if (wp > 0 && mainStat > 0) {
      const baseApMult = 1 + gearBaseApPercentTotal(inputs) / 100;
      const flatAp = inputs.gearFlatAp + gearChaosStarFlat(inputs.gearApChaosStar);
      const percentApMult = 1 + gearAttackPowerPercentTotal(inputs) / 100;
      const mainStatPercentMult = 1 + inputs.gearMainStatPercent / 100;
      const supApBuff = supportApBuff(inputs, wp, mainStat, baseApMult);
      const baselineAp = gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult, supApBuff);
      if (baselineAp > 0) {
        const newAp = gearApTotal(
          wp,
          mainStat + mainStatAmount * mainStatPercentMult,
          baseApMult,
          flatAp,
          percentApMult,
          supApBuff
        );
        statRatio = newAp / baselineAp;
      }
    }
    return statRatio * (1 + (includeBleed ? MANA_FOOD_BLEED_DMG : 0)) - 1;
  }

  // Whether Mana Food currently grants the Bleed-rune-on-Maelstrom Dmg
  // term - true for Surge builds other than 222 (see is222Build's own
  // comment for why 222 is carved out: its gearing already tends to
  // clear the Bleed rune's stat threshold without Mana Food, so treating
  // Mana Food as adding that Dmg there would double-count a bonus 222
  // likely already has regardless of the checkbox). False for RE, same
  // as before - RE has no Bleed-rune-on-Maelstrom interaction at all. Also
  // false when the reader picked the Surge 111/333 "Main Stat only" food, which
  // by definition skips the Bleed rune.
  function manaFoodBleedApplies(engrInputs, inputs) {
    return engrInputs.spec === "surge" && inputs.braceSpecBuild !== "surge-222" && !engrInputs.manaFoodMainOnly;
  }
  // Short label for the food itself, used everywhere a "which food did
  // you eat" string gets built - "Mana Food" alone (no "+ Bleed") for RE
  // and for 222, matching manaFoodBleedApplies exactly so the label never
  // implies a Dmg term the calculation doesn't actually add.
  function manaFoodLabel(engrInputs, inputs) {
    return manaFoodBleedApplies(engrInputs, inputs) ? "Mana Food + Bleed" : "Mana Food";
  }

  // Mana Food's own isolated contribution-table row. On Surge builds
  // other than 222 this feeds both the Main Stat AP ratio and the
  // Bleed-rune-on-Maelstrom Dmg (see manaFoodGain). On RE, and on Surge
  // 222 (see manaFoodBleedApplies), it's Main-Stat-only (no Bleed rune
  // term) AND, per engravingCandidateMultiplier's own comment, RE's copy
  // is deliberately excluded from every DPS total on the page - RE
  // readers only get this row as an informational "here's what that Main
  // Stat is worth in isolation" number, never folded into Setup A/B, the
  // best-combo search, or anything else. 0 whenever the Mana Food
  // checkbox itself is off, regardless of spec.
  function manaFoodContributionGain(engrInputs, inputs) {
    if (!engrInputs.manaFood) return 0;
    return manaFoodGain(inputs, engrInputs.manaFoodAmount, manaFoodBleedApplies(engrInputs, inputs));
  }

  // Which of Wine/Mana Food is currently better to eat, and by how much -
  // both scenarios otherwise share the same Maelstrom uptime/Rage Rune/
  // Passionate Dance/spec, only the Wine-vs-Mana-Food choice itself
  // flips. Positive = Mana Food ahead, negative = Wine ahead. Surge only
  // (RE never sees either option), null when not applicable. This is a
  // "what should I eat" comparison, not the contribution table's Raid
  // Captain row, so it still weighs Mana Food's own stat/Bleed edge
  // (manaFoodGain) alongside the Move Speed difference.
  function raidCaptainWineVsManaFood(engrInputs, inputs) {
    if (engrInputs.spec !== "surge") return null;
    const rcBase = (RAID_CAPTAIN_TABLE[engrInputs.rcLevel] || 0) + (RAID_CAPTAIN_STONE_TABLE[engravingStoneLevel("rc", engrInputs)] || 0);
    const wineFrac = raidCaptainMoveSpeedFraction(Object.assign({}, engrInputs, { wine: true, manaFood: false }), inputs.yearning);
    const foodFrac = raidCaptainMoveSpeedFraction(Object.assign({}, engrInputs, { wine: false, manaFood: true }), inputs.yearning);
    const wineMult = 1 + rcBase * wineFrac;
    const foodMult = (1 + rcBase * foodFrac) * (1 + manaFoodGain(inputs, engrInputs.manaFoodAmount, manaFoodBleedApplies(engrInputs, inputs)));
    return foodMult / wineMult - 1;
  }

  // ----- Attack Speed (not tracked) -----
  // No Attack Speed readout exists: it never fed into any DPS number on the
  // page. Mass Increase (-10% Attack Speed drawback, unmodeled in the DPS
  // search - see the page banner) is the only engraving here where Attack
  // Speed would matter, and it is Surge-only: RE never runs Mass Increase, so
  // RE has no use for such a readout at all.

  // Resolves which Ability Stone level (if any) applies to a given
  // engraving key within the Engraving Comparison section only - either of
  // the section's 2 isolated stone slots (see readEngravingInputs), or
  // "0 Lv." (no stone) otherwise. Deliberately never falls back to the
  // live tracked Ability Stone selects (Adrenaline/KBW) - this section is
  // a self-contained sandbox, so its own math only ever reads its own
  // isolated fields, never the real tracked ones above.
  function engravingStoneLevel(key, engrInputs) {
    if (engrInputs.stone1Target === key) return engrInputs.stone1Level;
    if (engrInputs.stone2Target === key) return engrInputs.stone2Level;
    return "0 Lv.";
  }

  // Each of these 5 engravings' own contribution is a flat, independent
  // multiplicative layer with nothing else on the page - so unlike a Crit
  // Rate/Dmg candidate (which has to be run back through the full
  // effCrit/keystone formula), its own isolated "fraction of DPS you'd
  // lose without it" IS exactly its own raw fraction with no approximation
  // and no dependency on what else is active: mult = M*(1+g) vs M, ratio =
  // (1+g), gain = g. Ambush Master and Raid Captain just fold multiple
  // sources (BackDmg+secondary+stone, or level+stone scaled by Move Speed)
  // into that one flat fraction before returning it.
  function grudgeGain(engrInputs) {
    return (GRUDGE_TABLE[engrInputs.grudgeLevel] || 0) + (GRUDGE_STONE_TABLE[engravingStoneLevel("grudge", engrInputs)] || 0);
  }
  function cursedDollGain(engrInputs) {
    return (CURSED_DOLL_TABLE[engrInputs.cdLevel] || 0) + (CURSED_DOLL_STONE_TABLE[engravingStoneLevel("cd", engrInputs)] || 0);
  }
  function massIncreaseGain(engrInputs) {
    return (MASS_INCREASE_TABLE[engrInputs.miLevel] || 0) + (MASS_INCREASE_STONE_TABLE[engravingStoneLevel("mi", engrInputs)] || 0);
  }
  function ambushMasterGain(engrInputs, inputs) {
    // Matches the sheet's own formula shape: the flat BackDmg half and the
    // book-level Dmg% half (+ its Ability Stone, same "Dmg" bucket) are two
    // separate multiplicative layers - (1+backDmg)*(1+secondary+stone)-1 -
    // not a straight sum. Sheet reference: Engr+Stone!C7 =
    // (1+IF(ASS,backSkillShare,1)*FA/BA*H7)*(1+T7)-1; H7/T7 are this row's
    // BackDmg (0.15) and Type2 Dmg (0.048-0.076) columns respectively.
    const backShare = effectiveBackAttackShare(inputs);
    const backDmg = AMBUSH_MASTER_BACK_DMG * backShare;
    const dmgBucket = (AMBUSH_MASTER_SECONDARY_TABLE[engrInputs.ambushLevel] || 0)
      + (AMBUSH_MASTER_STONE_TABLE[engravingStoneLevel("ambush", engrInputs)] || 0);
    return (1 + backDmg) * (1 + dmgBucket) - 1;
  }
  function raidCaptainGain(engrInputs, inputs) {
    const frac = raidCaptainMoveSpeedFraction(engrInputs, inputs.yearning);
    const base = (RAID_CAPTAIN_TABLE[engrInputs.rcLevel] || 0) + (RAID_CAPTAIN_STONE_TABLE[engravingStoneLevel("rc", engrInputs)] || 0);
    return base * frac;
  }

  // Adrenaline's isolated contribution, combining BOTH multiplicative axes
  // it actually feeds: the Crit Rate side (inside combinedMultiplier, via
  // critRateTotal) and the Attack Power % side (inside gearApTotal, via
  // gearAttackPowerPercentTotal -> adrenalineApFraction) - see
  // computeSingleBracelet's own totalMult for the same "grid ratio * AP
  // ratio" combination pattern this mirrors. The AP side only turns on
  // once Gearing's Weapon Power/Main Stat are actually filled in
  // (gearApTotal's usual gate) - a silent no-op (ratio 1) otherwise, same
  // convention as every other AP-based candidate on the page.
  //
  // Base AP%'s own Ability Stone checkbox (.ap-gear-ability-stone-base-ap,
  // "a 9/7, 10/6, or better roll") is deliberately NOT read here - this
  // section already models exactly which 2 engravings hold your ability
  // stone and at what level via its own isolated stone slots, so reusing
  // the checkbox's generic assumption on top would double up. Instead,
  // this recreates the game's own actual rule: 5+ total Ability Stone
  // nodes across both stones (Lv. IS the node count for that slot, 0 if
  // its Stone Slot isn't assigned to a real engraving) grants the same
  // flat +1.5% the checkbox would, added the same "additive to Gem Base
  // AP%" way this page already does it. See abilityStoneBaseApGain right
  // below for where that actually turns into a DPS number - this
  // function is purely the yes/no threshold check.
  function engravingStoneImpliesBaseAp(engrInputs) {
    const nodes = (target, level) => (target === "None" ? 0 : parseInt(level, 10) || 0);
    const total = nodes(engrInputs.stone1Target, engrInputs.stone1Level) + nodes(engrInputs.stone2Target, engrInputs.stone2Level);
    return total >= 5;
  }

  // The actual DPS contribution of that +1.5% Base AP - a real "with it
  // vs without it" AP ratio, using the exact same gearApTotal/
  // supportApBuff formula every other AP-based row on this page already
  // uses. NOT a wash the way the same bonus is inside
  // adrenalineContributionGain: that row compares Adrenaline on vs off
  // with the SAME baseApMult on both sides (so the bonus cancels out of
  // that ratio on purpose); this row's whole point IS the presence of
  // the bonus itself, so it stays in the numerator only. Gated on Weapon
  // Power/Main Stat being filled in, same convention as every other
  // AP-based candidate on the page.
  function abilityStoneBaseApGain(inputs, engrInputs) {
    const wp = inputs.gearWp;
    const mainStat = inputs.gearMainStat;
    if (!(wp > 0 && mainStat > 0)) return 0;
    if (!engravingStoneImpliesBaseAp(engrInputs)) return 0;
    const flatAp = inputs.gearFlatAp + gearChaosStarFlat(inputs.gearApChaosStar);
    const percentApMult = 1 + gearAttackPowerPercentTotal(inputs) / 100;
    const withMult = 1 + (inputs.gearGemBaseAp + ABILITY_STONE_BASE_AP_BONUS) / 100;
    const withoutMult = 1 + inputs.gearGemBaseAp / 100;
    const withAp = gearApTotal(wp, mainStat, withMult, flatAp, percentApMult, supportApBuff(inputs, wp, mainStat, withMult));
    const withoutAp = gearApTotal(wp, mainStat, withoutMult, flatAp, percentApMult, supportApBuff(inputs, wp, mainStat, withoutMult));
    if (withoutAp <= 0) return 0;
    return withAp / withoutAp - 1;
  }

  // Adrenaline's realized grid-side gain: the same re-optimized with/without
  // search kbwRealizedGainPct uses for KBW (see that function's own
  // comment for the confirmed live example of why this matters), applied
  // to Adrenaline instead. Adrenaline's Crit Rate value feeds into
  // critRateTotal -> effCrit (see computeShared), which is part of the
  // 9-cell keystone+split grid formula itself, so removing it can flip
  // which cell wins - exactly the same failure mode a fixed-cell ratio has
  // for KBW. A fixed-cell combinedMultiplier ratio (holding one
  // caller-supplied cell fixed on both the "with" and "without" side)
  // would silently assume that cell stays optimal either way - not
  // reliably true, for the same reason it isn't for KBW.
  // Returns a plain ratio (not a %), since adrenalineContributionGain below
  // still needs to multiply it against the AP-side ratio before converting
  // to a final gain. Returns the neutral ratio 1 when Adrenaline isn't
  // equipped, so multiplying it in is always a safe no-op.
  function adrenalineGridRatio(candidateInputs) {
    if (candidateInputs.adrenaline === "Not Used") return 1;
    const withBest = bestComboFor(candidateInputs);
    if (!withBest || withBest.mult <= 0) return 1;
    const withoutInputs = Object.assign({}, candidateInputs, { adrenaline: "Not Used", adrenalineStone: "0 Lv." });
    const withoutBest = bestComboFor(withoutInputs);
    if (!withoutBest || withoutBest.mult <= 0) return 1;
    return withBest.mult / withoutBest.mult;
  }

  function adrenalineContributionGain(inputs, engrInputs) {
    // "full" reuses `inputs` for everything EXCEPT adrenaline/adrenalineStone,
    // which are overridden with this section's own isolated Node level (see
    // readEngravingInputs) and isolated Stone slot (engravingStoneLevel) -
    // never the live tracked Ark Passive value, so tweaking Adrenaline's
    // level here can't drift from what's actually equipped above. The
    // caller passes engravingIsolatedGridInputs' isolatedInputs here
    // (not the raw top-level inputs), so kbw/kbwStone riding along in
    // `inputs` are ALSO already this section's own isolated selections -
    // otherwise Adrenaline's gridRatio below (which depends on
    // shared.critDmgTotal, and KBW folds a flat add into that) would still
    // silently track the live Ark Passive section's KBW state (see
    // engravingIsolatedGridInputs' own comment for that failure mode).
    const full = Object.assign({}, inputs, {
      adrenaline: engrInputs.adrenalineLevel,
      adrenalineStone: engravingStoneLevel("adrenaline", engrInputs),
    });
    const gridRatio = adrenalineGridRatio(full);

    let apRatio = 1;
    const wp = full.gearWp;
    const mainStat = full.gearMainStat;
    if (wp > 0 && mainStat > 0) {
      const off = Object.assign({}, full, { adrenaline: "Not Used", adrenalineStone: "0 Lv." });
      const baseApBonus = engravingStoneImpliesBaseAp(engrInputs) ? ABILITY_STONE_BASE_AP_BONUS : 0;
      const baseApMult = 1 + (full.gearGemBaseAp + baseApBonus) / 100;
      const flatAp = full.gearFlatAp + gearChaosStarFlat(full.gearApChaosStar);
      const onPctMult = 1 + gearAttackPowerPercentTotal(full) / 100;
      const offPctMult = 1 + gearAttackPowerPercentTotal(off) / 100;
      const supApBuff = supportApBuff(full, wp, mainStat, baseApMult);
      const fullAp = gearApTotal(wp, mainStat, baseApMult, flatAp, onPctMult, supApBuff);
      const baseAp = gearApTotal(wp, mainStat, baseApMult, flatAp, offPctMult, supApBuff);
      if (baseAp > 0) apRatio = fullAp / baseAp;
    }
    return gridRatio * apRatio - 1;
  }

  // Isolated DPS gain from JUST the Adrenaline Ability Stone at one
  // specific level, holding the engraving's own Node level fixed (used by
  // the stone breakdown columns to preview all 4 tiers, not only whichever
  // one is actually slotted). Unlike the full on/off comparison above,
  // this never touches gridRatio - the stone only ever feeds the AP axis
  // (adrenalineApFraction, via gearAttackPowerPercentTotal), never
  // critRateTotal, so the crit-rate/keystone side of the multiplier is
  // identical whether the stone is slotted or not and cancels out of the
  // ratio entirely. That leaves a pure "AP with this stone vs AP with no
  // stone" comparison, same gearApTotal shape adrenalineContributionGain's
  // own apRatio block already uses.
  function adrenalineStoneMarginalGain(inputs, engrInputs, stoneLevel) {
    if (engrInputs.adrenalineLevel === "Not Used") return 0;
    const wp = inputs.gearWp;
    const mainStat = inputs.gearMainStat;
    if (!(wp > 0 && mainStat > 0)) return 0;
    const baseApBonus = engravingStoneImpliesBaseAp(engrInputs) ? ABILITY_STONE_BASE_AP_BONUS : 0;
    const baseApMult = 1 + (inputs.gearGemBaseAp + baseApBonus) / 100;
    const flatAp = inputs.gearFlatAp + gearChaosStarFlat(inputs.gearApChaosStar);
    const off = Object.assign({}, inputs, { adrenaline: engrInputs.adrenalineLevel, adrenalineStone: "0 Lv." });
    const on = Object.assign({}, inputs, { adrenaline: engrInputs.adrenalineLevel, adrenalineStone: stoneLevel });
    const onPctMult = 1 + gearAttackPowerPercentTotal(on) / 100;
    const offPctMult = 1 + gearAttackPowerPercentTotal(off) / 100;
    const supApBuff = supportApBuff(inputs, wp, mainStat, baseApMult);
    const onAp = gearApTotal(wp, mainStat, baseApMult, flatAp, onPctMult, supApBuff);
    const offAp = gearApTotal(wp, mainStat, baseApMult, flatAp, offPctMult, supApBuff);
    if (offAp <= 0) return 0;
    return onAp / offAp - 1;
  }

  // Builds the candidateInputs clone bestComboFor() searches for one
  // competing-pool combination. Both Adrenaline and Keen Blunt Weapon's
  // Node level are overridden from this section's own isolated selectors
  // (never the live tracked value - see readEngravingInputs) so the
  // keystone/split search this section runs always reflects what's
  // actually configured here. Keen Blunt Weapon is further zeroed to
  // "Not Used" (its own existing off-state) whenever this candidate's pool
  // doesn't include it - exactly like zeroedBraceletInputs zeroes a
  // bracelet's own tracked fields - so the two mutually exclusive slot
  // options never double-count. Either engraving's Ability Stone level is
  // likewise this section's own isolated value (0 Lv. unless one of the 2
  // stone slots targets it), never the live tracked Stone select.
  function engravingCandidateInputs(inputs, engrInputs, flags) {
    const cloned = Object.assign({}, inputs);
    cloned.adrenaline = engrInputs.adrenalineLevel;
    cloned.adrenalineStone = engravingStoneLevel("adrenaline", engrInputs);
    // Deliberately NOT setting cloned.gearAbilityStoneBaseAp here -
    // bestComboFor(candidateInputs) below only ever calls
    // combinedMultiplier, which never reads that field (it's a Crit
    // Rate/Crit Dmg/keystone-grid ratio, not an AP one), so setting it
    // would be silent dead weight. The section's own AP bonus is applied
    // for real in engravingCandidateMultiplier via abilityStoneBaseApGain
    // instead, which is what actually touches the totalMult these
    // candidates get ranked and compared on.
    if (!flags.includeKbw) {
      cloned.kbw = "Not Used";
      cloned.kbwStone = "0 Lv.";
    } else {
      cloned.kbw = engrInputs.kbwLevel;
      cloned.kbwStone = engravingStoneLevel("kbw", engrInputs);
    }
    return cloned;
  }

  // Keen Blunt Weapon's -2% EV malus does NOT get layered in here. It's
  // applied at the root, inside combinedMultiplier itself, gated on
  // inputs.kbw being active (see that function's own comment) - and
  // bestComboFor(candidateInputs) above already runs
  // candidateInputs (which engravingCandidateInputs sets .kbw on whenever
  // flags.includeKbw is true) through combinedMultiplier. So combo.mult
  // already comes back with the malus baked in whenever this candidate
  // includes Keen Blunt Weapon. Multiplying it in again here would double
  // it (0.98*0.98 instead of 0.98) - this function only ever needs to
  // layer the 4 genuinely flat, malus-free engravings (Grudge and Ambush
  // Master are always-on, Raid Captain/Cursed Doll/Mass Increase are
  // flag-gated).
  //
  // Mana Food's own Main-Stat+Bleed contribution (manaFoodContributionGain)
  // deliberately does NOT belong here either, for the same reason the
  // 0.85 party-synergy scalar is absent from combinedMultiplier (see
  // that function's own comment): it's a flat bonus applied identically
  // regardless of which 2 engravings are in flags, so multiplying every
  // candidate (and "neither") by the same factor cancels out of every
  // ratio this page actually shows (vsNeither, aVsB, winner/runnerUp) and
  // never changes sort order - it would be silent dead weight.
  // Food's only REAL lever on any of these numbers is Raid Captain's own
  // Move Speed conversion (raidCaptainGain, via raidCaptainMoveSpeedFraction
  // reading engrInputs.wine/manaFood/rageRune) - which already applies
  // correctly whenever flags.includeRC is true, with no help needed here.
  // That's also why toggling food only moves "wins by"/"vs No Setup" when
  // Raid Captain is one of the 2 slots being compared (and asymmetric
  // between the two sides) - confirmed live: Setup A (Raid Captain + Keen
  // Blunt Weapon) with Wine read +0.93% over Setup B (no Raid Captain);
  // switching Setup A to Mana Food dropped that to +0.42%, while Setup B's
  // own "vs No Setup" didn't move at all, since Mana Food's own damage
  // never touches this function - only RC's Move Speed swing does.
  //
  // abilityStoneBaseApGain is a different case from Mana Food despite
  // also reading off `engrInputs`: Mana Food lives on the shared `base`
  // object every side of a comparison starts from (constant across
  // neither/Setup A/Setup B, so multiplying it in would be dead weight -
  // see above), but stone1/2Target/Level get overridden PER SIDE by
  // engravingSvsMergedInputs and zeroed entirely for "neither" by
  // computeEngravingSetupComparison's bareBase. So whether this bonus
  // applies can genuinely differ between neither/Setup A/Setup B (exactly
  // the 5-vs-4-node case that motivated adding it), and it has to be
  // multiplied in here for that asymmetry to actually reach
  // vsNeither/aVsB. For the plain Best Combo/Runner-Up search below,
  // where engrInputs.stone1/2 are shared and unchanging across every
  // candidateFlagSets entry, it's a wash on the ranking (same as Mana
  // Food would be there) but still lands correctly in each candidate's
  // own totalMult - which is what the "Ability Stone Base AP" row in
  // computeEngravingComparison's own `rows` reads back out.
  // Adrenaline's own Ability Stone needs its own term in this function:
  // unlike Grudge/Ambush/RC/CD/MI's stones (which bump their
  // engraving's flat Dmg% Node value - a genuine flatMult layer) and
  // Keen Blunt Weapon's stone (which bumps the crit grid - handled
  // separately via nodeGridRatio/stoneGridRatio in
  // engravingCandidateBreakdown below), Adrenaline's Stone only ever adds
  // AP (ADRENALINE_STONE_AP_TABLE, via adrenalineApFraction ->
  // gearAttackPowerPercentTotal) - a THIRD axis, so without its own term
  // slotting a stone into Adrenaline would silently change nothing
  // anywhere in this section. adrenalineStoneMarginalGain does exactly
  // this on/off AP ratio for the stone-preview table (see its own
  // comment) - it's reused here with whichever stone is
  // actually assigned (engravingStoneLevel, "0 Lv." i.e. a no-op gain if
  // neither slot targets Adrenaline) plugs the same math into the real
  // totalMult candidates are ranked and compared on. It lands in
  // "Ability Stone Engraving Bonus" downstream for free: nodeOnlyFlatMult
  // below reruns this same function with both stone slots forced to
  // "None", so the gain is 0 there (Adrenaline's own Node level always
  // stays put - only the Stone marginal moves), leaving the full/node-only
  // ratio to isolate exactly the stone's contribution like every other
  // engraving's stone does.
  function engravingCandidateMultiplier(engrInputs, inputs, flags) {
    let mult = 1;
    mult *= 1 + grudgeGain(engrInputs, inputs);
    mult *= 1 + ambushMasterGain(engrInputs, inputs);
    mult *= 1 + abilityStoneBaseApGain(inputs, engrInputs);
    mult *= 1 + adrenalineStoneMarginalGain(inputs, engrInputs, engravingStoneLevel("adrenaline", engrInputs));
    if (flags.includeRC) mult *= 1 + raidCaptainGain(engrInputs, inputs);
    if (flags.includeCD) mult *= 1 + cursedDollGain(engrInputs, inputs);
    if (flags.includeMI) mult *= 1 + massIncreaseGain(engrInputs, inputs);
    return mult;
  }

  // Splits a candidate's totalMult into the 3 sources that actually feed
  // it, the same "headline number, then here's what it's made of" shape
  // computeBraceletComparison's Keystone/Crit+Spec+Other+WP/AP breakdown
  // already gives Bracelet vs. Bracelet - Best Combo/Runner-Up and Setup
  // A/B would otherwise surface only the single vsRunnerUp/vsNeither/
  // stoneApGain numbers, with no way to tell how much of that total was
  // the engravings' own Node levels vs. the Ability Stone's marginal bump
  // to those same Nodes vs. the Stone's separate flat AP layer.
  //
  // There is no 4th "Keystone/Crit" row (unlike Bracelet vs. Bracelet's
  // grid ratio row): Keen Blunt Weapon and Adrenaline both feed the crit
  // grid (bestComboFor) rather than flatMult, so a naive
  // combo.mult/neither.combo.mult ratio would sweep BOTH of their Node
  // and Ability Stone contributions into that one generic bucket instead
  // of "Engraving Bonus"/"Ability Stone Engraving Bonus" - the exact
  // miscategorization this function avoids. Once KBW/Adrenaline's own grid contribution is pulled out
  // (nodeGridRatio/stoneGridRatio below) and folded into the same 2
  // buckets the flat-layer engravings already use, nothing is left that
  // varies the crit grid on this page - a standalone "Keystone/Crit"
  // residual would read 0.00% on every candidate, always. The grid ratio
  // telescopes cleanly regardless (gNodeOnly/G0 * gFull/gNodeOnly =
  // gFull/G0 is exact algebra, not an approximation - see the `neither`
  // block below), so nothing is lost by omitting it.
  //
  // "Engraving Bonus" and the grid's own node-only ratio are BOTH taken
  // relative to the `neither` baseline (no competing engraving, no Stone
  // in either slot - same bareBase computeEngravingSetupComparison
  // already builds), not as this candidate's own raw nodeOnlyMult/grid
  // value - those raw numbers are the WHOLE gear/grid multiplier stack
  // (several hundred percent), so showing them bare would dwarf every
  // other row. Dividing by `neither`'s own flatMult/combo.mult first
  // (same normalization renderBvbCard's gridRatio already applies via
  // combo.mult/noBraceletMult) leaves only the part that actually varies
  // with this candidate's own flags/stone - a small number in the same
  // range as the other row, and the 3 rows together multiply back out to
  // this candidate's true vsNeither ratio exactly (see the algebra in
  // this function's own derivation, checked against renderEngravingSvsCard's
  // Setup A/B live readout: Setup A/B and Best Combo/Runner-Up both
  // reconstruct their headline % from these 3 rows with no leftover).
  // `neither` is undefined only when this IS the neither candidate being
  // built (see computeEngravingComparison/computeEngravingSetupComparison
  // below) - its own breakdown is never read, so the ratio=1 fallback
  // below is harmless.
  //
  // "Engraving Bonus" (nodeOnlyMult) reruns engravingCandidateMultiplier
  // with both isolated Stone slots zeroed - same technique `neither`
  // itself is built with - which incidentally also zeroes
  // abilityStoneBaseApGain for free (it requires 5+ combined Stone nodes,
  // impossible with both slots at "None"), so nodeOnlyMult is a clean
  // Node-only multiplier with nothing else riding along in it, and
  // `neither`'s own flatMult IS its nodeOnlyMult already for the exact
  // same reason - no separate lookup needed for the denominator. The
  // grid's own node-only value (gNodeOnly, KBW/Adrenaline Node level with
  // both Stones forced to "0 Lv.") gets the same "vs. neither's own grid
  // value" ratio treatment, then multiplies into this same bucket.
  //
  // "Ability Stone Engraving Bonus" isolates just the marginal lift those
  // same engravings get from their Stone slot on top of their own Node
  // level (flatMult with the separate Base AP layer divided back out,
  // over that Node-only baseline) - NOT the Stone's flat Base AP bonus,
  // which is its own row right after it and would otherwise be silently
  // double-counted into this one. The grid side's own Stone marginal
  // (gFull/gNodeOnly, KBW/Adrenaline's actual Stone level vs. their own
  // Node-only baseline) multiplies into this same bucket - both are
  // already genuine with/without-stone marginals on their own terms, so
  // neither needs the `neither`-relative treatment the Engraving Bonus
  // row above does.
  function engravingCandidateBreakdown(candidateInputs, engrInputs, flags, combo, flatMult, neither) {
    const stoneBaseApMult = 1 + abilityStoneBaseApGain(candidateInputs, engrInputs);
    const nodeOnlyEngrInputs = Object.assign({}, engrInputs, {
      stone1Target: "None", stone1Level: "0 Lv.",
      stone2Target: "None", stone2Level: "0 Lv.",
    });
    const nodeOnlyFlatMult = engravingCandidateMultiplier(nodeOnlyEngrInputs, candidateInputs, flags);
    const stoneEngravingFlatMult = (flatMult / stoneBaseApMult) / nodeOnlyFlatMult;

    // Keen Blunt Weapon and Adrenaline's own Node/Stone split, done on the
    // grid itself (bestComboFor) rather than a closed-form gain function -
    // holding every other grid input (gear crit stats, the other one of
    // this pair) fixed and only swapping kbwStone/adrenalineStone to "0
    // Lv." isolates exactly their own Stone's marginal, the same "hold
    // everything else fixed, swap one thing" approach flatBucketStoneMarginal
    // above uses for the other 5 engravings' stone columns.
    let nodeGridRatio = 1;
    let stoneGridRatio = 1;
    if (neither) {
      const nodeOnlyGridInputs = Object.assign({}, candidateInputs, {
        kbwStone: "0 Lv.",
        adrenalineStone: "0 Lv.",
      });
      const gNodeOnly = bestComboFor(nodeOnlyGridInputs).mult;
      nodeGridRatio = gNodeOnly / neither.combo.mult;
      stoneGridRatio = combo.mult / gNodeOnly;
    }

    const engravingRatio = neither ? nodeGridRatio * (nodeOnlyFlatMult / neither.flatMult) : 1;
    const stoneEngravingRatio = stoneGridRatio * stoneEngravingFlatMult;
    return {
      engravingGain: engravingRatio - 1,
      stoneEngravingGain: stoneEngravingRatio - 1,
      stoneBaseApGain: stoneBaseApMult - 1,
    };
  }

  // `neither` is only passed once a real baseline candidate exists (see
  // above) - omit it when computing that baseline candidate itself.
  function computeEngravingCandidate(inputs, engrInputs, flags, neither) {
    const candidateInputs = engravingCandidateInputs(inputs, engrInputs, flags);
    const combo = bestComboFor(candidateInputs);
    const flatMult = engravingCandidateMultiplier(engrInputs, candidateInputs, flags);
    const breakdown = engravingCandidateBreakdown(candidateInputs, engrInputs, flags, combo, flatMult, neither);
    return { flags, combo, flatMult, totalMult: combo.mult * flatMult, breakdown };
  }

  function engravingComboLabel(flags) {
    const parts = [];
    if (flags.includeRC) parts.push("Raid Captain");
    if (flags.includeKbw) parts.push("Keen Blunt Weapon");
    if (flags.includeCD) parts.push("Cursed Doll");
    if (flags.includeMI) parts.push("Mass Increase");
    return parts.join(" + ") || "(none)";
  }

  // readInputs() above stays untouched by this section on purpose - every
  // field read here is either isolated (no id, so nothing new gets saved/
  // exported - see the HTML) or already covered live via `inputs` itself
  // (backAttackRate, yearning, adrenaline*, kbw*).
  function readEngravingInputs(root) {
    const manaFoodMainOnly = isSurgeBleedFoodBuild(root) && getCheckbox(root, ".ap-engr-manafood-main", false);
    return {
      // Derived from the master Build toggle (see isSurgeBuild) - Playstyle
      // is not its own control here, it just echoes RE vs Surge from
      // whichever 6-way build is currently selected up top.
      spec: isSurgeBuild(root) ? "surge" : "re",
      grudgeLevel: getSelect(root, ".ap-engr-grudge-level", "4 Nodes"),
      ambushLevel: getSelect(root, ".ap-engr-ambush-level", "4 Nodes"),
      adrenalineLevel: getSelect(root, ".ap-engr-adrenaline-level", "4 Nodes"),
      kbwLevel: getSelect(root, ".ap-engr-kbw-level", "4 Nodes"),
      rcLevel: getSelect(root, ".ap-engr-rc-level", "4 Nodes"),
      cdLevel: getSelect(root, ".ap-engr-cd-level", "4 Nodes"),
      miLevel: getSelect(root, ".ap-engr-mi-level", "4 Nodes"),
      miOptIn: getCheckbox(root, ".ap-engr-mi-optin", true),
      maelstromUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-engr-maelstrom-uptime", 85))),
      rageRune: getCheckbox(root, ".ap-engr-rage-rune", true),
      supportAv: getCheckbox(root, ".ap-engr-support-av", false),
      // Mutually exclusive with supportAv above - see the
      // supportMoveSpeed group in EXCLUSIVE_GROUPS, enforced the same way
      // as Wine/Mana Food's own exclusivity just below.
      supportPaladin: getCheckbox(root, ".ap-engr-support-paladin", false),
      wine: getCheckbox(root, ".ap-engr-wine", true),
      // manaFood means "some Mana Food is eaten" (either box below);
      // manaFoodMainOnly says which one, and only counts on Surge 111/333.
      manaFood: getCheckbox(root, ".ap-engr-manafood", false) || manaFoodMainOnly,
      manaFoodMainOnly,
      manaFoodAmount: getNumber(root, ".ap-engr-manafood-amount", 6000),
      stone1Target: getSelect(root, ".ap-engr-stone1-target", "None"),
      stone1Level: getSelect(root, ".ap-engr-stone1-level", "0 Lv."),
      stone2Target: getSelect(root, ".ap-engr-stone2-target", "None"),
      stone2Level: getSelect(root, ".ap-engr-stone2-level", "0 Lv."),
    };
  }

  // ----- Setup A vs. Setup B -----
  // A named-setup counterpart to the search above: instead of "what's the
  // best 2-engraving combo", this answers "exactly how much better is
  // THIS specific ability-stone-and-competing-pool loadout than THAT
  // one" - same relationship computeBraceletVsBracelet has to
  // computeBraceletComparison above it (one search-for-the-best-row tool,
  // one name-two-specific-configs-and-compare tool, sharing the same
  // underlying math). Grudge/Ambush/Adrenaline and the whole Move/Attack
  // Speed block stay shared from the isolated inputs above (the same
  // `base` engrInputs both sides start from) - only which 2 competing
  // engravings are equipped, their Node levels, and where each side's own
  // 2 Ability Stones sit are actually being compared, so those are the
  // only fields each side overrides.
  //
  // readEngravingSvsSide reads one side's raw form state; the values
  // still need folding into a real { includeRC/Kbw/CD/MI } flag set and
  // rcLevel/kbwLevel/cdLevel/miLevel before they mean anything to
  // engravingCandidateMultiplier/engravingCandidateInputs - that's
  // engravingSvsMergedInputs' job, kept separate so a caller building the
  // "neither" baseline can skip straight to a flags-all-off merge without
  // needing a fake side object.
  function readEngravingSvsSide(root, prefix) {
    const base = ".ap-esvs-" + prefix + "-";
    return {
      slot1: getSelect(root, base + "slot1-type", "none"),
      slot1Level: getSelect(root, base + "slot1-level", "4 Nodes"),
      slot2: getSelect(root, base + "slot2-type", "none"),
      slot2Level: getSelect(root, base + "slot2-level", "4 Nodes"),
      stone1Target: getSelect(root, base + "stone1-target", "None"),
      stone1Level: getSelect(root, base + "stone1-level", "0 Lv."),
      stone2Target: getSelect(root, base + "stone2-target", "None"),
      stone2Level: getSelect(root, base + "stone2-level", "0 Lv."),
    };
  }

  // Folds one Setup A/B side into a { rcLevel, kbwLevel, cdLevel, miLevel,
  // stone1Target, stone1Level, stone2Target, stone2Level } clone of the
  // shared `base` engrInputs, plus the { includeRC/Kbw/CD/MI } flags that
  // same shape needs elsewhere on the page - a slot equal to "none" on
  // both sides just means that engraving's flag stays off; the shared
  // base's own rcLevel/kbwLevel/cdLevel/miLevel underneath never actually
  // gets read in that case since the flag gates it out entirely (see
  // engravingCandidateMultiplier), so leaving them untouched there is
  // harmless.
  function engravingSvsMergedInputs(base, side) {
    const merged = Object.assign({}, base, {
      stone1Target: side.stone1Target,
      stone1Level: side.stone1Level,
      stone2Target: side.stone2Target,
      stone2Level: side.stone2Level,
    });
    const flags = { includeRC: false, includeKbw: false, includeCD: false, includeMI: false };
    [
      { slot: side.slot1, level: side.slot1Level },
      { slot: side.slot2, level: side.slot2Level },
    ].forEach((entry) => {
      if (entry.slot === "rc") { flags.includeRC = true; merged.rcLevel = entry.level; }
      if (entry.slot === "kbw") { flags.includeKbw = true; merged.kbwLevel = entry.level; }
      if (entry.slot === "cd") { flags.includeCD = true; merged.cdLevel = entry.level; }
      if (entry.slot === "mi") { flags.includeMI = true; merged.miLevel = entry.level; }
    });
    return { merged, flags };
  }

  // One side's full result: reuses computeEngravingCandidate exactly as
  // the best-combo search above does (see that function's own comment) -
  // a named setup and a searched candidate are the same computation, just
  // fed a hand-picked flag set instead of one generated by the pool loop.
  // Also carries the merged engrInputs back out (as .merged) so
  // computeEngravingSetupComparison can read this side's own isolated
  // stone status back off it for the Ability Stone AP breakout below,
  // without needing to re-run engravingSvsMergedInputs a second time.
  function computeEngravingSetup(inputs, base, side, neither) {
    const { merged, flags } = engravingSvsMergedInputs(base, side);
    const candidate = computeEngravingCandidate(inputs, merged, flags, neither);
    candidate.merged = merged;
    return candidate;
  }

  function computeEngravingSetupComparison(inputs, base, svsA, svsB) {
    // "Neither" zeroes exactly the two things this comparison varies -
    // no competing engraving equipped, no Ability Stone socketed into
    // either slot - same "isolate exactly what's under test, zero
    // everything else" precedent computeBraceletVsBracelet's own
    // zeroedBraceletInputs sets for "no bracelet at all". Grudge/Ambush/
    // Adrenaline and Raid Captain Variables stay live from `base` since they
    // aren't part of what Setup A/B are varying.
    const bareBase = Object.assign({}, base, {
      stone1Target: "None", stone1Level: "0 Lv.",
      stone2Target: "None", stone2Level: "0 Lv.",
    });
    const neither = computeEngravingCandidate(inputs, bareBase, {
      includeRC: false, includeKbw: false, includeCD: false, includeMI: false,
    });
    const a = computeEngravingSetup(inputs, base, svsA, neither);
    const b = computeEngravingSetup(inputs, base, svsB, neither);
    // Isolated per-side "how much of vsNeither is just the Ability Stone
    // AP bonus" readout - the reader-facing explanation for why one side
    // can win even when its own engraving/stone-table rows above look
    // identical (or worse) than the other's: this is the piece that
    // wasn't visible anywhere before, despite feeding directly into
    // vsNeither/aVsB via engravingCandidateMultiplier.
    const sideResult = (r) => ({
      vsNeither: r.totalMult / neither.totalMult - 1,
      stoneApGain: abilityStoneBaseApGain(inputs, r.merged),
      keystoneLabel: KEYSTONE_LABELS[r.combo.pair],
      splitLabel: r.combo.split.label,
      comboKey: r.combo.pair + "|" + r.combo.split.key,
      // breakdown already carries its own stoneBaseApGain (computed the
      // same way, off r.merged via computeEngravingCandidate) - the
      // standalone stoneApGain field above predates it and stays for the
      // existing renderEngravingSvsCard callers, kept in sync since both
      // ultimately call the same abilityStoneBaseApGain helper.
      breakdown: r.breakdown,
    });
    return {
      neither: { keystoneLabel: KEYSTONE_LABELS[neither.combo.pair], splitLabel: neither.combo.split.label },
      a: sideResult(a),
      b: sideResult(b),
      aVsB: a.totalMult / b.totalMult - 1,
      keystonesDiffer: a.combo.pair + "|" + a.combo.split.key !== b.combo.pair + "|" + b.combo.split.key,
    };
  }

  // Overall Best (Setup A vs. Setup B edition) - same gap
  // computeOverallBestEngravingSetup fills for Best Combo/Runner-Up,
  // applied here instead: aVsB above locks BOTH sides to whichever food
  // is currently selected, but Setup A/B is exactly the case where that
  // can mislead - a side with Raid Captain is the only one Wine ever
  // does anything for (see raidCaptainMoveSpeed, the only place
  // engrInputs.wine is even read), so a non-RC side gets literally zero
  // benefit from Wine in this model and should always prefer Mana Food's
  // free stat+Bleed instead. That means the CURRENT aVsB gap (or even
  // its winner) can be an artifact of a shared food choice that isn't
  // actually optimal for one or both named setups, not a real reflection
  // of which setup is better. This reruns computeEngravingSetup for both
  // sides under both food scenarios (reusing the same `neither` baseline,
  // which is food-independent since it never includes Raid Captain -
  // see computeEngravingCandidate/`neither` above), folds in each
  // scenario's own manaFoodContributionGain the same way
  // computeOverallBestEngravingSetup does, and picks the best of all 4
  // (Setup A/B x Wine/Mana Food) combinations. Surge only, same gate as
  // computeOverallBestEngravingSetup.
  function computeOverallBestEngravingSetupAB(inputs, base, svsA, svsB) {
    if (base.spec !== "surge") return null;
    const bareBase = Object.assign({}, base, {
      stone1Target: "None", stone1Level: "0 Lv.",
      stone2Target: "None", stone2Level: "0 Lv.",
    });
    const neither = computeEngravingCandidate(inputs, bareBase, {
      includeRC: false, includeKbw: false, includeCD: false, includeMI: false,
    });
    function scenario(label, side, wine, manaFood) {
      const scenarioBase = Object.assign({}, base, { wine, manaFood });
      const r = computeEngravingSetup(inputs, scenarioBase, side, neither);
      const foodGain = manaFoodContributionGain(scenarioBase, inputs);
      return { label, index: r.totalMult * (1 + foodGain) };
    }
    // Each named setup picks its own best food scenario FIRST (Setup A's
    // better of Wine/Mana Food, Setup B's better of Wine/Mana Food), THEN
    // those two per-setup bests are compared against each other. Pooling
    // all 4 Setup x Food combinations into one sorted list and comparing
    // the winner to literal 2nd place would silently pick the SAME winning
    // setup's OTHER food option (e.g. Setup A+Mana Food beating Setup
    // A+Wine by a hair) whenever a setup's own two food choices are close,
    // even with Setup B miles behind both. That "vs the next-best
    // combination" % would be disconnected from the aVsB pill's own Setup
    // A vs Setup B gap directly above it (e.g. a real 18% A-vs-B gap next
    // to a misleading <1% here), the two lines answering different
    // questions. Comparing
    // each setup's own best-of-2 keeps this line answering the same
    // "Setup A vs Setup B" question as the rest of the section, just with
    // each side free to pick its own best food before the comparison.
    function bestOf(label, side) {
      return [
        scenario(label + " + Vernese Wine", side, true, false),
        scenario(label + " + " + manaFoodLabel(base, inputs), side, false, true),
      ].sort((x, y) => y.index - x.index)[0];
    }
    const aBest = bestOf("Setup A", svsA);
    const bBest = bestOf("Setup B", svsB);
    const aWins = aBest.index >= bBest.index;
    const winner = aWins ? aBest : bBest;
    const runnerUp = aWins ? bBest : aBest;
    return {
      winnerLabel: winner.label,
      otherLabel: aWins ? "Setup B" : "Setup A",
      pctVsRunnerUp: winner.index / runnerUp.index - 1,
    };
  }

  // Isolated Ark Passive-grid inputs for Keen Blunt Weapon's own row +
  // stone breakdown ONLY (kbwContributionGain and the kbw entry in
  // stoneBreakdown below). kbwContributionGain's closed form needs a real
  // effCrit/onCritDmg/critDmgTotal from a full grid+shared recompute (it's
  // not a flat fraction like grudgeGain/cursedDollGain/etc. above), but
  // computeGridAndSummary(inputs)/computeShared(inputs) on the raw,
  // live-tracked `inputs` bakes in whatever KBW and Adrenaline are
  // currently equipped in the Ark Passive section above - so toggling
  // either one up there was silently changing this section's own KBW row
  // even though nothing in the Engraving section's own selectors moved.
  // Overriding both here (same fields engravingCandidateInputs overrides
  // for bestComboFor's candidate search) makes the row depend only on
  // engrInputs, like every other row on this page.
  function engravingIsolatedGridInputs(inputs, engrInputs) {
    return Object.assign({}, inputs, {
      adrenaline: engrInputs.adrenalineLevel,
      adrenalineStone: engravingStoneLevel("adrenaline", engrInputs),
      kbw: engrInputs.kbwLevel,
      kbwStone: engravingStoneLevel("kbw", engrInputs),
    });
  }

  // A thin wrapper around kbwRealizedGainPct's real re-optimized
  // with/without search, so this row matches Setup A/B's own "vs No Setup"
  // methodology exactly (a closed form that held the isolated section's
  // winning keystone/split fixed could silently diverge from Setup A/B
  // whenever removing KBW would actually flip which cell wins - see
  // kbwRealizedGainPct's own comment for a confirmed live example).
  // Engraving + Ability Stone are removed jointly (isolatedInputs carries
  // both kbwLevel and its Stone level), not as two separate marginals.
  function kbwContributionGain(isolatedInputs) {
    return kbwRealizedGainPct(isolatedInputs) / 100;
  }

  function computeEngravingComparison(inputs, engrInputs) {
    const gridResult = computeGridAndSummary(inputs);
    const best = gridResult.best;
    if (!best) return null;

    // See engravingIsolatedGridInputs's comment - KBW's own row and stone
    // breakdown need their own grid+shared recompute, isolated from the
    // live Ark Passive section's KBW/Adrenaline state, instead of reusing
    // gridResult/best above (which everything else on this page
    // still correctly uses, since only KBW's closed form is affected).
    const isolatedInputs = engravingIsolatedGridInputs(inputs, engrInputs);
    const isolatedGrid = computeGridAndSummary(isolatedInputs);
    // Pin-aware (see pinnedCellFrom's own comment) - isolatedBest/
    // isolatedBestStats feed the stone-level preview sweep below
    // (kbwOnCrit, marginalCritDmgGainPct's effCrit arg), which needs to
    // reflect whatever combo is actually pinned, the same as KBW's own
    // headline DPS Contribution row (kbwContributionGain -> bestComboFor)
    // already does. Reading isolatedGrid.best directly would not do that:
    // computeGridAndSummary never calls bestComboFor, so it would use the
    // TRUE best cell even while a different combo is pinned, an
    // inconsistency within this same row (the headline % would follow the
    // pin while these 4 columns kept tracking the true best instead).
    const isolatedBest = pinnedCellFrom(isolatedGrid, isolatedGrid.best) || best;
    const isolatedBestStats = (isolatedBest && isolatedBest.stats) || gridResult.bestStats;
    const isolatedShared = computeShared(isolatedInputs);

    // Raid Captain competes for its slot on both specs: RE has the same
    // 2-competing-slot structure Surge does, so RC belongs in the same
    // pool-of-2-combinations search rather than being pinned on. Mass Increase stays Surge-only (its
    // -10% Attack Speed drawback isn't modeled - see the opt-in
    // checkbox's own tooltip - so it's never added to RE's pool
    // regardless of miOptIn).
    const pool = ["rc", "kbw", "cd"];
    if (engrInputs.spec !== "re" && engrInputs.miOptIn) pool.push("mi");
    const candidateFlagSets = [];
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        candidateFlagSets.push({
          includeRC: pool[i] === "rc" || pool[j] === "rc",
          includeKbw: pool[i] === "kbw" || pool[j] === "kbw",
          includeCD: pool[i] === "cd" || pool[j] === "cd",
          includeMI: pool[i] === "mi" || pool[j] === "mi",
        });
      }
    }

    // Same "no competing engraving, no Stone in either slot" baseline
    // computeEngravingSetupComparison's own bareBase/neither builds below -
    // used here purely to normalize the Best Combo/Runner-Up cards' own
    // Engraving Bonus breakdown row (see engravingCandidateBreakdown's
    // comment), not shown as its own "vs No Setup" card the way Setup
    // A/B's neither is.
    const bareEngrInputs = Object.assign({}, engrInputs, {
      stone1Target: "None", stone1Level: "0 Lv.",
      stone2Target: "None", stone2Level: "0 Lv.",
    });
    const neitherCandidate = computeEngravingCandidate(inputs, bareEngrInputs, {
      includeRC: false, includeKbw: false, includeCD: false, includeMI: false,
    });
    const candidates = candidateFlagSets
      .map((flags) => computeEngravingCandidate(inputs, engrInputs, flags, neitherCandidate))
      .sort((a, b) => b.totalMult - a.totalMult);
    const winner = candidates[0];
    const runnerUp = candidates[1] || null;

    const rows = [
      { label: "Grudge", gain: grudgeGain(engrInputs, inputs) },
      { label: "Ambush Master", gain: ambushMasterGain(engrInputs, inputs) },
      {
        label: "Adrenaline",
        gain: adrenalineContributionGain(isolatedInputs, engrInputs),
        // Same inline "i" icon (native `title`, see renderComparisonRows'
        // own identical .ap-brace-info-icon use above) rather than a
        // permanent note line - just a quick pointer that this row's AP
        // half isn't a flat number, it's already following whatever
        // Adrenaline Uptime % is set to in the Ark Passive section above
        // (see adrenalineApFraction's own comment for why that's now the
        // case). Also covers the same "realized, re-optimized" caveat KBW's
        // note below explains - both rows share the identical methodology
        // (kbwRealizedGainPct/adrenalineGridRatio's own with-vs-without
        // grid search), so one shared note text keeps them consistent
        // instead of drifting into two slightly different wordings.
        note: "Recomputes the best setup with vs without, so the winning keystone/split can flip. Follows Adrenaline Uptime % setting from the Ark Passive section above.",
      },
      { label: "Raid Captain", gain: raidCaptainGain(engrInputs, inputs) },
      {
        label: "Keen Blunt Weapon",
        gain: kbwContributionGain(isolatedInputs),
        // Same methodology note as Adrenaline's above, worded for KBW
        // specifically (no uptime/AP half to mention here) - see that
        // row's own comment for why the two share this note's first
        // sentence verbatim rather than each inventing their own phrasing.
        note: "Recomputes the best setup with vs without, so the winning keystone/split can flip.",
      },
      { label: "Cursed Doll", gain: cursedDollGain(engrInputs, inputs) },
      // Mass Increase stays Surge-only in this reference table too, same
      // reasoning as the pool/candidateFlagSets exclusion above (RE never
      // runs it, and its -10% Attack Speed drawback isn't modeled) -
      // filtered out below rather than left in the array, since this
      // table has no per-row spec toggle like the checkbox/wine rows
      // above do.
      engrInputs.spec !== "re"
        ? { label: "Mass Increase", gain: massIncreaseGain(engrInputs, inputs) }
        : null,
      {
        label: "Ability Stone Base AP",
        gain: abilityStoneBaseApGain(inputs, engrInputs),
        // Mirrors engravingStoneImpliesBaseAp's own threshold check
        // (5+ total nodes across BOTH isolated stone slots combined, not
        // one stone alone - a single stone tops out at Lv.4) - reader
        // otherwise has no way to tell why this row reads 0% even with a
        // stone slotted, if the other slot isn't carrying enough to clear
        // the combined threshold.
        note: "Only applies once Stone 1 + Stone 2 add up to Lv.5 or higher combined.",
      },
      {
        label: "Mana Food",
        gain: manaFoodContributionGain(engrInputs, inputs),
        // Icon (and therefore the note itself) is Surge-only - RE's Mana
        // Food is Main-Stat-only with no Bleed rune interaction and is
        // excluded from calculations entirely (see
        // manaFoodContributionGain/engravingCandidateMultiplier), so
        // there's nothing for the tooltip to explain there.
        note: engrInputs.spec === "surge"
          ? (engrInputs.manaFoodMainOnly
            ? "Main Stat only, without the Bleed rune on Maelstrom. Not tied to any one engraving."
            : "Includes using the Bleed rune on Maelstrom. Not tied to any one engraving.")
          : null,
      },
    ].filter(Boolean);

    // NONE of these 7 rows' stone breakdowns are safe to read as the raw
    // Ability Stone tooltip value, EVEN the ones (Grudge/Cursed Doll/Mass
    // Increase/Raid Captain) whose own DPS Contribution row really is a
    // flat "mult = 1+g, gain = g" layer relative to not having the
    // engraving at all. That "gain = g, no approximation" math is only
    // valid when the OTHER side of the ratio is 1 (no engraving equipped
    // at all) - which is exactly what the DPS Contribution column
    // compares against. The stone breakdown columns compare something
    // different: "what does adding JUST this stone level get me, on top
    // of the Node level I already have equipped" - and Node level and
    // Stone level for these 4 sit in the exact same additive bucket
    // (mult = 1 + nodeVal + stoneVal, one combined term, not two
    // separately-stacked (1+a)*(1+b) layers - see grudgeGain/
    // cursedDollGain/massIncreaseGain/raidCaptainGain above, all of which
    // sum node+stone before ever adding the leading 1). Going from 121%
    // (node only) to 127% (node+Lv.4 stone) is a (1.27/1.21 - 1) = 4.96%
    // marginal gain, NOT the raw 6-point stone value - the node's own
    // already-active value in the denominator dilutes it, same shape as
    // Ambush Master's (1+backDmg) denominator just below. A prior version
    // of this file validated the raw values by diffing two "gain vs.
    // nothing" percentages (both measured from a mult=1 baseline) instead
    // of taking the with/without-stone RATIO - that diff trivially
    // reproduces the raw table value no matter what, so it could never
    // have caught this; the ratio check below is what actually confirms
    // it (matches the DPS Contribution column's own 0-stone vs. 4-stone
    // ratio, not its point-difference).
    function flatBucketStoneMarginal(nodeVal, stoneTable) {
      return ENGRAVING_STONE_OPTIONS.map((lv) => (stoneTable[lv] || 0) / (1 + nodeVal));
    }

    // KBW and Adrenaline's own rows are NOT flat additive layers like the
    // 4 above (see kbwContributionGain/adrenalineContributionGain) - their
    // stone's raw tooltip value isn't itself a DPS%, so unlike the 4 raw
    // tables above, these two run each of the 4 stone levels through the
    // same non-linear formula their own DPS Contribution column already
    // uses for the currently-slotted level, just swept across all 4.
    // Isolated the same way as the row above (see
    // engravingIsolatedGridInputs) - this sweep must move with engrInputs'
    // own KBW/Adrenaline node selectors only, never the live Ark Passive
    // section's equipped values.
    //
    // Ambush Master's stone sits INSIDE ambushMasterGain's own
    // (1+backDmg)*(1+secondary+stone)-1 multiplicative shape, so the
    // stone's isolated marginal (holding the node level's own secondary
    // value fixed) is stone/(1+secondary) - same "shares a bucket with
    // something already active" shape as flatBucketStoneMarginal above,
    // just with the node's own AMBUSH_MASTER_SECONDARY_TABLE value in the
    // denominator instead of RC/Grudge/CD/MI's own node table - verified
    // against the DPS Contribution column's own 0-stone vs. 4-stone ratio
    // (5.02% actual vs. 5.40% raw table at the default 4 Nodes/0.076
    // secondary).
    //
    // Raid Captain's node+stone bucket is scaled by moveSpeedFraction
    // AFTER the sum (base*frac, not (base*frac) inside its own +1) - the
    // frac factor is common to numerator and denominator of the ratio
    // below and does NOT cancel out entirely (it's still weighting how
    // much the node's own already-active value dilutes the stone's
    // marginal), so this needs its own version of the ratio rather than
    // reusing flatBucketStoneMarginal as-is.
    const kbwOnCrit = isolatedBestStats.onCritDmg / 100;
    // KBW's own isolated sweep must never depend on which Ability Stone
    // level happens to be actually slotted right now (engravingStoneLevel
    // above) - each of the 4 columns previews "if this were the ONLY
    // Ability Stone level applied", not "in addition to whatever's
    // currently there". isolatedShared.critDmgTotal above already has the
    // CURRENTLY slotted kbwStone value baked in (from
    // engravingIsolatedGridInputs), so it has to be subtracted back out
    // first to get a true 0-stone baseline, then each swept level's own
    // value added back on top of that same baseline before calling
    // marginalCritDmgGainPct - otherwise the "without" term it
    // reconstructs internally silently mismatches whichever level is
    // actually equipped, and only the column matching the real selection
    // comes out right (confirmed: with no stone slotted, sweeping the
    // real selection through 1-4 Lv. visibly drifted every column's
    // number instead of holding it fixed).
    const actualKbwStoneValue = KBW_STONE_TABLE[engravingStoneLevel("kbw", engrInputs)] || 0;
    const kbwBaselineCritDmgTotal = isolatedShared.critDmgTotal - actualKbwStoneValue;
    const rcFrac = raidCaptainMoveSpeedFraction(engrInputs, inputs.yearning);
    const rcNodeVal = RAID_CAPTAIN_TABLE[engrInputs.rcLevel] || 0;
    const stoneBreakdown = {
      grudge: flatBucketStoneMarginal(GRUDGE_TABLE[engrInputs.grudgeLevel] || 0, GRUDGE_STONE_TABLE),
      ambush: ENGRAVING_STONE_OPTIONS.map(
        (lv) => (AMBUSH_MASTER_STONE_TABLE[lv] || 0) / (1 + (AMBUSH_MASTER_SECONDARY_TABLE[engrInputs.ambushLevel] || 0))
      ),
      rc: ENGRAVING_STONE_OPTIONS.map((lv) => {
        const stoneVal = RAID_CAPTAIN_STONE_TABLE[lv] || 0;
        return (stoneVal * rcFrac) / (1 + rcNodeVal * rcFrac);
      }),
      cd: flatBucketStoneMarginal(CURSED_DOLL_TABLE[engrInputs.cdLevel] || 0, CURSED_DOLL_STONE_TABLE),
      mi: flatBucketStoneMarginal(MASS_INCREASE_TABLE[engrInputs.miLevel] || 0, MASS_INCREASE_STONE_TABLE),
      kbw: ENGRAVING_STONE_OPTIONS.map((lv) => {
        const testValue = KBW_STONE_TABLE[lv] || 0;
        return marginalCritDmgGainPct(isolatedBest.effCrit, kbwOnCrit, kbwBaselineCritDmgTotal + testValue, testValue) / 100;
      }),
      adrenaline: ENGRAVING_STONE_OPTIONS.map((lv) => adrenalineStoneMarginalGain(inputs, engrInputs, lv)),
    };

    return {
      winner,
      runnerUp,
      rows,
      stoneBreakdown,
      moveSpeed: raidCaptainMoveSpeed(engrInputs, inputs.yearning),
      wineVsManaFood: raidCaptainWineVsManaFood(engrInputs, inputs),
      spec: engrInputs.spec,
    };
  }

  // ----- Overall Best Setup (best combo AND best food together) -----
  //
  // Best Combo above deliberately answers "best 2-engraving combo for the
  // FOOD YOU CURRENTLY HAVE SELECTED" - it excludes Mana Food's own Main
  // Stat + Bleed contribution from the ranking on purpose, since that
  // bonus applies equally to every candidate and would just be dead
  // weight riding along on every candidate's totalMult (see
  // engravingCandidateMultiplier's own comment). That's the right call
  // for "which combo wins under this food", but it means Best Combo can
  // legitimately flip between Wine and Mana Food (Raid Captain's own
  // Move Speed-driven gain shrinks on Mana Food, see raidCaptainGain)
  // without that flip telling the reader anything about which food to
  // actually eat - Setup A/B and this section's own Mana Food note
  // already answer that half separately, but nothing on the page
  // combined the two questions into one "just tell me the actual best
  // complete setup" answer. This does that, without changing Best
  // Combo's own math at all: it reruns the exact same search (
  // computeEngravingComparison) once per food scenario, then - ONLY
  // here, comparing full setups against each other rather than ranking
  // combos within one setup - multiplies each scenario's winning combo by
  // that scenario's own manaFoodContributionGain (the common bonus Best
  // Combo leaves out) before comparing the two totals. Surge only: RE's
  // Mana Food is Main-Stat-only and deliberately excluded from every DPS
  // number on the page (manaFoodContributionGain's own comment), so
  // there's no second food scenario to compare it against there.
  function computeOverallBestEngravingSetup(inputs, engrInputs) {
    if (engrInputs.spec !== "surge") return null;
    function scenario(wine, manaFood) {
      const scenarioEngrInputs = Object.assign({}, engrInputs, { wine, manaFood });
      const cmp = computeEngravingComparison(inputs, scenarioEngrInputs);
      if (!cmp || !cmp.winner) return null;
      const foodGain = manaFoodContributionGain(scenarioEngrInputs, inputs);
      return { comboLabel: engravingComboLabel(cmp.winner.flags), index: cmp.winner.totalMult * (1 + foodGain) };
    }
    const wineScenario = scenario(true, false);
    const foodScenario = scenario(false, true);
    if (!wineScenario || !foodScenario) return null;
    const foodWins = foodScenario.index >= wineScenario.index;
    const winnerScenario = foodWins ? foodScenario : wineScenario;
    const otherScenario = foodWins ? wineScenario : foodScenario;
    const foodLabel = manaFoodLabel(engrInputs, inputs);
    return {
      comboLabel: winnerScenario.comboLabel,
      foodLabel: foodWins ? foodLabel : "Vernese Wine",
      otherFoodLabel: foodWins ? "Vernese Wine" : foodLabel,
      pctVsOther: winnerScenario.index / otherScenario.index - 1,
    };
  }

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
  // The Rings/Bracelet paired selects (Crit Rate, Crit Dmg, Additional Dmg),
  // the Crit Hit Dmg checkboxes, and the Support Crit Rate/Crit Dmg
  // Bracelet selects don't use this mechanism at all - their option
  // text/checkbox label already shows the exact percentage each choice is
  // worth (see the HTML), so there's no separate value-display for those
  // fields to keep in sync here.
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

    // Ability Stone Base AP % - the stone's own flat +1.5% (ABILITY_STONE_
    // BASE_AP_BONUS), shown next to its "9/7 or 10/6" checkbox when
    // checked and blank when not (setDisplay already treats a 0 value as
    // blank rather than "(0%)" - see its own comment above). Gem Base
    // AP % has no live display of its own since this row is split out
    // separately - the input box alone is enough information there.
    setDisplay(
      "#ap-gear-ability-stone-base-ap",
      inputs.gearAbilityStoneBaseAp ? ABILITY_STONE_BASE_AP_BONUS / 100 : 0
    );

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
    setDisplay("#ap-ot1", inputs.optimizedTraining ? OPTIMIZED_TRAINING_EVO_DMG : 0);

    // Rings/Bracelet pairs (Crit Rate, Crit Dmg, Additional Dmg) and the
    // Crit Hit Dmg checkboxes have no live value-display: their option
    // text/label already shows the exact percentage each choice is worth
    // (see the option labels in the HTML), so there's nothing separate to
    // keep in sync here.

    setDisplay("#ap-flashy-atk", FLASHY_ATK_TABLE[inputs.flashyAtk] || 0);
    setDisplay("#ap-stable-atk", stableAtkValue(inputs.stableAtk));
    setDisplay("#ap-swift-core", ARK_SWIFT_CDMG_TABLE[inputs.swiftCore] || 0);
    setDisplay("#ap-crushing-core", ARK_CRUSHING_CRATE_TABLE[inputs.crushingCore] || 0);
    const chaosAttackSpan = root.querySelector('.ap-value-display[data-for="ap-gear-ap-chaos-star"]');
    if (chaosAttackSpan) {
      const chaosAttack = GEAR_AP_CHAOS_STAR_TABLE[inputs.gearApChaosStar] || { pct: 0, flat: 0 };
      if (chaosAttack.pct || chaosAttack.flat) {
        const pctText = chaosAttack.pct ? chaosAttack.pct.toFixed(2) + "%" : "0%";
        const flatText = chaosAttack.flat ? chaosAttack.flat.toString() + " AP" : "0 AP";
        chaosAttackSpan.textContent = "(" + pctText + " + " + flatText + ")";
      } else {
        chaosAttackSpan.textContent = "";
      }
    }
    const weaponCoreSpan = root.querySelector('.ap-value-display[data-for="ap-gear-weapon-core"]');
    if (weaponCoreSpan) {
      const weaponCore = ARK_WEAPON_CORE_TABLE[inputs.gearWeaponCore] || { pct: 0, flat: 0 };
      if (weaponCore.pct || weaponCore.flat) {
        const pctText = weaponCore.pct ? weaponCore.pct.toFixed(2) + "%" : "0%";
        const flatText = weaponCore.flat ? weaponCore.flat.toString() + " WP" : "0 WP";
        weaponCoreSpan.textContent = "(" + pctText + " + " + flatText + ")";
      } else {
        weaponCoreSpan.textContent = "";
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
    // Flash Orb Uptime's readout mirrors Strength Orb Uptime just above -
    // the time-averaged effective Crit Rate (uptime * the full value
    // while active), not the uptime number itself.
    setDisplay("#ap-flash-orb-uptime", (inputs.flashOrbUptime / 100) * FLASH_ORB_FULL_CRIT_RATE);
    // Running total, shown even at 0% (unlike the other displays above,
    // which stay blank at 0) so it always reads as "here's your current
    // total" rather than looking broken/empty with nothing selected yet.
    const gearApTotalSpan = root.querySelector('.ap-value-display[data-for="ap-gear-ap-total"]');
    if (gearApTotalSpan) {
      gearApTotalSpan.textContent = "(" + gearAttackPowerPercentTotal(inputs).toFixed(2) + "%)";
    }

    // Attack Power readout (base -> Adrenaline -> Support, each stage
    // cumulative) - hidden entirely until Weapon Power and Main Stat are
    // both filled in, same "don't render off a nonsensical partial
    // state" guard the Bracelet Comparison's own WP/AP rows use (see
    // computeBraceletComparison's wp > 0 && mainStat > 0 && baselineAp > 0
    // check). The Adrenaline stage (arrow + value) is its own hidden-able
    // pair, toggled off entirely when Adrenaline is "Not Used" so the
    // readout reads as a straight base -> final chain instead of implying
    // a buff that isn't in play.
    const apReadout = root.querySelector(".ap-gear-ap-readout");
    if (apReadout) {
      const { base, afterAdrenaline, final, adrenalineUsed } = gearApBeforeAfter(inputs);
      if (inputs.gearWp > 0 && inputs.gearMainStat > 0 && final > 0) {
        apReadout.hidden = false;
        const baseEl = apReadout.querySelector(".ap-gear-ap-readout-base");
        const adrenalineStage = apReadout.querySelector(".ap-gear-ap-readout-adrenaline-stage");
        const adrenalineEl = apReadout.querySelector(".ap-gear-ap-readout-adrenaline");
        const finalEl = apReadout.querySelector(".ap-gear-ap-readout-final");
        if (baseEl) baseEl.textContent = base.toLocaleString();
        if (adrenalineStage) adrenalineStage.hidden = !adrenalineUsed;
        if (adrenalineEl) adrenalineEl.textContent = afterAdrenaline.toLocaleString();
        if (finalEl) finalEl.textContent = final.toLocaleString();
      } else {
        apReadout.hidden = true;
      }
    }

    setDisplay("#ap-crit-syn1", inputs.critSyn1 ? 0.1 : 0);
    setDisplay("#ap-crit-syn2", inputs.critSyn2 ? 0.1 : 0);
    setDisplay("#ap-crit-hit-syn-1", inputs.critHitSyn1 ? 0.08 : 0);
    setDisplay("#ap-crit-hit-syn-2", inputs.critHitSyn2 ? 0.08 : 0);
  }

  // "1st"/"2nd"/"3rd"/"4th"... - only used for a pinned combo that has
  // drifted below the visible top 5 (see renderGrid's own comment on
  // pinnedDisplayCell) and needs an honest true-rank label instead of a
  // fake "5th Best".
  function ordinal(n) {
    const rem100 = n % 100;
    if (rem100 >= 11 && rem100 <= 13) return n + "th";
    switch (n % 10) {
      case 1: return n + "st";
      case 2: return n + "nd";
      case 3: return n + "rd";
      default: return n + "th";
    }
  }

  function renderGrid(root, result) {
    // Top 5 combinations, ranked by % of the grid's best cell. Pure
    // rendering: pctOfBest was already computed in computeGridAndSummary,
    // this only sorts and displays it - no math happens here. The
    // RANKING itself is always the TRUE ranking, pin or no pin - it
    // comes straight from result.cells, and computeGridAndSummary never
    // calls bestComboFor (see that function's own comment), so it can't
    // be circularly affected by a pin bestComboFor itself is honoring.
    //
    // Each row is also clickable: it just PREVIEWS that rank's own stats
    // in the Best Setup card below (title swaps to "2nd-5th Best Setup")
    // - a display-only toggle, doesn't touch inputs or any calculation at
    // all. UI-only state (see apCalcSelection) - never saved/exported,
    // resets to "auto" (rank 1) on reload.
    //
    // The 2nd-5th rows additionally carry a pin control (.ap-result-pin -
    // see initApCalcRoot's own listener): pinning goes a step further
    // than previewing - it also becomes the fixed combo every
    // bestComboFor() search on the rest of the page resolves to (see
    // activePinnedCombo). Identity is tracked by combo (split key +
    // keystone pair, stashed on the row via data-combo-split/-pair every
    // render below), not by rank, since a pinned combo's rank can itself
    // shift as the reader edits other inputs.
    //
    // PINNED-BUT-DRIFTED-OUT-OF-TOP-5: if the pinned combo's true rank
    // falls to 6th or below as the reader edits other inputs, it stays
    // FORCED into the 5th row slot (bumping the true 5th place out of
    // view) rather than silently vanishing - it's still the thing every
    // panel below is computed against, so it stays visible with its own
    // real, live numbers (pct/delta both still read straight off its own
    // cell, same as any other row - nothing about those is faked). The
    // row's rank badge shows its true overall rank (e.g. "7") instead of
    // "5" in that case, and the Best Setup card title says "Pinned Setup
    // (7th Best)" rather than falsely claiming 5th. Unpinning reverts the
    // row to whichever combo is truly 5th again.
    const list = root.querySelector(".ap-calc-results");
    if (!list) return;

    // Optimized Training 1 badge in the Top Combinations header - shown
    // whenever the 2-level OT1 split set is what these rows were ranked
    // from (see EVOLUTION_SPLITS_OT1).
    // Also shows what that costs: best-with-OT1 vs best-without, as a %
    // DPS change (see computeOt1CostPct).
    const ot1Badge = list.querySelector(".ap-ot1-indicator");
    if (ot1Badge) {
      ot1Badge.hidden = !result.ot1;
      const costEl = ot1Badge.querySelector(".ap-ot1-cost");
      if (costEl) {
        const c = result.ot1CostPct;
        costEl.textContent = (c == null || !isFinite(c))
          ? ""
          : " (" + (c > 0 ? "+" : "") + c.toFixed(2) + "% DPS)";
      }
    }

    const state = getApCalcSelection(root);
    const pinnedCombo = state.pinnedCombo;
    const allRanked = result.cells.slice().sort((a, b) => b.pctOfBest - a.pctOfBest);
    const ranked = allRanked.slice(0, 5);

    const sameCombo = (a, b) => !!a && !!b && a.split.key === b.split.key && a.keystone === b.keystone;

    // The pinned cell, if any, looked up across ALL 9 cells (not just the
    // top 5) and its TRUE rank among all 9 - needed regardless of
    // whether it's currently inside the visible top 5, both to decide
    // whether it needs to be force-displayed and to label it honestly
    // when it does.
    const pinnedCell = pinnedCombo
      ? result.cells.find((c) => c.split.key === pinnedCombo.splitKey && c.keystone === pinnedCombo.pair) || null
      : null;
    const pinnedTrueRank = pinnedCell ? allRanked.findIndex((c) => sameCombo(c, pinnedCell)) + 1 : null;

    // What actually populates the 5 visible rows: the true top 5, unless
    // the pinned combo isn't among them - then it takes over the 5th
    // (lowest) slot instead of the true 5th place. Rank 1 is never
    // touched (it's always the true best, and has no pin control to
    // begin with - see resources.md).
    const displayRows = ranked.slice();
    const pinnedForcedIn = !!pinnedCell && !ranked.some((c) => sameCombo(c, pinnedCell));
    if (pinnedForcedIn) displayRows[displayRows.length - 1] = pinnedCell;

    displayRows.forEach((cell, i) => {
      if (!cell) return;
      const rank = i + 1;
      const rowEl = list.querySelector('.ap-calc-result-row[data-rank="' + rank + '"]');
      if (!rowEl) return;

      const rankEl = rowEl.querySelector(".ap-result-rank");
      const comboEl = rowEl.querySelector(".ap-result-combo");
      const pctEl = rowEl.querySelector(".ap-result-pct");
      const deltaEl = rowEl.querySelector(".ap-result-delta");

      const forcedHere = rank === displayRows.length && pinnedForcedIn;
      if (rankEl) rankEl.textContent = forcedHere ? String(pinnedTrueRank) : String(rank);

      if (comboEl) {
        comboEl.textContent = cell.split.label + " \u00B7 " + (KEYSTONE_LABELS[cell.keystone] || cell.keystone);
      }
      if (pctEl) pctEl.textContent = cell.pctOfBest.toFixed(2) + "%";
      if (deltaEl) {
        deltaEl.textContent = rank === 1 ? "Best" : (cell.pctOfBest - ranked[0].pctOfBest).toFixed(2) + "% vs best";
      }
      rowEl.classList.toggle("ap-calc-result-row-best", rank === 1);
      rowEl.classList.toggle("ap-calc-result-row-active", state.previewRank === rank);
      rowEl.classList.toggle("ap-calc-result-row-forced", forcedHere);

      // Refreshed every render so the pin click handler (which reads
      // these back off the DOM at click time) always toggles whatever
      // combo is CURRENTLY sitting in this row, not whatever was there
      // when the listener was first attached. This is exactly why
      // force-displaying the pinned combo in row 3 is safe: the row's
      // own identity is refreshed to match it, so the row's pin button
      // still toggles the right combo and the click-to-preview handler
      // still previews the right stats.
      rowEl.dataset.comboSplit = cell.split.key;
      rowEl.dataset.comboPair = cell.keystone;

      const pinEl = rowEl.querySelector(".ap-result-pin");
      if (pinEl) {
        const isPinned = !!(pinnedCombo && pinnedCombo.splitKey === cell.split.key && pinnedCombo.pair === cell.keystone);
        pinEl.classList.toggle("ap-result-pin-active", isPinned);
        pinEl.setAttribute("aria-pressed", isPinned ? "true" : "false");
        rowEl.classList.toggle("ap-calc-result-row-pinned", isPinned);
      } else {
        rowEl.classList.remove("ap-calc-result-row-pinned");
      }
    });

    // Marks every row's click-to-preview as inert while a pin is active
    // (see the preview() early-return in initApCalcRoot) - drops the
    // pointer cursor/hover tint from non-pinned rows via CSS so they
    // don't keep advertising an interaction that does
    // nothing while pinned. The pinned row's own .ap-result-pin button is exempt
    // (see the CSS) since unpinning is still live.
    list.classList.toggle("ap-calc-results-pinned", !!pinnedCombo);
    // Same signal for assistive tech: while a pin is active, every row's
    // preview button is a no-op (see preview()'s early return), so say so
    // instead of leaving them announced as live controls. The pin buttons
    // stay live for unpinning.
    list.querySelectorAll(".ap-calc-result-row .ap-result-combo").forEach((btn) => {
      if (pinnedCombo) btn.setAttribute("aria-disabled", "true");
      else btn.removeAttribute("aria-disabled");
    });

    // Which cell's stats populate the Best Setup card, and what its title
    // reads: the pinned cell if one's active (pin always wins over a
    // stale previewRank - see resolvePinnedCombo's own comment on why
    // identity is combo-based), otherwise whichever rank the reader's
    // currently previewing.
    const cardRank = Math.min(Math.max(state.previewRank || 1, 1), ranked.length || 1);
    const cardCell = pinnedCell || ranked[cardRank - 1] || ranked[0] || null;

    const cardEl = root.querySelector(".ap-stat-card-best");
    const titleEl = cardEl && cardEl.querySelector(".ap-stat-card-title");
    if (titleEl) {
      if (pinnedCell) {
        const rankLabels = { 1: "Best", 2: "2nd Best", 3: "3rd Best", 4: "4th Best", 5: "5th Best" };
        const rankLabel = rankLabels[pinnedTrueRank] || (pinnedTrueRank ? ordinal(pinnedTrueRank) + " Best" : null);
        titleEl.textContent = rankLabel ? "Pinned Setup (" + rankLabel + ")" : "Pinned Setup";
      } else {
        const rankTitles = { 1: "Best Setup", 2: "2nd Best Setup", 3: "3rd Best Setup", 4: "4th Best Setup", 5: "5th Best Setup" };
        titleEl.textContent = rankTitles[cardRank] || "Best Setup";
      }
    }
    if (cardEl) {
      // Mirrors the Top Combinations row's lavender "previewed" tint onto
      // the card itself, so the two stay visually linked even if the
      // previewed row has scrolled out of view. Pinned gets its own
      // coral treatment instead (see the CSS, same accent as the pin's
      // own tack icon) since it's a stronger statement than "just
      // looking" - it's actually driving every other panel on the page.
      // Pin always wins over plain preview if both were somehow set
      // (shouldn't normally happen - previewRank follows the pin, see
      // initApCalcRoot). This card title/tint is the only on-page
      // indicator that something's pinned once the pin drifts off the
      // visible rank-2/3 rows (see pinnedCell's own comment above) -
      // deliberately no separate note/Unpin control beyond the tack icon
      // itself and this card, kept intentionally minimal.
      cardEl.classList.toggle("ap-stat-card-pinned", !!pinnedCell);
      cardEl.classList.toggle("ap-stat-card-previewed", !pinnedCell && cardRank !== 1);
    }

    // Verification panel
    const base = result.baseStats;
    if (base) {
      const rateEl = root.querySelector(".ap-summary-base-critrate");
      const ratePeakEl = root.querySelector(".ap-summary-base-critrate-peak");
      const dmgEl = root.querySelector(".ap-summary-base-critdmg");
      const onCritEl = root.querySelector(".ap-summary-base-oncrit");
      const evoEl = root.querySelector(".ap-summary-base-evodmg");
      const addEl = root.querySelector(".ap-summary-base-adddmg");

      // Primary row: effective (capped) Crit Rate - this is the number
      // the DPS math (mult) actually uses, so it can never exceed 100%
      // (blendCritTerms's base case is Math.min(base, 1)) and never
      // needs the warn styling.
      if (rateEl) rateEl.textContent = base.critRate.toFixed(2) + "%";
      // Secondary row: the uncapped full-value burst-window ceiling. THIS
      // is the one that can legitimately read over 100% (see
      // peakCritRate's own comment above), so the warn class belongs
      // here now, not on the effective row.
      if (ratePeakEl) {
        const peak = base.critRatePeak;
        ratePeakEl.textContent = peak.toFixed(2) + "%";
        ratePeakEl.classList.toggle("ap-summary-value-warn", peak > 100);
      }
      // Displayed Crit Dmg excludes Breaking Moon's own add when active -
      // base.critDmg itself stays the real shared.critDmgTotal (the DPS
      // math's actual number, unchanged), this just subtracts it back out
      // for THIS row's text so it isn't shown twice now that the T→Z CDmg
      // row below surfaces it on its own. critDmg is only ever read here
      // for display (not reused in any further calc), so this is safe.
      const baseCritDmgDisplay = base.critDmg - (base.breakingMoonActive ? base.breakingMoonAdd : 0);
      if (dmgEl) dmgEl.textContent = (baseCritDmgDisplay * 100).toFixed(2) + "%";
      if (onCritEl) onCritEl.textContent = base.onCritDmg.toFixed(2) + "%";
      if (evoEl) evoEl.textContent = base.evoDmg.toFixed(2) + "%";
      if (addEl) addEl.textContent = base.addDmg.toFixed(2) + "%";

      // KBW's Dmg contribution has no row here - the Engraving Comparison
      // section's reference table below covers it (via
      // kbwContributionGain), so a row here would duplicate it.

      // Breaking Moon (Surge 111 only) - a flat Crit Dmg add already
      // folded into critDmgTotal (see breakingMoonContribution), surfaced
      // here as its own line since it can shift which keystone the grid
      // above recommends AND because the Crit Dmg row above now excludes
      // it (see baseCritDmgDisplay above) to avoid showing it twice.
      // Hidden for every other build.
      const bmRow = root.querySelector(".ap-stat-card-row--breakingmoon-base");
      const bmEl = root.querySelector(".ap-summary-base-breakingmoon");
      if (bmRow) bmRow.classList.toggle("ap-stat-card-row--hidden", !base.breakingMoonActive);
      if (bmEl) bmEl.textContent = (base.breakingMoonAdd * 100).toFixed(2) + "%";
    }

    // Best Setup line - shows whichever cell cardCell above resolved to
    // (the previewed rank), via that cell's own precomputed .stats (see
    // computeGridAndSummary's cells.forEach .stats assignment). Falls
    // back to result.bestStats (the true best's own stats) if cardCell
    // somehow didn't resolve to anything - shouldn't normally happen, but
    // keeps this from going blank.
    const best = (cardCell && cardCell.stats) || result.bestStats;
    if (best) {
      const critEl = root.querySelector(".ap-summary-best-crit");
      const critPeakEl = root.querySelector(".ap-summary-best-crit-peak");
      const dmgEl = root.querySelector(".ap-summary-best-critdmg");
      const onCritEl = root.querySelector(".ap-summary-best-oncrit");
      const evoEl = root.querySelector(".ap-summary-best-evodmg");
      const addEl = root.querySelector(".ap-summary-best-adddmg");

      // Same effective/peak split as the Base card above.
      if (critEl) critEl.textContent = best.critRate.toFixed(2) + "%";
      if (critPeakEl) {
        const peak = best.critRatePeak;
        critPeakEl.textContent = peak.toFixed(2) + "%";
        critPeakEl.classList.toggle("ap-summary-value-warn", peak > 100);
      }
      // Same Breaking Moon exclusion as the Base card above.
      const bestCritDmgDisplay = best.critDmg - (best.breakingMoonActive ? best.breakingMoonAdd : 0);
      if (dmgEl) dmgEl.textContent = (bestCritDmgDisplay * 100).toFixed(2) + "%";
      if (onCritEl) onCritEl.textContent = best.onCritDmg.toFixed(2) + "%";
      if (evoEl) evoEl.textContent = best.evoDmg.toFixed(2) + "%";
      if (addEl) addEl.textContent = best.addDmg.toFixed(2) + "%";

      // Same flat Breaking Moon add as the Base card above.
      const bmRow = root.querySelector(".ap-stat-card-row--breakingmoon-best");
      const bmEl = root.querySelector(".ap-summary-best-breakingmoon");
      if (bmRow) bmRow.classList.toggle("ap-stat-card-row--hidden", !best.breakingMoonActive);
      if (bmEl) bmEl.textContent = (best.breakingMoonAdd * 100).toFixed(2) + "%";
    }
  }

  // ----- Comparison table rendering (shared by Bracelet + Accessories) -----
  // Renders `rows` into a <tbody> as a compact table (Line | Low | Mid |
  // High) - one <tr> per line, full-width. Originally Bracelet-only; kept
  // generic (takes elements directly rather than querying `.ap-brace-*`
  // itself) so the Accessory panels below can reuse it for their own,
  // smaller <tbody>s.
  function renderComparisonRows(container, rows) {
    if (!container) return;

    container.innerHTML = "";

    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      // rows[] arrives already sorted descending (see the .sort() call in
      // each compute* function that feeds this renderer), so index 0 is
      // always the top line - there is no best-row highlight (see
      // extra.css's .ap-brace-compare-footer-note comment for why).

      const labelTd = window.SiteUtils.el("td", "ap-brace-row-label");
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
        const span = window.SiteUtils.el("span", part.downside ? "ap-brace-label-downside" : "ap-brace-label-" + part.tier, part.text);
        labelTd.appendChild(span);
      });
      if (row.specDmgOnly) {
        // Small always-visible tag (not a permanent note block) so the
        // row stays one line tall - the explanation lives in this badge's
        // own hover tooltip instead of a paragraph under the table.
        const badge = window.SiteUtils.el("span", "ap-brace-label-caveat", "dmg only");
        badge.title = row.specDmgOnlyNote;
        badge.setAttribute("role", "img");
        badge.setAttribute("aria-label", row.specDmgOnlyNote);
        labelTd.appendChild(badge);
      }
      if (row.note) {
        // Caveat text moves into a hover tooltip (native `title`) instead
        // of a permanent line under the label - keeps every row to one
        // line instead of the label wrapping vertically for a caveat most
        // readers only need once. The little "i" badge is what tells a
        // reader there's something to hover in the first place.
        const infoEl = window.SiteUtils.el("span", "ap-brace-info-icon", "i");
        infoEl.title = row.note;
        infoEl.setAttribute("role", "img");
        infoEl.setAttribute("aria-label", row.note);
        labelTd.appendChild(infoEl);
      }
      tr.appendChild(labelTd);

      ["low", "mid", "high"].forEach((tier) => {
        const td = window.SiteUtils.el("td", "ap-brace-tier-val", formatPctBare(row[tier]));
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
          const val = row.combos[key];
          const td = window.SiteUtils.el("td", "ap-brace-tier-val ap-acc-combo-val", val === undefined ? "\u2013" : formatPctBare(val));
          tr.appendChild(td);
        });
      }

      // The Archdemon line's displayed values only pay off against a
      // Demon/Archdemon target - greyed out here so they read as
      // situational rather than a plain, always-on gain like every other
      // row's numbers (its hover note gives the Additional-Damage-only
      // equivalent for a direct, non-situational comparison).
      if (row.id === "addB") tr.classList.add("ap-brace-row-situational");

      container.appendChild(tr);
    });
  }

  function renderBraceletComparison(root, rows) {
    renderComparisonRows(root.querySelector(".ap-brace-compare-rows"), rows);
  }

  function formatBvbPct(x) {
    return (x >= 0 ? "+" : "") + (x * 100).toFixed(2) + "%";
  }

  // ----- Bracelet vs. Bracelet rendering -----
  // One card per side, filled from computeSingleBracelet's own result
  // shape - see computeBraceletVsBracelet above. Also toggles the Spec
  // field's two hover-icon warnings (mild "damage-only" note, shown on
  // both RE and Surge with per-spec wording; stronger "recommended 83+
  // Spec" warning, RE + below 83 only) since those depend on the same
  // inputs this render pass already has in hand.
  //
  // There is no "estimated" cd-note beside vs No Bracelet: CD Estimate is
  // a real per-side checkbox (see enforceBvbLineControls) whose own hover
  // tooltip already explains the assumption.
  const SPEC_NOTE_TEXT_RE = "This only reflects Spec's damage share on RE - it doesn't capture CDR or orb gen.";
  // Surge has no orb mechanic to omit in the first place - only CDR is
  // left uncaptured here, so the RE wording's "or orb gen" half is
  // dropped rather than carried over as a dead phrase for a mechanic
  // Surge doesn't have.
  const SPEC_NOTE_TEXT_SURGE = "This only reflects Spec's damage share on Surge - it doesn't capture CDR.";
  function renderBvbCard(root, prefix, side, isSurgeSpec) {
    const card = root.querySelector(".ap-bvb-card-" + prefix);
    if (!card) return;
    const set = (selector, text) => {
      const el = card.querySelector(selector);
      if (el) el.textContent = text;
    };
    set(".ap-bvb-keystone", side.splitLabel + " + " + side.keystoneLabel);
    set(".ap-bvb-vs-none", formatBvbPct(side.totalMult - 1));
    set(".ap-bvb-grid", formatBvbPct(side.gridRatio - 1));
    set(".ap-bvb-spec-val", formatBvbPct(side.specGain));
    set(".ap-bvb-flat", formatBvbPct(side.flatMult - 1));
    set(".ap-bvb-wp", formatBvbPct(side.wpRatio - 1));

    const specInput = root.querySelector(".ap-bvb-" + prefix + "-spec");
    const specNote = card.querySelector(".ap-bvb-spec-note");
    const specWarn = card.querySelector(".ap-bvb-spec-warn");
    const isRE = !isSurgeSpec;
    // Shown for both specs now (RE and Surge each get their own wording,
    // set on every render since which spec is active can change) - the
    // 83+ CDR recommendation beside it stays RE-only, Surge has no such
    // floor to recommend.
    if (specNote) {
      specNote.hidden = false;
      specNote.title = isRE ? SPEC_NOTE_TEXT_RE : SPEC_NOTE_TEXT_SURGE;
    }
    if (specWarn) specWarn.hidden = !(isRE && specInput && parseFloat(specInput.value) < 83);
  }

  function renderBraceletVsBracelet(root, inputs, result) {
    const bvbIsSurge = braceSpecConfig(inputs).isSurge;
    renderBvbCard(root, "a", result.a, bvbIsSurge);
    renderBvbCard(root, "b", result.b, bvbIsSurge);

    const noneEl = root.querySelector(".ap-bvb-no-bracelet-keystone");
    if (noneEl) noneEl.textContent = result.noBracelet.splitLabel + " + " + result.noBracelet.keystoneLabel;

    // Styled as a "selected" pill (see .ap-bvb-diff in the CSS), same
    // promoted-answer treatment as the Ark Passive section's own best-combo
    // row/card - colored in whichever side's own accent (pink for A, teal
    // for B) actually won, so the pill's color itself says who's ahead.
    const diffEl = root.querySelector(".ap-bvb-diff");
    if (diffEl) {
      const aWins = result.aVsB >= 0;
      const winner = aWins ? "Bracelet A" : "Bracelet B";
      diffEl.textContent = winner + " wins by " + formatBvbPct(Math.abs(result.aVsB));
      diffEl.classList.toggle("ap-bvb-diff-a", aWins);
      diffEl.classList.toggle("ap-bvb-diff-b", !aWins);
    }

    const keystoneNoteEl = root.querySelector(".ap-bvb-keystone-note");
    if (keystoneNoteEl) keystoneNoteEl.hidden = !result.keystonesDiffer;
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
      renderComparisonRows(root.querySelector(rowsSelector), rows);
    });
  }

  // ----- Accessory vs. Accessory rendering -----
  // Single card pair, not one set per slot - see AVB_SLOT_LABELS/
  // enforceAvbSlotUI for how the same markup relabels itself per slot.
  // No keystone label (Ring/Necklace swaps are valued against a fixed
  // best split/keystone - see computeAccessoryVsAccessory's own comment
  // for why - so there's nothing per-candidate to show or flip-check,
  // unlike Bracelet vs. Bracelet).
  function renderAvbCard(root, prefix, sideResult) {
    const card = root.querySelector(".ap-avb-card-" + prefix);
    if (!card) return;
    const set = (selector, text) => {
      const el = card.querySelector(selector);
      if (el) el.textContent = text;
    };
    set(".ap-bvb-vs-none", formatBvbPct(sideResult.totalMult - 1));
    set(".ap-bvb-grid", formatBvbPct(sideResult.gridRatio - 1));
    set(".ap-bvb-flat", formatBvbPct(sideResult.flatMult - 1));
    // Main Stat / Line 3 now uses mainStatLine3Ratio (this side's own
    // Line 1/2 held at "None") rather than the raw wpRatio - for Ring/
    // Necklace these are identical (see AVB_SLOT_LABELS' comment), for
    // Earring this is what makes the row a real, isolated number instead
    // of a duplicate of "vs No Earring".
    set(".ap-bvb-wp", formatBvbPct(sideResult.mainStatLine3Ratio - 1));
    set(".ap-bvb-lineratio", formatBvbPct(sideResult.lineRatio - 1));
  }

  function renderAccessoryVsAccessory(root, result) {
    if (!result) return;
    renderAvbCard(root, "a", result.a);
    renderAvbCard(root, "b", result.b);
    const diffEl = root.querySelector(".ap-avb-diff");
    if (diffEl) {
      const aWins = result.aVsB >= 0;
      diffEl.textContent = "Accessory " + (aWins ? "A" : "B") + " wins by " + formatBvbPct(Math.abs(result.aVsB));
      // .ap-avb-diff's own base class is .ap-esvs-diff (see its markup in
      // resources.md), not .ap-bvb-diff - so the winner accent has to come
      // from .ap-esvs-diff-a/-b, not .ap-bvb-diff-a/-b. Both families carry
      // identical pink/teal values, but .ap-bvb-diff-a/-b are declared
      // BEFORE .ap-esvs-diff's own base rule in extra.css, so at equal
      // specificity .ap-esvs-diff's later border/background-color/color
      // win the cascade and silently override them - the pill would render
      // in its neutral lilac fallback color no matter which side won.
      // .ap-esvs-diff-a/-b are declared AFTER .ap-esvs-diff, so they
      // correctly win instead.
      diffEl.classList.toggle("ap-esvs-diff-a", aWins);
      diffEl.classList.toggle("ap-esvs-diff-b", !aWins);
    }
  }

  // ----- ArkGrid (Chaos Core) Comparison rendering -----
  // Custom renderer, not renderComparisonRows above - each row shows 5
  // numeric cells (one merged 14 Points cell, then Relic/Ancient x 17/20
  // Points) instead of a single Low/Mid/High trio, so the shared per-
  // row-single-trio renderer doesn't fit here.
  function renderArkGridComparison(root, rows) {
    const container = root.querySelector(".ap-arkgrid-compare-rows");
    if (!container) return;
    container.innerHTML = "";
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      // rows[] is sorted descending by ancient20 (see computeArkGridComparison's
      // own rows.sort call), same ranking renderComparisonRows above relies
      // on - no best-row highlight applied though, same as that renderer
      // (see extra.css's .ap-brace-compare-footer-note comment for why).
      const labelTd = window.SiteUtils.el("td", "ap-brace-row-label", row.label);
      tr.appendChild(labelTd);
      ["p14", "relic17", "ancient17", "relic20", "ancient20"].forEach((key) => {
        const gradeClass = key === "p14" ? "ap-arkgrid-merged" : key.indexOf("relic") === 0 ? "ap-arkgrid-relic" : "ap-arkgrid-ancient";
        const td = window.SiteUtils.el("td", "ap-brace-tier-val ap-arkgrid-tier-val " + gradeClass, formatPctBare(row[key]));
        tr.appendChild(td);
      });
      container.appendChild(tr);
    });
  }

  // ----- Engraving Comparison rendering -----
  const MANAFOOD_TIP_BASE_TEXT = "Only accurate if the Main Stat input in Character Data doesn't already include Mana Food's Main Stat bonus.";
  // 222's own gearing more easily clears the Bleed rune's stat threshold
  // without Mana Food's help - worth flagging, but only for the one build
  // it's actually about, so it's appended rather than said unconditionally.
  const MANAFOOD_TIP_222_SUFFIX = " 222 may not need Mana Food to equip Maelstrom Bleed.";
  // Contribution rows are a single value per engraving (not a Low/Mid/
  // High trio), so this doesn't reuse renderComparisonRows - closer to
  // renderArkGridComparison's own bespoke-shape renderer just above.
  function renderEngravingComparison(root, result, engrInputs, overallBest) {
    const isSurge = engrInputs.spec === "surge";
    // Whether Mana Food's Bleed-rune-on-Maelstrom Dmg term actually
    // applies here - same gate as manaFoodBleedApplies, just read off the
    // DOM's own build selector since this render function only gets
    // engrInputs (spec, no build id) rather than the full inputs object.
    // False for RE AND for Surge 222 (see is222Build's own comment).
    const manaFoodHasBleed = isSurge && !is222Build(root) && !engrInputs.manaFoodMainOnly;
    const rageRuneRow = root.querySelector(".ap-engr-rage-rune-row");
    if (rageRuneRow) rageRuneRow.style.display = isSurge ? "" : "none";
    const wineRow = root.querySelector(".ap-engr-wine-row");
    if (wineRow) wineRow.style.display = isSurge ? "" : "none";
    const manaFoodRow = root.querySelector(".ap-engr-manafood-row");
    const manaFoodMainRow = root.querySelector(".ap-engr-manafood-main-row");
    if (manaFoodMainRow) manaFoodMainRow.style.display = isSurgeBleedFoodBuild(root) ? "" : "none";
    // Mana Food is not Surge-exclusive UI - RE gets the same
    // checkbox/amount select (see manaFoodContributionGain's own
    // comment for what it actually does on RE: Main-Stat-only, excluded
    // from calculations, purely informational). Row itself always shows;
    // only the label text below changes per spec/build.
    if (manaFoodRow) manaFoodRow.style.display = "";
    const manaFoodLabelEl = root.querySelector(".ap-engr-manafood-label");
    if (manaFoodLabelEl) {
      manaFoodLabelEl.textContent = isSurge && !is222Build(root)
        ? "Mana Food (+Maelstrom Bleed)"
        : "Mana Food (Main Stat only)";
    }
    const miRow = root.querySelector(".ap-engr-mi-row");
    if (miRow) miRow.style.display = isSurge ? "" : "none";

    // "Ranked for the selected food only..." only means anything where a
    // food choice (Wine vs. Mana Food) actually exists to rank around -
    // RE has no Wine/Mana Food combat choice at all (manaFoodContributionGain's
    // own comment: RE's Mana Food is Main-Stat-only and deliberately left
    // out of every DPS number on the page), so on RE this note pointed at
    // a food-based caveat, and an "Overall Best Setup below" that's ALSO
    // hidden for RE (computeOverallBestEngravingSetup returns null
    // there), neither of which exist. Same isSurge gate as the row
    // toggles above it.
    const bestComboFoodIcon = root.querySelector(".ap-engr-best-combo-food-icon");
    if (bestComboFoodIcon) bestComboFoodIcon.style.display = isSurge ? "" : "none";

    if (!result) return;

    // The readout's base stat (RAID_CAPTAIN_BASE_MOVE_SPEED above) assumes
    // the reader is already eating an Atk/Move Speed feast - the feast icon
    // at the end of the line flags that assumption inline instead of leaving
    // it as a silent premise the reader has to already know. Sits after the
    // text (not before) so the line reads as plain text first, with the icon
    // as a trailing annotation rather than competing with "Raid Captain
    // Efficiency" for the reader's first glance.
    function appendFeastIcon(el) {
      const icon = document.createElement("img");
      icon.className = "skill-icon ap-engr-feast-icon";
      icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "icon-feast.png");
      icon.alt = "Feast";
      icon.title = "Assumes an Atk/Move Speed feast is active.";
      icon.loading = "lazy";
      // "display" mode (not the default visibility:hidden) - a missing
      // icon should collapse the gap entirely rather than leave a blank
      // 1em space sitting after "Raid Captain Efficiency: ...".
      window.SiteUtils.hideOnError(icon, "display");
      el.appendChild(icon);
    }

    // Displayed as Raid Captain Efficiency - % of the way from 0% bonus
    // (exactly 100% Move Speed) to the 140% cap - rather than the raw
    // Move Speed % itself. result.moveSpeed is already the correct
    // time-weighted expected value across capped/uncapped states (see
    // raidCaptainMoveSpeed/expectedCappedMoveSpeed above - this block
    // doesn't change that math at all), but labeling it as a
    // literal live "Move Speed" stat misled readers sitting near the cap
    // most of the time into reading e.g. "139.xx% (140% cap)" as a bug
    // ("why isn't this 140?") rather than the correct EV it was. Same
    // concept as loa-logs' own "Raid Captain Efficiency" stat (damage
    // actually gained from the engraving / damage if capped the whole
    // fight - 0% = never above base Move Speed, 100% = capped the entire
    // fight), just computed here from the modeled inputs instead of a
    // real log.
    const msEl = root.querySelector(".ap-engr-ms-readout");
    if (msEl) {
      const rcEfficiency = Math.max(0, Math.min(100, (result.moveSpeed - 100) / (RAID_CAPTAIN_MOVE_SPEED_CAP - 100) * 100));
      msEl.textContent = "Raid Captain Efficiency: " + rcEfficiency.toFixed(2) + "% ";
      msEl.title = "% of Raid Captain's potential damage bonus you're capturing - 0% means never above base Move Speed, 100% means capped (140% Move Speed) the entire fight.";
      appendFeastIcon(msEl);
    }

    const foodNoteEl = root.querySelector(".ap-engr-manafood-note");
    if (foodNoteEl) {
      if (!isSurge || result.wineVsManaFood === null) {
        foodNoteEl.style.display = "none";
      } else {
        foodNoteEl.style.display = "";
        const pct = result.wineVsManaFood * 100;
        const manaFoodWord = manaFoodHasBleed ? "Mana Food + Bleed" : "Mana Food";
        const winner = pct >= 0 ? manaFoodWord : "Vernese Wine";
        const loser = pct >= 0 ? "Vernese Wine" : manaFoodWord;
        // Worded as a complete-setup comparison (not "Raid Captain gained
        // X%") because that's what raidCaptainWineVsManaFood actually
        // computes - it multiplies RC's own food-dependent Move Speed
        // swing together with Mana Food's Main Stat + Bleed contribution
        // (see that function's own comment), so this % is "how much
        // better is the whole setup", not RC's isolated share of it.
        // Also worth noting for future edits here: raidCaptainWineVsManaFood
        // only swaps wine/manaFood - RC's Node level/Stone, Maelstrom
        // Uptime %, Rage Rune, and Support AV all come straight from
        // whatever's currently configured above, food is the only axis
        // actually being varied between the two sides of this comparison.
        // No "RC:" prefix on the text itself - the card it sits in is
        // named "Raid Captain Variables" now, so that context is already
        // established without repeating it on every line inside it.
        foodNoteEl.textContent =
          winner + " beats " + loser + " by " + Math.abs(pct).toFixed(2) + "%.";
      }
    }

    // 222's own caveat lives in the checkbox label's tooltip rather than
    // its own row below the checkbox, so a reader not on 222 doesn't pay
    // for a row that's never relevant to them. Appended (not swapped in) since the label's base text -
    // the Main Stat double-counting caveat - applies to every spec/build;
    // only the 222 aside is build-specific info, not a spec-conditional
    // rewrite of the base text itself (contrast SPEC_NOTE_TEXT_RE/SURGE
    // above, which really are two different messages for the same
    // trigger). Gated on is222Build specifically (not isSurge) - it's the
    // actual reason 222's own Mana Food is Main-Stat-only above, so
    // 111/333 Surge don't carry an aside that was never about them. Lives on the checkbox label itself (not a dedicated icon) -
    // see ap-brace-tooltip.js's own comment on why a persistent element
    // like this one needs its title kept in sync on every recompute
    // rather than just set once.
    const manaFoodCheckboxLabelEl = root.querySelector(".ap-engr-manafood-row .ap-engr-checkbox-label");
    if (manaFoodCheckboxLabelEl) {
      manaFoodCheckboxLabelEl.title = MANAFOOD_TIP_BASE_TEXT + (is222Build(root) ? MANAFOOD_TIP_222_SUFFIX : "");
    }

    const rowsContainer = root.querySelector(".ap-engr-contrib-rows");
    if (rowsContainer) {
      rowsContainer.innerHTML = "";
      const stoneKeyByLabel = {
        Grudge: "grudge",
        "Ambush Master": "ambush",
        Adrenaline: "adrenaline",
        "Raid Captain": "rc",
        "Keen Blunt Weapon": "kbw",
        "Cursed Doll": "cd",
        "Mass Increase": "mi",
      };
      result.rows.forEach((row) => {
        const tr = document.createElement("tr");
        const labelTd = window.SiteUtils.el("td", "ap-brace-row-label", row.label);
        if (row.note) {
          // Same .ap-brace-info-icon pattern as renderComparisonRows'
          // own identical use above (native `title` hover instead of a
          // permanent note line) - a dagger plus a full-width footnote <tr>
          // would cost a whole extra row just for Mana Food's one
          // Surge-only caveat. Using the same icon as the rest of the page
          // means Adrenaline/Ability Stone Base AP/Mana Food's notes all
          // render the same way, and none of them cost vertical space
          // unless hovered.
          const infoIcon = window.SiteUtils.el("span", "ap-brace-info-icon", "i");
          infoIcon.title = row.note;
          infoIcon.setAttribute("role", "img");
          infoIcon.setAttribute("aria-label", row.note);
          labelTd.appendChild(infoIcon);
        }
        tr.appendChild(labelTd);
        tr.appendChild(window.SiteUtils.el("td", "ap-brace-tier-val", formatPctBare(row.gain)));
        const stoneKey = stoneKeyByLabel[row.label];
        const levels = stoneKey ? result.stoneBreakdown[stoneKey] : null;
        for (let i = 0; i < 4; i++) {
          tr.appendChild(window.SiteUtils.el("td", "ap-brace-tier-val ap-engr-stone-col", levels ? formatPctBare(levels[i]) : "—"));
        }
        rowsContainer.appendChild(tr);
      });
    }

    function fillCard(prefix, candidate) {
      const comboEl = root.querySelector("." + prefix + "-combo");
      const keystoneEl = root.querySelector("." + prefix + "-keystone");
      // Same 3-row breakdown Setup A/B's renderEngravingSvsCard sets below
      // (Engraving Bonus, Ability Stone Engraving Bonus, Ability Stone
      // Base AP) - see engravingCandidateBreakdown's own comment for what
      // each isolates, and why there's no separate "Keystone/Crit" row
      // here (KBW/Adrenaline's own grid contribution is already folded
      // into the two Stone-aware buckets, not left as a residual). "—" on
      // a missing candidate (no Runner-Up when only one candidate exists)
      // matches comboEl/keystoneEl's own fallback just below.
      const set = (cls, text) => {
        const el = root.querySelector("." + prefix + "-" + cls);
        if (el) el.textContent = text;
      };
      if (!candidate) {
        if (comboEl) comboEl.textContent = "—";
        if (keystoneEl) keystoneEl.textContent = "—";
        ["engr-gain", "stone-engr-gain", "stone-ap"].forEach((cls) => set(cls, "—"));
        return;
      }
      if (comboEl) comboEl.textContent = engravingComboLabel(candidate.flags);
      if (keystoneEl) {
        keystoneEl.textContent = candidate.combo.split.label + " + " + KEYSTONE_LABELS[candidate.combo.pair];
      }
      set("engr-gain", formatBvbPct(candidate.breakdown.engravingGain));
      set("stone-engr-gain", formatBvbPct(candidate.breakdown.stoneEngravingGain));
      set("stone-ap", formatBvbPct(candidate.breakdown.stoneBaseApGain));
    }
    fillCard("ap-engr-best", result.winner);
    fillCard("ap-engr-runnerup", result.runnerUp);

    const vsEl = root.querySelector(".ap-engr-best-vs-runnerup");
    if (vsEl) {
      if (result.winner && result.runnerUp) {
        const diff = (result.winner.totalMult / result.runnerUp.totalMult - 1) * 100;
        vsEl.textContent = "+" + diff.toFixed(2) + "%";
      } else {
        vsEl.textContent = "—";
      }
    }

    // Overall Best Setup: see computeOverallBestEngravingSetup's own
    // comment for why this is a separate question from Best Combo above
    // it (best combo for THIS food vs. best complete combo+food setup
    // overall) - Surge only, same gate as the Mana Food note above.
    const overallBestEl = root.querySelector(".ap-engr-overall-best-note");
    if (overallBestEl) {
      if (!overallBest) {
        overallBestEl.style.display = "none";
      } else {
        overallBestEl.style.display = "";
        const pct = overallBest.pctVsOther * 100;
        overallBestEl.textContent =
          "Overall Best Setup: " + overallBest.comboLabel + " with " + overallBest.foodLabel +
          " (+" + Math.abs(pct).toFixed(2) + "% vs the best " + overallBest.otherFoodLabel + " setup).";
      }
    }
  }

  // ----- Setup A vs. Setup B rendering -----
  // Same shape as renderBvbCard/renderBraceletVsBracelet just above it in
  // spirit (per-side card fill, then a shared verdict pill) - kept as its
  // own function rather than reused directly since the two features fill
  // different fields (a keystone/split + single vs-neither % here, vs
  // bracelet's 5-row breakdown) and, more importantly, share none of
  // their target classes - see enforceEngravingSvsSlotExclusivity's own
  // comment for why the class names can't overlap with .ap-bvb-*.
  function renderEngravingSvsCard(root, prefix, side) {
    const set = (selector, text) => {
      const el = root.querySelector(selector);
      if (el) el.textContent = text;
    };
    set(".ap-esvs-" + prefix + "-vs-none", formatBvbPct(side.vsNeither));
    set(".ap-esvs-" + prefix + "-keystone", side.splitLabel + " + " + side.keystoneLabel);
    // Same 3-row breakdown as Best Combo/Runner-Up's fillCard (see
    // engravingCandidateBreakdown's own comment) - "Ability Stone Base AP"
    // is part of this group (not a separate row under vs No Setup). No
    // separate "Keystone/Crit" row - see fillCard's own comment for why.
    set(".ap-esvs-" + prefix + "-engr-gain", formatBvbPct(side.breakdown.engravingGain));
    set(".ap-esvs-" + prefix + "-stone-engr-gain", formatBvbPct(side.breakdown.stoneEngravingGain));
    set(".ap-esvs-" + prefix + "-stone-ap", formatBvbPct(side.breakdown.stoneBaseApGain));
  }

  function renderEngravingSetupComparison(root, result, overallBest, isSurge) {
    // "Uses whichever food is currently selected..." only means anything
    // where a food choice (Wine vs. Mana Food) exists to select between -
    // RE has no such choice (same manaFoodContributionGain gate as every
    // other food-specific note on this page), so on RE this icon was
    // pointing at a caveat, and an "Overall Best Setup below" that's ALSO
    // hidden for RE (computeOverallBestEngravingSetupAB returns null
    // there), that don't exist. Checked ahead of the `!result` guard
    // below since computeEngravingSetupComparison itself isn't spec-gated
    // (Setup A/B's core comparison still runs on RE) - only this food
    // caveat is Surge-only.
    const foodIcon = root.querySelector(".ap-esvs-food-icon");
    if (foodIcon) foodIcon.style.display = isSurge ? "" : "none";

    if (!result) return;
    renderEngravingSvsCard(root, "a", result.a);
    renderEngravingSvsCard(root, "b", result.b);

    const noneEl = root.querySelector(".ap-esvs-no-setup-keystone");
    if (noneEl) noneEl.textContent = result.neither.splitLabel + " + " + result.neither.keystoneLabel;

    // Same "selected answer" pill treatment as .ap-bvb-diff, colored in
    // whichever side actually won (pink for A, teal for B) - see that
    // rule's own comment for why the two features can't literally share
    // the .ap-bvb-diff class despite wanting the identical look.
    const diffEl = root.querySelector(".ap-esvs-diff");
    if (diffEl) {
      const aWins = result.aVsB >= 0;
      diffEl.textContent = (aWins ? "Setup A" : "Setup B") + " wins by " + formatBvbPct(Math.abs(result.aVsB));
      diffEl.classList.toggle("ap-esvs-diff-a", aWins);
      diffEl.classList.toggle("ap-esvs-diff-b", !aWins);
    }

    const keystoneNoteEl = root.querySelector(".ap-esvs-keystone-note");
    if (keystoneNoteEl) keystoneNoteEl.hidden = !result.keystonesDiffer;

    // See computeOverallBestEngravingSetupAB's own comment: aVsB above is
    // locked to whichever food is currently selected, this instead lets
    // each named setup use its own best food before comparing. Surge
    // only, same gate/hide pattern as the Best Combo panel's own overall-
    // best note.
    const overallBestEl = root.querySelector(".ap-esvs-overall-best-note");
    if (overallBestEl) {
      if (!overallBest) {
        overallBestEl.style.display = "none";
      } else {
        overallBestEl.style.display = "";
        const pct = overallBest.pctVsRunnerUp * 100;
        overallBestEl.textContent =
          "Overall Best: " + overallBest.winnerLabel +
          " (+" + pct.toFixed(2) + "% vs the best " + overallBest.otherLabel + " setup).";
      }
    }
  }


  // ----- Local storage persistence -----
  // Saves every field's current value under one key so a reader filling
  // this out doesn't have to redo it on every reload. Best-effort: some
  // browsers/private-mode sessions block storage entirely, so every call
  // is wrapped and failures are silently ignored - the calculator still
  // works perfectly without persistence, it just won't remember next time.
  //
  // Presets: 3 independent storage slots rather than 1. Slot 1 uses the
  // original STORAGE_KEY, so data saved before presets existed loads as
  // "Preset 1". Slots 2/3 are empty until the reader saves into them.
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
  //
  // skippedOut, if passed, collects every key from `data` that was NOT
  // applied - either a <select> value that doesn't match any current
  // option, or an id that doesn't correspond to any field on the page at
  // all. Both cases fail silently by default (the localStorage
  // round-trip path wants that - a stale saved value quietly falling
  // back to the authored default is correct there), but for a pasted/
  // uploaded Import the person has no other way to find out a field
  // didn't take - see applyImportText's use of this.
  function applyFieldData(root, data, skippedOut) {
    if (!data || typeof data !== "object") return;
    const seen = {};
    root.querySelectorAll("input, select").forEach((el) => {
      if (!el.id || !(el.id in data)) return;
      seen[el.id] = true;
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = !!data[el.id];
      } else if (el.tagName === "SELECT") {
        // Only restore if the stored value still matches a real option -
        // if a future edit ever renames/removes an option's value, a
        // stale stored value would otherwise leave the select showing no
        // selection at all (selectedIndex -1) instead of falling back to
        // the authored default.
        const stillValid = Array.from(el.options).some((opt) => opt.value === data[el.id]);
        if (stillValid) {
          el.value = data[el.id];
        } else if (skippedOut) {
          skippedOut.push(el.id);
        }
      } else {
        el.value = data[el.id];
      }
    });
    if (skippedOut) {
      Object.keys(data).forEach((id) => {
        if (!seen[id]) skippedOut.push(id);
      });
    }
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
    normalizeExclusiveGroup(root, SPEED_FOOD_GROUP);
    syncSpeedChoiceFamilyTracking(root);
    syncFamilyVariantMemory(root);
    syncMaelstromUptimeGroupTracking(root);
    resetAvbMemory(root);
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
    normalizeExclusiveGroups(root);
    syncSpeedChoiceFamilyTracking(root);
    syncFamilyVariantMemory(root);
    syncMaelstromUptimeGroupTracking(root);
    resetAvbMemory(root);
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
    const skipped = [];
    resetFieldsToDefaults(root);
    applyFieldData(root, data, skipped);
    normalizeExclusiveGroups(root);
    syncSpeedChoiceFamilyTracking(root);
    syncFamilyVariantMemory(root);
    syncMaelstromUptimeGroupTracking(root);
    resetAvbMemory(root);
    saveInputs(root, activeId);
    update(root);
    let msg = "Imported into Preset " + activeId + ".";
    // Tell the person when something in their paste didn't take, instead
    // of letting it fail silently - a stale/renamed select option value
    // or an id that doesn't exist on this page otherwise looks identical
    // to a successful import (see applyFieldData's skippedOut comment).
    if (skipped.length) {
      msg += " " + skipped.length + " field" + (skipped.length === 1 ? "" : "s") +
        " in that data didn't match anything on this page and " +
        (skipped.length === 1 ? "was" : "were") + " left as-is: " + skipped.join(", ") + ".";
    }
    showPopoverMessage(popoverEl, msg, skipped.length > 0);
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
  // still means Support is active, so these fields should stay enabled in
  // that case - only an unchecked .ap-yearning turns them off. Support:
  // Artist/Valkyrie and Paladin (Engraving Comparison's own Move Speed
  // checkboxes) are the same shape - support-only sources, not tied to
  // any character-side gear input, but the reader still shouldn't be able
  // to claim either while Passionate Dance itself is off, so both ride
  // the same gate as the others. Strength Orb and Flash Orb are both
  // Support's Drops of Ether engraving, same "no Support, no orb"
  // dependency as the AP buff. The Crit Rate/Crit Dmg Bracelet selects are
  // the same shape again - Support's own bracelet lines, not claimable
  // without a Support in the party.
  //
  // This only disables the controls in the UI - it does NOT clear a value
  // already sitting in a disabled control's DOM, so a tier/uptime picked
  // while Support was checked would otherwise keep silently counting after
  // Support is unchecked (a real bug: None+Support-off and High+Support-off
  // produced different effective Crit Rate, when both should read as "no
  // Support" identically). Support AP Buff Uptime is naturally immune since
  // supportApBuff() has its own code-level `if (!inputs.gearSupport) return
  // 0;` guard; Flash Orb Uptime, Strength Orb Uptime, and the two bracelet
  // selects did NOT have an equivalent guard and needed one added - see
  // readInputs' own code-level gate, which zeroes all four whenever
  // Support isn't checked, on top of this UI-only disable.
  function enforceGearSupportUptimeGate(root) {
    const yearningEl = root.querySelector(".ap-yearning");
    if (!yearningEl) return;
    [
      ".ap-gear-support-uptime",
      ".ap-gear-strength-orb-uptime",
      ".ap-flash-orb-uptime",
      ".ap-engr-support-av",
      ".ap-engr-support-paladin",
      ".ap-support-crit-rate-bracelet",
      ".ap-support-crit-dmg-bracelet",
    ].forEach((selector) => {
      const el = root.querySelector(selector);
      if (el) el.disabled = !yearningEl.checked;
    });
  }

  function update(root) {
    syncBuildToggleUI(root);
    enforcePartyCheckboxLimit(root);
    enforceKbwStoneDependency(root);
    enforceGearSupportUptimeGate(root);
    // Exclusivity first: it can reset a stale line's type (Basic Effect 2
    // just claimed "stat_main" out from under it) - Controls needs to run
    // AFTER that reset, not before, or it swaps each line's tier/mainstat
    // visibility using the OLD type value and leaves the wrong one shown
    // (e.g. a freshly-reset-to-None line still displaying a Main Stat
    // input box instead of the tier dropdown a real "None" line should
    // show) until the next unrelated input happens to re-run this pair.
    enforceBvbLineExclusivity(root);
    enforceBvbLineControls(root);
    enforceAvbSlotUI(root);
    enforceAvbLineControls(root);
    enforceEngravingStoneExclusivity(root);
    // Slots first: the stone targets of a Setup side depend on which
    // engravings its two Option slots hold after this pass.
    enforceEngravingSvsSlotExclusivity(root, isSurgeBuild(root));
    enforceSvsStoneTargets(root, "ap-esvs-a");
    enforceSvsStoneTargets(root, "ap-esvs-b");
    enforceStoneSlotExclusivity(root, "ap-esvs-a", svsAllowedStoneTargets(root, "ap-esvs-a"));
    enforceStoneSlotExclusivity(root, "ap-esvs-b", svsAllowedStoneTargets(root, "ap-esvs-b"));

    // Top Combinations pin: resolve this root's stored { splitKey, pair }
    // (if any) and make it the active pin for bestComboFor - see
    // activePinnedCombo's own comment above for why this is a module-
    // level set/clear around the compute/render chain rather than a
    // parameter threaded through it. The finally guarantees it's cleared
    // even if a compute* call below throws, so a mid-update error here
    // can never leave a stale pin bleeding into some later, unrelated
    // update() call (this root's next one, or another .ap-calc root's).
    const selection = getApCalcSelection(root);
    activePinnedCombo = resolvePinnedCombo(selection.pinnedCombo, getCheckbox(root, ".ap-ot1", false));
    // A pin made under the other split set (Optimized Training just got
    // toggled) has no matching combo. Drop it outright instead of
    // leaving a dead pin behind: renderGrid reads selection.pinnedCombo
    // directly, and a non-null-but-unresolvable pin would disable the
    // rows' click-to-preview with nothing actually pinned.
    if (selection.pinnedCombo && !activePinnedCombo) {
      selection.pinnedCombo = null;
      selection.previewRank = 1;
    }
    try {
      const inputs = readInputs(root);
      const result = computeGridAndSummary(inputs);
      result.ot1CostPct = inputs.optimizedTraining ? computeOt1CostPct(inputs, result) : null;
      renderGrid(root, result);
      updateInputDisplays(root, inputs);
      renderBraceletComparison(root, computeBraceletComparison(inputs));
      renderBraceletVsBracelet(root, inputs, computeBraceletVsBracelet(inputs));
      renderAccessoryComparison(root, computeAccessoryComparison(inputs));
      renderAccessoryVsAccessory(root, computeAccessoryVsAccessory(inputs));
      renderArkGridComparison(root, computeArkGridComparison(inputs));
      const engrInputs = readEngravingInputs(root);
      renderEngravingComparison(
        root,
        computeEngravingComparison(inputs, engrInputs),
        engrInputs,
        computeOverallBestEngravingSetup(inputs, engrInputs)
      );
      const svsA = readEngravingSvsSide(root, "a");
      const svsB = readEngravingSvsSide(root, "b");
      renderEngravingSetupComparison(
        root,
        computeEngravingSetupComparison(inputs, engrInputs, svsA, svsB),
        computeOverallBestEngravingSetupAB(inputs, engrInputs, svsA, svsB),
        engrInputs.spec === "surge"
      );
    } finally {
      activePinnedCombo = null;
    }
  }

  // Mutually exclusive controls. Each entry is a set of controls of which at
  // most one can count as active at once; one table drives both ways that
  // can be enforced:
  //   - wireExclusiveGroups: a real "change" on a member clears the others,
  //     so the member just touched wins.
  //   - normalizeExclusiveGroups: bulk mutations set fields without
  //     dispatching "change" (init, preset switch, import), so a stale or
  //     hand-edited save can arrive with several members active. Each group
  //     is resolved by keeping the first active member in `members` order
  //     and clearing the rest - that order is the tie-break.
  // A member is a checkbox (active = checked) or, when it has `none`, a
  // select whose `none` value means "not chosen".
  //   - chaosCoreSlot: Flashy / Stable / Swift are the same Chaos Core
  //     equipment slot, so only one can be a real tier. Stable wins over
  //     Flashy, which wins over Swift.
  //   - chaosCoreGear: Chaos Core: Attack and Chaos Core: Weapon are the same
  //     slot too; Attack wins.
  //   - raidContribution: Kazeros and Guardian are "which raid am I in"
  //     buffs, and only one raid is ever active; Kazeros wins.
  //   - supportMoveSpeed: only one Support's kit is in the raid, so Artist/
  //     Valkyrie and Paladin are never both a party-wide Move Speed source;
  //     Artist/Valkyrie wins.
  //   - speedFood: Vernese Wine, Mana Food (Main Stat only, Surge 111/333) and
  //     Mana Food (+Maelstrom Bleed) are three consumable choices - only one
  //     is eaten at once. Wine feeds Raid Captain's isolated Move Speed calc
  //     (see raidCaptainMoveSpeed), Mana Food feeds its own contribution-table
  //     row (manaFoodGain). Wine wins over Mana Food, matching the crossing
  //     listener's choice to turn Mana Food off (not Wine) on landing on Surge.
  //     Only Surge treats them as competing picks: on RE, Mana Food is purely
  //     informational and Wine's row is hidden with its flag ignored (see
  //     raidCaptainMoveSpeed's spec check), so a normalize pass leaves both
  //     alone there (normalizeWhen). A live click still clears the others.
  // Resetting to defaults needs only the speedFood pass: its raw HTML defaults
  // tick both Wine and Mana Food (Wine for Surge, Mana Food for RE - see the
  // crossing listener in initApCalcRoot), while every other group's defaults
  // are conflict-free.
  const SPEED_FOOD_GROUP = {
    name: "speedFood",
    members: [{ sel: ".ap-engr-wine" }, { sel: ".ap-engr-manafood-main" }, { sel: ".ap-engr-manafood" }],
    // The Main Stat only food exists on Surge 111 and 333 only. A tick left
    // over anywhere else (build switched, stale export) folds into the
    // regular Mana Food box, which is what that choice means on 222 and RE.
    beforeNormalize(root) {
      const mainEl = root.querySelector(".ap-engr-manafood-main");
      const foodEl = root.querySelector(".ap-engr-manafood");
      if (mainEl && mainEl.checked && !isSurgeBleedFoodBuild(root)) {
        mainEl.checked = false;
        if (foodEl && isSurgeBuild(root)) foodEl.checked = true;
      }
    },
    normalizeWhen: isSurgeBuild,
  };
  const EXCLUSIVE_GROUPS = [
    {
      name: "chaosCoreSlot",
      members: [
        { sel: ".ap-stable-atk", none: "None|0P" },
        { sel: ".ap-flashy-atk", none: "None" },
        { sel: ".ap-swift-core", none: "None|0P" },
      ],
    },
    {
      name: "chaosCoreGear",
      members: [
        { sel: ".ap-gear-ap-chaos-star", none: "None|0P" },
        { sel: ".ap-gear-weapon-core", none: "None|0P" },
      ],
    },
    { name: "raidContribution", members: [{ sel: ".ap-gear-ap-kazeros" }, { sel: ".ap-gear-ap-guardian" }] },
    { name: "supportMoveSpeed", members: [{ sel: ".ap-engr-support-av" }, { sel: ".ap-engr-support-paladin" }] },
    SPEED_FOOD_GROUP,
  ];

  // The members of a group that exist in this root, as { el, member } pairs.
  function exclusiveMembers(root, group) {
    return group.members
      .map((member) => ({ el: root.querySelector(member.sel), member }))
      .filter((m) => m.el);
  }
  function isExclusiveMemberActive(m) {
    return m.member.none === undefined ? m.el.checked : m.el.value !== m.member.none;
  }
  function clearExclusiveMember(m) {
    if (m.member.none === undefined) m.el.checked = false;
    else m.el.value = m.member.none;
  }

  function normalizeExclusiveGroup(root, group) {
    if (group.beforeNormalize) group.beforeNormalize(root);
    if (group.normalizeWhen && !group.normalizeWhen(root)) return;
    let keptOne = false;
    exclusiveMembers(root, group).forEach((m) => {
      if (!isExclusiveMemberActive(m)) return;
      if (keptOne) clearExclusiveMember(m);
      else keptOne = true;
    });
  }
  // Called wherever fields are set in bulk without a "change" event (init,
  // preset switch, import).
  function normalizeExclusiveGroups(root) {
    EXCLUSIVE_GROUPS.forEach((group) => normalizeExclusiveGroup(root, group));
  }

  // Attached before the generic input/select loop in initApCalcRoot, so the
  // opposing members are already cleared by the time that loop's own "change"
  // listener runs update()/saveInputs() for the touched member.
  function wireExclusiveGroups(root) {
    EXCLUSIVE_GROUPS.forEach((group) => {
      const members = exclusiveMembers(root, group);
      members.forEach((m) => {
        m.el.addEventListener("change", () => {
          if (!isExclusiveMemberActive(m)) return;
          members.forEach((other) => {
            if (other !== m) clearExclusiveMember(other);
          });
        });
      });
    });
  }

  // Resyncs the "last known family" tracker the Mana Food crossing
  // listener above keys off of (buildSelectEl.dataset.lastFamilyIsSurge)
  // to whatever the build select actually ends up at after a bulk field
  // mutation. Needed alongside the speedFood normalizer (see
  // EXCLUSIVE_GROUPS), not instead of it: that pass fixes up a conflict already left behind
  // in the checkboxes' own state, while this one fixes up the crossing
  // listener's memory of what family it last saw, so the reader's VERY
  // NEXT real RE<->Surge click still gets detected as a crossing instead
  // of silently comparing against a stale remembered family and skipping
  // the Mana Food default flip (see that listener's own comment for the
  // full failure mode this resolves).
  function syncSpeedChoiceFamilyTracking(root) {
    const buildSelectEl = root.querySelector(".ap-brace-spec-build");
    if (!buildSelectEl) return;
    buildSelectEl.dataset.lastFamilyIsSurge = isSurgeBuild(root) ? "1" : "0";
  }

  // Same fix, same reason, as syncSpeedChoiceFamilyTracking above - but
  // for the Maelstrom Uptime default-group crossing listener's own "last
  // known group" memory (buildSelectEl.dataset.lastMaelstromGroup, see
  // that listener's own comment in initApCalcRoot). Called alongside the
  // other sync* functions from every bulk field mutation (Reset, preset
  // switch, import, init) for the same reason: those all set the build
  // select's value directly without dispatching "change", so a stale
  // remembered group could otherwise miss the reader's very next real
  // group crossing.
  function syncMaelstromUptimeGroupTracking(root) {
    const buildSelectEl = root.querySelector(".ap-brace-spec-build");
    if (!buildSelectEl) return;
    buildSelectEl.dataset.lastMaelstromGroup = maelstromUptimeDefaultGroup(root);
  }

  // Same fix, same reason, as syncSpeedChoiceFamilyTracking above - but
  // for the per-family "last variant used" memory the Family chip
  // crossing listener reads (see initApCalcRoot's buildSelectEl block:
  // rememberVariant/FAMILY_CROSSING_MAP). That memory can't live in a
  // plain closure variable private to initApCalcRoot, which would only
  // update on the build select's "change" event - but Reset to
  // defaults/preset switch/import all set the select's value directly
  // via resetFieldsToDefaults WITHOUT dispatching "change" (same
  // no-dispatch fact that motivated lastFamilyIsSurge's own dataset
  // move), so such a closure would never hear about it and would keep remembering
  // whatever variant was last actually clicked. Concretely: click Surge
  // 333, hit Reset (form snaps back to the RE 333 / Surge 222 authored
  // defaults), then click the Surge Family chip again - the reader
  // would land back on 333, not the fixed 222 default, because nothing
  // ever told the memory Reset had happened. Keeping it on
  // buildSelectEl.dataset (reMemory/surgeMemory) instead of a closure
  // makes it reachable from here, so it can be wiped and reseeded from
  // whatever the select actually ends up at, same as the other tracker.
  function syncFamilyVariantMemory(root) {
    const buildSelectEl = root.querySelector(".ap-brace-spec-build");
    if (!buildSelectEl) return;
    delete buildSelectEl.dataset.reMemory;
    delete buildSelectEl.dataset.surgeMemory;
    const current = normalizeBraceSpecBuild(buildSelectEl.value);
    const family = (BRACE_SPEC_BUILDS[current] && BRACE_SPEC_BUILDS[current].isSurge) ? "surge" : "re";
    buildSelectEl.dataset[family + "Memory"] = current;
  }

  // Same bug, same fix, as syncFamilyVariantMemory/lastFamilyIsSurge
  // above, for Accessory vs. Accessory's per-slot "remember Main
  // Stat/Line 3/Other tier per slot" memory (see the full writeup on
  // this feature at the .ap-avb-slot change listener in
  // initApCalcRoot). That memory can't live in plain closure
  // variables private to initApCalcRoot (avbMainStatMemory/
  // avbLine3Memory/avbOtherMemory/avbLastSlot), updated only via that
  // listener's "change" event - because resetFieldsToDefaults (used by
  // Reset to defaults, preset switch, AND Import) sets the AVB fields'
  // values directly without dispatching "change", so such a closure would never
  // find out and would keep remembering pre-reset values under a now-stale
  // avbLastSlot key. Concretely: dial in a real Ring value, switch to
  // Earring, hit Import (even importing back the SAME export - AVB
  // fields have no id attributes on purpose, see this project's own
  // notes on that, so they're never touched by the imported data
  // itself, only reset to their HTML defaults by the shared
  // resetFieldsToDefaults step Import also runs) - the very next real
  // switch back to Ring then saves the just-reset Necklace-shaped
  // default under the stale "Earring" key and hands back garbage for
  // Ring instead of the real value that was there before Import.
  // Kept in a WeakMap keyed by root (mirrors buildSelectEl.dataset's
  // role for the Family/Surge fix - just structured data instead of
  // strings, so dataset itself doesn't fit) so it's reachable and
  // resettable from resetInputs/switchPreset/applyImportText/
  // initApCalcRoot the same way. resetAvbMemory MUTATES the existing
  // object in place rather than swapping in a new one - the change
  // listener in initApCalcRoot captures getAvbMemory(root)'s return
  // value ONCE into a local const when it's set up, so replacing the
  // WeakMap entry wholesale would leave that already-captured reference
  // pointing at the old (stale) object forever, silently defeating the
  // whole reset. Caught this via Playwright: banked a real per-slot
  // value, Reset/Import, switched slots again, and the "wiped" value
  // was still there.
  const avbMemoryStore = new WeakMap();
  function getAvbMemory(root) {
    let mem = avbMemoryStore.get(root);
    if (!mem) {
      mem = freshAvbMemory(root);
      avbMemoryStore.set(root, mem);
    }
    return mem;
  }
  function freshAvbMemory(root) {
    const avbSlotEl = root.querySelector(".ap-avb-slot");
    return {
      mainStat: { a: {}, b: {} },
      line3: { a: {}, b: {} },
      other: { line1: {}, line2: {} },
      lastSlot: avbSlotEl ? avbSlotEl.value : "necklace",
    };
  }
  function resetAvbMemory(root) {
    const mem = getAvbMemory(root);
    const fresh = freshAvbMemory(root);
    mem.mainStat = fresh.mainStat;
    mem.line3 = fresh.line3;
    mem.other = fresh.other;
    mem.lastSlot = fresh.lastSlot;
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

  // Only 2 Ability Stone slots exist in-game, so any section's own 2
  // isolated slots can't both target the same engraving. Originally this
  // let you pick a duplicate and then reset the OTHER slot back to
  // "None" after the fact (the same pattern normalizeExclusiveGroups
  // uses) - fine for the old 2-separate-rows layout, but once Stone 1 and
  // Stone 2 sat side by side in one merged row it read as a bug (you
  // could select Stone 2 = Grudge while Stone 1 was already Grudge, and
  // watch Stone 1 silently flip to None). Switched to the same "disable
  // the option outright, don't let it be picked" approach
  // enforceEngravingSvsSlotExclusivity already uses for its own
  // Setup A/B slots - each select disables whichever non-"None" option
  // the OTHER select currently holds, so a duplicate is never selectable
  // to begin with. Also disables each slot's level select while its
  // target is "None", matching enforceKbwStoneDependency's own
  // disabled-while-unused treatment. Parameterized by class prefix so
  // the Engraving Comparison section's own pair (ap-engr-stone1/2-*) and
  // Setup A vs Setup B's two independent pairs (ap-esvs-a-stone1/2-*,
  // ap-esvs-b-stone1/2-*) can all share one implementation instead of
  // three copies of the same function.
  function enforceStoneSlotExclusivity(root, prefix, allowed) {
    const t1 = root.querySelector("." + prefix + "-stone1-target");
    const l1 = root.querySelector("." + prefix + "-stone1-level");
    const t2 = root.querySelector("." + prefix + "-stone2-target");
    const l2 = root.querySelector("." + prefix + "-stone2-level");
    if (!t1 || !l1 || !t2 || !l2) return;
    // Safety net only - shouldn't be reachable via the UI since
    // duplicate options are disabled below, but a programmatic path
    // (preset load, Import, the bible-import bookmarklet) can still set
    // .value directly and skip the disabled check entirely.
    if (t1.value !== "None" && t1.value === t2.value) t2.value = "None";
    if (t1.value === "None") l1.value = "0 Lv.";
    if (t2.value === "None") l2.value = "0 Lv.";
    l1.disabled = t1.value === "None";
    l2.disabled = t2.value === "None";
    [[t1, t2], [t2, t1]].forEach(([self, other]) => {
      Array.from(self.options).forEach((opt) => {
        if (opt.value === "None") { opt.disabled = false; return; }
        opt.disabled = other.value === opt.value || (allowed ? !allowed.has(opt.value) : false);
      });
    });
  }
  function enforceEngravingStoneExclusivity(root) {
    enforceStoneSlotExclusivity(root, "ap-engr");
  }

  // A Setup A/B side equips 5 engravings: the 3 core ones plus its 2 Option
  // slots. An Ability Stone slot can only boost one of those, so a stone
  // target outside that set would be a 6th engraving. svsAllowedStoneTargets
  // returns that set; enforceSvsStoneTargets resets a target that fell out of
  // it (an Option changed after the stone was picked, a programmatic load)
  // to None, and enforceStoneSlotExclusivity disables the options outside it.
  const SVS_CORE_STONE_TARGETS = ["grudge", "ambush", "adrenaline"];
  function svsAllowedStoneTargets(root, prefix) {
    const allowed = new Set(SVS_CORE_STONE_TARGETS);
    [1, 2].forEach((n) => {
      const slot = root.querySelector("." + prefix + "-slot" + n + "-type");
      if (slot && slot.value !== "none") allowed.add(slot.value);
    });
    return allowed;
  }
  function enforceSvsStoneTargets(root, prefix) {
    const allowed = svsAllowedStoneTargets(root, prefix);
    [1, 2].forEach((n) => {
      const target = root.querySelector("." + prefix + "-stone" + n + "-target");
      if (target && target.value !== "None" && !allowed.has(target.value)) target.value = "None";
    });
  }

  // Setup A vs Setup B's two engraving-slot selects (one competing
  // engraving each) mirror enforceBvbLineExclusivity's and
  // enforceStoneSlotExclusivity's "disable whatever the other slot
  // already picked" approach - disabling the duplicate option outright
  // avoids a slot silently reverting out from under whichever one the
  // reader touched second. Mass Increase is additionally disabled whenever the
  // live Playstyle toggle is on RE (it's Surge-only - see
  // the "Attack Speed (not tracked)" comment for why RE has no use for it
  // at all), and a side already holding "mi" gets reset to "none" the
  // moment RE is selected so it can't stay silently equipped as an
  // engraving that doesn't exist in the actual RE math.
  function enforceEngravingSvsSlotExclusivity(root, isSurge) {
    ["a", "b"].forEach((prefix) => {
      const sels = [1, 2]
        .map((n) => root.querySelector(".ap-esvs-" + prefix + "-slot" + n + "-type"))
        .filter(Boolean);
      if (sels.length < 2) return;
      sels.forEach((sel) => {
        if (sel.value === "mi" && !isSurge) sel.value = "none";
      });
      const usedValues = sels.map((el) => el.value);
      sels.forEach((selEl, idx) => {
        Array.from(selEl.options).forEach((opt) => {
          if (opt.value === "none") { opt.disabled = false; return; }
          const dupUsed = usedValues.some((v, otherIdx) => otherIdx !== idx && v === opt.value);
          opt.disabled = dupUsed || (opt.value === "mi" && !isSurge);
        });
      });
    });
  }

  // Bracelet vs. Bracelet's 6 free-line rows (3 per side) each pair a type
  // <select> with either a Low/Mid/High tier <select> or, for STR/DEX/INT
  // only, a direct 10000-16000 number input in its place - real STR/DEX/INT
  // rolls land on values a 3-tier dropdown can't represent, so that one
  // line type gets a free-typed field instead. Rather than two permanently
  // visible controls, the tier dropdown IS the STR/DEX/INT input's slot:
  // whichever one doesn't match the current type is hidden (and disabled,
  // so a hidden field can't leave a stray out-of-range style or receive
  // focus via Tab), so picking STR/DEX/INT visibly swaps the dropdown for
  // an input right in place rather than adding a whole new row. The
  // Damage+CD line type's "estimated" caveat icon lives beside the card's
  // vs No Bracelet result instead of inline here (see renderBvbCard):
  // inline, it would shrink that row's type <select> to fit the icon, so
  // its box would read as a different width than the other two rows.
  // Also toggles the two per-side "Other Lines" checkboxes (vs Demons,
  // CD Estimate - see braceletFlatLineGain's own comment for what each
  // does) on/off alongside each line row's tier/mainstat swap: each only
  // makes sense - and only shows - while its matching line type (add_b,
  // damage_cd) is actually picked in one of that side's 3 free lines. Both
  // are per-SIDE rather than per-line since a real bracelet can only roll
  // one of either type at once (enforceBvbLineExclusivity), so one checkbox
  // each covers whichever of the 3 rows currently holds that type.
  function enforceBvbLineControls(root) {
    ["a", "b"].forEach((prefix) => {
      // Basic Effect 2: same tier/mainstat-style swap as each free line
      // row below, just between the Crit Stat input and the Main Stat
      // input (and both hidden while "None" is picked) - see the
      // ap-bvb-cards comment in resources.md for why this field exists.
      const effect2TypeEl = root.querySelector(".ap-bvb-" + prefix + "-effect2-type");
      if (effect2TypeEl) {
        const critEl = root.querySelector(".ap-bvb-" + prefix + "-crit");
        const effect2MainStatEl = root.querySelector(".ap-bvb-" + prefix + "-effect2-mainstat");
        const effect2Type = effect2TypeEl.value;
        // hidden only, deliberately NOT disabled - .ap-calc-field-row
        // dims its whole row (opacity 0.45, see extra.css) whenever ANY
        // input/select inside it is :disabled, a signal meant for a row
        // that's genuinely inapplicable right now (KBW's stone level,
        // Party & Positioning past its 3-of-5 cap). This row is always
        // applicable - exactly one of Crit Stat/Main Stat is just hidden
        // in favor of the other - so disabling the hidden one would
        // falsely grey out the whole row even while a real value (Crit
        // or Main Stat) is actively selected.
        if (critEl) critEl.hidden = effect2Type !== "crit";
        if (effect2MainStatEl) effect2MainStatEl.hidden = effect2Type !== "main";
      }

      let hasAddB = false;
      let hasDamageCd = false;
      [1, 2, 3].forEach((n) => {
        const base = ".ap-bvb-" + prefix + "-line" + n;
        const typeEl = root.querySelector(base + "-type");
        if (!typeEl) return;
        const tierEl = root.querySelector(base + "-tier");
        const mainStatEl = root.querySelector(base + "-mainstat");
        const isStatMain = typeEl.value === "stat_main";
        // "None" has no BRACELET_LINE_TYPES entry at all (computeSingle
        // Bracelet's own `if (!def) return;` just skips it), so it has no
        // tier to speak of either - hide the tier dropdown for it too,
        // same as stat_main, rather than leaving a Low/Mid/High selector
        // sitting next to a line that isn't actually valuing anything.
        const isNone = typeEl.value === "none";
        if (tierEl) { tierEl.hidden = isStatMain || isNone; tierEl.disabled = isStatMain || isNone; }
        if (mainStatEl) { mainStatEl.hidden = !isStatMain; mainStatEl.disabled = !isStatMain; }
        if (typeEl.value === "add_b") hasAddB = true;
        if (typeEl.value === "damage_cd") hasDamageCd = true;
      });
      const demonsWrap = root.querySelector(".ap-bvb-" + prefix + "-demons-wrap");
      const demonsEl = root.querySelector(".ap-bvb-" + prefix + "-demons");
      if (demonsWrap) demonsWrap.hidden = !hasAddB;
      if (demonsEl) demonsEl.disabled = !hasAddB;
      const cdestWrap = root.querySelector(".ap-bvb-" + prefix + "-cdest-wrap");
      const cdestEl = root.querySelector(".ap-bvb-" + prefix + "-cdest");
      if (cdestWrap) cdestWrap.hidden = !hasDamageCd;
      if (cdestEl) cdestEl.disabled = !hasDamageCd;
    });
  }

  // Accessory vs. Accessory's "Comparing" selector relabels the shared
  // markup for whichever slot is picked - Line 1/Line 2's field labels,
  // the Main Stat inputs' min/max (and title tooltip), the results
  // panel's Grid/Flat rows (each only meaningful for some slots - see
  // AVB_SLOT_LABELS), and the "Current X's Main Stat"/"vs No X" text.
  // Runs before readInputs in update() so Main Stat's own DOM min/max
  // are correct for whatever readAvbSide's own clamp uses that same
  // turn (that clamp doesn't actually read the DOM attribute - it goes
  // straight to ACC_MAIN_STAT_RANGE[slot] - so this is purely the
  // user-facing spinner/tooltip staying in sync, not load-bearing for
  // the math itself).
  function enforceAvbSlotUI(root) {
    const slotEl = root.querySelector(".ap-avb-slot");
    if (!slotEl) return;
    const slot = slotEl.value;
    const cfg = AVB_SLOT_LABELS[slot] || AVB_SLOT_LABELS.necklace;
    const range = ACC_MAIN_STAT_RANGE[slot] || ACC_MAIN_STAT_RANGE.necklace;

    root.querySelectorAll(".ap-avb-slot-label-vsnone").forEach((el) => {
      el.textContent = cfg.name;
    });
    root.querySelectorAll(".ap-avb-a-line1-label, .ap-avb-b-line1-label").forEach((el) => {
      el.textContent = cfg.line1;
    });
    root.querySelectorAll(".ap-avb-a-line2-label, .ap-avb-b-line2-label").forEach((el) => {
      el.textContent = cfg.line2;
    });
    root.querySelectorAll(".ap-avb-grid-label").forEach((el) => {
      el.textContent = cfg.gridLabel;
    });
    root.querySelectorAll(".ap-avb-grid-row").forEach((el) => {
      el.classList.toggle("ap-stat-card-row--hidden", !cfg.hasGrid);
    });
    root.querySelectorAll(".ap-avb-flat-row").forEach((el) => {
      el.classList.toggle("ap-stat-card-row--hidden", !cfg.hasFlat);
    });
    // Main Stat / Line 3's own row - only worth showing separately from
    // "vs No X" when there's a second axis (grid/flat) for it to be
    // distinguished FROM. See hasWpRow's own comment above AVB_SLOT_LABELS
    // - true for all three slots; the sequential mainStatLine3Ratio/
    // lineRatio split (evalSide) is what makes this a real, non-duplicate
    // number for Earring rather than a flat-out duplicate of "vs No
    // Earring".
    root.querySelectorAll(".ap-avb-wp-row").forEach((el) => {
      el.classList.toggle("ap-stat-card-row--hidden", !cfg.hasWpRow);
    });
    root.querySelectorAll(".ap-avb-lineratio-row").forEach((el) => {
      el.classList.toggle("ap-stat-card-row--hidden", !cfg.hasLineRatioRow);
    });
    // "Currently Equipped" badge on Accessory A's card title is always
    // true (there's no "Slot Currently Empty" toggle to make it not true -
    // see readInputs' own comment), so it's just static markup - nothing
    // to enforce here.
    ["a", "b"].forEach((prefix) => {
      setTierOptionValues(root.querySelector(".ap-avb-" + prefix + "-line1-tier"), cfg.line1Table, formatTierPct);
      setTierOptionValues(root.querySelector(".ap-avb-" + prefix + "-line2-tier"), cfg.line2Table, formatTierPct);
      const msEl = root.querySelector(".ap-avb-" + prefix + "-mainstat");
      if (msEl) {
        msEl.min = range.min;
        msEl.max = range.max;
        msEl.title = "This accessory's own Main Stat (" + cfg.name + " range: " + range.min.toLocaleString() + "-" + range.max.toLocaleString() + ").";
        // Clamp whatever was already typed into the new slot's range -
        // switching Ring -> Necklace otherwise leaves e.g. 12897 sitting
        // in a 15178-17857 field, which the browser flags as :invalid
        // (a red outline) since it's now below the new min.
        const current = parseFloat(msEl.value);
        if (isFinite(current)) {
          msEl.value = Math.max(range.min, Math.min(range.max, current));
        }
      }
    });
    // "Other Ring"/"Other Earring" isolated fields only make sense for
    // slots with a real second piece - hidden entirely for Necklace (see
    // AVB_SLOT_LABELS' hasOther). Its two labels reuse cfg.line1/line2
    // (Crit Rate/Crit Dmg or AP%/WP%) since it's asking about the exact
    // same two lines as the candidates, just on the piece that ISN'T
    // being swapped. Mandatory (always shown once hasOther is true, no
    // checkbox to gate visibility) - see readInputs' own comment on why.
    // setTierOptionValues below only re-stamps this pair's option LABELS
    // for whichever slot is picked - it never touches which option is
    // selected, so Ring and Earring's own last-picked tiers are kept
    // separate by the avbOtherMemory swap in the "Comparing" select's own
    // change listener (see its comment for why, and why this needs no
    // per-side A/B key the way Main Stat/Line 3 do).
    root.querySelectorAll(".ap-avb-other-row, .ap-avb-other-fields").forEach((el) => {
      el.hidden = !cfg.hasOther;
    });
    root.querySelectorAll(".ap-avb-other-slot-label").forEach((el) => {
      el.textContent = cfg.name;
    });
    root.querySelectorAll(".ap-avb-other-line1-label").forEach((el) => {
      el.textContent = cfg.line1;
    });
    root.querySelectorAll(".ap-avb-other-line2-label").forEach((el) => {
      el.textContent = cfg.line2;
    });
    setTierOptionValues(root.querySelector(".ap-avb-other-line1-tier"), cfg.line1Table, formatTierPct);
    setTierOptionValues(root.querySelector(".ap-avb-other-line2-tier"), cfg.line2Table, formatTierPct);
  }

  // Accessory vs. Accessory's Line 3 (None/Flat AP/Flat WP, one per side)
  // shows its tier <select> only once a real type is picked - same
  // show-on-pick idea as Bracelet vs. Bracelet's STR/DEX/INT swap above,
  // just toggling visibility instead of swapping which control occupies
  // the slot (Line 3 has no free-typed alternative to swap in).
  function enforceAvbLineControls(root) {
    ["a", "b"].forEach((prefix) => {
      const base = ".ap-avb-" + prefix + "-line3";
      const typeEl = root.querySelector(base + "-type");
      const tierEl = root.querySelector(base + "-tier");
      if (!typeEl || !tierEl) return;
      const hasTier = typeEl.value !== "none";
      tierEl.hidden = !hasTier;
      tierEl.disabled = !hasTier;
      // Same value-on-label treatment as Line 1/2 (see setTierOptionValues'
      // own comment) - which table applies depends on the TYPE picked
      // (Attack Power vs Weapon Power), not the slot, so this can't live
      // in enforceAvbSlotUI's per-slot cfg the way Line 1/2's tables do.
      if (typeEl.value === "ap_flat") {
        setTierOptionValues(tierEl, ACC_FLAT_AP_TABLE, (v) => v + " AP");
      } else if (typeEl.value === "wp_flat") {
        setTierOptionValues(tierEl, ACC_FLAT_WP_TABLE, (v) => v + " WP");
      }
    });
  }

  // A real bracelet can only roll one line of any given type - so within
  // a single side (A or B), once a type is picked in one of the 3 free
  // line rows, that same option gets disabled (not hidden - it needs to
  // stay visible so it's clear WHY it's greyed out) in the other 2 rows'
  // type <select>s. "— Line N: None —" is exempt, since leaving multiple
  // rows on None is normal (a bracelet doesn't need all 3 rolled), and a
  // select's own currently-chosen option is always left enabled so it
  // never locks itself out. Disabling rather than resetting means picking
  // a duplicate elsewhere just can't be done in the first place, instead
  // of silently overwriting whatever the other row already had.
  function enforceBvbLineExclusivity(root) {
    ["a", "b"].forEach((prefix) => {
      const typeEls = [1, 2, 3]
        .map((n) => root.querySelector(".ap-bvb-" + prefix + "-line" + n + "-type"))
        .filter(Boolean);
      if (typeEls.length < 2) return;
      // Basic Effect 2 = Main Stat and a free line's own "stat_main" pick
      // are the same real stat - a bracelet can't roll it twice, so
      // whichever fixed source already claims it disables "STR/DEX/INT"
      // in every free line dropdown below (same disable treatment the 3
      // free lines already give each other's duplicate types), and any
      // free line still stuck on it gets reset back to None instead of
      // silently staying selected-but-disabled and still double-counted
      // (same "reset the stale side" precedent as
      // normalizeExclusiveGroups).
      const effect2TypeEl = root.querySelector(".ap-bvb-" + prefix + "-effect2-type");
      const effect2IsMain = !!effect2TypeEl && effect2TypeEl.value === "main";
      const usedValues = typeEls.map((el) => el.value);
      typeEls.forEach((typeEl, idx) => {
        Array.from(typeEl.options).forEach((opt) => {
          if (opt.value === "none") { opt.disabled = false; return; }
          const duplicated = usedValues.some((v, otherIdx) => otherIdx !== idx && v === opt.value);
          const takenByEffect2 = opt.value === "stat_main" && effect2IsMain;
          opt.disabled = duplicated || takenByEffect2;
        });
        if (effect2IsMain && typeEl.value === "stat_main") typeEl.value = "none";
      });
    });
  }

  // ----- Initialisation -----
  // initApCalcRoot() attaches listeners directly onto the calculator's own
  // static markup instead of rebuilding it from scratch each call - so,
  // unlike the JSON-data-driven widgets registerRenderer was designed
  // for, calling this twice on the same root would double-attach
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
      normalizeExclusiveGroups(root);
      syncSpeedChoiceFamilyTracking(root);
      syncFamilyVariantMemory(root);
      syncMaelstromUptimeGroupTracking(root);
      resetAvbMemory(root);
      updatePresetButtonStates(root);

      // Top Combinations: click a row to preview its stats in the Best
      // Setup card (state.previewRank) - see getApCalcSelection and
      // renderGrid's own comment. Purely a display toggle, doesn't touch
      // any input, so it just calls update(root) directly (like
      // resetInputs/switchPreset above) rather than going through
      // scheduleUpdate's rafSchedule - there's no rapid-fire typing to
      // debounce here, just a click.
      // Disabled while a pin is active: renderGrid's cardCell always
      // resolves to pinnedCell over ranked[cardRank - 1] whenever a pin
      // exists, so changing previewRank while pinned has zero visible
      // effect on the Best Setup card - it would only relabel some other
      // row -active (lavender), which then fights the pinned row's
      // coral for no reason (see the CSS comment on
      // .ap-calc-result-row-active's :not(-pinned) exclusion). Unpinning
      // (the dedicated .ap-result-pin button, stopPropagation'd below)
      // is unaffected by this check.
      root.querySelectorAll(".ap-calc-result-row").forEach((rowEl) => {
        const rank = parseInt(rowEl.dataset.rank, 10);
        const preview = () => {
          const state = getApCalcSelection(root);
          if (state.pinnedCombo) return;
          state.previewRank = rank;
          update(root);
        };
        rowEl.addEventListener("click", preview);
        // Keyboard/screen-reader access lives on the combo label
        // (role="button" in resources.md), not on the row: the row also
        // holds the sibling pin <button>, and a role=button ancestor
        // around another button is invalid nesting. The row's own click
        // listener above still serves the mouse.
        const previewBtn = rowEl.querySelector(".ap-result-combo");
        if (previewBtn) {
          previewBtn.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              preview();
            }
          });
        }
      });

      // Top Combinations pin (2nd-5th rows only - see resources.md, rank
      // 1 already IS the default base so there's nothing for it to pin
      // to). A real <button> inside the row's clickable div (a sibling of
      // the combo's role=button label, not nested in it), so the click
      // handler's stopPropagation is still required or activating it would
      // also fire the preview click listener just above for the row itself
      // - harmless either way (pinning sets previewRank to match, see
      // below), but stopping it keeps the two actions' effects easy to
      // reason about independently. Reads the row's current combo off
      // data-combo-split/-pair (refreshed every renderGrid call) rather
      // than capturing it once here, since which combo sits in this row
      // can change between renders.
      root.querySelectorAll(".ap-result-pin").forEach((pinEl) => {
        const rowEl = pinEl.closest(".ap-calc-result-row");
        if (!rowEl) return;
        pinEl.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const splitKey = rowEl.dataset.comboSplit;
          const pair = rowEl.dataset.comboPair;
          if (!splitKey || !pair) return;
          const state = getApCalcSelection(root);
          const alreadyPinned =
            state.pinnedCombo && state.pinnedCombo.splitKey === splitKey && state.pinnedCombo.pair === pair;
          if (alreadyPinned) {
            state.pinnedCombo = null;
            state.previewRank = 1;
          } else {
            state.pinnedCombo = { splitKey, pair };
            const rank = parseInt(rowEl.dataset.rank, 10);
            if (rank) state.previewRank = rank;
          }
          update(root);
        });
      });

      // Live enforcement of every mutually exclusive group (see
      // EXCLUSIVE_GROUPS for the groups and what each one means).
      wireExclusiveGroups(root);
      const manaFoodEl = root.querySelector(".ap-engr-manafood");

      // Master Build toggle (top of calculator) and its compact echo
      // copies inside Bracelet Comparison's and Engraving Comparison's
      // own headers are all real <button>s, not the actual saved field -
      // the real, saved state is still the ap-brace-spec-build <select>
      // (see that select's own comment in resources.md). Each group is
      // two tiers now (Family: RE/Surge, Variant: the 2 or 3 chips for
      // whichever family is active - see syncBuildToggleUI). Both tiers
      // ultimately just set that select's value and dispatch a real
      // "change" event on it, so the existing generic input/select
      // listener loop a bit further down (which already watches every
      // input/select, this one included) picks it up and runs
      // scheduleUpdate() exactly as if the select had been changed
      // directly - no separate recompute path needed here, and a future
      // 4th echo copy elsewhere would need zero new code either (this
      // queries every .ap-build-variant-chip/.ap-build-family-chip on
      // the page, not a fixed list of containers).
      const buildSelectEl = root.querySelector(".ap-brace-spec-build");
      if (buildSelectEl) {
        // Per-family "last variant used" memory. Lives on
        // buildSelectEl.dataset (reMemory/surgeMemory), NOT a plain
        // closure variable - it needs to be reachable and resettable
        // from outside this block (see syncFamilyVariantMemory above,
        // called from resetInputs/switchPreset/applyImport/
        // initApCalcRoot), the same reason lastFamilyIsSurge lives on
        // dataset instead of a closure a few sections up. Only for the
        // page session (not persisted - a fresh load still falls back
        // to FAMILY_CROSSING_MAP's fixed defaults below). Crossing a
        // Family chip lands on whatever variant you were last on within
        // the TARGET family, not always the same fixed counterpart -
        // e.g. RE 333 -> Surge normally lands on Surge 222 (see
        // FAMILY_CROSSING_MAP), but if Surge 333 was already dialed in
        // earlier this session, crossing back to Surge returns you there
        // instead. Seeded from whatever build is active on load (via
        // syncFamilyVariantMemory in initApCalcRoot) so the very first
        // cross still has a sensible starting point via the fallback
        // below.
        const familyOfBuild = (id) => (BRACE_SPEC_BUILDS[id] && BRACE_SPEC_BUILDS[id].isSurge) ? "surge" : "re";
        const rememberVariant = (id) => {
          buildSelectEl.dataset[familyOfBuild(id) + "Memory"] = id;
        };
        buildSelectEl.addEventListener("change", () => {
          rememberVariant(normalizeBraceSpecBuild(buildSelectEl.value));
        });

        root.querySelectorAll(".ap-build-variant-chip").forEach((chip) => {
          chip.addEventListener("click", () => {
            if (buildSelectEl.value === chip.dataset.build) return;
            buildSelectEl.value = chip.dataset.build;
            buildSelectEl.dispatchEvent(new Event("change", { bubbles: true }));
          });
        });
        // Family chip: no-ops if already on that family. Otherwise
        // crosses to the target family's own remembered variant (see
        // the dataset memory above) if this session has one, falling
        // back to FAMILY_CROSSING_MAP's fixed default otherwise (see
        // that map's own comment for the RE-has-fewer-slots handling).
        root.querySelectorAll(".ap-build-family-chip").forEach((chip) => {
          chip.addEventListener("click", () => {
            const clickedIsSurge = chip.dataset.family === "surge";
            if (isSurgeBuild(root) === clickedIsSurge) return;
            const targetFamily = clickedIsSurge ? "surge" : "re";
            const mapped = buildSelectEl.dataset[targetFamily + "Memory"] || FAMILY_CROSSING_MAP[normalizeBraceSpecBuild(buildSelectEl.value)];
            if (!mapped || mapped === buildSelectEl.value) return;
            buildSelectEl.value = mapped;
            buildSelectEl.dispatchEvent(new Event("change", { bubbles: true }));
          });
        });
      }

      // Docked Build toggle's mobile trigger pill: opens/closes
      // .ap-build-dock-panel as a small popover above the pill (see
      // extra.css's .ap-build-dock rules - a plain --open class, not the
      // [hidden] attribute .ap-calc-popover uses, since this same panel
      // also needs to be force-visible on desktop regardless of state,
      // and fighting [hidden]'s UA-stylesheet specificity for that would
      // just reintroduce the bug .ap-brace-info-icon[hidden] et al. work
      // around elsewhere in this file). Desktop hides the trigger
      // entirely via CSS, so this listener is simply inert there.
      const dockTriggerEl = root.querySelector(".ap-build-dock-trigger");
      const dockPanelEl = root.querySelector(".ap-build-dock-panel");
      if (dockTriggerEl && dockPanelEl) {
        const setDockOpen = (open) => {
          dockPanelEl.classList.toggle("ap-build-dock-panel--open", open);
          dockTriggerEl.setAttribute("aria-expanded", open ? "true" : "false");
        };
        dockTriggerEl.addEventListener("click", () => {
          setDockOpen(!dockPanelEl.classList.contains("ap-build-dock-panel--open"));
        });
        // Picking a build closes the panel back down so the reader lands
        // straight back on the results instead of an open chip tray
        // sitting over them - a plain click-anywhere-in-the-panel
        // delegate rather than hanging this off each individual chip's
        // own listener above, so any future chip added to this panel
        // gets the same close-on-pick behavior for free.
        dockPanelEl.addEventListener("click", (ev) => {
          if (ev.target.closest(".ap-build-chip")) setDockOpen(false);
        });
      }

      // Mana Food's sensible default flips with Playstyle (RE vs Surge):
      // on RE it's purely informational (Main-Stat-only, doesn't compete
      // with anything - see renderEngravingComparison), so defaulting it
      // on costs nothing and saves the reader a click. On Surge it's one
      // of 2 competing consumable choices above, so it stays off by
      // default there like Wine's own untouched default - forcing it on
      // would silently outcompete Wine the moment the reader switches
      // specs. Playstyle itself is
      // not its own control - it's derived from the master
      // Build toggle above (see isSurgeBuild/readEngravingInputs), so this
      // listens to that same ap-brace-spec-build select instead and only
      // re-applies the default on an actual RE<->Surge CROSSING, not
      // every build switch (e.g. RE 111 -> RE 313 must NOT stomp a
      // mid-session manual Mana Food toggle, only crossing the RE/Surge
      // boundary should).
      //
      // "Last known family" is tracked on buildSelectEl's own dataset
      // (not a private closure variable) specifically so it can be
      // resynced from outside this listener - see
      // syncSpeedChoiceFamilyTracking below, called alongside
      // the speedFood normalizer from every bulk field mutation
      // (Reset to defaults, preset switch, import, init). Those all set
      // the build select's value directly via resetFieldsToDefaults
      // without dispatching "change", so a closure here would go stale
      // across them - e.g. Reset while on Surge silently snaps the form
      // back to the RE default, but a closure that still believed the
      // build was Surge would then miss the reader's very next crossing
      // to Surge (nowIsSurge === the stale remembered value, no
      // difference detected, Mana Food never flips back off). Confirmed
      // via Playwright: this was the exact repro for a reader hitting
      // Reset while on Surge, then crossing to Surge again finding Mana
      // Food still ticked alongside Wine.
      if (manaFoodEl && buildSelectEl) {
        if (buildSelectEl.dataset.lastFamilyIsSurge === undefined) {
          buildSelectEl.dataset.lastFamilyIsSurge = isSurgeBuild(root) ? "1" : "0";
        }
        buildSelectEl.addEventListener("change", () => {
          // Leaving Surge 111/333 with the Main Stat only food ticked turns it
          // into the regular Mana Food box before the crossing check below.
          normalizeExclusiveGroup(root, SPEED_FOOD_GROUP);
          const nowIsSurge = isSurgeBuild(root);
          const lastIsSurge = buildSelectEl.dataset.lastFamilyIsSurge === "1";
          if (nowIsSurge !== lastIsSurge) {
            manaFoodEl.checked = !nowIsSurge;
            buildSelectEl.dataset.lastFamilyIsSurge = nowIsSurge ? "1" : "0";
          }
        });
      }

      // Maelstrom Uptime's own sensible default varies by build GROUP
      // (RE, Surge 111/333, Surge 222 - see maelstromUptimeDefaultGroup's
      // own comment), the same idea as Mana Food's RE<->Surge default
      // crossing listener just above with a 3rd group split out of
      // Surge - and for the same reason, only re-applies on an actual
      // group crossing, not every build switch, so a mid-session manual
      // edit survives switching between two builds in the SAME group
      // (e.g. Surge 111 -> Surge 333, or RE 111 -> RE 313).
      const maelstromUptimeEl = root.querySelector(".ap-engr-maelstrom-uptime");
      if (maelstromUptimeEl && buildSelectEl) {
        if (buildSelectEl.dataset.lastMaelstromGroup === undefined) {
          buildSelectEl.dataset.lastMaelstromGroup = maelstromUptimeDefaultGroup(root);
        }
        buildSelectEl.addEventListener("change", () => {
          const nowGroup = maelstromUptimeDefaultGroup(root);
          const lastGroup = buildSelectEl.dataset.lastMaelstromGroup;
          if (nowGroup !== lastGroup) {
            maelstromUptimeEl.value = String(maelstromUptimeDefaultForGroup(nowGroup));
            buildSelectEl.dataset.lastMaelstromGroup = nowGroup;
          }
        });
      }

      // Accessory vs. Accessory's Main Stat, Line 3, and Other Ring/
      // Earring's Lines fields are single shared inputs reused across all
      // 3 "Comparing" slots (see AVB_SLOT_LABELS). None of them need a
      // hard reset-on-switch - all three are clamped/relabeled into the
      // new slot's own shape on every recompute (enforceAvbSlotUI for
      // Main Stat's range and the Other fields' tier tables,
      // enforceAvbLineControls for Line 3's Flat AP/WP tier tables), so
      // there's nothing left for a reset to protect against. An earlier
      // version of this listener force-reset Main Stat to that slot's
      // min/max AND Line 3 back to "None" on every single switch - no
      // real justification beyond matching the static markup's own
      // defaults, and it actively fought the reader: type/pick a real
      // value, glance at another slot, come back, and it was gone.
      // Dropping the reset entirely surfaces a real problem for Main
      // Stat though: clamping alone can't tell A and B apart. Necklace's
      // own defaults (15178/17857) both sit above Ring's max (12897), so
      // on the FIRST-EVER switch to Ring, both A and B would clamp to
      // that same 12897 ceiling - the "modest current piece vs. maxed
      // candidate" split the static markup ships with silently
      // collapsing into two identical numbers. Line 3 has the same
      // problem in miniature: its Flat AP/WP TYPE has no min/max to
      // clamp into at all, so with no memory every slot's first visit
      // would show whatever type/tier was last picked on a totally
      // different slot, verbatim, as if it were that slot's own real
      // starting point. Other Ring/Earring's Lines has the same problem
      // as Line 3 (a tier <select> with nothing to clamp into), but
      // WITHOUT a side to key on - unlike Main Stat/Line 3 there's only
      // one "Other" field pair (not one per A and B; the piece it
      // describes isn't being compared, so both sides share it), so its
      // memory is keyed by slot alone, not slot-per-side.
      // The fix for all three: remember each slot's own last value
      // (avbMainStatMemory/avbLine3Memory per side, avbOtherMemory per
      // slot only) and restore that on a switch BACK to an already-
      // visited slot, but fall through to that slot's own default the
      // first time it's ever selected - Main Stat's min/max (A: min, B:
      // max), Line 3's "None", Other's Mid/High (matching the static
      // markup's own starting tiers) - preserving real input without
      // losing the intentional starting point a fresh slot should still
      // show.
      const avbMem = getAvbMemory(root);
      const avbSlotEl = root.querySelector(".ap-avb-slot");
      if (avbSlotEl) {
        avbSlotEl.addEventListener("change", () => {
          ["a", "b"].forEach((prefix) => {
            const msEl = root.querySelector(".ap-avb-" + prefix + "-mainstat");
            if (msEl) {
              avbMem.mainStat[prefix][avbMem.lastSlot] = msEl.value;
              const range = ACC_MAIN_STAT_RANGE[avbSlotEl.value] || ACC_MAIN_STAT_RANGE.necklace;
              const remembered = avbMem.mainStat[prefix][avbSlotEl.value];
              msEl.value = remembered !== undefined ? remembered : (prefix === "a" ? range.min : range.max);
            }
            const typeEl = root.querySelector(".ap-avb-" + prefix + "-line3-type");
            const tierEl = root.querySelector(".ap-avb-" + prefix + "-line3-tier");
            if (typeEl) {
              avbMem.line3[prefix][avbMem.lastSlot] = { type: typeEl.value, tier: tierEl ? tierEl.value : "Mid" };
              const remembered = avbMem.line3[prefix][avbSlotEl.value];
              typeEl.value = remembered ? remembered.type : "none";
              if (tierEl && remembered) tierEl.value = remembered.tier;
            }
          });
          const newCfg = AVB_SLOT_LABELS[avbSlotEl.value] || AVB_SLOT_LABELS.necklace;
          const other1El = root.querySelector(".ap-avb-other-line1-tier");
          if (other1El) {
            avbMem.other.line1[avbMem.lastSlot] = other1El.value;
            const remembered = avbMem.other.line1[avbSlotEl.value];
            other1El.value = remembered !== undefined ? remembered : newCfg.otherLine1Default;
          }
          const other2El = root.querySelector(".ap-avb-other-line2-tier");
          if (other2El) {
            avbMem.other.line2[avbMem.lastSlot] = other2El.value;
            const remembered = avbMem.other.line2[avbSlotEl.value];
            other2El.value = remembered !== undefined ? remembered : newCfg.otherLine2Default;
          }
          avbMem.lastSlot = avbSlotEl.value;
        });
      }
      // resetFieldsToDefaults (used by Reset-to-defaults, the preset
      // switcher, and Import - see resetAvbMemory's own comment at its
      // module-level definition above for the full failure mode and why
      // this state lives there rather than in this closure) sets
      // these same fields' values directly rather than through user
      // interaction, so it never fires the "change" event the swap logic
      // above listens for. resetAvbMemory(root) is called from all 4
      // bulk-mutation call sites (resetInputs, switchPreset,
      // applyImportText, initApCalcRoot) precisely so this closure never
      // has to know when that happened - it just reads getAvbMemory(root)
      // fresh on every real switch, and finds it already clean.

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

      // Browser-native form value restoration (back/forward navigation,
      // and some browsers' reload-restore too) can hand a field a STALE
      // value keyed by its position among same-typed inputs rather than
      // by id, when the field has no `name` attribute (none of these
      // do) - independent of, and in addition to, this widget's own
      // id-keyed localStorage persistence just above. Confirmed as the
      // cause of a real report: inserting Flash Orb Uptime before Back
      // Attack Rate shifted Back Attack Rate's old cached 90 onto the
      // new field for a returning visitor, until a Reset overwrote it.
      // Since every field's value is already fully owned and restored
      // by saveInputs/loadInputs above, the browser's own restoration is
      // pure risk with no benefit - killing it here, once, generically
      // for every input/select in the root means any future inserted/
      // reordered field is automatically covered too, not just this one.
      root.querySelectorAll("input, select").forEach((el) => {
        el.setAttribute("autocomplete", "off");
      });

      root.querySelectorAll("input, select").forEach((el) => {
        // Weapon Power / Main Stat / Flat AP get typed digit-by-digit as
        // large numbers - recalculating on every keystroke means the
        // brief intermediate values (e.g. "2", then "25", then "259" on
        // the way to "259216") flash wildly wrong % gains before the
        // reader finishes typing. These three wait for "change" (blur,
        // or Enter) instead - everything else still updates live.
        // Accessory vs. Accessory's own Main Stat fields are the same
        // shape (a real 5-digit value typed straight in, not a tier
        // lookup) and hit the same problem, just worse: enforceAvbSlotUI
        // clamps to the slot's min/max on every recompute, so on the
        // "input" event a bare leading digit ("1" on the way to
        // "11500") reads as miles outside range and gets force-
        // overwritten mid-keystroke - the field fights back against
        // being typed into at all, not just showing wrong numbers
        // briefly. Same "change"-only fix as the other three resolves
        // it the same way.
        if (!el.matches(".ap-gear-wp, .ap-gear-main-stat, .ap-gear-flat-ap, .ap-avb-a-mainstat, .ap-avb-b-mainstat")) {
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
      // Accessory vs. Accessory's own Main Stat fields are excluded here -
      // clampOnBlur captures min/max as plain numbers ONCE, at this
      // setup call, from whatever the DOM's min/max attrs happen to be
      // at page load (necklace's, since that's the default slot) - it
      // has no way to notice enforceAvbSlotUI rewriting those same
      // attrs later when the reader switches slots, so its blur handler
      // goes on clamping to necklace's range forever. That's exactly
      // backwards from the "live" clamp these two fields actually need,
      // and it actively fights it: blur fires "change" first (already
      // correctly reads the live slot range via enforceAvbSlotUI on the
      // next frame), then this stale-range clamp overwrites the field
      // with a wrong value before that frame runs, which enforceAvbSlotUI
      // then clamps AGAIN into the real range - so a perfectly in-range
      // typed value (e.g. Ring's 11500) snaps to the slot's max instead
      // of staying put. enforceAvbSlotUI already re-clamps these two
      // fields into the CURRENT slot's range on every update() call
      // (min/max re-read fresh each time, not captured once), which is
      // exactly what change->scheduleUpdate already triggers on blur -
      // so this generic helper is both redundant and wrong for them.
      root.querySelectorAll('input[type="number"]').forEach((el) => {
        if (el.matches(".ap-avb-a-mainstat, .ap-avb-b-mainstat")) return;
        const min = el.min !== "" ? parseFloat(el.min) : -Infinity;
        const max = el.max !== "" ? parseFloat(el.max) : Infinity;
        window.SiteUtils.clampOnBlur(el, min, max, scheduleUpdate, {
          emptyValue: () => el.defaultValue,
        });
      });
      // Uptime % fields are meant to hold precise measured values (e.g.
      // 75.83%), not just whole percents, but they keep step="1" so the
      // arrow keys still nudge by a whole point. See SiteUtils.
      // bindDecimalPreservingArrowKeys's own comment for why that needs
      // its own handler instead of just relying on the native input.
      root.querySelectorAll(
        ".ap-adrenaline-uptime, .ap-flash-orb-uptime, .ap-gear-support-uptime, " +
        ".ap-gear-strength-orb-uptime, .ap-gear-atropine-uptime, .ap-engr-maelstrom-uptime"
      ).forEach((el) => {
        const step = el.step && el.step !== "" ? parseFloat(el.step) : 1;
        window.SiteUtils.bindDecimalPreservingArrowKeys(el, step);
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
          if (confirmed) {
            resetInputs(root);
          }
        });
      }

      // Preset switcher: 3 small number buttons, matching the reset
      // link's own subtle text-link treatment (see the CSS) rather than
      // boxed tabs - this is a footnote-level control, not a new section
      // of the widget, so it shouldn't visually compete with the actual
      // gear/results panels above it.
      root.querySelectorAll(".ap-calc-preset").forEach((btn) => {
        btn.addEventListener("click", () => {
          const newId = parseInt(btn.dataset.preset, 10);
          // switchPreset() itself no-ops (returns before touching any
          // fields) when clicking the already-active preset - guard the
          // same way here, or resetAvbMemory (now called inside
          // switchPreset itself) would wipe out perfectly live avb
          // memory for what was actually a no-op click.
          if (newId === getActivePresetId()) return;
          switchPreset(root, newId);
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

  // Same outside-click/Escape dismissal for the docked Build toggle's
  // mobile trigger panel - bound once at module scope rather than
  // inside initApCalcRoot() for the same reason as the popover listeners
  // just above (a per-root binding would leave another permanent
  // document-level listener behind on every instant-nav revisit). Not
  // folded into the .ap-calc-popover loop itself since this panel uses
  // its own --open class rather than the [hidden] attribute (see
  // extra.css's .ap-build-dock comment for why).
  document.addEventListener("click", (ev) => {
    document.querySelectorAll(".ap-build-dock-panel.ap-build-dock-panel--open").forEach((panelEl) => {
      const triggerEl = panelEl.parentElement && panelEl.parentElement.querySelector(".ap-build-dock-trigger");
      // ev.target === triggerEl only matched a click on the button's own
      // padding - the trigger's actual visible content (the label/chevron
      // spans) are child elements, so a real tap almost always lands on
      // one of those instead, made ev.target the child, failed this
      // equality check, and closed the panel this same click had just
      // opened. .closest() catches the child-element case too.
      if (panelEl.contains(ev.target) || (triggerEl && triggerEl.contains(ev.target))) return;
      panelEl.classList.remove("ap-build-dock-panel--open");
      if (triggerEl) triggerEl.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    document.querySelectorAll(".ap-build-dock-panel.ap-build-dock-panel--open").forEach((panelEl) => {
      const triggerEl = panelEl.parentElement && panelEl.parentElement.querySelector(".ap-build-dock-trigger");
      panelEl.classList.remove("ap-build-dock-panel--open");
      if (triggerEl) triggerEl.setAttribute("aria-expanded", "false");
    });
  });

  // Docked Build toggle's shadow (see .ap-build-dock--stuck in extra.css)
  // should only paint while the dock is genuinely pinned under the
  // header - sticky positioning alone can't express that, since the
  // dock is *always* position:sticky whether or not it's currently
  // engaged. Plain CSS also has no cross-browser ":stuck" selector, so
  // this does the one geometry check that actually distinguishes the
  // three states: normal flow at the very top of .ap-calc (rect.top is
  // way more than the offset - hasn't engaged yet), genuinely pinned
  // (rect.top sits exactly at the offset), and the release window at
  // the very bottom of .ap-calc (rect.top drifts back above the offset
  // as the dock unpins and scrolls away with the rest of the box - see
  // the "release point" part of .ap-build-dock's own comment in
  // extra.css). One check covers engage AND release symmetrically, so
  // there's no separate "was it released" branch to maintain.
  // Bound ONCE at module scope, same reasoning as the click-outside/
  // Escape listeners just above (a per-root binding inside
  // initApCalcRoot() would leave another permanent scroll listener
  // behind on every instant-nav revisit) - queries `document` fresh
  // inside the handler rather than caching the element, so it keeps
  // working after instant nav swaps the DOM out from under a cached
  // reference. There's normally just one .ap-build-dock per page, so
  // querying from `document` costs nothing in practice.
  //
  // Mobile shares this same listener for a second, unrelated job: the
  // dock is position:fixed there instead of sticky (see the mobile
  // media query's own comment in extra.css for why bottom-anchored
  // sticky can't work for an element that sits at the TOP of .ap-calc),
  // and fixed positioning has no native "stop once my container
  // scrolls past" behavior the way sticky does - so .ap-calc's own
  // rect is checked directly here and .ap-build-dock--offscreen is
  // toggled to hide the pill whenever .ap-calc isn't intersecting the
  // viewport at all (above it - hasn't scrolled down that far yet - or
  // below it - already scrolled past into CPM Calculator/Useful Links).
  // This is what the "same .ap-calc-scoped release" part of the mobile
  // media query's own comment refers to.
  const DOCK_STUCK_OFFSET_PX = 48; // must match extra.css's desktop `top`
  let dockStuckTicking = false;
  const updateDockStuckState = () => {
    dockStuckTicking = false;
    const dockEl = document.querySelector(".ap-build-dock");
    if (!dockEl) return;
    const isDesktopDock = window.matchMedia("(min-width: 901px)").matches;
    if (isDesktopDock) {
      const isStuck = dockEl.getBoundingClientRect().top <= DOCK_STUCK_OFFSET_PX + 1;
      dockEl.classList.toggle("ap-build-dock--stuck", isStuck);
      dockEl.classList.remove("ap-build-dock--offscreen");
      return;
    }
    dockEl.classList.remove("ap-build-dock--stuck");
    const calcEl = document.querySelector(".ap-calc");
    if (!calcEl) return;
    const calcRect = calcEl.getBoundingClientRect();
    const calcInView = calcRect.top < window.innerHeight && calcRect.bottom > 0;
    dockEl.classList.toggle("ap-build-dock--offscreen", !calcInView);
  };
  const queueDockStuckUpdate = () => {
    if (dockStuckTicking) return;
    dockStuckTicking = true;
    requestAnimationFrame(updateDockStuckState);
  };
  window.addEventListener("scroll", queueDockStuckUpdate, { passive: true });
  window.addEventListener("resize", queueDockStuckUpdate);
  // Also re-check right after every render (build switch, instant nav
  // landing mid-scroll, etc.) instead of waiting for the next scroll/
  // resize event, so the dock never briefly shows the wrong shadow
  // state right after a re-render.
  window.SiteUtils.registerRenderer(".ap-calc", queueDockStuckUpdate);

  // Was a hand-rolled document$-only subscription (see site-utils.js's
  // registerRenderer doc comment for why that's not safe to assume covers
  // every case on its own) - the dataset guard on initApCalcRoot() is what
  // makes it safe to hand to registerRenderer directly instead of going
  // through init()'s own querySelectorAll first.
  window.SiteUtils.registerRenderer(".ap-calc", initApCalcRoot);

  window.__arkPassiveCalc = {
    computeGridAndSummary,
    computeBraceletComparison,
    computeBraceletVsBracelet,
    computeAccessoryComparison,
    computeEngravingSetupComparison,
    EVOLUTION_SPLITS,
    EVOLUTION_SPLITS_OT1,
    splitsFor,
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
// 0.85*1.12 scalar, which the formula omits - see the note at the top
// of this file):
//   Critical+Master    -> 7.902313487
//   Critical+Pulverize -> 7.930274126
//   Master+Pulverize   -> 7.947222029
// ---------------------------------------------------------------------
