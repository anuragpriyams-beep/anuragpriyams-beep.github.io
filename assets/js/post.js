// Renders a Markdown post (GFM + LaTeX math + inline HTML) into the page.
// Page contract (see blog/posts/*/index.html): an <article data-md="post.md"> inside
// .post-layout, an <aside class="toc-col">, and header elements #post-title / #post-meta.
// Pipeline: clean source -> protect code and math -> marked -> restore math (KaTeX)
// -> tidy the DOM (headings, TOC, images, tables, links). Design notes: DECISIONS.md.
(function () {
  var article = document.querySelector("article[data-md]");
  if (!article) return;

  var tocCol = document.querySelector(".toc-col");
  var titleEl = document.getElementById("post-title");
  var metaEl = document.getElementById("post-meta");

  article.innerHTML = '<p class="post-status">Loading…</p>';

  fetch(article.dataset.md)
    .then(function (r) {
      if (!r.ok) throw new Error(r.status + " " + r.statusText);
      return r.text();
    })
    .then(render)
    .catch(function (e) {
      article.innerHTML =
        '<p class="post-status">Could not load this post (' + e.message + "). " +
        "If you opened the file directly, serve the folder instead: <code>python -m http.server</code>.</p>";
    });

  // ---------- source preparation ----------

  function render(src) {
    src = src.replace(/\r\n?/g, "\n");

    // drafting notes live in HTML comments; they must never reach the page
    src = src.replace(/<!--[\s\S]*?-->/g, "");
    // stray asterisk left after a closing </figure>
    src = src.replace(/<\/figure>[ \t]*\*/g, "</figure>");

    // footnote definitions:  [^id]: text
    var defs = {};
    src = src.replace(/^\[\^([^\]]+)\]:[ \t]*(.*(?:\n(?: {2,}|\t).*)*)$/gm, function (_, id, text) {
      defs[id] = text.trim();
      return "";
    });

    // protect code spans/blocks, then math, from the Markdown parser
    var codes = [];
    function stash(re, s) {
      return s.replace(re, function (m) {
        codes.push(m);
        return "xxcodexx" + (codes.length - 1) + "xx";
      });
    }
    src = stash(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, src);
    src = stash(/`[^`\n]+`/g, src);

    var maths = [];
    function keep(tex, display) {
      maths.push({ tex: tex, display: display });
      return "xxmathxx" + (maths.length - 1) + "xx";
    }
    // display: $$ ... $$ (may span lines; strip blockquote markers inside)
    src = src.replace(/\$\$([\s\S]+?)\$\$/g, function (_, tex) {
      return keep(tex.replace(/^[ \t]*>[ \t]?/gm, ""), true);
    });
    // inline: $ ... $  - closing $ must not follow a space or precede a digit,
    // which keeps currency like "$833K ... $4.53M" from being read as math
    src = src.replace(/(?<![\\$])\$(?!\$)((?:\\.|[^$\\\n])+?)(?<!\s)\$(?!\d)/g, function (_, tex) {
      return keep(tex, false);
    });

    src = src.replace(/xxcodexx(\d+)xx/g, function (_, i) { return codes[+i]; });

    // ---------- Markdown -> HTML ----------
    var html = marked.parse(src, { gfm: true, breaks: false });

    // footnote references
    var order = [];
    html = html.replace(/\[\^([^\]]+)\]/g, function (_, id) {
      var n = order.indexOf(id) + 1;
      if (!n) { order.push(id); n = order.length; }
      return defs[id] !== undefined
        ? '<sup class="fn-ref" id="fnref-' + n + '"><a href="#fn-' + n + '">' + n + "</a></sup>"
        : '<sup class="fn-ref fn-missing" title="Footnote text not written yet">' + n + "</sup>";
    });
    var notes = order.filter(function (id) { return defs[id] !== undefined; });
    if (notes.length) {
      html += '<section class="footnotes"><h2 class="no-toc">Notes</h2><ol>' +
        order.map(function (id, i) {
          return defs[id] === undefined ? "" :
            '<li id="fn-' + (i + 1) + '">' + marked.parseInline(defs[id]) +
            ' <a class="fn-back" href="#fnref-' + (i + 1) + '" aria-label="Back to text">↩</a></li>';
        }).join("") + "</ol></section>";
    }

    // math back in, rendered by KaTeX
    var mathErrors = 0;
    html = html.replace(/xxmathxx(\d+)xx/g, function (_, i) {
      var m = maths[+i];
      var out = katex.renderToString(m.tex.trim(), {
        displayMode: m.display, throwOnError: false, strict: "ignore", trust: false,
      });
      if (out.indexOf("katex-error") !== -1) mathErrors++;
      return out;
    });

    article.innerHTML = html;
    tidy(mathErrors);
  }

  // ---------- DOM tidy-up ----------

  function tidy(mathErrors) {
    // inline styles from the draft hard-code colours and sizes; the stylesheet owns the look.
    // Keep intended image widths by moving them to the width attribute first.
    article.querySelectorAll("img").forEach(function (img) {
      var w = /width:\s*(\d+)px/.exec(img.getAttribute("style") || "");
      if (w && !img.getAttribute("width")) img.setAttribute("width", w[1]);
      img.loading = "lazy";
      img.decoding = "async";
    });
    // (KaTeX lays out math with inline styles, so leave everything inside .katex alone)
    article.querySelectorAll("[style]").forEach(function (el) {
      if (!el.closest(".katex")) el.removeAttribute("style");
    });

    // links: repair "[url](url)" pasted into href, open external links in a new tab
    article.querySelectorAll("a[href]").forEach(function (a) {
      var m = /^\[[^\]]*\]\(([^)]+)\)$/.exec(a.getAttribute("href"));
      if (m) a.setAttribute("href", m[1]);
      if (/^https?:/.test(a.getAttribute("href"))) {
        a.target = "_blank";
        a.rel = "noopener";
      }
    });

    // wide tables scroll inside their own box
    article.querySelectorAll("table").forEach(function (t) {
      var wrap = document.createElement("div");
      wrap.className = "table-wrap";
      t.parentNode.insertBefore(wrap, t);
      wrap.appendChild(t);
    });

    var headings = normalizeHeadings();
    buildToc(headings);
    fillHeader();

    document.body.dataset.rendered = "1";
    document.body.dataset.mathErrors = String(mathErrors);
  }

  // The draft mixes levels (e.g. "# 3 Rung 1" and "## 2.1 ..." and "## 2 Foundations").
  // Derive hierarchy from the section numbers: "3" -> h2, "3.1" -> h3, "3.1.1" -> h4.
  // Unnumbered headings go one level below the last numbered one, except the
  // references block, which keeps its own levels.
  function normalizeHeadings() {
    var list = [];
    var ctx = 1;
    var inRefs = false;
    var used = {};
    var first = true;

    Array.prototype.slice.call(article.querySelectorAll("h1,h2,h3,h4,h5,h6")).forEach(function (h) {
      if (h.classList.contains("no-toc")) return; // footnotes heading
      var orig = +h.tagName[1];
      var text = h.textContent.trim();

      if (first && orig === 1) { // document title
        first = false;
        titleEl.textContent = prettyTitle(text);
        document.title = prettyTitle(text);
        h.remove();
        return;
      }
      first = false;

      var num = /^(\d+(?:\.\d+)*)\.?\s+/.exec(text);
      var level;
      if (num) {
        level = num[1].split(".").length + 1;
        ctx = level;
        inRefs = false;
      } else if (/^references\b/i.test(text)) {
        level = 2; ctx = 2; inRefs = true;
      } else if (inRefs) {
        level = Math.max(orig, 3);
      } else {
        level = Math.max(orig, ctx + 1);
      }
      level = Math.min(level, 6);

      var el = document.createElement("h" + level);
      el.innerHTML = h.innerHTML;
      if (num) {
        // wrap the leading number so CSS can style it as a label
        var node = el.firstChild;
        if (node && node.nodeType === 3) {
          var rest = node.nodeValue.replace(/^\s*\d+(?:\.\d+)*\.?\s+/, "");
          var span = document.createElement("span");
          span.className = "sec-num";
          span.textContent = num[1];
          el.insertBefore(span, node);
          node.nodeValue = rest;
        }
      }

      var slug = slugify(text);
      if (used[slug]) slug += "-" + used[slug]++; else used[slug] = 1;
      el.id = slug;
      var a = document.createElement("a");
      a.className = "anchor";
      a.href = "#" + slug;
      a.setAttribute("aria-label", "Link to this section");
      a.textContent = "#";
      el.appendChild(a);

      h.replaceWith(el);
      if (!el.classList.contains("no-toc")) list.push({ el: el, level: level, text: text, num: num ? num[1] : "" });
    });
    return list;
  }

  // GitHub-style slug, so links like (#references-and-further-reading) work
  function slugify(t) {
    return t.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");
  }

  function prettyTitle(t) {
    if (t !== t.toUpperCase()) return t;
    var small = { and: 1, or: 1, of: 1, the: 1, a: 1, an: 1, in: 1, to: 1, vs: 1, for: 1 };
    return t.toLowerCase().split(" ").map(function (w, i) {
      return i && small[w] ? w : w.charAt(0).toUpperCase() + w.slice(1);
    }).join(" ");
  }

  // ---------- table of contents ----------

  function buildToc(headings) {
    if (!tocCol) return;
    var items = headings.filter(function (h) { return h.level <= 3; });
    if (items.length < 3) { tocCol.remove(); return; }

    var html = '<nav class="toc" aria-label="Contents"><details><summary>Contents</summary><ol>';
    items.forEach(function (h) {
      var label = h.num ? h.text.replace(/^\d+(?:\.\d+)*\.?\s+/, "") : h.text;
      html += '<li class="toc-l' + h.level + '"><a href="#' + h.el.id + '">' +
        (h.num ? '<span class="toc-num">' + h.num + "</span>" : "") +
        escapeHtml(label) + "</a></li>";
    });
    tocCol.innerHTML = html + "</ol></details></nav>";

    // always open on wide screens (the sidebar), collapsed on narrow ones
    var details = tocCol.querySelector("details");
    var wide = window.matchMedia("(min-width: 1024px)");
    function sync() { details.open = wide.matches; }
    sync();
    wide.addEventListener("change", sync);

    // highlight the section being read
    var links = {};
    tocCol.querySelectorAll("a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var scroller = document.querySelector(".glass");
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && links[e.target.id]) {
          if (current) current.classList.remove("active");
          current = links[e.target.id];
          current.classList.add("active");
        }
      });
    }, { root: scroller, rootMargin: "-15% 0px -75% 0px" });
    items.forEach(function (h) { io.observe(h.el); });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // ---------- header meta ----------

  function fillHeader() {
    if (!metaEl) return;
    var clone = article.cloneNode(true);
    clone.querySelectorAll(".katex, .katex-display").forEach(function (n) { n.remove(); });
    var words = (clone.textContent.match(/\S+/g) || []).length;
    var parts = [];
    if (article.dataset.date) parts.push(article.dataset.date);
    parts.push(Math.max(1, Math.round(words / 220)) + " min read");
    metaEl.textContent = parts.join("  ·  ");
  }
})();
