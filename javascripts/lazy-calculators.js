(function () {
  var here = document.currentScript && document.currentScript.src;
  var LAZY_BUNDLE = [
    "cpm-calculator.js?v=af0f6d0dfc",
    "bid-calculator.js?v=6c001bd105",
    "order-core-data.js?v=8069e499e0",
    "ark-passive-calculator.js?v=b63bba53c8",
    "bible-id-tables.js?v=21b9245e01",
    "bible-decode.js?v=3fd057ad29",
    "bible-import.js?v=b8e38324f2",
    "ap-brace-tooltip.js?v=77ff7d69db",
  ];
  var TRIGGER_SELECTOR = ".ap-calc, .cpm-calc, .bid-calc";
  var started = false;
  function ensureLoaded() {
    if (started) return;
    started = true;
    if (!here) {
      if (window.console) console.error("[lazy-calculators] couldn't resolve this script's own URL; calculator files not loaded.");
      return;
    }
    var base = here.replace(/[^/]*$/, "");
    LAZY_BUNDLE.forEach(function (file) {
      var s = document.createElement("script");
      s.src = base + file;
      s.async = false;
      s.onerror = function () {
        if (window.console) console.error("[lazy-calculators] failed to load " + file + " - the calculator on this page will not work.");
      };
      document.head.appendChild(s);
    });
  }
  window.SiteUtils.registerRenderer(TRIGGER_SELECTOR, ensureLoaded);
})();
