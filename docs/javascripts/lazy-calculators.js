// FORK GUIDE: INFRA - reusable as-is for any class/site. Nothing here is
// Deathblade-specific; it just defers whichever files LAZY_BUNDLE lists
// until a page actually contains one of TRIGGER_SELECTOR's containers.
//
// WHY THIS FILE EXISTS
// mkdocs.yml's extra_javascript loads on EVERY page - there is no per-page
// script hook in MkDocs Material. Five of those files are only ever used by
// resources.md (the Ark Passive / CPM / Bid calculators, the Bible importer,
// and the title="" tooltip upgrader that only wires triggers inside those
// three), and between them they were 543 KB of the site's 851 KB total. That
// meant every guide page - which needs none of it - still downloaded and
// PARSED ~64% of the site's JavaScript for nothing. Harmless on desktop,
// genuinely wasteful on a phone.
//
// This file (a couple of KB) stays global in its place and injects those
// five only when a calculator container is actually on the page, dropping
// guide pages to ~307 KB with no change to any of the five files themselves.
//
// HOW IT STAYS CORRECT
//  - Order is preserved. `script.async = false` on a dynamically created
//    script is the one way to say "download in parallel, but execute in
//    insertion order" - the default for createElement scripts is async=true,
//    i.e. whoever lands first runs first, which would break bible-import.js
//    (it drives ark-passive-calculator.js's own Import popover, so it has to
//    run after it). Do NOT drop that line when editing.
//  - Self-initialization is free. Every one of the five ends in a
//    SiteUtils.registerRenderer(...) call, and registerRenderer runs its
//    renderAll() immediately when the document is already past "loading"
//    (see its definition in site-utils.js). Loading them late therefore
//    renders them on arrival - no extra init hook needed here, and nothing
//    in those files had to change to be lazy-loadable.
//  - Instant navigation is handled. registerRenderer's own triggers
//    (immediate + document$ + MutationObserver) are what call ensureLoaded
//    below, so arriving at resources.md via a Material instant-nav swap
//    fires it exactly like a hard load does. Once loaded, it's a no-op.
//
// CACHE-BUSTING
// Nothing to bump by hand. scripts/hash_assets.py runs after the build and
// rewrites every entry in LAZY_BUNDLE below to "name.js?v=<content hash>",
// then hashes THIS file (so a change to any of the five also changes this
// file's own URL on every page, and returning visitors refetch the list).
// Keep entries as bare file names.

(function () {
  // Captured at top level: document.currentScript is only valid during this
  // script's own synchronous execution, and is null by the time the callback
  // below runs. Resolving sibling files against this script's own URL means
  // no assumption about page depth (/resources/ vs /surge/111-classic/) and
  // no hardcoded site_url.
  var here = document.currentScript && document.currentScript.src;

  // In load order. See the ordering note above before reordering.
  var LAZY_BUNDLE = [
    "cpm-calculator.js",
    "bid-calculator.js",
    "ark-passive-calculator.js",
    "bible-import.js",   // must follow ark-passive-calculator.js
    "ap-brace-tooltip.js", // needs skill-tooltip.js, which is still global
  ];

  // The three calculator roots. Matching any one of them pulls the whole
  // bundle: they only ever appear together on resources.md, and splitting
  // into three separate triggers would buy nothing while making the
  // bible-import-after-ark-passive-calculator ordering harder to guarantee.
  var TRIGGER_SELECTOR = ".ap-calc, .cpm-calc, .bid-calc";

  var started = false;

  function ensureLoaded() {
    if (started) return; // fires on every render trigger; only the first does work
    started = true;

    if (!here) {
      // No currentScript (very old browser, or this file got inlined). Fail
      // loudly rather than silently shipping a dead calculator page - every
      // other widget on this site fails quietly, but a blank calculator is
      // the whole point of the page it's on.
      if (window.console) console.error("[lazy-calculators] couldn't resolve this script's own URL; calculator files not loaded.");
      return;
    }
    var base = here.replace(/[^/]*$/, "");

    LAZY_BUNDLE.forEach(function (file) {
      var s = document.createElement("script");
      s.src = base + file;
      s.async = false; // preserve execution order - see the note above
      s.onerror = function () {
        if (window.console) console.error("[lazy-calculators] failed to load " + file + " - the calculator on this page will not work.");
      };
      document.head.appendChild(s);
    });
  }

  window.SiteUtils.registerRenderer(TRIGGER_SELECTOR, ensureLoaded);
})();
