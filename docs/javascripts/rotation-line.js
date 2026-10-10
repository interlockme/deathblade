// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// build-data.js/skill-data.js/skill-names.js/ap-node-names.js; no code
// changes needed here, just point your build/essentials pages' JSON blocks
// at your own data.
//
// Renders every ".rotation-line" from a compact JSON step list instead
// of requiring the icon+span+arrow markup to be handwritten in full on
// every single line. Same instinct as skill-setup.js/essentials-table.js:
// author the data, not the DOM.
//
// Output is byte-for-byte the same DOM shape the old handwritten markup
// produced (.rotation-line > .skill/.arrow, with img + text inside
// .skill), so extra.css's rotation-line rules and rotation-practice.js's
// click-to-advance drill both keep working completely unchanged.
//
// Must load after site-utils.js and skill-names.js, and BEFORE
// rotation-practice.js - see the extra_javascript order in mkdocs.yml.
// rotation-practice.js only wires up whatever .skill/.arrow elements
// already exist in the DOM when it runs, so this has to build them first.
//
// Every plain (non-skills, non-cycleRef) step's .skill chip also gets a
// data-skill-id attribute, which is all skill-tooltip.js needs to attach
// its hover/focus/tap tooltip to it - no markup changes needed here if
// that file's own logic ever changes.
//
// EASY EDIT GUIDE:
//   <div class="rotation-line" markdown>
//   <script type="application/json">
//   ["maelstrom", "voidstrike", "twinshadows", "headhunt", "deathlyslash",
//    "deathsentence", "turningslash", "surge"]
//   </script>
//   </div>
//
//   The common case is just an array of skill ids in order - the name
//   ("Turning Slash") and icon (icon-turningslash.png) are both looked
//   up automatically from DB_SKILL_NAMES (skill-names.js), same id you'd
//   use in a Skill Setup JSON entry or essentials-table.js row.
//
//   A step can also be an object for the less common cases:
//     { "id": "fatalwave", "name": "FTF" }
//       - override the display name (icon still comes from id).
//     { "id": "headhunt", "situational": true }
//       - de-emphasized/optional step (dashed border, desaturated icon,
//         a small "*" marker). The reason ("Situational") shows up as an
//         extra line at the bottom of the skill's own hover/focus/tap
//         tooltip (skill-tooltip.js's attachRotationSkill reads it off a
//         data-situational-reason attribute) rather than a second tooltip
//         of its own - the marker itself is decorative only.
//     { "id": "deathlyslash", "situational": "every other rotation" }
//       - situational with a custom reason instead of the default
//         "Situational" - shown in that same bottom line, not typed out
//         on the chip (a spelled-out reason like "adrenaline/synergy"
//         would sit right on the chip and visibly widen/heighten it).
//         Any "**word**" in the reason is stripped to plain "word" (the
//         tooltip's extra line is plain text, no bold).
//         Exception: a { "cycleRef": ... } pseudo-step (below) has no
//         skill to attach a tooltip to at all, so ITS reason still shows
//         via a plain native `title` on the marker - see buildStep's own
//         comment on why that's the one case this doesn't apply to.
//     { "skills": ["turningslash", "surpriseattack"], "situational": "adrenaline" }
//       - one chip holding two skills joined by "or" - for a step that's
//         really "pick whichever of these is up". Each skill keeps its
//         own icon, name and hover/focus/tap tooltip; the chip as a whole
//         has no single tooltip (nothing to attach it to). Situational
//         tag and the rest of the chip styling work like any other step.
//     { "skills": ["maelstrom", "surpriseattack"], "join": "and/or" }
//       - optional "join" replaces the default "or" between the skills
//         (here: "either, or both" instead of "pick one").
//     { "cycleRef": 2, "title": "Soul Absorber + Blitz Rush Cycle" }
//       - a pseudo-step pointing at a Cycle card above instead of a
//         real skill (no icon). Renders the same cycle-num/cycle-title
//         pill the Cycle card's own header uses.
//     { "id": "headhunt", "swapNext": true }
//       - marks the arrow to the NEXT step as order-interchangeable
//         (e.g. Head Hunt/Twin Shadows as the opener's first two steps -
//         either can go first) instead of a fixed sequence. Renders as a
//         distinct two-headed chevron instead of the normal one, with a
//         hover tooltip explaining why. Put the flag on the step BEFORE
//         the arrow you want to change, not the one after.
//
//   The root must always be a bare array (never a top-level object - see
//   the note on mkdocs-material's instant-navigation below for why). For
//   trailing text after the last arrow (the RE Opener rotations use this
//   for the "-> Cycle 2 -> Cycle 1 -> etc." loop-back), add one more
//   entry at the very end: { "suffix": "etc." }
//
//   Arrows also get a distinct "turn" look automatically when a line
//   wraps - this is pure runtime measurement (see updateWrapArrows
//   below), never something to set in the JSON.
//
//   For a small "CYCLE"/"FOLLOW-UP"-style tag at the START of the line
//   (a .cycle-card-multi's two stages use this to say which stage each
//   rotation-line is, without a separate labeled bar above the box - see
//   extra.css's .stage-tag comment for why this replaced that bar), add
//   one entry at the very START: { "stageLabel": "Cycle" }. It renders as
//   a small pill and flows as an ordinary item in the line's own flex-wrap
//   row (no arrow before or after it), so it never reserves a separate
//   row of its own - it just sits to the left of the first real step,
//   wrapping onto its own line only if the row genuinely runs out of
//   width, same as any other chip would.
(function () {
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("rotation-line.js");

  var el = window.SiteUtils.el;
  var iconSrc = window.SiteUtils.iconSrc;
  var hideOnError = window.SiteUtils.hideOnError;

  // Feather Icons "arrow-down" glyph - used by updateWrapArrows below to
  // mark an arrow that sits at the end of a wrapped row. A plain
  // straight-down arrow on purpose: a rotated border-corner chevron can
  // only make straight 45-degree chevrons and reads as a stray mark, and
  // Feather's bent "corner-down-left" reads as pointing backward/undo
  // because the head's direction is what a reader clocks first. Straight
  // down points the one direction that matters (there's more content
  // below), and the reader's own left-to-right habit already supplies
  // "and it starts from the left".
  var WRAP_ARROW_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>';

  function buildIcon(id) {
    var img = document.createElement("img");
    img.src = iconSrc(SITE_ROOT, "icon-" + id + ".png");
    img.alt = "";
    hideOnError(img, "visibility");
    return img;
  }

  function buildStep(step) {
    if (typeof step === "string") step = { id: step };

    var span = el("span", "skill");
    if (step.situational) span.classList.add("skill-situational");

    if (step.cycleRef != null) {
      span.appendChild(el("span", "cycle-num cycle-num-" + step.cycleRef, String(step.cycleRef)));
      span.appendChild(el("span", "cycle-title", step.title || ""));
    } else if (step.skills && step.skills.length) {
      span.classList.add("skill-multi");
      step.skills.forEach(function (id, i) {
        // Optional per-step "join" text between the skills - defaults to
        // "or". Its own span (not a bare text node) so the chip's flex
        // gap spaces it the same as everything else in the chip.
        if (i > 0) span.appendChild(el("span", "skill-join", step.join || "or"));
        // Each skill is its own .skill-part carrying the data-skill-id,
        // so skill-tooltip.js wires a tooltip per skill (icon AND name
        // are the hover area). The outer .skill chip deliberately gets no
        // data-skill-id: it isn't one skill a single tooltip could
        // describe.
        var part = el("span", "skill-part");
        part.setAttribute("data-skill-id", id);
        part.appendChild(buildIcon(id));
        part.appendChild(document.createTextNode(window.DB_SKILL_NAMES[id] || id));
        span.appendChild(part);
      });
    } else {
      span.appendChild(buildIcon(step.id));
      var name = step.name || window.DB_SKILL_NAMES[step.id] || step.id;
      span.appendChild(document.createTextNode(name));
      // Lets skill-tooltip.js attach a hover/focus/tap tooltip to this
      // chip without having to re-derive the id from anything - single,
      // unambiguous skill per step here (unlike the skills/cycleRef
      // branches above, which don't get this attribute at all: a "pick
      // whichever" multi-skill step or a Cycle pointer isn't one skill a
      // tooltip could describe).
      span.setAttribute("data-skill-id", step.id);
    }

    if (step.situational) {
      // Compact marker instead of spelling the reason out in the chip
      // itself (inline bold text would visibly widen/heighten the chip
      // for "adrenaline/synergy"-length reasons) - just a small "*"
      // glyph (CSS ::before, see extra.css's .skill-situational-tag::before)
      // that reads as "situational" at a glance.
      var tag = el("span", "skill-situational-tag");
      // Purely decorative now (see below for where the actual reason
      // goes) - aria-hidden so a screen reader doesn't announce a bare,
      // context-free "*" on top of the real tooltip content.
      tag.setAttribute("aria-hidden", "true");
      span.appendChild(tag);

      var reason = typeof step.situational === "string"
        ? step.situational.replace(/\*\*(.+?)\*\*/g, "$1")
        : "Situational";

      if (step.cycleRef != null) {
        // cycleRef pseudo-steps have no data-skill-id anywhere on the
        // chip (they point at a Cycle card, not a real skill), so there's
        // no skill-tooltip.js trigger already covering this element for
        // attachRotationSkill (below) to fold a reason into. Nothing else
        // is wired here either, so a plain native `title` is safe in this
        // one case - unlike the branches below, it can't end up stacked
        // on top of a second, different tooltip.
        tag.title = reason;
        tag.setAttribute("aria-label", reason);
      } else {
        // Every other step already gets its own skill-tooltip.js hover/
        // focus/tap tooltip (attachRotationSkill, wired to data-skill-id
        // on `span` for a plain step, or on each .skill-part below for a
        // "skills" multi-step) covering this whole chip. A second,
        // separate native `title` on the marker would mean hovering
        // the "*" itself pops a plain browser tooltip stacked on top
        // of that already-open custom one - two tooltips in one chip.
        // Stashing the reason here instead lets attachRotationSkill fold
        // it into that SAME tooltip via buildTip's opts.extra (the exact
        // mechanism gem-priority.js's per-gem "tip" field already uses
        // for its own bottom "here's why" line) - one tooltip, reason
        // included, and it's what aria-hidden above is relying on: the
        // reason still reaches screen readers, just as part of that
        // tooltip's aria-describedby'd content instead of a dangling
        // title on a decoration-only glyph.
        //
        // Assumes the id (or, for "skills" below, at least one of them)
        // actually resolves in DB_SKILL_DATA/DB_SKILL_EXTRAS - true for
        // every situational id in use today. An id with no tooltip data
        // at all wires no tooltip (attachRotationSkill returns early,
        // same "fail quietly" rule every lookup on this site follows),
        // so the reason wouldn't surface anywhere - worth remembering
        // here specifically since that means missing data, not just a
        // missing icon/name.
        var prefixedReason = reason === "Situational" ? reason : "Situational - " + reason;
        if (step.skills && step.skills.length) {
          span.querySelectorAll(".skill-part").forEach(function (part) {
            part.setAttribute("data-situational-reason", prefixedReason);
          });
          // Unlike the single-skill branch below, `tag` here is a SIBLING
          // of the .skill-part triggers above, not nested inside either
          // one - each skill in a "skills" step gets its OWN separate
          // hover/focus/tap target (attachRotationSkill is wired to
          // ".rotation-line .skill-part[data-skill-id]" specifically, see
          // skill-tooltip.js), and the tag sits outside both of them in
          // the DOM. So hovering the "*" glyph itself isn't "inside"
          // either skill's trigger and did nothing on its own. Fixed by
          // stashing the text as a data attribute and letting
          // skill-tooltip.js's own attachDataTip wire it into a real
          // hover/focus/tap tooltip (not a native `title`) - the same
          // mechanism the hand-authored .cycle-repeat-badge tips in
          // 111-classic.md already ride on - consistent
          // with every other tooltip on the site, and reachable by
          // keyboard/touch the way a native title isn't. This is IN
          // ADDITION TO (not instead of) folding the reason into each
          // skill's own tooltip just above - whichever the reader
          // actually hovers, the glyph or either skill, now surfaces it.
          tag.removeAttribute("aria-hidden");
          tag.setAttribute("data-standalone-tip", prefixedReason);
        } else {
          span.setAttribute("data-situational-reason", prefixedReason);
        }
      }
    }

    return span;
  }

  function buildArrow(swap) {
    var span = el("span", swap ? "arrow arrow-swap" : "arrow");
    span.textContent = " \u2192 ";
    // data-standalone-tip (not a native title) so skill-tooltip.js wires the
    // same hover / focus / tap tooltip every other rotation hint uses; a title
    // never shows on a touch screen.
    if (swap) span.setAttribute("data-standalone-tip", "Order interchangeable");
    return span;
  }

  // Toggles a "this arrow sits at the end of a wrapped row" state
  // (.arrow-wrap, see extra.css) on every plain .arrow in `line`, based
  // on the ACTUAL rendered layout rather than anything authored in the
  // step data - there's nothing for a build page's JSON to set here,
  // unlike swapNext above.
  //
  // Rationale for why this needs live measurement instead of being
  // computed once at render time: wrap position depends on the
  // container's real rendered width (sidebar/TOC toggling, window
  // resize, a webfont swap changing chip widths), same "react to the
  // container's own width" instinct as the rest of this project's
  // width-dependent components - see project-context.md's CONVENTIONS
  // section. It's called once synchronously right after building the
  // line (below), then again by the ResizeObserver whenever the line's
  // own box actually resizes, and once more after webfonts finish
  // loading (see the fonts.ready hook below) to catch the one case a
  // resize alone can't: the row count staying the same while the split
  // point silently shifts from one arrow to the next because chip
  // widths changed slightly.
  //
  // Deliberately skips .arrow-swap: that glyph already carries its own
  // "order interchangeable" meaning, and stacking a second meaning onto
  // the same two-headed shape would read as neither. If a swap arrow
  // happens to land at a wrap point, it's left as-is - a known, accepted
  // gap rather than an oversight.
  function updateWrapArrows(line) {
    var kids = Array.prototype.filter.call(line.children, function (child) {
      return child.tagName !== "SCRIPT";
    });
    if (kids.length < 2) return;

    var TOLERANCE = 2; // px - guards against subpixel offsetTop jitter within one row
    for (var i = 0; i < kids.length; i++) {
      var kid = kids[i];
      if (!kid.classList.contains("arrow") || kid.classList.contains("arrow-swap")) continue;
      var next = kids[i + 1];
      // If `next` wrapped down TOGETHER with this arrow (both moved to
      // the new row as a unit, because the arrow itself didn't fit on
      // the row above), their offsetTops match and this arrow correctly
      // stays a plain forward chevron - it isn't sitting at a row's end,
      // it's sitting at the next row's start like any other mid-row
      // arrow. Only a `next` that's alone on the row below (this arrow
      // stayed up top) counts as a real wrap point.
      var wraps = !!next && next.offsetTop > kid.offsetTop + TOLERANCE;
      kid.classList.toggle("arrow-wrap", wraps);
      if (wraps) {
        kid.title = "Continues below";
        // Idempotent: only add the icon if it isn't already there (this
        // runs on every resize, not just once).
        if (!kid.querySelector(".arrow-wrap-icon")) {
          var icon = el("span", "arrow-wrap-icon");
          icon.innerHTML = WRAP_ARROW_ICON;
          kid.appendChild(icon);
        }
      } else {
        if (kid.title === "Continues below") kid.removeAttribute("title");
        var existingIcon = kid.querySelector(".arrow-wrap-icon");
        if (existingIcon) existingIcon.remove();
      }
    }
  }

  // One shared observer (rather than one per line, cheaper for pages
  // with several rotation-lines) watching every line's own box for the
  // width changes that can move a wrap point - the offsetTop reads in
  // updateWrapArrows above force a layout, so this only re-measures on
  // an actual resize, never on a timer.
  var wrapObserver = window.ResizeObserver
    ? new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          updateWrapArrows(entry.target);
        });
      })
    : null;

  // Every navigation (including the very first - document$ re-emits then
  // too, see registerRenderer's own doc comment) needs this observer's
  // slate wiped first: the OLD page's .rotation-line elements are about
  // to be discarded by Material's instant-nav swap, and leaving them
  // observed forever is the same accumulating-ResizeObserver leak
  // skill-setup.js's masonry comment warns about, just spread across one
  // shared instance instead of one created per widget per visit.
  // Subscribing here, before this file's own registerRenderer() call
  // below makes its own document$ subscription, means this disconnect
  // always runs first on a given navigation; the renderLine calls that
  // follow re-observe only the new page's still-live lines.
  if (wrapObserver && window.document$) {
    document$.subscribe(function () {
      wrapObserver.disconnect();
    });
  }

  // See updateWrapArrows's own comment above for why a resize-only
  // trigger isn't quite enough on its own.
  if (window.document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      document.querySelectorAll(".rotation-line").forEach(updateWrapArrows);
    });
  }

  function buildStageTag(text) {
    // Small pill for a leading { "stageLabel": ... } pseudo-step - see the
    // EASY EDIT GUIDE above and extra.css's .stage-tag comment. Deliberately
    // NOT a .skill (no icon, no data-skill-id, not counted by
    // rotation-practice.js's getSteps/.skill selector) - it's a label, not
    // a drillable step.
    var span = el("span", "stage-tag", text);
    return span;
  }

  function renderLine(line) {
    // Peek at the raw script text ourselves, before handing off to
    // SiteUtils.readInlineJSON, purely so we can skip re-parsing (and
    // more importantly, skip the DOM teardown/rebuild below) when
    // nothing's actually changed. document$ can (and does, even on a
    // plain page load with zero navigation - verified via
    // instrumentation) emit several times in quick succession, and the
    // MutationObserver layer piles on top of that. Without this guard
    // every extra emission means a pointless full teardown-and-rebuild
    // of every rotation-line on the page - wasteful, and a window
    // (however brief) where the line has no .skill/.arrow children at
    // all.
    var peekScript = line.querySelector("script");
    if (peekScript && line._rotationRawData === peekScript.textContent) return;

    var result = window.SiteUtils.readInlineJSON(line, "rotation-line.js");
    if (!result) return; // handwritten/legacy markup, invalid JSON, or no data - leave it alone
    var scriptEl = result.script;
    var raw = result.raw;
    var data = result.data;

    // A leading `{ "stageLabel": "..." }` marker (an object with ONLY a
    // "stageLabel" key - real steps always have id/skills/cycleRef) is a
    // small tag, not a step - stripped the same way the trailing "suffix"
    // marker below is, just from the front instead of the back.
    var steps = data.slice();
    var stageLabel = null;
    var first = steps[0];
    if (
      first && typeof first === "object" && !Array.isArray(first) &&
      "stageLabel" in first && !("id" in first) && !("skills" in first) && !("cycleRef" in first)
    ) {
      stageLabel = first.stageLabel;
      steps.shift();
    }

    // A trailing `{ "suffix": "..." }` marker (an object with ONLY a
    // "suffix" key - real steps always have id/skills/cycleRef) carries
    // text after the last arrow instead of being a step. See EASY EDIT
    // GUIDE above for why this can't just be a top-level {steps, suffix}
    // object instead.
    var suffix = null;
    var last = steps[steps.length - 1];
    if (
      last && typeof last === "object" && !Array.isArray(last) &&
      "suffix" in last && !("id" in last) && !("skills" in last) && !("cycleRef" in last)
    ) {
      suffix = last.suffix;
      steps.pop();
    }

    // Idempotent rebuild (safe to call again on the same line, matching
    // skill-setup.js's convention) - only ever remove nodes THIS function
    // built, never the <script> the data lives in.
    Array.prototype.slice.call(line.children).forEach(function (child) {
      if (child !== scriptEl) child.remove();
    });

    var frag = document.createDocumentFragment();
    if (stageLabel) frag.appendChild(buildStageTag(stageLabel));
    steps.forEach(function (step, i) {
      if (i > 0) {
        var prev = steps[i - 1];
        var swap = prev && typeof prev === "object" && prev.swapNext === true;
        frag.appendChild(buildArrow(swap));
      }
      frag.appendChild(buildStep(step));
    });
    if (suffix) {
      frag.appendChild(buildArrow());
      var suffixSpan = el("span", "rotation-suffix");
      suffixSpan.textContent = suffix;
      frag.appendChild(suffixSpan);
    }
    line.appendChild(frag);
    line._rotationRawData = raw;

    updateWrapArrows(line);
    if (wrapObserver) wrapObserver.observe(line);
  }

  window.SiteUtils.registerRenderer(".rotation-line", renderLine);
})();
