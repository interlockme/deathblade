// FORK GUIDE: DATA - every build entry (pentagon stats, accent colors,
// bestFor blurbs) is one of Deathblade's own builds. Replace the re/surge
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
//     bestFor       - SHORT blurb for the compare table only. The build's
//                     own page keeps its own longer "Best For:" prose
//                     written directly in the .md - that's intentionally
//                     not templated from here, it's real prose.
//     recommended   - true adds the small star next to the name
//     compareEnabled - false keeps a build in the compare table's overview
//                      rows but out of the two-build picker (no pentagon
//                      data to overlay, e.g. Standard)
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
          accent: "#ee83ab",
          pentagon: [8.5, 9, 5, 8.5, 8.5],
          difficulty: 8.5,
          trixion: 1.2,
          trixionConfirmed: true,
          playstyle: "Skill Reset",
          bestFor: "\u2728 Well-rounded damage ceiling",
          recommended: true,
          compareEnabled: true,
        },
        {
          id: "313-high-floor",
          name: "313 (High Floor)",
          accent: "#b39ddb",
          pentagon: [8, 8, 5, 9, 10],
          difficulty: 8,
          trixion: 1.17,
          trixionConfirmed: true,
          playstyle: "Fast & Comfy",
          bestFor: "\uD83D\uDC9C Comfort and recovery",
          recommended: false,
          compareEnabled: true,
        },
        {
          id: "111-head-hunt",
          name: "111 (Head Hunt)",
          accent: "#4db6ac",
          pentagon: [9, 8.5, 5, 7, 10],
          difficulty: 9,
          trixion: 1.18,
          trixionConfirmed: true,
          playstyle: "Fast & Punishing",
          bestFor: "\uD83D\uDD2A Skill expression and stagger",
          recommended: false,
          compareEnabled: true,
        },
        {
          id: "standard",
          name: "Standard",
          accent: "#8d8b93",
          pentagon: [7, 6, 8, 4, 6],
          difficulty: 7,
          trixion: null,
          trixionConfirmed: true,
          playstyle: "AFK Simulator",
          bestFor: "\uD83C\uDF31 Pre-Ark Grid beginner build",
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
          accent: "#ee83ab",
          pentagon: [7.5, 9, 8, 6.5, 7],
          difficulty: 7.5,
          trixion: 1.23,
          trixionConfirmed: true,
          playstyle: "Burst Combo",
          bestFor: "\uD83E\uDD81 Classic Surge gameplay",
          recommended: true,
          compareEnabled: true,
        },
        {
          id: "222-speedy",
          name: "222 (Speedy)",
          accent: "#4db6ac",
          pentagon: [7, 8.5, 10, 7.5, 8],
          difficulty: 7,
          trixion: 1.22,
          trixionConfirmed: true,
          playstyle: "Max Mobility",
          bestFor: "\uD83D\uDC06 Simple uptime focus",
          recommended: false,
          compareEnabled: true,
        },
        {
          id: "333-blitz",
          name: "333 (Blitz)",
          accent: "#b39ddb",
          pentagon: [8, 8, 8.5, 9, 6],
          difficulty: 8,
          trixion: 1.2,
          trixionConfirmed: false,
          playstyle: "Skill Reset",
          bestFor: "\uD83D\uDC2F Waiting for buffs",
          recommended: false,
          compareEnabled: true,
        },
      ],
    },
  };
})();
