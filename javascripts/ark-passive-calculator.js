(function () {
  "use strict";
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("ark-passive-calculator.js");
  const NONE_LOW_MID_HIGH = (none, low, mid, high) => ({ None: none, Low: low, Mid: mid, High: high });
  const RING_RATE_TABLE = NONE_LOW_MID_HIGH(0, 0.004, 0.0095, 0.0155);
  const RING_DMG_TABLE = NONE_LOW_MID_HIGH(0, 0.011, 0.024, 0.04);
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
  const STABLE_ATK_TABLE = {
    "None|0P": 0,
    "Any|14P": 0.007,
    "Relic|14P": 0.007,
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
  const SKILL_CD_PENALTY = 0.0135;
  const DAMAGE_CD_RAW_TABLE = { Low: 0.045, Mid: 0.05, High: 0.055 };
  const DAMAGE_CD_TABLE = {
    Low: (1 + DAMAGE_CD_RAW_TABLE.Low) / (1 + SKILL_CD_PENALTY) - 1,
    Mid: (1 + DAMAGE_CD_RAW_TABLE.Mid) / (1 + SKILL_CD_PENALTY) - 1,
    High: (1 + DAMAGE_CD_RAW_TABLE.High) / (1 + SKILL_CD_PENALTY) - 1,
  };
  const DAMAGE_CD_SURGE_TABLE = {
    Low: DAMAGE_CD_RAW_TABLE.Low - 0.01,
    Mid: DAMAGE_CD_RAW_TABLE.Mid - 0.01,
    High: DAMAGE_CD_RAW_TABLE.High - 0.01,
  };
  const CRIT_STAT_TABLE = { Low: 80, Mid: 100, High: 120 };
  const OUTGOING_DMG_TABLE = { Low: 0.02, Mid: 0.025, High: 0.03 };
  const STAGGER_DMG_TABLE = { Low: 0.04, Mid: 0.045, High: 0.05 };
  const STAGGER_DPS_SHARE = 0.05;
  const BACK_DMG_TABLE = { Low: 0.025, Mid: 0.03, High: 0.035 };
  const BACK_ATTACK_DPS_SHARE = 0.95;
  const DEMON_DMG_ADD = 0.025;
  const ACC_NECKLACE_ADD_TABLE = { Low: 0.007, Mid: 0.016, High: 0.026 };
  const ACC_NECKLACE_OUT_TABLE = { Low: 0.0055, Mid: 0.012, High: 0.02 };
  const ACC_EARRING_AP_TABLE = { Low: 0.004, Mid: 0.0095, High: 0.0155 };
  const ACC_EARRING_WP_TABLE = { Low: 0.008, Mid: 0.018, High: 0.03 };
  const ACC_FLAT_AP_TABLE = { Low: 80, Mid: 195, High: 390 };
  const ACC_FLAT_WP_TABLE = { Low: 195, Mid: 480, High: 960 };
  const ACC_QUALITY_MAIN_STAT_TABLE = { Low: 1935, Mid: 2083, High: 2679 };
  const ACC_MAIN_STAT_RANGE = {
    ring: { min: 10962, max: 12897 },
    earring: { min: 11806, max: 13889 },
    necklace: { min: 15178, max: 17857 },
  };
  const ACC_RING_DMG_TABLE = { Low: 0.011, Mid: 0.024, High: 0.04 };
  const ONHIT_WP_STACK_ASSUMPTION = 5;
  const PERIODIC_WP_FIGHT_MINUTES = 10;
  function periodicWpAvgBonus(fightMinutes, perStackValue) {
    const capped = Math.min(14.5, fightMinutes);
    return ((capped * (capped + 0.5)) + Math.max(0, fightMinutes - 14.5) * 30) / fightMinutes * perStackValue;
  }
  const HP_GATED_WP_UPTIME = 0.99;
  const SUPPORT_AP_BUFF_COEFFICIENT = 0.4;
  function gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult, supApBuff) {
    return Math.floor((Math.sqrt((wp * mainStat) / 6) * baseApMult + flatAp + supApBuff) * percentApMult);
  }
  function supportApBuff(inputs, wp, mainStat, baseApMult) {
    if (!inputs.gearSupport) return 0;
    return Math.sqrt((wp * mainStat) / 6) * baseApMult * SUPPORT_AP_BUFF_COEFFICIENT * (inputs.gearSupportUptime / 100);
  }
  const ADRENALINE_AP_PER_STACK = 0.009;
  const ADRENALINE_STACKS = 6;
  const ADRENALINE_STONE_AP_TABLE = { "0 Lv.": 0, "1 Lv.": 0.0048, "2 Lv.": 0.006, "3 Lv.": 0.0083, "4 Lv.": 0.0095 };
  function adrenalineApFraction(inputs) {
    if (inputs.adrenaline === "Not Used") return 0;
    const stoneAp = ADRENALINE_STONE_AP_TABLE[inputs.adrenalineStone] || 0;
    return ADRENALINE_STACKS * (ADRENALINE_AP_PER_STACK + stoneAp) * (inputs.adrenalineUptime / 100);
  }
  const GEAR_AP_EARRING_TABLE = { "None": 0, "Low": 0.4, "Mid": 0.95, "High": 1.55 };
  const GEAR_WP_EARRING_TABLE = { "None": 0, "Low": 0.8, "Mid": 1.8, "High": 3 };
  const GEAR_WP_KARMA_PER_LEVEL = 0.1;
  const GEAR_AP_KAZEROS = 2;
  const GEAR_AP_GUARDIAN = 3;
  const GEAR_AP_CHAOS_STAR_TABLE = {
    "None|0P": { pct: 0, flat: 0 },
    "Any|10P": { pct: 0, flat: 900 },
    "Any|14P": { pct: 0.55, flat: 900 },
    "Relic|14P": { pct: 0.55, flat: 900 },
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
  const ARK_SWIFT_CDMG_TABLE = {
    "None|0P": 0,
    "Any|14P": 0.014,
    "Relic|14P": 0.014,
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
    "Relic|14P": 0.0065,
    "Relic|17P": 0.0195,
    "Relic|18P": 0.0216,
    "Relic|19P": 0.0237,
    "Relic|20P": 0.0258,
    "Ancient|17P": 0.0325,
    "Ancient|18P": 0.0346,
    "Ancient|19P": 0.0367,
    "Ancient|20P": 0.0388,
  };
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
  const ARK_SMOLDERING_BURN_TABLE = { Relic: 0.005, Ancient: 0.0075 };
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
  const ARK_WEAPON_CORE_TABLE = {
    "None|0P": { pct: 0, flat: 0 },
    "Any|10P": { pct: 0, flat: 1300 },
    "Any|14P": { pct: 0.75, flat: 1300 },
    "Relic|14P": { pct: 0.75, flat: 1300 },
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
  const GEAR_AP_ASTROGEM_MAX_LEVEL = 120;
  function gearAstrogemApPercent(inputs) {
    return roundDown((inputs.gearAstrogemLv / GEAR_AP_ASTROGEM_MAX_LEVEL) * GEAR_AP_ASTROGEM_MAX, 2);
  }
  const GEAR_AP_ATROPINE_FULL = 30;
  const SUPPORT_ETHER_EFFECTIVENESS = 0.31;
  const STRENGTH_ORB_BASE_AP = 10;
  const STRENGTH_ORB_FULL_AP = STRENGTH_ORB_BASE_AP * (1 + SUPPORT_ETHER_EFFECTIVENESS);
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
  const ABILITY_STONE_BASE_AP_BONUS = 1.5;
  function gearBaseApPercentTotal(inputs) {
    return inputs.gearGemBaseAp + (inputs.gearAbilityStoneBaseAp ? ABILITY_STONE_BASE_AP_BONUS : 0);
  }
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
  function gearWpKarmaPercent(inputs) {
    return inputs.gearWpKarmaLv * GEAR_WP_KARMA_PER_LEVEL;
  }
  function gearWpEarringPercent(inputs) {
    return (GEAR_WP_EARRING_TABLE[inputs.gearWpEarring1] || 0) + (GEAR_WP_EARRING_TABLE[inputs.gearWpEarring2] || 0);
  }
  function gearWeaponCorePercent(inputs) {
    return (ARK_WEAPON_CORE_TABLE[inputs.gearWeaponCore] || {}).pct || 0;
  }
  function gearWpPercentTotal(inputs) {
    return gearWpKarmaPercent(inputs) + gearWpEarringPercent(inputs) + gearWeaponCorePercent(inputs);
  }
  const SPEC_BASE = 1735;
  const SPEC_REF = 1855;
  const SPEC_SKILL_COEFFICIENT = 0.86;
  const AWAKENING_COEFFICIENT = 0.1528;
  const CRIT_BASE = 576;
  const RE_AWAKENING_SHARE = 0.015;
  const SURGE_AWAKENING_SHARE = 0.01;
  const BRACE_SPEC_BUILDS = {
    "re-111": { label: "RE 111/313", isSurge: false, share: 0.20, awakeningShare: RE_AWAKENING_SHARE },
    "re-333": { label: "RE 333", isSurge: false, share: 0.17, awakeningShare: RE_AWAKENING_SHARE },
    "surge-111": { label: "Surge 111", isSurge: true, share: 0.75, awakeningShare: SURGE_AWAKENING_SHARE },
    "surge-222": { label: "Surge 222", isSurge: true, share: 0.50, awakeningShare: SURGE_AWAKENING_SHARE },
    "surge-333": { label: "Surge 333", isSurge: true, share: 0.45, awakeningShare: SURGE_AWAKENING_SHARE },
  };
  function normalizeBraceSpecBuild(id) {
    return id === "re-313" ? "re-111" : id;
  }
  function braceSpecConfig(inputs) {
    return BRACE_SPEC_BUILDS[inputs.braceSpecBuild] || BRACE_SPEC_BUILDS["re-333"];
  }
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
  function currentBraceSpecBuildId(root) {
    return normalizeBraceSpecBuild(getSelect(root, ".ap-brace-spec-build", "re-333"));
  }
  function currentBuildConfig(root) {
    return BRACE_SPEC_BUILDS[currentBraceSpecBuildId(root)] || BRACE_SPEC_BUILDS["re-333"];
  }
  function isSurgeBuild(root) {
    return !!currentBuildConfig(root).isSurge;
  }
  function is222Build(root) {
    return currentBraceSpecBuildId(root) === "surge-222";
  }
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
  const FAMILY_CROSSING_MAP = {
    "re-111": "surge-111",
    "re-333": "surge-222",
    "surge-111": "re-111",
    "surge-222": "re-333",
    "surge-333": "re-333",
  };
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
    root.querySelectorAll(".ap-build-toggle-tier--variant").forEach((tier) => {
      const tierFamily = tier.classList.contains("ap-build-toggle-tier--variant-surge") ? "surge" : "re";
      tier.classList.toggle("ap-build-toggle-tier--hidden", tierFamily !== family);
    });
    const triggerLabel = root.querySelector(".ap-build-dock-trigger-label");
    if (triggerLabel && activeVariantLabel) {
      triggerLabel.textContent = (family === "surge" ? "Surge " : "RE ") + activeVariantLabel;
    }
  }
  function deathbladeSpecMultiplier(spec, share, awakeningShare) {
    const denom = 1 - share - awakeningShare
      + share / (1 + SPEC_SKILL_COEFFICIENT / 699 * SPEC_REF)
      + awakeningShare / (1 + AWAKENING_COEFFICIENT / 699 * SPEC_REF);
    const shareRatio = (share / (1 + SPEC_SKILL_COEFFICIENT / 699 * SPEC_REF)) / denom;
    const awakeningRatio = (awakeningShare / (1 + AWAKENING_COEFFICIENT / 699 * SPEC_REF)) / denom;
    return 1 + (SPEC_SKILL_COEFFICIENT * shareRatio + AWAKENING_COEFFICIENT * awakeningRatio) / 699 * spec;
  }
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
  const EVOLUTION_SPLITS_OT1 = [
    { key: "ot1-lb2ks0", limitBreak: 2, keenSense: 0, label: "OT1/LB2" },
    { key: "ot1-lb1ks1", limitBreak: 1, keenSense: 1, label: "OT1/LB1/KS1" },
    { key: "ot1-lb0ks2", limitBreak: 0, keenSense: 2, label: "OT1/KS2" },
  ];
  const OPTIMIZED_TRAINING_EVO_DMG = 0.05;
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
  const apCalcSelection = new WeakMap();
  function getApCalcSelection(root) {
    let state = apCalcSelection.get(root);
    if (!state) {
      state = { previewRank: 1, pinnedCombo: null };
      apCalcSelection.set(root, state);
    }
    return state;
  }
  function resolvePinnedCombo(pinnedCombo, ot1Active) {
    if (!pinnedCombo) return null;
    const split = splitsFor(ot1Active).find((s) => s.key === pinnedCombo.splitKey);
    if (!split) return null;
    return { split, pair: pinnedCombo.pair };
  }
  let activePinnedCombo = null;
  const PARTY_CHECKBOX_LIMIT_SELECTORS = [
    ".ap-crit-syn1",
    ".ap-crit-syn2",
    ".ap-crit-hit-syn-1",
    ".ap-crit-hit-syn-2",
    ".ap-yearning",
  ];
  const PARTY_CHECKBOX_LIMIT = 3;
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
  function readBvbSide(root, prefix) {
    const base = ".ap-bvb-" + prefix + "-";
    return {
      spec: Math.max(60, Math.min(120, getNumber(root, base + "spec", 80))),
      critStat: Math.max(60, Math.min(120, getNumber(root, base + "crit", 80))),
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
    return {
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
      swiftCore: getSelect(root, ".ap-swift-core", "None|0P"),
      critSyn1: getCheckbox(root, ".ap-crit-syn1", false),
      critSyn2: getCheckbox(root, ".ap-crit-syn2", false),
      critHitSyn1: getCheckbox(root, ".ap-crit-hit-syn-1", false),
      critHitSyn2: getCheckbox(root, ".ap-crit-hit-syn-2", false),
      backAttackRate: Math.max(0, Math.min(100, getNumber(root, ".ap-back-attack-rate", 85))),
      flashOrbUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-flash-orb-uptime", 0))),
      yearning: getCheckbox(root, ".ap-yearning", true),
      optimizedTraining: getCheckbox(root, ".ap-ot1", false),
      evoKarmaRank: parseInt(getSelect(root, ".ap-evo-karma", "6"), 10) || 6,
      demonDmgPct: 7,
      braceSpecBuild: normalizeBraceSpecBuild(getSelect(root, ".ap-brace-spec-build", "re-333")),
      bvbA: readBvbSide(root, "a"),
      bvbB: readBvbSide(root, "b"),
      avbSlot: getSelect(root, ".ap-avb-slot", "necklace"),
      avbA: readAvbSide(root, getSelect(root, ".ap-avb-slot", "necklace"), "a"),
      avbB: readAvbSide(root, getSelect(root, ".ap-avb-slot", "necklace"), "b"),
      avbOtherLine1Tier: getSelect(root, ".ap-avb-other-line1-tier", (AVB_SLOT_LABELS[getSelect(root, ".ap-avb-slot", "necklace")] || AVB_SLOT_LABELS.necklace).otherLine1Default),
      avbOtherLine2Tier: getSelect(root, ".ap-avb-other-line2-tier", (AVB_SLOT_LABELS[getSelect(root, ".ap-avb-slot", "necklace")] || AVB_SLOT_LABELS.necklace).otherLine2Default),
      gearWp: Math.max(0, Math.min(1000000, getNumber(root, ".ap-gear-wp", 259216))),
      gearWpKarmaLv: Math.max(0, Math.min(30, getNumber(root, ".ap-gear-wp-karma-lv", 30))),
      gearWpEarring1: getSelect(root, ".ap-gear-wp-earring1", "Mid"),
      gearWpEarring2: getSelect(root, ".ap-gear-wp-earring2", "Mid"),
      gearMainStat: Math.max(0, Math.min(2000000, getNumber(root, ".ap-gear-main-stat", 854918))),
      gearMainStatPercent: Math.max(0, Math.min(15, getNumber(root, ".ap-gear-main-stat-pct", 9))),
      gearGemBaseAp: Math.max(0, Math.min(50, getNumber(root, ".ap-gear-gem-base-ap", 13.2))),
      gearAbilityStoneBaseAp: getCheckbox(root, ".ap-gear-ability-stone-base-ap", true),
      gearFlatAp: Math.max(0, Math.min(2000, getNumber(root, ".ap-gear-flat-ap", 0))),
      gearApEarring1: getSelect(root, ".ap-gear-ap-earring1", "High"),
      gearApEarring2: getSelect(root, ".ap-gear-ap-earring2", "High"),
      gearApKazeros: getCheckbox(root, ".ap-gear-ap-kazeros", false),
      gearApGuardian: getCheckbox(root, ".ap-gear-ap-guardian", false),
      gearApChaosStar: getSelect(root, ".ap-gear-ap-chaos-star", "Relic|20P"),
      gearWeaponCore: getSelect(root, ".ap-gear-weapon-core", "None|0P"),
      gearAstrogemLv: Math.max(0, Math.min(120, getNumber(root, ".ap-gear-ap-astrogem-lv", 35))),
      gearApOther: Math.max(0, Math.min(50, getNumber(root, ".ap-gear-ap-other", 0))),
      gearAtropineUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-gear-atropine-uptime", 0))),
      gearStrengthOrbUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-gear-strength-orb-uptime", 0))),
      gearSupport: getCheckbox(root, ".ap-yearning", true),
      gearSupportUptime: Math.max(0, Math.min(100, getNumber(root, ".ap-gear-support-uptime", 98))),
      crushingCore: getSelect(root, ".ap-crushing-core", "None|0P"),
    };
  }
  function roundDown(x, n) {
    const f = Math.pow(10, n);
    return Math.floor(x * f) / f;
  }
  function breakingMoonContribution(inputs) {
    const active = inputs.braceSpecBuild === "surge-111";
    const spec = BRACE_SPEC_BUILDS["surge-111"];
    return { active, add: active ? spec.share * 0.25 * 0.6 : 0 };
  }
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
      breakingMoon.add;
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
  function marginalCritDmgGainPct(effCrit, onCrit, critDmgTotal, value) {
    if (!value) return 0;
    const withTerm = (1 - effCrit) + effCrit * (1 + onCrit) * critDmgTotal;
    const contribution = effCrit * (1 + onCrit) * value;
    const withoutTerm = withTerm - contribution;
    if (withoutTerm <= 0) return 0;
    return (contribution / withoutTerm) * 100;
  }
  const KBW_EV_MALUS = 0.98;
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
    const q = (inputs.flashOrbUptime / 100) * FLASH_ORB_FULL_CRIT_RATE;
    return c + d + e + f + g + h + i + k + n + o + p + q + (ARK_CRUSHING_CRATE_TABLE[inputs.crushingCore] || 0);
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
  function blendCritTerms(base, terms) {
    if (!terms.length) return Math.min(base, 1);
    const [{ bonus, p }, ...rest] = terms;
    return p * blendCritTerms(base + bonus, rest) + (1 - p) * blendCritTerms(base, rest);
  }
  function effectiveCritRate(inputs, keenSenseLv, extra) {
    const adrenalineBonus = ADRENALINE_TABLE[inputs.adrenaline] || 0;
    const adrenalineUptime = inputs.adrenalineUptime / 100;
    const backAttackBonus = 0.1;
    const backAttackRate = effectiveBackAttackShare(inputs);
    const flashOrbBonus = FLASH_ORB_FULL_CRIT_RATE;
    const flashOrbUptime = inputs.flashOrbUptime / 100;
    const restOfCrit =
      critRateTotal(inputs, keenSenseLv) -
      adrenalineBonus * adrenalineUptime -
      backAttackBonus * backAttackRate -
      flashOrbBonus * flashOrbUptime;
    return blendCritTerms(restOfCrit + extra, [
      { bonus: adrenalineBonus, p: adrenalineUptime },
      { bonus: backAttackBonus, p: backAttackRate },
      { bonus: flashOrbBonus, p: flashOrbUptime },
    ]);
  }
  function getKeystoneComponents(inputs, shared, keenSenseLv, limitBreakLv, keystone) {
    const S4 = critRateTotal(inputs, keenSenseLv);
    const T4 = S4 + 0.07;
    const S5 = effectiveCritRate(inputs, keenSenseLv, 0);
    const T5 = effectiveCritRate(inputs, keenSenseLv, 0.07);
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
    let mult = ((1 - effCrit) + effCrit * shared.critDmgTotal * (1 + onCrit)) * (1 + evo) * (1 + add);
    const kbwActive = inputs.kbw && inputs.kbw !== "Not Used" && (KBW_TABLE[inputs.kbw] || 0) > 0;
    if (kbwActive) mult *= KBW_EV_MALUS;
    return mult;
  }
  function computeCellStats(inputs, shared, cell) {
    const { keenSense, limitBreak } = cell.split;
    let comps, stats;
    if (cell.keystone === "crit+master") {
      comps = {
        critical: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "critical"),
        master: getKeystoneComponents(inputs, shared, keenSense, limitBreak, "master"),
      };
      stats = {
        critDmg: shared.critDmgTotal,
        critRate: cell.effCrit * 100,
        critRateRaw: cell.rawCrit * 100,
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
        critRateRaw: cell.rawCrit * 100,
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
        critRateRaw: cell.rawCrit * 100,
        onCritDmg: shared.onCritDmgBase * 100,
        evoDmg: comps.pulverize.evo * 100,
        addDmg: comps.master.add * 100,
      };
    }
    stats.breakingMoonActive = shared.breakingMoonActive;
    stats.breakingMoonAdd = shared.breakingMoonAdd;
    return stats;
  }
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
    cells.forEach(c => { c.stats = computeCellStats(inputs, shared, c); });
    const baseEffCrit = effectiveCritRate(inputs, 0, 0);
    const baseStats = {
      critRate: baseEffCrit * 100,
      critRateRaw: critRateTotal(inputs, 0) * 100,
      critDmg: shared.critDmgTotal,
      onCritDmg: shared.onCritDmgBase * 100,
      evoDmg: (shared.yearningEvo + shared.evoKarmaEvo + shared.optimizedTrainingEvo + STANDING_STRIKER_EVO_DMG) * 100,
      addDmg: shared.addDmgBase * 100,
      breakingMoonActive: shared.breakingMoonActive,
      breakingMoonAdd: shared.breakingMoonAdd,
    };
    const bestStats = best ? best.stats : null;
    return { cells, best, baseStats, bestStats, ot1: !!inputs.optimizedTraining };
  }
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
      critStat: CRIT_BASE,
    });
    return { inputsNB, sharedNB: computeShared(inputsNB) };
  }
  function bestComboFor(candidateInputs, sharedOverride) {
    const shared = sharedOverride || computeShared(candidateInputs);
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
    const { inputsNB, sharedNB } = zeroedBraceletInputs(inputs);
    const baselineBest = bestComboFor(inputsNB, sharedNB);
    const baselineMult = baselineBest.mult;
    const addDmgBaseline = baselineBest.pair.indexOf("master") !== -1 ? sharedNB.addDmgMaster : sharedNB.addDmgBase;
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
    function critStatGain(statDelta) {
      const cloned = Object.assign({}, inputsNB);
      cloned.critStat = inputsNB.critStat + statDelta;
      const withBest = bestComboFor(cloned);
      return withBest.mult / baselineMult - 1;
    }
    function addDmgGain(field, tier) {
      const cloned = Object.assign({}, inputsNB);
      cloned[field] = tier;
      const withBest = bestComboFor(cloned);
      return withBest.mult / baselineMult - 1;
    }
    const demonDmgPct = inputs.demonDmgPct / 100;
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
    {
      const cfg = braceSpecConfig(inputs);
      const k = specGainPerPoint(deathbladeSpecMultiplier, cfg.share, cfg.awakeningShare);
      rows.push({
        id: "spec",
        label: ["Spec Stat +", ...trip("80", "100", "120")],
        low: k * 80,
        mid: k * 100,
        high: k * 120,
        specDmgOnly: true,
        specDmgOnlyNote: "This line only reflects direct damage share from Spec - it doesn't capture any non-damage effects Spec offers.",
      });
    }
    {
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
    rows.sort((a, b) => (b.sortKey !== undefined ? b.sortKey : b.high) - (a.sortKey !== undefined ? a.sortKey : a.high));
    return rows;
  }
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
  function computeSingleBracelet(inputsNB, sharedNB, noBraceletMult, inputs, side) {
    const cloned = Object.assign({}, inputsNB);
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
          mainStatDeltaTotal += Math.max(10000, Math.min(16000, line.mainStat || 14000));
        } else {
          const delta = braceletWpLineDelta(line.type, tier);
          wpDeltaTotal += delta.wp;
          mainStatDeltaTotal += delta.mainStat;
        }
      }
    });
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
  function computeAccessoryComparison(inputs) {
    const gridResult = computeGridAndSummary(inputs);
    const best = gridResult.best;
    if (!best) return { necklace: [], earrings: [], rings: [], universal: [] };
    function trip(low, mid, high) {
      return [
        { tier: "low", text: low },
        "/",
        { tier: "mid", text: mid },
        "/",
        { tier: "high", text: high },
      ];
    }
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
    const necklaceNB = Object.assign({}, inputs, { necklace: "None" });
    const sharedNecklaceNB = computeShared(necklaceNB);
    const baselineNecklaceBest = bestComboFor(necklaceNB, sharedNecklaceNB);
    const baselineMultNecklaceNB = baselineNecklaceBest.mult;
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
    const necklaceOut = { low: ACC_NECKLACE_OUT_TABLE.Low, mid: ACC_NECKLACE_OUT_TABLE.Mid, high: ACC_NECKLACE_OUT_TABLE.High };
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
    const ringsNB = Object.assign({}, inputs, {
      ring1Rate: "None",
      ring1Dmg: "None",
      ring2Rate: "None",
      ring2Dmg: "None",
    });
    const sharedRingsNB = computeShared(ringsNB);
    const baselineRingsBest = bestComboFor(ringsNB, sharedRingsNB);
    const baselineMultRingsNB = baselineRingsBest.mult;
    function ringRateGain(tier) {
      const cloned = Object.assign({}, ringsNB, { ring1Rate: tier });
      const withBest = bestComboFor(cloned);
      return withBest.mult / baselineMultRingsNB - 1;
    }
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
      const flatAp = earringsNB.gearFlatAp + gearChaosStarFlat(earringsNB.gearApChaosStar);
      const percentApMult = 1 + gearAttackPowerPercentTotal(earringsNB) / 100;
      const wpPercentMult = 1 + gearWpPercentTotal(earringsNB) / 100;
      const mainStatPercentMult = 1 + earringsNB.gearMainStatPercent / 100;
      const supApBuff = supportApBuff(earringsNB, wp, mainStat, baseApMult);
      const baselineAp = gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult, supApBuff);
      if (wp > 0 && mainStat > 0 && baselineAp > 0) {
        const apPctGain = (deltaPct) =>
          gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult + deltaPct, supApBuff) / baselineAp - 1;
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
    const fullWpPercentMult = 1 + gearWpPercentTotal(inputs) / 100;
    const equippedSide = inputs.avbA;
    const equippedFlatApDelta = equippedSide.line3Type === "ap_flat" ? (ACC_FLAT_AP_TABLE[equippedSide.line3Tier] || 0) : 0;
    const equippedWpDelta = equippedSide.line3Type === "wp_flat" ? (ACC_FLAT_WP_TABLE[equippedSide.line3Tier] || 0) : 0;
    const strippedGearWp = Math.max(0, inputs.gearWp - equippedWpDelta * fullWpPercentMult);
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
    function apTotalFor(cloned, mainStat, flatApDelta, wpDelta) {
      const wpPercentMult = 1 + gearWpPercentTotal(cloned) / 100;
      const wpBase = slot === "earring" ? (strippedGearWp / fullWpPercentMult) * wpPercentMult : cloned.gearWp;
      const wp = wpBase + wpDelta * wpPercentMult;
      const baseApMult = 1 + gearBaseApPercentTotal(cloned) / 100;
      const flatAp = cloned.gearFlatAp + flatApDelta + gearChaosStarFlat(cloned.gearApChaosStar);
      const percentApMult = 1 + gearAttackPowerPercentTotal(cloned) / 100;
      const supApBuff = supportApBuff(inputs, inputs.gearWp, inputs.gearMainStat, 1 + gearBaseApPercentTotal(inputs) / 100);
      return gearApTotal(wp, mainStat, baseApMult, flatAp, percentApMult, supApBuff);
    }
    const otherCritDmgDelta =
      slot === "ring" ? (ACC_RING_DMG_TABLE[inputs.avbOtherLine2Tier] || 0) : 0;
    const zeroed = Object.assign({}, inputs);
    if (slot === "necklace") {
      zeroed.necklace = "None";
    } else if (slot === "ring") {
      zeroed.ring1Rate = "None"; zeroed.ring1Dmg = "None";
      zeroed.ring2Rate = inputs.avbOtherLine1Tier;
      zeroed.ring2Dmg = "None";
    } else if (slot === "earring") {
      zeroed.gearApEarring1 = "None"; zeroed.gearWpEarring1 = "None";
      zeroed.gearApEarring2 = inputs.avbOtherLine1Tier;
      zeroed.gearWpEarring2 = inputs.avbOtherLine2Tier;
    }
    const zeroedGridMult = slot === "earring" ? 1 : gridMultFor(zeroed, 0, otherCritDmgDelta);
    const equippedMainStat = equippedSide.mainStat;
    const noSlotMainStat = Math.max(0, zeroed.gearMainStat - equippedMainStat);
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
        addDmgDelta = ACC_NECKLACE_ADD_TABLE[side.line1Tier] || 0;
        flatMult *= 1 + (ACC_NECKLACE_OUT_TABLE[side.line2Tier] || 0);
      } else if (slot === "ring") {
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
  function computeArkGridComparison(inputs) {
    const gridResult = computeGridAndSummary(inputs);
    const best = gridResult.best;
    if (!best) return [];
    const arkNB = Object.assign({}, inputs, {
      flashyAtk: "None",
      stableAtk: "None|0P",
      swiftCore: "None|0P",
      gearApChaosStar: "None|0P",
      gearWeaponCore: "None|0P",
      crushingCore: "None|0P",
    });
    const currentWeaponCore = ARK_WEAPON_CORE_TABLE[inputs.gearWeaponCore] || { pct: 0, flat: 0 };
    if (currentWeaponCore.pct || currentWeaponCore.flat) {
      const wpPercentMultNB = 1 + gearWpPercentTotal(arkNB) / 100;
      arkNB.gearWp = Math.max(
        0,
        (arkNB.gearWp - currentWeaponCore.flat * wpPercentMultNB) / (1 + currentWeaponCore.pct / 100 / wpPercentMultNB)
      );
    }
    const sharedNB = computeShared(arkNB);
    const baselineArkBest = bestComboFor(arkNB, sharedNB);
    const baselineMult = baselineArkBest.mult;
    function stableAddGain(value) {
      if (!value) return 0;
      const shared = Object.assign({}, sharedNB, {
        addDmgBase: sharedNB.addDmgBase + value,
        addDmgMaster: sharedNB.addDmgMaster + value,
      });
      const withBest = bestComboFor(arkNB, shared);
      return withBest.mult / baselineMult - 1;
    }
    function critLikeGain(mutateFn) {
      const cloned = Object.assign({}, arkNB);
      mutateFn(cloned);
      const withBest = bestComboFor(cloned);
      return withBest.mult / baselineMult - 1;
    }
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
    rows.push({
      label: "Chaos Core: Flashy - Crit Hit Dmg & Dmg%",
      ...points6((grade, pts) => {
        const chitKey = pts === "14P" ? "Epic-Leg 10P" : grade + " 17P";
        const chit = critLikeGain((c) => { c.flashyAtk = chitKey; });
        const dmg = ARK_FLASHY_DMG_TABLE[grade + "|" + pts];
        return (1 + chit) * (1 + dmg) - 1;
      }),
    });
    rows.push({
      label: "Chaos Core: Stable - Additional Dmg",
      ...points6((grade, pts) => stableAddGain(STABLE_ATK_TABLE[grade + "|" + pts])),
    });
    rows.push({
      label: "Chaos Core: Swift - Crit Dmg",
      ...points6((grade, pts) => critLikeGain((c) => { c.swiftCore = grade + "|" + pts; })),
    });
    rows.push({
      label: "Chaos Core: Crushing - Crit Rate",
      ...points6((grade, pts) => critLikeGain((c) => { c.crushingCore = grade + "|" + pts; })),
    });
    rows.push({
      label: "Chaos Core: Smoldering - Boss Dmg & Burn",
      ...points6((grade, pts) => {
        const bossDmg = ARK_SMOLDERING_BOSSDMG_TABLE[grade + "|" + pts];
        const burn = ARK_SMOLDERING_BURN_TABLE[grade];
        return (1 + bossDmg) * (1 + burn) - 1;
      }),
    });
    rows.push({
      label: "Chaos Core: Absorbing - Dmg",
      ...points6((grade, pts) => ARK_ABSORBING_DMG_TABLE[grade + "|" + pts]),
    });
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
    rows.sort((a, b) => b.ancient20 - a.ancient20);
    return rows;
  }
  const ENGRAVING_STONE_OPTIONS = ["1 Lv.", "2 Lv.", "3 Lv.", "4 Lv."];
  const GRUDGE_TABLE = { "0 Nodes": 0.18, "1 Nodes": 0.1875, "2 Nodes": 0.195, "3 Nodes": 0.2025, "4 Nodes": 0.21 };
  const GRUDGE_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.03, "2 Lv.": 0.0375, "3 Lv.": 0.0525, "4 Lv.": 0.06 };
  const CURSED_DOLL_TABLE = { "0 Nodes": 0.14, "1 Nodes": 0.1475, "2 Nodes": 0.155, "3 Nodes": 0.1625, "4 Nodes": 0.17 };
  const CURSED_DOLL_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.03, "2 Lv.": 0.0375, "3 Lv.": 0.0525, "4 Lv.": 0.06 };
  const MASS_INCREASE_TABLE = { "0 Nodes": 0.16, "1 Nodes": 0.1675, "2 Nodes": 0.175, "3 Nodes": 0.1825, "4 Nodes": 0.19 };
  const MASS_INCREASE_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.03, "2 Lv.": 0.0375, "3 Lv.": 0.0525, "4 Lv.": 0.06 };
  const AMBUSH_MASTER_BACK_DMG = 0.15;
  const AMBUSH_MASTER_SECONDARY_TABLE = { "0 Nodes": 0.048, "1 Nodes": 0.055, "2 Nodes": 0.062, "3 Nodes": 0.069, "4 Nodes": 0.076 };
  const AMBUSH_MASTER_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.027, "2 Lv.": 0.034, "3 Lv.": 0.047, "4 Lv.": 0.054 };
  const RAID_CAPTAIN_TABLE = { "0 Nodes": 0.40, "1 Nodes": 0.42, "2 Nodes": 0.44, "3 Nodes": 0.46, "4 Nodes": 0.48 };
  const RAID_CAPTAIN_STONE_TABLE = { "0 Lv.": 0, "1 Lv.": 0.075, "2 Lv.": 0.094, "3 Lv.": 0.132, "4 Lv.": 0.15 };
  const RAID_CAPTAIN_BASE_MOVE_SPEED = 106.32;
  const RAID_CAPTAIN_CLASS_MOVE_SPEED = { re: 12, surge: 10 };
  const SUPPORT_SPEED_BONUS = 9;
  const MAELSTROM_SPEED_BONUS = 12.8;
  const RAID_CAPTAIN_WINE_MOVE_SPEED = 3;
  const SUPPORT_AV_MOVE_SPEED = 8;
  const SUPPORT_PALADIN_MOVE_SPEED = 24.6;
  const SUPPORT_PALADIN_MOVE_SPEED_UPTIME = 35;
  const RAGE_RUNE_SPEED_BONUS = 16;
  const RAGE_RUNE_MOVE_SPEED_UPTIME = 20;
  const RAID_CAPTAIN_MOVE_SPEED_CAP = 140;
  const MANA_FOOD_BLEED_DMG = 0.0075;
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
  function manaFoodBleedApplies(engrInputs, inputs) {
    return engrInputs.spec === "surge" && inputs.braceSpecBuild !== "surge-222";
  }
  function manaFoodLabel(engrInputs, inputs) {
    return manaFoodBleedApplies(engrInputs, inputs) ? "Mana Food + Bleed" : "Mana Food";
  }
  function manaFoodContributionGain(engrInputs, inputs) {
    if (!engrInputs.manaFood) return 0;
    return manaFoodGain(inputs, engrInputs.manaFoodAmount, manaFoodBleedApplies(engrInputs, inputs));
  }
  function raidCaptainWineVsManaFood(engrInputs, inputs) {
    if (engrInputs.spec !== "surge") return null;
    const rcBase = (RAID_CAPTAIN_TABLE[engrInputs.rcLevel] || 0) + (RAID_CAPTAIN_STONE_TABLE[engravingStoneLevel("rc", engrInputs)] || 0);
    const wineFrac = raidCaptainMoveSpeedFraction(Object.assign({}, engrInputs, { wine: true, manaFood: false }), inputs.yearning);
    const foodFrac = raidCaptainMoveSpeedFraction(Object.assign({}, engrInputs, { wine: false, manaFood: true }), inputs.yearning);
    const wineMult = 1 + rcBase * wineFrac;
    const foodMult = (1 + rcBase * foodFrac) * (1 + manaFoodGain(inputs, engrInputs.manaFoodAmount, manaFoodBleedApplies(engrInputs, inputs)));
    return foodMult / wineMult - 1;
  }
  const BASE_ATTACK_SPEED = 106.32;
  const SURGE_IDENTITY_ATTACK_SPEED = 20;
  const EALYN_ATTACK_SPEED = 3;
  const MASS_INCREASE_ATTACK_SPEED_PENALTY = 10;
  const SURGE_ATTACK_SPEED_CAP = 140;
  function surgeEffectiveAttackSpeed(engrInputs, yearning) {
    let atk = BASE_ATTACK_SPEED + SURGE_IDENTITY_ATTACK_SPEED;
    atk += MAELSTROM_SPEED_BONUS * (engrInputs.maelstromUptime / 100);
    if (yearning) atk += SUPPORT_SPEED_BONUS;
    if (engrInputs.rageRune) atk += (RAGE_RUNE_MOVE_SPEED_UPTIME / 100) * RAGE_RUNE_SPEED_BONUS;
    if (engrInputs.miOptIn) atk -= MASS_INCREASE_ATTACK_SPEED_PENALTY;
    return Math.min(atk, SURGE_ATTACK_SPEED_CAP);
  }
  function engravingStoneLevel(key, engrInputs) {
    if (engrInputs.stone1Target === key) return engrInputs.stone1Level;
    if (engrInputs.stone2Target === key) return engrInputs.stone2Level;
    return "0 Lv.";
  }
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
  function engravingStoneImpliesBaseAp(engrInputs) {
    const nodes = (target, level) => (target === "None" ? 0 : parseInt(level, 10) || 0);
    const total = nodes(engrInputs.stone1Target, engrInputs.stone1Level) + nodes(engrInputs.stone2Target, engrInputs.stone2Level);
    return total >= 5;
  }
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
  function engravingCandidateInputs(inputs, engrInputs, flags) {
    const cloned = Object.assign({}, inputs);
    cloned.adrenaline = engrInputs.adrenalineLevel;
    cloned.adrenalineStone = engravingStoneLevel("adrenaline", engrInputs);
    if (!flags.includeKbw) {
      cloned.kbw = "Not Used";
      cloned.kbwStone = "0 Lv.";
    } else {
      cloned.kbw = engrInputs.kbwLevel;
      cloned.kbwStone = engravingStoneLevel("kbw", engrInputs);
    }
    return cloned;
  }
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
  function engravingCandidateBreakdown(candidateInputs, engrInputs, flags, combo, flatMult, neither) {
    const stoneBaseApMult = 1 + abilityStoneBaseApGain(candidateInputs, engrInputs);
    const nodeOnlyEngrInputs = Object.assign({}, engrInputs, {
      stone1Target: "None", stone1Level: "0 Lv.",
      stone2Target: "None", stone2Level: "0 Lv.",
    });
    const nodeOnlyFlatMult = engravingCandidateMultiplier(nodeOnlyEngrInputs, candidateInputs, flags);
    const stoneEngravingFlatMult = (flatMult / stoneBaseApMult) / nodeOnlyFlatMult;
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
  function readEngravingInputs(root) {
    return {
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
      supportPaladin: getCheckbox(root, ".ap-engr-support-paladin", false),
      wine: getCheckbox(root, ".ap-engr-wine", true),
      manaFood: getCheckbox(root, ".ap-engr-manafood", false),
      manaFoodAmount: getNumber(root, ".ap-engr-manafood-amount", 6000),
      stone1Target: getSelect(root, ".ap-engr-stone1-target", "None"),
      stone1Level: getSelect(root, ".ap-engr-stone1-level", "0 Lv."),
      stone2Target: getSelect(root, ".ap-engr-stone2-target", "None"),
      stone2Level: getSelect(root, ".ap-engr-stone2-level", "0 Lv."),
    };
  }
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
  function computeEngravingSetup(inputs, base, side, neither) {
    const { merged, flags } = engravingSvsMergedInputs(base, side);
    const candidate = computeEngravingCandidate(inputs, merged, flags, neither);
    candidate.merged = merged;
    return candidate;
  }
  function computeEngravingSetupComparison(inputs, base, svsA, svsB) {
    const bareBase = Object.assign({}, base, {
      stone1Target: "None", stone1Level: "0 Lv.",
      stone2Target: "None", stone2Level: "0 Lv.",
    });
    const neither = computeEngravingCandidate(inputs, bareBase, {
      includeRC: false, includeKbw: false, includeCD: false, includeMI: false,
    });
    const a = computeEngravingSetup(inputs, base, svsA, neither);
    const b = computeEngravingSetup(inputs, base, svsB, neither);
    const sideResult = (r) => ({
      vsNeither: r.totalMult / neither.totalMult - 1,
      stoneApGain: abilityStoneBaseApGain(inputs, r.merged),
      keystoneLabel: KEYSTONE_LABELS[r.combo.pair],
      splitLabel: r.combo.split.label,
      comboKey: r.combo.pair + "|" + r.combo.split.key,
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
  function engravingIsolatedGridInputs(inputs, engrInputs) {
    return Object.assign({}, inputs, {
      adrenaline: engrInputs.adrenalineLevel,
      adrenalineStone: engravingStoneLevel("adrenaline", engrInputs),
      kbw: engrInputs.kbwLevel,
      kbwStone: engravingStoneLevel("kbw", engrInputs),
    });
  }
  function kbwContributionGain(isolatedInputs) {
    return kbwRealizedGainPct(isolatedInputs) / 100;
  }
  function computeEngravingComparison(inputs, engrInputs) {
    const gridResult = computeGridAndSummary(inputs);
    const best = gridResult.best;
    if (!best) return null;
    const shared = computeShared(inputs);
    const isolatedInputs = engravingIsolatedGridInputs(inputs, engrInputs);
    const isolatedGrid = computeGridAndSummary(isolatedInputs);
    const isolatedBest = pinnedCellFrom(isolatedGrid, isolatedGrid.best) || best;
    const isolatedBestStats = (isolatedBest && isolatedBest.stats) || gridResult.bestStats;
    const isolatedShared = computeShared(isolatedInputs);
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
        note: "Recomputes the best setup with vs without, so the winning keystone/split can flip. Follows Adrenaline Uptime % setting from the Ark Passive section above.",
      },
      { label: "Raid Captain", gain: raidCaptainGain(engrInputs, inputs) },
      {
        label: "Keen Blunt Weapon",
        gain: kbwContributionGain(isolatedInputs),
        note: "Recomputes the best setup with vs without, so the winning keystone/split can flip.",
      },
      { label: "Cursed Doll", gain: cursedDollGain(engrInputs, inputs) },
      engrInputs.spec !== "re"
        ? { label: "Mass Increase", gain: massIncreaseGain(engrInputs, inputs) }
        : null,
      {
        label: "Ability Stone Base AP",
        gain: abilityStoneBaseApGain(inputs, engrInputs),
        note: "Only applies once Stone 1 + Stone 2 add up to Lv.5 or higher combined.",
      },
      {
        label: "Mana Food",
        gain: manaFoodContributionGain(engrInputs, inputs),
        note: engrInputs.spec === "surge"
          ? "Includes using the Bleed rune on Maelstrom. Not tied to any one engraving."
          : null,
      },
    ].filter(Boolean);
    function flatBucketStoneMarginal(nodeVal, stoneTable) {
      return ENGRAVING_STONE_OPTIONS.map((lv) => (stoneTable[lv] || 0) / (1 + nodeVal));
    }
    const kbwOnCrit = isolatedBestStats.onCritDmg / 100;
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
  function formatPctBare(val) {
    return ((val || 0) * 100).toFixed(2) + "%";
  }
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
    const critRateFromStat = roundDown((inputs.critStat * 0.03579099) / 100, 4);
    const spanCrit = root.querySelector('.ap-value-display[data-for="ap-crit-stat"]');
    if (spanCrit) {
      const pct = critRateFromStat * 100;
      spanCrit.textContent = "(" + pct.toFixed(2) + "%)";
    }
    const weaponDmg = 0.1 + 0.00002 * inputs.weaponQuality * inputs.weaponQuality;
    const spanWep = root.querySelector('.ap-value-display[data-for="ap-weapon-quality"]');
    if (spanWep) {
      const pct = weaponDmg * 100;
      spanWep.textContent = "(" + pct.toFixed(2) + "%)";
    }
    const astrogemDmg = roundDown(inputs.astrogemLv * 8.0834, 0) / 10000;
    const spanAstro = root.querySelector('.ap-value-display[data-for="ap-astrogem-lv"]');
    if (spanAstro) {
      spanAstro.textContent = formatPct(astrogemDmg);
    }
    setDisplay(
      "#ap-gear-ability-stone-base-ap",
      inputs.gearAbilityStoneBaseAp ? ABILITY_STONE_BASE_AP_BONUS / 100 : 0
    );
    const spanGearAstro = root.querySelector('.ap-value-display[data-for="ap-gear-ap-astrogem-lv"]');
    if (spanGearAstro) {
      spanGearAstro.textContent = formatPct(gearAstrogemApPercent(inputs) / 100);
    }
    const spanGearWpKarma = root.querySelector('.ap-value-display[data-for="ap-gear-wp-karma-lv"]');
    if (spanGearWpKarma) {
      spanGearWpKarma.textContent = formatPct(gearWpKarmaPercent(inputs) / 100);
    }
    setDisplay("#ap-necklace", NECKLACE_ADD_TABLE[inputs.necklace] || 0);
    setDisplay("#ap-sh-pet", SH_PET_TABLE[inputs.shPet] || 0);
    setDisplay("#ap-evo-karma", EVO_KARMA_MAP[inputs.evoKarmaRank] || 0);
    setDisplay("#ap-yearning", inputs.yearning ? 0.14 : 0);
    setDisplay("#ap-ot1", inputs.optimizedTraining ? OPTIMIZED_TRAINING_EVO_DMG : 0);
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
    setDisplay("#ap-gear-ap-kazeros", inputs.gearApKazeros ? GEAR_AP_KAZEROS / 100 : 0);
    setDisplay("#ap-gear-ap-guardian", inputs.gearApGuardian ? GEAR_AP_GUARDIAN / 100 : 0);
    setDisplay("#ap-gear-atropine-uptime", ((inputs.gearAtropineUptime / 100) * GEAR_AP_ATROPINE_FULL) / 100);
    setDisplay("#ap-gear-strength-orb-uptime", ((inputs.gearStrengthOrbUptime / 100) * STRENGTH_ORB_FULL_AP) / 100);
    setDisplay("#ap-flash-orb-uptime", (inputs.flashOrbUptime / 100) * FLASH_ORB_FULL_CRIT_RATE);
    const gearApTotalSpan = root.querySelector('.ap-value-display[data-for="ap-gear-ap-total"]');
    if (gearApTotalSpan) {
      gearApTotalSpan.textContent = "(" + gearAttackPowerPercentTotal(inputs).toFixed(2) + "%)";
    }
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
    const list = root.querySelector(".ap-calc-results");
    if (!list) return;
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
    const ranked = allRanked.slice(0, 3);
    const sameCombo = (a, b) => !!a && !!b && a.split.key === b.split.key && a.keystone === b.keystone;
    const pinnedCell = pinnedCombo
      ? result.cells.find((c) => c.split.key === pinnedCombo.splitKey && c.keystone === pinnedCombo.pair) || null
      : null;
    const pinnedTrueRank = pinnedCell ? allRanked.findIndex((c) => sameCombo(c, pinnedCell)) + 1 : null;
    const displayRows = ranked.slice();
    const pinnedForcedIn = !!pinnedCell && !ranked.some((c) => sameCombo(c, pinnedCell));
    if (pinnedForcedIn) displayRows[2] = pinnedCell;
    displayRows.forEach((cell, i) => {
      if (!cell) return;
      const rank = i + 1;
      const rowEl = list.querySelector('.ap-calc-result-row[data-rank="' + rank + '"]');
      if (!rowEl) return;
      const rankEl = rowEl.querySelector(".ap-result-rank");
      const comboEl = rowEl.querySelector(".ap-result-combo");
      const pctEl = rowEl.querySelector(".ap-result-pct");
      const deltaEl = rowEl.querySelector(".ap-result-delta");
      const forcedHere = rank === 3 && pinnedForcedIn;
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
    list.classList.toggle("ap-calc-results-pinned", !!pinnedCombo);
    const cardRank = Math.min(Math.max(state.previewRank || 1, 1), ranked.length || 1);
    const cardCell = pinnedCell || ranked[cardRank - 1] || ranked[0] || null;
    const cardEl = root.querySelector(".ap-stat-card-best");
    const titleEl = cardEl && cardEl.querySelector(".ap-stat-card-title");
    if (titleEl) {
      if (pinnedCell) {
        const rankLabels = { 1: "Best", 2: "2nd Best", 3: "3rd Best" };
        const rankLabel = rankLabels[pinnedTrueRank] || (pinnedTrueRank ? ordinal(pinnedTrueRank) + " Best" : null);
        titleEl.textContent = rankLabel ? "Pinned Setup (" + rankLabel + ")" : "Pinned Setup";
      } else {
        const rankTitles = { 1: "Best Setup", 2: "2nd Best Setup", 3: "3rd Best Setup" };
        titleEl.textContent = rankTitles[cardRank] || "Best Setup";
      }
    }
    if (cardEl) {
      cardEl.classList.toggle("ap-stat-card-pinned", !!pinnedCell);
      cardEl.classList.toggle("ap-stat-card-previewed", !pinnedCell && cardRank !== 1);
    }
    const base = result.baseStats;
    if (base) {
      const rateEl = root.querySelector(".ap-summary-base-critrate");
      const rateRawEl = root.querySelector(".ap-summary-base-critrate-raw");
      const dmgEl = root.querySelector(".ap-summary-base-critdmg");
      const onCritEl = root.querySelector(".ap-summary-base-oncrit");
      const evoEl = root.querySelector(".ap-summary-base-evodmg");
      const addEl = root.querySelector(".ap-summary-base-adddmg");
      if (rateEl) rateEl.textContent = base.critRate.toFixed(2) + "%";
      if (rateRawEl) {
        const raw = base.critRateRaw;
        rateRawEl.textContent = raw.toFixed(2) + "%";
        rateRawEl.classList.toggle("ap-summary-value-warn", raw > 100);
      }
      const baseCritDmgDisplay = base.critDmg - (base.breakingMoonActive ? base.breakingMoonAdd : 0);
      if (dmgEl) dmgEl.textContent = (baseCritDmgDisplay * 100).toFixed(2) + "%";
      if (onCritEl) onCritEl.textContent = base.onCritDmg.toFixed(2) + "%";
      if (evoEl) evoEl.textContent = base.evoDmg.toFixed(2) + "%";
      if (addEl) addEl.textContent = base.addDmg.toFixed(2) + "%";
      const bmRow = root.querySelector(".ap-stat-card-row--breakingmoon-base");
      const bmEl = root.querySelector(".ap-summary-base-breakingmoon");
      if (bmRow) bmRow.classList.toggle("ap-stat-card-row--hidden", !base.breakingMoonActive);
      if (bmEl) bmEl.textContent = (base.breakingMoonAdd * 100).toFixed(2) + "%";
    }
    const best = (cardCell && cardCell.stats) || result.bestStats;
    if (best) {
      const critEl = root.querySelector(".ap-summary-best-crit");
      const critRawEl = root.querySelector(".ap-summary-best-crit-raw");
      const dmgEl = root.querySelector(".ap-summary-best-critdmg");
      const onCritEl = root.querySelector(".ap-summary-best-oncrit");
      const evoEl = root.querySelector(".ap-summary-best-evodmg");
      const addEl = root.querySelector(".ap-summary-best-adddmg");
      if (critEl) critEl.textContent = best.critRate.toFixed(2) + "%";
      if (critRawEl) {
        const raw = best.critRateRaw;
        critRawEl.textContent = raw.toFixed(2) + "%";
        critRawEl.classList.toggle("ap-summary-value-warn", raw > 100);
      }
      const bestCritDmgDisplay = best.critDmg - (best.breakingMoonActive ? best.breakingMoonAdd : 0);
      if (dmgEl) dmgEl.textContent = (bestCritDmgDisplay * 100).toFixed(2) + "%";
      if (onCritEl) onCritEl.textContent = best.onCritDmg.toFixed(2) + "%";
      if (evoEl) evoEl.textContent = best.evoDmg.toFixed(2) + "%";
      if (addEl) addEl.textContent = best.addDmg.toFixed(2) + "%";
      const bmRow = root.querySelector(".ap-stat-card-row--breakingmoon-best");
      const bmEl = root.querySelector(".ap-summary-best-breakingmoon");
      if (bmRow) bmRow.classList.toggle("ap-stat-card-row--hidden", !best.breakingMoonActive);
      if (bmEl) bmEl.textContent = (best.breakingMoonAdd * 100).toFixed(2) + "%";
    }
  }
  function renderComparisonRows(container, rows) {
    if (!container) return;
    container.innerHTML = "";
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      const labelTd = window.SiteUtils.el("td", "ap-brace-row-label");
      row.label.forEach((part) => {
        if (typeof part === "string") {
          labelTd.appendChild(document.createTextNode(part));
          return;
        }
        const span = window.SiteUtils.el("span", part.downside ? "ap-brace-label-downside" : "ap-brace-label-" + part.tier, part.text);
        labelTd.appendChild(span);
      });
      if (row.specDmgOnly) {
        const badge = window.SiteUtils.el("span", "ap-brace-label-caveat", "dmg only");
        badge.title = row.specDmgOnlyNote;
        badge.setAttribute("role", "img");
        badge.setAttribute("aria-label", row.specDmgOnlyNote);
        labelTd.appendChild(badge);
      }
      if (row.note) {
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
      if (row.combos) {
        ["LL", "ML", "MM", "HL", "HM", "HH"].forEach((key) => {
          const val = row.combos[key];
          const td = window.SiteUtils.el("td", "ap-brace-tier-val ap-acc-combo-val", val === undefined ? "\u2013" : formatPctBare(val));
          tr.appendChild(td);
        });
      }
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
  const SPEC_NOTE_TEXT_RE = "This only reflects Spec's damage share on RE - it doesn't capture CDR or orb gen.";
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
      diffEl.classList.toggle("ap-esvs-diff-a", aWins);
      diffEl.classList.toggle("ap-esvs-diff-b", !aWins);
    }
  }
  function renderArkGridComparison(root, rows) {
    const container = root.querySelector(".ap-arkgrid-compare-rows");
    if (!container) return;
    container.innerHTML = "";
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
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
  const MANAFOOD_TIP_BASE_TEXT = "Only accurate if the Main Stat input in Character Data doesn't already include Mana Food's Main Stat bonus.";
  const MANAFOOD_TIP_222_SUFFIX = " 222 may not need Mana Food to equip Maelstrom Bleed.";
  function renderEngravingComparison(root, result, engrInputs, overallBest) {
    const isSurge = engrInputs.spec === "surge";
    const manaFoodHasBleed = isSurge && !is222Build(root);
    const rageRuneRow = root.querySelector(".ap-engr-rage-rune-row");
    if (rageRuneRow) rageRuneRow.style.display = isSurge ? "" : "none";
    const wineRow = root.querySelector(".ap-engr-wine-row");
    if (wineRow) wineRow.style.display = isSurge ? "" : "none";
    const manaFoodRow = root.querySelector(".ap-engr-manafood-row");
    if (manaFoodRow) manaFoodRow.style.display = "";
    const manaFoodLabelEl = root.querySelector(".ap-engr-manafood-label");
    if (manaFoodLabelEl) {
      manaFoodLabelEl.textContent = manaFoodHasBleed
        ? "Mana Food (+Maelstrom Bleed)"
        : "Mana Food (Main Stat only)";
    }
    const miRow = root.querySelector(".ap-engr-mi-row");
    if (miRow) miRow.style.display = isSurge ? "" : "none";
    const bestComboFoodIcon = root.querySelector(".ap-engr-best-combo-food-icon");
    if (bestComboFoodIcon) bestComboFoodIcon.style.display = isSurge ? "" : "none";
    if (!result) return;
    function appendFeastIcon(el) {
      const icon = document.createElement("img");
      icon.className = "skill-icon ap-engr-feast-icon";
      icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "icon-feast.png");
      icon.alt = "Feast";
      icon.title = "Assumes an Atk/Move Speed feast is active.";
      icon.loading = "lazy";
      window.SiteUtils.hideOnError(icon, "display");
      el.appendChild(icon);
    }
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
        foodNoteEl.textContent =
          winner + " beats " + loser + " by " + Math.abs(pct).toFixed(2) + "%.";
      }
    }
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
  function renderEngravingSvsCard(root, prefix, side) {
    const set = (selector, text) => {
      const el = root.querySelector(selector);
      if (el) el.textContent = text;
    };
    set(".ap-esvs-" + prefix + "-vs-none", formatBvbPct(side.vsNeither));
    set(".ap-esvs-" + prefix + "-keystone", side.splitLabel + " + " + side.keystoneLabel);
    set(".ap-esvs-" + prefix + "-engr-gain", formatBvbPct(side.breakdown.engravingGain));
    set(".ap-esvs-" + prefix + "-stone-engr-gain", formatBvbPct(side.breakdown.stoneEngravingGain));
    set(".ap-esvs-" + prefix + "-stone-ap", formatBvbPct(side.breakdown.stoneBaseApGain));
  }
  function renderEngravingSetupComparison(root, result, overallBest, isSurge) {
    const foodIcon = root.querySelector(".ap-esvs-food-icon");
    if (foodIcon) foodIcon.style.display = isSurge ? "" : "none";
    if (!result) return;
    renderEngravingSvsCard(root, "a", result.a);
    renderEngravingSvsCard(root, "b", result.b);
    const noneEl = root.querySelector(".ap-esvs-no-setup-keystone");
    if (noneEl) noneEl.textContent = result.neither.splitLabel + " + " + result.neither.keystoneLabel;
    const diffEl = root.querySelector(".ap-esvs-diff");
    if (diffEl) {
      const aWins = result.aVsB >= 0;
      diffEl.textContent = (aWins ? "Setup A" : "Setup B") + " wins by " + formatBvbPct(Math.abs(result.aVsB));
      diffEl.classList.toggle("ap-esvs-diff-a", aWins);
      diffEl.classList.toggle("ap-esvs-diff-b", !aWins);
    }
    const keystoneNoteEl = root.querySelector(".ap-esvs-keystone-note");
    if (keystoneNoteEl) keystoneNoteEl.hidden = !result.keystonesDiffer;
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
    }
    return 1;
  }
  function setActivePresetId(id) {
    try {
      localStorage.setItem(ACTIVE_PRESET_KEY, String(id));
    } catch (e) {
    }
  }
  function collectFieldData(root) {
    const data = {};
    root.querySelectorAll("input, select").forEach((el) => {
      if (!el.id) return;
      data[el.id] = (el.type === "checkbox" || el.type === "radio") ? el.checked : el.value;
    });
    return data;
  }
  function applyFieldData(root, data, skippedOut) {
    if (!data || typeof data !== "object") return;
    const seen = {};
    root.querySelectorAll("input, select").forEach((el) => {
      if (!el.id || !(el.id in data)) return;
      seen[el.id] = true;
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = !!data[el.id];
      } else if (el.tagName === "SELECT") {
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
    }
  }
  function loadInputs(root, presetId) {
    try {
      const raw = localStorage.getItem(presetStorageKey(presetId));
      if (!raw) return;
      applyFieldData(root, JSON.parse(raw));
    } catch (e) {
    }
  }
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
    }
    resetFieldsToDefaults(root);
    normalizeSpeedChoiceExclusivity(root);
    syncSpeedChoiceFamilyTracking(root);
    syncFamilyVariantMemory(root);
    syncMaelstromUptimeGroupTracking(root);
    resetAvbMemory(root);
    update(root);
  }
  function switchPreset(root, newId) {
    if (newId === getActivePresetId()) return;
    resetFieldsToDefaults(root);
    loadInputs(root, newId);
    setActivePresetId(newId);
    normalizeChaosCoreExclusivity(root);
    normalizeWeaponCoreExclusivity(root);
    normalizeRaidContributionExclusivity(root);
    normalizeSupportMoveSpeedExclusivity(root);
    normalizeSpeedChoiceExclusivity(root);
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
  function extractImportData(parsed) {
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.data && typeof parsed.data === "object") return parsed.data;
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
    normalizeChaosCoreExclusivity(root);
    normalizeWeaponCoreExclusivity(root);
    normalizeRaidContributionExclusivity(root);
    normalizeSupportMoveSpeedExclusivity(root);
    normalizeSpeedChoiceExclusivity(root);
    syncSpeedChoiceFamilyTracking(root);
    syncFamilyVariantMemory(root);
    syncMaelstromUptimeGroupTracking(root);
    resetAvbMemory(root);
    saveInputs(root, activeId);
    update(root);
    let msg = "Imported into Preset " + activeId + ".";
    if (skipped.length) {
      msg += " " + skipped.length + " field" + (skipped.length === 1 ? "" : "s") +
        " in that data didn't match anything on this page and " +
        (skipped.length === 1 ? "was" : "were") + " left as-is: " + skipped.join(", ") + ".";
    }
    showPopoverMessage(popoverEl, msg, skipped.length > 0);
  }
  function enforcePartyCheckboxLimit(root) {
    const boxes = PARTY_CHECKBOX_LIMIT_SELECTORS.map((sel) => root.querySelector(sel)).filter(Boolean);
    const checkedCount = boxes.filter((b) => b.checked).length;
    boxes.forEach((b) => {
      b.disabled = !b.checked && checkedCount >= PARTY_CHECKBOX_LIMIT;
    });
  }
  function enforceGearSupportUptimeGate(root) {
    const yearningEl = root.querySelector(".ap-yearning");
    if (!yearningEl) return;
    [
      ".ap-gear-support-uptime",
      ".ap-gear-strength-orb-uptime",
      ".ap-flash-orb-uptime",
      ".ap-engr-support-av",
      ".ap-engr-support-paladin",
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
    enforceBvbLineExclusivity(root);
    enforceBvbLineControls(root);
    enforceAvbSlotUI(root);
    enforceAvbLineControls(root);
    enforceEngravingStoneExclusivity(root);
    enforceStoneSlotExclusivity(root, "ap-esvs-a");
    enforceStoneSlotExclusivity(root, "ap-esvs-b");
    enforceEngravingSvsSlotExclusivity(root, isSurgeBuild(root));
    const selection = getApCalcSelection(root);
    activePinnedCombo = resolvePinnedCombo(selection.pinnedCombo, getCheckbox(root, ".ap-ot1", false));
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
  function normalizeChaosCoreExclusivity(root) {
    const flashyEl = root.querySelector(".ap-flashy-atk");
    const stableEl = root.querySelector(".ap-stable-atk");
    const swiftEl = root.querySelector(".ap-swift-core");
    if (!flashyEl || !stableEl || !swiftEl) return;
    if (stableEl.value !== "None|0P") {
      flashyEl.value = "None";
      swiftEl.value = "None|0P";
    } else if (flashyEl.value !== "None") {
      swiftEl.value = "None|0P";
    }
  }
  function normalizeWeaponCoreExclusivity(root) {
    const chaosStarEl = root.querySelector(".ap-gear-ap-chaos-star");
    const weaponCoreEl = root.querySelector(".ap-gear-weapon-core");
    if (!chaosStarEl || !weaponCoreEl) return;
    if (chaosStarEl.value !== "None|0P" && weaponCoreEl.value !== "None|0P") {
      weaponCoreEl.value = "None|0P";
    }
  }
  function normalizeRaidContributionExclusivity(root) {
    const kazerosEl = root.querySelector(".ap-gear-ap-kazeros");
    const guardianEl = root.querySelector(".ap-gear-ap-guardian");
    if (!kazerosEl || !guardianEl) return;
    if (kazerosEl.checked && guardianEl.checked) {
      guardianEl.checked = false;
    }
  }
  function normalizeSupportMoveSpeedExclusivity(root) {
    const avEl = root.querySelector(".ap-engr-support-av");
    const paladinEl = root.querySelector(".ap-engr-support-paladin");
    if (!avEl || !paladinEl) return;
    if (avEl.checked && paladinEl.checked) {
      paladinEl.checked = false;
    }
  }
  function normalizeSpeedChoiceExclusivity(root) {
    if (!isSurgeBuild(root)) return;
    const wineEl = root.querySelector(".ap-engr-wine");
    const manaFoodEl = root.querySelector(".ap-engr-manafood");
    let keptOne = false;
    [wineEl, manaFoodEl].filter(Boolean).forEach((el) => {
      if (!el.checked) return;
      if (keptOne) el.checked = false;
      else keptOne = true;
    });
  }
  function syncSpeedChoiceFamilyTracking(root) {
    const buildSelectEl = root.querySelector(".ap-brace-spec-build");
    if (!buildSelectEl) return;
    buildSelectEl.dataset.lastFamilyIsSurge = isSurgeBuild(root) ? "1" : "0";
  }
  function syncMaelstromUptimeGroupTracking(root) {
    const buildSelectEl = root.querySelector(".ap-brace-spec-build");
    if (!buildSelectEl) return;
    buildSelectEl.dataset.lastMaelstromGroup = maelstromUptimeDefaultGroup(root);
  }
  function syncFamilyVariantMemory(root) {
    const buildSelectEl = root.querySelector(".ap-brace-spec-build");
    if (!buildSelectEl) return;
    delete buildSelectEl.dataset.reMemory;
    delete buildSelectEl.dataset.surgeMemory;
    const current = normalizeBraceSpecBuild(buildSelectEl.value);
    const family = (BRACE_SPEC_BUILDS[current] && BRACE_SPEC_BUILDS[current].isSurge) ? "surge" : "re";
    buildSelectEl.dataset[family + "Memory"] = current;
  }
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
  function enforceKbwStoneDependency(root) {
    const kbwEl = root.querySelector(".ap-kbw");
    const stoneEl = root.querySelector(".ap-kbw-stone");
    if (!kbwEl || !stoneEl) return;
    const kbwUnused = kbwEl.value === "Not Used";
    if (kbwUnused) stoneEl.value = "0 Lv.";
    stoneEl.disabled = kbwUnused;
  }
  function enforceStoneSlotExclusivity(root, prefix) {
    const t1 = root.querySelector("." + prefix + "-stone1-target");
    const l1 = root.querySelector("." + prefix + "-stone1-level");
    const t2 = root.querySelector("." + prefix + "-stone2-target");
    const l2 = root.querySelector("." + prefix + "-stone2-level");
    if (!t1 || !l1 || !t2 || !l2) return;
    if (t1.value !== "None" && t1.value === t2.value) t2.value = "None";
    if (t1.value === "None") l1.value = "0 Lv.";
    if (t2.value === "None") l2.value = "0 Lv.";
    l1.disabled = t1.value === "None";
    l2.disabled = t2.value === "None";
    [[t1, t2], [t2, t1]].forEach(([self, other]) => {
      Array.from(self.options).forEach((opt) => {
        if (opt.value === "None") { opt.disabled = false; return; }
        opt.disabled = other.value === opt.value;
      });
    });
  }
  function enforceEngravingStoneExclusivity(root) {
    enforceStoneSlotExclusivity(root, "ap-engr");
  }
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
  function enforceBvbLineControls(root) {
    ["a", "b"].forEach((prefix) => {
      const effect2TypeEl = root.querySelector(".ap-bvb-" + prefix + "-effect2-type");
      if (effect2TypeEl) {
        const critEl = root.querySelector(".ap-bvb-" + prefix + "-crit");
        const effect2MainStatEl = root.querySelector(".ap-bvb-" + prefix + "-effect2-mainstat");
        const effect2Type = effect2TypeEl.value;
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
    root.querySelectorAll(".ap-avb-wp-row").forEach((el) => {
      el.classList.toggle("ap-stat-card-row--hidden", !cfg.hasWpRow);
    });
    root.querySelectorAll(".ap-avb-lineratio-row").forEach((el) => {
      el.classList.toggle("ap-stat-card-row--hidden", !cfg.hasLineRatioRow);
    });
    ["a", "b"].forEach((prefix) => {
      setTierOptionValues(root.querySelector(".ap-avb-" + prefix + "-line1-tier"), cfg.line1Table, formatTierPct);
      setTierOptionValues(root.querySelector(".ap-avb-" + prefix + "-line2-tier"), cfg.line2Table, formatTierPct);
      const msEl = root.querySelector(".ap-avb-" + prefix + "-mainstat");
      if (msEl) {
        msEl.min = range.min;
        msEl.max = range.max;
        msEl.title = "This accessory's own Main Stat (" + cfg.name + " range: " + range.min.toLocaleString() + "-" + range.max.toLocaleString() + ").";
        const current = parseFloat(msEl.value);
        if (isFinite(current)) {
          msEl.value = Math.max(range.min, Math.min(range.max, current));
        }
      }
    });
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
  function enforceAvbLineControls(root) {
    ["a", "b"].forEach((prefix) => {
      const base = ".ap-avb-" + prefix + "-line3";
      const typeEl = root.querySelector(base + "-type");
      const tierEl = root.querySelector(base + "-tier");
      if (!typeEl || !tierEl) return;
      const hasTier = typeEl.value !== "none";
      tierEl.hidden = !hasTier;
      tierEl.disabled = !hasTier;
      if (typeEl.value === "ap_flat") {
        setTierOptionValues(tierEl, ACC_FLAT_AP_TABLE, (v) => v + " AP");
      } else if (typeEl.value === "wp_flat") {
        setTierOptionValues(tierEl, ACC_FLAT_WP_TABLE, (v) => v + " WP");
      }
    });
  }
  function enforceBvbLineExclusivity(root) {
    ["a", "b"].forEach((prefix) => {
      const typeEls = [1, 2, 3]
        .map((n) => root.querySelector(".ap-bvb-" + prefix + "-line" + n + "-type"))
        .filter(Boolean);
      if (typeEls.length < 2) return;
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
  function initApCalcRoot(root) {
    if (root.dataset.apCalcInit) return;
    root.dataset.apCalcInit = "1";
    {
      const activeId = getActivePresetId();
      loadInputs(root, activeId);
      normalizeChaosCoreExclusivity(root);
      normalizeWeaponCoreExclusivity(root);
      normalizeRaidContributionExclusivity(root);
      normalizeSupportMoveSpeedExclusivity(root);
      normalizeSpeedChoiceExclusivity(root);
      syncSpeedChoiceFamilyTracking(root);
      syncFamilyVariantMemory(root);
      syncMaelstromUptimeGroupTracking(root);
      resetAvbMemory(root);
      updatePresetButtonStates(root);
      root.querySelectorAll(".ap-calc-result-row").forEach((rowEl) => {
        const rank = parseInt(rowEl.dataset.rank, 10);
        const preview = () => {
          const state = getApCalcSelection(root);
          if (state.pinnedCombo) return;
          state.previewRank = rank;
          update(root);
        };
        rowEl.addEventListener("click", preview);
        rowEl.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            preview();
          }
        });
      });
      root.querySelectorAll(".ap-result-pin").forEach((pinEl) => {
        const rowEl = pinEl.closest(".ap-calc-result-row");
        if (!rowEl) return;
        pinEl.addEventListener("keydown", (ev) => {
          ev.stopPropagation();
        });
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
      const flashyEl = root.querySelector(".ap-flashy-atk");
      const stableEl = root.querySelector(".ap-stable-atk");
      const swiftEl = root.querySelector(".ap-swift-core");
      if (flashyEl && stableEl && swiftEl) {
        flashyEl.addEventListener("change", () => {
          if (flashyEl.value !== "None") {
            stableEl.value = "None|0P";
            swiftEl.value = "None|0P";
          }
        });
        stableEl.addEventListener("change", () => {
          if (stableEl.value !== "None|0P") {
            flashyEl.value = "None";
            swiftEl.value = "None|0P";
          }
        });
        swiftEl.addEventListener("change", () => {
          if (swiftEl.value !== "None|0P") {
            flashyEl.value = "None";
            stableEl.value = "None|0P";
          }
        });
      }
      const chaosStarEl = root.querySelector(".ap-gear-ap-chaos-star");
      const weaponCoreEl = root.querySelector(".ap-gear-weapon-core");
      if (chaosStarEl && weaponCoreEl) {
        chaosStarEl.addEventListener("change", () => {
          if (chaosStarEl.value !== "None|0P") weaponCoreEl.value = "None|0P";
        });
        weaponCoreEl.addEventListener("change", () => {
          if (weaponCoreEl.value !== "None|0P") chaosStarEl.value = "None|0P";
        });
      }
      const kazerosEl = root.querySelector(".ap-gear-ap-kazeros");
      const guardianEl = root.querySelector(".ap-gear-ap-guardian");
      if (kazerosEl && guardianEl) {
        kazerosEl.addEventListener("change", () => {
          if (kazerosEl.checked) guardianEl.checked = false;
        });
        guardianEl.addEventListener("change", () => {
          if (guardianEl.checked) kazerosEl.checked = false;
        });
      }
      const wineEl = root.querySelector(".ap-engr-wine");
      const manaFoodEl = root.querySelector(".ap-engr-manafood");
      const speedChoiceEls = [wineEl, manaFoodEl].filter(Boolean);
      speedChoiceEls.forEach((el) => {
        el.addEventListener("change", () => {
          if (el.checked) {
            speedChoiceEls.forEach((other) => {
              if (other !== el) other.checked = false;
            });
          }
        });
      });
      const supportAvEl = root.querySelector(".ap-engr-support-av");
      const supportPaladinEl = root.querySelector(".ap-engr-support-paladin");
      const supportMoveSpeedEls = [supportAvEl, supportPaladinEl].filter(Boolean);
      supportMoveSpeedEls.forEach((el) => {
        el.addEventListener("change", () => {
          if (el.checked) {
            supportMoveSpeedEls.forEach((other) => {
              if (other !== el) other.checked = false;
            });
          }
        });
      });
      const buildSelectEl = root.querySelector(".ap-brace-spec-build");
      if (buildSelectEl) {
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
        dockPanelEl.addEventListener("click", (ev) => {
          if (ev.target.closest(".ap-build-chip")) setDockOpen(false);
        });
      }
      if (manaFoodEl && buildSelectEl) {
        if (buildSelectEl.dataset.lastFamilyIsSurge === undefined) {
          buildSelectEl.dataset.lastFamilyIsSurge = isSurgeBuild(root) ? "1" : "0";
        }
        buildSelectEl.addEventListener("change", () => {
          const nowIsSurge = isSurgeBuild(root);
          const lastIsSurge = buildSelectEl.dataset.lastFamilyIsSurge === "1";
          if (nowIsSurge !== lastIsSurge) {
            manaFoodEl.checked = !nowIsSurge;
            buildSelectEl.dataset.lastFamilyIsSurge = nowIsSurge ? "1" : "0";
          }
        });
      }
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
      const scheduleUpdate = window.SiteUtils.rafSchedule(() => {
        update(root);
        saveInputs(root, getActivePresetId());
      });
      root.querySelectorAll("input, select").forEach((el) => {
        el.setAttribute("autocomplete", "off");
      });
      root.querySelectorAll("input, select").forEach((el) => {
        if (!el.matches(".ap-gear-wp, .ap-gear-main-stat, .ap-gear-flat-ap, .ap-avb-a-mainstat, .ap-avb-b-mainstat")) {
          el.addEventListener("input", scheduleUpdate);
        }
        el.addEventListener("change", scheduleUpdate);
      });
      root.querySelectorAll('input[type="number"]').forEach((el) => {
        if (el.matches(".ap-avb-a-mainstat, .ap-avb-b-mainstat")) return;
        const min = el.min !== "" ? parseFloat(el.min) : -Infinity;
        const max = el.max !== "" ? parseFloat(el.max) : Infinity;
        window.SiteUtils.clampOnBlur(el, min, max, scheduleUpdate, {
          emptyValue: () => el.defaultValue,
        });
      });
      root.querySelectorAll(
        ".ap-adrenaline-uptime, .ap-flash-orb-uptime, .ap-gear-support-uptime, " +
        ".ap-gear-strength-orb-uptime, .ap-gear-atropine-uptime, .ap-engr-maelstrom-uptime"
      ).forEach((el) => {
        const step = el.step && el.step !== "" ? parseFloat(el.step) : 1;
        window.SiteUtils.bindDecimalPreservingArrowKeys(el, step);
      });
      const resetEl = root.querySelector(".ap-calc-reset");
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
      root.querySelectorAll(".ap-calc-preset").forEach((btn) => {
        btn.addEventListener("click", () => {
          const newId = parseInt(btn.dataset.preset, 10);
          if (newId === getActivePresetId()) return;
          switchPreset(root, newId);
        });
      });
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
  document.addEventListener("click", (ev) => {
    document.querySelectorAll(".ap-build-dock-panel.ap-build-dock-panel--open").forEach((panelEl) => {
      const triggerEl = panelEl.parentElement && panelEl.parentElement.querySelector(".ap-build-dock-trigger");
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
  const DOCK_STUCK_OFFSET_PX = 48;
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
  window.SiteUtils.registerRenderer(".ap-calc", queueDockStuckUpdate);
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
