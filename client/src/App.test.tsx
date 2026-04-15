import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// PublicMap initialises Leaflet which cannot run in jsdom — use a stub
vi.mock('./features/public-map/PublicMap', () => ({
  default: () => <h1>Public Map</h1>,
}));

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
