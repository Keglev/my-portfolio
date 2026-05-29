/**
 * Smoke tests for the App component.
 * Verifies that the application renders without crashing
 * and that key top-level content is present in the DOM.
 */
import { render, screen } from '@testing-library/react';
import App from './App';

// Confirm the main heading is rendered — indicates a successful App mount.
test('renders main heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /Carlos Keglevich/i });
  expect(heading).toBeInTheDocument();
});
