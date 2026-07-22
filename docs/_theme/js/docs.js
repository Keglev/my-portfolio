// =============================================================================
// my-portfolio Docs — Runtime
// Theme toggle, active-link marking, and the runtime EN/DE language switch.
// Loaded on every generated docs page via footer.html.
// =============================================================================

// Single source of truth for the site's gh-pages path prefix -- kept as the
// one occurrence of this string in the theme (see ROBOT PROMPT P9 amendment:
// "make it ONE constant, not scattered").
var DOCS_BASE_PATH = "/my-portfolio";

// Storage key is intentionally distinct from src/context/ThemeContext.js's
// "portfolio-theme" (the live app's own key) so toggling theme on the docs
// site never reads or overwrites the app's stored preference.
var THEME_STORAGE_KEY = "portfolio-docs-theme";

// Theme toggle flips the attribute tokens.css keys off and persists the choice.
var toggle = document.querySelector(".theme-toggle");
if (toggle) {
  toggle.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch (e) {}
  });
}

// Mark the current page as active in the site header nav, avoiding per-page build logic.
(function () {
  var here = location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".site-header__nav a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href && href.replace(/index\.html$/, "") === here) {
      a.classList.add("active");
    }
  });
})();

// Language switch: point EN/DE at the current page's translated twin when one
// exists. Three pages are translated today -- the landing, the documentation
// index, and ch01 (01-introduction-and-goals). On every other page DE is
// shown disabled rather than pointed anywhere: sending a reader who asked for
// German to an unrelated English page (or to the landing, losing their place)
// is worse than telling them plainly that this page has no German version.
// Done at runtime to avoid wiring a per-page twin URL through the build.
(function () {
  var links = document.querySelectorAll(".lang-switch a");
  if (links.length < 2) return;
  var en = links[0], de = links[1];
  var base = DOCS_BASE_PATH;
  var path = location.pathname;
  var file = path.substring(path.lastIndexOf("/") + 1);
  var dir = path.substring(0, path.lastIndexOf("/") + 1);

  function current(active) {
    en.removeAttribute("aria-current");
    de.removeAttribute("aria-current");
    active.setAttribute("aria-current", "true");
  }

  function enableBoth() {
    en.removeAttribute("aria-disabled");
    en.removeAttribute("title");
    de.removeAttribute("aria-disabled");
    de.removeAttribute("title");
  }

  // The site landing is base/ or base/index.html specifically -- a deep
  // section index.html must not be mistaken for it.
  if (path === base + "/" || path === base + "/index.html") {
    enableBoth();
    en.href = base + "/"; de.href = base + "/index-de.html"; current(en);
  } else if (path === base + "/index-de.html") {
    enableBoth();
    en.href = base + "/"; de.href = base + "/index-de.html"; current(de);
  } else if (file === "docs-index.html") {
    enableBoth();
    en.href = path; de.href = dir + "docs-index.de.html"; current(en);
  } else if (file === "docs-index.de.html") {
    enableBoth();
    en.href = dir + "docs-index.html"; de.href = path; current(de);
  } else if (file === "01-introduction-and-goals.html") {
    enableBoth();
    en.href = path; de.href = dir + "01-introduction-and-goals.de.html"; current(en);
  } else if (file === "01-introduction-and-goals.de.html") {
    enableBoth();
    en.href = dir + "01-introduction-and-goals.html"; de.href = path; current(de);
  } else {
    // English-only page: there is no German twin, so EN stays active and DE
    // is shown disabled -- greyed, inert, and explaining itself on hover
    // (see .lang-switch a[aria-disabled] in components.css). Removing the
    // href is what actually blocks navigation; aria-disabled is what tells
    // assistive tech, and neither alone is enough.
    en.href = path;
    en.removeAttribute("aria-disabled");
    en.removeAttribute("title");
    de.removeAttribute("href");
    de.setAttribute("aria-disabled", "true");
    de.setAttribute("title", "Diese Seite ist nur auf Englisch verfügbar");
    current(en);
  }
})();
