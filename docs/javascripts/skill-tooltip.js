// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// skill-data.js/skill-names.js (window.DB_SKILL_DATA/DB_SKILL_NAMES/
// DB_SKILL_EXTRAS); no code changes needed here, just point those at your
// own data.
//
// Attaches the same kind of hover/focus/tap tooltip ark-core-badge.js
// gives the Ark Grid core cards to two existing surfaces, instead of
// building new DOM for them - with one deliberate difference from that
// file: the tooltip panel here is appended to <body> as position: fixed,
// positioned/shown from JS, rather than living inside the trigger as a
// CSS :hover-revealed absolutely-positioned child. .rotation-line sets
// overflow: hidden on itself (see rotation-practice.js's own comment on
// having to float ITS toggle pill in a separate wrapper for the same
// reason) which would silently clip a tooltip anchored inside a .skill
// chip - appending to <body> sidesteps that ancestor-clipping problem
// entirely instead of chasing which containers on the site do or don't
// clip. Same convention as .image-lightbox-overlay/.tiger-rain elsewhere
// for a body-level fixed overlay (see extra.css).
//
//   - .rotation-line .skill chips that carry a data-skill-id (set by
//     rotation-line.js for any plain single-skill step - see that file).
//   - .skill-inline spans handwritten in prose (see extra.css's "Inline
//     skill reference for prose" section) - id is read off the span's
//     single <img> icon-<id>.png filename, since those spans are static
//     markdown and don't otherwise carry one.
//   - .engraving-chip / .engraving-card-name spans (essentials.md's
//     Engravings section) and .skill-mention spans (bare prose mentions
//     with no chip/pill around them at all, e.g. "equip maxed Spirit
//     Absorption and Max MP engravings") - none of these have an icon to
//     read an id off of (a chip/heading/prose word has no image slot), so
//     each carries an explicit data-skill-id instead. Reuses
//     attachSkillInline itself (its data-skill-id branch, see below) - not
//     a separate function - since once an id is known the lookup/build/
//     wire steps are identical either way.
//   - .food-option pills (essentials.md's Food Requirement panel) - same
//     icon-filename id lookup as .skill-inline, the pill div itself is
//     the trigger. See attachFoodOption.
//   - Bare food/consumable icons with no pill or name span around them
//     (.food-option-icon standalone in Surge's alt line, .skill-icon
//     standalone in both families' Engravings section) - the icon itself
//     is the trigger. See attachBareIcon.
//   - .food-req-item spans (Surge essentials' engraving-card food notes,
//     e.g. "Atk/Move Speed feast advised") - same icon-filename id lookup
//     as .skill-inline, wraps an icon + its own name so the hoverable
//     area covers the words too, not just the icon. Also reuses
//     attachSkillInline (its no-data-skill-id branch).
//   - Also exposes window.SkillTooltip.attach() for gem-dps-tooltip.js,
//     which needs this file's same lookup/build/wire pipeline but with an
//     extra damage-share line this file doesn't itself compute.
//
// Tooltip content is the SAME tags + note skill-setup.js already shows in
// a Skill Setup card's expanded body (DB_SKILL_DATA[family][id]) - no
// separate copy of that text to keep in sync. A .skill-inline id with no
// entry there (Atropine, Stimulant - consumables, not real skills) falls
// back to DB_SKILL_EXTRAS[id] instead: a flat id -> note map with no
// family split and no tags, just enough for the tooltip to show their
// in-game effect text rather than nothing. An id with no match in EITHER
// map gets no tooltip at all - fail quietly, same rule every widget on
// this site follows (a typo'd id, or a skill not yet given tags/a note,
// just renders as a plain chip/mention).
//
// Must load after skill-data.js, skill-names.js, and rotation-line.js -
// see the extra_javascript order in mkdocs.yml. That ordering is only for
// readability, though (this file is a consumer of what those produce) -
// SiteUtils.registerRenderer's own MutationObserver is what actually
// catches a rotation-line's chips whenever they're built, so load order
// relative to rotation-line.js can't cause a missed tooltip either way.
//
// EASY EDIT GUIDE:
//   Nothing to author per-page - this attaches itself to every matching
//   .rotation-line .skill and .skill-inline already on a page, with no
//   markdown changes needed for either. The only upkeep is DB_SKILL_EXTRAS
//   in skill-data.js, for any FUTURE non-skill .skill-inline mention that
//   should show something too.
//
//   A .skill-inline span can also force a specific id with
//   data-skill-id="id" on the span itself, instead of relying on the
//   icon-filename guess - useful if a future mention's icon and the skill
//   it's actually about ever diverge (e.g. a stand-in icon).
(function () {
  var el = window.SiteUtils.el;

  var ICON_ID_RE = /icon-([a-z0-9]+)\.png/i;

  // Which build family a trigger's data should come from. Checks the
  // closest ancestor carrying data-family first (a .skill-setup/
  // .skills-table section) - a mention that happens to sit inside one of
  // those should use THAT section's family even if a page somehow mixed
  // both (it never does today, but costs nothing to get right) - then
  // falls back to whichever data-family shows up first on the page at
  // all, since every build/essentials page belongs to exactly one family
  // end to end, and most rotation-line/skill-inline mentions live outside
  // any data-family container to begin with (they're prose/list items,
  // not part of the Skill Setup section itself).
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

  // opts.primary: an already-formatted string that outranks tags/note in
  // importance (currently only gem-dps-tooltip.js's damage-share figure,
  // e.g. "24.3% of total damage") - shown as its own bold line ABOVE the
  // tags/note rather than folded into the note text, and pushes tags/note
  // into a visually secondary ".skill-tip-secondary" wrapper (smaller/
  // muted, divider above - see extra.css) so the panel still reads
  // top-to-bottom as "the number you hovered for, then the rest" instead
  // of three same-weight lines. Every other caller (rotation chips,
  // .skill-inline mentions) has no primary stat to show, so they're
  // unaffected: no opts, tags/note render at their old first-line weight.
  function buildTip(id, data, opts) {
    opts = opts || {};

    // The "md-typeset" class is what makes the reused .tag/.tag-dmg/etc.
    // pill rules (defined as .md-typeset .tag in extra.css) apply here -
    // this tip lives in <body>, outside the article's real .md-typeset
    // wrapper, so without it those descendant selectors wouldn't match at
    // all. Picks up Material's own base typographic rules too, which is
    // what makes the note text render with the same font/line-height as
    // everywhere else instead of the browser's plain defaults.
    var tip = el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");

    var name = (window.DB_SKILL_NAMES && window.DB_SKILL_NAMES[id]) || id;
    tip.appendChild(el("div", "skill-tip-title", name));

    var body = tip;
    if (opts.primary) {
      tip.appendChild(el("div", "skill-tip-primary", opts.primary));
      body = el("div", "skill-tip-secondary");
      tip.appendChild(body);
    }

    if (data.tags && data.tags.length) {
      var tags = el("div", "skill-tip-tags");
      data.tags.forEach(function (pair) {
        tags.appendChild(el("span", "tag tag-" + pair[0], pair[1]));
      });
      body.appendChild(tags);
    }

    if (data.note) {
      body.appendChild(el("p", "skill-tip-note", data.note));
    }

    return tip;
  }

  // Positions `tip` (already in <body>, fixed) against `trigger`'s
  // current viewport position - getBoundingClientRect is already
  // viewport-relative, matching position: fixed directly, no scrollX/
  // scrollY math needed the way an absolute-in-document tooltip would.
  // Centers horizontally under the trigger, clamped to stay on screen
  // (same instinct as ark-core-badge.js's positionTip), and prefers
  // sitting below the trigger but flips above it when there isn't room
  // below but there IS above - worth doing here (ark-core-badge doesn't
  // bother) since a .skill-inline mention can land anywhere down a long
  // page, including right at the bottom of the viewport, unlike the Ark
  // Setup section's cores which are never that close to a page edge.
  var VIEWPORT_MARGIN = 8;
  var TRIGGER_GAP = 8;
  function positionTip(trigger, tip) {
    var itemRect = trigger.getBoundingClientRect();
    var tipRect = tip.getBoundingClientRect(); // real size - opacity:0 still lays out, unlike display:none
    var spaceBelow = window.innerHeight - itemRect.bottom;
    var needed = tipRect.height + TRIGGER_GAP + VIEWPORT_MARGIN;
    var placeAbove = spaceBelow < needed && itemRect.top >= needed;
    var top = placeAbove ? itemRect.top - tipRect.height - TRIGGER_GAP : itemRect.bottom + TRIGGER_GAP;

    var desiredLeft = itemRect.left + itemRect.width / 2 - tipRect.width / 2;
    var maxLeft = window.innerWidth - tipRect.width - VIEWPORT_MARGIN;
    var left = Math.min(Math.max(desiredLeft, VIEWPORT_MARGIN), maxLeft);

    tip.style.top = top + "px";
    tip.style.left = left + "px";
  }

  // Only one tooltip visible at a time. `state` tracks the three
  // independent reasons a given tip might need to stay open (mouse
  // still over the trigger, keyboard focus still on it, tap-toggled
  // open) so e.g. a mouseleave right after a tap-open doesn't close a
  // tooltip the tap explicitly asked to keep open.
  var openTips = []; // [{ trigger, tip, state }]

  function setVisible(entry, visible) {
    entry.tip.classList.toggle("skill-tip-visible", visible);
    entry.trigger.classList.toggle("skill-tip-open", visible && entry.state.open);
  }

  // While a .rotation-line is in practice mode, every step but the
  // current one is already dimmed to 0.32 opacity (extra.css) to read as
  // "not now" - letting any of those still pop a full tooltip on hover
  // fights that same dimming, and defeats the point of a drill (reading
  // ahead to the next few steps instead of recalling them). Only applies
  // to rotation-line chips; a .skill-inline prose mention is never
  // inside a .rotation-line at all, so it's unaffected either way.
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
      entry.state.hover = entry.state.focus = entry.state.open = false;
      refresh(entry);
    });
  }

  // Wires the hover/focus/tap-toggle behavior onto a trigger already
  // confirmed to have data, appending its tooltip to <body> once.
  // `.skill-tip-wired` marks the trigger done so re-runs (instant-nav
  // re-renders, a stray extra MutationObserver pass) never double-wire
  // the same element - same idempotency instinct as skill-setup.js/
  // rotation-line.js's own render guards.
  // opts.fallbackTrigger: this trigger sits INSIDE another element that's
  // also independently wired (currently only RE's Raid Captain chip's
  // Feast icon, nested inside the chip itself - see attachBareIcon).
  // mouseenter fires ancestor-first when the pointer lands directly on a
  // nested trigger (crossing the outer element's boundary necessarily
  // happens before crossing the inner one's), so the outer's tooltip
  // flashes open for an instant and is then immediately closed by this
  // trigger's own closeAllExcept below - that ordering is what makes the
  // inner trigger "win" while the pointer is actually over it. The
  // opposite direction isn't symmetric, though: moving off this trigger
  // to elsewhere on the outer one doesn't re-cross the outer's boundary
  // at all, so its mouseenter never refires, and without the explicit
  // handoff in the mouseleave handler below both tooltips would just stay
  // closed until the pointer left and re-entered the whole outer element.
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
    document.body.appendChild(tip);

    var entry = { trigger: trigger, tip: tip, state: { hover: false, focus: false, open: false } };
    openTips.push(entry);

    trigger.addEventListener("mouseenter", function () {
      // A different trigger's tap-toggled-open tooltip (entry.state.open)
      // is independent of hover/focus, so without this it would just sit
      // there once the mouse moves on to hover something else entirely -
      // closeAllExcept clears every OTHER entry's open/hover/focus state
      // (this entry's own state.hover is set right after, so it's
      // unaffected by being excluded from that sweep).
      closeAllExcept(trigger);
      entry.state.hover = true;
      positionTip(trigger, tip);
      refresh(entry);
    });
    trigger.addEventListener("mouseleave", function (evt) {
      entry.state.hover = false;
      refresh(entry);
      // See opts.fallbackTrigger's comment above wire(). Only hands the
      // tooltip back if the pointer is still actually inside the outer
      // trigger (relatedTarget) - if it left the outer element entirely
      // too, that element's own mouseleave (registered separately, when
      // IT was wired) already fired or is about to, and will correctly
      // leave both closed.
      if (opts.fallbackTrigger && evt.relatedTarget && opts.fallbackTrigger.contains(evt.relatedTarget)) {
        var parentEntry = findEntry(opts.fallbackTrigger);
        if (parentEntry) {
          closeAllExcept(opts.fallbackTrigger);
          parentEntry.state.hover = true;
          positionTip(opts.fallbackTrigger, parentEntry.tip);
          refresh(parentEntry);
        }
      }
    });
    trigger.addEventListener("focusin", function () {
      closeAllExcept(trigger);
      entry.state.focus = true;
      positionTip(trigger, tip);
      refresh(entry);
    });
    trigger.addEventListener("focusout", function () {
      entry.state.focus = false;
      refresh(entry);
    });

    // Tap-to-toggle for touch, which triggers neither hover nor focus -
    // same pattern as ark-core-badge.js/ap-calc-popover elsewhere.
    // Except: a .rotation-line in practice mode already owns clicks on
    // itself (click anywhere on the line advances a step - see
    // rotation-practice.js) - defer to that entirely on this chip rather
    // than swallowing the click for our own tap-toggle instead. Hover/
    // focus still shows the tooltip fine even while practicing; only the
    // touch tap-to-open is what steps aside here.
    trigger.addEventListener("click", function (evt) {
      if (trigger.closest(".rotation-line.practice-mode")) return;
      if (entry.state.open) {
        entry.state.open = false;
        refresh(entry);
        return;
      }
      closeAllExcept(trigger);
      entry.state.open = true;
      positionTip(trigger, tip);
      refresh(entry);
      evt.stopPropagation();
    });
  }

  function attachRotationSkill(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    var id = trigger.getAttribute("data-skill-id");
    if (!id) return;
    var data = lookupData(id, resolveFamily(trigger));
    if (!data) return;
    wire(trigger, buildTip(id, data));
  }

  // rotation-line.js's multi-icon "pick whichever" step (e.g. Turning
  // Slash/Surprise Attack joined by "or", name text dropped for space) -
  // the step's own .skill chip has no data-skill-id (ambiguous, see that
  // file's own comment), but it stamps one directly on each <img> inside
  // it, since an individual icon IS still unambiguously one real skill.
  // Same wire()/buildTip() as attachRotationSkill above, just keyed off
  // the icon itself as the trigger instead of the whole chip, so hovering
  // one icon shows only that icon's own tooltip, not a guess at which of
  // the two the step "really" means.
  function attachRotationIcon(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    var id = trigger.getAttribute("data-skill-id");
    if (!id) return;
    var data = lookupData(id, resolveFamily(trigger));
    if (!data) return;
    wire(trigger, buildTip(id, data));
  }

  function attachSkillInline(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;

    var id = trigger.getAttribute("data-skill-id");
    if (!id) {
      // Direct-child <img>s only - a combo mention (e.g. Blade Assault +
      // Fatal Wave/Turning Slash/Fatal Wave written as one "FTF" span with
      // 3 icons) has no single skill a tooltip could describe, so it's
      // left alone rather than guessing which icon "wins".
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

  // A Food Requirement pill (essentials.md's .food-option divs - the
  // Striploin/Herb Steak/Azena's/Feast row up top of each family's page)
  // used to carry its effect text as a native `title` on the whole div.
  // Same upgrade as .skill-inline: the div itself is the trigger (there's
  // exactly one .food-option-icon per pill, so no ambiguity the way a
  // multi-icon combo mention would have), text comes from
  // DB_SKILL_EXTRAS by icon id instead of the div's own title attribute -
  // removeAttribute below drops that attribute once a rich tooltip is
  // wired so hovering doesn't show both the native tooltip AND this one
  // stacked on top of each other. The pill's own .food-option:hover glow
  // (extra.css) is untouched; this only adds the tooltip on top of it.
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

  // Bare food/consumable icons with no wrapping .food-option pill and no
  // .skill-inline name span around them - Surge's "Mana Food + Maelstrom
  // Bleed" alt line (bare .food-option-icon images, each already carrying
  // its own native `title`) and both families' Engravings section food
  // mentions (bare .skill-icon images, which never had a title at all -
  // that section's "Raid Captain"/"requires Atk/Move Speed feast"/"X
  // advised" text is a full sentence or an unrelated engraving name, not
  // the food item's own name, so unlike .skill-inline there's no single
  // "name span" here that should become the trigger - the icon itself is
  // the only element that's unambiguously "about" one specific food item).
  // Selector below also matches .food-option-icon instances that ARE
  // already inside a .food-option pill (attachFoodOption's job, above) -
  // skip those explicitly so a pill's icon doesn't get wired as a SECOND,
  // nested, independent trigger sitting inside the pill's own.
  function attachBareIcon(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    if (trigger.closest(".food-option")) return;
    // Icon+text combos rewritten as .food-req-item spans (Surge
    // essentials' engraving-card food notes, e.g. "Atk/Move Speed feast
    // advised") are wired whole via attachSkillInline instead, so the
    // words are part of the hoverable area too, not just the icon - skip
    // here so the icon doesn't become a second, independent, nested
    // trigger inside that span's own (same reason as the .food-option
    // skip just above).
    if (trigger.closest(".food-req-item")) return;
    var match = ICON_ID_RE.exec(trigger.getAttribute("src") || "");
    if (!match) return;
    var id = match[1];
    var data = lookupData(id, resolveFamily(trigger));
    if (!data) return;
    trigger.removeAttribute("title");
    // RE's Raid Captain chip (.engraving-chip-food) wraps its Feast icon
    // INSIDE the chip that's already wired as its own trigger
    // (.engraving-chip[data-skill-id="raidcaptain"], via attachSkillInline)
    // - rather than skip the icon (which loses the Feast tooltip
    // entirely) or leave it fully independent (which starves the chip's
    // own Raid Captain tooltip down to the small sliver of chip not
    // covered by the icon), pass that chip as a fallbackTrigger so wire()
    // hands its tooltip back once the pointer moves off the icon but is
    // still somewhere else on the chip. See wire()'s own comment for how
    // that handoff works. Any OTHER bare .skill-icon with no enclosing
    // chip (the Engravings-section food notes elsewhere, standalone
    // .food-option-icon mentions) simply gets fallbackTrigger: null,
    // i.e. today's plain behavior, unaffected.
    var chip = trigger.closest(".engraving-chip[data-skill-id]");
    wire(trigger, buildTip(id, data), { fallbackTrigger: chip || null });
  }

  // A fixed-position tip doesn't scroll with its trigger the way an
  // absolute-in-document one (e.g. ark-core-badge.js's) automatically
  // would, so any tip currently showing needs an explicit reposition on
  // scroll - capture: true so this also catches scrolling inside a
  // nested scrollable container (a code block, a tabbed panel), not just
  // the window itself. Cheap to run: openTips is small (a handful of
  // rotation/inline mentions per page) and this only does real work for
  // whichever entries are actually visible.
  function repositionVisible() {
    openTips.forEach(function (entry) {
      if (entry.tip.classList.contains("skill-tip-visible")) positionTip(entry.trigger, entry.tip);
    });
  }
  window.addEventListener("scroll", repositionVisible, { passive: true, capture: true });
  window.addEventListener("resize", repositionVisible);

  // practiceBlocked() above only changes an entry's OWN visibility the
  // next time hover/focus fires on ITS trigger - it does nothing for a
  // tooltip that's already open when practice-mode is entered/exited or
  // the drill advances a step out from under it (e.g. the mouse is
  // sitting over step 3, the reader clicks "Practice", step 3 isn't the
  // current one - that tooltip should close immediately, not linger
  // until the mouse happens to leave and re-enter). rotation-practice.js
  // only ever toggles the "practice-mode" class (on the .rotation-line)
  // and "practice-current" class (on each .skill step) to express all of
  // that state, so watching for class-attribute changes on either is
  // enough to catch every case without this file needing to import
  // anything from that one - re-run refresh() for every currently-open
  // tooltip whenever either class changes anywhere, rather than trying
  // to work out which specific entries are affected.
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

  // Tap-outside/Escape-to-close for the touch toggle above.
  document.addEventListener("click", function () { closeAllExcept(null); });
  document.addEventListener("keydown", function (evt) {
    if (evt.key === "Escape") closeAllExcept(null);
  });

  window.SiteUtils.registerRenderer(".rotation-line .skill[data-skill-id]", attachRotationSkill);
  window.SiteUtils.registerRenderer(".rotation-line .skill img[data-skill-id]", attachRotationIcon);
  window.SiteUtils.registerRenderer(".skill-inline, .food-req-item, .engraving-chip[data-skill-id], .engraving-card-name[data-skill-id], .skill-mention[data-skill-id]", attachSkillInline);
  window.SiteUtils.registerRenderer(".food-option", attachFoodOption);
  window.SiteUtils.registerRenderer(".food-option-icon, img.skill-icon", attachBareIcon);

  // Exposed for gem-dps-tooltip.js: a Damage-column gem row already shows
  // this same skill's tags/note here for free (same DB_SKILL_DATA lookup,
  // same buildTip), but needs to lead with a per-row damage-share figure
  // this file has no way to compute itself (that number comes from a
  // build page's own "## Trixion DPS" chart data, which gem-dps-tooltip.js
  // already parses). `primary` is that already-formatted string (e.g.
  // "24.3% of total damage") - see buildTip's own comment on how it's
  // displayed. Returns false without wiring anything if the id has no
  // DB_SKILL_DATA/DB_SKILL_EXTRAS entry, same fail-quietly rule as every
  // attach* function above, so the caller knows whether to also fall back
  // to a plain native title.
  window.SkillTooltip = {
    attach: function (trigger, id, primary) {
      if (trigger.classList.contains("skill-tip-wired")) return false;
      var data = lookupData(id, resolveFamily(trigger));
      if (!data) return false;
      wire(trigger, buildTip(id, data, { primary: primary }));
      return true;
    },

    // Lower-level than attach(): takes an already-built tip element instead
    // of looking one up via DB_SKILL_DATA/DB_SKILL_EXTRAS, for a caller
    // with its own data source and tip layout (ark-passive-tooltip.js's
    // per-node/per-level effect text) that still wants the same body-fixed,
    // hover/focus/tap-toggle, viewport-clamped positioning engine this file
    // already built for skill mentions - see wire()'s own comment. Returns
    // false without wiring anything if trigger is already wired (same
    // idempotency guard as attach()), true otherwise.
    wireCustom: function (trigger, tip) {
      if (trigger.classList.contains("skill-tip-wired")) return false;
      wire(trigger, tip);
      return true;
    },
  };
})();
