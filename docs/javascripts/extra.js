/* Deathblade guide enhancements:
   - external links open in a new tab (so clicking a calculator/YouTube
     link doesn't navigate you away from the guide)
   - a thin reading-progress sliver on the header's bottom edge
   - mobile-only quick-jump pills on build pages, generated from that
     page's own H2s

   Flash-highlighting a jumped-to heading and the page fade-in are handled
   in extra.css alone (:target and a plain keyframe animation) - no JS
   needed for those, so they're not here.

   Everything below is wrapped in document$.subscribe so it re-runs after
   Material's instant-loading page swaps (navigation.instant), not just
   on the very first load. */
(function () {
  var scrollListenerBound = false;

  function externalLinksNewTab() {
    document.querySelectorAll(".md-content a[href]").forEach(function (a) {
      if (!/^https?:\/\//i.test(a.getAttribute("href") || "")) return;
      if (a.hostname === window.location.hostname) return;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
  }

  function ensureProgressBar() {
    var header = document.querySelector(".md-header");
    if (header && !header.querySelector(".reading-progress")) {
      var bar = document.createElement("div");
      bar.className = "reading-progress";
      header.appendChild(bar);
    }
  }

  function updateProgress() {
    var bar = document.querySelector(".reading-progress");
    if (!bar) return;
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - doc.clientHeight;
    bar.style.width = (scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0) + "%";
  }

  function buildQuickJumpPills() {
    var old = document.querySelector(".quick-jump-pills");
    if (old) old.remove();

    var buildCard = document.querySelector(".md-content__inner .build-card");
    if (!buildCard) return;

    var headings = document.querySelectorAll(".md-content__inner > h2");
    if (!headings.length) return;

    var nav = document.createElement("nav");
    nav.className = "quick-jump-pills";
    nav.setAttribute("aria-label", "Jump to section");
    headings.forEach(function (h) {
      if (!h.id) return;
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent.replace(/\s*¶\s*$/, ""); // strip the toc permalink mark
      nav.appendChild(a);
    });
    buildCard.insertAdjacentElement("afterend", nav);
  }

  if (window.document$) {
    document$.subscribe(function () {
      externalLinksNewTab();
      ensureProgressBar();
      updateProgress();
      buildQuickJumpPills();

      // Scroll/resize listeners only need binding once ever - the header
      // (and thus the progress bar) persists across instant-loading swaps.
      if (!scrollListenerBound) {
        scrollListenerBound = true;
        window.addEventListener("scroll", updateProgress, { passive: true });
        window.addEventListener("resize", updateProgress);
      }
    });
  }
})();
