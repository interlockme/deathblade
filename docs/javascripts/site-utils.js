// Small shared DOM helpers used by the native widget scripts
// (ark-core-badge.js, ark-passive-tree.js, essentials-table.js,
// skill-setup.js, dps-chart.js, etc).
//
// Must load FIRST in extra_javascript - see mkdocs.yml.
//
// Kept intentionally tiny: this is not a framework, just the couple of
// one-liners that were previously copy-pasted identically into every
// widget file. If a bug shows up in one of these (e.g. the masonry
// ResizeObserver leak), fix it here once instead of N times.

(function () {
  window.SiteUtils = {
    // Create an element, optionally set its className and textContent.
    el: function (tag, className, text) {
      var e = document.createElement(tag);
      if (className) e.className = className;
      if (text != null) e.textContent = text;
      return e;
    },

    // Hide a broken/missing icon <img> instead of showing the browser's
    // default alt-text placeholder. mode "visibility" (default) keeps the
    // icon's layout box in place; mode "display" collapses it entirely.
    hideOnError: function (img, mode) {
      img.addEventListener("error", function () {
        if (mode === "display") {
          img.style.display = "none";
        } else {
          img.style.visibility = "hidden";
        }
      });
    },

    // Resolve an icon's real URL. Every icon (skills, consumables, Ark
    // Passive nodes) lives under assets/shared/ regardless of which
    // build family (RE/Surge) uses it - relIcon is the path under that
    // folder, e.g. "icon-surge.png" or "ap-icons/critical.png". There
    // used to be a per-family assets/re/ and assets/surge/ icon split
    // with a manually maintained list of which icons happened to be
    // identical across both; that list is gone now that every icon file
    // lives in one place, so this is just a path join. assets/re/ and
    // assets/surge/ no longer exist at all - genuinely family-specific
    // page media (tldr screenshots, memes) now lives flat under
    // assets/ instead.
    iconSrc: function (siteRoot, relIcon) {
      return siteRoot + "assets/shared/" + relIcon;
    },
  };
})();
