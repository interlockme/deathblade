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

  function closeLightbox() {
    if (overlay) overlay.classList.remove("is-open");
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

    document.body.appendChild(overlay);

    // Clicking anywhere on the overlay (backdrop or the image itself)
    // closes it - "click to zoom in, click to zoom back out" is the same
    // gesture either direction, so the image doesn't need its own
    // stopPropagation carve-out.
    overlay.addEventListener("click", closeLightbox);
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  function openLightbox(img) {
    buildOverlay();
    overlayImg.src = img.currentSrc || img.src;
    overlayImg.alt = img.alt || "";
    overlay.classList.add("is-open");
  }

  function wireImage(img) {
    // Idempotent: registerRenderer's three triggers can all fire for the
    // same element (direct load + document$ + MutationObserver), so guard
    // against double-binding the click handler.
    if (img.dataset.lightboxWired) return;
    img.dataset.lightboxWired = "true";
    img.addEventListener("click", function () {
      openLightbox(img);
    });
  }

  window.SiteUtils.registerRenderer("img.zoomable-image", wireImage);
})();
