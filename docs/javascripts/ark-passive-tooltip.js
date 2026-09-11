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
// Also attaches to bare prose mentions of a node outside the tree widget
// entirely (e.g. a Quick Tips line like "Optimized Training 1 helps at
// low investment") via `.skill-mention[data-ap-id]` - same markup/CSS as
// skill-tooltip.js's own `.skill-mention[data-skill-id]` bare-prose
// mentions (see that file and extra.css's "Bare prose mentions with no
// chip/icon at all" section), just keyed by data-ap-id/data-level instead
// of data-skill-id so the two never collide on the same span. `data-level`
// is optional: give it to show just that level (author it by hand to
// match whatever level the prose is actually talking about, e.g.
// `<span class="skill-mention" data-ap-id="optimizedtraining"
// data-level="1">Optimized Training 1</span>`); omit it entirely for a
// mention with no single level in mind ("raise Illicit Spell instead of
// Limit Break") to show every level the node has instead of guessing one -
// see buildAllLevelsTip below. Only works for a node whose entry has a
// `levels` list to enumerate; a perPoint node (Crit, Specialization) has
// no discrete levels to list at all, so a bare mention of one of those
// still renders with no tooltip - there's nothing false to show, but
// nothing true to show either without a specific level.
//
// EASY EDIT GUIDE: nothing to edit here for the tree widget itself. Once a
// node's entry.id resolves in both ap-node-names.js (display name/icon)
// AND ap-node-effects.js (effect text), ark-passive-tree.js already
// stamps that id (plus the node's own invested level) onto the rendered
// row as data-ap-id/data-level - this file just finds those and wires a
// tooltip on top. A node with no DB_AP_NODE_EFFECTS entry (data-ap-id
// present but lookup misses) is left as a plain node/mention with no
// tooltip, same "fail quietly" rule as every other widget here. For a new
// bare prose mention, just add the `.skill-mention[data-ap-id]` span by
// hand as shown above - no JS changes needed.
//
// Must load after ap-node-names.js, ap-node-effects.js, ark-passive-
// tree.js (needs its rendered data-ap-id rows), and skill-tooltip.js
// (needs window.SkillTooltip.wireCustom to exist) - see the
// extra_javascript order in mkdocs.yml.
(function () {
  var el = window.SiteUtils.el;
  var SITE_ROOT = window.SiteUtils.detectSiteRoot("ark-passive-tooltip.js");

  // EXPERIMENT: shared header-row builder (icon + title), same markup/
  // classes as skill-tooltip.js's own buildTip so it picks up the exact
  // same .skill-tip-header/.skill-tip-icon CSS - a node's icon path is
  // already known outright (DB_AP_NODE_NAMES[id].icon, e.g.
  // "ap-icons/crit.png"), unlike a skill id's icon-<id>.png guess, so
  // this resolves it directly instead of re-deriving a filename.
  function buildHeader(name, iconRelPath) {
    var header = el("div", "skill-tip-header");
    if (iconRelPath) {
      var icon = document.createElement("img");
      icon.className = "skill-tip-icon";
      icon.src = window.SiteUtils.iconSrc(SITE_ROOT, iconRelPath);
      icon.alt = "";
      icon.loading = "lazy";
      window.SiteUtils.hideOnError(icon, "display");
      header.appendChild(icon);
    }
    header.appendChild(el("div", "skill-tip-title", name));
    return header;
  }

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
    tip.appendChild(buildHeader((known && known.name) || id, known && known.icon));

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

  // Fallback for a `.skill-mention[data-ap-id]` with no data-level - lists
  // every level in entry.levels instead of guessing one, same reasoning
  // as rune-tooltip.js's buildAllTiersTip (see that file's own comment):
  // each level keeps its own real effect text rather than an auto-merged
  // number, since some nodes change more than one number per level
  // (Illicit Spell's Evolution-Type Damage AND MP Cost both step per
  // level) and there's no safe generic way to tell which nodes are simple
  // enough to squash into one line and which aren't. Only called for
  // nodes that actually have a `levels` list (see attachNode) - a
  // perPoint node has nothing discrete to enumerate here.
  function buildAllLevelsTip(id, entry) {
    var tip = el("div", "skill-tip md-typeset ap-node-tip");
    tip.setAttribute("role", "tooltip");

    var known = window.DB_AP_NODE_NAMES && window.DB_AP_NODE_NAMES[id];
    tip.appendChild(buildHeader((known && known.name) || id, known && known.icon));

    entry.levels.forEach(function (lvl) {
      var row = el("div", "skill-tip-all-row");
      row.appendChild(el("div", "ap-node-tip-level", "Ark Passive Lv. " + lvl.level));
      row.appendChild(el("p", "skill-tip-note ap-node-tip-text", lvl.text));
      tip.appendChild(row);
    });

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
    var currentLevel = trigger.getAttribute("data-level");
    // Only a genuinely leveled node (entry.levels) with no level given at
    // all gets the all-levels fallback - a flat-text node (Master,
    // Pulverize, Critical) or a perPoint node (Crit, Specialization) has
    // no data-level on the real tree widget either (see ark-passive-
    // tree.js's own note on that), so it must keep falling through to the
    // normal buildTip below exactly as before, not get diverted here.
    if (currentLevel == null && entry.levels && entry.levels.length) {
      window.SkillTooltip.wireCustom(trigger, buildAllLevelsTip(id, entry));
      return;
    }
    window.SkillTooltip.wireCustom(trigger, buildTip(id, entry, currentLevel));
  }

  window.SiteUtils.registerRenderer(".ark-passive-node[data-ap-id], .skill-mention[data-ap-id]", attachNode);
})();

