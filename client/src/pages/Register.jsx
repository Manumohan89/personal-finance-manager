import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PiggyBank } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.success) navigate('/dashboard');
    else setError(res.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mb-3">
            <PiggyBank size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="text-sm text-gray-500">Start tracking your finances in seconds</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label className="label">Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <p className="text-xs text-gray-500 mt-1">Min 8 characters, 1 number, 1 special character</p>
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" required className="input" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner size={16} className="text-white" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
