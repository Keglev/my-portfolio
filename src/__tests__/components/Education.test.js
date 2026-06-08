import React from 'react';
import { render, screen } from '@testing-library/react';
import Education from '../../components/Education/Education';

// Mock translations with mixed present/empty values to exercise conditional rendering
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => {
    const map = {
      'educationSection.heading': 'Education',
      'educationSection.entry1.title': 'BSc Computer Science',
      'educationSection.entry1.institution': 'University A',
      'educationSection.entry1.note': 'Graduated with honors',

      'educationSection.entry2.title': 'MSc Software Engineering',
      'educationSection.entry2.institution': '', // intentionally empty
      'educationSection.entry2.note': 'Thesis on distributed systems',

      'educationSection.entry3.title': 'PhD Computer Science',
      'educationSection.entry3.institution': 'Institute C',
      'educationSection.entry3.note': '', // intentionally empty

      'educationSection.entry4.title': 'Diploma in DevOps',
      'educationSection.entry4.institution': '',
      'educationSection.entry4.note': '',
    };
    return map[key] !== undefined ? map[key] : key;
  } }),
}));

describe('Education component', () => {
  it('renders heading and all entry titles', () => {
    render(<Education />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Education');
    expect(screen.getByText('BSc Computer Science')).toBeInTheDocument();
    expect(screen.getByText('MSc Software Engineering')).toBeInTheDocument();
    expect(screen.getByText('PhD Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Diploma in DevOps')).toBeInTheDocument();
  });

  it('conditionally renders institution and note paragraphs', () => {
    render(<Education />);

    // entry1 has institution & note
    expect(screen.getByText('University A')).toBeInTheDocument();
    expect(screen.getByText('Graduated with honors')).toBeInTheDocument();

    // entry2 has no institution but has note
    expect(screen.getByText('Thesis on distributed systems')).toBeInTheDocument();

    // entry3 has institution but no note
    expect(screen.getByText('Institute C')).toBeInTheDocument();

  });
});
