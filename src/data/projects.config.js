/**
 * @file projects.config.js
 * @module data/projects.config
 * @summary Curated project data for the Projects section.
 * @enterprise Single source of truth for the portfolio cards; deliberately
 * NOT fetched from the GitHub API at build time (see ADR-006) so copy,
 * titles, tech tags, and images stay reviewer-controlled instead of
 * inherited -- bugs included -- from README drift. Copy is aligned to the
 * CV (EN + DE) so the portfolio and CV tell the same story. Summaries are
 * plain text only -- no Markdown, no leading section labels. Consumed
 * exclusively by src/components/Projects/Projects.js.
 *
 * Image convention:
 *   Put curated PNGs in `public/projects/` and reference them by absolute
 *   public path. Resolves the same under CRA and Vite and never breaks the
 *   build if a file is missing -- ProjectCard falls back to an inline SVG
 *   placeholder on load error.
 *
 * @typedef {Object} ProjectConfig
 * @property {string} slug            Stable id / key (kebab-case).
 * @property {string} displayName     Human-facing product name shown as the card title.
 * @property {string} summaryEn       Plain-text English summary.
 * @property {string} summaryDe       Plain-text German summary.
 * @property {string[]} tech          Clean technology labels (already normalized).
 * @property {Object} images          Preview images by theme then language, e.g. images.dark.en.
 * @property {string} repoUrl         Primary GitHub repository URL.
 * @property {string|null} repoUrlSecondary  Optional second repo (e.g. separate frontend).
 * @property {string|null} liveUrl    Live application URL, or null if none.
 * @property {string|null} docsUrl    Documentation hub URL, or null if none.
 * @property {boolean} featured       Featured projects render first / larger.
 * @property {string|null} apiUrl     Direct link to the published API reference, or null.
 * @property {Array<{titleEn: string, titleDe: string, url: string}>} docLinks  Secondary documentation links shown in a compact row.
 */

/** @type {ProjectConfig[]} */
const projects = [
  {
    slug: 'smartsupplypro',
    displayName: 'SmartSupplyPro',
    summaryEn:
      'A production full-stack system for supplier and inventory management. A 36-endpoint Spring Boot API with role-based access control (OAuth2 / Google authentication), weighted-average-cost inventory valuation, and automatic low-stock alerts, behind a bilingual (DE/EN) React interface. Full OpenAPI/Redoc documentation, 85%+ test coverage (JaCoCo), CI/CD, deployed on Fly.io with Oracle Autonomous DB.',
    summaryDe:
      'Ein produktives Full-Stack-System für Lieferanten- und Bestandsmanagement. Eine 36-Endpunkt-Spring-Boot-API mit rollenbasierter Zugriffssteuerung (OAuth2 / Google-Authentifizierung), Bestandsbewertung nach gewichteten Durchschnittskosten (WAC) und automatischen Benachrichtigungen bei Mindestbestand-Unterschreitung, hinter einer zweisprachigen (DE/EN) React-Oberfläche. Vollständige OpenAPI/Redoc-Dokumentation, über 85 % Testabdeckung (JaCoCo), CI/CD, Deployment auf Fly.io mit Oracle Autonomous DB.',
    tech: [
      'Java 17/21',
      'Spring Boot 3',
      'Spring Security',
      'OAuth2 / JWT',
      'Oracle Autonomous DB',
      'REST APIs',
      'React',
      'TypeScript',
      'Docker',
      'JUnit 5',
      'JaCoCo',
      'GitHub Actions',
    ],
    images: {
      dark: { en: '/projects/smartsupplypro-dark-en.png', de: '/projects/smartsupplypro-dark-de.png' },
      light: { en: '/projects/smartsupplypro-light-en.png', de: '/projects/smartsupplypro-light-de.png' },
    },
    repoUrl: 'https://github.com/Keglev/inventory-service',
    repoUrlSecondary: null,
    liveUrl: 'https://www.smartsupplypro.de',
    docsUrl: 'https://keglev.github.io/inventory-service/',
    apiUrl: 'https://keglev.github.io/inventory-service/backend/api/index.html',
    docLinks: [
      { titleEn: 'Architecture overview', titleDe: 'Architektur-Überblick', url: 'https://keglev.github.io/inventory-service/backend/architecture/overview.html' },
      { titleEn: 'Backend test coverage', titleDe: 'Backend-Testabdeckung', url: 'https://keglev.github.io/inventory-service/backend/coverage/index.html' },
    ],
    featured: true,
  },
  {
    slug: 'stockease',
    displayName: 'StockEase',
    summaryEn:
      'A full-stack inventory management tool for SMEs: a JWT-secured Spring Boot CRUD backend with PostgreSQL, inventory and supplier views, and CSV export for BI tools (Power BI, Tableau), paired with a React + TypeScript frontend. Serves as my reference project for documentation and test-coverage standards.',
    summaryDe:
      'Ein Full-Stack-Bestandsmanagement-Tool für KMU: ein JWT-gesichertes Spring-Boot-CRUD-Backend mit PostgreSQL, Bestands- und Lieferantenanzeige sowie CSV-Export für BI-Tools (Power BI, Tableau), kombiniert mit einem React-+-TypeScript-Frontend. Dient als mein Referenzprojekt für Dokumentations- und Testabdeckungsstandards.',
    tech: [
      'Java',
      'Spring Boot',
      'Spring Security',
      'JWT',
      'PostgreSQL',
      'Hibernate / JPA',
      'Maven',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'Vite',
    ],
    images: {
      dark: { en: '/projects/stockease-dark-en.png', de: '/projects/stockease-dark-de.png' },
      light: { en: '/projects/stockease-light-en.png', de: '/projects/stockease-light-de.png' },
    },
    repoUrl: 'https://github.com/Keglev/stockease',
    repoUrlSecondary: 'https://github.com/Keglev/frontend',
    liveUrl: 'https://stockeasefrontend.vercel.app',
    docsUrl: 'https://keglev.github.io/stockease/',
    apiUrl: 'https://keglev.github.io/stockease/api-docs.html',
    docLinks: [
      { titleEn: 'Architecture & security', titleDe: 'Architektur & Sicherheit', url: 'https://keglev.github.io/stockease/architecture/security.html' },
      { titleEn: 'Test coverage', titleDe: 'Testabdeckung', url: 'https://keglev.github.io/stockease/coverage/index.html' },
      { titleEn: 'Frontend documentation', titleDe: 'Frontend-Dokumentation', url: 'https://keglev.github.io/frontend/' },
    ],
    featured: true,
  },
];

export default projects;
