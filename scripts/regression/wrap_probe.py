#!/usr/bin/env python3
"""Flag paragraphs and list items on the calculator guide whose last line is 1 to 5 words.

Opens /resources/calculator/ in Chromium at 1220, 1300, 1440, 1600 and 1920 px with every
<details> forced open and the web font loaded, groups each p/li's word rects by line, and
reports blocks of 2+ lines whose last line is 1-5 words. Table cells are left out
(text-wrap: balance).

    mkdocs build -d /tmp/site
    python3 scripts/regression/wrap_probe.py /tmp/site
"""
import functools, http.server, pathlib, socketserver, sys, threading

WIDTHS = [1220, 1300, 1440, 1600, 1920]
JS = """
() => {
  const out = [];
  document.querySelectorAll('.md-content p, .md-content li').forEach(el => {
    if (el.closest('table')) return;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const words = [];
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const re = /\\S+/g; let m;
      while ((m = re.exec(n.nodeValue))) {
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const b = r.getBoundingClientRect(); if (b.width) words.push({t: m[0], top: Math.round(b.top)});
      }
    }
    const lines = []; let last = null;
    words.forEach(w => { if (last === null || Math.abs(w.top - last) > 6) { lines.push([]); last = w.top; } lines[lines.length - 1].push(w.t); });
    if (lines.length >= 2 && lines[lines.length - 1].length <= 5)
      out.push({lines: lines.length, last: lines[lines.length - 1].join(' '), text: el.textContent.trim().slice(0, 70)});
  });
  return out;
}
"""

def main():
    site = pathlib.Path(sys.argv[1]).resolve()
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(site)))
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{srv.server_address[1]}/resources/calculator/"
    from playwright.sync_api import sync_playwright
    total = 0
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w in WIDTHS:
            pg = b.new_page(viewport={"width": w, "height": 1000})
            pg.goto(url); pg.wait_for_timeout(800)
            pg.evaluate("() => { document.querySelectorAll('details').forEach(d => d.open = true); return document.fonts.ready; }")
            pg.wait_for_timeout(400)
            for f in pg.evaluate(JS):
                total += 1
                print(f"{w}px: last line {f['last']!r} ({f['lines']} lines) in: {f['text']}")
            pg.close()
        b.close()
    srv.shutdown()
    print(f"wrap_probe.py: {total} flagged")
    sys.exit(1 if total else 0)

if __name__ == "__main__":
    main()
