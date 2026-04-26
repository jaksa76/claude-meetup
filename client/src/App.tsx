import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReportForm from './ReportForm';
import { useAuth } from './AuthContext';

interface Issue {
  id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  lat: number;
  lng: number;
  status: string;
  votes: number;
}

const STATUS_COLOR: Record<string, string> = {
  new: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
};

function formatStatus(status: string) {
  return status.replace('_', ' ');
}

function buildPopupHtml(issue: Issue) {
  return `
    <div class="issue-popup">
      ${issue.photo_url ? `<img class="issue-photo" src="${issue.photo_url}" alt="Issue photo" />` : ''}
      <h3>${issue.title}</h3>
      ${issue.description ? `<p class="issue-desc">${issue.description}</p>` : ''}
      <div class="issue-meta">
        <span class="status ${issue.status}">${formatStatus(issue.status)}</span>
        <button class="vote-btn" data-vote-id="${issue.id}" data-votes="${issue.votes}">
          ▲ <span class="vote-count">${issue.votes}</span> vote${issue.votes !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  `;
}

function makeIcon(status: string) {
  const color = STATUS_COLOR[status] ?? '#6b7280';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22S28 23.5 28 14C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

// Bar, Montenegro centre coordinates
const BAR_LAT = 42.0939;
const BAR_LNG = 19.1003;

export default function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [formCoords, setFormCoords] = useState<{ lat: number; lng: number; approximate: boolean } | null>(null);
  const { user, logout } = useAuth();

  function openReportForm() {
    if (!navigator.geolocation) {
      setFormCoords({ lat: BAR_LAT, lng: BAR_LNG, approximate: true });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setFormCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, approximate: false }),
      ()  => setFormCoords({ lat: BAR_LAT, lng: BAR_LNG, approximate: true }),
      { timeout: 8000, maximumAge: 60000 },
    );
  }

  function loadIssues() {
    fetch('/api/issues')
      .then(r => r.json())
      .then(setIssues);
  }

  useEffect(loadIssues, []);

  useEffect(() => {
    function handleVoteClick(e: MouseEvent) {
      const btn = (e.target as Element).closest<HTMLButtonElement>('[data-vote-id]');
      if (!btn || btn.disabled) return;
      const id = btn.dataset.voteId!;
      btn.disabled = true;
      btn.textContent = '▲ voting…';
      fetch(`/api/issues/${id}/vote`, { method: 'POST' })
        .then(r => r.json())
        .then((updated: Issue) => {
          const count = updated.votes;
          btn.innerHTML = `▲ <span class="vote-count">${count}</span> vote${count !== 1 ? 's' : ''}`;
          btn.disabled = false;
        })
        .catch(() => {
          btn.textContent = '▲ error';
          btn.disabled = false;
        });
    }
    document.addEventListener('click', handleVoteClick);
    return () => document.removeEventListener('click', handleVoteClick);
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current).setView([BAR_LAT, BAR_LNG], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstance.current);
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const markers = issues.map(issue =>
      L.marker([issue.lat, issue.lng], { icon: makeIcon(issue.status) })
        .addTo(map)
        .bindPopup(buildPopupHtml(issue), { maxWidth: 280 }),
    );
    return () => { markers.forEach(m => m.remove()); };
  }, [issues]);

  return (
    <>
      <nav className="app-nav">
        <strong style={{ marginRight: 'auto', fontSize: '0.95rem' }}>Bar – Citizen Issues</strong>
        {user ? (
          <>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{user.username}</span>
            <div className="app-nav-divider" />
            <button
              onClick={logout}
              style={{ background: 'none', border: 'none', fontSize: '0.875rem', color: '#3a3a3c', cursor: 'pointer', padding: '0.35rem 0.65rem', borderRadius: '6px' }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login">Staff login</Link>
        )}
      </nav>
      <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div ref={mapRef} className="map-container" />
        <button className="fab" onClick={openReportForm} aria-label="Report an issue">＋</button>
      </div>
      {formCoords && (
        <ReportForm
          lat={formCoords.lat}
          lng={formCoords.lng}
          approximate={formCoords.approximate}
          onClose={() => setFormCoords(null)}
          onSubmitted={() => { setFormCoords(null); loadIssues(); }}
        />
      )}
    </>
  );
}
