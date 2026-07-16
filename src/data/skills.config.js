/**
 * Curated skills for the Skills section, grouped the way recruiters scan:
 * backend first (the target role), then frontend, DevOps, and databases.
 * Labels are technology names (not translated); group titles are localized
 * via the `titleKey` i18n key.
 *
 * @typedef {Object} SkillGroup
 * @property {string} id        Stable id.
 * @property {string} titleKey  i18n key for the group heading.
 * @property {string[]} items   Technology labels shown as chips.
 */

/** @type {SkillGroup[]} */
const skillGroups = [
  {
    id: 'backend',
    titleKey: 'skillsSection.backend',
    items: ['Java 17/21', 'Spring Boot 3', 'Spring Security', 'Hibernate / JPA', 'REST APIs', 'OAuth2 / JWT', 'Microservices'],
  },
  {
    id: 'frontend',
    titleKey: 'skillsSection.frontend',
    items: ['React', 'TypeScript', 'JavaScript', 'Material UI', 'Tailwind CSS', 'Chart.js'],
  },
  {
    id: 'devops',
    titleKey: 'skillsSection.devops',
    items: ['Docker', 'Docker Compose', 'GitHub Actions (CI/CD)', 'JUnit 5', 'Mockito', 'JaCoCo', 'Maven'],
  },
  {
    id: 'databases',
    titleKey: 'skillsSection.databases',
    items: ['PostgreSQL', 'Oracle Autonomous DB', 'SQL', 'JDBC'],
  },
];

export default skillGroups;
