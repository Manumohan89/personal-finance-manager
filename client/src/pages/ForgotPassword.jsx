import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { getErrorMessage } from '../services/api';
import Spinner from '../components/Spinner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-1">Reset your password</h1>
        <p className="text-sm text-gray-500 mb-6">We&apos;ll email you a reset link if the address exists.</p>

        {sent ? (
          <div className="card p-6 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
            If that email is registered, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</div>}
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner size={16} className="text-white" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/login" className="text-primary-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
