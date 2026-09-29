// FORK GUIDE: INFRA - generic site plumbing, no class-specific content.
// Keep as-is.
//
// Small shared DOM helpers used by the native widget scripts
// (ark-core-badge.js, ark-passive-tree.js, essentials-table.js,
// skill-setup.js, dps-chart.js, etc).
//
// Must load FIRST in extra_javascript - see mkdocs.yml.
//
// Kept intentionally tiny: this is not a framework, just the small
// helpers every widget file needs. If a bug shows up in one of these
// (e.g. the masonry ResizeObserver leak), fix it here once instead of
// in every widget.
//
// ---------------------------------------------------------------------
// CONVENTION: inline <script type="application/json"> data blocks
// ---------------------------------------------------------------------
// Any widget that renders from a per-page inline
// `<script type="application/json">...</script>` blob (skill-setup.js,
// ark-passive-tree.js, ark-core-badge.js, essentials-table.js,
// rotation-line.js are the current examples) MUST follow both rules
// below. Both were learned the hard way - skipping either one only
// breaks after a real in-app nav (SPA-style Material "instant
// navigation"), never on a hard/direct page load, which is why it's
// easy to ship and not notice.
//
// Root cause: on every instant-nav swap, mkdocs-material recreates
// each <script> it finds in the newly-injected content (createElement
// + replaceWith) so it re-executes - see
// integrations/instant/index.ts's inject(). For a script with no src,
// it only copies textContent, never the other attributes, so
// type="application/json" silently gets dropped. The browser then
// treats the recreated tag as default text/javascript and actually
// tries to RUN the JSON as JS.
//
// 1. Select the script by tag, never by [type="application/json"]:
//      var script = container.querySelector("script");   // correct
//      var script = container.querySelector('script[type="application/json"]'); // WRONG - matches nothing post-nav, widget silently no-ops
//
// 2. The JSON payload's root MUST be an array, never an object:
//      [ { "...": "..." }, { "...": "..." } ]              // correct
//      { "columns": [ ... ] }                               // WRONG - a bare `{` at the start of a script body parses as a JS
//                                                            //         block statement, not an object literal; the first
//                                                            //         "key": value pair throws "Unexpected token ':'" and
//                                                            //         crashes the recreated script outright (not just a
//                                                            //         no-op - this one throws on every nav to the page).
//    If the data naturally has multiple top-level fields (e.g. a list
//    plus a trailing "suffix" string), don't wrap it in an object -
//    append a trailing marker entry to the array instead, e.g.
//    [ ...items, { "suffix": "etc." } ], and have the render code
//    treat the last element specially. See rotation-line.js.
//
// A widget can get rule 1 right and still crash if it gets rule 2
// wrong (object root throws regardless of selector), and can get rule
// 2 right and still silently break if it gets rule 1 wrong (array
// root won't throw, but a [type=...] selector still won't find the
// recreated tag) - both are required, independently.
//
// Verify any change to one of these blocks with a REAL in-app
// navigation (Playwright click on a sidebar link, not just a direct
// page load) - a direct/hard load goes through the browser's native
// HTML parser, which respects the original type attribute and never
// executes it, so it can't reproduce this class of bug at all.
//
// In practice you don't need to hand-apply either rule: SiteUtils.
// readInlineJSON() below always selects by bare tag and always
// requires an array root unless you opt out, and SiteUtils.
// registerRenderer() below handles re-running your render function
// at the right times. Following those two helpers gets both rules for
// free - this section stays as the record of WHY they're built the
// way they are.
//
// ---------------------------------------------------------------------
// CONVENTION: rendering a container from that JSON, on every nav
// ---------------------------------------------------------------------
// Every widget in the list above also needs to re-render on all three
// of: a direct/hard page load, a Material instant-nav swap, and (belt-
// and-suspenders) the moment its container is inserted by anything
// else. Getting the timing "right" for just one of those isn't safe to
// assume - a wrong assumption here means the whole section silently
// never renders until a manual reload, no visible error. Rather than
// re-deriving that trigger wiring in every new widget, call
// SiteUtils.registerRenderer() once per widget instead - see its doc comment below for usage. Your
// renderContainer function just needs to be idempotent (safe to call
// again on a container it already rendered), same as every existing
// widget's already is.

(function () {
  window.SiteUtils = {
    // Clamp a number input's value to [min, max] on blur, reformatting it
    // and re-running the caller's update function if the raw value needed
    // clamping. Shared by cpm-calculator.js and bid-calculator.js: both
    // want the same "catch fat-finger/pasted-garbage entries on blur
    // rather than block typing mid-keystroke" guardrail, just with
    // different formatting needs.
    //
    // parse:  function(rawString) -> number. Defaults to parseFloat.
    //         Pass bid-calculator's comma-aware parseNumber here for
    //         formatted/thousands-separator fields.
    // format: function(clampedNumber) -> string to write back into the
    //         input. Defaults to String(n). Pass e.g.
    //         (n) => n.toFixed(decimals) or (n) => n.toLocaleString("en-US").
    // onClamp: called (with no args) only when clamping actually changed
    //          the value - the caller's own re-render/update hook.
    // emptyValue: OPT-IN, omitted by default. When the field is empty or
    //         the browser couldn't parse it as a number at all (e.g. a
    //         pasted letter), the base behavior (no emptyValue given) is
    //         to leave the field alone - correct for CPM/bid-calculator's
    //         fields, which have no universally-right fallback number and
    //         intentionally show their own "-"/empty result state instead
    //         of silently assuming a value the reader never entered. Pass
    //         emptyValue (a number, or a function returning one - e.g.
    //         () => input.defaultValue) for fields where blank truly
    //         means broken rather than "not entered yet", e.g. one of
    //         many inputs feeding an always-on live total that has to
    //         show SOME number - see ark-passive-calculator.js's Gearing
    //         fields for that case.
    clampOnBlur: function (input, min, max, onClamp, opts) {
      if (!input) return;
      opts = opts || {};
      var parse = opts.parse || parseFloat;
      var format = opts.format || function (n) { return String(n); };
      input.addEventListener("blur", function () {
        var raw = parse(input.value);
        if (!isFinite(raw)) {
          if (opts.emptyValue === undefined) return; // no fallback configured - caller's own render already shows a placeholder
          var fallback = typeof opts.emptyValue === "function" ? opts.emptyValue() : opts.emptyValue;
          input.value = fallback;
          if (onClamp) onClamp();
          return;
        }
        var clamped = Math.min(max, Math.max(min, raw));
        if (clamped !== raw) {
          input.value = format(clamped);
          if (onClamp) onClamp();
        }
      });
    },

    // A number input with step="1" (e.g. any "Uptime %" field: whole-
    // percent arrow nudges are the common case) still lets a reader type
    // an exact decimal like 75.83 - the browser just marks the field
    // :invalid, it doesn't reject the keystrokes. The problem is the
    // arrow keys: per the HTML5 stepUp/stepDown algorithm, a value that
    // isn't already sitting on a step boundary gets SNAPPED to the
    // nearest one on the first arrow press instead of stepped from where
    // it actually is - so pressing Up on 75.83 silently becomes 76, not
    // 76.83, and the typed decimal is gone. This intercepts ArrowUp/
    // ArrowDown ourselves and adds/subtracts exactly `step` from whatever
    // is actually in the field, decimals included, instead of letting
    // the browser's native snap-then-round run.
    // NOTE: this only covers the keyboard arrows. The tiny native
    // mouse-click spin buttons live inside the browser's own shadow DOM
    // with no exposed hook to intercept - a mouse click on those will
    // still snap to a whole number. If that also needs covering, the
    // only reliable fix is replacing the native spinner with a custom
    // one (hide it via CSS, draw two small buttons wired to this same
    // increment logic) - ask if that's wanted, it's a bigger change.
    bindDecimalPreservingArrowKeys: function (input, step) {
      if (!input) return;
      step = step || 1;
      input.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        var min = input.min !== "" ? parseFloat(input.min) : -Infinity;
        var max = input.max !== "" ? parseFloat(input.max) : Infinity;
        var current = parseFloat(input.value);
        if (!isFinite(current)) current = 0;
        var delta = e.key === "ArrowUp" ? step : -step;
        // Round to 2dp to dodge float drift (e.g. 75.83 + 1 becoming
        // 76.83000000000001) without truncating a genuine 2-decimal value.
        var next = Math.round((current + delta) * 100) / 100;
        next = Math.min(max, Math.max(min, next));
        input.value = next;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    },

    // Copy text to the clipboard, with a textarea/execCommand fallback for
    // contexts where navigator.clipboard is unavailable (older WebViews,
    // non-HTTPS). Was duplicated in bid-calculator.js (with the fallback)
    // and ark-passive-calculator.js (without it, so its copy button
    // silently did nothing on those contexts) - centralized here so both
    // widgets get the same, more robust behavior.
    copyToClipboard: function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      var temp = document.createElement("textarea");
      temp.value = text;
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.select();
      try {
        document.execCommand("copy");
      } catch (e) {
        /* nothing more we can do - the caller's own catch handles feedback */
      }
      document.body.removeChild(temp);
      return Promise.resolve();
    },

    // Create an element, optionally set its className and textContent.
    el: function (tag, className, text) {
      var e = document.createElement(tag);
      if (className) e.className = className;
      if (text != null) e.textContent = text;
      return e;
    },

    // Create an SVG element in the correct namespace and set its
    // attributes. Shared by pentagon-badge.js and build-compare.js.
    svgEl: function (tag, attrs) {
      var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) el.setAttribute(key, attrs[key]);
      }
      return el;
    },

    // Convert a (center, angle, radius) polar coordinate into an [x, y]
    // pixel pair, angle measured clockwise from straight up (matches how
    // pentagon-badge.js/build-compare.js lay out their 5 axes starting
    // at the top).
    pentagonPoint: function (cx, cy, angleDeg, r) {
      var a = (angleDeg * Math.PI) / 180;
      return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
    },

    // Turn an array of [x, y] pairs (e.g. from pentagonPoint above) into
    // an SVG points="..." attribute string.
    pentagonPointsToAttr: function (pts) {
      return pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
    },

    // Shared radar-chart geometry and drawing for pentagon-badge.js (one
    // build) and build-compare.js (two builds overlaid). Both draw the
    // same 200x190 viewBox with the same grid rings, spokes and axis
    // labels and differ only in the data polygons drawn on top, so
    // everything except those polygons lives here.
    radar: {
      VIEWBOX: "0 0 200 190",
      CX: 100,
      CY: 98,
      R_MAX: 60,

      // n axes evenly spaced, starting at the top, in degrees.
      angles: function (n) {
        var out = [];
        for (var i = 0; i < n; i++) out.push((360 / n) * i);
        return out;
      },

      // Grid rings (33%, 66%, 100%) plus one spoke per axis.
      drawGrid: function (svg, angles) {
        var U = window.SiteUtils, R = U.radar;
        [0.33, 0.66, 1.0].forEach(function (frac, i) {
          var pts = angles.map(function (a) { return U.pentagonPoint(R.CX, R.CY, a, R.R_MAX * frac); });
          svg.appendChild(
            U.svgEl("polygon", {
              points: U.pentagonPointsToAttr(pts),
              class: "pentagon-ring" + (i === 2 ? " pentagon-ring-outer" : ""),
            })
          );
        });
        angles.forEach(function (a) {
          var p = U.pentagonPoint(R.CX, R.CY, a, R.R_MAX);
          svg.appendChild(U.svgEl("line", { x1: R.CX, y1: R.CY, x2: p[0].toFixed(1), y2: p[1].toFixed(1), class: "pentagon-spoke" }));
        });
      },

      // [x, y] vertices for a 0-10 value per axis (clamped to that range).
      dataPoints: function (angles, values) {
        var U = window.SiteUtils, R = U.radar;
        return angles.map(function (a, i) {
          var v = Math.max(0, Math.min(10, values[i]));
          return U.pentagonPoint(R.CX, R.CY, a, R.R_MAX * (v / 10));
        });
      },

      // One <text> per axis just outside the outer ring. decorate(textEl,
      // i) is optional and runs before the text is appended, e.g. to add
      // a <title> tooltip.
      drawLabels: function (svg, angles, labels, decorate) {
        var U = window.SiteUtils, R = U.radar;
        angles.forEach(function (a, i) {
          var p = U.pentagonPoint(R.CX, R.CY, a, R.R_MAX + 15);
          var x = p[0], y = p[1];
          var anchor = "middle";
          if (Math.abs(x - R.CX) >= 3) anchor = x < R.CX ? "end" : "start";
          var dy = 0;
          if (a === 0) dy = -2;
          else if (a === 180 || (a >= 126 && a <= 234)) dy = 4;
          var text = U.svgEl("text", {
            x: x.toFixed(1),
            y: (y + dy).toFixed(1),
            "text-anchor": anchor,
            class: "pentagon-label",
          });
          text.textContent = labels[i];
          if (decorate) decorate(text, i);
          svg.appendChild(text);
        });
      },
    },

    // Round a 0-10 pentagon stat to at most 1 decimal, dropping a
    // trailing ".0" so whole numbers read as "8" instead of "8.0".
    formatStat: function (n) {
      var r = Math.round(n * 10) / 10;
      return r % 1 === 0 ? r.toFixed(0) : r.toFixed(1);
    },

    // Same rounding rule as formatStat above, with a trailing "%" - e.g.
    // 34 -> "34%", 33.5 -> "33.5%". Used by dps-chart.js and
    // gem-dps-tooltip.js.
    formatPct: function (n) {
      return window.SiteUtils.formatStat(n) + "%";
    },

    // Resolves a ".dps-chart" element's per-row labels. data-labels is
    // an OPTIONAL override - every row's label on this site is 100%
    // identical to DB_SKILL_NAMES[id] (skill-names.js), so when
    // data-labels is omitted, every label is derived from `ids`
    // (data-ids) instead, the same "id-only, name auto-resolves"
    // pattern as gem-priority.js/skill-setup.js/rotation-line.js.
    // data-labels stays available as a whole-attribute escape hatch for
    // a genuine future one-off id with no name-table entry - add the
    // id to DB_SKILL_NAMES instead unless it's truly not worth a
    // shared table entry.
    //
    // ids is the already-parsed data-ids array (or null if that
    // attribute is missing/empty) - pass the same one you use
    // everywhere else so this doesn't reparse it. Returns null if
    // data-labels is absent AND ids is null, since there's then
    // nothing to derive labels from at all.
    //
    // Centralized here because dps-chart.js (rendering the bars) and
    // gem-dps-tooltip.js (matching gem cards to a damage-share %) both
    // need this SAME chart's SAME resolved labels list - two separate
    // copies of this logic could silently drift (e.g. one updated to
    // treat an empty data-labels differently than the other), quietly
    // breaking one of the two without the other showing any symptom.
    resolveChartLabels: function (chart, ids) {
      var labelsAttr = chart.getAttribute("data-labels");
      if (labelsAttr) {
        return labelsAttr.split(",").map(function (s) { return s.trim(); });
      }
      if (!ids) return null;
      return ids.map(function (id) {
        return (window.DB_SKILL_NAMES && window.DB_SKILL_NAMES[id]) || id;
      });
    },

    // Parses a ".dps-chart" element's parallel data-values / data-ids /
    // data-labels into { values, ids, labels }. Returns null when the
    // data is malformed (no values, non-numeric values, or a values/
    // labels length mismatch) so callers fail quietly instead of drawing
    // a broken chart. ids is null when data-ids is absent or its length
    // doesn't match, rather than half-applied. Shared by dps-chart.js
    // (rendering) and gem-dps-tooltip.js (damage-share lookup) so the two
    // always agree on what a chart contains.
    parseChartData: function (chart) {
      var values = (chart.getAttribute("data-values") || "")
        .split(",")
        .map(function (s) { return parseFloat(s.trim()); });
      var idsAttr = chart.getAttribute("data-ids");
      var ids = idsAttr
        ? idsAttr.split(",").map(function (s) { return s.trim(); })
        : null;
      var labels = window.SiteUtils.resolveChartLabels(chart, ids) || [];
      if (!values.length || values.length !== labels.length || values.some(isNaN)) return null;
      if (ids && ids.length !== labels.length) ids = null;
      return { values: values, ids: ids, labels: labels };
    },

    // Hide a broken/missing icon <img> instead of showing the browser's
    // default alt-text placeholder. mode "visibility" (default) keeps the
    // icon's layout box in place; mode "display" collapses it entirely.
    hideOnError: function (img, mode) {
      img.addEventListener("error", function () {
        if (mode === "display") {
          img.style.display = "none";
        } else {
          img.style.visibility = "hidden";
        }
      });
    },

    // Resolve an icon's real URL. Every icon (skills, consumables, Ark
    // Passive nodes) lives under assets/shared/ regardless of which
    // build family (RE/Surge) uses it - relIcon is the path under that
    // folder, e.g. "icon-surge.png" or "ap-icons/critical.png". Just a
    // path join: genuinely family-specific page media (tldr screenshots,
    // memes) lives flat under assets/, not here.
    iconSrc: function (siteRoot, relIcon) {
      return siteRoot + "assets/shared/" + relIcon;
    },

    // Coalesce repeated calls into at most one requestAnimationFrame-timed
    // invocation of fn. Returns a schedule() function - call it as often
    // as you like (resize events, ResizeObserver callbacks, input events
    // during a drag, ...) and fn runs at most once per animation frame,
    // with no arguments.
    rafSchedule: function (fn) {
      var scheduled = false;
      return function () {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(function () {
          scheduled = false;
          fn();
        });
      };
    },

    // Find a JSON-data-driven widget's site root, e.g. for building an
    // absolute icon URL. jsFileName is this script's own filename
    // (e.g. "gem-priority.js") - used only to find <script src="...">
    // if document.currentScript isn't available (it never is inside an
    // instant-nav re-render, only on the real initial page-load
    // execution of this file).
    detectSiteRoot: function (jsFileName) {
      var escaped = jsFileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var suffixRe = new RegExp("javascripts/" + escaped + "(\\?.*)?(#.*)?$");
      var scriptEl = document.currentScript || document.querySelector('script[src*="javascripts/' + jsFileName + '"]');
      if (scriptEl && scriptEl.src) {
        return scriptEl.src.replace(suffixRe, "");
      }
      // Fallback: derive from the site stylesheet link instead - a JS-
      // inserted <img> needs an absolute URL, not a relative one, since
      // mkdocs's directory-style page URLs add a path segment a real
      // markdown image gets auto-corrected for at build time but a
      // runtime-inserted one does not.
      var linkEl = document.querySelector('link[href*="stylesheets/extra.css"]');
      if (linkEl && linkEl.href) {
        return linkEl.href.replace(/stylesheets\/extra\.css(\?.*)?(#.*)?$/, "");
      }
      return "";
    },

    // Read + parse a widget's inline <script type="application/json">
    // data block, following both rules in the CONVENTION comment above
    // (bare-tag selector, array-root requirement) so individual widgets
    // don't have to re-implement either one. Returns
    // { script: <the script element>, raw: <its textContent>,
    //   data: <parsed JSON> } on success, or null if there's no script,
    // the JSON is invalid, or (unless opts.requireArray is explicitly
    // false) the root isn't an array - logging a console.error tagged
    // with widgetLabel in every failure case except "no script" (that
    // one's an expected, silent no-op: a container with no data isn't
    // an authoring mistake, see individual widgets' EASY EDIT GUIDEs).
    // Callers needing an idempotency guard (skip re-rendering when the
    // underlying JSON hasn't actually changed since last render, e.g.
    // rotation-line.js) should compare against the returned .raw
    // themselves - this always parses regardless, since JSON.parse
    // itself is cheap and the guard's real purpose is skipping the DOM
    // teardown/rebuild after it, not the parse.
    readInlineJSON: function (container, widgetLabel, opts) {
      var requireArray = !opts || opts.requireArray !== false;
      var script = container.querySelector("script");
      if (!script) return null;
      var raw = script.textContent;
      var data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error(widgetLabel + ": invalid JSON data block", e, container);
        return null;
      }
      if (requireArray && !Array.isArray(data)) {
        console.error(widgetLabel + ": JSON root must be an array, see site-utils.js's CONVENTION comment", container);
        return null;
      }
      return { script: script, raw: raw, data: data };
    },

    // Minimal "**word**" -> <strong>word</strong> inline bolding,
    // everything else appended as plain text. Not a general Markdown
    // parser - this data never reaches pymdownx, since it's built
    // client-side after the page's own Markdown pass already ran. Used
    // for short author-written strings inside JSON data blocks
    // (rotation-line.js situational tags, gem-priority.js alt notes).
    appendInlineBold: function (parent, text) {
      var parts = text.split(/\*\*(.+?)\*\*/g);
      parts.forEach(function (part, i) {
        if (!part) return;
        parent.appendChild(
          i % 2 === 1 ? window.SiteUtils.el("strong", null, part) : document.createTextNode(part)
        );
      });
    },

    // Wires up the standard "re-render this widget at the right times"
    // trigger set for every container matching selector, calling
    // renderContainer(container) for each. renderContainer must be
    // idempotent (safe to call again on a container it already
    // rendered) - it'll be called from three independent, overlapping
    // triggers, deliberately redundant rather than picking a single
    // "correct" one:
    //   1) A normal/direct page load. This can run either before or
    //      after the HTML parser reaches DOMContentLoaded depending on
    //      where mkdocs places extra_javascript, so this checks
    //      readyState instead of assuming.
    //   2) Material's navigation.instant page swaps, via document$ -
    //      Material's own hook that re-emits on every page view,
    //      including the very first one.
    //   3) Belt-and-suspenders: a MutationObserver on the whole
    //      document watching for a matching container inserted by
    //      anything else, the moment it appears.
    registerRenderer: function (selector, renderContainer) {
      function scanAndRender(root) {
        if (!root) return;
        if (root.matches && root.matches(selector)) {
          renderContainer(root);
        }
        if (root.querySelectorAll) {
          root.querySelectorAll(selector).forEach(renderContainer);
        }
      }

      function renderAll() {
        scanAndRender(document);
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderAll);
      } else {
        renderAll();
      }

      if (window.document$) {
        document$.subscribe(renderAll);
      }

      if (window.MutationObserver) {
        var observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (m) {
            m.addedNodes.forEach(function (node) {
              if (node.nodeType === 1) scanAndRender(node);
            });
          });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
    },
  };
})();
