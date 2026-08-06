// Ark Passive node comparison calculator for Deathblade.
//
// Grid compares the three Keystone PAIRS (Critical+Master / Critical+Pulverize
// / Master+Pulverize) across the three Limit Break/Keen Sense splits Deathblade
// can run (3 evolution points total). Each cell shows its Final Multiplier as
// a % of the grid's best cell (best = 100.00%) rather than a raw multiplier -
// see the CSS comment above .ap-value-display for why.
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
      critStat: getNumber(root, ".ap-crit-stat", 658),
      weaponQuality: Math.max(0, Math.min(100, getNumber(root, ".ap-weapon-quality", 100))),
      astrogemLv: getNumber(root, ".ap-astrogem-lv", 56),

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

  function critRateTotal(inputs, keenSenseLv) {
    const c = roundDown((inputs.critStat * 0.03579099) / 100, 4);
    const d = RING_RATE_TABLE[inputs.ring1Rate] || 0;
    const e = RING_RATE_TABLE[inputs.ring2Rate] || 0;
    const f = BRACELET_RATE_TABLE[inputs.braceletRate] || 0;
    const g = BRACELET_RATE_TABLE[inputs.braceletRate2] || 0;
    const h = ADRENALINE_TABLE[inputs.adrenaline] || 0;
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

    // Base stats for verification
    const baseStats = {
      critRate: critRateTotal(inputs, 0) * 100,
      critDmg: shared.critDmgTotal,
      onCritDmg: shared.onCritDmgBase * 100,
      evoDmg: (shared.yearningEvo + shared.evoKarmaEvo + STANDING_STRIKER_EVO_DMG) * 100,
      addDmg: shared.addDmgBase * 100,
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
    }

    return { cells, best, baseStats, bestStats };
  }

  // ----- Format helper -----
  // Always 2 decimals - consistent across every field tag rather than
  // switching precision based on magnitude.
  function formatPct(val) {
    if (!val) return "(0%)";
    return "(" + (val * 100).toFixed(2) + "%)";
  }

  // ----- Render value displays -----
  function updateInputDisplays(root, inputs) {
    const setDisplay = (selector, value, format = "pct") => {
      const row = root.querySelector(selector)?.closest?.(".ap-calc-field-row");
      if (!row) return;
      const span = row.querySelector(".ap-value-display");
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
    const rowCrit = root.querySelector("#ap-crit-stat")?.closest?.(".ap-calc-field-row");
    if (rowCrit) {
      const spanCrit = rowCrit.querySelector(".ap-value-display");
      if (spanCrit) {
        const pct = critRateFromStat * 100;
        spanCrit.textContent = "(" + pct.toFixed(2) + "%)";
      }
    }

    // Weapon Quality
    const weaponDmg = 0.1 + 0.00002 * inputs.weaponQuality * inputs.weaponQuality;
    const rowWep = root.querySelector("#ap-weapon-quality")?.closest?.(".ap-calc-field-row");
    if (rowWep) {
      const spanWep = rowWep.querySelector(".ap-value-display");
      if (spanWep) {
        const pct = weaponDmg * 100;
        spanWep.textContent = "(" + pct.toFixed(2) + "%)";
      }
    }

    // Astrogem
    const astrogemDmg = roundDown(inputs.astrogemLv * 8.0834, 0) / 10000;
    const rowAstro = root.querySelector("#ap-astrogem-lv")?.closest?.(".ap-calc-field-row");
    if (rowAstro) {
      const spanAstro = rowAstro.querySelector(".ap-value-display");
      if (spanAstro) {
        spanAstro.textContent = formatPct(astrogemDmg);
      }
    }

    // Other displays
    setDisplay("#ap-necklace", NECKLACE_ADD_TABLE[inputs.necklace] || 0);
    setDisplay("#ap-sh-pet", SH_PET_TABLE[inputs.shPet] || 0);
    setDisplay("#ap-evo-karma", EVO_KARMA_MAP[inputs.evoKarmaRank] || 0);

    setDisplay("#ap-yearning", inputs.yearning ? 0.14 : 0);

    setDisplay("#ap-ring1-rate", RING_RATE_TABLE[inputs.ring1Rate] || 0);
    setDisplay("#ap-ring1-dmg", RING_DMG_TABLE[inputs.ring1Dmg] || 0);
    setDisplay("#ap-ring2-rate", RING_RATE_TABLE[inputs.ring2Rate] || 0);
    setDisplay("#ap-ring2-dmg", RING_DMG_TABLE[inputs.ring2Dmg] || 0);

    setDisplay("#ap-bracelet-rate", BRACELET_RATE_TABLE[inputs.braceletRate] || 0);
    setDisplay("#ap-bracelet-dmg", BRACELET_DMG_TABLE[inputs.braceletDmg] || 0);
    setDisplay("#ap-bracelet-rate-2", BRACELET_RATE_TABLE[inputs.braceletRate2] || 0);
    setDisplay("#ap-bracelet-dmg-2", BRACELET_DMG_TABLE[inputs.braceletDmg2] || 0);
    setDisplay("#ap-bracelet-addA", BRACELET_ADD_A_TABLE[inputs.braceletAddA] || 0);
    setDisplay("#ap-bracelet-addB", BRACELET_ADD_B_TABLE[inputs.braceletAddB] || 0);
    setDisplay("#ap-crit-rate-dual", inputs.critRateDual ? 0.015 : 0);
    setDisplay("#ap-crit-dmg-dual", inputs.critDmgDual ? 0.015 : 0);

    setDisplay("#ap-flashy-atk", FLASHY_ATK_TABLE[inputs.flashyAtk] || 0);
    setDisplay("#ap-stable-atk", stableAtkValue(inputs.stableAtk));

    setDisplay("#ap-adrenaline", ADRENALINE_TABLE[inputs.adrenaline] || 0);
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
        rateEl.textContent = rate.toFixed(1) + "%";
        rateEl.classList.toggle("ap-summary-value-warn", rate > 100);
      }
      if (dmgEl) dmgEl.textContent = base.critDmg.toFixed(3);
      if (onCritEl) onCritEl.textContent = base.onCritDmg.toFixed(2) + "%";
      if (evoEl) evoEl.textContent = base.evoDmg.toFixed(2) + "%";
      if (addEl) addEl.textContent = base.addDmg.toFixed(2) + "%";
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
        critEl.textContent = raw.toFixed(1) + "%";
        critEl.classList.toggle("ap-summary-value-warn", raw > 100);
      }
      if (onCritEl) onCritEl.textContent = best.onCritDmg.toFixed(2) + "%";
      if (evoEl) evoEl.textContent = best.evoDmg.toFixed(2) + "%";
      if (addEl) addEl.textContent = best.addDmg.toFixed(2) + "%";
    }
  }

  // ----- Local storage persistence -----
  // Saves every field's current value under one key so a reader filling
  // this out doesn't have to redo it on every reload. Best-effort: some
  // browsers/private-mode sessions block storage entirely, so every call
  // is wrapped and failures are silently ignored - the calculator still
  // works perfectly without persistence, it just won't remember next time.
  const STORAGE_KEY = "ap-calc-deathblade-v1";

  function saveInputs(root) {
    try {
      const data = {};
      root.querySelectorAll("input, select").forEach((el) => {
        if (!el.id) return;
        data[el.id] = el.type === "checkbox" ? el.checked : el.value;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* storage unavailable - nothing to do */
    }
  }

  function loadInputs(root) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      root.querySelectorAll("input, select").forEach((el) => {
        if (!el.id || !(el.id in data)) return; // no stored value, or a
        // field that didn't exist when this was saved - leave it at its
        // authored HTML default rather than guessing.
        if (el.type === "checkbox") {
          el.checked = !!data[el.id];
        } else {
          el.value = data[el.id];
        }
      });
    } catch (e) {
      /* corrupted or blocked storage - fall back to authored defaults */
    }
  }

  function resetInputs(root) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* storage unavailable - nothing to clear */
    }

    // Restore every input and select in this container to its HTML default
    root.querySelectorAll("input, select").forEach((el) => {
      if (el.type === "checkbox") {
        el.checked = el.defaultChecked;
      } else if (el.tagName === "SELECT") {
        const defaultOpt = Array.from(el.options).find((opt) => opt.defaultSelected) || el.options[0];
        if (defaultOpt) el.value = defaultOpt.value;
      } else {
        el.value = el.defaultValue;
      }
    });

    // Instantly re-calculate calculations and refresh value/range displays
    update(root);
  }

  function update(root) {
    const inputs = readInputs(root);
    const result = computeGridAndSummary(inputs);
    renderGrid(root, result);
    updateInputDisplays(root, inputs);

    const rangeEl = root.querySelector(".ap-back-attack-rate");
    const rangeValueEl = root.querySelector(".ap-calc-range-value");
    if (rangeEl && rangeValueEl) rangeValueEl.textContent = rangeEl.value + "%";
  }

  // ----- Initialisation -----
  function init() {
    document.querySelectorAll(".ap-calc").forEach((root) => {
      loadInputs(root);
      root.querySelectorAll("input, select").forEach((el) => {
        el.addEventListener("input", () => {
          update(root);
          saveInputs(root);
        });
        el.addEventListener("change", () => {
          update(root);
          saveInputs(root);
        });
      });
      const resetEl = root.querySelector(".ap-calc-reset");
      // A real <button>, not an <a href="#"> - this site has Material's
      // navigation.instant enabled, which intercepts <a> clicks globally
      // for SPA-style navigation and was racing with (and beating) a click
      // listener attached directly to the link, so the reset never
      // actually ran. A <button> isn't part of that interception at all.
      if (resetEl) resetEl.addEventListener("click", () => resetInputs(root));
      update(root);
    });
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

  window.__arkPassiveCalc = { computeGridAndSummary, EVOLUTION_SPLITS, COMBINED_KEYSTONES };
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
