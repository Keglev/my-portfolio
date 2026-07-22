/**
 * @file Contact.test.js
 * @module src/__tests__/components/Contact
 * @testing components/Contact/Contact.js
 * @description Contract tests for the Web3Forms-backed contact form:
 * consent gating of the submit button, successful submit posting the
 * expected payload and showing the success status, API/network failure
 * showing the error status, the clear button resetting all fields, and
 * the social-links order.
 *
 * Out of scope: Web3Forms' own API behavior. fetch is mocked; no network
 * call is ever made.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Contact from '../../components/Contact/Contact';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

const fill = () => {
  fireEvent.change(screen.getByLabelText('contactSection.name'), { target: { value: 'Max' } });
  fireEvent.change(screen.getByLabelText('contactSection.email'), { target: { value: 'max@firma.de' } });
  fireEvent.change(screen.getByLabelText('contactSection.message'), { target: { value: 'Hallo' } });
};

describe('Contact', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('should enable the submit button only when the consent checkbox is checked', () => {
    render(<Contact />);
    const submit = screen.getByRole('button', { name: 'contactSection.send' });

    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: 'contactSection.consent' }));

    expect(submit).toBeEnabled();
  });

  it('should post the form to Web3Forms and show the success status when the API call succeeds', async () => {
    global.fetch.mockResolvedValue({ json: async () => ({ success: true }) });
    render(<Contact />);
    fill();
    fireEvent.click(screen.getByRole('checkbox', { name: 'contactSection.consent' }));
    fireEvent.click(screen.getByRole('button', { name: 'contactSection.send' }));

    expect(await screen.findByRole('status')).toHaveTextContent('contactSection.success');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.web3forms.com/submit');
    const body = JSON.parse(opts.body);
    expect(body.name).toBe('Max');
    expect(body.email).toBe('max@firma.de');
    expect(body.message).toBe('Hallo');
  });

  it('should show the error status when the API reports failure', async () => {
    global.fetch.mockResolvedValue({ json: async () => ({ success: false }) });
    render(<Contact />);
    fill();
    fireEvent.click(screen.getByRole('checkbox', { name: 'contactSection.consent' }));
    fireEvent.click(screen.getByRole('button', { name: 'contactSection.send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('contactSection.error');
  });

  it('should show the error status when the request throws', async () => {
    global.fetch.mockRejectedValue(new Error('network'));
    render(<Contact />);
    fill();
    fireEvent.click(screen.getByRole('checkbox', { name: 'contactSection.consent' }));
    fireEvent.click(screen.getByRole('button', { name: 'contactSection.send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('contactSection.error');
  });

  it('should render the clear button and empty all fields when it is clicked', () => {
    render(<Contact />);

    expect(screen.getByRole('button', { name: 'contactSection.clear' })).toBeInTheDocument();

    fill();
    fireEvent.click(screen.getByRole('checkbox', { name: 'contactSection.consent' }));

    expect(screen.getByLabelText('contactSection.name')).toHaveValue('Max');
    expect(screen.getByLabelText('contactSection.consent')).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'contactSection.clear' }));

    expect(screen.getByLabelText('contactSection.name')).toHaveValue('');
    expect(screen.getByLabelText('contactSection.email')).toHaveValue('');
    expect(screen.getByLabelText('contactSection.message')).toHaveValue('');
    expect(screen.getByLabelText('contactSection.consent')).not.toBeChecked();
  });

  it('should render the social links in GitHub, LinkedIn, Xing, Email order when Contact mounts', () => {
    render(<Contact />);
    const socialLinks = screen.getAllByRole('link');

    expect(socialLinks.map((a) => a.getAttribute('aria-label'))).toEqual([
      'GitHub',
      'LinkedIn',
      'Xing',
      'Email',
    ]);
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/keglev');
  });

  describe('submit guards', () => {
    // The disabled submit button is the visible half of the consent gate; the
    // handler's own check is the half that actually holds. A form can still be
    // submitted with the Enter key while a disabled button is focused
    // elsewhere, so the guard below is what keeps a message from being sent
    // without consent -- a GDPR requirement, not a nicety.
    it('should not send the message when the form is submitted without consent', () => {
      render(<Contact />);
      fill();

      fireEvent.submit(screen.getByRole('form', { name: 'contactSection.title' }));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not show a status message when a submit is rejected for missing consent', () => {
      render(<Contact />);
      fill();

      fireEvent.submit(screen.getByRole('form', { name: 'contactSection.title' }));

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should send the message only once when the visitor submits again while the first send is in flight', async () => {
      // Double submission would deliver the same enquiry twice. The button is
      // disabled during send, but an Enter-key submit bypasses that.
      let resolveFetch;
      global.fetch.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
      render(<Contact />);
      fill();
      fireEvent.click(screen.getByRole('checkbox', { name: 'contactSection.consent' }));
      const form = screen.getByRole('form', { name: 'contactSection.title' });

      fireEvent.submit(form);
      fireEvent.submit(form);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      resolveFetch({ json: async () => ({ success: true }) });
      expect(await screen.findByRole('status')).toHaveTextContent('contactSection.success');
    });
  });
});
