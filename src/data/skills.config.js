/**
 * @file skills.config.js
 * @module data/skills.config
 * @summary Curated skills for the Skills section, grouped for recruiter scanning.
 * @enterprise Backend-first ordering is deliberate -- it's the target role,
 * so it needs to be seen first, with the KI/AI group placed second to
 * surface the RAG work early, then frontend, DevOps, and databases.
 * Labels are technology names (not translated); group titles and
 * descriptions resolve through i18n keys so the same data drives both
 * locales. Consumed exclusively by src/components/Skills/Skills.js.
 *
 * @typedef {Object} SkillGroup
 * @property {string} id        Stable id.
 * @property {string} titleKey  i18n key for the group heading.
 * @property {string[]} items   Technology labels shown as chips.
 * @property {string} descKey   i18n key for the one-line group description.
 */

/** @type {SkillGroup[]} */
const skillGroups = [
  {
    id: 'backend',
    titleKey: 'skillsSection.backend',
    descKey: 'skillsSection.backendDesc',
    items: ['Java 17/21', 'Spring Boot 4', 'Spring Modulith', 'Spring Security', 'Keycloak / OAuth2 / JWT', 'Hibernate / JPA', 'REST APIs', 'OpenAPI / Swagger', 'Flyway'],
  },
  {
    id: 'ai',
    titleKey: 'skillsSection.ai',
    descKey: 'skillsSection.aiDesc',
    items: ['RAG (Retrieval-Augmented Generation)', 'Vector search (pgvector)', 'Embeddings', 'LLM APIs (IONOS AI, OpenAI-compatible)'],
  },
  {
    id: 'frontend',
    titleKey: 'skillsSection.frontend',
    descKey: 'skillsSection.frontendDesc',
    items: ['Angular 22', 'React', 'TypeScript', 'JavaScript', 'Angular Material', 'Material UI', 'RxJS', 'i18next / ngx-translate', 'ECharts'],
  },
  {
    id: 'devops',
    titleKey: 'skillsSection.devops',
    descKey: 'skillsSection.devopsDesc',
    items: ['Docker', 'Docker Compose', 'GitHub Actions (CI/CD)', 'Maven', 'Vite', 'JUnit 5', 'Mockito', 'Testcontainers', 'Vitest', 'Playwright', 'JaCoCo'],
  },
  {
    id: 'databases',
    titleKey: 'skillsSection.databases',
    descKey: 'skillsSection.databasesDesc',
    items: ['PostgreSQL', 'pgvector', 'Oracle Autonomous DB', 'SQL', 'JDBC'],
  },
];

export default skillGroups;
