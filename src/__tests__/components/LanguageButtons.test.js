import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Provide a mock function we can control per-test
jest.mock('react-i18next', () => ({ useTranslation: jest.fn() }));
const { useTranslation } = require('react-i18next');

describe('LanguageButtons component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows active language based on i18n.language', () => {
    useTranslation.mockReturnValue({
      i18n: { language: 'de', changeLanguage: jest.fn() },
      t: (k) => (k === 'language.english' ? 'English' : 'German'),
    });

    const LanguageButtons = require('../../components/LanguageButtons/LanguageButtons').default;
    render(<LanguageButtons />);

    expect(screen.getByText('German')).toHaveClass('active');
    expect(screen.getByText('English')).not.toHaveClass('active');
  });

  it('calls changeLanguage and activates English on click', () => {
    const changeMock = jest.fn();
    useTranslation.mockReturnValue({
      i18n: { language: 'de', changeLanguage: changeMock },
      t: (k) => (k === 'language.english' ? 'English' : 'German'),
    });

    const LanguageButtons = require('../../components/LanguageButtons/LanguageButtons').default;
    render(<LanguageButtons />);

    const enBtn = screen.getByText('English');
    expect(enBtn).not.toHaveClass('active');
    fireEvent.click(enBtn);
    expect(changeMock).toHaveBeenCalledWith('en');
    expect(enBtn).toHaveClass('active');
  });

  it('defaults to German when no language is set', () => {
    useTranslation.mockReturnValue({
      i18n: { language: undefined, changeLanguage: jest.fn() },
      t: (k) => (k === 'language.english' ? 'English' : 'German'),
    });

    const LanguageButtons = require('../../components/LanguageButtons/LanguageButtons').default;
    render(<LanguageButtons />);

    expect(screen.getByText('German')).toHaveClass('active');
    expect(screen.getByText('English')).not.toHaveClass('active');
  });
});
