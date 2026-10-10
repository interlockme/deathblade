(function () {
  var visibilityListenerBound = false;
  var delegatedClickListenersBound = false;
  var jumpClickBound = false;
  var blurTitleOriginal = null;
  function externalLinksNewTab() {
    document.querySelectorAll(".md-content a[href]").forEach(function (a) {
      if (!/^https?:\/\//i.test(a.getAttribute("href") || "")) return;
      if (a.hostname === window.location.hostname) return;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
  }
  function buildSectionSkipLinks() {
    document.querySelectorAll(".section-skip").forEach(function (a) { a.remove(); });
    var article = document.querySelector(".md-content__inner");
    if (!article) return;
    var headings = Array.prototype.filter.call(
      article.querySelectorAll(":scope > h2"),
      function (h) { return h.id; }
    );
    if (headings.length < 2) return;
    function headingText(h) {
      return h.textContent.replace(/\s*¶\s*$/, "");
    }
    function makeLink(target) {
      var a = document.createElement("a");
      a.className = "section-skip";
      a.href = "#" + target.id;
      a.textContent = "Skip to " + headingText(target);
      a.addEventListener("focus", function () {
        var top = 0;
        document.querySelectorAll(".md-header, .md-tabs").forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.height > 0 && r.bottom > top) top = r.bottom;
        });
        a.style.top = top + 8 + "px";
        a.style.left = Math.max(article.getBoundingClientRect().left, 8) + "px";
      });
      return a;
    }
    article.insertBefore(makeLink(headings[0]), article.firstChild);
    headings.forEach(function (h, i) {
      if (i + 1 < headings.length) h.insertAdjacentElement("afterend", makeLink(headings[i + 1]));
    });
  }
  function buildQuickJumpPills() {
    var old = document.querySelector(".quick-jump-pills");
    if (old) old.remove();
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
      a.textContent = h.textContent.replace(/\s*¶\s*$/, "");
      nav.appendChild(a);
    });
    anchor.insertAdjacentElement("afterend", nav);
  }
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
    var isBlitzPage = /\/surge\/333-blitz\/?(?:$|[?#])/.test(window.location.pathname);
    document.body.classList.toggle("page-333-blitz", isBlitzPage);
    return isBlitzPage;
  }
  var BLUR_TITLE = "Mael's running out 🥴";
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
  function spawnTigerRain() {
    if (document.querySelector(".tiger-rain")) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var container = document.createElement("div");
    container.className = "tiger-rain";
    container.setAttribute("aria-hidden", "true");
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
  function handleDelegatedClick(e) {
    var tiger = e.target.closest && e.target.closest("h1 .tiger-emoji");
    if (tiger) {
      spawnTigerRain();
    }
  }
  function handleJumpLinkClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!(e.target instanceof Element)) return;
    var link = e.target.closest("a[href*='#']");
    if (!link || !link.hash || link.hash.length < 2) return;
    if (link.origin !== window.location.origin || link.pathname !== window.location.pathname) return;
    if (link.target === "_blank" || link.hasAttribute("download") || link.classList.contains("md-skip")) return;
    if (link.closest(".tabbed-labels, label")) return;
    var id = link.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (err) {   }
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.history.replaceState({ x: window.scrollX, y: window.scrollY }, "");
    window.history.pushState(null, "", link.hash);
    var header = document.querySelector(".md-header");
    var gap = (header ? header.offsetHeight : 0) + 20;
    window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - gap));
    if (link.classList.contains("section-skip")) {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
    var landedY = window.scrollY;
    window.setTimeout(function () {
      if (window.location.hash !== link.hash && Math.abs(window.scrollY - landedY) < 2) {
        window.history.replaceState(window.history.state, "", link.hash);
      }
    }, 400);
  }
  if (window.document$) {
    document$.subscribe(function () {
      externalLinksNewTab();
      buildSectionSkipLinks();
      buildQuickJumpPills();
      wrapEmojisForWiggle();
      var isBlitzPage = togglePageBodyClasses();
      handleVisibilityChange();
      if (isBlitzPage) spawnTigerRain();
      if (!visibilityListenerBound) {
        visibilityListenerBound = true;
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }
      if (!delegatedClickListenersBound) {
        delegatedClickListenersBound = true;
        document.addEventListener("click", handleDelegatedClick);
      }
      if (!jumpClickBound) {
        jumpClickBound = true;
        document.addEventListener("click", handleJumpLinkClick, true);
      }
    });
  }
})();