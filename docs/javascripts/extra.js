/* Deathblade guide enhancements:
   - external links open in a new tab (so clicking a calculator/YouTube
     link doesn't navigate you away from the guide)
   - a thin reading-progress sliver on the header's bottom edge
   - mobile-only quick-jump pills on build pages, generated from that
     page's own H2s
   - every emoji site-wide gets a small hover wiggle (walks text nodes
     and wraps each emoji in a .emoji-wiggle span; the animation itself
     lives in extra.css)

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

  // \p{Extended_Pictographic} covers essentially all emoji (Unicode
  // property escapes, need the "u" flag). \u200D handles ZWJ sequences
  // (e.g. a multi-codepoint emoji) so those wiggle as one unit instead
  // of getting split into separate wiggling pieces.
  var EMOJI_RE = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})(\u200D(\p{Extended_Pictographic}|\p{Emoji_Presentation}))*/gu;
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, TEXTAREA: 1, INPUT: 1 };

  function wrapEmojisForWiggle() {
    var root = document.querySelector(".md-content__inner");
    if (!root) return;

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        EMOJI_RE.lastIndex = 0;
        if (!EMOJI_RE.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (!parent || SKIP_TAGS[parent.tagName]) return NodeFilter.FILTER_REJECT;
        // Don't re-wrap an emoji that's already inside a wiggle span -
        // matters for a manually-tagged .tiger-emoji (or a leftover
        // .emoji-wiggle from a prior run on the same DOM state).
        if (parent.closest(".emoji-wiggle, .tiger-emoji")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    var textNodes = [];
    var node;
    while ((node = walker.nextNode())) textNodes.push(node);

    textNodes.forEach(function (textNode) {
      var text = textNode.nodeValue;
      var frag = document.createDocumentFragment();
      var lastIndex = 0;
      var match;
      EMOJI_RE.lastIndex = 0;
      while ((match = EMOJI_RE.exec(text))) {
        if (match.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        var span = document.createElement("span");
        span.className = "emoji-wiggle";
        span.textContent = match[0];
        frag.appendChild(span);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  if (window.document$) {
    document$.subscribe(function () {
      externalLinksNewTab();
      ensureProgressBar();
      updateProgress();
      buildQuickJumpPills();
      wrapEmojisForWiggle();

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
