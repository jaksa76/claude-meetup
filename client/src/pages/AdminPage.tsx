import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface StaffAccount {
  id: string;
  username: string;
  role: string;
  active: number;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [loadError, setLoadError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
    loadAccounts();
  }, [user, loading, navigate]);

  function loadAccounts() {
    fetch('/api/admin/staff', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load accounts');
        return r.json();
      })
      .then(setAccounts)
      .catch(() => setLoadError('Could not load staff accounts.'));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setFormError(body.error ?? 'Failed to create account');
      } else {
        setFormSuccess(`Account "${body.username}" created successfully.`);
        setUsername('');
        setPassword('');
        loadAccounts();
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1 className="admin-title">Admin Panel</h1>
        <div className="admin-header-actions">
          <span className="admin-user">Logged in as <strong>{user?.username}</strong></span>
          <button className="admin-logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-section" data-testid="create-account-form">
          <h2 className="admin-section-title">Create Employee Account</h2>
          <form onSubmit={handleCreate} className="admin-form">
            <div className="admin-form-row">
              <label className="field-label" htmlFor="new-username">Username</label>
              <input
                id="new-username"
                className="field-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="min 3 characters"
                required
              />
            </div>
            <div className="admin-form-row">
              <label className="field-label" htmlFor="new-password">Password</label>
              <input
                id="new-password"
                className="field-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="min 8 characters"
                required
              />
            </div>
            {formError && <p className="form-error" data-testid="form-error">{formError}</p>}
            {formSuccess && <p className="form-success" data-testid="form-success">{formSuccess}</p>}
            <button className="submit-btn" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create account'}
            </button>
          </form>
        </section>

        <section className="admin-section" data-testid="staff-list">
          <h2 className="admin-section-title">Staff Accounts</h2>
          {loadError && <p className="form-error">{loadError}</p>}
          {accounts.length === 0 && !loadError && (
            <p className="admin-empty">No accounts found.</p>
          )}
          {accounts.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id}>
                    <td>{acc.username}</td>
                    <td><span className={`role-badge role-${acc.role}`}>{acc.role}</span></td>
                    <td><span className={acc.active ? 'status-active' : 'status-inactive'}>{acc.active ? 'Active' : 'Inactive'}</span></td>
                    <td>{new Date(acc.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
