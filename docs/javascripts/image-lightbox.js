// FORK GUIDE: INFRA - generic site plumbing, no class-specific content.
// Keep as-is.
//
// Click-to-zoom lightbox for standalone content images - TL;DR flowcharts,
// memes, gearing-value screenshots. These are meant to be read/appreciated
// at full size, unlike the small inline skill/stat icons peppered through
// prose, so this only wires up images that opt in via a .zoomable-image
// class on the <img> itself (markdown attr-list: `{ .zoomable-image }`)
// rather than matching every <img> on the page.
//
// One overlay element, built once and reused across every zoomable image
// and every page view, rather than one per image - cheap, and only one can
// ever be open at a time anyway. See site-utils.js's registerRenderer doc
// comment for why wiring goes through that instead of a lone document$
// subscription.

(function () {
  var overlay = null;
  var overlayImg = null;

  var lastTrigger = null;
  var closeButton = null;

  function closeLightbox() {
    if (!overlay || !overlay.classList.contains("is-open")) return;
    overlay.classList.remove("is-open");
    // Release the scroll lock and hand focus back to the image that opened
    // it, so a keyboard user does not land back at the top of the page.
    document.documentElement.classList.remove("image-lightbox-open");
    if (lastTrigger && lastTrigger.isConnected) {
      try { lastTrigger.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
    }
    lastTrigger = null;
  }

  function buildOverlay() {
    if (overlay) return;

    overlay = window.SiteUtils.el("div", "image-lightbox-overlay");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    overlayImg = document.createElement("img");
    overlay.appendChild(overlayImg);

    var closeBtn = window.SiteUtils.el("button", "image-lightbox-close");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "\u2715";
    overlay.appendChild(closeBtn);
    closeButton = closeBtn;

    document.body.appendChild(overlay);

    // Clicking anywhere on the overlay (backdrop or the image itself)
    // closes it - "click to zoom in, click to zoom back out" is the same
    // gesture either direction, so the image doesn't need its own
    // stopPropagation carve-out.
    overlay.addEventListener("click", closeLightbox);
    // iOS Safari ignores overflow: hidden on <html> for touch scrolling in
    // many versions, so the page could still be dragged behind the overlay.
    // Cancel single-finger moves on the overlay itself; two-finger pinch is
    // left alone so the image can still be zoomed.
    overlay.addEventListener(
      "touchmove",
      function (e) {
        if (e.touches && e.touches.length === 1) e.preventDefault();
      },
      { passive: false }
    );
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
      // aria-modal only tells screen readers the page behind is inert; it
      // does not stop Tab. The close button is the dialog's only control,
      // so keeping focus on it is a complete focus trap.
      if (e.key === "Tab" && overlay.classList.contains("is-open")) {
        e.preventDefault();
        closeButton.focus();
      }
    });
  }

  function openLightbox(img) {
    buildOverlay();
    overlayImg.src = img.currentSrc || img.src;
    overlayImg.alt = img.alt || "";
    lastTrigger = img;
    overlay.setAttribute("aria-label", img.alt || "Image preview");
    // Without this the page scrolled (wheel, touch, arrow keys) behind the
    // overlay, and on a phone a swipe to look around a big image dragged
    // the page instead.
    document.documentElement.classList.add("image-lightbox-open");
    overlay.classList.add("is-open");
    closeButton.focus({ preventScroll: true });
  }

  function wireImage(img) {
    // Idempotent: registerRenderer's three triggers can all fire for the
    // same element (direct load + document$ + MutationObserver), so guard
    // against double-binding the click handler.
    if (img.dataset.lightboxWired) return;
    img.dataset.lightboxWired = "true";
    // A bare <img> is not reachable or operable by keyboard, so the
    // zoomable screenshots could only be opened with a pointer.
    if (!img.hasAttribute("tabindex")) img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Enlarge image: " + (img.alt || "screenshot"));
    img.addEventListener("click", function () {
      openLightbox(img);
    });
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(img);
      }
    });
  }

  window.SiteUtils.registerRenderer("img.zoomable-image", wireImage);
})();
