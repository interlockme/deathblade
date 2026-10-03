(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("skill-setup.js");
  var el = window.SiteUtils.el;
  function buildCard(entry, family) {
    var details = document.createElement("details");
    details.className = "skill-card";
    var summary = document.createElement("summary");
    var icon = document.createElement("img");
    icon.className = "skill-card-icon";
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "icon-" + entry.id + ".png");
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon);
    summary.appendChild(icon);
    var main = el("span", "skill-card-main");
    var meta = el("span", "skill-card-meta");
    if (entry.subtitle) {
      meta.appendChild(el("span", "skill-card-subtitle", entry.subtitle));
    } else if (entry.level != null) {
      meta.appendChild(el("span", "skill-card-level", "Lv. " + entry.level));
    }
    meta.appendChild(el("span", "skill-card-name", entry.name || (window.DB_SKILL_NAMES && window.DB_SKILL_NAMES[entry.id]) || entry.id));
    main.appendChild(meta);
    var chips = el("span", "skill-card-chips");
    if (entry.tripods && entry.tripods.length) {
      for (var t = 0; t < 3; t++) {
        if (t < entry.tripods.length) {
          chips.appendChild(el("span", "tripod-chip tripod-t" + (t + 1), String(entry.tripods[t])));
        } else {
          var placeholder = el("span", "tripod-chip tripod-chip-empty");
          placeholder.setAttribute("aria-hidden", "true");
          chips.appendChild(placeholder);
        }
      }
    }
    if (entry.rune) {
      var runeChip = el("span", "rune-chip rune-" + entry.rune.tier, entry.rune.name);
      runeChip.setAttribute("data-rune-name", entry.rune.name);
      runeChip.setAttribute("data-rune-tier", entry.rune.tier);
      chips.appendChild(runeChip);
    }
    if (chips.children.length) {
      main.appendChild(chips);
    }
    summary.appendChild(main);
    summary.appendChild(el("span", "skill-card-arrow"));
    details.appendChild(summary);
    var body = el("div", "skill-card-body");
    var data = (window.DB_SKILL_DATA && window.DB_SKILL_DATA[family] && window.DB_SKILL_DATA[family][entry.id]) || {};
    if (data.lines && data.lines.length) {
      body.appendChild(el("p", "skill-card-meter", data.lines.join(" \u00B7 ")));
    }
    (data.tags || []).forEach(function (pair) {
      body.appendChild(el("span", "tag tag-" + pair[0], pair[1]));
    });
    if (data.note) {
      body.appendChild(el("p", "skill-card-note", data.note));
    }
    if (entry.picks && entry.picks.length) {
      var ul = el("ul", "skill-card-picks");
      entry.picks.forEach(function (p) {
        ul.appendChild(el("li", null, p));
      });
      body.appendChild(ul);
    }
    if (!data.note && !(data.tags && data.tags.length) && !(data.lines && data.lines.length) && !(entry.picks && entry.picks.length)) {
      body.appendChild(el("p", "skill-card-note", "No additional notes."));
    }
    details.appendChild(body);
    return details;
  }
  var MASONRY_MIN_WIDTH = 410;
  var MASONRY_GAP = 11;
  function layoutMasonry(grid) {
    var cards = cardsOf(grid);
    if (!cards.length) return;
    var containerWidth = grid.clientWidth;
    if (!containerWidth) return;
    var cols = Math.max(1, Math.min(2, Math.floor((containerWidth + MASONRY_GAP) / (MASONRY_MIN_WIDTH + MASONRY_GAP))));
    var colWidth = Math.floor((containerWidth - MASONRY_GAP * (cols - 1)) / cols);
    var colHeights = new Array(cols).fill(0);
    cards.forEach(function (card) {
      var shortest = 0;
      for (var i = 1; i < cols; i++) {
        if (colHeights[i] < colHeights[shortest]) shortest = i;
      }
      var x = shortest * (colWidth + MASONRY_GAP);
      var y = colHeights[shortest];
      card.style.width = colWidth + "px";
      card.style.transform = "translate(" + x + "px, " + y + "px)";
      colHeights[shortest] = y + card.offsetHeight + MASONRY_GAP;
    });
    grid.style.height = Math.max.apply(null, colHeights) - MASONRY_GAP + "px";
    grid.classList.add("masonry-ready");
  }
  function initMasonry(grid) {
    var schedule = window.SiteUtils.rafSchedule(function () {
      layoutMasonry(grid);
    });
    schedule();
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(schedule);
      ro.observe(grid);
      cardsOf(grid).forEach(function (card) {
        ro.observe(card);
      });
      grid.__masonryObserver = ro;
    } else {
      cardsOf(grid).forEach(function (card) {
        card.addEventListener("toggle", schedule);
      });
      window.addEventListener("resize", schedule);
    }
  }
  function cardsOf(grid) {
    return Array.prototype.filter.call(grid.children, function (c) {
      return c.classList && c.classList.contains("skill-card");
    });
  }
  function renderContainer(container) {
    var family = container.getAttribute("data-family") || "re";
    var result = window.SiteUtils.readInlineJSON(container, "skill-setup.js");
    if (!result) return;
    var entries = result.data;
    var old = container.querySelector(".skill-setup-grid");
    if (old) {
      if (old.__masonryObserver) old.__masonryObserver.disconnect();
      old.remove();
    }
    var oldSpecial = container.querySelector(".skill-special-row");
    if (oldSpecial) oldSpecial.remove();
    var grid = el("div", "skill-setup-grid");
    entries.forEach(function (entry) {
      var card = buildCard(entry, family);
      var isSpecial = !((entry.tripods && entry.tripods.length) || entry.rune);
      if (isSpecial) card.classList.add("skill-card-special");
      grid.appendChild(card);
    });
    container.appendChild(grid);
    initMasonry(grid);
  }
  window.SiteUtils.registerRenderer(".skill-setup[data-family]", renderContainer);
})();
