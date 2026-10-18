// Injects the shared site header into the glass panel and renders Lucide icons.
// Each page loads this script with data-root (path back to the site root) and
// data-page (nav item to highlight).
(function () {
  var script = document.currentScript;
  var root = script.dataset.root || "./";
  var page = script.dataset.page;
  var glass = document.querySelector(".glass");

  var items = [
    ["home", "Home", ""],
    ["blog", "Writing", "blog/"],
    ["projects", "Projects", "projects/"],
    ["bookmarks", "Bookmarks", "bookmarks/"],
    ["links", "Links", "links/"],
  ];

  var links = items.map(function (i) {
    var on = i[0] === page;
    return '<a href="' + root + i[2] + '"' + (on ? ' aria-current="page"' : "") +
      ' class="' + (on ? "text-accent" : "text-white/70 hover:text-white") + '">' + i[1] + "</a>";
  }).join("");

  var header = document.createElement("header");
  header.className = "glass-bar sticky top-4 z-10 mx-4 mt-4 flex flex-col gap-3 rounded-3xl px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-full md:mx-10 md:px-8";
  header.innerHTML =
    '<a href="' + root + '" title="Anurag Priyam Sahay" aria-label="Anurag Priyam Sahay, home" class="font-display text-xl font-medium tracking-[0.14em] text-white">AEPS</a>' +
    '<nav aria-label="Main" class="flex items-center gap-6 overflow-x-auto font-mono text-xs uppercase tracking-widest">' + links +
    '<a href="https://github.com/anuragpriyams-beep" aria-label="GitHub" class="text-white/70 hover:text-white"><i data-lucide="github" class="h-4 w-4"></i></a>' +
    "</nav>";
  glass.prepend(header);

  if (window.lucide) lucide.createIcons();

  // ---------- refraction ----------
  // A displacement map the exact size and shape of the bar: pixels near the rim are
  // pushed inward (strongest at the edge, easing to zero `BEZEL` px in), so whatever
  // scrolls under the bar bends like a glass lens right along the boundary.
  // Channels: R = horizontal, G = vertical shift, 128 = no shift.
  var BEZEL = 24;     // px from the rim over which the lens bends
  var MAX_SHIFT = 18; // px of displacement right at the rim

  function buildMap(w, h, r) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var ctx = c.getContext("2d");
    var img = ctx.createImageData(w, h);
    var d = img.data;
    var hw = w / 2, hh = h / 2, bx = hw - r, by = hh - r;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var px = x + 0.5 - hw, py = y + 0.5 - hh;
        var qx = Math.abs(px) - bx, qy = Math.abs(py) - by;
        var dist = r - (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0));
        var nx, ny; // outward normal of the rounded rectangle
        if (qx > 0 && qy > 0) {
          var l = Math.hypot(qx, qy) || 1;
          nx = Math.sign(px) * qx / l;
          ny = Math.sign(py) * qy / l;
        } else if (qx > qy) { nx = Math.sign(px); ny = 0; }
        else { nx = 0; ny = Math.sign(py); }
        var t = Math.min(Math.max(dist / BEZEL, 0), 1);
        var m = (1 - t) * (1 - t);
        var i = (y * w + x) * 4;
        d[i] = 128 - 127 * nx * m;     // inward = -normal
        d[i + 1] = 128 - 127 * ny * m;
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  var holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  holder.innerHTML =
    '<svg width="0" height="0"><filter id="bar-refract" filterUnits="userSpaceOnUse" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">' +
    '<feImage x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + (MAX_SHIFT * 2) + '" xChannelSelector="R" yChannelSelector="G"/>' +
    "</filter></svg>";
  document.body.appendChild(holder);
  var filterEl = holder.querySelector("filter");
  var imageEl = holder.querySelector("feImage");
  var lastSize = "";

  function updateMap() {
    var w = Math.round(header.offsetWidth), h = Math.round(header.offsetHeight);
    if (!w || !h) return;
    var radius = Math.min(parseFloat(getComputedStyle(header).borderTopLeftRadius) || 0, h / 2, w / 2);
    var key = w + "x" + h + "r" + Math.round(radius);
    if (key === lastSize) return;
    lastSize = key;
    filterEl.setAttribute("width", w);
    filterEl.setAttribute("height", h);
    imageEl.setAttribute("width", w);
    imageEl.setAttribute("height", h);
    imageEl.setAttribute("href", buildMap(w, h, radius));
  }
  updateMap();
  if (window.ResizeObserver) new ResizeObserver(updateMap).observe(header);
  else window.addEventListener("resize", updateMap);

  // ---------- adaptive nav colour ----------
  // Nav labels are white. When a light image scrolls under a label, switch that label
  // to dark text so it stays readable. (Text and dark areas under the bar are handled
  // by the bar's own tint and blur.)
  var samples = new WeakMap();

  function sampler(img) {
    var s = samples.get(img);
    if (s) return s;
    try {
      var w = 48, h = Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth));
      var c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      var ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      ctx.getImageData(0, 0, 1, 1); // throws if the canvas is tainted (e.g. file://)
      s = { ctx: ctx, w: w, h: h };
    } catch (e) {
      s = { bad: true };
    }
    samples.set(img, s);
    return s;
  }

  // average relative luminance (0 dark .. 1 light) of the part of img behind rect
  function luminanceBehind(img, rect) {
    if (!img.complete || !img.naturalWidth) return 0;
    var s = sampler(img);
    if (s.bad) return 0;
    var ir = img.getBoundingClientRect();
    var x0 = Math.max(0, Math.floor((rect.left - ir.left) / ir.width * s.w));
    var x1 = Math.min(s.w, Math.ceil((rect.right - ir.left) / ir.width * s.w));
    var y0 = Math.max(0, Math.floor((rect.top - ir.top) / ir.height * s.h));
    var y1 = Math.min(s.h, Math.ceil((rect.bottom - ir.top) / ir.height * s.h));
    if (x1 <= x0 || y1 <= y0) return 0;
    var data = s.ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    var sum = 0, n = 0;
    for (var i = 0; i < data.length; i += 4) {
      var a = data[i + 3] / 255;
      var lum = 0.2126 * Math.pow(data[i] / 255, 2.2) + 0.7152 * Math.pow(data[i + 1] / 255, 2.2) + 0.0722 * Math.pow(data[i + 2] / 255, 2.2);
      sum += lum * a;
      n++;
    }
    return n ? sum / n : 0;
  }

  var targets = Array.prototype.slice.call(header.querySelectorAll("a"));

  function adapt() {
    targets.forEach(function (a) {
      var r = a.getBoundingClientRect();
      var stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      var img = null;
      for (var i = 0; i < stack.length; i++) {
        if (header.contains(stack[i])) continue;
        if (stack[i].tagName === "IMG") img = stack[i];
        break; // topmost thing behind the bar
      }
      // the bar's dark tint dims what is behind it, so compare against the dimmed value
      var light = img ? luminanceBehind(img, r) * 0.6 + 0.04 > 0.2 : false;
      if (light) a.setAttribute("data-tone", "light");
      else a.removeAttribute("data-tone");
    });
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; adapt(); });
  }
  glass.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  document.addEventListener("load", schedule, true); // images finishing late
  schedule();
})();
