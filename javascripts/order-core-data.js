(function () {
  window.DB_ORDER_CORE_DATA = {
    shares: {
      "re-111": { deathlyslash: 21, surge: 19.9, deathsentence: 16.6, turningslash: 11.6, twinshadows: 10.6, soulabsorber: 8, blitzrush: 6.6, voidstrike: 5.5 },
      "re-333": { fatalwave: 34.3, deathlyslash: 17.2, surge: 16.6, twinshadows: 7.7, soulabsorber: 7, turningslash: 6.5, voidstrike: 5, blitzrush: 4 },
      "surge-111": { surge: 76.5, breakingmoon: 6, blitzrush: 3, bladedance: 2.8, earthcleaver: 2.8, turningslash: 2.7, windcut: 2.4 },
      "surge-222": { surge: 47.8, deathlyslash: 35.5, bladedance: 7.1, turningslash: 3.2, windcut: 2.4, surpriseattack: 0.8 },
      "surge-333": { surge: 42, blitzrush: 29.8, deathlyslash: 12.9, earthcleaver: 4, bladedance: 2.6, turningslash: 2.6, windcut: 2.1 },
    },
    cores: {
      "Deathblade Surge": { build: "surge-111", kind: "skills", summary: "Next Surge Dmg +6.0%/7.5%.", skills: ["surge"], relic: 0.06, ancient: 0.075 },
      "Surge Core": { build: "surge-111", kind: "foes", summary: "Damage to foes +4.0%/5.0%.", relic: 0.04, ancient: 0.05 },
      "Strike": { build: "surge-111", kind: "foes", summary: "Damage to foes +1.0%/2.0%.", relic: 0.01, ancient: 0.02 },
      "Slaughter Spectacle": { build: "surge-222", kind: "skills", summary: "Deathly Slash Dmg +4.0%/5.0% per stack (5 stacks).", skills: ["deathlyslash"], relic: 0.04, ancient: 0.05, stacks: 5 },
      "Twin Swords Dance": { build: "surge-222", kind: "skills", summary: "Blade Dance and Deathly Slash Dmg +12.0%/15.0%.", skills: ["bladedance", "deathlyslash"], relic: 0.12, ancient: 0.15 },
      "Swift Resolution": { build: "surge-222", kind: "skills", summary: "Deathly Slash Dmg +15.0%/20.0%.", skills: ["deathlyslash"], relic: 0.15, ancient: 0.2 },
      "Deathblade Rush": { build: "surge-333", kind: "skills", summary: "Next Blitz Rush Dmg +26.0%/34.0%.", skills: ["blitzrush"], relic: 0.26, ancient: 0.34, coverage: 0.5 },
      "Death Blitz": { build: "surge-333", kind: "skills", summary: "Blitz Rush Dmg +16.0%/20.0%.", skills: ["blitzrush"], relic: 0.16, ancient: 0.2 },
      "Frostfire Blade": { build: "surge-333", kind: "skills", summary: "Blitz Rush Dmg +100.0%/108.0%.", skills: ["blitzrush"], relic: 1.0, ancient: 1.08 },
      "Art Master": { build: "re-111", kind: "skills", summary: "Twin Shadows, Turning Slash, Death Sentence Dmg +16.0%/20.0%.", skills: ["twinshadows", "turningslash", "deathsentence"], relic: 0.16, ancient: 0.2 },
      "Arts Core": { build: "re-111", kind: "normal", summary: "Normal Skill Dmg +5.0%/6.0%.", relic: 0.05, ancient: 0.06 },
      "Basics": { build: "re-111", kind: "skills", summary: "Turning Slash Dmg +20.0%/30.0%.", skills: ["turningslash"], relic: 0.2, ancient: 0.3 },
      "Levin Slash": { build: "re-333", kind: "foes", summary: "Damage to foes +0.0%/1.0%.", relic: 0, ancient: 0.01 },
      "Deathblade Wave": { build: "re-333", kind: "skills", summary: "Fatal Wave Dmg +16.0%/20.0%.", skills: ["fatalwave"], relic: 0.16, ancient: 0.2 },
      "Death Sword Energy": { build: "re-333", kind: "skills", summary: "Fatal Wave Dmg +20.0%/24.0%.", skills: ["fatalwave"], relic: 0.2, ancient: 0.24 },
    },
  };
})();
