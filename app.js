/* =============================================================================
   tabmotion — app.js
   -----------------------------------------------------------------------------
   All behavior for the tabmotion landing page. Vanilla JS, zero dependencies.

   ARCHITECTURE — one source of truth
   ----------------------------------
   Every favicon is described once, in the FAVICONS array below, by a `body`
   string: plain JS that draws ONE frame onto a 64x64 canvas context `x` at
   time `t` (in seconds). That single string drives three things, so they can
   never drift apart:

       1. the live on-page card preview   (startPreview)
       2. the live modal preview          (modal loop)
       3. the copy-paste <script> snippet (buildSnippet)

   The `body` is run two ways: with `new Function("x","t", body)` for the live
   previews, and inlined verbatim into the generated snippet for users to copy.

   HOW TO ADD A FAVICON
   --------------------
   Append an object to FAVICONS with { id, name, category, desc, body }. Inside
   `body`, draw using `x` (the 2D context) and `t` (seconds). Keep all drawing
   within the 64x64 box. New categories appear as filter chips automatically.

   Sections:
     1. Favicon registry (FAVICONS)
     2. Snippet builder
     3. Syntax highlighter
     4. Live preview renderer
     5. Grid render + search/category filtering
     6. Code modal
     7. Clipboard + toast
     8. Bootstrap + live site favicon
   ============================================================================= */

/* ---------- 1. Favicon registry --------------------------------------------
   See "ARCHITECTURE" above for what `body` must do. Each `body` line is a
   string so it can be both executed and embedded into the copyable snippet.  */
var FAVICONS = [
  {
    id: "tabmotion",
    name: "tabmotion",
    category: "Brand",
    desc: "The tabmotion mark — a highlight that glides between tabs. This is the favicon on this very tab.",
    // Three dim "tab" tracks with a solid highlight easing up and down between them.
    body:
"  var w = 34, h = 7, bx = 15, r = 3.5;\n" +
"  var rows = [20, 32, 44];\n" +
"  x.fillStyle = 'rgba(168,85,247,0.16)';\n" +
"  for (var i = 0; i < 3; i++) {\n" +
"    x.beginPath();\n" +
"    x.roundRect(bx, rows[i] - h / 2, w, h, r);\n" +
"    x.fill();\n" +
"  }\n" +
"  var m = (t * 0.9) % 2;\n" +            // 0..2 sawtooth
"  var tri = m < 1 ? m : 2 - m;\n" +      // fold into a 0..1..0 triangle wave
"  var e = tri * tri * (3 - 2 * tri);\n" + // smoothstep easing
"  var cy = 20 + e * 24;\n" +            // travel between the top and bottom track
"  x.fillStyle = '#a855f7';\n" +
"  x.beginPath();\n" +
"  x.roundRect(bx, cy - h / 2, w, h, r);\n" +
"  x.fill();"
  },
  {
    id: "pulse",
    name: "Pulse",
    category: "Notification",
    desc: "A glowing dot emitting expanding rings. Great for alerts & live status.",
    body:
"  var cx = 32, cy = 32;\n" +
"  for (var i = 0; i < 3; i++) {\n" +
"    var p = (t * 0.8 + i / 3) % 1;\n" +
"    x.beginPath();\n" +
"    x.arc(cx, cy, 9 + p * 21, 0, 7);\n" +
"    x.strokeStyle = 'rgba(168,85,247,' + (1 - p) + ')';\n" +
"    x.lineWidth = 3;\n" +
"    x.stroke();\n" +
"  }\n" +
"  x.beginPath();\n" +
"  x.arc(cx, cy, 10, 0, 7);\n" +
"  x.fillStyle = '#a855f7';\n" +
"  x.fill();"
  },
  {
    id: "spinner",
    name: "Spinner",
    category: "Loading",
    desc: "A clean rotating arc on a track ring. The classic loading indicator.",
    body:
"  var cx = 32, cy = 32, r = 22;\n" +
"  x.beginPath();\n" +
"  x.arc(cx, cy, r, 0, 7);\n" +
"  x.strokeStyle = 'rgba(168,85,247,0.2)';\n" +
"  x.lineWidth = 7;\n" +
"  x.stroke();\n" +
"  var a = t * 4.5;\n" +
"  x.beginPath();\n" +
"  x.arc(cx, cy, r, a, a + 1.9);\n" +
"  x.strokeStyle = '#a855f7';\n" +
"  x.lineWidth = 7;\n" +
"  x.lineCap = 'round';\n" +
"  x.stroke();"
  },
  {
    id: "orbit",
    name: "Orbit",
    category: "Loading",
    desc: "Two satellites circling a core. Smooth, hypnotic, always-in-motion.",
    body:
"  var cx = 32, cy = 32, r = 19;\n" +
"  x.beginPath();\n" +
"  x.arc(cx, cy, 6, 0, 7);\n" +
"  x.fillStyle = '#c084fc';\n" +
"  x.fill();\n" +
"  for (var i = 0; i < 2; i++) {\n" +
"    var a = t * 3 + i * Math.PI;\n" +
"    var px = cx + Math.cos(a) * r;\n" +
"    var py = cy + Math.sin(a) * r;\n" +
"    x.beginPath();\n" +
"    x.arc(px, py, 5.5, 0, 7);\n" +
"    x.fillStyle = i ? '#7c3aed' : '#a855f7';\n" +
"    x.fill();\n" +
"  }"
  },
  {
    id: "bounce",
    name: "Bounce",
    category: "Fun",
    desc: "A playful ball with a squash-and-stretch bounce and soft shadow.",
    body:
"  var cx = 32;\n" +
"  var p = Math.abs(Math.sin(t * 3.2));\n" +
"  var y = 18 + (1 - p) * 26;\n" +
"  var sh = 0.4 + (1 - p) * 0.6;\n" +
"  x.beginPath();\n" +
"  x.ellipse(cx, 52, 11 * sh, 3.5, 0, 0, 7);\n" +
"  x.fillStyle = 'rgba(168,85,247,0.22)';\n" +
"  x.fill();\n" +
"  var squash = p < 0.12 ? (0.12 - p) * 18 : 0;\n" +
"  x.beginPath();\n" +
"  x.ellipse(cx, y, 11 + squash, 11 - squash, 0, 0, 7);\n" +
"  x.fillStyle = '#a855f7';\n" +
"  x.fill();"
  },
  {
    id: "equalizer",
    name: "Equalizer",
    category: "Media",
    desc: "Dancing audio bars. Perfect for music, podcasts & anything playing.",
    body:
"  var n = 4, w = 8, gap = 4;\n" +
"  var total = n * w + (n - 1) * gap;\n" +
"  var sx = (64 - total) / 2;\n" +
"  x.fillStyle = '#a855f7';\n" +
"  for (var i = 0; i < n; i++) {\n" +
"    var h = 16 + Math.abs(Math.sin(t * 4 + i * 0.9)) * 32;\n" +
"    var bx = sx + i * (w + gap);\n" +
"    var by = (64 - h) / 2;\n" +
"    x.beginPath();\n" +
"    x.roundRect(bx, by, w, h, 4);\n" +
"    x.fill();\n" +
"  }"
  },
  {
    id: "heartbeat",
    name: "Heartbeat",
    category: "Fun",
    desc: "A heart with a lively double-thump pulse. Friendly and full of life.",
    body:
"  var b = Math.sin(t * 5);\n" +
"  var s = 1 + (b > 0 ? b * b * 0.22 : 0);\n" +
"  x.save();\n" +
"  x.translate(32, 30);\n" +
"  x.scale(s, s);\n" +
"  x.beginPath();\n" +
"  x.moveTo(0, 14);\n" +
"  x.bezierCurveTo(-18, -2, -10, -20, 0, -8);\n" +
"  x.bezierCurveTo(10, -20, 18, -2, 0, 14);\n" +
"  x.closePath();\n" +
"  x.fillStyle = '#a855f7';\n" +
"  x.fill();\n" +
"  x.restore();"
  },
  {
    id: "progress",
    name: "Progress Ring",
    category: "Loading",
    desc: "A ring that fills from empty to full and loops. Great for uploads.",
    body:
"  var cx = 32, cy = 32, r = 21;\n" +
"  x.beginPath();\n" +
"  x.arc(cx, cy, r, 0, 7);\n" +
"  x.strokeStyle = 'rgba(168,85,247,0.18)';\n" +
"  x.lineWidth = 7;\n" +
"  x.stroke();\n" +
"  var p = (t * 0.5) % 1;\n" +
"  x.beginPath();\n" +
"  x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);\n" +
"  x.strokeStyle = '#a855f7';\n" +
"  x.lineWidth = 7;\n" +
"  x.lineCap = 'round';\n" +
"  x.stroke();"
  },
  {
    id: "dots",
    name: "Typing Dots",
    category: "Loading",
    desc: "Three dots bouncing in sequence — the classic typing indicator.",
    body:
"  x.fillStyle = '#a855f7';\n" +
"  for (var i = 0; i < 3; i++) {\n" +
"    var off = Math.max(0, Math.sin(t * 5 - i * 0.6)) * 10;\n" +
"    x.beginPath();\n" +
"    x.arc(14 + i * 18, 32 - off, 6, 0, 7);\n" +
"    x.fill();\n" +
"  }"
  },
  {
    id: "radar",
    name: "Radar",
    category: "Notification",
    desc: "A sweeping radar beam over range rings. Signals active scanning.",
    body:
"  var cx = 32, cy = 32, r = 24;\n" +
"  x.strokeStyle = 'rgba(168,85,247,0.18)';\n" +
"  x.lineWidth = 2;\n" +
"  x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();\n" +
"  x.beginPath(); x.arc(cx, cy, r * 0.6, 0, 7); x.stroke();\n" +
"  var a = t * 2.5;\n" +
"  x.beginPath();\n" +
"  x.moveTo(cx, cy);\n" +
"  x.arc(cx, cy, r, a - 0.6, a);\n" +
"  x.closePath();\n" +
"  x.fillStyle = 'rgba(168,85,247,0.35)';\n" +
"  x.fill();\n" +
"  x.beginPath();\n" +
"  x.moveTo(cx, cy);\n" +
"  x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);\n" +
"  x.strokeStyle = '#a855f7';\n" +
"  x.lineWidth = 2.5;\n" +
"  x.stroke();\n" +
"  x.beginPath(); x.arc(cx, cy, 3, 0, 7); x.fillStyle = '#c084fc'; x.fill();"
  },
  {
    id: "comet",
    name: "Comet",
    category: "Fun",
    desc: "A dot orbiting with a glowing fading tail. Smooth and eye-catching.",
    body:
"  var cx = 32, cy = 32, r = 20;\n" +
"  for (var i = 0; i < 10; i++) {\n" +
"    var a = t * 3 - i * 0.12;\n" +
"    var px = cx + Math.cos(a) * r;\n" +
"    var py = cy + Math.sin(a) * r;\n" +
"    x.beginPath();\n" +
"    x.arc(px, py, 5 - i * 0.4, 0, 7);\n" +
"    x.fillStyle = 'rgba(168,85,247,' + (1 - i / 10) + ')';\n" +
"    x.fill();\n" +
"  }"
  },
  {
    id: "wave",
    name: "Wave",
    category: "Media",
    desc: "A scrolling sine wave with a filled body. Ideal for audio & live data.",
    body:
"  var i, y;\n" +
"  x.beginPath();\n" +
"  x.moveTo(0, 64);\n" +
"  for (i = 0; i <= 64; i += 4) {\n" +
"    y = 32 + Math.sin(i * 0.2 + t * 3) * 10;\n" +
"    x.lineTo(i, y);\n" +
"  }\n" +
"  x.lineTo(64, 64);\n" +
"  x.closePath();\n" +
"  x.fillStyle = 'rgba(168,85,247,0.35)';\n" +
"  x.fill();\n" +
"  x.beginPath();\n" +
"  for (i = 0; i <= 64; i += 4) {\n" +
"    y = 32 + Math.sin(i * 0.2 + t * 3) * 10;\n" +
"    if (i === 0) x.moveTo(i, y); else x.lineTo(i, y);\n" +
"  }\n" +
"  x.strokeStyle = '#a855f7';\n" +
"  x.lineWidth = 3;\n" +
"  x.lineCap = 'round';\n" +
"  x.stroke();"
  },
  {
    id: "clock",
    name: "Clock",
    category: "Loading",
    desc: "Sweeping clock hands on a soft dial. For timers and scheduling.",
    body:
"  var cx = 32, cy = 32, r = 22;\n" +
"  x.beginPath(); x.arc(cx, cy, r, 0, 7);\n" +
"  x.strokeStyle = 'rgba(168,85,247,0.25)'; x.lineWidth = 4; x.stroke();\n" +
"  var ma = t * 3;\n" +
"  x.beginPath(); x.moveTo(cx, cy);\n" +
"  x.lineTo(cx + Math.cos(ma) * 16, cy + Math.sin(ma) * 16);\n" +
"  x.strokeStyle = '#a855f7'; x.lineWidth = 4; x.lineCap = 'round'; x.stroke();\n" +
"  var ha = t * 0.8;\n" +
"  x.beginPath(); x.moveTo(cx, cy);\n" +
"  x.lineTo(cx + Math.cos(ha) * 10, cy + Math.sin(ha) * 10);\n" +
"  x.strokeStyle = '#c084fc'; x.lineWidth = 4; x.lineCap = 'round'; x.stroke();\n" +
"  x.beginPath(); x.arc(cx, cy, 3, 0, 7); x.fillStyle = '#fff'; x.fill();"
  },
  {
    id: "morph",
    name: "Morph",
    category: "Fun",
    desc: "A shape spinning while it melts from square to circle and back.",
    body:
"  var s = 38;\n" +
"  var rad = 4 + (Math.sin(t * 2) + 1) / 2 * 15;\n" +
"  x.save();\n" +
"  x.translate(32, 32);\n" +
"  x.rotate(t * 1.2);\n" +
"  x.beginPath();\n" +
"  x.roundRect(-s / 2, -s / 2, s, s, rad);\n" +
"  var g = x.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);\n" +
"  g.addColorStop(0, '#c084fc');\n" +
"  g.addColorStop(1, '#7c3aed');\n" +
"  x.fillStyle = g;\n" +
"  x.fill();\n" +
"  x.restore();"
  }
];

/* ---------- 2. Snippet builder ---------------------------------------------
   Wraps a favicon's `body` in a self-contained, copy-paste-ready <script>.
   The generated code creates its own off-screen canvas, finds (or creates)
   the page's <link rel="icon">, and repaints it from the canvas each frame.  */
function buildSnippet(fav) {
  return (
"<!-- tabmotion: " + fav.name + "  —  https://tabmotion -->\n" +
"<script>\n" +
"(function () {\n" +
"  var c = document.createElement('canvas');\n" +
"  c.width = c.height = 64;\n" +
"  var x = c.getContext('2d');\n" +
"  var link = document.querySelector(\"link[rel~='icon']\");\n" +
"  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }\n" +
"  var last = 0;\n" +
"  function draw(x, t) {\n" +
fav.body + "\n" +
"  }\n" +
"  function loop(now) {\n" +
"    requestAnimationFrame(loop);\n" +
"    if (now - last < 66) return;   // throttle to ~15fps\n" +
"    last = now;\n" +
"    x.clearRect(0, 0, 64, 64);\n" +
"    draw(x, now / 1000);\n" +
"    link.href = c.toDataURL('image/png');\n" +
"  }\n" +
"  requestAnimationFrame(loop);\n" +
"})();\n" +
"<\/script>"  // backslash keeps a literal </script> from ending this script tag
  );
}

/* ---------- 3. Syntax highlighter ------------------------------------------
   Lightweight, regex-based coloring for the modal code view only. It is not a
   real parser — just enough to make the snippet readable. Tokens map to the
   .tok-* classes in styles.css. Input is HTML-escaped first.                 */
function highlight(code) {
  var esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // comments (html block + js line)
  esc = esc.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-c">$1</span>');
  esc = esc.replace(/(\/\/[^\n]*)/g, '<span class="tok-c">$1</span>');
  // single-quoted strings
  esc = esc.replace(/('[^'\n]*')/g, '<span class="tok-s">$1</span>');
  // <script> tags
  esc = esc.replace(/(&lt;\/?script&gt;)/g, '<span class="tok-t">$1</span>');
  // a handful of JS keywords
  esc = esc.replace(/\b(function|var|return|if|for|new)\b/g, '<span class="tok-k">$1</span>');
  return esc;
}

/* ---------- 4. Live preview renderer ---------------------------------------
   Compiles a favicon's `body` into a function and animates it onto `canvas`.
   Used by every card preview. Throttled to ~30fps (smoother than the favicon
   itself, which the browser only samples a few times per second).
   Returns a stop() handle so the loop can be cancelled when the card is
   removed (e.g. on search, filter, or page change) — avoids leaking RAF
   loops that paint to detached canvases.                                     */
function startPreview(canvas, fav) {
  var x = canvas.getContext("2d");
  var fn = new Function("x", "t", fav.body);
  var last = 0, raf;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return;   // ~30fps on-page, looks smooth
    last = now;
    x.clearRect(0, 0, 64, 64);
    fn(x, now / 1000);
  }
  raf = requestAnimationFrame(loop);
  return function stop() { cancelAnimationFrame(raf); };
}

/* ---------- 5. Grid render + filtering + pagination ------------------------- */
var grid = document.getElementById("grid");
var searchInput = document.getElementById("search");
var chipsEl = document.getElementById("chips");
var paginationEl = document.getElementById("pagination");

var ROWS_PER_PAGE = 2;   // how many full rows to show per page
var currentPage = 1;     // active page (1-based)

// Count the grid's current columns by reading its computed track list. The
// grid uses `auto-fill`, so this reflects how many cards actually fit the
// viewport — letting page size grow/shrink to always fill complete rows.
function getColumns() {
  var cols = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
  return Math.max(1, cols);
}

// Favicons per page = columns x rows, so pages never leave a half-empty row.
function getPageSize() {
  return getColumns() * ROWS_PER_PAGE;
}

// Build the category list as ["All", ...unique categories from FAVICONS].
var categories = ["All"].concat(
  FAVICONS.map(function (f) { return f.category; })
          .filter(function (v, i, a) { return a.indexOf(v) === i; })
);
var activeCat = "All";  // currently selected category chip
var query = "";          // current search text (lowercased)

// Active preview loops; cancelled before every re-render to avoid leaks.
var activePreviews = [];
function stopPreviews() {
  activePreviews.forEach(function (stop) { stop(); });
  activePreviews = [];
}

// Render a clickable chip per category and wire up filtering.
categories.forEach(function (cat) {
  var b = document.createElement("button");
  b.className = "chip" + (cat === "All" ? " active" : "");
  b.textContent = cat;
  b.onclick = function () {
    activeCat = cat;
    currentPage = 1;   // jump back to the first page when the filter changes
    document.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
    b.classList.add("active");
    render();
  };
  chipsEl.appendChild(b);
});

// Live search: re-render on every keystroke (and reset to page 1).
searchInput.addEventListener("input", function () {
  query = this.value.toLowerCase().trim();
  currentPage = 1;
  render();
});

// Re-render on resize (debounced) so the page size tracks the column count.
var resizeTimer;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 150);
});

// Return the favicons matching the current category + search filters.
function getFiltered() {
  return FAVICONS.filter(function (f) {
    var matchCat = activeCat === "All" || f.category === activeCat;
    var matchQ = !query ||
      f.name.toLowerCase().indexOf(query) > -1 ||
      f.category.toLowerCase().indexOf(query) > -1 ||
      f.desc.toLowerCase().indexOf(query) > -1;
    return matchCat && matchQ;
  });
}

// (Re)build the card grid + pagination for the current filters and page.
function render() {
  stopPreviews();
  grid.innerHTML = "";
  paginationEl.innerHTML = "";

  var filtered = getFiltered();

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty">No favicons match your search.</div>';
    return;
  }

  // Clamp the page to the available range, then slice out this page's items.
  var pageSize = getPageSize();
  var totalPages = Math.ceil(filtered.length / pageSize);
  if (currentPage > totalPages) currentPage = totalPages;
  var start = (currentPage - 1) * pageSize;
  var list = filtered.slice(start, start + pageSize);

  list.forEach(function (fav) {
    var card = document.createElement("div");
    card.className = "card";
    card.innerHTML =
      '<div class="tab-mock">' +
        '<canvas width="64" height="64"></canvas>' +
        '<span class="tab-title">' + fav.name + ' — your site</span>' +
        '<span class="tab-x">&times;</span>' +
      '</div>' +
      '<div class="card-head"><h3>' + fav.name + '</h3><span class="cat">' + fav.category + '</span></div>' +
      '<p>' + fav.desc + '</p>' +
      '<div class="card-actions">' +
        '<button class="btn btn-primary">&lt;/&gt; View code</button>' +
        '<button class="btn btn-ghost" title="Copy code">Copy</button>' +
      '</div>';

    // Start the live favicon preview inside the faux tab (tracked for cleanup).
    var canvas = card.querySelector("canvas");
    activePreviews.push(startPreview(canvas, fav));

    // [0] = open the code modal, [1] = copy the snippet directly.
    var btns = card.querySelectorAll("button");
    btns[0].onclick = function () { openModal(fav); };
    btns[1].onclick = function () { copyText(buildSnippet(fav)); };

    grid.appendChild(card);
  });

  renderPagination(totalPages);
}

// Build the prev / numbered / next controls. Hidden automatically when there
// is only a single page (the container is empty, collapsed via CSS).
function renderPagination(totalPages) {
  if (totalPages <= 1) return;

  function pageButton(label, page, opts) {
    opts = opts || {};
    var b = document.createElement("button");
    b.className = "page-btn" + (opts.active ? " active" : "");
    b.textContent = label;
    if (opts.disabled) b.disabled = true;
    else b.onclick = function () {
      currentPage = page;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    return b;
  }

  paginationEl.appendChild(pageButton("‹", currentPage - 1, { disabled: currentPage === 1 }));
  for (var p = 1; p <= totalPages; p++) {
    paginationEl.appendChild(pageButton(String(p), p, { active: p === currentPage }));
  }
  paginationEl.appendChild(pageButton("›", currentPage + 1, { disabled: currentPage === totalPages }));
}

/* ---------- 6. Code modal --------------------------------------------------- */
var overlay = document.getElementById("overlay");
var modalCanvas = document.getElementById("modalCanvas");
var currentFav = null;  // favicon currently shown in the modal (drives its preview loop)

function openModal(fav) {
  currentFav = fav;
  document.getElementById("modalName").textContent = fav.name;
  document.getElementById("modalCat").textContent = fav.category + " favicon";
  document.getElementById("modalCode").innerHTML = highlight(buildSnippet(fav));
  overlay.classList.add("open");
}

// A single long-lived loop renders whichever favicon is currently open. It
// idles cheaply (just an early return) while the modal is closed.
(function () {
  var x = modalCanvas.getContext("2d");
  var last = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!overlay.classList.contains("open") || !currentFav) return;
    if (now - last < 33) return;
    last = now;
    var fn = new Function("x", "t", currentFav.body);
    x.clearRect(0, 0, 64, 64);
    fn(x, now / 1000);
  }
  requestAnimationFrame(loop);
})();

function closeModal() { overlay.classList.remove("open"); currentFav = null; }
document.getElementById("modalClose").onclick = closeModal;
overlay.onclick = function (e) { if (e.target === overlay) closeModal(); }; // click backdrop to dismiss
document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
document.getElementById("modalCopy").onclick = function () { if (currentFav) copyText(buildSnippet(currentFav)); };

/* ---------- 7. Clipboard + toast -------------------------------------------- */
var toast = document.getElementById("toast");
var toastTimer;

// Copy via the async Clipboard API, with a legacy execCommand fallback.
function copyText(text) {
  navigator.clipboard.writeText(text).then(showToast, function () {
    // Fallback for older browsers / non-secure contexts.
    var ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); showToast(); } catch (e) {}
    document.body.removeChild(ta);
  });
}
function showToast() {
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 1800);
}

/* ---------- 7b. Contact card ------------------------------------------------ */
// Dismiss the bottom-right "Need a custom favicon?" card.
document.getElementById("contactClose").onclick = function () {
  document.getElementById("contact").classList.add("hidden");
};

/* ---------- 8. Bootstrap + live site favicon -------------------------------- */
render();  // initial paint of the grid

// tabmotion eats its own dog food: the brand favicon (FAVICONS[0]) is rendered
// live into this page's own browser-tab icon, using the exact same `body` that
// powers its card and copyable snippet.
(function () {
  var brand = FAVICONS[0]; // the "tabmotion" mark
  var c = document.createElement("canvas");
  c.width = c.height = 64;
  var x = c.getContext("2d");
  var fn = new Function("x", "t", brand.body);
  var link = document.querySelector("link[rel~='icon']");
  if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
  var last = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (now - last < 66) return; // ~15fps
    last = now;
    x.clearRect(0, 0, 64, 64);
    fn(x, now / 1000);
    link.href = c.toDataURL("image/png");
  }
  requestAnimationFrame(loop);
})();
