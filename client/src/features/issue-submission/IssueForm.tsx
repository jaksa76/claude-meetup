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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError('');
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setPhotoError('Only JPEG and PNG images are allowed.');
      clearInputs();
      return;
    }
    if (file.size > MAX_BYTES) {
      setPhotoError('Photo must be 5 MB or smaller.');
      clearInputs();
      return;
    }
    setPhoto(file);
  }

  function clearInputs() {
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoError('');
    clearInputs();
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
    clearInputs();
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
              {/* Hidden inputs — one for camera, one for gallery */}
              <input
                data-testid="camera-input"
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                ref={cameraInputRef}
                onChange={handlePhotoChange}
                aria-label="Take a photo with camera"
                className="photo-hidden-input"
              />
              <input
                data-testid="gallery-input"
                type="file"
                accept="image/jpeg,image/png"
                ref={galleryInputRef}
                onChange={handlePhotoChange}
                aria-label="Choose a photo from gallery"
                className="photo-hidden-input"
              />

              {photo ? (
                <div className="photo-zone has-photo">
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
                </div>
              ) : (
                <div className="photo-choice">
                  <button
                    type="button"
                    className="photo-choice-btn"
                    onClick={() => cameraInputRef.current?.click()}
                    aria-label="Take a photo with your camera"
                  >
                    {/* Camera icon */}
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span>Take Photo</span>
                  </button>

                  <button
                    type="button"
                    className="photo-choice-btn"
                    onClick={() => galleryInputRef.current?.click()}
                    aria-label="Choose a photo from your gallery"
                  >
                    {/* Gallery / image icon */}
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Choose from Gallery</span>
                  </button>
                </div>
              )}

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
