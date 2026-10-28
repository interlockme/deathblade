(function () {
  window.SiteUtils = {
    clampOnBlur: function (input, min, max, onClamp, opts) {
      if (!input) return;
      opts = opts || {};
      var parse = opts.parse || parseFloat;
      var format = opts.format || function (n) { return String(n); };
      input.addEventListener("blur", function () {
        var raw = parse(input.value);
        if (!isFinite(raw)) {
          if (opts.emptyValue === undefined) return;
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
        var next = Math.round((current + delta) * 100) / 100;
        next = Math.min(max, Math.max(min, next));
        input.value = next;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    },
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
      }
      document.body.removeChild(temp);
      return Promise.resolve();
    },
    el: function (tag, className, text) {
      var e = document.createElement(tag);
      if (className) e.className = className;
      if (text != null) e.textContent = text;
      return e;
    },
    appendGradePairs: function (parent, text, appendPlain) {
      var plain = appendPlain || function (node, segment) {
        node.appendChild(document.createTextNode(segment));
      };
      var re = /([+-]?\d+(?:\.\d+)?[%s]?)\/(\d+(?:\.\d+)?[%s]?)/g;
      var last = 0;
      var match;
      while ((match = re.exec(text))) {
        if (match.index > last) plain(parent, text.slice(last, match.index));
        parent.appendChild(window.SiteUtils.el("span", "grade-relic-val", match[1]));
        parent.appendChild(document.createTextNode("/"));
        parent.appendChild(window.SiteUtils.el("span", "grade-ancient-val", match[2]));
        last = match.index + match[0].length;
      }
      if (last < text.length) plain(parent, text.slice(last));
    },
    svgEl: function (tag, attrs) {
      var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
      for (var key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) el.setAttribute(key, attrs[key]);
      }
      return el;
    },
    pentagonPoint: function (cx, cy, angleDeg, r) {
      var a = (angleDeg * Math.PI) / 180;
      return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
    },
    pentagonPointsToAttr: function (pts) {
      return pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
    },
    radar: {
      VIEWBOX: "-10 8 214 161",
      CX: 100,
      CY: 98,
      R_MAX: 60,
      angles: function (n) {
        var out = [];
        for (var i = 0; i < n; i++) out.push((360 / n) * i);
        return out;
      },
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
      dataPoints: function (angles, values) {
        var U = window.SiteUtils, R = U.radar;
        return angles.map(function (a, i) {
          var v = Math.max(0, Math.min(10, values[i]));
          return U.pentagonPoint(R.CX, R.CY, a, R.R_MAX * (v / 10));
        });
      },
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
      wireLabelTips: function (svg) {
        var U = window.SiteUtils, ST = window.SkillTooltip;
        if (!ST) return;
        svg.querySelectorAll(".pentagon-label[data-radar-tip]").forEach(function (text) {
          var tip = U.el("div", "skill-tip md-typeset");
          tip.setAttribute("role", "tooltip");
          tip.appendChild(U.el("p", "skill-tip-note", text.getAttribute("data-radar-tip")));
          ST.wireCustom(text, tip);
        });
      },
    },
    formatStat: function (n) {
      var r = Math.round(n * 10) / 10;
      return r % 1 === 0 ? r.toFixed(0) : r.toFixed(1);
    },
    formatPct: function (n) {
      return window.SiteUtils.formatStat(n) + "%";
    },
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
    hideOnError: function (img, mode) {
      img.addEventListener("error", function () {
        if (mode === "display") {
          img.style.display = "none";
        } else {
          img.style.visibility = "hidden";
        }
      });
    },
    iconSrc: function (siteRoot, relIcon) {
      return siteRoot + "assets/shared/" + relIcon;
    },
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
    detectSiteRoot: function (jsFileName) {
      var escaped = jsFileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var suffixRe = new RegExp("javascripts/" + escaped + "(\\?.*)?(#.*)?$");
      var scriptEl = document.currentScript || document.querySelector('script[src*="javascripts/' + jsFileName + '"]');
      if (scriptEl && scriptEl.src) {
        return scriptEl.src.replace(suffixRe, "");
      }
      var linkEl = document.querySelector('link[href*="stylesheets/extra.css"]');
      if (linkEl && linkEl.href) {
        return linkEl.href.replace(/stylesheets\/extra\.css(\?.*)?(#.*)?$/, "");
      }
      return "";
    },
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
    appendInlineBold: function (parent, text) {
      var parts = text.split(/\*\*(.+?)\*\*/g);
      parts.forEach(function (part, i) {
        if (!part) return;
        parent.appendChild(
          i % 2 === 1 ? window.SiteUtils.el("strong", null, part) : document.createTextNode(part)
        );
      });
    },
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
