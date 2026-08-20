import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PiggyBank } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(form.email, form.password);
    setLoading(false);
    if (res.success) navigate('/dashboard');
    else setError(res.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mb-3">
            <PiggyBank size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-gray-500">Log in to your Personal Finance Manager</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="label !mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">Forgot password?</Link>
            </div>
            <input
              type="password"
              required
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner size={16} className="text-white" /> : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account? <Link to="/register" className="text-primary-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
