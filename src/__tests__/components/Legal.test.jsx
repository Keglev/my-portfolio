/**
 * @file Legal.test.js
 * @module src/__tests__/components/Legal
 * @testing components/Legal/Legal.js
 * @description Contract test for the Legal section: Impressum and
 * Datenschutz headings render, and their dangerouslySetInnerHTML content
 * (developer-authored HTML from the locale files, per Legal.js's header)
 * is injected correctly.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Legal from '../../components/Legal/Legal';

vi.mock('react-i18next', () => ({ useTranslation: vi.fn() }));
import { useTranslation } from 'react-i18next';

describe('Legal', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render the Impressum and Datenschutz headings with their injected HTML content when Legal mounts', () => {
    useTranslation.mockReturnValue({
      t: (k) => {
        if (k === 'legal.impressumHeading') return 'Impressum';
        if (k === 'legal.datenschutzHeading') return 'Datenschutz';
        if (k === 'legal.impressumContent') return '<p>Impressum <strong>Details</strong></p>';
        if (k === 'legal.datenschutzContent') return '<p>Datenschutz <em>Info</em></p>';
        return k;
      },
    });

    render(<Legal />);

    expect(screen.getByRole('heading', { name: 'Impressum' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Datenschutz' })).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });
});
