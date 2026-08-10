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
    "Epic|0P": 0,
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
      evoKarmaRank: parseInt(getSelect(root, ".ap-evo-karma", "6"), 10) || 6,

      demonDmgPct: Math.max(0, Math.min(15, getNumber(root, ".ap-brace-demon-dmg", 7))),
      braceCritStatEquipped: Math.max(60, Math.min(120, getNumber(root, ".ap-brace-crit-stat-equipped", 60))),
      braceSurgeSpec: getCheckbox(root, ".ap-brace-spec-surge", false),
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
    return c + d + e + f + g + h + i + k + n + o + p;
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

    // Astrogem
    const astrogemDmg = roundDown(inputs.astrogemLv * 8.0834, 0) / 10000;
    const spanAstro = root.querySelector('.ap-value-display[data-for="ap-astrogem-lv"]');
    if (spanAstro) {
      spanAstro.textContent = formatPct(astrogemDmg);
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

    setDisplay("#ap-adrenaline", (ADRENALINE_TABLE[inputs.adrenaline] || 0) * (inputs.adrenalineUptime / 100));
    setDisplay("#ap-kbw", KBW_TABLE[inputs.kbw] || 0);
    setDisplay("#ap-kbw-stone", KBW_STONE_TABLE[inputs.kbwStone] || 0);

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

  // ----- Bracelet Line Comparison rendering -----
  // Renders into a <tbody> as a compact table (Line | Low | Mid | High)
  // instead of the old stacked-card layout - one <tr> per line instead of a
  // bordered card each, and full-width now that the section lives outside
  // the sticky .ap-calc-live column (see resources.md), so this reads as a
  // glance-able table rather than a scroll of cards.
  function renderBraceletComparison(root, rows) {
    const container = root.querySelector(".ap-brace-compare-rows");
    const footnote = root.querySelector(".ap-brace-compare-flip-note");
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
  // listeners in init()), so nothing is lost by switching away from it.
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

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error("Clipboard API unavailable"));
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

  function update(root) {
    enforcePartyCheckboxLimit(root);
    enforceKbwStoneDependency(root);
    const inputs = readInputs(root);
    const result = computeGridAndSummary(inputs);
    renderGrid(root, result);
    updateInputDisplays(root, inputs);
    renderBraceletComparison(root, computeBraceletComparison(inputs));

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
  function init() {
    document.querySelectorAll(".ap-calc").forEach((root) => {
      const activeId = getActivePresetId();
      loadInputs(root, activeId);
      normalizeChaosCoreExclusivity(root);
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

      root.querySelectorAll("input, select").forEach((el) => {
        el.addEventListener("input", () => {
          update(root);
          saveInputs(root, getActivePresetId());
        });
        el.addEventListener("change", () => {
          update(root);
          saveInputs(root, getActivePresetId());
        });
      });
      const resetEl = root.querySelector(".ap-calc-reset");
      // A real <button>, not an <a href="#"> - this site has Material's
      // navigation.instant enabled, which intercepts <a> clicks globally
      // for SPA-style navigation and was racing with (and beating) a click
      // listener attached directly to the link, so the reset never
      // actually ran. A <button> isn't part of that interception at all.
      if (resetEl) resetEl.addEventListener("click", () => resetInputs(root));

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
            copyToClipboard(text)
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

      // Click outside any open popover, or Escape, closes it - same
      // dismissal pattern as any lightweight menu/tooltip on the site.
      document.addEventListener("click", (ev) => {
        root.querySelectorAll(".ap-calc-popover").forEach((popoverEl) => {
          if (popoverEl.hidden) return;
          if (popoverEl.contains(ev.target) || ev.target === popoverEl.__triggerEl) return;
          closePopover(popoverEl);
        });
      });
      document.addEventListener("keydown", (ev) => {
        if (ev.key !== "Escape") return;
        root.querySelectorAll(".ap-calc-popover").forEach((popoverEl) => {
          if (!popoverEl.hidden) closePopover(popoverEl);
        });
      });

      update(root);
    });
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

  window.__arkPassiveCalc = { computeGridAndSummary, computeBraceletComparison, EVOLUTION_SPLITS, COMBINED_KEYSTONES };
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
