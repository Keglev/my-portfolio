import React from 'react';
import { render, screen } from '@testing-library/react';
import Legal from '../../components/Legal/Legal';

jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const { useTranslation } = require('react-i18next');

describe('Legal component', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders impressum and datenschutz headings and HTML content', () => {
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

    // The provided HTML strings should render their inner text
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });
});
