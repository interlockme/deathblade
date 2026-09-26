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
    if (img.dataset.lightboxWired) return;
    img.dataset.lightboxWired = "true";
    img.addEventListener("click", function () {
      openLightbox(img);
    });
  }
  window.SiteUtils.registerRenderer("img.zoomable-image", wireImage);
})();
