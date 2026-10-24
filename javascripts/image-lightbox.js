(function () {
  var overlay = null;
  var overlayImg = null;
  var lastTrigger = null;
  var closeButton = null;
  function closeLightbox() {
    if (!overlay || !overlay.classList.contains("is-open")) return;
    overlay.classList.remove("is-open");
    document.documentElement.classList.remove("image-lightbox-open");
    if (lastTrigger && lastTrigger.isConnected) {
      try { lastTrigger.focus({ preventScroll: true }); } catch (e) {   }
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
    overlay.addEventListener("click", closeLightbox);
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
    document.documentElement.classList.add("image-lightbox-open");
    overlay.classList.add("is-open");
    closeButton.focus({ preventScroll: true });
  }
  function wireImage(img) {
    if (img.dataset.lightboxWired) return;
    img.dataset.lightboxWired = "true";
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
