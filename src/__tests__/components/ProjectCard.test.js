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
});
