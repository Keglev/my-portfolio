/**
 * @file skills.config.js
 * @module data/skills.config
 * @summary Curated skills for the Skills section, grouped for recruiter scanning.
 * @enterprise Backend-first ordering is deliberate -- it's the target role,
 * so it needs to be seen first, then frontend, DevOps, and databases.
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
    items: ['Java 17/21', 'Spring Boot 3', 'Spring Security', 'Hibernate / JPA', 'REST APIs', 'OAuth2 / JWT', 'Microservices'],
  },
  {
    id: 'frontend',
    titleKey: 'skillsSection.frontend',
    descKey: 'skillsSection.frontendDesc',
    items: ['React', 'Angular', 'TypeScript', 'JavaScript', 'Material UI', 'Tailwind CSS', 'Chart.js'],
  },
  {
    id: 'devops',
    titleKey: 'skillsSection.devops',
    descKey: 'skillsSection.devopsDesc',
    items: ['Docker', 'Docker Compose', 'GitHub Actions (CI/CD)', 'JUnit 5', 'Mockito', 'JaCoCo', 'Maven'],
  },
  {
    id: 'databases',
    titleKey: 'skillsSection.databases',
    descKey: 'skillsSection.databasesDesc',
    items: ['PostgreSQL', 'Oracle Autonomous DB', 'SQL', 'JDBC'],
  },
];

export default skillGroups;
