import { useState, useRef } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export default function IssueForm() {
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError('');
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setPhoto(null);
      return;
    }
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setPhotoError('Only JPEG and PNG images are allowed.');
      setPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhotoError('Photo must be 5 MB or smaller.');
      setPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setPhoto(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState('submitting');
    setErrorMessage('');

    const body = new FormData();
    body.append('description', description);
    body.append('latitude', latitude);
    body.append('longitude', longitude);
    if (photo) body.append('photo', photo);

    try {
      const res = await fetch('/api/issues', { method: 'POST', body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error ?? `Server error (${res.status})`);
        setFormState('error');
        return;
      }
      const data = await res.json();
      setTrackingCode(data.trackingCode);
      setFormState('success');
    } catch {
      setErrorMessage('Network error — please try again.');
      setFormState('error');
    }
  }

  if (formState === 'success') {
    return (
      <div style={{ padding: '1rem' }}>
        <h2>Issue submitted</h2>
        <p>Your tracking code:</p>
        <code style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{trackingCode}</code>
        <p>Save this code to check the status of your report.</p>
        <button onClick={() => {
          setFormState('idle');
          setDescription('');
          setLatitude('');
          setLongitude('');
          setPhoto(null);
          setTrackingCode('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}>
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '480px' }}>
      <h2>Report an Issue</h2>

      {/* Photo upload */}
      <div>
        <label htmlFor="photo" style={{ display: 'block', marginBottom: '0.25rem' }}>
          Photo (optional, JPEG or PNG, max 5 MB)
        </label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png"
          ref={fileInputRef}
          onChange={handlePhotoChange}
        />
        {photo && (
          <img
            src={URL.createObjectURL(photo)}
            alt="Preview"
            style={{ marginTop: '0.5rem', maxWidth: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px' }}
          />
        )}
        {photoError && <p style={{ color: 'red', margin: '0.25rem 0 0' }}>{photoError}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" style={{ display: 'block', marginBottom: '0.25rem' }}>
          Description <span aria-hidden>*</span>
        </label>
        <textarea
          id="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4096}
          rows={4}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {/* Location */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="latitude" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Latitude <span aria-hidden>*</span>
          </label>
          <input
            id="latitude"
            type="number"
            step="any"
            required
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="longitude" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Longitude <span aria-hidden>*</span>
          </label>
          <input
            id="longitude"
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {formState === 'error' && (
        <p style={{ color: 'red' }}>{errorMessage}</p>
      )}

      <button type="submit" disabled={formState === 'submitting'}>
        {formState === 'submitting' ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  );
}
