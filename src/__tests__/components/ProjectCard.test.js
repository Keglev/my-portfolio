import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from '../../components/Projects/ProjectCard';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const { useTranslation } = require('react-i18next');

describe('ProjectCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('displays German summary when available and does not show translation notice', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'de' } });
    const project = { name: 'p1', summary: 'en', summary_de: 'de' };
    render(<ProjectCard project={project} index={0} />);
    expect(screen.getByText('de')).toBeInTheDocument();
    expect(screen.queryByText(/Übersetzung fehlt/)).toBeNull();
  });

  it('shows translation notice when German selected but no German summary', () => {
    useTranslation.mockReturnValue({ t: (k) => (k === 'translationMissing' ? 'Übersetzung fehlt' : k), i18n: { language: 'de' } });
    const project = { name: 'p2', summary: 'en', summary_de: '' };
    const about = 'about me';
    const getAboutSection = () => about;
    render(<ProjectCard project={project} index={1} getAboutSection={getAboutSection} />);
    expect(screen.getByText('about me')).toBeInTheDocument();
    expect(screen.getByText(/Übersetzung fehlt/)).toBeInTheDocument();
  });

  it('renders the English summary and technology tags when no German summary is available', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = { name: 'p3', summary: 'english summary', object: { text: 'README content' } };
    const getTechnologyWords = jest.fn(() => ['React', 'Jest']);

    render(<ProjectCard project={project} index={3} getTechnologyWords={getTechnologyWords} />);

    expect(screen.getByText('english summary')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Jest')).toBeInTheDocument();
    expect(getTechnologyWords).toHaveBeenCalledWith('README content');
  });

  it('renders a skeleton when no summary or about section is available', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = { name: 'p4' };

    render(<ProjectCard project={project} index={4} />);

    expect(screen.getByRole('img', { name: 'p4 project' })).toBeInTheDocument();
    expect(screen.getByTestId('project-summary-skeleton')).toBeInTheDocument();
  });

  it('rewrites raw GitHub production links to github.com/blob links', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = {
      name: 'p5',
      summary: 'summary',
      repoDocs: {
        productionUrl: {
          link: 'https://raw.githubusercontent.com/keglev/p5/main/README.md'
        }
      }
    };

    render(<ProjectCard project={project} index={5} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/keglev/p5/blob/main/README.md');
  });

  it('handles image load and error fallback chain', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = { name: 'pimg', summary: 's' };
    const setLoaded = jest.fn();
    // provide getProjectImageUrl so handleError will set src to those urls
    const getProjectImageUrlMock = jest.fn((name, branch) => `https://example.com/${name}/${branch}/img.png`);
    render(<ProjectCard project={project} index={2} setLoadedImages={setLoaded} getProjectImageUrl={getProjectImageUrlMock} />);

    const img = screen.getByAltText('pimg project');
    // simulate load -> should call setLoadedImages
    fireEvent.load(img);
    expect(setLoaded).toHaveBeenCalled();

    // simulate first error -> should attempt main branch
    fireEvent.error(img);
    expect(img.getAttribute('data-try')).toBe('1');
    expect(getProjectImageUrlMock).toHaveBeenCalledWith('pimg', 'main');

    // simulate second error -> should attempt master and then call setLoadedImages
    fireEvent.error(img);
    expect(img.getAttribute('data-try')).toBe('2');
    expect(getProjectImageUrlMock).toHaveBeenCalledWith('pimg', 'master');
    expect(setLoaded).toHaveBeenCalled();
  });

  it('falls back to the placeholder image and transparent gif when no custom image helpers exist', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = { name: 'p6', summary: 's' };
    const generatePlaceholderSVGDataUrl = jest.fn(() => 'data:image/svg+xml;base64,PHN2Zy8+');

    render(
      <ProjectCard
        project={project}
        index={6}
        generatePlaceholderSVGDataUrl={generatePlaceholderSVGDataUrl}
      />
    );

    const img = screen.getByAltText('p6 project');
    img.setAttribute('data-try', '2');
    fireEvent.error(img);

    expect(img.getAttribute('data-try')).toBe('2');
    expect(generatePlaceholderSVGDataUrl).toHaveBeenCalledWith('p6');
    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
  });

  it('falls back to a transparent gif when no placeholder helper is available', () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    const project = { name: 'p7', summary: 's' };

    render(<ProjectCard project={project} index={7} />);

    const img = screen.getByAltText('p7 project');
    img.setAttribute('data-try', '2');
    fireEvent.error(img);

    expect(img.getAttribute('data-try')).toBe('2');
    expect(img.getAttribute('src')).toContain('data:image/gif;base64');
  });
});
