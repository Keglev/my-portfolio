/**
 * Curated project data for the Projects section.
 *
 * Single source of truth for the portfolio cards. It intentionally does NOT
 * fetch from the GitHub API at build time: cards are hand-curated for a
 * recruiter audience, so copy, titles, tech tags and images are controlled
 * here instead of inherited (with bugs) from README files. The old fetch
 * pipeline is retained only as an optional dev tool (`npm run refresh:projects`)
 * and is no longer on the render path.
 *
 * Copy is aligned to the CV (EN + DE) so the portfolio and CV tell the same
 * story. Summaries are plain text only — no Markdown, no leading section labels.
 *
 * Image convention:
 *   Put curated PNGs in `public/projects/` and reference them by absolute
 *   public path. Resolves the same under CRA and Vite and never breaks the
 *   build if a file is missing — ProjectCard falls back to an inline SVG
 *   placeholder on load error.
 *
 * @typedef {Object} ProjectConfig
 * @property {string} slug            Stable id / key (kebab-case).
 * @property {string} displayName     Human-facing product name shown as the card title.
 * @property {string} summaryEn       Plain-text English summary.
 * @property {string} summaryDe       Plain-text German summary.
 * @property {string[]} tech          Clean technology labels (already normalized).
 * @property {string} image           Absolute public path to the preview image.
 * @property {string} repoUrl         Primary GitHub repository URL.
 * @property {string|null} repoUrlSecondary  Optional second repo (e.g. separate frontend).
 * @property {string|null} liveUrl    Live application URL, or null if none.
 * @property {string|null} docsUrl    Documentation hub URL, or null if none.
 * @property {boolean} featured       Featured projects render first / larger.
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
    image: '/projects/smartsupplypro.png',
    repoUrl: 'https://github.com/Keglev/inventory-service',
    repoUrlSecondary: null,
    liveUrl: 'https://www.smartsupplypro.de',
    docsUrl: 'https://keglev.github.io/inventory-service/',
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
    image: '/projects/stockease.png',
    repoUrl: 'https://github.com/Keglev/stockease',
    repoUrlSecondary: 'https://github.com/Keglev/frontend',
    liveUrl: 'https://stockeasefrontend.vercel.app',
    docsUrl: 'https://keglev.github.io/stockease/',
    featured: true,
  },
];

export default projects;
