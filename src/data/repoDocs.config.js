/**
 * Curated documentation links for the "Project documentation" (RepoDocs) section.
 *
 * Single source of truth, replacing the previous runtime fetch of
 * public/projects.json plus README/AST parsing. Every URL here is a real,
 * author-published documentation page (GitHub Pages), verified against each
 * repository's README, so links do not break and stale/duplicate projects can
 * no longer leak in.
 *
 * To add or change a link, edit this file — no fetch pipeline or token needed.
 *
 * @typedef {Object} RepoDocLink
 * @property {string} titleEn  Link label in English.
 * @property {string} titleDe  Link label in German.
 * @property {string} url      Absolute URL to the published documentation page.
 *
 * @typedef {Object} RepoDocEntry
 * @property {string} slug         Stable id (matches the project card slug).
 * @property {string} displayName  Product name shown as the card heading.
 * @property {RepoDocLink[]} links Documentation links for this project.
 */

/** @type {RepoDocEntry[]} */
const repoDocs = [
  {
    slug: 'smartsupplypro',
    displayName: 'SmartSupplyPro',
    links: [
      { titleEn: 'Documentation hub', titleDe: 'Dokumentations-Hub', url: 'https://keglev.github.io/inventory-service/' },
      { titleEn: 'API reference', titleDe: 'API-Referenz', url: 'https://keglev.github.io/inventory-service/backend/api/index.html' },
      { titleEn: 'Architecture overview', titleDe: 'Architektur-Überblick', url: 'https://keglev.github.io/inventory-service/backend/architecture/overview.html' },
      { titleEn: 'Backend test coverage', titleDe: 'Backend-Testabdeckung', url: 'https://keglev.github.io/inventory-service/backend/coverage/index.html' },
    ],
  },
  {
    slug: 'stockease',
    displayName: 'StockEase',
    links: [
      { titleEn: 'Documentation hub', titleDe: 'Dokumentations-Hub', url: 'https://keglev.github.io/stockease/' },
      { titleEn: 'API reference', titleDe: 'API-Referenz', url: 'https://keglev.github.io/stockease/api-docs.html' },
      { titleEn: 'Architecture & security', titleDe: 'Architektur & Sicherheit', url: 'https://keglev.github.io/stockease/architecture/security.html' },
      { titleEn: 'Test coverage', titleDe: 'Testabdeckung', url: 'https://keglev.github.io/stockease/coverage/index.html' },
      { titleEn: 'Frontend documentation', titleDe: 'Frontend-Dokumentation', url: 'https://keglev.github.io/frontend/' },
    ],
  },
];

export default repoDocs;
