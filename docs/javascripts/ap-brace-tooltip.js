// FORK GUIDE: ENGINE - reusable as-is for any class/site; nothing here is
// Deathblade-specific, it just wires up whichever title="" triggers exist.
//
// Upgrades EVERY plain native title="" tooltip inside the Ark Passive
// Calculator (.ap-calc), CPM Calculator (.cpm-calc), and Bid Calculator
// (.bid-calc) to the same real hover/focus/tap tooltip panel every other
// mention on the site uses - reuses skill-tooltip.js's engine via
// window.SkillTooltip.wireCustom, same as glossary-tooltip.js/
// ark-passive-tooltip.js/rune-tooltip.js all do for their own trigger
// types, rather than a 4th independent hover/focus/tap-toggle/viewport-
// clamping implementation.
//
// Originally this only covered the two dedicated caveat-icon shapes
// (.ap-brace-info-icon's small circled "i", .ap-brace-label-caveat's
// "dmg only" pill) - those still need a real icon since there's no
// surrounding text to hover for them. Widened to a blanket `.ap-calc
// [title]` selector so every OTHER native title in the calculator (field
// labels, checkbox labels, bare inputs - ap-calc-field-label,
// ap-gear-ap-readout-*, ap-bvb-inline-check, ap-calc-pair-check, etc.)
// gets the same upgrade instead of sitting as a plain OS tooltip next to
// icons that already got the real thing. No icon needed for these - the
// existing label/input/checkbox text itself is already a natural hover
// target, so the fix is just swapping the tooltip engine under it, not
// adding new visible markup.
//
// Also covers .cpm-calc and .bid-calc: this is the site's one tooltip
// system, not one local to the Ark Passive Calculator. Bid Calculator's
// Intent chips (.bid-calc-intent's .ap-build-chip buttons - see
// bid-calculator.js) and the CPM Cast rate card's
// .cpm-rate-calc-info-icon (an .ap-brace-info-icon - see
// resources.md/extra.css) use it too. Nothing about attach() below is
// Ark-Passive-specific - it's a generic "wire whatever title exists"
// engine, so the selector is the only thing that scopes it.
//
// No data file/lookup table needed here, unlike those three sibling
// files: the tooltip text isn't looked up by id, it's already sitting in
// each trigger's own title attribute right now (authored directly in
// resources.md for the static fields/icons, or set by
// ark-passive-calculator.js's render functions for the ones it builds per
// data row - row.note on a Bracelet/Accessory-lines table row, or the
// Engraving DPS Contribution table's Adrenaline/Ability Stone/Mana Food
// rows). wireCustom takes an already-built tip element directly, so this
// just reads title, builds the same bare-note tip shape
// glossary-tooltip.js's own buildTip uses (no title row - the trigger
// itself is the anchor, there's no separate term to head it with), wires
// it, and removes the native title so the browser's own tooltip doesn't
// show up alongside the new one.
//
// registerRenderer's usual immediate/document$/MutationObserver triggers
// mean this picks up BOTH everything already in resources.md's static
// markup AND anything the calculator creates later when its inputs change
// and a comparison table re-renders (those tables rebuild their <tr>s
// from scratch on every recompute - see ark-passive-calculator.js's
// renderComparisonRows/renderEngravingComparison) - no manual re-wiring
// call needed on the calculator's end.
//
// A label that wraps its own checkbox/input (ap-calc-pair-check,
// ap-bvb-inline-check) picks up a real focus stop
// here (wire() always adds tabindex="0"), on top of the input's own
// native one - two tab stops instead of one for that control. Deliberate
// trade-off: the alternative (skip wiring anything that already contains
// a focusable child) would silently leave every checkbox-with-caveat back
// on native title, exactly the inconsistency this pass exists to remove.
//
// Inside .ap-calc a label never operates its control: ark-passive-
// calculator.js cancels the default click action of a click on label text,
// so no second, forwarded click reaches the control and the label's tap
// handler fires once per tap like any other trigger. The .cpm-calc and
// .bid-calc labels keep the browser's normal label behaviour, so a label
// there that WRAPS its control needs wireCustom's tapToggle: false (the
// forwarded click would re-enter the label's tap handler and close the
// tooltip the first click just opened) plus wrapsControl: true (the click
// still has to be kept from the document-level "tap outside closes
// everything" listener; the control's focus is what shows the tooltip).
// A for="" label pointing at a SIBLING input never re-enters its own
// handler, so only the wrapping shape outside .ap-calc needs the opt-out.
//
// Several icons/labels authored in resources.md are also conditionally
// [hidden] by enforceBvbLineControls elsewhere (e.g. the Bracelet vs.
// Bracelet cards' Spec Stat notes) - wiring a trigger while it happens to
// be hidden is harmless (nothing to hover), and toggling `hidden` later
// doesn't touch this wiring at all, so those stay compatible.
//
// A handful of these triggers are PERSISTENT elements whose title text
// ark-passive-calculator.js itself updates in place on a later recompute
// rather than recreating the node - the Accessory Comparison's Main Stat
// input (enforceAvbSlotUI, title changes with the Necklace/Earring/Ring
// slot dropdown), the Engraving Comparison's Mana Food select on Surge
// 111/333 (its title swaps between the None, Maelstrom Bleed and Main Stat
// texts with the selected food), and the Bracelet Comparison's Spec Stat icon
// (RE-vs-Surge aside) are the three currently in resources.md. registerRenderer's MutationObserver
// only fires on newly ADDED nodes, so a plain "wire once, strip title"
// would leave the ORIGINAL tip text frozen forever once one of these
// updates its title post-wiring - worse, since the freshly-reapplied
// title attribute is never stripped a second time, the native browser
// tooltip comes back too, sitting stale right alongside the still-wired
// (also now stale) real one. tipByTrigger + the attribute-mutation
// observer below exist purely to keep already-wired triggers in sync
// with their own later title updates - not needed for the fresh-every-
// render nodes (.ap-brace-info-icon/.ap-brace-label-caveat in a rebuilt
// comparison row) since those simply never hit the "already wired"
// branch to begin with.
(function () {
  var el = window.SiteUtils.el;
  var tipByTrigger = new WeakMap();

  function buildTip(text) {
    var tip = el("div", "skill-tip md-typeset");
    tip.setAttribute("role", "tooltip");
    tip.appendChild(el("p", "skill-tip-note", text));
    return tip;
  }

  function attach(trigger) {
    var text = trigger.getAttribute("title");
    if (trigger.classList.contains("skill-tip-wired")) {
      // Not a fresh node - a render pass just reset `title` on an
      // already-wired persistent element (see comment above). Sync the
      // existing tip's text in place instead of re-wiring (wireCustom is
      // a no-op here anyway once skill-tip-wired is set), then strip the
      // reapplied attribute again so the native tooltip doesn't return.
      if (text) {
        var tip = tipByTrigger.get(trigger);
        if (tip) tip.querySelector(".skill-tip-note").textContent = text;
        trigger.removeAttribute("title");
      }
      return;
    }
    if (!text) return;
    var tip = buildTip(text);
    tipByTrigger.set(trigger, tip);
    // See this file's own header comment on which labels need
    // tapToggle: false and wrapsControl: true (see wire()'s own comment on
    // why those are two separate flags).
    var wrapsControl = trigger.tagName === "LABEL" && !trigger.closest(".ap-calc") && !!trigger.querySelector("input, select, textarea");
    window.SkillTooltip.wireCustom(trigger, tip, wrapsControl ? { tapToggle: false, wrapsControl: true } : undefined);
    trigger.removeAttribute("title");
  }

  window.SiteUtils.registerRenderer(".ap-calc [title], .cpm-calc [title], .bid-calc [title]", attach);

  // Belt-and-suspenders half of the sync above: watches for exactly the
  // "title reapplied to an already-wired element" case a recompute can
  // cause. Scoped to the same three calculator roots as the selector
  // above - .cpm-calc/.bid-calc don't currently have any persistent
  // element whose title gets rewritten post-render (unlike .ap-calc's
  // three - see the header comment above), but watching all three costs
  // nothing and means a future one doesn't silently need this touched
  // again.
  function watchTitleUpdates() {
    if (!window.MutationObserver) return;
    ["ap-calc", "cpm-calc", "bid-calc"].forEach(function (cls) {
      var root = document.querySelector("." + cls);
      if (!root) return;
      new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.attributeName === "title" && m.target.getAttribute("title")) {
            attach(m.target);
          }
        });
      }).observe(root, { attributes: true, attributeFilter: ["title"], subtree: true });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchTitleUpdates);
  } else {
    watchTitleUpdates();
  }
})();
