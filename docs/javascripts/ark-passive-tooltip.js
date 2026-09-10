// FORK GUIDE: ENGINE - reusable as-is for any class. Renders whatever's in
// ap-node-effects.js (window.DB_AP_NODE_EFFECTS); no code changes needed
// here, just point that at your own data.
//
// Adds a hover/focus/tap tooltip to each Ark Passive node ark-passive-
// tree.js renders, describing what that node's invested level actually
// does - reusing skill-tooltip.js's body-fixed positioning/show-hide
// engine via window.SkillTooltip.wireCustom (same panel visual language
// as .skill-inline mentions and rotation chips) rather than duplicating
// that hover/focus/tap-toggle/viewport-clamping logic a second time.
// ark-core-badge.js's own tooltip (CSS :hover-driven, anchored inside the
// trigger) was the other option - not reused here since its content shape
// (a fixed 10P/14P/17P/18P/19P/20P breakpoint list) doesn't fit a node's
// variable level count (1-5 for most nodes, a flat/no-level text for a
// handful of 1P Evolution keystones).
//
// Deliberately does NOT touch ark-passive-calculator.js's own separate
// native-tooltip system (its own Ark Passive keystone comparison grid) -
// out of scope, has nothing to do with the tree widget this attaches to.
//
// Only shows the node's CURRENTLY INVESTED level's effect text, matching
// the real in-game tooltip (e.g. a Lv.10 Crit node's tooltip just says
// "Crit +500", not every level from 1 to 30) - not a list of every level
// like an early version of this file did. A node whose entry has a
// `levels` list but no exact match for its own data-level (shouldn't
// happen - see ap-node-effects.js's shape comment) falls back to the
// highest level at or below it, then to the entry's own max level.
//
// EASY EDIT GUIDE: there is nothing to edit here or per-page. Once a
// node's entry.id resolves in both ap-node-names.js (display name/icon)
// AND ap-node-effects.js (effect text), ark-passive-tree.js already
// stamps that id (plus the node's own invested level) onto the rendered
// row as data-ap-id/data-level - this file just finds those and wires a
// tooltip on top. A node with no DB_AP_NODE_EFFECTS entry (data-ap-id
// present but lookup misses) is left as a plain node with no tooltip,
// same "fail quietly" rule as every other widget here.
//
// Must load after ap-node-names.js, ap-node-effects.js, ark-passive-
// tree.js (needs its rendered data-ap-id rows), and skill-tooltip.js
// (needs window.SkillTooltip.wireCustom to exist) - see the
// extra_javascript order in mkdocs.yml.
(function () {
  var el = window.SiteUtils.el;

  // Picks the effect text for whichever level this build actually
  // invested, out of an entry.levels list - not the whole list, see this
  // file's own header comment for why.
  function currentLevelText(levels, currentLevel) {
    var exact = levels.filter(function (lvl) {
      return String(lvl.level) === String(currentLevel);
    })[0];
    if (exact) return exact.text;

    var numLevel = parseInt(currentLevel, 10);
    if (!isNaN(numLevel)) {
      var atOrBelow = levels
        .filter(function (lvl) {
          return lvl.level <= numLevel;
        })
        .sort(function (a, b) {
          return b.level - a.level;
        })[0];
      if (atOrBelow) return atOrBelow.text;
    }

    return levels[levels.length - 1].text;
  }

  // Builds the tooltip panel for one node. Reuses .skill-tip/.skill-tip-
  // title for the same floating-panel chrome and title treatment every
  // other tooltip on the site already has (see skill-tooltip.js's own
  // buildTip) - only the "Ark Passive Lv. N" line and effect text below
  // are specific to a node, styled by extra.css's own "Ark Passive node
  // tooltip" section.
  function buildTip(id, entry, currentLevel) {
    var tip = el("div", "skill-tip md-typeset ap-node-tip");
    tip.setAttribute("role", "tooltip");

    var known = window.DB_AP_NODE_NAMES && window.DB_AP_NODE_NAMES[id];
    tip.appendChild(el("div", "skill-tip-title", (known && known.name) || id));

    if (currentLevel != null) {
      tip.appendChild(el("div", "ap-node-tip-level", "Ark Passive Lv. " + currentLevel));
    }

    var text = entry.text;
    // perPoint nodes scale linearly with no discrete tiers to enumerate,
    // so the real number is computed here from the node's own invested
    // level instead of a giant hardcoded levels list - matches the
    // in-game tooltip showing "Crit +500" at Lv.10, not a generic "+50
    // per point" rate description. Default template is "{name} +{value}."
    // (Crit/Specialization); entry.template overrides it for a node whose
    // scaling number sits inside a longer sentence (Goddess of
    // Blessings) - use a "{value}" token wherever the computed number
    // goes.
    if (!text && entry.perPoint != null && currentLevel != null) {
      var numLevel = parseInt(currentLevel, 10);
      if (!isNaN(numLevel)) {
        var value = entry.perPoint * numLevel;
        text = entry.template ? entry.template.replace("{value}", value) : ((known && known.name) || id) + " +" + value + ".";
      }
    }
    if (!text && entry.levels && entry.levels.length) {
      text = currentLevelText(entry.levels, currentLevel);
    }
    if (text) tip.appendChild(el("p", "skill-tip-note ap-node-tip-text", text));

    if (entry.note) {
      tip.appendChild(el("p", "skill-tip-note ap-node-tip-caveat", entry.note));
    }

    return tip;
  }

  function attachNode(trigger) {
    if (trigger.classList.contains("skill-tip-wired")) return;
    var id = trigger.getAttribute("data-ap-id");
    if (!id) return;
    var entry = window.DB_AP_NODE_EFFECTS && window.DB_AP_NODE_EFFECTS[id];
    if (!entry) return;
    window.SkillTooltip.wireCustom(trigger, buildTip(id, entry, trigger.getAttribute("data-level")));
  }

  window.SiteUtils.registerRenderer(".ark-passive-node[data-ap-id]", attachNode);
})();

