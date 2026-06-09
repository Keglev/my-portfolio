// Verifies that the Experience section renders all job entries from translated locale data,
// covering heading count, job titles, dates, and summaries.
import React from 'react';
import { render, screen } from '@testing-library/react';
import Experience from '../../components/Experience/Experience';

// Mock i18n translations for predictable output
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => {
    const map = {
      'experience.jobExperiences': 'Work Experience',
      'experienceSection.experience1.title': 'Frontend Developer',
      'experienceSection.experience1.date': 'Jan 2020 - Present',
      'experienceSection.experience1.summary': 'Building UIs with React',

      'experienceSection.experience2.title': 'Backend Developer',
      'experienceSection.experience2.date': '2018 - 2019',
      'experienceSection.experience2.summary': 'APIs and data modeling',

      'experienceSection.experience3.title': 'Fullstack Engineer',
      'experienceSection.experience3.date': '2016 - 2018',
      'experienceSection.experience3.summary': 'End-to-end feature delivery',

      'experienceSection.experience4.title': 'Intern',
      'experienceSection.experience4.date': '2015',
      'experienceSection.experience4.summary': 'Supported engineering tasks',

      'experienceSection.experience5.title': 'Consultant',
      'experienceSection.experience5.date': '2014',
      'experienceSection.experience5.summary': 'Advised on architecture',

      'experienceSection.experience6.title': 'Research Assistant',
      'experienceSection.experience6.date': '2013',
      'experienceSection.experience6.summary': 'Algorithm research',
    };
    return map[key] !== undefined ? map[key] : key;
  } }),
}));

describe('Experience component', () => {
  it('renders section heading and six entries', () => {
    render(<Experience />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Work Experience');

    const entries = screen.getAllByRole('heading', { level: 3 });
    expect(entries).toHaveLength(6);
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Backend Developer')).toBeInTheDocument();
  });

  it('renders dates and summaries for entries', () => {
    render(<Experience />);
    expect(screen.getByText('Jan 2020 - Present')).toBeInTheDocument();
    expect(screen.getByText('APIs and data modeling')).toBeInTheDocument();
    expect(screen.getByText('Algorithm research')).toBeInTheDocument();
  });
});
