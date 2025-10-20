import React from 'react';
import { render, screen } from '@testing-library/react';
import SidebarSocial from '../../../components/Sidebar/SidebarSocial';

describe('SidebarSocial', () => {
  it('renders social links with correct hrefs and aria-labels', () => {
    render(<SidebarSocial />);

    const gh = screen.getByRole('link', { name: /github/i });
    const li = screen.getByRole('link', { name: /linkedin/i });
    const xing = screen.getByRole('link', { name: /xing/i });
    const mail = screen.getByRole('link', { name: /email/i });

    expect(gh).toHaveAttribute('href', 'https://github.com/keglev');
    expect(li).toHaveAttribute('href', 'https://linkedin.com/in/carloskeglevich');
    expect(xing).toHaveAttribute('href', 'https://www.xing.com/profile/Carlos_Keglevich');
    expect(mail).toHaveAttribute('href', 'mailto:carlos.keglevich@gmail.com');
  });
});
