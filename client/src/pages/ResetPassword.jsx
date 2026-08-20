import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { getErrorMessage } from '../services/api';
import Spinner from '../components/Spinner';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
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
    try {
      const res = await authService.resetPassword(token, form.password);
      localStorage.setItem('pfm_token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-1">Set a new password</h1>
        <p className="text-sm text-gray-500 mb-6">Choose a strong new password for your account.</p>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="label">New Password</label>
            <input type="password" required className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" required className="input" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner size={16} className="text-white" /> : 'Reset Password'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/login" className="text-primary-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
