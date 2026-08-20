import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <p className="text-5xl font-bold text-primary-600 mb-2">404</p>
    <p className="text-gray-500 mb-6">Page not found</p>
    <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
  </div>
);

export default NotFound;
