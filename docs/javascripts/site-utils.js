// Small shared DOM helpers used by the native widget scripts
// (ark-core-badge.js, ark-passive-tree.js, essentials-table.js,
// skill-setup.js, dps-chart.js, etc).
//
// Must load FIRST in extra_javascript - see mkdocs.yml.
//
// Kept intentionally tiny: this is not a framework, just the couple of
// one-liners that were previously copy-pasted identically into every
// widget file. If a bug shows up in one of these (e.g. the masonry
// ResizeObserver leak), fix it here once instead of N times.
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
// re-deriving and re-copy-pasting that trigger wiring into every new
// widget (it WAS copy-pasted identically into all five files above
// before this was centralized), call SiteUtils.registerRenderer()
// once per widget instead - see its doc comment below for usage. Your
// renderContainer function just needs to be idempotent (safe to call
// again on a container it already rendered), same as every existing
// widget's already is.

(function () {
  window.SiteUtils = {
    // Clamp a number input's value to [min, max] on blur, reformatting it
    // and re-running the caller's update function if the raw value needed
    // clamping. Was copy-pasted near-identically into cpm-calculator.js
    // and bid-calculator.js before this - both had the same "catch fat-
    // finger/pasted-garbage entries on blur rather than block typing
    // mid-keystroke" guardrail, just with different formatting needs.
    //
    // parse:  function(rawString) -> number. Defaults to parseFloat.
    //         Pass bid-calculator's comma-aware parseNumber here for
    //         formatted/thousands-separator fields.
    // format: function(clampedNumber) -> string to write back into the
    //         input. Defaults to String(n). Pass e.g.
    //         (n) => n.toFixed(decimals) or (n) => n.toLocaleString("en-US").
    // onClamp: called (with no args) only when clamping actually changed
    //          the value - the caller's own re-render/update hook.
    clampOnBlur: function (input, min, max, onClamp, opts) {
      if (!input) return;
      opts = opts || {};
      var parse = opts.parse || parseFloat;
      var format = opts.format || function (n) { return String(n); };
      input.addEventListener("blur", function () {
        var raw = parse(input.value);
        if (!isFinite(raw)) return; // empty/invalid - caller's own render already shows a placeholder
        var clamped = Math.min(max, Math.max(min, raw));
        if (clamped !== raw) {
          input.value = format(clamped);
          if (onClamp) onClamp();
        }
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
    // folder, e.g. "icon-surge.png" or "ap-icons/critical.png". There
    // used to be a per-family assets/re/ and assets/surge/ icon split
    // with a manually maintained list of which icons happened to be
    // identical across both; that list is gone now that every icon file
    // lives in one place, so this is just a path join. assets/re/ and
    // assets/surge/ no longer exist at all - genuinely family-specific
    // page media (tldr screenshots, memes) now lives flat under
    // assets/ instead.
    iconSrc: function (siteRoot, relIcon) {
      return siteRoot + "assets/shared/" + relIcon;
    },

    // Coalesce repeated calls into at most one requestAnimationFrame-timed
    // invocation of fn. Returns a schedule() function - call it as often
    // as you like (resize events, ResizeObserver callbacks, input events
    // during a drag, ...) and fn runs at most once per animation frame,
    // with no arguments. Previously this exact scheduled-flag +
    // requestAnimationFrame wrapper was copy-pasted identically into
    // skill-setup.js's initMasonry and ark-passive-tree.js's
    // watchRowWraps; centralized here per this file's own stated purpose.
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
    // execution of this file). Previously an identical ~10-line
    // function, differing only in that filename, was copy-pasted into
    // skill-setup.js, essentials-table.js, ark-core-badge.js,
    // ark-passive-tree.js, and rotation-line.js.
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
    // Previously this exact ~30-line block (differing only in the
    // selector and the render function) was copy-pasted identically
    // into skill-setup.js, essentials-table.js, ark-core-badge.js,
    // ark-passive-tree.js, and (in an equivalent single-element form)
    // rotation-line.js.
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
