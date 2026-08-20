import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const Onboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    currency: user?.currency || 'INR',
    monthlyIncome: user?.monthlyIncome || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await userService.updateProfile({
        currency: form.currency,
        monthlyIncome: Number(form.monthlyIncome || 0),
        onboardingCompleted: true,
      });

      updateUser(response.data.user);
      toast.success('Setup complete');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save onboarding details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-md card p-6">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-wide text-primary-600 font-medium">Welcome</p>
          <h1 className="text-2xl font-semibold mt-2">Let’s set up your finance dashboard</h1>
          <p className="text-sm text-gray-500 mt-2">Choose your default currency and monthly income to personalize the app.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Currency</label>
            <select
              className="input"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Monthly Income</label>
            <input
              type="number"
              min="0"
              step="100"
              className="input"
              value={form.monthlyIncome}
              onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? <Spinner size={16} className="text-white" /> : 'Finish setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
