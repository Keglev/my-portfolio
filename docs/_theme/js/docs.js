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
// exists. Only the landing and the ch01 overview page are translated today,
// so any other page routes DE to the German landing rather than a missing
// -de file. Done at runtime to avoid wiring a per-page twin URL through the
// build.
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
  } else if (file === "overview.html") {
    enableBoth();
    en.href = path; de.href = dir + "overview.de.html"; current(en);
  } else if (file === "overview.de.html") {
    enableBoth();
    en.href = dir + "overview.html"; de.href = path; current(de);
  } else {
    // English-only page: there is no German twin, so EN stays active and DE
    // falls back to the German landing rather than a 404 -- it is left
    // navigable (not aria-disabled) because a landing fallback is always a
    // valid destination, unlike the reference theme's per-section case.
    enableBoth();
    en.href = path;
    de.href = base + "/index-de.html";
    current(en);
  }
})();
