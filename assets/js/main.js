// Injects the shared site header. Each page loads this script with
// data-root (path back to the site root) and data-page (nav item to highlight).
(function () {
  var script = document.currentScript;
  var root = script.dataset.root || "./";
  var page = script.dataset.page;

  var items = [
    ["home", "Home", ""],
    ["blog", "Blog", "blog/"],
    ["projects", "Projects", "projects/"],
    ["bookmarks", "Bookmarks", "bookmarks/"],
    ["links", "Links", "links/"],
  ];

  var links = items.map(function (i) {
    var current = i[0] === page ? ' aria-current="page"' : "";
    return '<a href="' + root + i[2] + '"' + current + ">" + i[1] + "</a>";
  }).join("");

  var header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML =
    '<a class="brand" href="' + root + '">Anurag Priyam Sahay</a>' +
    '<nav aria-label="Main">' + links + "</nav>";
  document.body.prepend(header);
})();
