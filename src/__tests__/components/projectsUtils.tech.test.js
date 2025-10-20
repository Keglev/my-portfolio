import { getTechnologyWords } from '../../components/Projects/projectsUtils';

describe('getTechnologyWords', () => {
  test('extracts bold-only tokens from Tech Stack sample', () => {
  const sample = `## Tech Stack
### Backend
- **Java 17+** with **Spring Boot 3.5+**
- **Spring Security** (OAuth2 + Role-based Access Control)
- **Oracle Autonomous Database** (Free Tier with wallet connectivity)
- **REST APIs** documented via OpenAPI YAML specifications
- **Docker** containerization with multi-stage builds
- **JUnit 5** + **Mockito**  for comprehensive testing

### Frontend
- **React 19** + **TypeScript** for type-safe development
- **Material-UI (MUI)** for enterprise-grade component library
- **Vite** for fast development and optimized builds
- **Axios** for HTTP client with React Query for state management
- **React Router** for SPA navigation
- **Vitest** + **React Testing Library** for testing
- **TypeDoc** for documentation generation

### DevOps & Infrastructure
- **GitHub Actions** for automated CI/CD pipelines
- **Docker Compose** for local development environment
- **JaCoCo** + **GitHub Pages** for live test coverage reporting`;

    const expected = [
      'Java 17+',
      'Spring Boot 3.5+',
      'Spring Security',
      'Oracle Autonomous Database',
      'REST APIs',
      'Docker',
      'JUnit 5',
      'Mockito',
      'React 19',
      'TypeScript',
      'Material-UI',
      'Vite',
      'Axios',
      'React Router',
      'Vitest',
      'React Testing Library',
      'TypeDoc',
      'GitHub Actions',
      'Docker Compose',
      'JaCoCo',
      'GitHub Pages',
    ];

  expect(getTechnologyWords(sample)).toEqual(expected);
  });

  test('ignores malformed single-star tokens and extracts only proper **...** tokens', () => {
    const sample = '## Tech\n- **JUnit 5** + *Mockito**  for comprehensive testing\n## End';
    expect(getTechnologyWords(sample)).toEqual(['JUnit 5']);
  });
});
