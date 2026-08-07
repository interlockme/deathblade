/* Deathblade guide enhancements:
   - external links open in a new tab (so clicking a calculator/YouTube
     link doesn't navigate you away from the guide)
   - a thin reading-progress sliver on the header's bottom edge
   - mobile-only quick-jump pills on build pages, generated from that
     page's own H2s
   - a slim fixed scrollspy nav on wide desktop viewports, same idea
     as the quick-jump pills but for screens with room to spare
   - every emoji site-wide gets a small hover wiggle (walks text nodes
     and wraps each emoji in a .emoji-wiggle span; the animation itself
     lives in extra.css)
   - tab-title mischief on build pages while the tab is unfocused
   - a tiny click easter egg on the 333 Blitz page's title tiger

   Flash-highlighting a jumped-to heading and the page fade-in are handled
   in extra.css alone (:target and a plain keyframe animation) - no JS
   needed for those, so they're not here.

   Everything below is wrapped in document$.subscribe so it re-runs after
   Material's instant-loading page swaps (navigation.instant), not just
   on the very first load. */
(function () {
  var scrollListenerBound = false;
  var delegatedClickListenersBound = false;
  var sectionTrackerItems = [];
  var blurTitleOriginal = null;

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

    // Prefer the .build-card-row wrapper (build-card + pentagon badge)
    // when present, so pills land after the whole row instead of
    // wedging between the card and the badge; falls back to the card
    // itself on pages without a badge.
    var anchor = document.querySelector(".md-content__inner .build-card-row") ||
      document.querySelector(".md-content__inner .build-card");
    if (!anchor) return;

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
    anchor.insertAdjacentElement("afterend", nav);
  }

  // Desktop counterpart to the mobile quick-jump pills. toc.integrate
  // folds the page's own TOC into the collapsible left nav, which is fine
  // but not glanceable on the longer build pages (333 Ceiling, 111 Head
  // Hunt) - this is a slim always-visible mark-nav, fixed to the right
  // edge, that also tracks scroll position so you can see which section
  // you're in without hunting through the sidebar. Only appears on wide
  // viewports (see the min-width gate in extra.css) so it never competes
  // with actual content for space.
  function buildSectionTracker() {
    var old = document.getElementById("section-tracker");
    if (old) old.remove();
    sectionTrackerItems = [];

    var buildCard = document.querySelector(".md-content__inner .build-card");
    if (!buildCard) return;

    var headings = document.querySelectorAll(".md-content__inner > h2");
    if (headings.length < 2) return;

    var nav = document.createElement("nav");
    nav.id = "section-tracker";
    nav.className = "section-tracker";
    nav.setAttribute("aria-label", "Section tracker");

    headings.forEach(function (h) {
      if (!h.id) return;
      var a = document.createElement("a");
      a.className = "section-tracker-item";
      a.href = "#" + h.id;
      var mark = document.createElement("span");
      mark.className = "section-tracker-mark";
      var label = document.createElement("span");
      label.className = "section-tracker-label";
      label.textContent = h.textContent.replace(/\s*¶\s*$/, "");
      a.appendChild(label);
      a.appendChild(mark);
      nav.appendChild(a);
      sectionTrackerItems.push({ heading: h, link: a });
    });
    if (!sectionTrackerItems.length) return;

    document.body.appendChild(nav);
    updateSectionTrackerActive();
  }

  // Which section is "current" is whichever H2 you've most recently
  // scrolled past - not just whichever one happens to be crossing a narrow
  // band right now, which left the tracker showing nothing while reading
  // through the middle of a section. Walking down the heading list and
  // keeping the last one whose top has scrolled above the offset line
  // guarantees exactly one mark is active at all times once you've reached
  // the first section, in-between headings included.
  function updateSectionTrackerActive() {
    if (!sectionTrackerItems.length) return;
    var header = document.querySelector(".md-header");
    var offset = (header ? header.offsetHeight : 0) + 24;
    var activeIndex = -1;
    for (var i = 0; i < sectionTrackerItems.length; i++) {
      if (sectionTrackerItems[i].heading.getBoundingClientRect().top <= offset) {
        activeIndex = i;
      } else {
        break;
      }
    }
    sectionTrackerItems.forEach(function (it, i) {
      it.link.classList.toggle("is-active", i === activeIndex);
    });
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

  function togglePageBodyClasses() {
    // 333 Blitz gets its own tiny signature touch - a paw-print cursor,
    // scoped via this body class rather than a sitewide cursor change.
    var isBlitzPage = /\/surge\/333-blitz\/?(?:$|[?#])/.test(window.location.pathname);
    document.body.classList.toggle("page-333-blitz", isBlitzPage);
    return isBlitzPage;
  }

  // ---------- Tab-title mischief (build pages only) ----------
  // Swaps the tab title to something in-character while you're away, swaps
  // it back the moment you return. Only on skill-build pages (anywhere with
  // a .build-card) - it'd just be noise on Essentials/Resources/Home.
  var BLUR_TITLE = "Maelstrom's running out 🥴";

  function handleVisibilityChange() {
    var onBuildPage = !!document.querySelector(".md-content__inner .build-card");
    if (!onBuildPage) {
      if (blurTitleOriginal !== null) {
        document.title = blurTitleOriginal;
        blurTitleOriginal = null;
      }
      return;
    }
    if (document.hidden) {
      if (blurTitleOriginal === null) blurTitleOriginal = document.title;
      document.title = BLUR_TITLE;
    } else if (blurTitleOriginal !== null) {
      document.title = blurTitleOriginal;
      blurTitleOriginal = null;
    }
  }

  // ---------- 333 Blitz title tiger: click for a tiger rain ----------
  function spawnTigerRain() {
    // Guards against a rapid double-click stacking two rains on top of
    // each other - just let the first one finish.
    if (document.querySelector(".tiger-rain")) return;
    var container = document.createElement("div");
    container.className = "tiger-rain";
    var count = 26;
    for (var i = 0; i < count; i++) {
      var span = document.createElement("span");
      span.className = "tiger-rain-emoji";
      span.textContent = "🐯";
      span.style.left = Math.random() * 100 + "vw";
      span.style.animationDuration = (0.9 + Math.random() * 0.6).toFixed(2) + "s";
      span.style.animationDelay = (Math.random() * 0.35).toFixed(2) + "s";
      span.style.fontSize = (3.6 + Math.random() * 3.3).toFixed(2) + "em";
      container.appendChild(span);
    }
    document.body.appendChild(container);
    window.setTimeout(function () {
      container.remove();
    }, 2000);
  }

  // Delegated on document (not per-element), so it survives Material's
  // instant-loading DOM swaps without needing to be rebound every page -
  // bound exactly once, guarded by delegatedClickListenersBound below.
  function handleDelegatedClick(e) {
    var tiger = e.target.closest && e.target.closest("h1 .tiger-emoji");
    if (tiger) {
      spawnTigerRain();
    }
  }

  if (window.document$) {
    document$.subscribe(function () {
      externalLinksNewTab();
      ensureProgressBar();
      updateProgress();
      buildQuickJumpPills();
      buildSectionTracker();
      wrapEmojisForWiggle();
      var isBlitzPage = togglePageBodyClasses();
      handleVisibilityChange();
      // Same rain as the click easter egg, just auto-fired once on arrival
      // at 333 Blitz - a little "welcome" nod to the Blitz meme.
      if (isBlitzPage) spawnTigerRain();

      // Scroll/resize/click/visibility listeners only need binding once
      // ever - the header (and thus the progress bar) and <body> persist
      // across instant-loading swaps, so a delegated listener bound to
      // either keeps working on every subsequent page without rebinding.
      if (!scrollListenerBound) {
        scrollListenerBound = true;
        window.addEventListener(
          "scroll",
          function () {
            updateProgress();
            updateSectionTrackerActive();
          },
          { passive: true }
        );
        window.addEventListener("resize", function () {
          updateProgress();
          updateSectionTrackerActive();
        });
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }
      if (!delegatedClickListenersBound) {
        delegatedClickListenersBound = true;
        document.addEventListener("click", handleDelegatedClick);
      }
    });
  }
})();