import { Routes, Route, Link } from 'react-router-dom';
import IssueForm from './features/issue-submission/IssueForm';
import PublicMap from './features/public-map/PublicMap';

export default function App() {
  return (
    <>
      <nav className="app-nav">
        <Link to="/">Map</Link>
        <span className="app-nav-divider" aria-hidden />
        <Link to="/report">Report Issue</Link>
        <span className="app-nav-divider" aria-hidden />
        <Link to="/staff/login">Staff Login</Link>
      </nav>
      <Routes>
        <Route path="/" element={<PublicMap />} />
        <Route path="/report" element={<IssueForm />} />
        <Route path="/staff/login" element={<h1>Staff Login</h1>} />
        <Route path="/staff/issues" element={<h1>Issue List</h1>} />
        <Route path="/staff/issues/:id" element={<h1>Issue Detail</h1>} />
        <Route path="/admin/users" element={<h1>User Management</h1>} />
      </Routes>
    </>
  );
}
