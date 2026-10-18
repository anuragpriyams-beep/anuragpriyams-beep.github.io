# Decisions: rendering Markdown posts

First post: `blog/posts/generative-vs-discriminative/` (from `College/Coding club/gendis/draft2.md`, copied verbatim to `post.md`). Everything below is a default I picked; change any of it.

## How posts are rendered

| Decision | Why | Trade-off |
|---|---|---|
| **Render in the browser** (`assets/js/post.js`) instead of a build step that generates HTML | Keeps the repo no-build: edit `post.md`, push, done. | Content is not in the HTML, so search engines and link previews see an empty page. Needs a server locally (`python -m http.server`); opening the file directly shows an error message. A build step (e.g. a small Node script) would fix both if it matters later. |
| **marked** for Markdown (GFM tables, HTML passthrough) and **KaTeX** for math, both self-hosted in `assets/js/vendor/` | The draft uses ~55 display equations, 59 table rows, raw HTML figures. KaTeX is fast and has no runtime dependency on a CDN. | About 600 KB of vendor files (KaTeX fonts are woff2 only, so very old browsers lack math fonts). |
| **Math is pulled out before Markdown runs**, then put back | Otherwise `_`, `*`, `\\` and `|` inside equations get eaten by Markdown or break tables. | `$...$` closing delimiter must not follow a space or precede a digit, so `$833K ... $4.53M` in a table stays currency. A lone `$` used as a dollar sign next to math may still need `\$`. |
| **HTML comments are stripped before parsing** | The draft keeps its "Verify" / "Judgement calls" notes and `CITE`/`CHECK` tags inside `<!-- -->`; they must never appear on the page. | Anything you leave in a comment is private only in the rendered page. It is still readable in `post.md` in the public repo. |
| **No HTML sanitizing** | You are the only author. | Do not render Markdown you did not write. |

## Structure and cleanup rules (all in `post.js`)

- **Title** comes from the first `# heading`. If it is ALL CAPS it is converted to Title Case ("Generative and Discriminative Algorithms").
- **Heading levels come from the section numbers**, because the draft mixes `#`, `##` and `###` inconsistently. `3` -> h2, `3.1` -> h3, `3.1.1` -> h4. Unnumbered headings sit one level below the last numbered one. "References and further reading" is h2 with its own sub-levels. The leading number is shown as a small amber mono label above the heading.
- **Heading ids** are GitHub-style slugs, so your own links like `(#references-and-further-reading)` work. Each heading gets a `#` link on hover.
- **Contents rail:** a sticky list of h2 and h3 sections on wide screens (highlights the section you are reading), a collapsed "Contents" box on phones.
- **Inline styles in the draft are removed** (hard-coded colours like `rgb(165,143,220)`, floats, pixel widths) so the stylesheet controls the look. `style="width: 350px"` on an image is kept as its `width`. Result: the floated figure in 3.5.4 is now centred like the others.
- **Repairs:** `href="[url](url)"` (Markdown pasted into an HTML attribute) is fixed to `url`; a stray `*` right after `</figure>` is dropped; external links open in a new tab; wide tables scroll inside their own box.
- **Footnotes:** `[^id]: text` definitions are supported (numbered, with back-links). Your two `[^1]`/`[^2]` references have no definitions yet, so they show as grey superscript numbers with a "not written yet" tooltip.
- **Reading time** is words / 220, math excluded (shown under the title). A date shows if the `<article>` has `data-date="..."`.

## Look

- Reading column 44rem, body DM Sans about 18px at 1.85 line height; headings Fraunces light with tight tracking; labels and table headers JetBrains Mono; amber accent only for numbers, bullets, active TOC item and link underlines.
- Blockquotes (your "Scene" and "Cross-entropy" boxes) are glass callouts with an amber left edge.
- Tables are hairline cards with mono uppercase headers; display math is centred and scrolls sideways if too wide.
- Images get a thin border, rounded corners and are dimmed slightly (`brightness(.94)`), because the white-background plots glare against the dark page.
- Section gaps are large (6rem before each h2) on purpose.

## Assets

- Only the 12 images the post uses were copied. Large ones were downsized, keeping the same file names so `post.md` is unchanged: the opening meme 4.7 MB -> 0.65 MB, `image-6.png` 5.3 MB -> 0.7 MB. The originals stay in your `gendis` folder.
- `blog/index.html` has one list row linking to the post (year "2026" is a placeholder). The home-page "Writing" list was not touched.

## Things in `post.md` you may want to fix (I did not change your text)

- Line ~186: `(p(X,y))` and `(p(y\mid X))` use parentheses, not `$...$`, so they print as raw text.
- Line ~1350: the paragraph ends with a stray `*` (it is shown literally).
- Typos: "Contstraints" (heading), "Califronia", "deternmine", "geniune", "disriminative" (that one is inside a comment).
- `[^1]` and `[^2]` have no footnote text.
- The "Verify" blocks are hidden only because they sit inside comments; delete them before publishing if you do not want them in the public repo.

## How to add another post

See `CUSTOMIZE.md`, "Add a blog post".
