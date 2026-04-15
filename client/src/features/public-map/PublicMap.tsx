import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchOpenIssues } from './api';
import './PublicMap.css';

// Bar, Montenegro
const BAR_CENTER: [number, number] = [42.0924, 19.096];
const DEFAULT_ZOOM = 13;

function makePin(): L.DivIcon {
  return L.divIcon({
    className: 'issue-pin',
    html: '<div class="issue-pin-dot"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

export default function PublicMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current).setView(BAR_CENTER, DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    fetchOpenIssues()
      .then((issues) => {
        issues.forEach((issue) => {
          const date = new Date(issue.createdAt).toLocaleDateString();
          L.marker([issue.latitude, issue.longitude], { icon: makePin() })
            .addTo(map)
            .bindPopup(
              `<div class="map-popup">
                <strong>${issue.category ?? 'Issue'}</strong>
                <span class="map-popup-status">${issue.status.replace('_', ' ')}</span>
                <span class="map-popup-date">${date}</span>
              </div>`,
            );
        });
      })
      .catch(() => setError('Could not load issues. Please refresh.'));

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="public-map-page">
      <h1 className="sr-only">Public Map</h1>
      {error && (
        <div role="alert" className="map-error">
          {error}
        </div>
      )}
      <div
        ref={containerRef}
        data-testid="map-container"
        className="public-map-container"
        aria-label="Map of reported issues"
      />
    </div>
  );
}
