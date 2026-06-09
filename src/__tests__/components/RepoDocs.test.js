// Verifies RepoDocs across all supported documentation data shapes: structured repoDocs,
// legacy docsLink, AST-based detection, placeholder state, language switching, and
// raw.githubusercontent.com link rewriting.
import React from 'react';
import { render, screen } from '@testing-library/react';
import RepoDocs from '../../components/RepoDocs/RepoDocs';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const { useTranslation } = require('react-i18next');

const STRUCTURED_DOCS_DATA = [
  {
    name: 'structured',
    repoDocs: {
      apiDocumentation: {
        title: 'API docs',
        title_de: 'API-Doku',
        link: 'https://raw.githubusercontent.com/user/repo/main/api.md',
      },
      architectureOverview: {
        title: 'Architecture',
        title_de: 'Architektur',
        link: 'https://raw.githubusercontent.com/user/repo/main/arch.md',
      },
      productionUrl: {
        title: 'Production',
        title_de: 'Produktion',
        link: 'https://example.com/prod',
      },
      testing: {
        coverage: [
          { title: 'Coverage', title_de: 'Abdeckung', link: 'https://raw.githubusercontent.com/user/repo/main/cov.md' },
          { title: 'External', title_de: 'Extern', link: 'https://example.com/cov2' },
        ],
      },
    },
  },
  {
    name: 'legacy',
    docsLink: 'https://raw.githubusercontent.com/user/repo/main/legacy.md',
  },
  {
    name: 'legacy-plain',
    docsLink: 'https://example.com/legacy.md',
  },
  {
    name: 'docs-api',
    docs: { apiDocumentation: { link: 'https://docs.example/api' } },
  },
  {
    name: 'docs-doc',
    docs: { documentation: { link: 'https://docs.example/doc' } },
  },
];

const TITLE_SELECTION_DATA = [
  { name: 'docs-title-de', docsTitle_de: 'Eigener Titel', docsLink: 'https://example.com/de' },
  { name: 'docs-title-en', docsTitle: 'Custom Title', docsLink: 'https://example.com/en' },
  {
    name: 'repo-api-title',
    repoDocs: { apiDocumentation: { title: 'API Title', link: 'https://example.com/api' } },
  },
  {
    name: 'repo-arch-title',
    repoDocs: { architectureOverview: { title: 'Architecture Title', link: 'https://example.com/arch' } },
  },
  {
    name: 'docs-api-title',
    docs: { apiDocumentation: { title: 'Docs API Title', link: 'https://example.com/docs-api' } },
  },
  {
    name: 'docs-doc-title',
    docs: { documentation: { title: 'Docs Title', link: 'https://example.com/docs' } },
  },
  {
    name: 'ast-title',
    _ast: { children: [{ type: 'heading', children: [{ value: 'Architecture docs' }] }] },
  },
  {
    name: 'text-title',
    text: 'This repo contains documentation and API integration notes',
  },
];

describe('RepoDocs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders the empty state when fetch fails', async () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    global.fetch.mockResolvedValue({ ok: false, json: async () => [] });

    render(<RepoDocs />);

    expect(await screen.findByText('noRepoDocs')).toBeInTheDocument();
  });

  it('renders the empty state when fetch throws', async () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    global.fetch.mockRejectedValue(new Error('network'));

    render(<RepoDocs />);

    expect(await screen.findByText('noRepoDocs')).toBeInTheDocument();
  });

  it('filters out repos that only have a summary and no documentation structure', async () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ([
        { name: 'summary-only', summary: 'just a summary', docsTitle_de: 'Open an issue' },
        { name: 'real-repo', repoDocs: { placeholder: { title: 'Title', description: 'Desc' } } },
      ]),
    });

    render(<RepoDocs />);

    expect(await screen.findByText('real-repo')).toBeInTheDocument();
    expect(screen.queryByText('summary-only')).toBeNull();
  });

  it('renders the German placeholder title and description when locale is de', async () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'de' } });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          name: 'placeholder-repo',
          repoDocs: {
            placeholder: {
              title: 'Under construction',
              title_de: 'Unter Konstruktion',
              description: 'English description',
              description_de: 'Deutsche Beschreibung',
            },
          },
        },
      ]),
    });

    render(<RepoDocs />);

    expect(await screen.findByText('placeholder-repo')).toBeInTheDocument();
    expect(screen.getByText('Unter Konstruktion')).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.tagName === 'P' && element.textContent?.includes('Deutsche Beschreibung'))
    ).toBeInTheDocument();
  });

  it('detects repos with AST children or plain text as documentation candidates', async () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          name: 'ast-repo',
          _ast: { children: [{ type: 'heading', children: [{ value: 'API documentation' }] }] },
        },
        {
          name: 'text-repo',
          text: 'This repo has architecture documentation and API integration notes',
        },
      ]),
    });

    render(<RepoDocs />);

    expect(await screen.findByText('ast-repo')).toBeInTheDocument();
    expect(screen.getByText('text-repo')).toBeInTheDocument();
  });

  it('renders repoDocs sections with German-locale titles when locale is de', async () => {
    useTranslation.mockReturnValue({
      t: (k) => ({ viewDocs: 'View docs', urlLabel: 'URL' }[k] || k),
      i18n: { language: 'de' },
    });
    global.fetch.mockResolvedValue({ ok: true, json: async () => STRUCTURED_DOCS_DATA });

    render(<RepoDocs />);

    expect(await screen.findByText('structured')).toBeInTheDocument();
    expect(screen.getByText('API-Doku')).toBeInTheDocument();
    expect(screen.getByText('Architektur')).toBeInTheDocument();
    expect(screen.getByText('Produktion')).toBeInTheDocument();
    expect(screen.getByText('Abdeckung')).toBeInTheDocument();
    expect(screen.getByText('docs-api')).toBeInTheDocument();
    expect(screen.getByText('docs-doc')).toBeInTheDocument();
  });

  it('rewrites raw.githubusercontent.com links to github.com/blob links across all link shapes', async () => {
    useTranslation.mockReturnValue({
      t: (k) => ({ viewDocs: 'View docs', urlLabel: 'URL' }[k] || k),
      i18n: { language: 'de' },
    });
    global.fetch.mockResolvedValue({ ok: true, json: async () => STRUCTURED_DOCS_DATA });

    render(<RepoDocs />);

    expect(await screen.findByText('structured')).toBeInTheDocument();

    const viewDocsLinks = screen.getAllByRole('link', { name: 'View docs' });
    expect(viewDocsLinks).toHaveLength(6);
    expect(viewDocsLinks[0]).toHaveAttribute('href', 'https://github.com/user/repo/blob/main/api.md');
    expect(viewDocsLinks[1]).toHaveAttribute('href', 'https://github.com/user/repo/blob/main/arch.md');
    expect(viewDocsLinks[2]).toHaveAttribute('href', 'https://github.com/user/repo/blob/main/cov.md');
    expect(viewDocsLinks[3]).toHaveAttribute('href', 'https://example.com/cov2');
    expect(viewDocsLinks[4]).toHaveAttribute('href', 'https://github.com/user/repo/blob/main/legacy.md');
    expect(viewDocsLinks[5]).toHaveAttribute('href', 'https://example.com/legacy.md');
    expect(screen.getByRole('link', { name: 'URL' })).toHaveAttribute('href', 'https://example.com/prod');
  });

  it('selects the correct display title based on the available docs metadata shape', async () => {
    useTranslation.mockReturnValue({ t: (k) => k, i18n: { language: 'en' } });
    global.fetch.mockResolvedValue({ ok: true, json: async () => TITLE_SELECTION_DATA });

    render(<RepoDocs />);

    expect(await screen.findByText('docs-title-de')).toBeInTheDocument();
    expect(screen.getByText('docs-title-en')).toBeInTheDocument();
    expect(screen.getByText('repo-api-title')).toBeInTheDocument();
    expect(screen.getByText('repo-arch-title')).toBeInTheDocument();
    expect(screen.getByText('docs-api-title')).toBeInTheDocument();
    expect(screen.getByText('docs-doc-title')).toBeInTheDocument();
    expect(screen.getByText('ast-title')).toBeInTheDocument();
    expect(screen.getByText('text-title')).toBeInTheDocument();
  });
});
