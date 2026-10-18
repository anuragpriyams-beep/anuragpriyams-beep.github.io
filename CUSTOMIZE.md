# Customizing the site

Plain static site: edit a file, refresh the browser, push to publish. No build step.

**Preview locally** (from this folder): `python -m http.server 8000`, then open http://localhost:8000.
**Publish:** `git add -A`, `git commit -m "..."`, `git push`. GitHub Pages updates in a minute or two.

## Where things live

| What | File |
|---|---|
| Home page text, photo, project cards, post list, contact icons | `index.html` |
| Other pages | `blog/index.html`, `projects/index.html`, `bookmarks/index.html`, `links/index.html` |
| Nav items, header, refraction effect | `assets/js/main.js` |
| Colours and font names | `assets/js/tailwind-config.js` |
| Background, glass panel, header glass, font files | `assets/css/style.css` |
| Images | `assets/img/` |
| Fonts | `assets/fonts/` |

## Edit text

Open `index.html`. Every part you are meant to change has an `<!-- EDIT: ... -->` comment above it: greeting, one-line intro, about paragraph, project cards, post list. Replace the text between the tags and leave the tags and `class="..."` attributes alone.

Other pages have a small label (`Blog`), a big title (`<h1>`) and one blurb line. Add your content where it says `<!-- EDIT: content for this page goes below -->`.

## Add or change images

1. Put the file in `assets/img/` (JPG, PNG or WebP; resize large photos to about 1600 px wide first).
2. Reference it with a path relative to the page:
   - from `index.html`: `src="assets/img/photo.jpg"`
   - from `blog/index.html` or `projects/index.html`: `src="../assets/img/photo.jpg"`
   - from `projects/<name>/index.html`: `src="../../assets/img/photo.jpg"`
3. Always fill in `alt="..."` (a short description of the image).

- **Profile photo:** replace `assets/img/profile.svg`, or add `profile.jpg` and change the `src` on the `<img>` in the hero section of `index.html`. It is shown at a 4:5 portrait ratio and cropped to fit.
- **Background:** replace `assets/img/background.png` with an image at least 2560 px wide, or change the `url(...)` in `body::before` in `style.css`.
- **Image in a page body:**
  ```html
  <img src="../assets/img/photo.jpg" alt="Describe it" class="mt-12 w-full rounded-2xl border border-white/15">
  ```

## Nav items

In `assets/js/main.js`, edit the `items` list: `["key", "Label", "folder/"]`. The key must match the page's `data-page` value (set on the script tag at the bottom of each page). Adding a page means: make a folder with an `index.html` (copy `projects/_template/index.html`), then add one line to `items`.

## Add a project

1. Copy `projects/_template/` to `projects/<your-project>/`. Build the interactive demo there: its own HTML, JS, CSS and images can live in that folder.
2. Add a card on `projects/index.html` (and on the home page if you want it featured). Copy an existing card from `index.html`:
   ```html
   <a href="projects/your-project/" class="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:bg-white/[0.07]">
     <i data-lucide="sparkles" class="h-5 w-5 text-accent"></i>
     <h3 class="mt-8 font-display text-2xl">Title</h3>
     <p class="mt-2 text-sm leading-relaxed text-white/60">One line about it.</p>
   </a>
   ```
   Use `href="your-project/"` on `projects/index.html`. For a project hosted elsewhere, point `href` at its URL.
3. Keep the `<script>` tags at the bottom of the project page if you want the header to appear on it. Remove them for a fullscreen demo.

## Add a blog post

1. Make `blog/posts/<slug>/index.html`, copying `blog/index.html` as the starting point. Fix the paths: from `blog/posts/<slug>/`, the root is `../../../`, so set `../../../assets/...` in the links and `data-root="../../../"` on the `main.js` script tag, with `data-page="blog"`.
2. Write the post inside the `<div class="mx-auto max-w-5xl ...">`, using normal HTML (`<h2>`, `<p>`, `<img>`). For a comfortable reading width use `class="max-w-2xl space-y-6 text-lg leading-loose text-white/80"` on a wrapper.
3. List it on `blog/index.html` (and the home page "Writing" list) with a row like the existing `<li>` items.

## Icons

Icons are [Lucide](https://lucide.dev/icons). Browse the site, then use the icon's name: `<i data-lucide="mail" class="h-5 w-5"></i>`. Size with `h-*`/`w-*`, colour with `text-*` (`text-accent` is the amber). Icons are drawn when the page loads, so add them in the HTML, not from your own scripts after load.

## Look and feel

- **Accent colour:** `accent` in `assets/js/tailwind-config.js`. Used for the active nav item, small labels and card icons.
- **Fonts:** names are in `tailwind-config.js` (`display`, `sans`, `mono`). To switch a font, drop its `.woff2` into `assets/fonts/`, add an `@font-face` at the top of `style.css`, then change the name in `tailwind-config.js`.
- **Glass panel** (`.glass` in `style.css`): `inset: 32px` is the gap to the screen edge, the `0.035` in `background` is the tint (higher = more opaque), and `blur(5px)` is how much the stars are softened.
- **Header glass** (`.glass-bar` in `style.css`): tint, border and highlights. The refraction strength is the two `scale="36"` and `scale="28"` values in `main.js`; set both to `0` to turn bending off. Real refraction works in Chrome, Edge and other Chromium browsers; Safari and Firefox fall back to a plain frosted blur.
- **Spacing and type size:** Tailwind classes in the HTML. Bigger gaps: raise `mt-32` (section gap) or `pt-20`. Bigger headings: `text-6xl md:text-8xl` on the `<h1>`. See the [Tailwind docs](https://tailwindcss.com/docs) for class names.

## Notes

- `data/projects.json`, `data/bookmarks.json` and `data/links.json` are empty and **not read by any page yet**. For now, bookmarks and links are written directly in their HTML pages. If you want a long bookmarks list, I can wire the page to render from the JSON (or from a Raindrop export).
- Tailwind loads from a CDN (`cdn.tailwindcss.com`), so styling needs an internet connection. Fonts and icons are self-hosted.
- Lines starting with `<!--` are comments; they do not show on the page.
