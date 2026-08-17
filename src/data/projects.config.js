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
    slug: 'maintenance-assistant',
    displayName: 'KI-Maintenance Assistant',
    summaryEn:
      'A retrieval-augmented (RAG) assistant that answers maintenance questions from a plant\'s own protocols. Every answer cites the source protocol, and answers without a grounded source are explicitly labelled. Role-filtered answers server-side, cross-language retrieval (a German question can cite an English protocol), and EU-only processing via the IONOS AI Model Hub in Berlin. Java 21 / Spring Boot backend with pgvector in PostgreSQL, Angular 22 frontend, Keycloak IAM, rendered end-to-end tests with Playwright.',
    summaryDe:
      'Ein Retrieval-Augmented-Generation-(RAG)-Assistent, der Wartungsfragen aus den Protokollen der eigenen Anlage beantwortet. Jede Antwort nennt das Quellprotokoll, und Antworten ohne belegte Quelle werden ausdrücklich gekennzeichnet. Serverseitig rollengefilterte Antworten, sprachübergreifende Suche (eine deutsche Frage kann ein englisches Protokoll zitieren) und ausschließlich EU-Verarbeitung über den IONOS AI Model Hub in Berlin. Java-21-/Spring-Boot-Backend mit pgvector in PostgreSQL, Angular-22-Frontend, Keycloak-IAM, gerenderte End-to-End-Tests mit Playwright.',
    tech: [
      'Java 21',
      'Spring Boot 4',
      'RAG / pgvector',
      'IONOS AI (EU)',
      'Keycloak / OAuth2 PKCE',
      'PostgreSQL',
      'Flyway',
      'Angular 22',
      'TypeScript',
      'Playwright',
      'Testcontainers',
      'GitHub Actions',
    ],
    images: {
      dark: { en: '/projects/maintenance-assistant-dark-en.png', de: '/projects/maintenance-assistant-dark-de.png' },
      light: { en: '/projects/maintenance-assistant-light-en.png', de: '/projects/maintenance-assistant-light-de.png' },
    },
    repoUrl: 'https://github.com/Keglev/maintenance-assistant',
    repoUrlSecondary: null,
    liveUrl: 'https://maintenance.smartsupply.com.de/',
    docsUrl: 'https://keglev.github.io/maintenance-assistant/',
    apiUrl: 'https://maintenance.smartsupply.com.de/swagger-ui/index.html',
    docLinks: [
      { titleEn: 'Architecture (arc42)', titleDe: 'Architektur (arc42)', url: 'https://keglev.github.io/maintenance-assistant/architecture/' },
      { titleEn: 'Decision records (ADRs)', titleDe: 'Entscheidungsdokumente (ADRs)', url: 'https://keglev.github.io/maintenance-assistant/adr/' },
      { titleEn: 'Frontend API reference', titleDe: 'Frontend-API-Referenz', url: 'https://keglev.github.io/maintenance-assistant/frontend/api-docs/index.html' },
    ],
    featured: true,
  },
  {
    slug: 'stockease',
    displayName: 'Bestandskontrolle',
    summaryEn:
      'Full merchandise-cycle inventory management for small businesses (repository: StockEase): products, suppliers and customers, purchase and sales invoices, an append-only stock-movement ledger, audit trail and reporting with CSV export. A modular monolith (Spring Modulith) whose module boundaries are verified on every build; stock is booked event-driven inside the invoice-closing transaction, so an overselling close rolls back entirely. Angular 22 frontend, bilingual EN/DE at runtime; 619 backend tests against real PostgreSQL via Testcontainers, 916 frontend tests at 99% statement coverage.',
    summaryDe:
      'Bestandsverwaltung über den vollständigen Warenzyklus für kleine Unternehmen (Repository: StockEase): Produkte, Lieferanten und Kunden, Ein- und Verkaufsrechnungen, ein Append-only-Lagerbewegungsjournal, Änderungshistorie und Berichte mit CSV-Export. Ein modularer Monolith (Spring Modulith), dessen Modulgrenzen bei jedem Build geprüft werden; Lagerbewegungen werden ereignisgesteuert innerhalb der Rechnungsabschluss-Transaktion gebucht — ein Abschluss über Bestand rollt vollständig zurück. Angular-22-Frontend, zweisprachig DE/EN zur Laufzeit; 619 Backend-Tests gegen echtes PostgreSQL via Testcontainers, 916 Frontend-Tests mit 99 % Statement-Coverage.',
    tech: [
      'Java 21',
      'Spring Boot 4',
      'Spring Modulith',
      'Spring Security / JWT',
      'PostgreSQL',
      'Flyway',
      'Testcontainers',
      'Angular 22',
      'TypeScript',
      'Angular Material',
      'Vitest',
      'Docker',
      'GitHub Actions',
    ],
    images: {
      dark: { en: '/projects/stockease-dark-en.png', de: '/projects/stockease-dark-de.png' },
      light: { en: '/projects/stockease-light-en.png', de: '/projects/stockease-light-de.png' },
    },
    repoUrl: 'https://github.com/Keglev/stockease',
    repoUrlSecondary: null,
    liveUrl: 'https://bestandskontrolle.vercel.app/',
    docsUrl: 'https://keglev.github.io/stockease/',
    apiUrl: 'https://keglev.github.io/stockease/backend/api/index.html',
    docLinks: [
      { titleEn: 'Architecture (arc42)', titleDe: 'Architektur (arc42)', url: 'https://keglev.github.io/stockease/backend/architecture/overview.html' },
      { titleEn: 'Decision records (39 ADRs)', titleDe: 'Entscheidungsdokumente (39 ADRs)', url: 'https://keglev.github.io/stockease/decisions/index.html' },
      { titleEn: 'Frontend API reference', titleDe: 'Frontend-API-Referenz', url: 'https://keglev.github.io/stockease/frontend/api/index.html' },
    ],
    featured: true,
  },
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
      { titleEn: 'Architecture (arc42)', titleDe: 'Architektur (arc42)', url: 'https://keglev.github.io/inventory-service/backend/architecture/overview.html' },
      { titleEn: 'Backend test coverage', titleDe: 'Backend-Testabdeckung', url: 'https://keglev.github.io/inventory-service/backend/coverage/index.html' },
    ],
    featured: true,
  },
];

export default projects;
