(function () {
  var el = window.SiteUtils.el;
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("skill-tooltip.js");
  var ICON_ID_RE = /icon-([a-z0-9]+)\.png/i;
  function resolveFamily(trigger) {
    var scoped = trigger.closest("[data-family]");
    if (scoped) return scoped.getAttribute("data-family");
    var pageWide = document.querySelector("[data-family]");
    return pageWide ? pageWide.getAttribute("data-family") : null;
  }
  function lookupData(id, family) {
    var fromSkills = family && window.DB_SKILL_DATA && window.DB_SKILL_DATA[family] && window.DB_SKILL_DATA[family][id];
    if (fromSkills) return fromSkills;
    return (window.DB_SKILL_EXTRAS && window.DB_SKILL_EXTRAS[id]) || null;
  }
  function buildTip(id, data, opts) {
    opts = opts || {};
    var tip = el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");
    var name = (window.DB_SKILL_NAMES && window.DB_SKILL_NAMES[id]) || id;
    var header = el("div", "skill-tip-header");
    var icon = document.createElement("img");
    icon.className = "skill-tip-icon";
    icon.src = window.SiteUtils.iconSrc(SITE_ROOT, "icon-" + id + ".png");
    icon.alt = "";
    icon.loading = "lazy";
    window.SiteUtils.hideOnError(icon, "display");
    header.appendChild(icon);
    header.appendChild(el("div", "skill-tip-title", name));
    tip.appendChild(header);
    var body = tip;
    if (opts.primary) {
      tip.appendChild(el("div", "skill-tip-primary", opts.primary));
      body = el("div", "skill-tip-secondary");
      tip.appendChild(body);
    }
    if ((data.lines && data.lines.length) || (data.tags && data.tags.length)) {
      var tagsRow = el("div", "skill-tip-tags");
      if (data.lines && data.lines.length) {
        tagsRow.appendChild(el("span", "skill-tip-meter", data.lines.join(" \u00B7 ")));
      }
      (data.tags || []).forEach(function (pair) {
        tagsRow.appendChild(el("span", "tag tag-" + pair[0], pair[1]));
      });
      body.appendChild(tagsRow);
    }
    if (data.note) {
      body.appendChild(el("p", "skill-tip-note", data.note));
    }
    if (opts.extra) {
      tip.appendChild(el("p", "skill-tip-extra", opts.extra));
    }
    return tip;
  }
  var VIEWPORT_MARGIN = 8;
  var TRIGGER_GAP = 8;
  function positionTip(trigger, tip) {
    var host = hostedTips.get(tip);
    if (host) {
      positionInHost(host, tip);
      return;
    }
    var itemRect = trigger.getBoundingClientRect();
    var tipRect = tip.getBoundingClientRect();
    var spaceBelow = window.innerHeight - itemRect.bottom;
    var needed = tipRect.height + TRIGGER_GAP + VIEWPORT_MARGIN;
    var placeAbove = spaceBelow < needed && itemRect.top >= needed;
    var top = placeAbove ? itemRect.top - tipRect.height - TRIGGER_GAP : itemRect.bottom + TRIGGER_GAP;
    var maxTop = window.innerHeight - tipRect.height - VIEWPORT_MARGIN;
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, maxTop));
    var desiredLeft = itemRect.left + itemRect.width / 2 - tipRect.width / 2;
    var maxLeft = window.innerWidth - tipRect.width - VIEWPORT_MARGIN;
    var left = Math.min(Math.max(desiredLeft, VIEWPORT_MARGIN), maxLeft);
    tip.style.top = top + "px";
    tip.style.left = left + "px";
  }
  var hostedTips = new WeakMap();
  function positionInHost(host, tip) {
    var hostRect = host.getBoundingClientRect();
    var tipWidth = tip.getBoundingClientRect().width;
    var desiredLeft = hostRect.left + hostRect.width / 2 - tipWidth / 2;
    var maxLeft = document.documentElement.clientWidth - tipWidth - VIEWPORT_MARGIN;
    var clampedLeft = Math.min(Math.max(desiredLeft, VIEWPORT_MARGIN), maxLeft);
    tip.style.left = (clampedLeft - hostRect.left) + "px";
  }
  var hostClampQueued = false;
  function clampHostedTips() {
    hostClampQueued = false;
    openTips.forEach(function (entry) {
      if (entry.host && entry.trigger.isConnected) positionInHost(entry.host, entry.tip);
    });
  }
  function queueHostClamp() {
    if (hostClampQueued) return;
    hostClampQueued = true;
    window.requestAnimationFrame(clampHostedTips);
  }
  var hostObserver = window.ResizeObserver ? new ResizeObserver(queueHostClamp) : null;
  var openTips = [];
  var tipIdCounter = 0;
  var PRUNE_GRACE_MS = 1000;
  var pruneTimer = null;
  function pruneDetached() {
    var now = Date.now();
    var pending = false;
    openTips = openTips.filter(function (entry) {
      if (entry.trigger.isConnected) {
        entry.detachedAt = 0;
        return true;
      }
      if (!entry.detachedAt) entry.detachedAt = now;
      if (now - entry.detachedAt < PRUNE_GRACE_MS) {
        pending = true;
        return true;
      }
      entry.tip.remove();
      return false;
    });
    if (pending && !pruneTimer) {
      pruneTimer = setTimeout(function () {
        pruneTimer = null;
        pruneDetached();
      }, PRUNE_GRACE_MS);
    }
  }
  function schedulePrune() {
    if (pruneTimer) return;
    pruneTimer = setTimeout(function () {
      pruneTimer = null;
      pruneDetached();
    }, PRUNE_GRACE_MS + 50);
  }
  var suppressNextDocumentClose = false;
  var TOUCH_MOUSE_WINDOW_MS = 500;
  var lastTouchAt = 0;
  document.addEventListener(
    "touchstart",
    function () {
      lastTouchAt = Date.now();
    },
    { capture: true, passive: true }
  );
  var lastPointerType = "";
  document.addEventListener(
    "pointerdown",
    function (evt) {
      lastPointerType = evt.pointerType || "";
    },
    { capture: true, passive: true }
  );
  function recentlyTouched() {
    return Date.now() - lastTouchAt < TOUCH_MOUSE_WINDOW_MS;
  }
  function isRealMouse(evt) {
    var clickSaysMouse = !evt || evt.pointerType === undefined || evt.pointerType === "mouse";
    return clickSaysMouse && lastPointerType === "mouse" && !recentlyTouched();
  }
  function setVisible(entry, visible) {
    entry.tip.classList.toggle("skill-tip-visible", visible);
    entry.trigger.classList.toggle("skill-tip-open", visible && entry.state.open);
  }
  function practiceBlocked(trigger) {
    var line = trigger.closest(".rotation-line.practice-mode");
    return !!line && !trigger.classList.contains("practice-current");
  }
  function refresh(entry) {
    var s = entry.state;
    setVisible(entry, (s.hover || s.focus || s.open) && !practiceBlocked(entry.trigger));
  }
  function closeAllExcept(keepTrigger) {
    openTips.forEach(function (entry) {
      if (entry.trigger === keepTrigger) return;
      cancelHoverLeave(entry);
      entry.state.hover = entry.state.focus = entry.state.open = false;
      refresh(entry);
    });
  }
  var HOVER_CLOSE_DELAY_MS = 250;
  function cancelHoverLeave(entry) {
    if (entry.leaveTimer) {
      clearTimeout(entry.leaveTimer);
      entry.leaveTimer = null;
    }
  }
  function scheduleHoverLeave(entry) {
    cancelHoverLeave(entry);
    entry.leaveTimer = setTimeout(function () {
      entry.leaveTimer = null;
      entry.state.hover = false;
      refresh(entry);
    }, HOVER_CLOSE_DELAY_MS);
  }
  function findEntry(t) {
    for (var i = 0; i < openTips.length; i++) {
      if (openTips[i].trigger === t) return openTips[i];
    }
    return null;
  }
  function wire(trigger, tip, opts) {
    opts = opts || {};
    trigger.classList.add("skill-tip-anchor", "skill-tip-wired");
    trigger.setAttribute("tabindex", "0");
    if (!tip.id) tip.id = "skill-tip-" + ++tipIdCounter;
    var describedBy = (trigger.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    if (describedBy.indexOf(tip.id) === -1) {
      describedBy.push(tip.id);
      trigger.setAttribute("aria-describedby", describedBy.join(" "));
    }
    var host = opts.panelHost || null;
    if (host) hostedTips.set(tip, host);
    (host || document.body).appendChild(tip);
    var entry = { trigger: trigger, tip: tip, host: host, state: { hover: false, focus: false, open: false }, detachedAt: 0, openScrollY: 0, leaveTimer: null };
    openTips.push(entry);
    schedulePrune();
    if (host) {
      if (hostObserver) {
        hostObserver.observe(host);
        if (host.parentElement) hostObserver.observe(host.parentElement);
      }
      queueHostClamp();
    }
    trigger.addEventListener("mouseenter", function () {
      if (recentlyTouched()) return;
      closeAllExcept(trigger);
      cancelHoverLeave(entry);
      entry.state.hover = true;
      positionTip(trigger, tip);
      refresh(entry);
    });
    tip.addEventListener("mouseenter", function () {
      if (recentlyTouched()) return;
      cancelHoverLeave(entry);
      entry.state.hover = true;
      refresh(entry);
    });
    tip.addEventListener("mouseleave", function () {
      scheduleHoverLeave(entry);
    });
    trigger.addEventListener("mouseleave", function (evt) {
      var handoff = opts.fallbackTrigger && evt.relatedTarget && opts.fallbackTrigger.contains(evt.relatedTarget);
      if (handoff) {
        cancelHoverLeave(entry);
        entry.state.hover = false;
        refresh(entry);
      } else {
        scheduleHoverLeave(entry);
      }
      if (handoff) {
        var parentEntry = findEntry(opts.fallbackTrigger);
        if (parentEntry) {
          closeAllExcept(opts.fallbackTrigger);
          parentEntry.state.hover = true;
          positionTip(opts.fallbackTrigger, parentEntry.tip);
          refresh(parentEntry);
        }
      }
    });
    trigger.addEventListener("focusin", function (evt) {
      try {
        if (evt.target && evt.target.matches && !evt.target.matches(":focus-visible")) {
          if (!(opts.wrapsControl && !isRealMouse())) return;
        }
      } catch (e) {   }
      var inner = evt.target && evt.target !== trigger && evt.target.closest ? evt.target.closest(".skill-tip-wired") : null;
      if (inner && inner !== trigger && trigger.contains(inner)) return;
      closeAllExcept(trigger);
      entry.state.focus = true;
      positionTip(trigger, tip);
      refresh(entry);
    });
    trigger.addEventListener("focusout", function () {
      entry.state.focus = false;
      refresh(entry);
    });
    if (opts.tapToggle !== false || opts.wrapsControl) {
      trigger.addEventListener("click", function (evt) {
        if (trigger.closest(".rotation-line.practice-mode")) return;
        if (opts.tapToggle === false) {
          suppressNextDocumentClose = true;
          setTimeout(function () { suppressNextDocumentClose = false; }, 0);
          return;
        }
        if (evt.pointerType === "mouse" && isRealMouse(evt)) {
          suppressNextDocumentClose = true;
          setTimeout(function () { suppressNextDocumentClose = false; }, 0);
          return;
        }
        if (entry.state.open) {
          entry.state.open = false;
          refresh(entry);
          return;
        }
        closeAllExcept(trigger);
        entry.state.open = true;
        entry.openScrollY = window.pageYOffset;
        positionTip(trigger, tip);
        refresh(entry);
        suppressNextDocumentClose = true;
        setTimeout(function () { suppressNextDocumentClose = false; }, 0);
        evt.stopPropagation();
      });
    }
  }
  function attachRotationSkill(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    var id = trigger.getAttribute("data-skill-id");
    if (!id) return;
    var data = lookupData(id, resolveFamily(trigger));
    if (!data) return;
    var reason = trigger.getAttribute("data-situational-reason");
    wire(trigger, buildTip(id, data, reason ? { extra: reason } : undefined));
  }
  function attachSkillInline(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    var id = trigger.getAttribute("data-skill-id");
    if (!id) {
      var imgs = trigger.querySelectorAll(":scope > img");
      if (imgs.length !== 1) return;
      var match = ICON_ID_RE.exec(imgs[0].getAttribute("src") || "");
      if (!match) return;
      id = match[1];
    }
    var data = lookupData(id, resolveFamily(trigger));
    if (!data) return;
    wire(trigger, buildTip(id, data));
  }
  function attachFoodOption(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    var img = trigger.querySelector(".food-option-icon");
    if (!img) return;
    var match = ICON_ID_RE.exec(img.getAttribute("src") || "");
    if (!match) return;
    var id = match[1];
    var data = lookupData(id, resolveFamily(trigger));
    if (!data) return;
    trigger.removeAttribute("title");
    wire(trigger, buildTip(id, data));
  }
  function attachBareIcon(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    if (trigger.closest(".food-option")) return;
    if (trigger.closest(".food-req-item")) return;
    var match = ICON_ID_RE.exec(trigger.getAttribute("src") || "");
    if (!match) return;
    var id = match[1];
    var data = lookupData(id, resolveFamily(trigger));
    if (!data) return;
    var iconName = (window.DB_SKILL_NAMES && window.DB_SKILL_NAMES[id]) || trigger.getAttribute("title") || "";
    trigger.removeAttribute("title");
    if (trigger.tagName === "IMG" && !trigger.getAttribute("alt") && iconName) trigger.setAttribute("alt", iconName);
    var chip = trigger.closest(".engraving-chip[data-skill-id]");
    wire(trigger, buildTip(id, data), { fallbackTrigger: chip || null });
  }
  function buildNoteTip(text) {
    var tip = el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");
    tip.appendChild(el("p", "skill-tip-note", text));
    return tip;
  }
  function attachDataTip(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    var text = trigger.getAttribute("data-repeat-tip") || trigger.getAttribute("data-standalone-tip");
    if (!text) return;
    wire(trigger, buildNoteTip(text));
  }
  var TAP_SCROLL_DISMISS_PX = 60;
  function repositionVisible() {
    var y = window.pageYOffset;
    openTips.forEach(function (entry) {
      if (entry.state.open && Math.abs(y - entry.openScrollY) > TAP_SCROLL_DISMISS_PX) {
        entry.state.open = false;
        refresh(entry);
      }
      if (!entry.host && entry.tip.classList.contains("skill-tip-visible")) positionTip(entry.trigger, entry.tip);
    });
  }
  window.addEventListener("scroll", repositionVisible, { passive: true, capture: true });
  window.addEventListener("resize", repositionVisible);
  window.addEventListener("resize", queueHostClamp);
  var practiceObserver = new MutationObserver(function (mutations) {
    var relevant = mutations.some(function (m) {
      var cls = m.target.classList;
      return cls && (cls.contains("rotation-line") || cls.contains("skill"));
    });
    if (relevant) openTips.forEach(refresh);
  });
  practiceObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
    subtree: true,
  });
  document.addEventListener("click", function () {
    if (suppressNextDocumentClose) {
      suppressNextDocumentClose = false;
      return;
    }
    closeAllExcept(null);
  });
  document.addEventListener("keydown", function (evt) {
    if (evt.key === "Escape") closeAllExcept(null);
  });
  window.SiteUtils.registerRenderer(".rotation-line .skill[data-skill-id]", attachRotationSkill);
  window.SiteUtils.registerRenderer(".rotation-line .skill-part[data-skill-id]", attachRotationSkill);
  window.SiteUtils.registerRenderer(".skill-inline, .food-req-item, .engraving-chip[data-skill-id], .engraving-card-name[data-skill-id], .skill-mention[data-skill-id]", attachSkillInline);
  window.SiteUtils.registerRenderer(".food-option", attachFoodOption);
  window.SiteUtils.registerRenderer(".food-option-icon, img.skill-icon", attachBareIcon);
  window.SiteUtils.registerRenderer(".cycle-repeat-badge[data-repeat-tip], .skill-situational-tag[data-standalone-tip], .rotation-line .arrow-swap[data-standalone-tip]", attachDataTip);
  window.SkillTooltip = {
    attach: function (trigger, id, primary, opts) {
      opts = opts || {};
      if (trigger.classList.contains("skill-tip-wired")) return false;
      var data = lookupData(id, resolveFamily(trigger));
      if (!data) return false;
      wire(trigger, buildTip(id, data, { primary: primary, extra: opts.extra }), { tapToggle: opts.tapToggle });
      return true;
    },
    hide: function (trigger) {
      var entry = findEntry(trigger);
      if (!entry) return;
      entry.state.hover = entry.state.focus = entry.state.open = false;
      refresh(entry);
    },
    wireCustom: function (trigger, tip, opts) {
      if (trigger.classList.contains("skill-tip-wired")) return false;
      wire(trigger, tip, opts);
      return true;
    },
  };
})();
