// Injects the shared site header into the glass panel and renders Lucide icons.
// Each page loads this script with data-root (path back to the site root) and
// data-page (nav item to highlight).
(function () {
  var script = document.currentScript;
  var root = script.dataset.root || "./";
  var page = script.dataset.page;

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
      ' class="transition-colors ' + (on ? "text-accent" : "text-white/70 hover:text-white") + '">' + i[1] + "</a>";
  }).join("");

  // Refraction map: displaces pixels near the bar's edges so content beneath bends
  // like a glass lens. Two passes (horizontal, then vertical); 128 = no displacement.
  function map(horizontal) {
    var grad = horizontal
      ? '<linearGradient id="g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="rgb(255,128,128)"/><stop offset=".08" stop-color="rgb(128,128,128)"/><stop offset=".92" stop-color="rgb(128,128,128)"/><stop offset="1" stop-color="rgb(0,128,128)"/></linearGradient>'
      : '<linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgb(128,255,128)"/><stop offset=".3" stop-color="rgb(128,128,128)"/><stop offset=".7" stop-color="rgb(128,128,128)"/><stop offset="1" stop-color="rgb(128,0,128)"/></linearGradient>';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="64" preserveAspectRatio="none"><defs>' + grad +
      '</defs><rect width="400" height="64" fill="url(#g)"/></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  var filter = document.createElement("div");
  filter.setAttribute("aria-hidden", "true");
  filter.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  filter.innerHTML =
    '<svg width="0" height="0"><filter id="bar-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
    '<feImage href="' + map(true) + '" preserveAspectRatio="none" result="mx"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="mx" scale="36" xChannelSelector="R" yChannelSelector="G" result="d1"/>' +
    '<feImage href="' + map(false) + '" preserveAspectRatio="none" result="my"/>' +
    '<feDisplacementMap in="d1" in2="my" scale="28" xChannelSelector="R" yChannelSelector="G"/>' +
    "</filter></svg>";
  document.body.appendChild(filter);

  var header = document.createElement("header");
  header.className = "glass-bar sticky top-4 z-10 mx-4 mt-4 flex flex-col gap-3 rounded-3xl px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-full md:mx-10 md:px-8";
  header.innerHTML =
    '<a href="' + root + '" class="font-display text-xl tracking-tight text-white">Anurag Priyam Sahay</a>' +
    '<nav aria-label="Main" class="flex items-center gap-6 overflow-x-auto font-mono text-xs uppercase tracking-widest">' + links +
    '<a href="https://github.com/anuragpriyams-beep" aria-label="GitHub" class="text-white/70 transition-colors hover:text-white"><i data-lucide="github" class="h-4 w-4"></i></a>' +
    "</nav>";
  document.querySelector(".glass").prepend(header);

  if (window.lucide) lucide.createIcons();
})();
