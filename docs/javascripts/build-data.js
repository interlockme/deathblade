// FORK GUIDE: DATA - every build entry (pentagon stats, accent colors,
// descriptions) is one of Deathblade's own builds. Replace the re/surge
// families and their builds arrays with your class's own lineup; the
// axisLabels/invert/axisNote fields let you define your own 5th axis
// (this site uses Recovery for RE, Exposure for Surge).
//
// SINGLE SOURCE OF TRUTH for build pentagon/compare stats. Both
// pentagon-badge.js (the badge on each build's own page) and
// build-compare.js (the overview table + overlay picker on essentials.md)
// read from window.DB_BUILD_DATA instead of keeping their own copies -
// edit a build's numbers here ONCE and both places update.
//
// Must load before pentagon-badge.js and build-compare.js - see the
// extra_javascript order in mkdocs.yml.
//
// EASY EDIT GUIDE:
//   Find the build under its family (re / surge) and edit the fields
//   below. Everything that appears on both the build's own pentagon
//   badge AND the essentials.md compare widget lives here:
//     pentagon      - [Difficulty, DPS, Mobility, Recovery/Exposure, Speed],
//                      0-10 scale. Same axis-order/scale writeup as before,
//                      see the old pentagon-badge.js history for the DPS
//                      "ranked within family" methodology if you need it.
//     difficulty    - should match pentagon[0]
//     trixion       - the Trixion DPS multiplier, or null if unmeasured
//     trixionConfirmed - false shows the diagonal-stripe "unconfirmed" fill
//     playstyle     - short playstyle tag
//     accent        - hex color used for this build's line/fill everywhere
//     emoji, words, desc, ark, viable - the build's one-line pitch, shown
//                     by BOTH the home page rows (index.md) and the compare
//                     rows on the essentials pages, so editing it here
//                     updates both (ark is home page only):
//                       emoji   - leading emoji
//                       words   - short descriptor line ("comfort \u2022 transitional")
//                       desc    - one or two sentence description
//                       ark     - Ark Grid need: "none" | "little" | "full"
//                                 (the home row pill)
//                       viable  - false marks a build as not viable (red
//                                 flag, dashed home row); omit otherwise.
//                                 Do not repeat it in desc.
//                     The build's own page keeps its own longer "Best For:"
//                     prose written directly in the .md - that's real prose,
//                     not templated from here.
//     recommended   - true adds the gold "recommended" flag (home row and
//                     compare row) and the star next to the name elsewhere
//     compareEnabled - false keeps a build out of the compare rows (no
//                      pentagon data to overlay). A build with no pentagon,
//                      difficulty or trixion at all (surge's
//                      "pre-ark-grid") exists only for the home page start
//                      row.
//
//   RE and Surge are never compared against each other - RE's fifth axis
//   is Recovery (higher is better), Surge's is Exposure (lower is
//   better), and DPS is ranked within each family on its own 0-10 scale.
//   Overlaying the two would silently mix incompatible axes.
//
//   axisNoteIndex/axisNote (family-level, Surge only): the pentagon badge
//   shows this as a hover tooltip + caption line under the SVG, on
//   whichever axis index it points at (3 = Recovery/Exposure here) - a
//   reminder that Exposure is a risk stat where lower is better, unlike
//   the other four axes.

(function () {
  window.DB_BUILD_DATA = {
    re: {
      axisLabels: ["Difficulty", "DPS", "Mobility", "Recovery", "Speed"],
      // true = lower is better on this axis. All RE axes are higher-is-better.
      invert: [false, false, false, false, false],
      defaultPair: [0, 2], // 333 (Ceiling) vs 111 (Head Hunt)
      builds: [
        {
          id: "333-ceiling",
          name: "333 (Ceiling)",
          accent: "#ec91b2",
          pentagon: [8, 9, 5, 8.5, 8.5],
          difficulty: 8,
          trixion: 1.2,
          trixionConfirmed: true,
          playstyle: "Skill Reset",
          emoji: "\u2728",
          words: "skill reset",
          desc: "Well-rounded build that offers the highest RE damage. Sensitive to high ping or low FPS.",
          ark: "full",
          recommended: true,
          compareEnabled: true,
        },
        {
          id: "313-high-floor",
          name: "313 (High Floor)",
          accent: "#baa4e2",
          pentagon: [7.5, 8, 5, 9, 10],
          difficulty: 7.5,
          trixion: 1.17,
          trixionConfirmed: true,
          playstyle: "Fast & Comfy",
          emoji: "\uD83D\uDC9C",
          words: "comfort \u2022 transitional",
          desc: "A faster, simpler, more forgiving Fatal Wave build with a lower damage ceiling.",
          ark: "little",
          recommended: false,
          compareEnabled: true,
        },
        {
          id: "111-head-hunt",
          name: "111 (Head Hunt)",
          accent: "#6ac7be",
          pentagon: [9, 8, 5, 7, 10],
          difficulty: 9,
          trixion: 1.18,
          trixionConfirmed: true,
          playstyle: "Fast & Punishing",
          emoji: "\uD83D\uDD2A",
          words: "challenging \u2022 old meta",
          desc: "Fast, punishing build with little recovery, but high skill expression.",
          ark: "little",
          recommended: false,
          compareEnabled: true,
        },
        {
          id: "standard",
          name: "Standard",
          accent: "#e2c575",
          pentagon: [6, 6, 8.5, 4, 6],
          difficulty: 6,
          trixion: null,
          trixionConfirmed: true,
          playstyle: "AFK Simulator",
          emoji: "\uD83C\uDF31",
          words: "beginner \u2022 legacy",
          desc: "Simple to learn, with some downtime.",
          ark: "none",
          recommended: false,
          compareEnabled: true,
        },
      ],
    },
    surge: {
      axisLabels: ["Difficulty", "DPS", "Mobility", "Exposure", "Speed"],
      // Exposure is back-attack/positional risk - lower is better, unlike
      // every other axis (matches the data-caption on each build's own
      // pentagon-badge).
      invert: [false, false, false, true, false],
      defaultPair: [0, 1], // 111 (Classic) vs 222 (Speedy)
      axisNoteIndex: 3,
      axisNote: "Exposure: back-attack & positional risk.",
      builds: [
        {
          id: "111-classic",
          name: "111 (Classic)",
          accent: "#ec91b2",
          pentagon: [7.5, 9, 7, 6.5, 7],
          difficulty: 7.5,
          trixion: 1.23,
          trixionConfirmed: true,
          playstyle: "Burst Combo",
          emoji: "\uD83E\uDD81",
          words: "bursty \u2022 familiar",
          desc: "Builds up to one massive hit. Strongest burst combo, but it needs careful execution.",
          ark: "little",
          recommended: false,
          compareEnabled: true,
        },
        {
          id: "222-speedy",
          name: "222 (Speedy)",
          accent: "#6ac7be",
          pentagon: [7, 9.5, 9, 8, 8],
          difficulty: 7,
          trixion: 1.25,
          trixionConfirmed: true,
          playstyle: "Cycle Combos",
          emoji: "\uD83D\uDC06",
          words: "cycle combos",
          desc: "Uptime-focused and mobile: easy to pick up, hard to master. It's exactly as good as you are.",
          ark: "little",
          recommended: true,
          compareEnabled: true,
        },
        {
          id: "333-blitz",
          name: "333 (Blitz)",
          accent: "#baa4e2",
          pentagon: [8, 8, 8, 9, 6],
          difficulty: 8,
          trixion: 1.2,
          trixionConfirmed: false,
          playstyle: "Skill Reset",
          emoji: "\uD83D\uDC2F",
          words: "skill reset",
          desc: "Fun, but too impractical for the damage it offers.",
          ark: "full",
          viable: false,
          recommended: false,
          compareEnabled: true,
        },
        {
          id: "pre-ark-grid",
          name: "Surge",
          accent: "#6ac7be",
          emoji: "\uD83C\uDF31",
          words: "beginner \u2022 modern",
          desc: "Essentially 111 (Classic) with minor adjustments.",
          ark: "none",
          recommended: false,
          compareEnabled: false,
        },
      ],
    },
  };
})();
