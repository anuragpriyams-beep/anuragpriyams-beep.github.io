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

  var header = document.createElement("header");
  header.className = "sticky top-0 z-10 flex flex-col gap-3 border-b border-white/10 px-8 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between md:px-16";
  header.innerHTML =
    '<a href="' + root + '" class="font-display text-xl tracking-tight text-white">Anurag Priyam Sahay</a>' +
    '<nav aria-label="Main" class="flex items-center gap-6 overflow-x-auto font-mono text-xs uppercase tracking-widest">' + links +
    '<a href="https://github.com/anuragpriyams-beep" aria-label="GitHub" class="text-white/70 transition-colors hover:text-white"><i data-lucide="github" class="h-4 w-4"></i></a>' +
    "</nav>";
  document.querySelector(".glass").prepend(header);

  if (window.lucide) lucide.createIcons();
})();
