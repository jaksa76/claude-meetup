import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App routing', () => {
  it('renders the public map on /', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(screen.getByText('Public Map')).toBeInTheDocument();
  });

  it('renders the report form on /report', () => {
    render(<MemoryRouter initialEntries={['/report']}><App /></MemoryRouter>);
    expect(screen.getByText('Report an Issue')).toBeInTheDocument();
  });
});
