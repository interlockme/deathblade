(function () {
  var here = document.currentScript && document.currentScript.src;
  var LAZY_BUNDLE = [
    "cpm-calculator.js?v=8",
    "bid-calculator.js?v=5",
    "ark-passive-calculator.js?v=68",
    "bible-import.js?v=15",
    "ap-brace-tooltip.js?v=5",
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
