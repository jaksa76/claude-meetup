import { useRef, useState } from 'react';

interface Props {
  lat: number;
  lng: number;
  approximate: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  onAdjustLocation: () => void;
  hidden?: boolean;
}

export default function ReportForm({ lat, lng, approximate, onClose, onSubmitted, onAdjustLocation, hidden }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Please select a photo.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); return; }

    const body = new FormData();
    body.append('photo', file);
    body.append('title', title.trim());
    if (description.trim()) body.append('description', description.trim());
    if (phone.trim()) body.append('phone', phone.trim());
    body.append('lat', String(lat));
    body.append('lng', String(lng));

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/issues', { method: 'POST', body });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Submission failed.');
        return;
      }
      onSubmitted();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="report-overlay" onClick={onClose} style={hidden ? { display: 'none' } : undefined}>
      <div className="report-panel" onClick={e => e.stopPropagation()}>
        <div className="report-header">
          <h2>Report an Issue</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="photo-picker"
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
          >
            {preview
              ? <img src={preview} alt="Preview" className="photo-preview" />
              : <span className="photo-placeholder">📷 Tap to add photo</span>
            }
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            style={{ display: 'none' }}
            data-testid="photo-input"
          />

          <label className="field-label" htmlFor="issue-title">Title</label>
          <input
            id="issue-title"
            className="field-input"
            type="text"
            placeholder="Brief description of the problem"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
          />

          <label className="field-label" htmlFor="issue-description">Description <span className="field-optional">(optional)</span></label>
          <textarea
            id="issue-description"
            className="field-input field-textarea"
            placeholder="More details about the problem…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
          />

          <label className="field-label" htmlFor="issue-phone">Phone number <span className="field-optional">(optional)</span></label>
          <input
            id="issue-phone"
            className="field-input"
            type="tel"
            placeholder="+382 67 123 456"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <p className="field-hint">We'll send you an SMS when your report is resolved.</p>

          <div className="location-row">
            <p className="location-tag" data-testid="location-tag">
              {approximate
                ? '⚠ Using approximate location (GPS unavailable)'
                : `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
            </p>
            <button
              type="button"
              className="adjust-location-btn"
              data-testid="adjust-location-btn"
              onClick={onAdjustLocation}
            >
              {approximate ? 'Set on map' : 'Change'}
            </button>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
