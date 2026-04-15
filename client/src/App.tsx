import { Routes, Route, Link } from 'react-router-dom';
import IssueForm from './features/issue-submission/IssueForm';

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">Map</Link> | <Link to="/report">Report Issue</Link> |{' '}
        <Link to="/staff/login">Staff Login</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Public Map</h1>} />
        <Route path="/report" element={<IssueForm />} />
        <Route path="/staff/login" element={<h1>Staff Login</h1>} />
        <Route path="/staff/issues" element={<h1>Issue List</h1>} />
        <Route path="/staff/issues/:id" element={<h1>Issue Detail</h1>} />
        <Route path="/admin/users" element={<h1>User Management</h1>} />
      </Routes>
    </div>
  );
}
