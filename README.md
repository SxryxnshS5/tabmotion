# tabmotion

A minimal, modern library of **animated favicons** for the browser tab. Browse a
gallery of canvas‑drawn favicons, recolor them, preview them live in a mock
browser tab, then copy a self‑contained snippet and paste it into your site.

No build step. No dependencies. Just three static files.

---

## Features

- **20 animated favicons** across categories: Brand, Loading, Notification, Fun, Media.
- **Live previews** — every favicon animates right in its card, inside a faux browser tab.
- **Search & category filters** to find a favicon fast.
- **Pagination** that fills complete rows and adapts to the viewport width.
- **Color theming** — preset swatches plus a custom color picker. Recolors the
  previews, the copy‑paste snippet, and the page's own favicon in real time.
- **Tab preview** — open any favicon in a mock browser window and type your site
  name to see the tab title, favicon, and address bar update live.
- **Copy‑paste ready** — the generated `<script>` is fully self‑contained; paste
  it into your `<head>` and it just works.
- **Eats its own dog food** — the site's own favicon is one of the library entries.

---

## Favicon catalog

20 favicons, grouped by category:

| Category | Favicons |
| --- | --- |
| **Brand** | tabmotion |
| **Loading** | Spinner · Orbit · Progress Ring · Typing Dots · Clock · Loader Dots · Gyro · Pie |
| **Notification** | Pulse · Radar · Signal |
| **Fun** | Bounce · Heartbeat · Comet · Morph · Star · Flip |
| **Media** | Equalizer · Wave |

---

## Quick start

It's a static site — no install required.

```bash
# clone, then either…

# 1. open it directly
open index.html            # macOS
start index.html           # Windows

# 2. or serve the folder (any static server works)
npx serve .
python -m http.server
```

Then visit the page in your browser.

---

## Using a favicon on your own site

1. Open the site and find a favicon you like.
2. Pick a color (optional) with the swatches / custom picker.
3. Click **View code** (or **Copy**) and copy the snippet.
4. Paste it anywhere inside your page's `<head>` or before `</body>`:

```html
<!-- tabmotion: Spinner -->
<script>
(function () {
  var c = document.createElement('canvas');
  c.width = c.height = 64;
  var x = c.getContext('2d');
  var link = document.querySelector("link[rel~='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  var last = 0;
  function draw(x, t) {
    /* ...favicon drawing code... */
  }
  function loop(now) {
    requestAnimationFrame(loop);
    if (now - last < 66) return;   // throttle to ~15fps
    last = now;
    x.clearRect(0, 0, 64, 64);
    draw(x, now / 1000);
    link.href = c.toDataURL('image/png');
  }
  requestAnimationFrame(loop);
})();
</script>
```

The snippet creates its own off‑screen canvas, finds (or creates) the page's
`<link rel="icon">`, and repaints it from the canvas each frame. The chosen
color is baked into the copied code, so it renders exactly as previewed.

> **Note:** animated favicons rely on the [Canvas API] and `link.href` updates,
> which work in all modern browsers. Tabs are repainted a few times per second by
> the browser, so the snippet is throttled to ~15fps to stay light.

[Canvas API]: https://developer.mozilla.org/docs/Web/API/Canvas_API

---

## Project structure

```
tabmotion/
├── index.html   # markup-only page shell
├── styles.css   # all styling + theme tokens (:root)
└── app.js       # favicon registry, previews, search, pagination, color, modals
```

Everything is vanilla HTML/CSS/JS. The three files are heavily commented and
organized into numbered sections.

---

## Architecture: one source of truth

Each favicon is described **once** in the `FAVICONS` array in `app.js` by a
`body` string — plain JS that draws **one frame** onto a 64×64 canvas context
`x` at time `t` (seconds). That single string drives everything, so the gallery,
the snippet, and the live favicon can never drift apart:

1. the live on‑page card preview,
2. the live modal / tab previews, and
3. the generated copy‑paste `<script>`.

The `body` is run two ways: compiled with `new Function("x", "t", body)` for the
live previews, and inlined verbatim into the snippet for users to copy.

### Color theming

Bodies are authored with a fixed set of reference color literals (the default
purple). To recolor, `themed()` string‑replaces those tokens with the active
palette's values — so one set of presets (or the custom picker) re‑themes every
favicon, preview, snippet, and the site icon.

---

## Adding a new favicon

Append an object to the `FAVICONS` array in `app.js`:

```js
{
  id: "myicon",
  name: "My Icon",
  category: "Fun",            // new categories become filter chips automatically
  desc: "Short description shown on the card.",
  body:
"  x.fillStyle = '#a855f7';\n" +     // use the reference color tokens so
"  x.beginPath();\n" +              // theming/recolor keeps working
"  x.arc(32, 32, 16, 0, 7);\n" +
"  x.fill();"
}
```

Guidelines for `body`:

- Draw using `x` (the 2D context) and `t` (elapsed seconds).
- Keep all drawing within the 64×64 box.
- Use the reference color tokens (`#a855f7`, `#c084fc`, `#7c3aed`, and
  `rgba(168,85,247,…)`) so the color picker can re‑tint your favicon.

That's it — the card, previews, snippet, search, category chip, and pagination
all pick it up automatically.

---

## Custom favicons

Need something bespoke? Reach out: **theorangeshade.apps@gmail.com**

---

## License

MIT — see [LICENSE](LICENSE).
