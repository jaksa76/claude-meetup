import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Leaflet cannot run in jsdom — mock it before importing the component
vi.mock('leaflet', () => {
  const map = {
    setView: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  };
  const marker = {
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
  };
  const tileLayer = { addTo: vi.fn() };
  return {
    default: {
      map: vi.fn().mockReturnValue(map),
      tileLayer: vi.fn().mockReturnValue(tileLayer),
      marker: vi.fn().mockReturnValue(marker),
      divIcon: vi.fn().mockReturnValue({}),
    },
  };
});

vi.mock('./api', () => ({
  fetchOpenIssues: vi.fn().mockResolvedValue([
    {
      id: 'abc',
      latitude: 42.09,
      longitude: 19.09,
      status: 'open',
      category: 'Roads',
      createdAt: '2024-01-15T10:00:00.000Z',
    },
  ]),
}));

import PublicMap from './PublicMap';
import { fetchOpenIssues } from './api';
import L from 'leaflet';

describe('PublicMap', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the map container', () => {
    render(<PublicMap />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('has an accessible label on the map container', () => {
    render(<PublicMap />);
    expect(screen.getByLabelText('Map of reported issues')).toBeInTheDocument();
  });

  it('includes a visually-hidden heading', () => {
    render(<PublicMap />);
    expect(screen.getByText('Public Map')).toBeInTheDocument();
  });

  it('initialises the Leaflet map centered on Bar, Montenegro', () => {
    render(<PublicMap />);
    expect(L.map).toHaveBeenCalledWith(expect.any(HTMLElement));
    const mapMock = (L.map as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(mapMock.setView).toHaveBeenCalledWith([42.0924, 19.096], 13);
  });

  it('fetches open issues and places a marker for each', async () => {
    render(<PublicMap />);
    await waitFor(() => {
      expect(fetchOpenIssues).toHaveBeenCalledTimes(1);
      expect(L.marker).toHaveBeenCalledWith([42.09, 19.09], expect.any(Object));
    });
  });

  it('shows an error message when the fetch fails', async () => {
    (fetchOpenIssues as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('network'),
    );
    render(<PublicMap />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not load issues. Please refresh.',
      );
    });
  });
});
