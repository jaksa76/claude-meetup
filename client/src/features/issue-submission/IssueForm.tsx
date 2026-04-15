import { useState, useRef } from 'react';
import './IssueForm.css';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Placeholder values until GPS (story 0005) and description (story 0004) are implemented
const PLACEHOLDER_LAT = '42.0924';
const PLACEHOLDER_LNG = '19.0960';
const PLACEHOLDER_DESC = 'Photo report';

export default function IssueForm() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError('');
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setPhotoError('Only JPEG and PNG images are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhotoError('Photo must be 5 MB or smaller.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setPhoto(file);
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState('submitting');
    setErrorMessage('');

    const body = new FormData();
    body.append('description', PLACEHOLDER_DESC);
    body.append('latitude', PLACEHOLDER_LAT);
    body.append('longitude', PLACEHOLDER_LNG);
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

  function reset() {
    setFormState('idle');
    setPhoto(null);
    setPhotoError('');
    setTrackingCode('');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="issue-form-page">
      <div className="issue-form-card">
        {formState === 'success' ? (
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h2>Report submitted</h2>
            <p>Your tracking code</p>
            <div className="tracking-code">{trackingCode}</div>
            <p>Save this code to check the status of your report.</p>
            <button className="another-btn" onClick={reset}>
              Submit another
            </button>
          </div>
        ) : (
          <>
            <h2>Report an Issue</h2>
            <p className="issue-form-subtitle">Add a photo of the problem you've spotted.</p>

            <form onSubmit={handleSubmit}>
              <div className={`photo-zone${photo ? ' has-photo' : ''}`}>
                <input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  aria-label="Upload a photo"
                />
                {photo ? (
                  <>
                    <img
                      className="photo-preview"
                      src={URL.createObjectURL(photo)}
                      alt="Preview of selected photo"
                    />
                    <div className="photo-preview-bar">
                      <span className="photo-preview-name">{photo.name}</span>
                      <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={removePhoto}
                        aria-label="Remove photo"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="photo-zone-icon" aria-hidden>📷</div>
                    <div className="photo-zone-label">Tap to add a photo</div>
                    <div className="photo-zone-hint">JPEG or PNG · max 5 MB</div>
                  </>
                )}
              </div>

              {photoError && (
                <p className="field-error" role="alert">
                  ⚠ {photoError}
                </p>
              )}

              {formState === 'error' && (
                <div className="form-error" role="alert">{errorMessage}</div>
              )}

              <button
                type="submit"
                className="submit-btn"
                disabled={formState === 'submitting'}
              >
                {formState === 'submitting' ? 'Submitting…' : 'Submit report'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
